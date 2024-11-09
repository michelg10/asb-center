import CacheSingleton from "../../classes/CacheSingleton";
import { handleAnyTicketCode } from "../../utils/handleAnyTicketCode";

interface componentDataInterface {
  db: DB.Database,
  cacheSingleton: CacheSingleton,
  adminStatus: AdminStatusType,
  userOpenId: string,
  ticketId: string,
  ticketStatus: string,
  holderStatus: boolean,
  holderStatusClass: string,
  holderUserId: string,
  holderName: string,
  holderGrade: number,
  holderClass: number,
  dinnerSelectionClass: string,
  dinnerSelection: string,
  cheese: boolean | false,
  fish: boolean | false,
};
type AdminStatusType = {
  wxId: string,
  userId: string,
  canIssueTicket: boolean,
  canIssueTicketToGuest: boolean,
  canAddAdmin: boolean,
  adminName: string,
};
Component({

  /**
   * Page initial data
   */
  data: {} as componentDataInterface,

  methods: {
    onLoad: function() {
      this.data.db = wx.cloud.database();
      const eventChannel = this.getOpenerEventChannel();
      eventChannel.on('ticketId', async (ticketId: string) => {
        this.setData({
          ticketId: ticketId,
        });
        let getTicketStatus = await this.data.db.collection("BlackoutTickets").where({
          ticketId: this.data.ticketId,
        }).get();
        this.setData({
          ticketStatus: getTicketStatus.data[0].status,
          holderStatus: getTicketStatus.data[0].entry,
          holderUserId: getTicketStatus.data[0].userId,
        })
        if (this.data.holderStatus === true){
          this.setData({
            holderStatusClass: "Lost",
          })
        }
        else {
          this.setData({
            holderStatusClass: "Available",
          })
        }
        let getHolderInfo = await this.data.db.collection("studentData").where({
          _id: this.data.holderUserId
        }).get();
        if (getTicketStatus.data[0].status!=="Available"){
          if (getHolderInfo.data.length===0){
            let getHolderLostInfo = await this.data.db.collection("studentData").where({
              _id: this.data.holderUserId.substring(0,this.data.holderUserId.length-4)
            }).get();
            this.setData({
              holderName: getHolderLostInfo.data[0].nickname,
              holderGrade: getHolderLostInfo.data[0].grade,
              holderClass: getHolderLostInfo.data[0].class
            })
          }
          else{
            this.setData({
              holderName: getHolderInfo.data[0].nickname,
              holderGrade: getHolderInfo.data[0].grade,
              holderClass: getHolderInfo.data[0].class
            })
          }
        }
        this.data.cacheSingleton = CacheSingleton.getInstance();
        this.data.userOpenId = await this.data.cacheSingleton.fetchUserOpenId();
        // now fetch admin status
        let accessingUserId = await this.data.db.collection("userData").where({
          userId: this.data.userOpenId,
        }).get();
        if (accessingUserId.data.length === 0) {
          // this error literally makes no sense but just in case i do something dumb
          console.log("Current user not registered!");
          wx.navigateBack();
          return;
        }
        this.setData({
          accessingUserId: accessingUserId.data[0]._id as string,
        });
        let checkAdmin = await this.data.db.collection("admins").where({
          userId: this.data.accessingUserId,
        }).get();
        if (checkAdmin.data.length === 0) {
          console.log("Current user is not admin!");
          wx.navigateBack();
          return;
        }
        this.setData({
          adminStatus: {
            wxId: checkAdmin.data[0]._id as string,
            userId: checkAdmin.data[0].userId,
            canIssueTicket: checkAdmin.data[0].canIssueTicket,
            canIssueTicketToGuest: checkAdmin.data[0].canIssueTicketToGuest,
            canAddAdmin: checkAdmin.data[0].canAddAdmin,
            adminName: checkAdmin.data[0].adminName,
          }
        });
        if (getTicketStatus.data[0].status!=="Available"){
          let checkDinnerStatus = await this.data.db.collection("BlackoutStudentData").where({
            userId: getHolderInfo.data[0]._id
          }).get();
            if (checkDinnerStatus.data.length === 0 || checkDinnerStatus.data[0].dinnerOption===undefined){
              this.setData({
                dinnerSelection: "Not Selected",
                dinnerSelectionClass: "Lost",
              })
            }
            else {
              this.setData({
                dinnerSelection: checkDinnerStatus.data[0].dinnerOption,
                dinnerSelectionClass: "Available",
              })
            }
        }
      });
    },
    onShow: async function(){
      if (this.data.holderUserId!==undefined){
        await this.updateTicketStatus();
        this.onUpdateDinner();
      }
    },
    onPullDownRefresh: async function(){
      if (this.data.holderUserId!==undefined){
        await this.updateTicketStatus();
        this.onUpdateDinner();
      }
    },
    onUpdateDinner: async function(){
      let checkDinnerStatus = await this.data.db.collection("BlackoutStudentData").where({
        userId: this.data.holderUserId,
      }).get();
      if (checkDinnerStatus.data.length === 0 || checkDinnerStatus.data[0].dinnerOption===undefined){
        this.setData({
          dinnerSelection: "Not Selected",
          dinnerSelectionClass: "Lost",
        })
      }
      else {
        this.setData({
          dinnerSelection: checkDinnerStatus.data[0].dinnerOption,
          dinnerSelectionClass: "Available",
        })
      }
    },
    cheeseTap: function(){
      this.setData({
        cheese: true,
        fish: false,
      });
    },
    fishTap: function(){
      this.setData({
        fish: true,
        cheese: false
      });
    },
    onSaveDinner: async function(){
      let checkMeal = await this.data.db.collection("BlackoutStudentData").where({
        userId: this.data.holderUserId,
      }).get();
      if(checkMeal.data.length===0){
        if (this.data.cheese===true){
          await wx.cloud.callFunction({
            name: "AnyTicketSetStudentData",
            data: {
              type: "dinner",
              userId: this.data.holderUserId,
              dinnerOption: "Cheese"
            }
          })
          this.onUpdateDinner();
        }
        else if (this.data.fish===true){
          await wx.cloud.callFunction({
            name: "AnyTicketSetStudentData",
            data: {
              type: "dinner",
              userId: this.data.holderUserId,
              dinnerOption: "Fish"
            }
          })
          this.onUpdateDinner();
        }
        else{
          this.onUpdateDinner();
          wx.showModal({
            title: "Invalid Selection",
            content: "Please select a dinner option.",
            showCancel: false,
            confirmText: "Dismiss"
          })
        }
      }
      else{
        if (this.data.cheese===true){
          await wx.cloud.callFunction({
            name: "AnyTicketSetStudentData",
            data: {
              type: "dinnerModify",
              userId: this.data.holderUserId,
              dinnerOption: "Cheese"
            }
          })
          this.onUpdateDinner();
        }
        else if (this.data.fish===true){
          await wx.cloud.callFunction({
            name: "AnyTicketSetStudentData",
            data: {
              type: "dinnerModify",
              userId: this.data.holderUserId,
              dinnerOption: "Fish"
            }
          })
          this.onUpdateDinner();
        }
        else {
          this.onUpdateDinner();
          wx.showModal({
            title: "Invalid Selection",
            content: "Please select a dinner option.",
            showCancel: false,
            confirmText: "Dismiss"
          })
        }
      }
    },
    updateTicketStatus: async function(){
      let getTicketStatus = await this.data.db.collection("BlackoutTickets").where({
        ticketId: this.data.ticketId,
      }).get();
      this.setData({
        ticketStatus: getTicketStatus.data[0].status,
        holderStatus: getTicketStatus.data[0].entry,
        holderUserId: getTicketStatus.data[0].userId,
      })
      if (this.data.holderStatus === true){
        this.setData({
          holderStatusClass: "Lost",
        })
      }
      else {
        this.setData({
          holderStatusClass: "Available",
        })
      }
      let getHolderInfo = await this.data.db.collection("studentData").where({
        _id: this.data.holderUserId
      }).get();
      if (getHolderInfo.data.length===0){
        let getHolderLostInfo = await this.data.db.collection("studentData").where({
          _id: this.data.holderUserId.substring(0,this.data.holderUserId.length-4)
        }).get();
        this.setData({
          holderName: getHolderLostInfo.data[0].nickname,
          holderGrade: getHolderLostInfo.data[0].grade,
          holderClass: getHolderLostInfo.data[0].class
        })
      }
      else{
        this.setData({
          holderName: getHolderInfo.data[0].nickname,
          holderGrade: getHolderInfo.data[0].grade,
          holderClass: getHolderInfo.data[0].class
        })
      }
    },
    onIssueTicket: function(){
      wx.scanCode({
        onlyFromCamera: true,
        success: async (res) => {
          let parseCodeData = await handleAnyTicketCode(this.data.adminStatus.adminName, res.result);
          if (parseCodeData!=="invalid") {
            if(parseCodeData[0]==="userCode"){
              let checkStudentName = await this.data.db.collection("studentData").where({
                _id: parseCodeData[1].studentId,
              }).get();
              let checkTicketStatus = await this.data.db.collection("BlackoutTickets").where({
                userId: parseCodeData[1].studentId,
              }).get();
              console.log(checkTicketStatus)
              if (checkTicketStatus && checkTicketStatus.data.length!==0){
                wx.showModal({
                  title: "Code Scan Failure",
                  content: "User already holds a valid blackout ticket, unable to assign new ticket. If user has lost their original ticket, mark their ticket as lost first, before assigning new ticket.",
                  showCancel: false,
                  confirmText: "Dismiss"
                })
                return;
              }
              else {
                await wx.cloud.callFunction({
                  name: "AnyTicketIssueTicket",
                  data: {
                    type: "issue",
                    ticketId: this.data.ticketId,
                    issuerId: this.data.adminStatus.userId,
                    issuerName: this.data.adminStatus.adminName,
                    studentName: checkStudentName.data[0].uniqueNickname,
                    userId: parseCodeData[1].studentId
                  }
                })
                await this.updateTicketStatus();
                this.onUpdateDinner();
              }
            }
            else {
              wx.showModal({
                title: "Code Scan Failure",
                content: "Please scan Personal Code, not Ticket Code.",
                showCancel: false,
                confirmText: "Dismiss"
              })
            }
          }
        },
      })
    },
    onIssueTicketStation: async function(){
      wx.navigateTo({
        url: "/pages/StationModeAnyInput/StationModeAnyInput",
        success: (res) => {
          res.eventChannel.on("data", async (data) => {
            let parseCodeData = await handleAnyTicketCode(this.data.adminStatus.adminName, data);
            if (parseCodeData!=="invalid") {
              if(parseCodeData[0]==="userCode"){
                let checkStudentName = await this.data.db.collection("studentData").where({
                  _id: parseCodeData[1].studentId,
                }).get();
                let checkTicketStatus = await this.data.db.collection("BlackoutTickets").where({
                  userId: parseCodeData[1].studentId,
                }).get();
                console.log(checkTicketStatus)
                if (checkTicketStatus && checkTicketStatus.data.length!==0){
                  wx.showModal({
                    title: "Code Scan Failure",
                    content: "User already holds a valid blackout ticket, unable to assign new ticket. If user has lost their original ticket, mark their ticket as lost first, before assigning new ticket.",
                    showCancel: false,
                    confirmText: "Dismiss"
                  })
                  return;
                }
                else{
                  await wx.cloud.callFunction({
                    name: "AnyTicketIssueTicket",
                    data: {
                      type: "issue",
                      ticketId: this.data.ticketId,
                      issuerId: this.data.adminStatus.userId,
                      issuerName: this.data.adminStatus.adminName,
                      studentName: checkStudentName.data[0].uniqueNickname,
                      userId: parseCodeData[1].studentId
                    }
                  })
                  await this.updateTicketStatus();
                  this.onUpdateDinner();
                }
              }
              else {
                wx.showModal({
                  title: "Code Scan Failure",
                  content: "Please scan Personal Code, not Ticket Code.",
                  showCancel: false,
                  confirmText: "Dismiss"
                })
              }
            }
          })
        }
      })
    },
    onMarkTicket: async function() {
      await wx.cloud.callFunction({
        name: "AnyTicketUpdateStatus",
        data: {
          type: "entry",
          ticketId: this.data.ticketId,
          updateStatus: true
        }
      });
      await this.updateTicketStatus();
      this.onUpdateDinner();
    },
    onRevokeTicket: async function() {
      await wx.cloud.callFunction({
        name: "AnyTicketIssueTicket",
        data: {
          type: "revoke",
          ticketId: this.data.ticketId,
        }
      })
      await this.updateTicketStatus();
      this.onUpdateDinner();
    },
    onLostTicket: async function() {
      let newUserId = this.data.holderUserId.concat("LOST");
      await wx.cloud.callFunction({
        name: "AnyTicketUpdateStatus",
        data: {
          type: "lost",
          ticketId: this.data.ticketId,
          updateStatus: "Lost",
          newUserId: newUserId
        }
      })
      await this.updateTicketStatus();
      this.onUpdateDinner();
    },
    onRecoverTicket: async function() {
      let newUserId = this.data.holderUserId.substring(0,this.data.holderUserId.length-4);
      await wx.cloud.callFunction({
        name: "AnyTicketUpdateStatus",
        data: {
          type: "lost",
          ticketId: this.data.ticketId,
          updateStatus: "Issued",
          newUserId: newUserId
        }
      })
      await this.updateTicketStatus();
      this.onUpdateDinner();
    },
    onIssueTicketToGuest: function(){
      if (this.data.ticketStatus==="Available" && this.data.adminStatus.canIssueTicketToGuest){
        wx.showModal({
          title: "Issue as Guest Ticket",
          content: "Confirm to issue as a guest ticket? Guest tickets are not linked to a student, and thus cannot be operated on again after leaving this page. Be sure to select the guest's meal option immediately.",
          success: async (res) => {
            if (res.confirm){
              await wx.cloud.callFunction({
                name: "AnyTicketIssueTicket",
                data: {
                  type: "issue",
                  ticketId: this.data.ticketId,
                  issuerId: this.data.adminStatus.userId,
                  issuerName: this.data.adminStatus.adminName,
                  studentName: "Guest",
                  userId: "GUEST".concat(Math.floor(Math.random() * (99999999 - 10000000 + 1) + 10000000).toString())
                }
              })
              await this.updateTicketStatus();
              this.onUpdateDinner();
            }
          },
        })
      }
    }
  }
})