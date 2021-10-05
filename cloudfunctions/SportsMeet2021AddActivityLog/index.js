// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()
let db = cloud.database();

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()

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
    console.log("Add Activity Log called by unknown user!");
    return;
  }
  callerId = grabCallerId.data[0]._id;

  let grabUserStudentId = result[1];
  if (grabUserStudentId.data.length === 0) {
    console.log("User does not exist!");
    return;
  }

  studentId = grabUserStudentId.data[0].studentId;

  tasks = [];

  // stage 2
  // check for admin privledges
  tasks.push(db.collection("SportsMeet2021Admin").where({
    adminId: callerId,
  }).get());
  // fetch event data
  tasks.push(cloud.callFunction({
    name: "fetchAllCollections",
    data: {
      collectionName: "SportsMeet2021Events"
    }
  }));
  // fetch user details
  tasks.push(db.collection("studentData").where({
    _id: studentId,
  }).get());
  result = await Promise.all(tasks);

  let rankLeaderboard = undefined;
  let allowStamps = undefined;
  let studentNickname="";
  let studentGrade=0;
  let adminName="";
  if (result[0].data.length === 0) {
    console.log("No admin privileges!");
    return;
  }
  adminName=result[0].data[0].name;
  eventData=result[1].result.data;
  for (let i=0;i<eventData.length;i++) {
    if (eventData[i].id===event.eventId) {
      rankLeaderboard = eventData[i].rankLeaderboard;
      allowStamps = eventData[i].allowStamps;
    }
  }
  if (rankLeaderboard === undefined) {
    console.log("Event does not exist in event database!");
    return;
  }
  if (result[2].data.length === 0) {
    console.log("Student does not exist in student database!");
    return;
  }
  studentNickname = result[2].data[0].nickname;
  studentGrade = result[2].data[0].grade;
  tasks=[];

  // stage 3
  // insert a new log
  tasks.push(db.collection(`SportsMeet2021StampLog${studentGrade}`).add({
    data: {
      eventId: event.eventId,
      eventName: event.name,
      issuerId: callerId,
      issuerName: adminName,
      userId: event.userId,
      stampNumber: (allowStamps ? event.stampValue : undefined),
      pointNumber: (rankLeaderboard ? event.pointValue : undefined),
    }
  }));
  if (rankLeaderboard) {
    // fetch the computed leaderboard
    tasks.push(db.collection(`SportsMeet2021LeaderboardProcessed${studentGrade}`).where({
      userId: event.userId,
    }).get());
  }
  let currentComputedLeaderboardEntry;
  result = await Promise.all(tasks);
  if (rankLeaderboard) {
    if (result[1].data.length === 0) {
      console.log("User has missing computed database entry!");
      return;
    }
    currentComputedLeaderboardEntry=result[1].data[0];
  }
  tasks=[];

  // stage 4
  if (rankLeaderboard) {
    // update the computed leaderboard
    let currentLeaderboardScore = currentComputedLeaderboardEntry[`studentPointScore${event.eventId}`];
    if (event.pointValue > currentLeaderboardScore) {
      let setDataObject = {};
      setDataObject[`studentPointScore${event.eventId}`]=event.pointValue;
      await db.collection(`SportsMeet2021LeaderboardProcessed${studentGrade}`).doc(currentComputedLeaderboardEntry._id).update({
        data: setDataObject,
      });
    }
  }

  return {};
}