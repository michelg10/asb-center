// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
    env: 'asc-5gg4yr483fce21b4',
});

let db = cloud.database();

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()

  let pointValue = event.pointValue;
  if (Number.isNaN(pointValue)) {
    pointValue = 0;
  }
  let stampValue = event.stampValue;
  if (Number.isNaN(stampValue)) {
    stampValue = 0;
  }

  // stage 1
  let tasks = [];
  tasks.push(db.collection("userData").where({
    userId: wxContext.OPENID,
  }).get());

  // fetch user student ID
  tasks.push(db.collection("userData").where({
    _id: event.userId,
  }).get());

  let callerId = "";
  let studentId = "";
  let result = await Promise.all(tasks);
  let grabCallerId = result[0];
  if (grabCallerId.data.length === 0) {
    return {
      status: "failure",
      reason: "Add Activity Log called by unknown user!"
    };
  }
  callerId = grabCallerId.data[0]._id;

  let grabUserStudentId = result[1];
  if (grabUserStudentId.data.length === 0) {
    return {
      status: "failure",
      reason: "User does not exist!"
    };
  }

  studentId = grabUserStudentId.data[0].studentId;

  tasks = [];

  // stage 2
  // check for admin privledges
  tasks.push(db.collection("SportsMeetAdmin").where({
    adminId: callerId,
  }).get());
  // fetch event data
  tasks.push(cloud.callFunction({
    name: "fetchAllCollections",
    data: {
      collectionName: "SportsMeetEvents"
    }
  }));
  // fetch user details
  tasks.push(db.collection("studentData").where({
    _id: studentId,
  }).get());
  result = await Promise.all(tasks);

  let rankLeaderboard = undefined;
  let allowStamps = undefined;
  let eventName = undefined;
  let adminName="";
  if (result[0].data.length === 0) {
    return {
      status: "failure",
      reason: "No admin privileges!"
    };
  }
  adminName=result[0].data[0].name;
  eventData=result[1].result.data;
  for (let i=0;i<eventData.length;i++) {
    if (eventData[i].id===event.eventId) {
      rankLeaderboard = eventData[i].rankLeaderboard;
      allowStamps = eventData[i].allowStamps;
      eventName = eventData[i].name;
    }
  }
  if (rankLeaderboard === undefined) {
    return {
      status: "failure",
      reason: "Event does not exist in event database!"
    };
  }
  if (result[2].data.length === 0) {
    return {
      status: "failure",
      reason: "Student does not exist in student database!"
    };
  }
  let studentNickname = result[2].data[0].uniqueNickname;
  let studentGrade = result[2].data[0].grade;
  let studentClass = result[2].data[0].class;
  tasks=[];

  // stage 3
  // insert a new log
  tasks.push(db.collection(`SportsMeetStampLog${studentGrade}`).add({
    data: {
      eventId: event.eventId,
      eventName: eventName,
      issuerId: callerId,
      issuerName: adminName,
      userId: event.userId,
      stampNumber: (allowStamps ? stampValue : undefined),
      pointNumber: (rankLeaderboard ? pointValue : undefined),
      studentNickname: studentNickname,
      timeStamp: Date.now(),
    }
  }));
  if (rankLeaderboard) {
    // fetch the computed leaderboard
    tasks.push(db.collection(`SportsMeetLeaderboardProcessed${studentGrade}`).where({
      studentId: event.userId,
    }).get());
  }
  if (allowStamps) {
    // add it into the computed homeroom
    tasks.push(db.collection(`SportsMeetHomeroomProcessed${studentGrade}`).where({
      class: studentClass
    }).update({
      data: {
        stampPoints: db.command.inc(stampValue),
      }
    }));
  }
  let currentComputedLeaderboardEntry;
  result = await Promise.all(tasks);
  if (rankLeaderboard) {
    if (result[1].data.length === 0) {
      return {
        status: "failure",
        reason: "User has missing computed database entry!"
      };
    }
    currentComputedLeaderboardEntry=result[1].data[0];
  }
  tasks=[];

  // stage 4
  if (rankLeaderboard) {
    // update the computed leaderboard
    let currentLeaderboardScore = currentComputedLeaderboardEntry[`studentPointScore${event.eventId}`];
    if (pointValue > currentLeaderboardScore) {
      let setDataObject = {};
      setDataObject[`studentPointScore${event.eventId}`]=pointValue;
      await db.collection(`SportsMeetLeaderboardProcessed${studentGrade}`).doc(currentComputedLeaderboardEntry._id).update({
        data: setDataObject,
      });
    }
  }
  await Promise.all(tasks);

  return {
    status: "success",
  };
}