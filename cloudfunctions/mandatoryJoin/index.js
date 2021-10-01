// 云函数入口文件
const cloud = require('wx-server-sdk');
cloud.init();
db=cloud.database();

// 云函数入口函数
exports.main = async (event, context) => {
  console.log("Running mandatory join routine");
  const wxContext = cloud.getWXContext()

  let tasks=[];
  tasks.push(cloud.callFunction({
    name: "fetchAllCollections",
    data: {
      collectionName: "event",
    }
  }));
  tasks.push(cloud.callFunction({
    name: "resolveUserInfo",
    data: { }
  }));
  let results = await Promise.all(tasks);
  let eventCollectionInformation = results[0].result.data;
  let userDataInformation = results[1].result.data;
  // resolve student data information into user data information
  let updatedStudentsMap=new Map();
  for (let i=0;i<eventCollectionInformation.length;i++) {
    if (!eventCollectionInformation[i].mandatory) {
      continue;
    }
    if (Math.floor(Date.now() / 1000)<=eventCollectionInformation[i].menuEventEnd) {
      for (let i=0;i<userDataInformation.length;i++) {
        let studentJoin = false;
        if (eventCollectionInformation[i].grades !== undefined) {
          if (userDataInformation[i].student.grade !== undefined) {
            if (eventCollectionInformation[i].grades.includes(userDataInformation[i].student.grade)) {
              studentJoin = true;
            }
          }
        } else {
          studentJoin=true;
        }
        if (studentJoin) {
          if (userDataInformation[i].info[`${eventCollectionInformation[i].id}Data`] === undefined) {
            // tailor this code to every event
            console.log(`Mandatory join ${userDataInformation[i].student.nickname} (${userDataInformation[i]._id}) to ${eventCollectionInformation[i].id}`);
            if (eventCollectionInformation[i].id === "SportsMeet2021") {
              let secureCodeString = await cloud.callFunction({
                name: "generateRandomId",
              });
              userDataInformation[i].info[`${eventCollectionInformation[i].id}Data`] = {
                joined: true,
                secureCodeString: secureCodeString.result.data,
              };
              updatedStudentsMap.set(userDataInformation[i]._id, i);
            }
          }
        }
      }
    }
  }
  tasks=[];
  for (const [key, value] of updatedStudentsMap.entries()) {
    tasks.push(db.collection('userData').doc(key).update({
      data: {
        info:userDataInformation[value].info,
      }
    }));
  }
  return {

  };
}