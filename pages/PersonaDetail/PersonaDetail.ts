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
type ComputedLogType = {
  stampNumber: number,
  transacted: number,
  userId: string,
};
// pages/PersonaDetail/PersonaDetail.ts
interface componentDataInterface {
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
  computedWatcher: DB.RealtimeListener,
  purchaseWatcher: DB.RealtimeListener,
  computedLog: ComputedLogType,
  stampValue: number,
  pointValue: number,
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
    handleActivityOptionClick: function(x:any) {
      let optionClickedIndex=x.currentTarget.dataset.itemindex;
      this.setData({
        selectedEventIndex: optionClickedIndex,
        eventSelectorOpen: false,
        mainSelectContainerClass: "main-select-container",
        stampValue: 0,
        pointValue: 0,
      });
    },
    addActivityLog: function() {

    },
    mainSelectorClicked: function() {
      if (this.data.eventSelectorOpen) {
        this.setData({
          mainSelectContainerClass: "main-select-container",
          eventSelectorOpen: false,
        });
      } else {
        this.setData({
          mainSelectContainerClass: "main-select-container main-select-container-open",
          eventSelectorOpen: true,
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
          // monitor log & computed stamp / sticker / transaction
          this.data.logWatcher = this.data.db.collection(`SportsMeet2021StampLog${studentResult.student.grade}`).where({
            userId: data,
          }).watch({
            onChange: (snapshot) => {
              console.log('docs\'s changed events', snapshot.docChanges)
              console.log('query result snapshot after the event', snapshot.docs)
              console.log('is init data', snapshot.type === 'init')
            },
            onError: function(err) {
              console.error('the stamp log watch closed because of error', err);
            }
          });
          this.data.purchaseWatcher = this.data.db.collection(`SportsMeet2021TransactionLog${studentResult.student.grade}`).where({
            userId: data,
          }).watch({
            onChange: (snapshot) => {
              console.log('docs\'s changed events', snapshot.docChanges)
              console.log('query result snapshot after the event', snapshot.docs)
              console.log('is init data', snapshot.type === 'init')
            },
            onError: function(err) {
              console.error('the purchase log watch closed because of error', err);
            }
          })
          this.data.computedWatcher = this.data.db.collection(`SportsMeet2021StampProcessed${studentResult.student.grade}`).where({
            userId: data,
          }).watch({
            onChange: (snapshot) => {
              this.setData({
                computedLog: snapshot.docs[0],
              })
            },
            onError: function(err) {
              console.error('the computed log watch closed because of error', err);
            }
          });
        })
      });
      // fetch event, item database
      this.data.db = wx.cloud.database();
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
        });
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
      this.data.computedWatcher.close();
    }
  }
})
