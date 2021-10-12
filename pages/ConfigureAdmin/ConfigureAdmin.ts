// pages/ConfigureAdmin/ConfigureAdmin.ts
interface componentDataInterface {
  userId: string,
  adminEnabled: boolean,
  canDoPurchase: boolean,
  canAddAdmin: boolean,
  canDeleteAll: boolean,
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
        name: "SportsMeet2021ConfigureAdmin",
        data: {
          userId: this.data.userId,
          isAdmin: this.data.adminEnabled,
          canAddAdmin: this.data.canAddAdmin,
          canDeleteAll: this.data.canDeleteAll,
          canDoPurchase: this.data.canDoPurchase,
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
    deleteTap: function() {
      this.setData({
        canDeleteAll: !this.data.canDeleteAll,
      });
    },
    purchasesTap: function() {
      this.setData({
        canDoPurchase: !this.data.canDoPurchase,
      });
    },
    onLoad: async function() {
      this.data.db = wx.cloud.database();
      const eventChannel = this.getOpenerEventChannel();
      eventChannel.on('userId', async (data: string) => {
        let getAdminData = await this.data.db.collection('SportsMeet2021Admin').where({
          adminId: data,
        }).get();
        if (getAdminData.data.length === 0) {
          this.setData({
            adminEnabled: false,
            canDeleteAll: false,
            canDoPurchase: false,
            canAddAdmin: false,
            name: "",
          });
        } else {
          this.setData({
            adminEnabled: true,
            canDeleteAll: getAdminData.data[0].canDeleteAll,
            canDoPurchase: getAdminData.data[0].canDoPurchase,
            canAddAdmin: getAdminData.data[0].canAddAdmin,
            name: getAdminData.data[0].name,
          });
        }
      });
    }
  }
})
