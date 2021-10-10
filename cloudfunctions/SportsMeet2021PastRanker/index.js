// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()
let db = cloud.database();

// 云函数入口函数
exports.main = async (event, context) => {
  console.log("Autorank routine - rank regular leaderboards");
  // go through Leaderboards
  let grades = [9,10,11,12];
  let tasks=[];
  tasks.push(cloud.callFunction({
    name: "fetchAllCollections",
    data: {
      collectionName: "SportsMeet2021Events",
    }
  }));
  for (let i=0;i<grades.length;i++) {
    tasks.push(cloud.callFunction({
      name: "fetchAllCollections",
      data: {
        collectionName: `SportsMeet2021LeaderboardProcessed${grades[i]}`,
      }
    }))
  }
  for (let i=0;i<grades.length;i++) {
    tasks.push(cloud.callFunction({
      name: "fetchAllCollections",
      data: {
        collectionName: `SportsMeet2021HomeroomProcessed${grades[i]}`,
      }
    }));
  }
  let res=await Promise.all(tasks);
  let eventNameList = [];
  for (let i=0;i<res[0].result.data.length;i++) {
    if (res[0].result.data[i].rankLeaderboard) {
      eventNameList.push(res[0].result.data[i].id);
    }
  }
  let gradesComputedLeaderboardList=[];
  for (let i=1;i<=grades.length;i++) {
    gradesComputedLeaderboardList.push(res[i].result.data);
  }
  for (let i=0;i<grades.length;i++) {
    // for every event
    for (let j=0;j<eventNameList.length;j++) {
      // create an ID array
      let idArray = Array(gradesComputedLeaderboardList[i].length);
      for (let k=0;k<idArray.length;k++) {
        idArray[k]=k;
      }
      let currentConsideringProperty = `studentPointScore${eventNameList[j]}`;
      idArray.sort((a, b) => {
        // negative if a<b, zero if equal and positive if a>b
        let actualA = gradesComputedLeaderboardList[i][a][currentConsideringProperty];
        let actualB = gradesComputedLeaderboardList[i][b][currentConsideringProperty];
        if (actualA === actualB) {
          return 0;
        }
        if (actualA < actualB) {
          return 1;
        }
        return -1;
      });
      // reverse the ID array to get the rank
      let reverseIdArray = Array(gradesComputedLeaderboardList[i].length);
      for (let k=0;k<idArray.length;k++) {
        reverseIdArray[idArray[k]]=k;
      }
      // write soonLastRank to LastRank and then write to soonLastRank
      for (let k=0;k<gradesComputedLeaderboardList[i].length;k++) {
        gradesComputedLeaderboardList[i][k][`studentLastRank${eventNameList[j]}`] = gradesComputedLeaderboardList[i][k][`studentSoonLastRank${eventNameList[j]}`];
        gradesComputedLeaderboardList[i][k][`studentSoonLastRank${eventNameList[j]}`] = reverseIdArray[k];
      }
    }
  }
  // now update everything
  tasks = [];
  for (let i=0;i<grades.length;i++) {
    for (let j=0;j<gradesComputedLeaderboardList[i].length;j++) {
      let leaderboardUpdateObj = {};
      for (let k=0;k<eventNameList.length;k++) {
        leaderboardUpdateObj[`studentLastRank${eventNameList[k]}`]=gradesComputedLeaderboardList[i][j][`studentLastRank${eventNameList[k]}`];
        leaderboardUpdateObj[`studentSoonLastRank${eventNameList[k]}`]=gradesComputedLeaderboardList[i][j][`studentSoonLastRank${eventNameList[k]}`];
      }
      tasks.push(db.collection(`SportsMeet2021LeaderboardProcessed${grades[i]}`).doc(gradesComputedLeaderboardList[i][j]._id).update({
        data: leaderboardUpdateObj
      }));
    }
  }

  console.log("Autorank routine - rank homeroom leaderboards");
  // go through homeroom processed

  let gradesComputedHomeroomList=[];
  for (let i=grades.length+1;i<2*grades.length+1;i++) {
    gradesComputedHomeroomList.push(res[i].result.data);
  }
  for (let i=0;i<grades.length;i++) {
    // create an ID array
    let idArray = Array(gradesComputedHomeroomList[i].length);
    for (let k=0;k<idArray.length;k++) {
      idArray[k]=k;
    }
    idArray.sort((a, b) => {
      // negative if a<b, zero if equal and positive if a>b
      let actualA = gradesComputedHomeroomList[i][a].classPoints+gradesComputedHomeroomList[i][a].stampPoints/10;
      let actualB = gradesComputedHomeroomList[i][b].classPoints+gradesComputedHomeroomList[i][b].stampPoints/10;
      if (actualA === actualB) {
        return 0;
      }
      if (actualA < actualB) {
        return 1;
      }
      return -1;
    });
    // reverse the ID array to get the rank
    let reverseIdArray = Array(gradesComputedHomeroomList[i].length);
    for (let k=0;k<idArray.length;k++) {
      reverseIdArray[idArray[k]]=k;
    }
    // write soonLastRank to LastRank and then write to soonLastRank
    for (let k=0;k<gradesComputedHomeroomList[i].length;k++) {
      gradesComputedHomeroomList[i][k].lastRank = gradesComputedHomeroomList[i][k].soonLastRank;
      gradesComputedHomeroomList[i][k].soonLastRank = reverseIdArray[k];
    }
  }
  // now update everything
  for (let i=0;i<grades.length;i++) {
    for (let j=0;j<gradesComputedHomeroomList[i].length;j++) {
      let leaderboardUpdateObj = {};
      leaderboardUpdateObj.lastRank=gradesComputedHomeroomList[i][j].lastRank;
      leaderboardUpdateObj.soonLastRank=gradesComputedHomeroomList[i][j].soonLastRank;
      tasks.push(db.collection(`SportsMeet2021HomeroomProcessed${grades[i]}`).doc(gradesComputedHomeroomList[i][j]._id).update({
        data: leaderboardUpdateObj
      }));
    }
  }
  await Promise.all(tasks);
}