// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()
db=cloud.database();

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  // stage 1: fetch user id from openid, fetch user student ID
  let tasks = [];
  // fetch user id from openid
  tasks.push(db.collection("userData").where({
    userId: wxContext.OPENID,
  }).get());
  // fetch user student ID
  tasks.push(db.collection("userData").where({
    _id: event.userId,
  }).get());
  let res = await Promise.all(tasks);
  let fetchIssuerId = res[0];
  if (fetchIssuerId.data.length === 0) {
    return {
      status: "failure",
      reason: "Do purchase called with unregistered user"
    };
  }
  let issuerId = fetchIssuerId.data[0]._id;
  let fetchUserId = res[1];
  if (fetchUserId.data.length === 0) {
    return {
      status: "failure",
      reason: "Do purchase called to purchase with unregistered user"
    };
  }
  let userStudentId = fetchUserId.data[0].studentId;

  // stage 2: fetch student grade information
  let fetchUserStudentId = await db.collection("studentData").where({
    _id: userStudentId,
  }).get();
  if (fetchUserStudentId.data.length === 0) {
    return {
      status: "failure",
      reason: "User student ID points to nothing"
    };
  }
  let userGrade = fetchUserStudentId.data[0].grade;
  let pseudoAccountId = fetchUserStudentId.data[0].pseudoId;
  let isPseudoAccount = (event.userId === pseudoAccountId);

  // stage 3: fetch log information, fetch item information, fetch admin information
  tasks = [];
  // fetch admin information
  tasks.push(db.collection("SportsMeet2021Admin").where({
    adminId: issuerId,
  }).get());
  // fetch item information
  tasks.push(db.collection("SportsMeet2021Items").where({
    id: event.itemId,
  }).get());
  // fetch stamp log information
  tasks.push(cloud.callFunction({
    name: "fetchAllCollections",
    data: {
      collectionName: `SportsMeet2021StampLog${userGrade}`,
      whereClause: {
        userId: event.userId,
      }
    }
  }));
  // fetch transaction information
  tasks.push(cloud.callFunction({
    name: "fetchAllCollections",
    data: {
      collectionName: `SportsMeet2021TransactionLog${userGrade}`,
      whereClause: {
        userId: event.userId,
      }
    }
  }));
  let doPseudoaccountLinkTally = false;
  if (!isPseudoAccount) {
    // fetch related pseudoAccount log information
    tasks.push(cloud.callFunction({
      name: "fetchAllCollections",
      data: {
        collectionName: `SportsMeet2021StampLog${userGrade}`,
        whereClause: {
          userId: pseudoAccountId,
        }
      }
    }));
    // fetch related pseudoAccount transaction information
    tasks.push(cloud.callFunction({
      name: "fetchAllCollections",
      data: {
        collectionName: `SportsMeet2021TransactionLog${userGrade}`,
        whereClause: {
          userId: pseudoAccountId,
        }
      }
    }));
  } else {
    let getRelatedAccounts = await db.collection("userData").where({
      studentId: userStudentId,
    }).get();
    if (getRelatedAccounts.data.length > 2) {
      return {
        status: "failure",
        reason: "Trying to purchase via multi-user pseudo account"
      };
    }
    if (getRelatedAccounts.data.length === 2) {
      doPseudoaccountLinkTally = true;
      let otherAccountIndex = 0;
      if (getRelatedAccounts.data[0]._id === pseudoAccountId) {
        otherAccountIndex = 1;
      }
      tasks.push(cloud.callFunction({
        name: "fetchAllCollections",
        data: {
          collectionName: `SportsMeet2021StampLog${userGrade}`,
          whereClause: {
            userId: getRelatedAccounts.data[otherAccountIndex]._id,
          }
        }
      }));
      tasks.push(cloud.callFunction({
        name: "fetchAllCollections",
        data: {
          collectionName: `SportsMeet2021TransactionLog${userGrade}`,
          whereClause: {
            userId: getRelatedAccounts.data[otherAccountIndex]._id,
          }
        }
      }));
    }
  }
  res = await Promise.all(tasks);
  // admin information: check authorization, resolve issuerName
  if (res[0].data.length === 0) {
    return {
      status: "failure",
      reason: "Issuer has no admin permissions"
    };
  }
  if (!res[0].data[0].canDoPurchase) {
    return {
      status: "failure",
      reason: "Issuer has no purchase admin permissions"
    };
  }
  let issuerName = res[0].data[0].name;

  // item information: check validity, grab the name and cost
  if (res[1].data.length === 0) {
    return {
      status: "failure",
      reason: "Purchase request on nonexistent item"
    };
  }
  let itemName = res[1].data[0].name;
  let itemCost = res[1].data[0].cost;

  // stamp log information: compute the number of total stamps
  let totalStamps=0;
  let cummulateStamps = (logs) => {
    let rturn = 0;
    for (let i=0;i<logs.length;i++) {
      rturn+=(logs[i].stampNumber === undefined ? 0 : logs[i].stampNumber);
    }
    return rturn;
  }
  totalStamps+=cummulateStamps(res[2].result.data);
  if (!isPseudoAccount || doPseudoaccountLinkTally) {
    totalStamps+=cummulateStamps(res[4].result.data);
  }
  let eventHasExperienced = new Map();
  let addExperiencePoints = (logs) => {
    let rturn=0;
    for (let i=0;i<logs.length;i++) {
      if (!eventHasExperienced.has(logs[i].eventId)) {
        rturn += 5;
        eventHasExperienced.set(logs[i].eventId, true);
      }
    }
    return rturn;
  }
  totalStamps+=addExperiencePoints(res[2].result.data);
  if (!isPseudoAccount || doPseudoaccountLinkTally) {
    totalStamps+=addExperiencePoints(res[4].result.data);
  }
  // transaction log information: total up past transaction
  let totalTransacted = 0;
  let cummulateTransactions = (logs) => {
    let rturn=0;
    for (let i=0;i<logs.length;i++) {
      rturn+=logs[i].itemCost;
    }
    return rturn;
  }
  totalTransacted+=cummulateTransactions(res[3].result.data);
  if (!isPseudoAccount || doPseudoaccountLinkTally) {
    totalTransacted+=cummulateTransactions(res[5].result.data);
  }
  if (totalStamps-totalTransacted<itemCost) {
    return {
      status: "failure",
      reason: `User balance insufficient (trying to use ${totalStamps}-${totalTransacted}=${totalStamps-totalTransacted}<${itemCost})`
    };
  }
  await db.collection(`SportsMeet2021TransactionLog${userGrade}`).add({
    data: {
      userId: event.userId,
      issuerId: issuerId,
      issuerName: issuerName,
      itemId: event.itemId,
      itemName: itemName,
      itemCost: itemCost,
    }
  });
  return {
    status: "success"
  };
}