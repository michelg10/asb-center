// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
    env: 'asc-5gg4yr483fce21b4'
});

let db = cloud.database();
// 云函数入口函数
exports.main = async (event, context) => {
    // admin-restricted function that takes in a user ID and then outputs the order
    // input: queryUserId: the user ID of the user being queried, orderEvent: the current event
    // returns: object containing status that's either "success" or "failure"
    // if the status is "success": has property data containing the order
    // if the status is "error": has property reason containing why
    const wxContext = cloud.getWXContext()
    let callingUserOpenID = wxContext.OPENID;

    if (event.orderEvent !== "ChristmasSale2022") {
        return {
            status: "error",
            reason: "Order event not open"
        }
    }
    let orderEvent = event.orderEvent;

    // first get the calling user's ID
    let getCallingUserInfo = await db.collection("userData").where({
        userId: callingUserOpenID,
    }).get();
    if (getCallingUserInfo.data.length === 0) {
        return {
            status: "error",
            reason: "User with Open ID not found",
        };
    }
    let callingUserId = getCallingUserInfo.data[0]._id;

    // then request both the calling user's admin status and the queried user's order
    let requests = [];
    requests.push(db.collection("admins").where({
        userId: callingUserId,
    }).get());
    requests.push(db.collection(orderEvent+"Orders").where({
        orderUser: event.queryUserId,
    }).get());
    let results = await Promise.all(requests);
    
    let checkUserAdminResults = results[0];
    if (checkUserAdminResults.data.length === 0) {
        return {
            status: "error",
            reason: "Calling user is not admin",
        };
    }

    let getRequestedOrderResult = results[1];
    if (getRequestedOrderResult.data.length === 0) {
        return {
            status: "success",
            data: {},
        };
    }
    return {
        status: "success",
        data: getRequestedOrderResult.data[0],
    };
}