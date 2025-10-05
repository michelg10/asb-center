// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: 'asc-5gg4yr483fce21b4'
})

let db = cloud.database();

// 云函数入口函数
exports.main = async (event, context) => {
    const wxContext = cloud.getWXContext()
    if (event.type === "issue"){
      await db.collection('TedXTickets').where({
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
    await db.collection('TedXTickets').where({
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
  } else if (event.type === "issuePreview"){
    await db.collection('TedXTickets').add({
      data: {
        ticketId: "ADMIN".concat(Math.floor(Math.random() * (99999999 - 10000000 + 1) + 10000000).toString()),
        entry: true,
        status: "Issued",
        issuerId: event.issuerId,
        issuerName: event.issuerName,
        studentName: event.studentName,
        userId: event.userId,
        timeStamp: Date.now(),
      }
    });
    return;
  }
  return;
}