// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()
let db = cloud.database();

// 云函数入口函数
exports.main = async (event, context) => {
    const wxContext = cloud.getWXContext()
    if (event.orderEvent !== "WhiteV2022") {
        return {
            error: "Order event doesn't exist",
            data: {},
        }
    }
    let getAccountIdForUser = await(db.collection("userData")).where({
        userId: wxContext.OPENID,
    }).get();
    if (getAccountIdForUser.data.length===0) {
        return {
            error: "User account does not exist",
            data: {}
        };
    }
    let userId = getAccountIdForUser.data[0]._id
    let getUserOrder = await(db.collection(event.orderEvent+"Orders")).where({
        OrderUser: userId
    }).get();
    if (getUserOrder.data.length === 0) {
        let newOrder = {
            OrderUser: userId,
            OrderFrom: null,
            SubOrdersList: [],
            OrderStatus: "unsub",
        }
        db.collection(event.orderEvent+"Orders").add({data: newOrder})
        return {
            error: "",
            data: newOrder,
        };
    } else {
        return {
            error: "",
            data: getUserOrder.data[0],
        };
    }
}