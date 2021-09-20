// pages/MainMenu/MainMenu.js
import Event from '../../classdefs/event'
import DisplayRow from '../../classdefs/displayRow'
import { getTimeDifference, getUnixTime, withinRange } from '../../utils/util';
Component({
  /**
   * Component properties
   */
  properties: {

  },

  /**
   * Component initial data
   */
  data: {
    masterEventsData:[],
    userData:undefined,
    myEventsData:[],
    currentEventsData:[],
    pastEventsData:[],
  },

  /**
   * Component methods
   */
  methods: {
    fetchServerData: async function() {
      // simulate retrieving from a server
      this.setData({
        eventsData: 
        [
          new Event("SportsMeet2021", "Sports Meet", {type: "secureCodePreview", title: "Show ID Code to log points", caption: "Your ID Code is unique and updates with time.\nDo not share your ID Code."}, -1, 0, 1800000000, 0, 1800000000, 0, 1800000000), 
          new Event("Blackout2021", "Blackout", {type: "secureCodePreview", title: "Show Access Code on entry & exit", caption: "Your Access Code is unique and updates with time.\nDo not share your Access Code."}, -1, 0, 1800000000, 0, 1800000000, 0, 1800000000)
      ]
      });
      this.setData({
        userData: {id: "ID given by wechat", student: {id: "student id", name: "Michel", grade: 11, class: 3}, info: {SportsMeet2021Data: {joined: true, secureCodeString: "secretRandomString"}}}
      });
    },
    scanButtonClick: function() {
      console.log("Scan QR Code")
      // implement this
    },
    onLoad: function() {
      this.fetchServerData().then(() => {
        // initialize views and start the auto refresh cycle.
        this.recomputeData(false);
        setTimeout(
          () => {
            setInterval(() => {this.recomputeData(true)}, 1000);
         }, 1000
        );
      });
    },
    recomputeData: function(incremental) {
      console.log("Tick");
      let newMyEventsData=[];
      let newCurrentEventsData=[];
      let newPastEventsData=[];
      // recompute the display data for events
      for (let i=0;i<this.data.eventsData.length;i++) {
        const consideredEvent = this.data.eventsData[i];
        if (getUnixTime()<=consideredEvent.displayEventEnd) {
          let userInfo=this.data.userData.info[`${consideredEvent.id}Data`];
          if (userInfo !== undefined && userInfo.joined===true) {
            newMyEventsData.push(new DisplayRow(consideredEvent.name, withinRange(getUnixTime(),consideredEvent.menuEventBegin, consideredEvent.menuEventEnd) ? "now" : getTimeDifference(getUnixTime(), consideredEvent.displayEventBegin), withinRange(getUnixTime(), consideredEvent.accessibleEventBegin, consideredEvent.accessibleEventEnd)));
          } else {
            newCurrentEventsData.push(new DisplayRow(consideredEvent.name, withinRange(getUnixTime(),consideredEvent.menuEventBegin, consideredEvent.menuEventEnd) ? "now" : getTimeDifference(getUnixTime(), consideredEvent.displayEventBegin), withinRange(getUnixTime(), consideredEvent.accessibleEventBegin, consideredEvent.accessibleEventEnd)));
          }
        } else {
          newPastEventsData.push(new DisplayRow(consideredEvent.name, withinRange(getUnixTime(),consideredEvent.menuEventBegin, consideredEvent.menuEventEnd) ? "now" : getTimeDifference(getUnixTime(), consideredEvent.displayEventBegin), withinRange(getUnixTime(), consideredEvent.accessibleEventBegin, consideredEvent.accessibleEventEnd)));
        }
        if (incremental) {
          if (this.displayRowDiff(this.data.myEventsData, newMyEventsData)) {
            this.setData({
              myEventsData: newMyEventsData,
            });
          }
          if (this.displayRowDiff(this.data.currentEventsData, newCurrentEventsData)) {
            this.setData({
              currentEventsData: newCurrentEventsData,
            });
          }
          if (this.displayRowDiff(this.data.pastEventsData, newPastEventsData)) {
            this.setData({
              pastEventsData: newPastEventsData,
            });
          }
        } else {
          this.setData({
            myEventsData: newMyEventsData,
            currentEventsData: newCurrentEventsData,
            pastEventsData: newPastEventsData,
          });
        }
      }
      
      // recompute preview data
    },
    displayRowDiff: function(a, b) {
      if (a.length !== b.length) return true;
      for (let i=0;i<a.length;i++) {
        if (a[i].canJump !== b[i].canJump || a[i].jumpTo !== b[i].jumpTo || a[i].timeLeft !== b[i].timeLeft || a[i].title !== b[i].title) {
          return true;
        }
      }
      return false;
    },
    refreshPreviews: function() {

    }
  },
})