// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()
let db = cloud.database();

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()

  let getUserId = await db.collection("userData").where({
    userId: wxContext.OPENID,
  }).get();
  if (getUserId.data.length === 0) {
    return {
      status: "failure",
      reason: "User does not exist"
    };
  }

  let getUserAdmin = await db.collection("admins").where({
    userId: getUserId.data[0]._id,
  }).get();
  if (getUserId.data.length === 0) {
    return {
      status: "failure",
      reason: "User is not authorized",
    };
  }
  let associatedAccountsNumber = await db.collection("userData").where({
    studentId: event.studentId,
  }).get();
  return {
    status: "success",
    result: associatedAccountsNumber.data.length,
    detail: associatedAccountsNumber.data,
  };
}