// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()

// 云函数入口函数
exports.main = async (event, context) => {
    let db = cloud.database();
    db.collection("SuggestionsBox").add({
        data: {
            timestamp: Date.now(),
            name: event.name,
            contactInformation: event.contactInformation,
            suggestion: event.suggestion,
        }
    });
}