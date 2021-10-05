// 云函数入口文件
const cloud = require('wx-server-sdk');
cloud.init();
db=cloud.database();

// 云函数入口函数
exports.main = async (event, context) => {
  console.log("Running mandatory join routine");
  const wxContext = cloud.getWXContext()
  let suppliedUserDataInformation=event.suppliedUserDataInformation;

  let tasks=[];
  tasks.push(cloud.callFunction({
    name: "fetchAllCollections",
    data: {
      collectionName: "event",
    }
  }));
  if (suppliedUserDataInformation === undefined) {
    tasks.push(cloud.callFunction({
      name: "resolveUserInfo",
      data: { }
    }));
  } else {
    console.log("Running with supplied information ", suppliedUserDataInformation);
  }
  let randomCharacters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
  let results = await Promise.all(tasks);
  let eventCollectionInformation = results[0].result.data;
  let userDataInformation;
  if (suppliedUserDataInformation === undefined) {
    userDataInformation = results[1].result.data;
  } else {
    userDataInformation = suppliedUserDataInformation;
  }
  // resolve student data information into user data information
  let updatedStudentsMap=new Map();
  let cacheObj = {};
  tasks=[];
  let batchPushMap = new Map();
  for (let i=0;i<eventCollectionInformation.length;i++) {
    if (!eventCollectionInformation[i].mandatory) {
      continue;
    }
    if (Math.floor(Date.now() / 1000)<=eventCollectionInformation[i].menuEventEnd) {
      for (let j=0;j<userDataInformation.length;j++) {
        let studentJoin = false;
        if (eventCollectionInformation[i].grades !== undefined) {
          if (userDataInformation[j].student!==undefined&&userDataInformation[j].student.grade !== undefined) {
            if (eventCollectionInformation[i].grades.includes(userDataInformation[j].student.grade)) {
              studentJoin = true;
            }
          }
        } else {
          studentJoin=true;
        }
        if (studentJoin) {
          if (userDataInformation[j].info[`${eventCollectionInformation[i].id}Data`] === undefined) {
            // tailor this code to every event
            console.log(`Mandatory join ${userDataInformation[j].student.nickname} (${userDataInformation[j]._id}) to ${eventCollectionInformation[i].id}`);
            if (eventCollectionInformation[i].id === "SportsMeet2021") {
              let secureCodeString="";
              for (let i=0;i<10;i++) {
                secureCodeString += randomCharacters.charAt(Math.floor(Math.random() * randomCharacters.length));
              }
              userDataInformation[j].info[`${eventCollectionInformation[i].id}Data`] = {
                joined: true,
                secureCodeString: secureCodeString,
              };

              // add the new user into the computed leaderboard
              let leaderboardObj = {
                studentId: userDataInformation[j]._id,
                studentNickname: userDataInformation[j].student.nickname,
              };
              if (cacheObj.SportsMeet2021Events===undefined) {
                let result = await cloud.callFunction({
                  name: "fetchAllCollections",
                  data: {
                    collectionName: "SportsMeet2021Events",
                  },
                });
                result = result.result.data;
                cacheObj.SportsMeet2021Events=result;
              }
              let result = cacheObj.SportsMeet2021Events;
              for (let k=0;k<result.length;k++) {
                if (result[k].rankLeaderboard) {
                  leaderboardObj[`studentPointScore${result[k].id}`]=0;
                  leaderboardObj[`studentLastRank${result[k].id}`]=-1;
                  leaderboardObj[`studentSoonLastRank${result[k].id}`]=-1;
                }
              }
              if (!batchPushMap.has(`SportsMeet2021LeaderboardProcessed${userDataInformation[j].student.grade}`)) {
                batchPushMap.set(`SportsMeet2021LeaderboardProcessed${userDataInformation[j].student.grade}`, [leaderboardObj]);
              } else {
                batchPushMap.get(`SportsMeet2021LeaderboardProcessed${userDataInformation[j].student.grade}`).push(leaderboardObj);
              }
              updatedStudentsMap.set(userDataInformation[j]._id, i);
            }
          }
        }
      }
    }
  }
  for (const [key, value] of updatedStudentsMap.entries()) {
    tasks.push(db.collection('userData').doc(key).update({
      data: {
        info:userDataInformation[value].info,
      }
    }));
  }
  for (const [key, value] of batchPushMap.entries()) {
    tasks.push(db.collection(key).add({
      data: value
    }));
  }
  // await Promise.all(tasks);
}