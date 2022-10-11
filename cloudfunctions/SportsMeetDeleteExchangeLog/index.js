// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
    env: 'asb-center-7gixak2a33f2f3e5',
});

let db=cloud.database();

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  let tasks = [];
  // get the user id and grab the log from the stamp log
  if (event.logGrade !== 9 && event.logGrade !== 10 && event.logGrade !== 11 && event.logGrade !== 12) {
    return {
      status: "failure",
      reason: `logGrade ${event.logGrade} is not 9, 10, 11, or 12`
    };
  }
  tasks.push(db.collection("userData").where({
    'userId': wxContext.OPENID,
  }).get());
  tasks.push(db.collection(`SportsMeetTransactionLog${event.logGrade}`).where({
    _id: event.deleteLogId,
  }).get());
  let res = await Promise.all(tasks);
  if (res[0].data.length === 0) {
    return {
      status: "failure",
      reason: `Issuer is not registered`
    };
  }
  let userId = res[0].data[0]._id;
  if (res[1].data.length === 0) {
    return {
      status: "failure",
      reason: "Log does not exist"
    };
  }
  let logIssuer = res[1].data[0].issuerId;

  // now check for admin status
  let checkAdminStatus = await db.collection("SportsMeetAdmin").where({
    adminId: userId,
  }).get();
  if (checkAdminStatus.data.length === 0) {
    return {
      status: "failure",
      reason: "Not an admin"
    };
  }
  let canDeleteAll = checkAdminStatus.data[0].canDeleteAll;
  if (canDeleteAll || logIssuer === userId) {
    await db.collection(`SportsMeetTransactionLog${event.logGrade}`).where({
      _id: event.deleteLogId,
    }).remove();
    return {
      status: "success"
    };
  } else {
    return {
      status: "failure",
      reason: `User ${userId} is not authorized to delete logs issued by ${logIssuer}`
    };
  }
}