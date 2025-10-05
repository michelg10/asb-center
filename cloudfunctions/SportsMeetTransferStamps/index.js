// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
    env: 'asc-5gg4yr483fce21b4',
});

db = cloud.database();

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  // stage 1: fetch user id from openid, fetch user student ID, fetch all the events
  let tasks = [];
  // fetch user id from openid
  tasks.push(db.collection("userData").where({
    userId: wxContext.OPENID,
  }).get());
  // fetch user student ID
  tasks.push(db.collection("userData").where({
    _id: event.userId,
  }).get());
  tasks.push(db.collection("userData").where({
    _id: event.receiverId,
  }).get())
  tasks.push(cloud.callFunction({
    name: "fetchAllCollections",
    data: {
      collectionName: "SportsMeetEvents"
    }
  }));
  let res = await Promise.all(tasks);
  let fetchIssuerId = res[0];
  if (fetchIssuerId.data.length === 0) {
    return {
      status: "failure",
      reason: "Operation called with unregistered user"
    };
  }
  let issuerId = fetchIssuerId.data[0]._id;
  let fetchUserId = res[1];
  let fetchReceiverId = res[2];
  if (fetchUserId.data.length === 0) {
    return {
      status: "failure",
      reason: "Operation called to transfer from an unregistered user"
    };
  }
  if (fetchReceiverId.data.length === 0) {
    return {
      status: "failure",
      reason: "Operation called to transfer to an unregistered user"
    };
  }
  let userStudentId = fetchUserId.data[0].studentId;
  let userOpenId = fetchUserId.data[0].userId;
  let receiverStudentId = fetchReceiverId.data[0].studentId;
  let receiverOpenId = fetchReceiverId.data[0].userId;
  let eventData = res[3].result.data;

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
  let userNickname = fetchUserStudentId.data[0].uniqueNickname;
  let pseudoAccountId = fetchUserStudentId.data[0].pseudoId;
  let isPseudoAccount = (event.userId === pseudoAccountId);

  let fetchReceiverStudentId = await db.collection("studentData").where({
    _id: receiverStudentId,
  }).get();
  if (fetchReceiverStudentId.data.length === 0) {
    return {
      status: "failure",
      reason: "Receiver student ID points to nothing"
    };
  }
  let receiverGrade = fetchReceiverStudentId.data[0].grade;
  let receiverNickname = fetchReceiverStudentId.data[0].uniqueNickname;

  // stage 3: fetch log information, fetch item information, fetch admin information
  tasks = [];
  // fetch admin information
  tasks.push(db.collection("SportsMeetAdmin").where({
    adminId: issuerId,
  }).get());
  // fetch stamp log information
  tasks.push(cloud.callFunction({
    name: "fetchAllCollections",
    data: {
      collectionName: `SportsMeetStampLog${userGrade}`,
      whereClause: {
        userId: event.userId,
      }
    }
  }));
  // fetch transaction information
  tasks.push(cloud.callFunction({
    name: "fetchAllCollections",
    data: {
      collectionName: `SportsMeetTransactionLog${userGrade}`,
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
        collectionName: `SportsMeetStampLog${userGrade}`,
        whereClause: {
          userId: pseudoAccountId,
        }
      }
    }));
    // fetch related pseudoAccount transaction information
    tasks.push(cloud.callFunction({
      name: "fetchAllCollections",
      data: {
        collectionName: `SportsMeetTransactionLog${userGrade}`,
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
        reason: "Trying to transfer from a multi-user pseudo account"
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
          collectionName: `SportsMeetStampLog${userGrade}`,
          whereClause: {
            userId: getRelatedAccounts.data[otherAccountIndex]._id,
          }
        }
      }));
      tasks.push(cloud.callFunction({
        name: "fetchAllCollections",
        data: {
          collectionName: `SportsMeetTransactionLog${userGrade}`,
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

  // stamp log information: compute the number of total stamps
  let totalStamps=0;
  let cummulateStamps = (logs) => {
    let rturn = 0;
    for (let i=0;i<logs.length;i++) {
      rturn+=(logs[i].stampNumber === undefined ? 0 : logs[i].stampNumber);
    }
    return rturn;
  }
  totalStamps+=cummulateStamps(res[1].result.data);
  if (!isPseudoAccount || doPseudoaccountLinkTally) {
    totalStamps+=cummulateStamps(res[3].result.data);
  }
  let eventHasExperienced = new Map();
  let eventIdToExperienceMap = new Map();
  for (let i=0;i<eventData.length;i++) {
      eventIdToExperienceMap.set(eventData[i].id, eventData[i].stampForExperience);
  }
  let addExperiencePoints = (logs) => {
    let rturn=0;
    for (let i=0;i<logs.length;i++) {
      if (!eventHasExperienced.has(logs[i].eventId)) {
        rturn += eventIdToExperienceMap.get(logs[i].eventId);
        eventHasExperienced.set(logs[i].eventId, true);
      }
    }
    return rturn;
  }
  totalStamps+=addExperiencePoints(res[1].result.data);
  if (!isPseudoAccount || doPseudoaccountLinkTally) {
    totalStamps+=addExperiencePoints(res[3].result.data);
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
  totalTransacted+=cummulateTransactions(res[2].result.data);
  if (!isPseudoAccount || doPseudoaccountLinkTally) {
    totalTransacted+=cummulateTransactions(res[4].result.data);
  }
  if (totalStamps-totalTransacted<event.itemCost) {
    return {
      status: "failure",
      reason: `User balance insufficient (trying to use ${totalStamps}-${totalTransacted}=${totalStamps-totalTransacted}<${event.itemCost})`
    };
  }
  // send service message to user
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
            "value": `-${String(event.itemCost)}`
          },
          "thing5": {
            "value": "Stamp Transfer"
          },
          "thing9": {
            "value": issuerName
          },
          "thing6": {
            "value": '积分转出成功，感谢您的支持！'
          }
        },
        "templateId": 'RU3_lesMwqL3aUZl5RXQa51GYV2JzqH94-FkKmeScu8',
        "miniprogramState": 'formal'
      })
  } catch (err) {
    console.log(err)
  }
  await db.collection(`SportsMeetTransactionLog${userGrade}`).add({
    data: {
      userId: event.userId,
      issuerId: issuerId,
      issuerName: issuerName,
      itemId: "stampTransfer",
      itemName: "Stamp Transfer",
      itemCost: event.itemCost,
      studentNickname: userNickname,
      timeStamp: Date.now(),
    }
  });
  // send service message to receiver
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
        "touser": receiverOpenId,
        "page": 'pages/MainMenu/MainMenu',
        "lang": 'en_US',
        "data": {
          "time1": {
            "value": dateDisplay
          },
          "thing4": {
            "value": `+${String(event.itemCost)}`
          },
          "thing5": {
            "value": "Stamp Transfer"
          },
          "thing9": {
            "value": issuerName
          },
          "thing6": {
            "value": '积分转入成功，感谢您的支持！'
          }
        },
        "templateId": 'RU3_lesMwqL3aUZl5RXQa51GYV2JzqH94-FkKmeScu8',
        "miniprogramState": 'formal'
      })
  } catch (err) {
    console.log(err)
  }
  await db.collection(`SportsMeetTransactionLog${receiverGrade}`).add({
    data: {
      userId: event.receiverId,
      issuerId: issuerId,
      issuerName: issuerName,
      itemId: "stampTransfer",
      itemName: "Stamp Transfer",
      itemCost: -event.itemCost,
      studentNickname: receiverNickname,
      timeStamp: Date.now(),
    }
  });
  return {
    status: "success"
  };
}