// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init();
let db=cloud.database();

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  let tasks = [];
  // get the user id and grab the log from the stamp log
  if (event.logGrade !== 9 && event.logGrade !== 10 && event.logGrade !== 11 && event.logGrade !== 12) {
    return {
      status: "failure",
      reason: `logGrade ${event.logGrade} is not 9, 10, 11, or 12`
    };
  }
  tasks.push(db.collection("userData").where({
    'userId': wxContext.OPENID,
  }).get());
  tasks.push(db.collection(`SportsMeet2021StampLog${event.logGrade}`).where({
    _id: event.deleteLogId,
  }).get());
  let res = await Promise.all(tasks);
  if (res[0].data.length === 0) {
    return {
      status: "failure",
      reason: `Issuer is not registered`
    };
  }
  let issuerUserId = res[0].data[0]._id;
  if (res[1].data.length === 0) {
    return {
      status: "failure",
      reason: "Log does not exist"
    };
  }
  let logIssuer = res[1].data[0].issuerId;
  let logLeaderboardNumber = res[1].data[0].pointNumber;
  let logStampNumber = res[1].data[0].stampNumber;
  let userId = res[1].data[0].userId;
  let eventId = res[1].data[0].eventId;

  // now check for admin status
  tasks=[];
  tasks.push(db.collection("SportsMeet2021Admin").where({
    adminId: issuerUserId,
  }).get());

  // if there is a leaderboard score, fetch all the stamp logs associated with this event and this user in order to recompute the leaderboard
  if (logLeaderboardNumber !== undefined) {
    tasks.push(cloud.callFunction({
      name: "fetchAllCollections",
      data: {
        collectionName: `SportsMeet2021StampLog${event.logGrade}`,
        whereClause: {
          userId: userId,
          eventId: eventId
        }
      }
    }));
  }

  // if it has affected the homeroom score, fetch the studentId of the student
  if (logStampNumber !== undefined) {
    tasks.push(db.collection("userData").where({
      _id: userId,
    }).get());
  }

  res = await Promise.all(tasks);
  if (res[0].data.length === 0) {
    return {
      status: "failure",
      reason: "Not an admin"
    };
  }

  let studentId="";
  let studentIdGetResIndex = (logLeaderboardNumber === undefined ? 1 : 2);
  if (logStampNumber !== undefined) {
    if (res[studentIdGetResIndex].data.length === 0) {
      return {
        status: "failure",
        reason: `Could not find user ${userId}'s account`
      };
    }
    studentId = res[studentIdGetResIndex].data[0].studentId;
  }

  let canDeleteAll = res[0].data[0].canDeleteAll;
  if (canDeleteAll || logIssuer === issuerUserId) {
    // fetch the user's homeroom if modifying the computed homeroom is needed
    let studentHomeroomClass = 0;
    if (logStampNumber !== undefined) {
      let homeroomGet = await db.collection("studentData").where({
        _id: studentId
      }).get();
      if (homeroomGet.data.length === 0) {
        return {
          status: "failure",
          reason: `Could not find user ${userId}'s student entry with ID ${studentId}`
        };
      }
      studentHomeroomClass = homeroomGet.data[0].class;
    }
    tasks = [];
    // modify computed homeroom
    if (logStampNumber !== undefined) {
      tasks.push(db.collection(`SportsMeet2021HomeroomProcessed${event.logGrade}`).where({
        class: studentHomeroomClass,
      }).update({
        data: {
          stampPoints: db.command.inc(-logStampNumber),
        }
      }));
    }
    // recompute leaderboard maximum if needed
    if (logLeaderboardNumber !== undefined) {
      let newLeaderboardMaximum = 0;
      for (let i=0;i<res[1].result.data.length;i++) {
        if (res[1].result.data[i]._id !== event.deleteLogId) {
          newLeaderboardMaximum = Math.max(newLeaderboardMaximum, res[1].result.data[i].pointNumber);
        }
      }
      let updateDataObj = {};
      updateDataObj[`studentPointScore${eventId}`] = newLeaderboardMaximum;
      tasks.push(db.collection(`SportsMeet2021LeaderboardProcessed${event.logGrade}`).where({
        studentId: userId,
      }).update({
        data: updateDataObj,
      }));
    }
    // delete the log
    tasks.push(db.collection(`SportsMeet2021StampLog${event.logGrade}`).where({
      _id: event.deleteLogId,
    }).remove());
    await Promise.all(tasks);
    return {
      status: "success"
    };
  } else {
    return {
      status: "failure",
      reason: `User ${issuerUserId} is not authorized to delete logs issued by ${logIssuer}`
    };
  }
}