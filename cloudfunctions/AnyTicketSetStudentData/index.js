// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

let db = cloud.database();

// 云函数入口函数
exports.main = async (event, context) => {
    const wxContext = cloud.getWXContext()
    if (event.type === "dinnerModify"){
      await db.collection('BlackoutStudentData').where({
        userId: event.userId,
      }).update({
        data: {
          dinnerOption: event.dinnerOption
        }
    });
      return;
    }
    else if (event.type === "dinner"){
      await db.collection('BlackoutStudentData').add({
        data: {
          userId: event.userId,
          dinnerOption: event.dinnerOption
        }
    });
      return;
    }
    else if (event.type === "submitConsent"){
      await db.collection('BlackoutStudentData').where({
        userId: event.userId,
      }).update({
        data: {
          consent: event.consent,
          consentData: event.consentData
        }
    });
      return;
    }
    else if (event.type === "submitConsentNew"){
      await db.collection('BlackoutStudentData').add({
        data: {
          userId: event.userId,
          consent: event.consent,
          consentData: event.consentData
        }
    });
      return;
    }
    else if (event.type === "submitMusic"){
      await db.collection('BlackoutMusic').add({
        data: {
          userData: event.userData,
          musicName: event.musicName,
          musicComposer: event.musicComposer,
          timestamp: Date.now()
        }
    });
      return;
    }
  return;
}