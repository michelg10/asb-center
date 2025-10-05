// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: 'asc-5gg4yr483fce21b4'
})
let db = cloud.database();

// 云函数入口函数
exports.main = async (event, context) => {
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
  if (event.type === 'add') {
    await db.collection("SportsMeetStampLogSuspicious").add({
      data: {
        issuerId: event.issuerId,
        issuerName: event.issuerName,
        userId: event.userId,
        stampNumber: event.stampNumber,
        studentNickname: event.studentNickname,
        timeStamp: Date.now(),
        reason: "用户总积分大于积分上限"
      }
    });
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
            "value": event.studentNickname
          },
          "thing7": {
            "value": String(event.stampNumber)
          },
          "thing5": {
            "value": "用户总积分大于积分上限"
          },
          "thing6": {
            "value": "事件已通知总管理员"
          }
        },
        "templateId": 'DdJ1P80P0pOf8sAcE_aZbaiNgBXAz-v4Qt1Mofvc4XA',
        "miniprogramState": 'formal'
      })
    } catch (err) {
      console.log(err)
    }
  } else if (event.type === 'update') {
    await db.collection('SportsMeetStampLogSuspicious').where({
      userId: event.userId,
    }).update({
      data: {
        issuerId: event.issuerId,
        issuerName: event.issuerName,
        stampNumber: event.stampNumber,
        timeStamp: Date.now(),
      }
    });
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
            "value": event.studentNickname
          },
          "thing7": {
            "value": String(event.stampNumber)
          },
          "thing5": {
            "value": "用户总积分大于积分上限"
          },
          "thing6": {
            "value": "事件已通知总管理员"
          }
        },
        "templateId": 'DdJ1P80P0pOf8sAcE_aZbaiNgBXAz-v4Qt1Mofvc4XA',
        "miniprogramState": 'formal'
      })
    } catch (err) {
      console.log(err)
    }
  }
}