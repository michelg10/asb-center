// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
    env: 'asc-5gg4yr483fce21b4'
});

let db = cloud.database();
// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  // first check for admin status
  let getAccountIdForUser = await(db.collection("userData")).where({
    userId: wxContext.OPENID,
  }).get();
  if (getAccountIdForUser.data.length === 0) {
    return {
      error: "forbidden",
    };
  }
  let callerId = getAccountIdForUser.data[0]._id;
  let sportsMeetAdminCheckResult = await db.collection("SportsMeetAdmin").where({
    adminId: callerId
  }).get();
  let adminCheckResult = await db.collection("admins").where({
    userId: callerId
  }).get();
  if (adminCheckResult.data.length === 0 && sportsMeetAdminCheckResult === 0) {
    return {
      error: "forbidden",
    };
  }

  let checkDatabaseRturn = await db.collection("userData").where({
    _id: event.userId,
  }).get();
  if (checkDatabaseRturn.data.length === 0) {
    return {
      error: "Person does not exist",
      data: {},
    }
  }
  let user = checkDatabaseRturn.data[0];
  if (user.studentId !== undefined) {
    let checkStudentDatabaseRturn = await db.collection("studentData").where({
      _id: user.studentId,
    }).get();
    if (checkStudentDatabaseRturn.data.length>0) {
      user.student = checkStudentDatabaseRturn.data[0];
    }
  }
  return {
    error: "",
    data: user,
  };
}