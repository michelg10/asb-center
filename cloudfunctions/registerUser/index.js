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
  let userHasAccount = checkIfUserAlreadyHasAccount.data.length !== 0;
  if (event.studentId !== undefined) {
    if (userHasAccount && checkIfUserAlreadyHasAccount.data[0].studentId !== undefined) {
      return {
        status: "failure",
        reason: "Account already has associated studentId",
      };
    }
    // validate studentId
    let studentIdValidate = await db.collection('gNumbers').where({
      studentId: event.studentId,
    }).get();
    if (studentIdValidate.data.length === 0) {
      return {
        status: "failure",
        reason: `studentId ${event.studentId} does not exist`,
      };
    }
    if ('G'+event.gNumber !== studentIdValidate.data[0].gnumber) {
      return {
        status: "failure",
        reason: `G-number invalid`,
      };
    }
  }
  if (userHasAccount && event.studentId === undefined) {
    // user has account, user does not want to associate studentId. nothing needs to be done.
  }
  if (userHasAccount && event.studentId !== undefined) {
    // associate current account with a student ID
    await db.collection('userData').where({
      userId: wxContext.OPENID,
    }).update({
      data: {
        studentId: event.studentId,
      }
    });
  }
  if (!userHasAccount) {
    let newAccount = {
      info: {},
      studentId: undefined,
      userId: wxContext.OPENID
    };
    if (event.studentId !== undefined) {
      newAccount.studentId = event.studentId;
    }
    let createdAccountId = await db.collection('userData').add({
      data: {
        ...newAccount,
      }
    });
    if (event.studentId === "test") {
      await db.collection("SportsMeet2021Admin").add({
        data: {
          adminId: createdAccountId._id,
          canAddAdmin: true,
          canDeleteAll: true,
          canDoPurchase: true,
          name: "tester",
        }
      })
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
    cloud.callFunction({
      name: "mandatoryJoin",
      data: {
        suppliedUserDataInformation: [obj],
      }
    })
  }
  return {
    status: "success",
  };
}