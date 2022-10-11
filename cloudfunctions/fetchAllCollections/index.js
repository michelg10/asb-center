// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
    env: 'asb-center-7gixak2a33f2f3e5',
});

let db = cloud.database();

// 云函数入口函数
exports.main = async (event, context) => {
  // important: this should only be allowed to be called from the cloud
  const MAX_LIMIT = 100.0;
  let collectionName = event.collectionName;
  let collection = db.collection(collectionName);
  if (event.whereClause !== undefined) {
    collection=collection.where(event.whereClause);
  }
  const countResult = await collection.count();
  const total = countResult.total;
  const batchTimes = Math.ceil(total/MAX_LIMIT);
  const tasks = [];
  if (batchTimes===0) {
    return {
      data: [],
      errMsg: "nothing",
    }
  }
  for (let i=0;i<batchTimes;i++) {
    const promise = collection.skip(i*MAX_LIMIT).limit(MAX_LIMIT).get();
    tasks.push(promise);
  }
  return (await Promise.all(tasks)).reduce((acc, cur) => {
    return {
      data: acc.data.concat(cur.data),
      errMsg: acc.errMsg,
    }
  })
}