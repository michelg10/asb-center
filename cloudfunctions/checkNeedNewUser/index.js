// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
    env: 'asb-center-7gixak2a33f2f3e5',
});

const db = cloud.database();

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  try {
    let result = await db.collection("userData").where({
      userId: wxContext.openid,
    }).get();
    if (result.data.length === 0) {
      return {
        response: true,
      };
    }
  } catch (e) {
    console.error(e);
  }
  return {
    response: false,
  };
}