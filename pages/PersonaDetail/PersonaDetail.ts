import allCollectionsData from "../../utils/allCollectionsData";

type SMEventType = {
  wxId: string,
  allowStamps: boolean;
  id: string,
  name: string,
  rankLeaderboard: boolean,
}
type SMItemsType = {
  wxId: string,
  cost: number,
  id: string,
  name: string,
};
type UserDataType = {
  _id: string,
  info: any,
  studentId: string,
  userId: string,
  student: {
    _id: string,
    chineseName: string,
    englishName: string,
    nickname: string,
    grade: number,
    class: number,
  }
}
// pages/PersonaDetail/PersonaDetail.ts
type LogType = {
  _id: string,
  eventId: string,
  eventName: string,
  issuerId: string,
  issuerName: string,
  pointNumber: null|number,
  stampNumber: null|number,
  userId: string,
};
type PurchaseLogType = {
  userId: string,
  issuerId: string,
  issuerName: string,
  itemId: string,
  itemName: string,
  itemCost: number,
  _id: string,
};
type AdminStatusType = {
  wxId: string,
  adminId: string,
  canDeleteAll: boolean,
  canDoPurchase: boolean,
  name: string,
}
interface componentDataInterface {
  myId: string,
  adminStatus: AdminStatusType,
  userId: string,
  db: DB.Database,
  events: SMEventType[],
  items: SMItemsType[],
  userData: UserDataType,
  selectedEventIndex: number,
  eventSelectorOpen: boolean,
  canDoPurchase: boolean,
  canDeleteAll: boolean,
  logWatcher: DB.RealtimeListener,
  purchaseWatcher: DB.RealtimeListener,
  logs: LogType[],
  purchaseLogs: PurchaseLogType[],
  stampValue: number,
  pointValue: number,
  isWaiting: boolean,
  logAddFeedback: string,
  logAddFeedbackClass: string,
  totalStamps: number,
  usedStamps: number,
  selectedPurchaseItemIndex: number,
  purchaseSelectorOpen: boolean,
  purchaseButtonClass: string,
  purchaseHintText: string,
  purchaseHintClass: string,
  pastLogDeletionError: string,
  exchangeLogDeletionError: string,
}

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
    stampValueBind: function(x:any) {
      let textFieldValue:string = x.detail.value;
      let value: number = Number.parseInt(textFieldValue);
      if (value===NaN) {
        value=0;
      }
      if (value<0) {
        value=0;
      }
      this.setData({
        stampValue: value,
      })
    },
    pointValueBind: function(x:any) {
      let textFieldValue:string = x.detail.value;
      let value: number = Number.parseInt(textFieldValue);
      if (value===NaN) {
        value=0;
      }
      if (value<0) {
        value=0;
      }
      this.setData({
        pointValue: value,
      })
    },
    deleteActivityLog: function(x: any) {
      if (this.data.isWaiting) {
        return;
      }
      this.data.isWaiting = true;
      wx.cloud.callFunction({
        name: "SportsMeet2021DeleteActivityLog",
        data: {
          deleteLogId: this.data.logs[x.currentTarget.dataset.itemindex]._id,
          logGrade: this.data.userData.student.grade,
        }
      }).then((res) => {
        let result: any = res.result;
        if (result.status !== "success") {
          this.setData({
            pastLogDeletionError: result.reason,
          });
        } else {
          this.setData({
            pastLogDeletionError: "",
          });
        }
        this.data.isWaiting = false;
      })
    },
    deleteExchangeLog: function(x: any) {
      console.log("hi");
      if (this.data.isWaiting) {
        return;
      }
      this.data.isWaiting = true;
      wx.cloud.callFunction({
        name: "SportsMeet2021DeleteExchangeLog",
        data: {
          deleteLogId: this.data.purchaseLogs[x.currentTarget.dataset.itemindex]._id,
          logGrade: this.data.userData.student.grade,
        }
      }).then((res) => {
        let result: any = res.result;
        if (result.status !== "success") {
          this.setData({
            exchangeLogDeletionError: result.reason,
          });
        } else {
          this.setData({
            exchangeLogDeletionError: "",
          });
        }
        this.data.isWaiting = false;
      })
    },
    updateCanAfford: function() {
      if (this.data.selectedPurchaseItemIndex === undefined || this.data.selectedPurchaseItemIndex === -1) {
        return;
      }
      if (this.data.totalStamps === undefined || this.data.usedStamps === undefined) {
        return;
      }
      if (this.data.items[this.data.selectedPurchaseItemIndex].cost<=this.data.totalStamps-this.data.usedStamps) {
        this.setData({
          purchaseButtonClass: "purchase-button-can-buy",
          purchaseHintClass: "",
          purchaseHintText: "",
        });
      } else {
        this.setData({
          purchaseButtonClass: "purchase-button-cannot-buy",
          purchaseHintClass: "button-feedback-warn-text",
          purchaseHintText: "User balance insufficient",
        })
      }
    },
    handleActivityOptionClick: function(x:any) {
      let optionClickedIndex=x.currentTarget.dataset.itemindex;
      this.setData({
        selectedEventIndex: optionClickedIndex,
        eventSelectorOpen: false,
        stampValue: 0,
        pointValue: 0,
      });
    },
    handlePurchaseOptionClick: function(x: any) {
      let optionClickedIndex=x.currentTarget.dataset.itemindex;
      this.setData({
        selectedPurchaseItemIndex: optionClickedIndex,
        purchaseSelectorOpen: false,
      });
      this.updateCanAfford();
    },
    addActivityLog: function() {
      if (this.data.isWaiting) return;
      this.data.isWaiting = true;
      wx.cloud.callFunction({
        name: "SportsMeet2021AddActivityLog",
        data: {
          userId: this.data.userId,
          eventId: this.data.events[this.data.selectedEventIndex].id,
          stampValue: this.data.stampValue,
          pointValue: this.data.pointValue,
        }
      }).then((res) => {
        this.data.isWaiting=false;
        let logAddFeedback = "";
        let result: any = res.result;
        let logAddClass = "";
        if (result.status === "success") {
          logAddFeedback = `Added log (${Math.floor(Math.random()*100000)})`;
          logAddClass = "button-feedback-success-text";
        } else {
          logAddFeedback = result.reason;
          logAddClass = "button-feedback-warn-text";
        }
        this.setData({
          stampValue: 0,
          pointValue: 0,
          logAddFeedback: logAddFeedback,
          logAddFeedbackClass: logAddClass,
        });
      });
    },
    purchaseButtonTapped: function() {
      if (this.data.isWaiting) {
        return;
      }
      this.data.isWaiting = true;
      wx.cloud.callFunction({
        name: "SportsMeet2021DoPurchase",
        data: {
          userId: this.data.userId,
          itemId: this.data.items[this.data.selectedPurchaseItemIndex].id,
        }
      }).then((res) => {
        this.data.isWaiting = false;
        let result: any = res.result;
        if (result.status === "success") {
          this.setData({
            purchaseHintText: `Exchange successful (${Math.floor(Math.random()*100000)})`,
            purchaseHintClass: "button-feedback-success-text",
          });
        } else {
          this.setData({
            purchaseHintText: result.reason,
            purchaseHintClass: "button-feedback-warn-text",
          });
        }
      })
    },
    mainSelectorClicked: function() {
      if (this.data.eventSelectorOpen) {
        this.setData({
          eventSelectorOpen: false,
        });
      } else {
        this.setData({
          eventSelectorOpen: true,
        });
      }
    },
    purchaseSelectorClicked: function() {
      if (this.data.purchaseSelectorOpen) {
        this.setData({
          purchaseSelectContainerClass: "main-select-container",
          purchaseSelectorOpen: false,
        });
      } else {
        this.setData({
          purchaseSelectContainerClass: "main-select-container main-select-container-open",
          purchaseSelectorOpen: true,
        });
      }
    },
    onLoad: async function() {
      const eventChannel = this.getOpenerEventChannel();
      this.setData({
        mainSelectContainerClass: "main-select-container",
        eventSelectorOpen: false,
        stampValue: 0,
        pointValue: 0,
        purchaseSelectContainerClass: "main-select-container",
        purchaseSelectorOpen: false,
      });
      this.data.db = wx.cloud.database();
      this.data.db.collection("userData").where({
        "userId": '{openid}',
      }).get().then((res) => {
        if (res.data.length === 0) {
          // this error literally makes no sense but just in case i do something dumb
          console.log("Current user not registered!");
        }
        this.setData({
          myId: res.data[0]._id as string,
        });
        // now fetch admin status
        this.data.db.collection("SportsMeet2021Admin").where({
          adminId: res.data[0]._id,
        }).get().then((adminRes) => {
          if (res.data.length === 0) {
            console.log("Current user is not admin!");
            this.setData({
              adminStatus: {
                wxId: adminRes.data[0]._id as string,
                adminId: adminRes.data[0].adminId,
                canDeleteAll: adminRes.data[0].canDeleteAll,
                canDoPurchase: adminRes.data[0].canDoPurchase,
                name: adminRes.data[0].name,
              }
            });
          }
        });
      });
      eventChannel.on('userId', (data: string) => {
        this.setData({
          userId: data,
        });
        wx.cloud.callFunction({
          name: "fetchUserInformation",
          data: {
            userId: data,
          }
        }).then((res) => {
          if (res === undefined) {
            wx.navigateBack();
          }
          let studentResult = (res.result as AnyObject).data;
          if (studentResult === {}) {
            wx.navigateBack();
          }
          this.setData({
            userData: studentResult,
          });
          // monitor log (main, transaction)
          this.data.logWatcher = this.data.db.collection(`SportsMeet2021StampLog${studentResult.student.grade}`).where({
            userId: data,
          }).watch({
            onChange: (snapshot) => {
              let newLogs: LogType[]=[];
              for (let i=0;i<snapshot.docs.length;i++) {
                newLogs.push({
                  _id: snapshot.docs[i]._id as string,
                  issuerId: snapshot.docs[i].issuerId,
                  issuerName: snapshot.docs[i].issuerName,
                  userId: snapshot.docs[i].userId,
                  eventId: snapshot.docs[i].eventId,
                  eventName: snapshot.docs[i].eventName,
                  pointNumber: snapshot.docs[i].pointNumber === undefined ? null : snapshot.docs[i].pointNumber,
                  stampNumber: snapshot.docs[i].stampNumber === undefined ? null : snapshot.docs[i].stampNumber,
                });
              }
              let newTotalStamps = 0;
              let hasAStickerMap = new Map();
              for (let i=0;i<newLogs.length;i++) {
                if (!hasAStickerMap.has(newLogs[i].eventId)) {
                  newTotalStamps+=5; // new sticker!
                  hasAStickerMap.set(newLogs[i].eventId, true);
                }
                newTotalStamps+=(newLogs[i].stampNumber === null ? 0 : newLogs[i].stampNumber as number);
              }
              this.setData({
                totalStamps: newTotalStamps,
                logs: newLogs,
              });
              this.updateCanAfford();
            },
            onError: function(err) {
              console.error('the stamp log watch closed because of error', err);
            }
          });
          this.data.purchaseWatcher = this.data.db.collection(`SportsMeet2021TransactionLog${studentResult.student.grade}`).where({
            userId: data,
          }).watch({
            onChange: (snapshot) => {
              let newPurchaseLog: PurchaseLogType[] = [];
              for (let i=0;i<snapshot.docs.length;i++) {
                newPurchaseLog.push(snapshot.docs[i]);
              }
              let newUsedStamps = 0;
              for (let i=0;i<newPurchaseLog.length;i++) {
                newUsedStamps+=newPurchaseLog[i].itemCost;
              }
              this.setData({
                usedStamps: newUsedStamps,
                purchaseLogs: newPurchaseLog,
              });
              this.updateCanAfford();
            },
            onError: function(err) {
              console.error('the purchase log watch closed because of error', err);
            }
          })
        })
      });
      // fetch event, item database
      allCollectionsData(this.data.db, "SportsMeet2021Events").then((res) => {
        let events: SMEventType[] = [];
        let data = res.data;
        for (let i=0;i<data.length;i++) {
          events.push({
            wxId: data[i]._id as string,
            allowStamps: data[i].allowStamps,
            id: data[i].id,
            name: data[i].name,
            rankLeaderboard: data[i].rankLeaderboard,
          });
        }
        this.setData({
          events: events,
          selectedEventIndex: 0,
        });
      });
      allCollectionsData(this.data.db, "SportsMeet2021Items").then((res) => {
        let items: SMItemsType[] = [];
        let data = res.data;
        for (let i=0;i<data.length;i++) {
          items.push({
            wxId: data[i]._id as string,
            cost: data[i].cost,
            id: data[i].id,
            name: data[i].name,
          });
        }
        this.setData({
          items: items,
          selectedPurchaseItemIndex: 0,
        });
        this.updateCanAfford();
      });
      this.data.db.collection("userData").where({
        userId: '{openid}',
      }).get().then((res) => {
        this.data.db.collection("SportsMeet2021Admin").where({
          adminId: res.data[0]._id,
        }).get().then((res) => {
          let canDeleteAll = false;
          let canDoPurchase = false;
          if (res.data[0].canDeleteAll) {
            canDeleteAll = true;
          }
          if (res.data[0].canDoPurchase) {
            canDoPurchase = true;
          }
          this.setData({
            canDeleteAll: canDeleteAll,
            canDoPurchase: canDoPurchase,
          });
        })
      });
    },
    onUnload: function() {
      this.data.logWatcher.close();
      this.data.purchaseWatcher.close();
    }
  }
})
