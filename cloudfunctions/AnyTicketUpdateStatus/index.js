// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

let db = cloud.database();

// 云函数入口函数
exports.main = async (event, context) => {
    const wxContext = cloud.getWXContext()
    if (event.type === "entry"){
      await db.collection('PromTickets').where({
        ticketId: event.ticketId,
      }).update({
        data: {
          entry: event.updateStatus,
          entryTimeStamp: Date.now()
        }
      });
      return;
    }
    else if (event.type === "exit"){
      await db.collection('PromTickets').where({
        ticketId: event.ticketId,
      }).update({
        data: {
          entry: event.updateStatus,
          entryTimeStamp: Date.now()
        }
      });
      return;
    }
    else if (event.type === "main"){
      await db.collection('PromTickets').where({
        ticketId: event.ticketId,
      }).update({
        data: {
          status: event.updateStatus,
          timeStamp: Date.now()
        }
      });
      return;
    }
    else if (event.type === "lost"){
      await db.collection('PromTickets').where({
        ticketId: event.ticketId,
      }).update({
        data: {
          status: event.updateStatus,
          userId: event.newUserId,
          timeStamp: Date.now()
        }
      });
      return;
    }
    else if (event.type === "updateCount"){
      const countIssued = await db.collection('PromTickets').where({status: 'Issued'}).count();
      const countEntry = await db.collection('PromTickets').where({entry: true}).count();
      return {issued: countIssued.total, entry: countEntry.total};
    }
    return;
}