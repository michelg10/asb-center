import { handleAnyTicketCode } from "../../utils/handleAnyTicketCode";

interface componentDataInterface {
  db: DB.Database,
  adminStatus: AdminStatusType,
  checkTicketResponse: boolean | false,
  adminId: string,
  ticketResponseClass: string | undefined,
  ticketId: string,
  ticketStatus: string,
  holderName: string | undefined,
  holderGrade: number,
  holderClass: number,
  entryStatus: boolean,
  issuedCount: number,
  entryCount: number
};
type AdminStatusType = {
  wxId: string,
  userId: string,
  canIssueTicket: boolean,
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
      eventChannel.on('myId', async (data) => {
        this.setData({
            adminId: data,
        });
        let checkAdmin = await this.data.db.collection("admins").where({
          userId: data,
        }).get();
        if (checkAdmin.data.length === 0) {
          wx.showModal({
            title: "Access Denied",
            content: "Sorry, you currently do not have access to this event.",
            showCancel: false,
            confirmText: "Return",
            success: (res) => {
              if (res.confirm) {
                wx.navigateBack();
                return;
              }
            }
          })
        }
        this.setData({
          adminStatus: {
            wxId: checkAdmin.data[0]._id as string,
            userId: checkAdmin.data[0].userId,
            canIssueTicket: checkAdmin.data[0].canIssueTicket,
            canAddAdmin: checkAdmin.data[0].canAddAdmin,
            adminName: checkAdmin.data[0].adminName,
          }
        });
      })
      this.updateCount();
    },
    updateCount: async function() {
      wx.showLoading({
        title: "Updating...",
        mask: true,
      });
      this.onClear();
      await wx.cloud.callFunction({
        name: 'AnyTicketUpdateStatus',  // Replace with your actual function name
        data: {
          type: "updateCount"
        }
      }).then(res => {
        const { issued, entry } = res.result as { issued: number, entry: number };
        this.setData({
          issuedCount: issued,
          entryCount: entry
        });
      });
      wx.hideLoading();
    },
    handleTicketScan: function(){
      this.onClear();
      wx.scanCode({
        onlyFromCamera: true,
        success: async (res) => {
          wx.showLoading({
            title: "Loading...",
            mask: true,
          });
          let parseCodeData = await handleAnyTicketCode(this.data.adminStatus.adminName, res.result);
          if (parseCodeData!=="invalid") {
            if(parseCodeData[0]==="ticketCode"){
              let checkTicket = await this.data.db.collection("TedXTickets").where({
                ticketId: parseCodeData[1],
              }).get();
              let checkTicketHolder = await this.data.db.collection("studentData").where({
                _id: checkTicket.data[0].userId,
              }).get();
              let checkTicketHolderAbnormal = await this.data.db.collection("studentData").where({
                _id: checkTicket.data[0].userId.substring(0,checkTicket.data[0].userId.length-4),
              }).get();
              if (checkTicket.data[0].status==="Issued" && checkTicket.data[0].entry===false){
                await wx.cloud.callFunction({
                  name: "AnyTicketUpdateStatus",
                  data: {
                    type: "entry",
                    ticketId: parseCodeData[1],
                    updateStatus: true
                  }
                });
                this.setData({
                  ticketId: parseCodeData[1],
                  ticketStatus: checkTicket.data[0].status,
                  holderName: checkTicket.data[0].studentName,
                  entryStatus: checkTicket.data[0].entry,
                  checkTicketResponse: true,
                  ticketResponseClass: "check",
                  entryCount: this.data.entryCount += 1
                })
                wx.hideLoading();
                if (checkTicketHolder && checkTicketHolder.data.length!==0){
                  this.setData({
                    holderGrade: checkTicketHolder.data[0].grade,
                    holderClass: checkTicketHolder.data[0].class
                  })
                }
              } else{
                this.setData({
                  ticketId: parseCodeData[1],
                  ticketStatus: checkTicket.data[0].status,
                  holderName: checkTicket.data[0].studentName,
                  entryStatus: checkTicket.data[0].entry,
                  checkTicketResponse: true,
                  ticketResponseClass: "cross"
                })
                wx.hideLoading();
                if (checkTicketHolderAbnormal && checkTicketHolderAbnormal.data.length!==0){
                  this.setData({
                    holderGrade: checkTicketHolderAbnormal.data[0].grade,
                    holderClass: checkTicketHolderAbnormal.data[0].class
                  })
                }
              }
            }
            else {
              wx.hideLoading();
              wx.showModal({
                title: "Code Scan Failure",
                content: "Please scan Ticket Code, not Personal Code.",
                showCancel: false,
                confirmText: "Dismiss"
              })
            }
          }
          wx.hideLoading();
        },
        fail: () => {
          wx.showModal({
            title: "Code Scan Failure",
            content: "User interrupted code scanning procedure.",
            showCancel: false,
            confirmText: "Dismiss"
          })
        }
      })
    },
    onClear: function(){
      this.setData({
        holderName: "",
        holderGrade: 0,
        holderClass: 0,
        checkTicketResponse: false,
        ticketResponseClass: "",
      })
    },
    onShow: function() {
      this.onClear();
      this.updateCount();
    },
    stationClicked: function(){
      wx.navigateTo({
        url: "/pages/AnyTicketStationCheckTicket/AnyTicketStationCheckTicket",
        success: (res) => {
          res.eventChannel.emit("myId", this.data.adminId);
        }
      });
    },
  }
})