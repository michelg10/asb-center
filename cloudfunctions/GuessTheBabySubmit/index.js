// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
    env: 'asb-center-7gixak2a33f2f3e5',
});

// 云函数入口函数
exports.main = async (event, context) => {
    const wxContext = cloud.getWXContext();

    let db = cloud.database();
    let closingTime = await db.collection("BabyTeachersInfo").doc("limitTime").get();
    const currentTime = Date.now()/1000.0;
    if (currentTime>closingTime.data.value) {
        return {};
    }
    let getUserId = await db.collection("userData").where({
        userId: wxContext.OPENID,
    }).get();
    if (getUserId.data.length>1 || getUserId.data.length === 0) {
        console.log("userId "+wxContext.OPENID+" has unexpected "+getUserId.length+" accounts");
        return;
    }

    let userId = getUserId.data[0]._id;
    let newGuessTheBabyData = {
        choices: event.userResponses,
        correspondingOpenId: wxContext.OPENID,
        userId: userId
    }

    let getExistingId = await db.collection("BabyTeachersData").get({
        userId: userId,
    });
    if (getExistingId.data.length === 0) {
        db.collection("BabyTeachersData").add({
            data: newGuessTheBabyData
        });
    } else {
        const existingId = getExistingId.data[0]._id;
        db.collection("BabyTeachersData").doc(existingId).set({
            data: newGuessTheBabyData,
        });
    }

    return { }
}