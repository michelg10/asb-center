// pages/MainMenu/MainMenu.js
import Event from '../../classdefs/event'
import DisplayRow from '../../classdefs/displayRow'
import { getTimeDifference, getUnixTime, withinRange, extendNumberToLengthString } from '../../utils/util';
import { sha256 } from '../../utils/sha256';
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
    lastUpdateTime: undefined,
  },

  /**
   * Component methods
   */
  methods: {
    createQRCode: function(canvasId, data) { // data is the string value of the qr code
      let QRCode = require('../../utils/weapp-qrcode')
      let qrcode = new QRCode(canvasId, {
        usingIn: "",
        text: "",
        width: 184,
        height: 184,
        colorDark: "#000000",
        colorLight: "#ECECEC", // sync this with the interface color
        correctLevel: QRCode.CorrectLevel.H,
      });
      qrcode.makeCode(data) 
    },

    fetchServerData: async function() {
      // simulate retrieving from a server
      this.setData({
        eventsData: 
        [
          new Event("SportsMeet2021", "Sports Meet", {type: "secureCodePreview", title: "Show ID Code to log points", caption: "Your ID Code is unique and updates with time.\nDo not share your ID Code."}, -1, 0, 1800000000, 0, 1800000000, 0, 1800000000), 
          new Event("Blackout2021", "Blackout", {type: "secureCodePreview", title: "Show Access Code on entry & exit", caption: "Your Access Code is unique and updates with time.\nDo not share your Access Code."}, -1, 0, 1632157490, 0, 1632157490, 0, 1632157490)
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
      this.previewGenerator = [];
      this.previewLastGen = new Map();
      this.fetchServerData().then(() => {
        // initialize views and start the auto refresh cycle.
        this.recomputeData(false);
        setTimeout(
          () => {
            setInterval(() => {this.recomputeData(true)}, 500);
         }, 500
        );
      });
      // preform cleanup operations
      setInterval(() => {
        this.previewLastGen = new Map();
      }, 5*1000*60);
    },
    recomputeData: function(incremental) {
      console.log("Tick");
      let newMyEventsData=[];
      let newCurrentEventsData=[];
      let newPastEventsData=[];
      let newPreviewGenerator=[];
      // recompute the display data for events
      for (let i=0;i<this.data.eventsData.length;i++) {
        const consideredEvent = this.data.eventsData[i];
        let displayRow = new DisplayRow(consideredEvent.name, withinRange(getUnixTime(), consideredEvent.menuEventBegin, consideredEvent.menuEventEnd) ? "now" : getTimeDifference(getUnixTime(), consideredEvent.displayEventEnd), withinRange(getUnixTime(), consideredEvent.accessibleEventBegin, consideredEvent.accessibleEventEnd), "jumpTo", undefined);
        if (getUnixTime()<=consideredEvent.displayEventEnd) {
          let userInfo=this.data.userData.info[`${consideredEvent.id}Data`];
          if (userInfo !== undefined && userInfo.joined===true) {
            if (this.data.eventsData[i].preview.type==="secureCodePreview") {
              if (userInfo.secureCodeString !== undefined) {
                let currentPreviewPort = `previewPort${i}`;
                newPreviewGenerator.push({previewMode: this.data.eventsData[i].preview.type, previewPort: currentPreviewPort, previewData: {userCode: userInfo.secureCodeString}});
                displayRow.previewData={...this.data.eventsData[i].preview, previewPort: currentPreviewPort};
              }
            }
            newMyEventsData.push(displayRow);
          } else {
            newCurrentEventsData.push(displayRow);
          }
        } else {
          newPastEventsData.push(displayRow);
        }
      }
      this.previewGenerator = newPreviewGenerator;
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
      // recompute preview data
      for (let i=0;i<newPreviewGenerator.length;i++) {
        if (newPreviewGenerator[i].previewMode=="secureCodePreview") {
          let previewTimePeriod=Math.floor(getUnixTime()/3);
          let accessCodeContents=newPreviewGenerator[i].previewData.userCode+previewTimePeriod;
          accessCodeContents=sha256(accessCodeContents);
          if (accessCodeContents !== this.previewLastGen.get(newPreviewGenerator[i].previewPort)) {
            this.createQRCode(newPreviewGenerator[i].previewPort, accessCodeContents);
            this.previewLastGen.set(newPreviewGenerator[i].previewPort, accessCodeContents);
          }
        }
      }
      let date = new Date();
      let newUpdateString=`${extendNumberToLengthString(date.getHours(), 2)}:${extendNumberToLengthString(date.getMinutes(), 2)}:${extendNumberToLengthString(date.getSeconds(), 2)}`;
      this.setData({
        lastUpdateTime: newUpdateString,
      });
    },
    displayRowDiff: function(a, b) {
      if (a.length !== b.length) return true;
      for (let i=0;i<a.length;i++) {
        if (a[i].canJump !== b[i].canJump || a[i].jumpTo !== b[i].jumpTo || a[i].timeLeft !== b[i].timeLeft || a[i].title !== b[i].title) {
          return true;
        }
      }
      return false;
    }
  },
})