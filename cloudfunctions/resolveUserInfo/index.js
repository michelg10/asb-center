// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
    env: 'asb-center-7gixak2a33f2f3e5',
});

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()

  let tasks=[];
  tasks.push(cloud.callFunction({
    name: "fetchAllCollections",
    data: {
      collectionName: "userData",
    }
  }));
  tasks.push(cloud.callFunction({
    name: "fetchAllCollections",
    data: {
      collectionName: "studentData",
    }
  }));
  let results = await Promise.all(tasks);
  let userDataInformation = results[0].result.data;
  let studentDataInformation = results[1].result.data;
  // resolve student data information into user data information
  let studentIdToDataMap = new Map();
  for (let i=0;i<studentDataInformation.length;i++) {
    studentIdToDataMap.set(studentDataInformation[i]._id, studentDataInformation[i]);
  }
  for (let i=0;i<userDataInformation.length;i++) {
    userDataInformation[i].student = studentIdToDataMap.get(userDataInformation[i].studentId);
  }
  return {
    data: userDataInformation,
  };
}