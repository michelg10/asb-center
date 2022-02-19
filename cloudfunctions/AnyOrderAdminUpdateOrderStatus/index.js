// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()
let db = cloud.database();
// 云函数入口函数
exports.main = async (event, context) => {
    // admin-restricted function that takes in an order ID and then the status to change that order to.
    // inputs
    // orderEvent, specifying the event
    // orderId, specifying the ID of the order. this is a string
    // newStatus, specifying the new status of the order. this is an enum that can be sub (submitted) or acc (accepted)
    // Returns object with status property.
    // if status is error, then there will be a reason property declaring why.
    // if status is success, then there will be a newStatus property declaring the newly set status 
    // (status may also be unsub if the order is unsubmitted).
    // Success just tells the caller that the new status is newStatus.
    // there will also be a orderSnapshot if the new status is sub or acc, reporting the order as is when it was updated


    if (event.orderEvent !== "WhiteV2022") {
        return {
            status: "error",
            reason: "Order event not open"
        }
    }
    if (event.newStatus !== "sub" && event.newStatus !== "acc") {
        return {
            status: "error",
            reason: "New status invalid",
        };
    }
    let orderEvent = event.orderEvent;
    
    // simultaneously get the calling user's ID (to verify that the calling user is an admin) and get the order
    const wxContext = cloud.getWXContext()
    let requests = [];
    requests.push(db.collection("userData").where({
        userId: wxContext.OPENID,
    }).get());
    requests.push(db.collection(orderEvent+"Orders").where({
        _id: event.orderId,
    }).get());
    let results = await Promise.all(requests);    

    // if the order doesn't exist, then report an error
    let fetchOrderResult = results[1].data;
    if (fetchOrderResult.length === 0) {
        return {
            status: "error",
            reason: "No order with requested ID",
        };
    }
    let fetchedOrder = fetchOrderResult[0];

    // now request admin information to see if the calling user is actually an admin
    requests=[];
    let callerInfo = results[0].data;
    if (callerInfo.length === 0) {
        return {
            status: "error",
            reason: "Calling user doesn't exist"
        }
    }
    let checkIfCallerIsAdmin = await db.collection("admins").where({
        userId: callerInfo[0]._id,
    }).get();

    if (checkIfCallerIsAdmin.data.length === 0) {
        return {
            status: "error",
            reason: "Calling user isn't an admin"
        }
    }

    let callingUserAdminId = checkIfCallerIsAdmin.data[0]._id;
    // check if the order status is update-able. If its unsub, then report an error. If its the same as the newStatus, then act as if something's been done

    requests=[];
    if (fetchedOrder.orderStatus === "unsub") {
        return {
            status: "success",
            newStatus: "unsub"
        }
    }
    let desiredNewStatus = event.newStatus;
    if (fetchedOrder.orderStatus === desiredNewStatus) {
        return {
            status: "success",
            newStatus: desiredNewStatus,
            orderSnapshot: fetchedOrder,
        };
    }

    // update the status
    let newOrder = fetchedOrder;
    newOrder.orderStatus = desiredNewStatus;
    delete newOrder._id;
    await db.collection(event.orderEvent+"Orders").doc(event.orderId).set({
        data: newOrder,
    });
    return {
        status: "success",
        newStatus: desiredNewStatus,
        orderSnapshot: fetchedOrder,
    };
}