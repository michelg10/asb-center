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
  entryStatus: boolean
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
          console.log("Current user is not admin!");
          wx.navigateBack();
          return;
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
    },
    handleTicketScan: function(){
      this.onClear();
      wx.scanCode({
        onlyFromCamera: true,
        success: async (res) => {
          let parseCodeData = await handleAnyTicketCode(this.data.adminStatus.adminName, res.result);
          if (parseCodeData!=="invalid") {
            if(parseCodeData[0]==="ticketCode"){
              let checkTicket = await this.data.db.collection("BlackoutTickets").where({
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
                  ticketResponseClass: "check"
                })
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
                if (checkTicketHolderAbnormal && checkTicketHolderAbnormal.data.length!==0){
                  this.setData({
                    holderGrade: checkTicketHolderAbnormal.data[0].grade,
                    holderClass: checkTicketHolderAbnormal.data[0].class
                  })
                }
              }
            }
            else {
              wx.showModal({
                title: "Code Scan Failure",
                content: "Please scan Ticket Code, not Personal Code.",
                showCancel: false,
                confirmText: "Dismiss"
              })
            }
          }
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
    }
  }
})