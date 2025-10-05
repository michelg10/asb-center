// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: 'asc-5gg4yr483fce21b4'
})

let db = cloud.database();

// 云函数入口函数
exports.main = async (event, context) => {
    const wxContext = cloud.getWXContext()
    if (event.type === "dinnerModify"){
      await db.collection('TedXStudentData').where({
        userId: event.userId,
      }).update({
        data: {
          dinnerOption: event.dinnerOption
        }
    });
      return;
    }
    // else if (event.type === "dinner"){
    //   await db.collection('TedXStudentData').add({
    //     data: {
    //       userId: event.userId,
    //       dinnerOption: event.dinnerOption
    //     }
    // });
    //   return;
    // }
    // else if (event.type === "submitConsent"){
    //   await db.collection('TedXStudentData').where({
    //     userId: event.userId,
    //   }).update({
    //     data: {
    //       consent: event.consent,
    //       consentData: event.consentData
    //     }
    // });
    //   return;
    // }
    // else if (event.type === "submitConsentNew"){
    //   await db.collection('TedXStudentData').add({
    //     data: {
    //       userId: event.userId,
    //       consent: event.consent,
    //       consentData: event.consentData
    //     }
    // });
    //   return;
    // }
    else if (event.type === "submitMusic"){
      await db.collection('PromMusic').add({
        data: {
          userData: event.userData,
          musicName: event.musicName,
          musicComposer: event.musicComposer,
          timestamp: Date.now()
        }
    });
      return;
    }
    /*else if (event.type === "houseModify"){
      await db.collection('TedXStudentData').where({
        userId: event.userId,
      }).update({
        data: {
          house: event.house
        }
      });
      await db.collection('PromDeadlines').where({
        optionId: "house",
      }).update({
        data: {
          current: event.house
        }
      });
      return;
    }*/
    else if (event.type === "houseAdd"){
      await db.collection('TedXStudentData').add({
        data: {
          userId: event.userId,
          house: true,
          timestamp: Date.now()
        }
      });
      /*await db.collection('PromDeadlines').where({
        optionId: "house",
      }).update({
        data: {
          current: event.house
        }
      });*/
      return;
    }
    else if (event.type === "houseModifyTable"){
      await db.collection('PromTables').where({
        tableId: event.tableId
      }).update({
        data: {
          guests: event.guests,
          timestamp: Date.now()
        }
      });
      return;
    }
  return;
}