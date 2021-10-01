// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()

// 云函数入口函数
exports.main = async (event, context) => {
  let randomCharacters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
  let rturn="";
  for (let i=0;i<10;i++) {
    rturn += randomCharacters.charAt(Math.floor(Math.random() * randomCharacters.length));
  }
  return {
    data: rturn,
  };
}