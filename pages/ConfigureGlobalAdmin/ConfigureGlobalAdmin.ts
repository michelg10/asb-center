interface componentDataInterface {
  userId: string,
  adminEnabled: boolean,
  canAddAdmin: boolean,
  canIssueTicket: boolean,
  canIssueTicketToGuest: boolean,
  name: string,
  db: DB.Database,
  modFeedback: string,
  modFeedbackClass: string,
  isWorking: boolean,
};
Component({
  /**
   * Component properties
   */
  properties: {

  },

  /**
   * Component initial data
   */
  data: {} as componentDataInterface,

  /**
   * Component methods
   */
  methods: {
    addConfigure: function() {
      if (this.data.isWorking) return;
      this.data.isWorking=true;
      wx.cloud.callFunction({
        name: "ConfigureGlobalAdmin",
        data: {
          userId: this.data.userId,
          isAdmin: this.data.adminEnabled,
          canAddAdmin: this.data.canAddAdmin,
          canIssueTicket: this.data.canIssueTicket,
          canIssueTicketToGuest: this.data.canIssueTicketToGuest,
          name: this.data.name,
        }
      }).then((res) => {
        this.data.isWorking=false;
        if ((res.result as any).status === "success") {
          wx.navigateBack();
        } else {
          this.setData({
            modFeedback: (res.result as any).reason,
            modFeedbackClass: "button-feedback-warn-text"
          });
        }
      });
    },
    adminNameInputUpdate: function(x: any) {
      this.setData({
        name: x.detail.value,
      });
    },
    assignNewAdminTap: function() {
      this.setData({
        canAddAdmin: !this.data.canAddAdmin,
      });
    },
    adminTap: function() {
      this.setData({
        adminEnabled: !this.data.adminEnabled,
      });
    },
    ticketTap: function() {
      this.setData({
        canIssueTicket: !this.data.canIssueTicket,
      });
    },
    ticketToGuestTap: function() {
      this.setData({
        canIssueTicketToGuest: !this.data.canIssueTicketToGuest,
      });
    },
    onLoad: async function() {
      this.data.db = wx.cloud.database();
      const eventChannel = this.getOpenerEventChannel();
      eventChannel.on('userId', async (data: string) => {
        this.data.userId = data;
        let getAdminData = await this.data.db.collection('admins').where({
          userId: data,
        }).get();
        if (getAdminData.data.length === 0) {
          this.setData({
            adminEnabled: false,
            canIssueTicket: false,
            canIssueTicketToGuest: false,
            canAddAdmin: false,
            name: "",
          });
        } else {
          this.setData({
            adminEnabled: true,
            canIssueTicket: getAdminData.data[0].canIssueTicket,
            canIssueTicketToGuest: getAdminData.data[0].canIssueTicketToGuest,
            canAddAdmin: getAdminData.data[0].canAddAdmin,
            name: getAdminData.data[0].adminName,
          });
        }
      });
    }
  }
})
