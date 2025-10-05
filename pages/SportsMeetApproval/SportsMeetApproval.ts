import { database } from "wx-server-sdk";
import allCollectionsData from "../../utils/allCollectionsData";

// pages/SportsMeetApproval/SportsMeetApproval.ts
type activityLog = {
  _id: string,
  eventId: string,
  eventName: string,
  issuerId: string,
  issuerName: string,
  userId: string,
  stampNumber: number,
  pointNumber: number,
  studentNickname: string,
  timeStamp: number,
  reason: string
};

interface componentDataInterface {
  db: DB.Database,
  logs: activityLog[],
  isWaiting: boolean,
  isAdmin: boolean
};
Component({
    /**
     * Component properties
     */
    properties: {

    },

    /**
     * Page initial data
     */
    data: {} as componentDataInterface,

    /**
     * Lifecycle function--Called when page load
     */
    methods: {
      onLoad: function() {
        this.data.db = wx.cloud.database();
        const eventChannel = this.getOpenerEventChannel();
        eventChannel.on('canAddAdmin', async (data: boolean) => {
          this.setData({
            isAdmin: data,
          });
          if (this.data.isAdmin) {
            let newLogs: activityLog[] = [];
            let databaseLogs = await allCollectionsData(this.data.db, "SportsMeetStampLogSuspicious");
            for (let i = 0; i < databaseLogs.data.length; i++) {
              newLogs.push({
                _id: databaseLogs.data[i]._id,
                eventId: databaseLogs.data[i].eventId,
                eventName: databaseLogs.data[i].eventName,
                issuerId: databaseLogs.data[i].issuerId,
                issuerName: databaseLogs.data[i].issuerName,
                userId: databaseLogs.data[i].userId,
                stampNumber: databaseLogs.data[i].stampNumber,
                pointNumber: databaseLogs.data[i].pointNumber,
                studentNickname: databaseLogs.data[i].studentNickname,
                timeStamp: databaseLogs.data[i].timeStamp,
                reason: databaseLogs.data[i].reason
              })
            }
            this.setData({
              logs: newLogs,
            });
          }
        });
      },
  
      buttonTapVibrate: function() {
        wx.vibrateShort({
          type: "medium"
        });
      },
  
      backButtonTapped: function() {
        wx.vibrateShort({
          type: "light"
        });
        wx.navigateBack();
      },

      approveLog: function(x: any) {
        if (this.data.isWaiting) {
          return;
        }
        this.data.isWaiting = true;
        wx.showLoading({
          title: "Loading...",
          mask: true
        })
        wx.showModal({
          title: "Confirm Approval",
          content: "Are you sure you want to APPROVE this activity log? This action is not reversible.",
          confirmText: "Confirm",
          cancelText: "Cancel",
          success: async (res) => {
            if (res.confirm) {
              await wx.cloud.callFunction({
                name: "SportsMeetResolvePending",
                data: {
                  log: this.data.logs[x.currentTarget.dataset.itemindex],
                  approve: true
                }
              }).then(async () => {
                let newLogs: activityLog[] = [];
                let databaseLogs = await allCollectionsData(this.data.db, "SportsMeetStampLogSuspicious");
                for (let i = 0; i < databaseLogs.data.length; i++) {
                  newLogs.push({
                    _id: databaseLogs.data[i]._id,
                    eventId: databaseLogs.data[i].eventId,
                    eventName: databaseLogs.data[i].eventName,
                    issuerId: databaseLogs.data[i].issuerId,
                    issuerName: databaseLogs.data[i].issuerName,
                    userId: databaseLogs.data[i].userId,
                    stampNumber: databaseLogs.data[i].stampNumber,
                    pointNumber: databaseLogs.data[i].pointNumber,
                    studentNickname: databaseLogs.data[i].studentNickname,
                    timeStamp: databaseLogs.data[i].timeStamp,
                    reason: databaseLogs.data[i].reason
                  })
                }
                this.setData({
                  logs: newLogs,
                });
              })
            }
          }
        })
        this.data.isWaiting = false;
        wx.hideLoading();
      },
      denyLog: function(x: any) {
        if (this.data.isWaiting) {
          return;
        }
        this.data.isWaiting = true;
        wx.showLoading({
          title: "Loading...",
          mask: true
        })
        wx.showModal({
          title: "Confirm Denial",
          content: "Are you sure you want to DENY this activity log? This action is not reversible.",
          confirmText: "Confirm",
          cancelText: "Cancel",
          success: async (res) => {
            if (res.confirm) {
              await wx.cloud.callFunction({
                name: "SportsMeetResolvePending",
                data: {
                  log: this.data.logs[x.currentTarget.dataset.itemindex],
                  approve: false
                }
              }).then(async () => {
                let newLogs: activityLog[] = [];
                let databaseLogs = await allCollectionsData(this.data.db, "SportsMeetStampLogSuspicious");
                for (let i = 0; i < databaseLogs.data.length; i++) {
                  newLogs.push({
                    _id: databaseLogs.data[i]._id,
                    eventId: databaseLogs.data[i].eventId,
                    eventName: databaseLogs.data[i].eventName,
                    issuerId: databaseLogs.data[i].issuerId,
                    issuerName: databaseLogs.data[i].issuerName,
                    userId: databaseLogs.data[i].userId,
                    stampNumber: databaseLogs.data[i].stampNumber,
                    pointNumber: databaseLogs.data[i].pointNumber,
                    studentNickname: databaseLogs.data[i].studentNickname,
                    timeStamp: databaseLogs.data[i].timeStamp,
                    reason: databaseLogs.data[i].reason
                  })
                }
                this.setData({
                  logs: newLogs,
                });
              })
            }
          }
        })
        this.data.isWaiting = false;
        wx.hideLoading();
      }
    }
})