import { CacheSingleton } from "../../classes/CacheSingleton";
import allCollectionsData from "../../utils/allCollectionsData";

// pages/SportsMeetHomeroomAdmin/SportsMeetHomeroomAdmin.ts
type teamEventsType = {
  id: string,
  name: string,
};
type AdminStatusType = {
  wxId: string,
  adminId: string,
  canDeleteAll: boolean,
  canDoPurchase: boolean,
  name: string,
};
type componentDataInterface = {
  db: DB.Database,
  teamEvents: teamEventsType[],
  eventSelectorOpen: boolean,
  selectedEventIndex: number,
  pointValue: number,
  sportsMeetGrades: number[],
  sportsMeetClassOptions: number[][],
  gradeSelectorOpen: boolean,
  selectedGradeIndex: number,
  classSelectorOpen: boolean,
  selectedClassIndex: number,
  isWaiting: boolean,
  logAddFeedback: string,
  logAddFeedbackClass: string,
  logWatcher: DB.RealtimeListener,
  logs: HomeroomLogType[],
  pastLogDeletionError: string,
  adminStatus: AdminStatusType,
  cacheSingleton: CacheSingleton,
  userOpenId: string | undefined
}
type HomeroomLogType = {
  _id: string,
  class: number,
  eventId: string,
  grade: number,
  issuerId: string,
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
    onUnload: function() {
      this.data.logWatcher.close();
    },
    onLoad: function() {
      this.setData({
        sportsMeetGrades: [9,10,11,12],
        selectedGradeIndex: 0,
        pointValue: 0,
      });
      this.data.db = wx.cloud.database();
      this.data.cacheSingleton.fetchUserOpenId().then((res) => {
        this.data.userOpenId = res;
      });
      this.data.db.collection("userData").where({
        "userId": this.data.userOpenId,
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
              name: adminRes.data[0].name,
            }
          });
        });
      });
      this.data.logWatcher = this.data.db.collection("SportsMeetHomeroomLog").watch({
        onChange: (snapshot) => {
          let newLogs: HomeroomLogType[]=[];
          for (let i=snapshot.docs.length-1;i>=0;i--) {
            newLogs.push(snapshot.docs[i] as HomeroomLogType);
          }
          this.setData({
            logs: newLogs,
          })
        },
        onError: function(err) {
          console.error('the homeroom log watch closed because of error', err);
        }
      });
      allCollectionsData(this.data.db, "SportsMeetTeamEvents").then((res) => {
        let nextTeamEvents: teamEventsType[] = [];
        for (let i=0;i<res.data.length;i++) {
          nextTeamEvents.push(res.data[i] as any);
        }
        this.setData({
          teamEvents: nextTeamEvents,
          selectedEventIndex: 0,
        });
      })
      allCollectionsData(this.data.db, "studentClasses").then((res) => {
        let nextSportsMeetClassNumbers = Array(this.data.sportsMeetGrades.length);
        for (let i=0;i<res.data.length;i++) {
          let index = this.data.sportsMeetGrades.findIndex((value) => {
            return value === res.data[i].grade;
          });
          if (index !== -1) {
            nextSportsMeetClassNumbers[index] = res.data[i].classUpTo;
          }
        }
        let nextSpotsMeetClassOptions: number[][] = [];
        for (let i=0;i<nextSportsMeetClassNumbers.length;i++) {
          let currentGradeOptions = [];
          for (let j=1;j<=nextSportsMeetClassNumbers[i];j++) {
            currentGradeOptions.push(j);
          }
          nextSpotsMeetClassOptions.push(currentGradeOptions);
        }
        this.setData({
          sportsMeetClassOptions: nextSpotsMeetClassOptions,
          selectedClassIndex: 0,
        });
      });
    },
    mainSelectorClicked: function() {
      this.setData({
        eventSelectorOpen: !this.data.eventSelectorOpen,
      });
    },
    gradeSelectorClicked: function() {
      this.setData({
        gradeSelectorOpen: !this.data.gradeSelectorOpen,
      });
    },
    classSelectorClicked: function() {
      this.setData({
        classSelectorOpen: !this.data.classSelectorOpen,
      });
    },
    handleActivityOptionClick: function(x: any) {
      this.setData({
        selectedEventIndex: x.currentTarget.dataset.itemindex,
        eventSelectorOpen: false,
      })
    },
    handleGradeOptionClick: function(x: any) {
      this.setData({
        selectedGradeIndex: x.currentTarget.dataset.itemindex,
        gradeSelectorOpen: false,
        classSelectorOpen: false,
        selectedClassIndex: 0,
      })
    },
    handleClassOptionClick: function(x: any) {
      this.setData({
        classSelectorOpen: false,
        selectedClassIndex: x.currentTarget.dataset.itemindex,
      })
    },
    pointValueBind: function(x: any) {
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
    deleteHomeroomLog: function(x: any) {
        if (this.data.isWaiting) {
          return;
        }
        this.data.isWaiting = true;
        wx.cloud.callFunction({
          name: "SportsMeetDeleteHomeroomLog",
          data: {
            deleteLogId: this.data.logs[x.currentTarget.dataset.itemindex]._id,
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
    addHomeroomLog: function() {
      if (this.data.isWaiting) return;
      this.data.isWaiting = true;
      wx.cloud.callFunction({
        name: "SportsMeetAddHomeroomLog",
        data: {
          grade: this.data.sportsMeetGrades[this.data.selectedGradeIndex],
          class: this.data.sportsMeetClassOptions[this.data.selectedGradeIndex][this.data.selectedClassIndex],
          eventId: this.data.teamEvents[this.data.selectedEventIndex].id,
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
          logAddFeedback: logAddFeedback,
          logAddFeedbackClass: logAddClass,
        });
      });
    }
  }
})
