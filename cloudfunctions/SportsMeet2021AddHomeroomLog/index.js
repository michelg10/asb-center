// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()
let db = cloud.database();

// 云函数入口函数
exports.main = async (event, context) => {
  let grades = [9,10,11,12];
  if (!grades.includes(event.grade)) {
    return {
      status: "failure",
      reason: "No such grade"
    };
  }
  let pointValue = event.pointValue;
  if (Number.isNaN(pointValue)) {
    pointValue = 0;
  }
  const wxContext = cloud.getWXContext()
  let tasks = [];
  // get the user ID
  tasks.push(db.collection("userData").where({
    userId: wxContext.OPENID,
  }).get());
  // get the class
  tasks.push(db.collection(`SportsMeet2021HomeroomProcessed${event.grade}`).where({
    class: event.class,
  }).get());
  // verify the eventId
  tasks.push(db.collection("SportsMeet2021TeamEvents").where({
    id: event.eventId,
  }).get());
  let res = await Promise.all(tasks);
  if (res[0].data.length === 0) {
    return {
      status: "failure",
      reason: "User does not exist!"
    };
  }
  let userId = res[0].data[0]._id;

  if (res[1].data.length === 0) {
    return {
      status: "failure",
      reason: "Class does not exist!"
    };
  }
  let classId = res[1].data[0]._id;

  if (res[2].data.length === 0) {
    return {
      status: "failure",
      reason: "Event does not exist!"
    };
  }
  let eventName = res[2].data[0].name;

  res = await db.collection("SportsMeet2021Admin").where({
    adminId: userId,
  }).get();
  if (res.data.length === 0) {
    return {
      status: "failure",
      reason: "No admin privileges!"
    };
  }
  let adminName = res.data[0].name;

  // update the computed homeroom log
  tasks=[];
  tasks.push(db.collection(`SportsMeet2021HomeroomProcessed${event.grade}`).doc(classId).update({
    data: {
      classPoints: db.command.inc(pointValue),
    }
  }));
  tasks.push(db.collection(`SportsMeet2021HomeroomLog`).add({
    data: {
      eventId: event.eventId,
      eventName: eventName,
      issuerId: userId,
      issuerName: adminName,
      pointValue: pointValue,
      grade: event.grade,
      class: event.class,
    }
  }));
  await Promise.all(tasks);
  return {
    status: "success",
  };
}