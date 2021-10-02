// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()
let db = cloud.database();

// 云函数入口函数
exports.main = async (event, context) => {
  // event.studentId -> a studentId the user is trying to set

  const wxContext = cloud.getWXContext()
  let checkIfUserAlreadyHasAccount = await db.collection('userData').where({
    userId: wxContext.OPENID,
  }).get();
  let newAccountId=undefined;
  if (checkIfUserAlreadyHasAccount.data.length === 0) {
    // create a new account
    let res = await db.collection('userData').add({
      data: {
        info: {},
        studentId: undefined,
        userId: wxContext.OPENID
      }
    });
    newAccountId=res._id;
  }
  // now update the user's id if the user does not have a studentId and the studentId is valid
  if (event.studentId !== undefined) {
    let userHasStudentId = false;
    if (checkIfUserAlreadyHasAccount.data.length>0) {
      if (checkIfUserAlreadyHasAccount.data[0].studentId !== undefined) {
        userHasStudentId = true;
      }
    }
    let studentIdValid = false;
    let checkStudentIdValid = await db.collection('studentData').where({
      _id: event.studentId,
    }).get();
    if (checkStudentIdValid.data.length !== 0) {
      studentIdValid = true;
    }
    if (!userHasStudentId && studentIdValid) {
      // update the user ID
      db.collection("userData").where({
        userId: wxContext.OPENID,
      }).update({
        data: {
          studentId: event.studentId
        }
      });
    }
  }
  // now run mandatory join on the user
  let unresolvedInfo = await db.collection("userData").where({
    userId: wxContext.OPENID,
  }).get();
  if (unresolvedInfo.data.length>0) {
    let obj = unresolvedInfo.data[0];
    if (obj.studentId !== undefined) {
      let studentInfo = await db.collection("studentData").where({
        _id: obj.studentId
      }).get();
      if (studentInfo.data.length>0) {
        obj.student=studentInfo.data[0];
      }
    }
    await cloud.callFunction({
      name: "mandatoryJoin",
      data: {
        suppliedUserDataInformation: [obj],
      }
    })
  }
  return {};
}