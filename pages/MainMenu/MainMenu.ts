// pages/MainMenu/MainMenu.js
import { AnyPreviewType, Event, SecureCodePreview } from '../../classes/event'
import {DisplayRow} from '../../classes/displayRow'
import { getTimeDifference, getUnixTime, withinRange, extendNumberToLengthString } from '../../utils/util';
import { sha256 } from '../../utils/sha256';
import { createQRCode, previewEnum, studentDataType, userDataType } from '../../utils/common';
import allCollectionsData from '../../utils/allCollectionsData';
import { generateQrCode } from '../../utils/generateQrCode';
import { generatePreviewCode } from '../../utils/generatePreviewCode';
import { handleCode } from '../../utils/handleCode';
import { sportsMeet2021GetSecureCodes } from '../SportsMeet/SportsMeetFunctions';
interface SecureCodePreviewData {
  userCode: string;
}
export interface PreviewGenerator {
  eventId: string;
  previewMode: previewEnum;
  previewPort: string;
  previewData: SecureCodePreviewData;
}
interface componentDataInterface {
  masterEventsData: Array<Event>;
  userData: userDataType;
  myEventsData: Array<DisplayRow>;
  currentEventsData: Array<DisplayRow>;
  pastEventsData: Array<DisplayRow>;
  lastUpdateTime: string;

  // UI-independent variables
  db: DB.Database;
  previewGenerator: Array<PreviewGenerator>;
  previewLastGen: Map<string, string>;
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
    fetchServerData: async function() {
      this.data.db.collection("userData").where({
        userId: '{openid}'
      }).watch({
        onChange: async (snapshot) => {
          let userData = snapshot.docs;
          if (snapshot.type==="init") {
            if (userData.length === 0) {
              // ask the server 
              let shouldRegister=wx.cloud.callFunction({
                name: "checkNeedNewUser",
              });
              if (shouldRegister) {
                wx.redirectTo({
                  url: '/pages/Registration/Registration'
                })
                return;
              }
            }
          }
          if (userData.length>0) {
            let userObject: userDataType = {id: userData[0]._id as string, student: null, info: userData[0].info};
            if (userData[0].studentId !== undefined) {
              let studentData = await this.data.db.collection("studentData").where({
                _id: userData[0].studentId, 
              }).get();
              if (studentData.data.length !== 0) {
                let studentDataObject: studentDataType={id: studentData.data[0]._id as string, name: studentData.data[0].nickname, grade: studentData.data[0].grade, class: studentData.data[0].class}; 
                userObject.student = studentDataObject;
              }
            }
            this.setData({
              userData: userObject,
            });
          }
        }, onError: function(err) {
          console.error("user data watch closed due to", err);
        }
      });
      let serverEventData: any[]=(await allCollectionsData(this.data.db, "event")).data;

      let newEventsDb = [];
      for (let i=0;i<serverEventData.length;i++) {
        let currentDataEntry = serverEventData[i];
        let currentDataEntryPreview: AnyPreviewType = null;
        if (currentDataEntry.preview.type=="secureCodePreview") {
          currentDataEntryPreview=new SecureCodePreview(currentDataEntry.preview.title, currentDataEntry.preview.caption.replace(/\\n/gi, '\n'));
        }
        newEventsDb.push(new Event(currentDataEntry.id, currentDataEntry.name, currentDataEntryPreview, currentDataEntry.eventVisibleDate, currentDataEntry.displayEventBegin, currentDataEntry.displayEventEnd, currentDataEntry.accessibleEventBegin, currentDataEntry.accessibleEventEnd, currentDataEntry.menuEventBegin, currentDataEntry.menuEventEnd, currentDataEntry.grades, currentDataEntry.restrictAccess));
      }
      this.setData({
        masterEventsData: newEventsDb,
      });
    },
    scanButtonClick: function() {
      wx.navigateTo({
        url: '/pages/PersonaDetail/PersonaDetail',
        success: (res) => {
          res.eventChannel.emit('userId', "14139e1261586d5110c7a8810faa7da7");
        }
      });
      // wx.scanCode({
      //   onlyFromCamera: true,
      //   success: (res) => {
      //     console.log(res);
      //     handleCode(this, res.result);
      //   }, fail(res) {
      //     console.error(res);
      //   }
      // });
    },
    sportsMeet2021FetchSecureCodes: async function() {
      return await sportsMeet2021GetSecureCodes(this);
    },
    handleRegister: function() {
      wx.redirectTo({
        url: '/pages/Registration/Registration'
      });
    },
    handleEventRowClick: function(x: any) {
      let eventClickedId=x.currentTarget.dataset.id;
      let shouldJump = x.currentTarget.dataset.shouldjump;
      if (!shouldJump) {
        return;
      }
      if (eventClickedId==="SportsMeet2021") {
        wx.navigateTo({
          url: '/pages/SportsMeet/SportsMeet',
          success: (res) => {
            res.eventChannel.emit('userData', this.data.userData);
            res.eventChannel.emit('eventId', 'SportsMeet2021');
            res.eventChannel.emit('eventInfo', this.data.masterEventsData.find((val) => {
              return val.id === eventClickedId;
            }));
            res.eventChannel.emit('previewInfo', this.data.previewGenerator.find((val) => {
              return val.eventId === eventClickedId;
            }));
          }
        });
      }
    },
    onLoad: function() {
      wx.cloud.init();
      this.data.db = wx.cloud.database();
      this.data.previewGenerator = [];
      this.data.previewLastGen = new Map();
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
        this.data.previewLastGen = new Map();
      }, 5*1000*60);
    },
    recomputeData: function(incremental: boolean) {
      console.log("Tick");
      if (this.data.userData===undefined) {
        return;
      }
      let newMyEventsData:Array<DisplayRow>=[];
      let newCurrentEventsData:Array<DisplayRow>=[];
      let newPastEventsData:Array<DisplayRow>=[];
      let newPreviewGenerator:Array<PreviewGenerator>=[];
      // recompute the display data for events
      for (let i=0;i<this.data.masterEventsData.length;i++) {
        const consideredEvent = this.data.masterEventsData[i];
        if (consideredEvent.grades !== null && this.data.userData.student !== null) {
          if (!consideredEvent.grades.includes(this.data.userData.student.grade)) {
            continue;
          }
        }
        let displayRow = new DisplayRow(consideredEvent.name, withinRange(getUnixTime(), consideredEvent.menuEventBegin, consideredEvent.menuEventEnd) ? "now" : getTimeDifference(getUnixTime(), consideredEvent.displayEventEnd), withinRange(getUnixTime(), consideredEvent.accessibleEventBegin, consideredEvent.accessibleEventEnd), consideredEvent.id, null);
        if (getUnixTime()<=consideredEvent.displayEventEnd) {
          let userInfo=this.data.userData.info[`${consideredEvent.id}Data`];
          if (userInfo !== undefined && userInfo.joined===true) {
            if (this.data.masterEventsData[i].preview instanceof SecureCodePreview) {
              if (userInfo.secureCodeString !== undefined) {
                let currentPreviewPort = `previewPort${i}`;
                newPreviewGenerator.push({eventId: consideredEvent.id,previewMode: "secureCodePreview", previewPort: currentPreviewPort, previewData: {userCode: userInfo.secureCodeString}});

                displayRow.previewData={previewMode: "secureCodePreview", title: this.data.masterEventsData[i].preview!.title, subtitle: this.data.masterEventsData[i].preview!.caption, previewPort: currentPreviewPort };
              }
            }
            newMyEventsData.push(displayRow);
          } else {
            if (consideredEvent.restrictAccess) {
              displayRow.canJump=false;
            }
            newCurrentEventsData.push(displayRow);
          }
        } else {
          newPastEventsData.push(displayRow);
        }
      }
      this.data.previewGenerator = newPreviewGenerator;
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
        if (newPreviewGenerator[i].previewMode==="secureCodePreview") {
          let accessCodeContents=generatePreviewCode(newPreviewGenerator[i].previewData.userCode);
          if (accessCodeContents !== this.data.previewLastGen.get(newPreviewGenerator[i].previewPort)) {
            let myCreateQRCode = createQRCode.bind(this);
            myCreateQRCode(newPreviewGenerator[i].previewPort, accessCodeContents, 'ECECEC');
            this.data.previewLastGen.set(newPreviewGenerator[i].previewPort, accessCodeContents);
          }
        }
      }
      let date = new Date();
      let newUpdateString=`${extendNumberToLengthString(date.getHours(), 2)}:${extendNumberToLengthString(date.getMinutes(), 2)}:${extendNumberToLengthString(date.getSeconds(), 2)}`;
      this.setData({
        lastUpdateTime: newUpdateString,
      });
    },
    displayRowDiff: function(a: Array<DisplayRow>, b: Array<DisplayRow>) {
      if (a===undefined && b===undefined) {
        return false;
      }
      if (a===undefined || b===undefined) {
        return true;
      }
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