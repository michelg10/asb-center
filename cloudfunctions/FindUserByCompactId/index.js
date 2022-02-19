// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()
let db = cloud.database();
// 云函数入口函数
exports.main = async (event, context) => {
    // a function that takes in a user's compact ID and returns that user's ID
    // requestedUserCompactId: a string which is the user's compact ID
    // returns an object with a status property: "success" or "error"
    // if the property is "success", then there will also be a user property with the user's (public only) data
    // if the property is "error", then there will also be a reason property specifying the reason for the error

    // request the user's ID

    if (event.requestedUserCompactId === undefined) {
        return {
            status: "error",
            reason: "Undefined requestedUserCompactId property!",
        };
    }

    let result = await db.collection("userData").where({
        compactId: event.requestedUserCompactId,
    }).get();
    
    console.log(result);
    if (result.data.length === 0) {
        return {
            status: "error",
            reason: "User doesn't exist",
        };
    }
    return {
        status: "success",
        user: {
            _id: result.data[0]._id,
            compactId: result.data[0].compactId,
            studentId: result.data[0].studentId,
            userId: result.data[0].userId,
        }
    };
}