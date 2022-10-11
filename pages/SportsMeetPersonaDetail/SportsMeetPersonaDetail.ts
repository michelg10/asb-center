import allCollectionsData from "../../utils/allCollectionsData";

export type SMEventType = {
  wxId: string,
  allowStamps: boolean;
  id: string,
  name: string,
  rankLeaderboard: boolean,
  stampForExperience: number,
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
    pseudoId: string,
  }
}
// pages/SportsMeet2021PersonaDetail/SportsMeet2021PersonaDetail.ts
export type LogType = {
  _id: string,
  eventId: string,
  eventName: string,
  issuerId: string,
  issuerName: string,
  pointNumber: null|number,
  stampNumber: null|number,
  userId: string,
  studentNickname: string,
  timeStamp: number,
  studentGrade?: number
};
export type PurchaseLogType = {
  userId: string,
  issuerId: string,
  issuerName: string,
  itemId: string,
  itemName: string,
  itemCost: number,
  _id: string,
  studentNickname: string,
  timeStamp: number,
  studentGrade?: number,
};
type AdminStatusType = {
  wxId: string,
  adminId: string,
  canDeleteAll: boolean,
  canDoPurchase: boolean,
  canAddAdmin: boolean,
  name: string,
}
interface componentDataInterface {
  myId: string,
  adminStatus: AdminStatusType,
  accountIsPseudo: boolean,
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
  otherAccountLogs: LogType[]|null,
  stampValue: number,
  pointValue: number,
  isWaiting: boolean,
  logAddFeedback: string,
  logAddFeedbackClass: string,
  totalStamps: number,
  totalOtherAccountStamps: number|null,
  usedStamps: number,
  usedOtherAccountStamps: number|null,
  selectedPurchaseItemIndex: number,
  purchaseSelectorOpen: boolean,
  purchaseButtonClass: string,
  purchaseHintText: string,
  purchaseHintClass: string,
  pastLogDeletionError: string,
  exchangeLogDeletionError: string,
  userBalanceString: string,
  otherAccounts: number|null,
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
        name: "SportsMeetDeleteActivityLog",
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
      if (this.data.isWaiting) {
        return;
      }
      this.data.isWaiting = true;
      wx.cloud.callFunction({
        name: "SportsMeetDeleteExchangeLog",
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
      if (this.data.otherAccounts!>1) {
        return;
      }
      if (this.data.selectedPurchaseItemIndex === undefined || this.data.selectedPurchaseItemIndex === -1) {
        return;
      }
      if (this.data.totalStamps === undefined || this.data.usedStamps === undefined) {
        return;
      }
      let totalBalance = this.data.totalStamps+(this.data.totalOtherAccountStamps === null ? 0 : this.data.totalOtherAccountStamps);
      let totalSpent = this.data.usedStamps+(this.data.usedOtherAccountStamps === null ? 0 :this.data.usedOtherAccountStamps);
      this.setData({
        userBalanceString: `${totalBalance-totalSpent} stamps (total ${this.data.totalStamps}${this.data.totalOtherAccountStamps === null ? "" : ("+"+this.data.totalOtherAccountStamps)}, spent ${this.data.usedStamps}${this.data.usedOtherAccountStamps === null ? "" : ("+"+this.data.usedOtherAccountStamps)})`
      });
      if (this.data.items[this.data.selectedPurchaseItemIndex].cost<=totalBalance-totalSpent) {
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
        });
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
        name: "SportsMeetAddActivityLog",
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
        name: "SportsMeetDoPurchase",
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
    recomputeTotalStampInfo: function() {
        let eventIdToStampForExperienceMap = new Map();
        for (let i=0;i<this.data.events.length;i++) {
            eventIdToStampForExperienceMap.set(this.data.events[i].id, this.data.events[i].stampForExperience);
        }
      let hasAStickerMap = new Map();
      let computeStamps = (logs: LogType[]) => {
        let rturn=0;
        for (let i=0;i<logs.length;i++) {
          if (!hasAStickerMap.has(logs[i].eventId)) {
            rturn+=eventIdToStampForExperienceMap.get(logs[i].eventId); // new sticker!
            hasAStickerMap.set(logs[i].eventId, true);
          }
          rturn+=(logs[i].stampNumber === null ? 0 : logs[i].stampNumber as number);
        }
        return rturn;
      };
      let newTotalStamps=computeStamps(this.data.logs);
      let newOtherAccountTotalStamps: number|null=null;
      if (this.data.otherAccountLogs !== null) {
        newOtherAccountTotalStamps=computeStamps(this.data.otherAccountLogs);
      }
      this.setData({
        totalStamps: newTotalStamps,
        totalOtherAccountStamps: newOtherAccountTotalStamps,
      });
      this.updateCanAfford();
    },
    configureAdminClick: function() {
      wx.navigateTo({
        url: '/pages/ConfigureAdmin/ConfigureAdmin',
        success: (res) => {
          res.eventChannel.emit('userId', this.data.userId);
        }
      })
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
        otherAccountLogs: null,
        totalOtherAccountStamps: null,
        usedOtherAccountStamps: null,
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
        this.data.db.collection("SportsMeetAdmin").where({
          adminId: res.data[0]._id,
        }).get().then((adminRes) => {
          if (res.data.length === 0) {
            console.log("Current user is not admin!");
          }
          this.setData({
            adminStatus: {
              wxId: adminRes.data[0]._id as string,
              adminId: adminRes.data[0].adminId,
              canDeleteAll: adminRes.data[0].canDeleteAll,
              canDoPurchase: adminRes.data[0].canDoPurchase,
              canAddAdmin: adminRes.data[0].canAddAdmin,
              name: adminRes.data[0].name,
            }
          });
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
        }).then(async (res) => {
            console.log(res);
          if (res === undefined) {
            wx.navigateBack();
          }
          let studentResult:UserDataType = (res.result as AnyObject).data;
          if (studentResult as any === {}) {
            console.log("Student result is empty");
            wx.navigateBack();
          }
          this.setData({
            userData: studentResult,
            accountIsPseudo: studentResult.student.pseudoId === this.data.userId
          });
          let otherAccountId: null | string = null;
          if (!this.data.accountIsPseudo) {
            // tally up other activity logs and exchange logs
            otherAccountId=this.data.userData.student.pseudoId;
          } else {
            let accountsNumber = await wx.cloud.callFunction({
              name: "associatedAccountsNumber",
              data: {
                studentId: this.data.userData.studentId,
              }
            });
            this.setData({
              otherAccounts: (accountsNumber.result as any).result-1,
            });
            if (this.data.otherAccounts! > 1) {
              this.setData({
                purchaseButtonClass: "purchase-button-cannot-buy",
                purchaseHintClass: "button-feedback-warn-text",
                purchaseHintText: `Purchase not permitted with a multi-link pseudo account`,
                userBalanceString: "Multi-Account Block"
              })
            }
            if (this.data.otherAccounts === 1) {
              let accountsList = (accountsNumber.result as any).detail;
              let accountIndex = 0;
              if (accountsList[0]._id === studentResult.student.pseudoId) {
                accountIndex = 1;
              }
              otherAccountId = accountsList[accountIndex]._id;
            }
          }
          if (otherAccountId !== null) { // if this account is a pseudo account, this would be counting the stamps from the corresponding wechat account. if this account is a main account, this would be counting the stamps from the corresponding pseudo account
            allCollectionsData(this.data.db, `SportsMeetStampLog${studentResult.student.grade}`, {
              userId: otherAccountId,
            }).then((res) => {
              let newOtherAccountLogs: LogType[] = res.data as any[];
              for (let i=0;i<newOtherAccountLogs.length;i++) {
                if (newOtherAccountLogs[i].pointNumber as any === undefined) {
                  newOtherAccountLogs[i].pointNumber = null;
                } 
                if (newOtherAccountLogs[i].stampNumber as any === undefined) {
                  newOtherAccountLogs[i].stampNumber = null;
                }
              }
              this.setData({
                otherAccountLogs: newOtherAccountLogs,
              });
              this.recomputeTotalStampInfo();
            });
            allCollectionsData(this.data.db, `SportsMeetTransactionLog${studentResult.student.grade}`, {
              userId: otherAccountId,
            }).then((res2) => {
              let newUsedOtherAccountStamps=0;
              for (let i=0;i<res2.data.length;i++) {
                newUsedOtherAccountStamps+=res2.data[i].itemCost;
              }
              this.setData({
                usedOtherAccountStamps: newUsedOtherAccountStamps,
              });
              this.updateCanAfford();
            })
          }
          // monitor log (main, transaction)
          this.data.logWatcher = this.data.db.collection(`SportsMeetStampLog${studentResult.student.grade}`).where({
            userId: data,
          }).watch({
            onChange: (snapshot) => {
              let newLogs: LogType[]=[];
              for (let i=snapshot.docs.length-1;i>=0;i--) {
                newLogs.push({
                  _id: snapshot.docs[i]._id as string,
                  issuerId: snapshot.docs[i].issuerId,
                  issuerName: snapshot.docs[i].issuerName,
                  userId: snapshot.docs[i].userId,
                  eventId: snapshot.docs[i].eventId,
                  eventName: snapshot.docs[i].eventName,
                  pointNumber: snapshot.docs[i].pointNumber === undefined ? null : snapshot.docs[i].pointNumber,
                  stampNumber: snapshot.docs[i].stampNumber === undefined ? null : snapshot.docs[i].stampNumber,
                  studentNickname: snapshot.docs[i].studentNickname,
                  timeStamp: snapshot.docs[i].timeStamp,
                });
              }
              this.setData({
                logs: newLogs,
              });
              this.recomputeTotalStampInfo();
            },
            onError: function(err) {
              console.error('the stamp log watch closed because of error', err);
            }
          });
          this.data.purchaseWatcher = this.data.db.collection(`SportsMeetTransactionLog${studentResult.student.grade}`).where({
            userId: data,
          }).watch({
            onChange: (snapshot) => {
              let newPurchaseLog: PurchaseLogType[] = [];
              for (let i=snapshot.docs.length-1;i>=0;i--) {
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
      allCollectionsData(this.data.db, "SportsMeetEvents").then((res) => {
        let events: SMEventType[] = [];
        let data = res.data;
        for (let i=0;i<data.length;i++) {
          events.push({
            wxId: data[i]._id as string,
            allowStamps: data[i].allowStamps,
            id: data[i].id,
            name: data[i].name,
            rankLeaderboard: data[i].rankLeaderboard,
            stampForExperience: data[i].stampForExperience
          });
        }
        this.setData({
          events: events,
          selectedEventIndex: 0,
        });
        this.recomputeTotalStampInfo();
      });
      allCollectionsData(this.data.db, "SportsMeetItems").then((res) => {
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
        this.data.db.collection("SportsMeetAdmin").where({
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
