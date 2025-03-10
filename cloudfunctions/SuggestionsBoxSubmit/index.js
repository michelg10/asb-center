// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
    env: 'asc-5gg4yr483fce21b4',
});

// 云函数入口函数
exports.main = async (event, context) => {
    let db = cloud.database();
    db.collection("SuggestionsBox").add({
        data: {
            timestamp: Date.now(),
            userData: event.userData,
            name: event.name,
            contactInformation: event.contactInformation,
            grade: event.grade,
            suggestion: event.suggestion,
            resolved: false
        }
    });
}