import allCollectionsData from "../../utils/allCollectionsData";

// pages/SportsMeetHomeroomAdmin/SportsMeetHomeroomAdmin.ts
type teamEventsType = {
  id: string,
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
    onLoad: function() {
      this.setData({
        sportsMeetGrades: [9,10,11,12],
        selectedGradeIndex: 0,
        pointValue: 0,
      });
      this.data.db = wx.cloud.database();
      allCollectionsData(this.data.db, "SportsMeet2021TeamEvents").then((res) => {
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
    addActivityLog: function() {
      if (this.data.isWaiting) return;
      this.data.isWaiting = true;
      wx.cloud.callFunction({
        name: "SportsMeet2021AddHomeroomLog",
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
          pointValue: 0,
          logAddFeedback: logAddFeedback,
          logAddFeedbackClass: logAddClass,
        });
      });
    }
  }
})
