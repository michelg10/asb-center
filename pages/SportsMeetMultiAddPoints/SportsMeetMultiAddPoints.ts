import { Student } from "../../classes/student";
import allCollectionsData from "../../utils/allCollectionsData";

// pages/SportsMeet2021MultiAddPoints/SportsMeet2021MultiAddPoints.ts
type SMEventType = {
  wxId: string,
  allowStamps: boolean;
  id: string,
  name: string,
  rankLeaderboard: boolean,
};
type componentDataInterface = {
  db: DB.Database,
  studentData: Student[],
  selectedEventIndex: number,
  eventSelectorOpen: boolean,
  events: SMEventType[],
  stampValue: number,
  pointValue: number,
  isWaiting: boolean
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
        stampValue: 0,
        pointValue: 0,
      });
    },
    addActivityLog: function() {
      if (this.data.isWaiting) return;
      this.data.isWaiting = true;
      let userIds: string[] = [];
      for (let i=0;i<this.data.studentData.length;i++) {
        userIds.push(this.data.studentData[i].pseudoId);
      }
      console.log(userIds);
      wx.cloud.callFunction({
        name: "SportsMeetBatchAddActivityLog",
        data: {
          userIds: userIds,
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
          wx.navigateBack({
            delta: 2,
          });
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
    onLoad: function() {
      const eventChannel = this.getOpenerEventChannel();
      eventChannel.on('studentData', (data) => {
        this.setData({
          studentData: data,
        });
      });
      this.data.db = wx.cloud.database();
      allCollectionsData(this.data.db, "SportsMeetEvents").then((res) => {
        let events: SMEventType[] = [];
        let data = res.data;
        for (let i=0;i<data.length;i++) {
          if (data[i].rankLeaderboard || data[i].allowStamps) {
            continue;
          }
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
    }
  }
})
