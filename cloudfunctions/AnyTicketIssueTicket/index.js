// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

let db = cloud.database();

// 云函数入口函数
exports.main = async (event, context) => {
    const wxContext = cloud.getWXContext()
    if (event.type === "issue"){
      await db.collection('BlackoutTickets').where({
        ticketId: event.ticketId,
      }).update({
        data: {
          issuerId: event.issuerId,
          issuerName: event.issuerName,
          studentName: event.studentName,
          userId: event.userId,
          status: "Issued",
          timeStamp: Date.now(),
        }
    });
    return;
  } else if (event.type === "revoke"){
    await db.collection('BlackoutTickets').where({
      ticketId: event.ticketId,
    }).update({
      data: {
        issuerId: "",
        issuerName: "",
        studentName: "",
        userId: "",
        status: "Available",
        timeStamp: -1,
      }
    });
    return;
  }
  return;
}