// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
    env: 'asc-5gg4yr483fce21b4',
});

let db = cloud.database();
// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  let getUserAccount = await db.collection("userData").where({
    userId: wxContext.OPENID,
  }).get();
  if (getUserAccount.data.length === 0) {
    return {
      status: "failure",
      reason: "Unknown user!"
    };
  }
  let getAdminAccount = await db.collection("SportsMeetAdmin").where({
    adminId: getUserAccount.data[0]._id,
  }).get();
  if (getAdminAccount.data.length === 0) {
    return {
      status: "failure",
      reason: "No admin permissions"
    };
  }
  if (getAdminAccount.data[0].canAddAdmin !== true) {
    return {
      status: "failure",
      reason: "No permissions to add admins"
    };
  }
  let getCurrentAdminStatus = await db.collection("SportsMeetAdmin").where({
    adminId: event.userId,
  }).get();
  let currentlyIsAdmin = (getCurrentAdminStatus.data.length !== 0);
  let currentAdminEntryWxId = "";
  if (currentlyIsAdmin) {
    currentAdminEntryWxId = getCurrentAdminStatus.data[0]._id;
  }
  if (event.isAdmin) {
    let databaseSetObj = {
      adminId: event.userId,
      canAddAdmin: event.canAddAdmin,
      canDeleteAll: event.canDeleteAll,
      canDoPurchase: event.canDoPurchase,
      name: event.name,
    };
    if (currentlyIsAdmin) {
      await db.collection("SportsMeetAdmin").doc(currentAdminEntryWxId).update({
        data: databaseSetObj,
      });
    } else {
      await db.collection("SportsMeetAdmin").add({
        data: databaseSetObj,
      });
    }
  } else {
    if (currentlyIsAdmin) {
      await db.collection("SportsMeetAdmin").doc(currentAdminEntryWxId).remove();
    }
  }
  return {
    status: "success",
  }
}