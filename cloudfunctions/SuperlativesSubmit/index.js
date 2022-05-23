// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()

// 云函数入口函数
exports.main = async (event, context) => {
    const wxContext = cloud.getWXContext()

    let db = cloud.database();
    let getUserId = await db.collection("userData").where({
        userId: wxContext.OPENID,
    }).get();
    if (getUserId.data.length>1 || getUserId.data.length === 0) {
        console.log("userId "+wxContext.OPENID+" has unexpected "+getUserId.length+" accounts");
        return;
    }

    let userId = getUserId.data[0]._id;
    let newSuperlativeData = {
        choices: event.userResponses,
        correspondingOpenId: wxContext.OPENID,
        userId: userId
    }

    let getExistingId = await db.collection("SuperlativesData").get({
        userId: userId,
    });
    if (getExistingId.data.length === 0) {
        db.collection("SuperlativesData").add({
            data: newSuperlativeData
        });
    } else {
        const existingId = getExistingId.data[0]._id;
        db.collection("SuperlativesData").doc(existingId).set({
            data: newSuperlativeData,
        });
    }

    return { }
}