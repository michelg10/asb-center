// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

// 云函数入口函数
exports.main = async (event, context) => {
    const wxContext = cloud.getWXContext();
    let db = cloud.database();
    if (event.type === "anyEventIdea"){
      await db.collection('PromIdeas').where({
        _id: event.logId,
      }).update({
        data: {
          read: true
        }
      });
    } else {
      await db.collection('SuggestionsBox').where({
        _id: event.logId,
      }).update({
        data: {
          resolved: true
        }
      });
      return;
    }
}