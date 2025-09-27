// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
    env: 'asc-5gg4yr483fce21b4',
});

let db = cloud.database();
// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  let getUserAccount = await db.collection("userData").where({
    userId: wxContext.OPENID,
  }).get();
  if (getUserAccount.data.length === 0) {
    return {
      status: "failure",
      reason: "Unknown user!"
    };
  }
  let getAdminAccount = await db.collection("SportsMeetAdmin").where({
    adminId: getUserAccount.data[0]._id,
  }).get();
  if (getAdminAccount.data.length === 0) {
    return {
      status: "failure",
      reason: "No admin permissions"
    };
  }
  if (getAdminAccount.data[0].canAddAdmin !== true) {
    return {
      status: "failure",
      reason: "No permissions to add admins"
    };
  }
  let getCurrentAdminStatus = await db.collection("SportsMeetAdmin").where({
    adminId: event.userId,
  }).get();
  let getUserOpenId = await db.collection("userData").where({
    _id: event.userId,
  }).get();
  let currentlyIsAdmin = (getCurrentAdminStatus.data.length !== 0);
  let currentAdminEntryWxId = "";
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
  if (currentlyIsAdmin) {
    currentAdminEntryWxId = getCurrentAdminStatus.data[0]._id;
  }
  if (event.isAdmin) {
    let databaseSetObj = {
      adminId: event.userId,
      canAddAdmin: event.canAddAdmin,
      canDeleteAll: event.canDeleteAll,
      canDoPurchase: event.canDoPurchase,
      suspended: event.suspended,
      name: event.name,
      chance: 1
    };
    if (currentlyIsAdmin) {
      if (event.suspended) {
        // send service message
        try {
          await cloud.openapi.subscribeMessage.send({
            "touser": getUserOpenId.data[0].userId,
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
        // send service message
        try {
          await cloud.openapi.subscribeMessage.send({
            "touser": getUserOpenId.data[0].userId,
            "page": 'pages/MainMenu/MainMenu',
            "lang": 'en_US',
            "data": {
              "time5": {
                "value": dateDisplay
              },
              "thing3": {
                "value": "运动嘉年华管理员权限"
              },
              "thing8": {
                "value": "请妥善使用管理员权限，如有违规将被撤销。"
              },
              "thing6": {
                "value": getAdminAccount.data[0].name
              },
              "phrase2": {
                "value": "权限更新"
              }
            },
            "templateId": 'EaZhkxxp1LaCulPWys7nLWWbwVxur0F_7oWgO0KG3Jw',
            "miniprogramState": 'formal'
          })
        } catch (err) {
          console.log(err)
        }
      }
      await db.collection("SportsMeetAdmin").doc(currentAdminEntryWxId).update({
        data: databaseSetObj,
      });
    } else {
      // send service message
      try {
        await cloud.openapi.subscribeMessage.send({
          "touser": getUserOpenId.data[0].userId,
          "page": 'pages/MainMenu/MainMenu',
          "lang": 'en_US',
          "data": {
            "time5": {
              "value": dateDisplay
            },
            "thing3": {
              "value": "运动嘉年华管理员权限"
            },
            "thing8": {
              "value": "请妥善使用管理员权限，如有违规将被立即撤销。"
            },
            "thing6": {
              "value": getAdminAccount.data[0].name
            },
            "phrase2": {
              "value": "权限添加"
            }
          },
          "templateId": 'EaZhkxxp1LaCulPWys7nLWWbwVxur0F_7oWgO0KG3Jw',
          "miniprogramState": 'formal'
        })
      } catch (err) {
        console.log(err)
      }
      await db.collection("SportsMeetAdmin").add({
        data: databaseSetObj,
      });
    }
  } else {
    // send service message
    try {
      await cloud.openapi.subscribeMessage.send({
        "touser": getUserOpenId.data[0].userId,
        "page": 'pages/MainMenu/MainMenu',
        "lang": 'en_US',
        "data": {
          "time5": {
            "value": dateDisplay
          },
          "thing3": {
            "value": "运动嘉年华管理员权限"
          },
          "thing8": {
            "value": "您的运动嘉年华管理员权限已被撤销。"
          },
          "thing6": {
            "value": getAdminAccount.data[0].name
          },
          "phrase2": {
            "value": "权限撤销"
          }
        },
        "templateId": 'EaZhkxxp1LaCulPWys7nLWWbwVxur0F_7oWgO0KG3Jw',
        "miniprogramState": 'formal'
      })
    } catch (err) {
      console.log(err)
    }
    if (currentlyIsAdmin) {
      await db.collection("SportsMeetAdmin").doc(currentAdminEntryWxId).remove();
    }
  }
  return {
    status: "success",
  }
}