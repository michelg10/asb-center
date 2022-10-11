// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
    env: 'asb-center-7gixak2a33f2f3e5',
});

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

  let associatedAccountsNumber = await db.collection("userData").where({
    studentId: event.studentId,
  }).get();
  return {
    status: "success",
    result: associatedAccountsNumber.data.length,
    detail: associatedAccountsNumber.data,
  };
}