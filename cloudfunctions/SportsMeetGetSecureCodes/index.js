// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
    env: 'asc-5gg4yr483fce21b4',
});

let db = cloud.database();

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  // first check for admin status
  let getAccountIdForUser = await(db.collection("userData")).where({
    userId: wxContext.OPENID,
  }).get();
  if (getAccountIdForUser.data.length===0) {
    return {
      status: "forbidden",
    };
  }
  let callerId = getAccountIdForUser.data[0]._id;
  let adminCheckResult = await db.collection("SportsMeetAdmin").where({
    "adminId": callerId
  }).get();
  if (adminCheckResult.data.length===0) {
    return {
      status: "forbidden",
    };
  }
  // authorized. now get everything
  let dbResult = await cloud.callFunction({
    name: "fetchAllCollections",
    data: {
      collectionName: "userData",
      whereClause: {
        info: {
          SportsMeet2024Data: {
            joined: true,
          }
        }
      }
    }
  });
  let rturn = [];
  for (let i=0;i<dbResult.result.data.length;i++) {
    rturn.push({
      id: dbResult.result.data[i]._id,
      code: dbResult.result.data[i].info.SportsMeet2024Data.secureCodeString,
    });
  }
  return {
    status: "success",
    data: rturn,
  }
}