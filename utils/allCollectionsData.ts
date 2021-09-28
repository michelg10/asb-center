export default async function allCollectionsData(db: DB.Database, collectionName: string) {
  const MAX_LIMIT = 20.0;
  const countResult = await db.collection(collectionName).count();
  const total = countResult.total;
  const batchTimes = Math.ceil(total/MAX_LIMIT);
  const tasks = [];
  for (let i=0;i<batchTimes;i++) {
    const promise = db.collection(collectionName).skip(i*MAX_LIMIT).limit(MAX_LIMIT).get();
    tasks.push(promise);
  }
  return (await Promise.all(tasks)).reduce((acc, cur) => {
    return {
      data: acc.data.concat(cur.data),
      errMsg: acc.errMsg,
    }
  })
}