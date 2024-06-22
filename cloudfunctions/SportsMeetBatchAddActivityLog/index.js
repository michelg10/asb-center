// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
    env: 'asc-5gg4yr483fce21b4',
});

let db = cloud.database();

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()

  // stage 1
  let tasks = [];
  tasks.push(db.collection("userData").where({
    userId: wxContext.OPENID,
  }).get());

  // fetch user database
  tasks.push(cloud.callFunction({
    name: "fetchAllCollections",
    data: {
      collectionName: "userData"
    }
  }));

  // fetch student database
  tasks.push(cloud.callFunction({
    name: "fetchAllCollections",
    data: {
      collectionName: "studentData"
    }
  }));

  let callerId = "";
  let result = await Promise.all(tasks);
  let grabCallerId = result[0];
  if (grabCallerId.data.length === 0) {
    return {
      status: "failure",
      reason: "Add Activity Log called by unknown user!"
    };
  }
  callerId = grabCallerId.data[0]._id;
  // build studentId -> grade cache and studentId -> unique nickname cache
  let studentIdToGradeCache = new Map();
  let studentIdToNicknameCache = new Map();
  for (let i=0;i<result[2].result.data.length;i++) {
    studentIdToGradeCache.set(result[2].result.data[i]._id, result[2].result.data[i].grade);
    studentIdToNicknameCache.set(result[2].result.data[i]._id, result[2].result.data[i].uniqueNickname);
  }

  // build user _id -> grade cache and user _id -> unqiue nickname cache
  let userIdToGradeCache = new Map();
  let userIdToNicknameCache = new Map();
  for (let i=0;i<result[1].result.data.length;i++) {
    userIdToGradeCache.set(result[1].result.data[i]._id, studentIdToGradeCache.get(result[1].result.data[i].studentId));
    userIdToNicknameCache.set(result[1].result.data[i]._id, studentIdToNicknameCache.get(result[1].result.data[i].studentId));
  }

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
  result = await Promise.all(tasks);

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
      eventName = eventData[i].name;
    }
  }
  if (eventName === undefined) {
    return {
      status: "failure",
      reason: "Event does not exist in event database!"
    };
  }
  tasks=[];

  // stage 3
  // insert new logs
  for (let i=0;i<event.userIds.length;i++) {
    console.log("Adding to ",`SportsMeetStampLog${userIdToGradeCache.get(event.userIds[i])}`);
    tasks.push(db.collection(`SportsMeetStampLog${userIdToGradeCache.get(event.userIds[i])}`).add({
      data: {
        eventId: event.eventId,
        eventName: eventName,
        issuerId: callerId,
        issuerName: adminName,
        userId: event.userIds[i],
        studentNickname: userIdToNicknameCache.get(event.userIds[i]), 
        timeStamp: Date.now(),
      }
    }));
  }
  await Promise.all(tasks);

  return {
    status: "success",
  };
}