// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

// 云函数入口函数
exports.main = async (event, context) => {
    const wxContext = cloud.getWXContext()
    let db = cloud.database();

    let tasks = [];
    tasks.push(db.collection("userData").where({
      userId: wxContext.OPENID,
    }).get());
    tasks.push(db.collection("userData").where({
      _id: event.log.userId,
    }).get());
    let result = await Promise.all(tasks);
    let adminUserId = result[0].data[0]._id;
    let studentUserId = result[1].data[0].studentId;
    let studentOpenId = result[1].data[0].userId;

    tasks = [];
    tasks.push(db.collection("SportsMeetAdmin").where({
      adminId: adminUserId
    }).get());
    tasks.push(db.collection("studentData").where({
      _id: studentUserId,
    }).get());
    tasks.push(db.collection("SportsMeetEvents").where({
      id: event.log.eventId,
    }).get())
    tasks.push(db.collection("SportsMeetConfig").where({
      key: "defaultChance",
    }).get())
    result = await Promise.all(tasks);
    let studentGrade = result[1].data[0].grade;
    let studentClass = result[1].data[0].class;
    let stampForExperience = result[2].data[0].stampForExperience;
    let defaultChance = result[3].data[0].value;

    if (result[0].data.length !== 0 && result[0].data[0].canAddAdmin) {
      let adminName = result[0].data[0].name;
      if (event.approve) {
        db.collection(`SportsMeetStampLog${studentGrade}`).add({
          data: {
            eventId: event.log.eventId,
            eventName: event.log.eventName,
            issuerId: adminUserId,
            issuerName: adminName,
            userId: event.log.userId,
            stampNumber: event.log.stampNumber,
            pointNumber: event.log.pointNumber,
            studentNickname: event.log.studentNickname,
            timeStamp: Date.now(),
          }
        });
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
          let stampValue = event.log.stampNumber;
          if (event.log.stampNumber === undefined){
            stampValue = stampForExperience;
          }
          await cloud.openapi.subscribeMessage.send({
              "touser": studentOpenId,
              "page": 'pages/MainMenu/MainMenu',
              "lang": 'en_US',
              "data": {
                "time1": {
                  "value": dateDisplay
                },
                "thing4": {
                  "value": `+${String(stampValue)}`
                },
                "thing5": {
                  "value": event.log.eventName
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
        await db.collection("SportsMeetAdmin").where({
          adminId: event.log.issuerId
        }).update({
          data: {
            chance: defaultChance,
            suspended: false
          }
        })
        tasks = [];
        if (event.log.pointNumber !== undefined) {
          // fetch the computed leaderboard
          tasks.push(db.collection(`SportsMeetLeaderboardProcessed${studentGrade}`).where({
            studentId: event.log.userId,
          }).get());
        }
        if (event.log.stampNumber !== undefined) {
          // add it into the computed homeroom
          tasks.push(db.collection(`SportsMeetHomeroomProcessed${studentGrade}`).where({
            class: studentClass
          }).update({
            data: {
              stampPoints: db.command.inc(event.log.stampNumber),
            }
          }));
        }
        let currentComputedLeaderboardEntry;
        result = await Promise.all(tasks);
        if (event.log.pointNumber !== undefined) {
          if (result[1].data.length === 0) {
            return {
              status: "failure",
              reason: "User has missing computed database entry!"
            };
          }
          currentComputedLeaderboardEntry=result[1].data[0];
        }
        tasks=[];
      
        if (event.log.pointNumber !== undefined) {
          // update the computed leaderboard
          let currentLeaderboardScore = currentComputedLeaderboardEntry[`studentPointScore${event.log.eventId}`];
          if (event.log.pointNumber > currentLeaderboardScore) {
            let setDataObject = {};
            setDataObject[`studentPointScore${event.log.eventId}`]=event.log.pointNumber;
            await db.collection(`SportsMeetLeaderboardProcessed${studentGrade}`).doc(currentComputedLeaderboardEntry._id).update({
              data: setDataObject,
            });
          }
        }
        await Promise.all(tasks);
      }
      await db.collection("SportsMeetStampLogSuspicious").where({
        _id: event.log._id,
      }).remove();
    }
}