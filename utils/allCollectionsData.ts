export default async function allCollectionsData(db: DB.Database, collectionName: string, whereClause?: any) {
  const MAX_LIMIT = 20.0;
  let dbCollection: any;
  if (whereClause === undefined) {
    dbCollection = db.collection(collectionName);
  } else {
    dbCollection = db.collection(collectionName).where({
      ...whereClause
    });
  }
  const countResult = await dbCollection.count();
  const total = countResult.total;
  const batchTimes = Math.ceil(total/MAX_LIMIT);
  const tasks = [];
  for (let i=0;i<batchTimes;i++) {
    const promise = dbCollection.skip(i*MAX_LIMIT).limit(MAX_LIMIT).get();
    tasks.push(promise);
  }
  if (batchTimes===0) {
    return {
      data: [],
      errMsg: "empty",
    }
  }
  return (await Promise.all(tasks)).reduce((acc, cur) => {
    return {
      data: acc.data.concat(cur.data),
      errMsg: acc.errMsg,
    }
  })
}