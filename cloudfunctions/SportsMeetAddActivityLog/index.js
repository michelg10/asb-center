// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
    env: 'asc-5gg4yr483fce21b4',
});

let db = cloud.database();

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()

  let pointValue = event.pointValue;
  if (Number.isNaN(pointValue)) {
    pointValue = 0;
  }
  let stampValue = event.stampValue;
  if (Number.isNaN(stampValue)) {
    stampValue = 0;
  }

  // stage 1
  let tasks = [];
  tasks.push(db.collection("userData").where({
    userId: wxContext.OPENID,
  }).get());

  // fetch user student ID
  tasks.push(db.collection("userData").where({
    _id: event.userId,
  }).get());

  let callerId = "";
  let studentId = "";
  let result = await Promise.all(tasks);
  let grabCallerId = result[0];
  if (grabCallerId.data.length === 0) {
    return {
      status: "failure",
      reason: "Add Activity Log called by unknown user!"
    };
  }
  callerId = grabCallerId.data[0]._id;

  let grabUserStudentId = result[1];
  if (grabUserStudentId.data.length === 0) {
    return {
      status: "failure",
      reason: "User does not exist!"
    };
  }

  studentId = grabUserStudentId.data[0].studentId;
  userOpenId = grabUserStudentId.data[0].userId;

  tasks = [];

  // stage 2
  // check for admin privledges
  tasks.push(db.collection("SportsMeetAdmin").where({
    adminId: callerId,
  }).get());
  // fetch event data
  tasks.push(cloud.callFunction({
    name: "fetchAllCollections",
    data: {
      collectionName: "SportsMeetEvents"
    }
  }));
  // fetch user details
  tasks.push(db.collection("studentData").where({
    _id: studentId,
  }).get());
  // fetch config data
  tasks.push(cloud.callFunction({
    name: "fetchAllCollections",
    data: {
      collectionName: "SportsMeetConfig"
    }
  }));
  result = await Promise.all(tasks);

  let rankLeaderboard = undefined;
  let allowStamps = undefined;
  let eventName = undefined;
  let adminName = "";
  let adminChance = 0;
  if (result[0].data.length === 0) {
    return {
      status: "failure",
      reason: "No admin privileges!"
    };
  }
  adminName = result[0].data[0].name;
  adminChance = result[0].data[0].chance;
  eventData = result[1].result.data;
  for (let i = 0; i < eventData.length; i++) {
    if (eventData[i].id === event.eventId) {
      rankLeaderboard = eventData[i].rankLeaderboard;
      allowStamps = eventData[i].allowStamps;
      eventName = eventData[i].name;
      eventStampForExperience = eventData[i].stampForExperience;
      startTime = eventData[i].startTime;
      endTime = eventData[i].endTime;
    }
  }
  if (rankLeaderboard === undefined) {
    return {
      status: "failure",
      reason: "Event does not exist in event database!"
    };
  }
  if (result[2].data.length === 0) {
    return {
      status: "failure",
      reason: "Student does not exist in student database!"
    };
  }
  let studentNickname = result[2].data[0].uniqueNickname;
  let studentGrade = result[2].data[0].grade;
  let studentClass = result[2].data[0].class;
  // anticheat algorithm
  let configData = result[3].result.data;
  let lastLogData = await db.collection(`SportsMeetStampLog${studentGrade}`).where({
    userId: event.userId
  }).orderBy('timeStamp', 'desc').limit(1).get();
  let minStampInterval = configData.find(item => item.key === "minStampInterval").value;
  let immunity = configData.find(item => item.key === "immunity").value;
  let isImmune = immunity.includes(callerId);
  let maxSingleStamp = configData.find(item => item.key === "maxSingleStamp").value;
  const date = new Date(Date.now());
  const options = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    // second: '2-digit',
    hour12: false,
    timeZone: 'Asia/Shanghai'
  };
  let dateDisplay = date.toLocaleString('zh-CN', options);
  tasks=[];

  if (!isImmune) {
    let suspicious = false;
    let susReason = "";
    // check max single stamp log
    if (allowStamps && stampValue > maxSingleStamp){
      suspicious = true;
      susReason = "操作积分大于单次积分上限";
    }
    // check event start/end time
    let currentTime = Date.now() / 1000;
    if (!(startTime <= currentTime && currentTime <= endTime)) {
      suspicious = true;
      susReason = "操作不在活动时间范围内";
    }
    // check if last log is within min interval
    if (lastLogData.data.length !== 0 && (currentTime - lastLogData.data[0].timeStamp) < minStampInterval) {
      suspicious = true;
      susReason = "操作时间间隔小于最少间隔";
    }
    if (suspicious) {
      await db.collection("SportsMeetStampLogSuspicious").add({
        data: {
          eventId: event.eventId,
          eventName: eventName,
          issuerId: callerId,
          issuerName: adminName,
          userId: event.userId,
          stampNumber: (allowStamps ? stampValue : undefined),
          pointNumber: (rankLeaderboard ? pointValue : undefined),
          studentNickname: studentNickname,
          timeStamp: Date.now(),
          reason: susReason
        }
      });
      if (adminChance <= 0) {
        // suspend admin
        await db.collection('SportsMeetAdmin').where({
          adminId: callerId,
        }).update({
          data: {
            suspended: true
          }
        });
        let getTargetOpenId = await db.collection("userData").where({
          _id: callerId,
        }).get();
        // send service message
        try {
          await cloud.openapi.subscribeMessage.send({
            "touser": getTargetOpenId.data[0].userId,
            "page": 'pages/MainMenu/MainMenu',
            "lang": 'en_US',
            "data": {
              "time5": {
                "value": dateDisplay
              },
              "thing1": {
                "value": "系统已检测到可疑的活动积分发放记录。"
              },
              "thing3": {
                "value": "请联系总系统管理员。"
              },
              "thing4": {
                "value": "您的运动嘉年华管理员权限已被撤销。"
              }
            },
            "templateId": 'tlnosM16T4q1OGOtVnBjEjD4vthnnKBYMlm-ujFIG5I',
            "miniprogramState": 'formal'
          })
        } catch (err) {
          console.log(err)
        }
      } else {
        // decrement chance
        await db.collection('SportsMeetAdmin').where({
          adminId: callerId,
        }).update({
          data: {
            chance: adminChance - 1
          }
        });
      }
      // send service message to main admin
      try {
        await cloud.openapi.subscribeMessage.send({
          "touser": 'oplGm4pws70GARfeoQu8bSs6TXDE',
          "page": 'pages/MainMenu/MainMenu',
          "lang": 'en_US',
          "data": {
            "time19": {
              "value": dateDisplay
            },
            "name1": {
              "value": adminName
            },
            "thing7": {
              "value": allowStamps ? `${eventName} +${String(stampValue)}` : `${eventName} +${String(eventStampForExperience)}`
            },
            "thing5": {
              "value": susReason
            },
            "thing6": {
              "value": "事件等待总管理员审核"
            }
          },
          "templateId": 'DdJ1P80P0pOf8sAcE_aZbaiNgBXAz-v4Qt1Mofvc4XA',
          "miniprogramState": 'formal'
        })
      } catch (err) {
        console.log(err)
      }
      return {
        status: "suspicious",
        reason: "Detected suspicious activity log!"
      };
    }
  }

  // stage 3
  // insert a new log
  tasks.push(db.collection(`SportsMeetStampLog${studentGrade}`).add({
    data: {
      eventId: event.eventId,
      eventName: eventName,
      issuerId: callerId,
      issuerName: adminName,
      userId: event.userId,
      stampNumber: (allowStamps ? stampValue : undefined),
      pointNumber: (rankLeaderboard ? pointValue : undefined),
      studentNickname: studentNickname,
      timeStamp: Date.now(),
    }
  }));
  // send service message
  try {
    const date = new Date(Date.now());
    const options = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        // second: '2-digit',
        hour12: false,
        timeZone: 'Asia/Shanghai'
    };
    let dateDisplay = date.toLocaleString('zh-CN', options);
    await cloud.openapi.subscribeMessage.send({
        "touser": userOpenId,
        "page": 'pages/MainMenu/MainMenu',
        "lang": 'en_US',
        "data": {
          "time1": {
            "value": dateDisplay
          },
          "thing4": {
            "value": allowStamps ? `+${String(stampValue)}` : `+${String(eventStampForExperience)}`
          },
          "thing5": {
            "value": eventName
          },
          "thing9": {
            "value": adminName
          },
          "thing6": {
            "value": '活动积分已添加，感谢您的参与！'
          }
        },
        "templateId": 'RU3_lesMwqL3aUZl5RXQa51GYV2JzqH94-FkKmeScu8',
        "miniprogramState": 'formal'
      })
  } catch (err) {
    console.log(err)
  }

  if (rankLeaderboard) {
    // fetch the computed leaderboard
    tasks.push(db.collection(`SportsMeetLeaderboardProcessed${studentGrade}`).where({
      studentId: event.userId,
    }).get());
  }
  if (allowStamps) {
    // add it into the computed homeroom
    tasks.push(db.collection(`SportsMeetHomeroomProcessed${studentGrade}`).where({
      class: studentClass
    }).update({
      data: {
        stampPoints: db.command.inc(stampValue),
      }
    }));
  }
  let currentComputedLeaderboardEntry;
  result = await Promise.all(tasks);
  if (rankLeaderboard) {
    if (result[1].data.length === 0) {
      return {
        status: "failure",
        reason: "User has missing computed database entry!"
      };
    }
    currentComputedLeaderboardEntry=result[1].data[0];
  }
  tasks=[];

  // stage 4
  if (rankLeaderboard) {
    // update the computed leaderboard
    let currentLeaderboardScore = currentComputedLeaderboardEntry[`studentPointScore${event.eventId}`];
    if (pointValue > currentLeaderboardScore) {
      let setDataObject = {};
      setDataObject[`studentPointScore${event.eventId}`]=pointValue;
      await db.collection(`SportsMeetLeaderboardProcessed${studentGrade}`).doc(currentComputedLeaderboardEntry._id).update({
        data: setDataObject,
      });
    }
  }
  await Promise.all(tasks);

  return {
    status: "success",
  };
}