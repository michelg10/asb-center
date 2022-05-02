// pages/MainMenu/MainMenu.js
import { AnyPreviewType, Event, SecureCodePreview } from '../../classes/event'
import {DisplayRow} from '../../classes/displayRow'
import { getTimeDifference, getUnixTime, withinRange, extendNumberToLengthString } from '../../utils/util';
import { createQRCode, PreviewEnum, StudentDataType, UserDataType } from '../../utils/common';
import allCollectionsData from '../../utils/allCollectionsData';
import { generatePreviewCode } from '../../utils/generatePreviewCode';
// import { sportsMeet2021GetSecureCodes } from '../SportsMeet/SportsMeetFunctions'; // thinned
import { handleCode } from '../../utils/handleCode';
import { Student } from '../../classes/student';
interface SecureCodePreviewData {
  userCode: string;
}
export interface PreviewGenerator {
  eventId: string;
  previewMode: PreviewEnum;
  previewPort: string;
  previewData: SecureCodePreviewData;
}
export type CacheSingleton = {
  studentData: Student[] | undefined,
}
interface componentDataInterface {
  masterEventsData: Array<Event>;
  userData: UserDataType;
  myEventsData: Array<DisplayRow>;
  currentEventsData: Array<DisplayRow>;
  pastEventsData: Array<DisplayRow>;
  servicesData: Array<DisplayRow>;
  lastUpdateTime: string;

  // UI-independent variables
  db: DB.Database;
  previewGenerator: Array<PreviewGenerator>;
  previewLastGen: Map<string, string>;
  viewVisible: boolean,

  cacheSingleton: CacheSingleton,
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
          parseInt("User data updated")
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
            let userObject: UserDataType = {id: userData[0]._id as string, student: null, info: userData[0].info, compactId: userData[0].compactId, globalAdminName: null};
            if (userData[0].studentId !== undefined) {
              let studentData = await this.data.db.collection("studentData").where({
                _id: userData[0].studentId, 
              }).get();
              if (studentData.data.length !== 0) {
                let studentDataObject: StudentDataType={id: studentData.data[0]._id as string, name: studentData.data[0].nickname, grade: studentData.data[0].grade, class: studentData.data[0].class, pseudoId: studentData.data[0].pseudoId}; 
                userObject.student = studentDataObject;
              }
            }
            this.setData({
              userData: userObject,
            });
            this.data.db.collection("admins").where({
              userId: userObject.id,
            }).get().then((res) => {
              if (res.data.length>0) {
                let newUserData = this.data.userData;
                newUserData.globalAdminName = res.data[0].adminName;
                this.setData({
                  userData: newUserData,
                });
              }
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
      // wx.navigateTo({
      //   url: '/pages/SportsMeet2021PersonaDetail/SportsMeet2021PersonaDetail',
      //   success: (res) => {
      //     res.eventChannel.emit('userId', "cd045e756163838214537bab72cf91b1");
      //   }
      // });
    //   handleCode(this, "asC;1;type-userCode;payload-6-TUlDSEVM");
    //   return;
      wx.scanCode({
        onlyFromCamera: true,
        success: (res) => {
          console.log(res);
          handleCode(this, res.result);
        }, fail(res) {
          console.error(res);
        }
      });
    },
    // sportsMeet2021FetchSecureCodes: async function() { // thinned
    //   return await sportsMeet2021GetSecureCodes(this);
    // },
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
      if (eventClickedId==="WhiteV2022") {
        wx.navigateTo({
          url: '/pages/AnyOrderMainPage/AnyOrderMainPage',
          success: (res) => {
            res.eventChannel.emit('userData', this.data.userData);
            res.eventChannel.emit('eventId', "WhiteV2022");
            res.eventChannel.emit('eventName', "White Valentines");
            res.eventChannel.emit('cacheSingleton', this.data.cacheSingleton);
          }
        })
      }
      if (eventClickedId==="personalCode") {
        wx.navigateTo({
          url: '/pages/PersonalCode/PersonalCode',
          success: (res) => {
            res.eventChannel.emit('userData', this.data.userData);
          }
        })
      }
      if (eventClickedId==="suggestionsBox") {
        wx.navigateTo({
          url: '/pages/SuggestionsBox/SuggestionsBox',
          success: (res) => {
            res.eventChannel.emit('userData', this.data.userData);
          }
        });
      }
    },
    onLoad: function() {
      wx.cloud.init();
      this.data.db = wx.cloud.database();
      this.data.previewGenerator = [];
      this.data.previewLastGen = new Map();
      this.data.viewVisible = true;
      this.data.cacheSingleton = {studentData: undefined};
      this.fetchServerData().then(() => {
        // initialize views and start the auto refresh cycle.
        this.recomputeData(false);
        setTimeout(
          () => {
            setInterval(() => {this.recomputeData(true)}, 500);
         }, 500
        );
      });
      let newServiceData=new Array<DisplayRow>();
      newServiceData.push(new DisplayRow("Personal Code", "", true, "personalCode", null));
      newServiceData.push(new DisplayRow("Suggestions Box", "", true, "suggestionsBox", null));
      // newServiceData.push(new DisplayRow("Order Lunch", "", true, "lunchOrdering", null));
      this.setData({
        servicesData: newServiceData
      })
      // preform cleanup operations
      setInterval(() => {
        this.data.previewLastGen = new Map();
      }, 5*1000*60);
    },
    recomputeData: function(incremental: boolean) {
      console.log("Tick at time", getUnixTime());
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
          if (!(consideredEvent.grades.includes(this.data.userData.student.grade) || consideredEvent.grades[0] === -1 && this.data.userData.globalAdminName !== null)) {
            continue;
          }
        }
        if (getUnixTime() < consideredEvent.eventVisibleDate) {
          continue;
        }
        let displayRow = new DisplayRow(consideredEvent.name, withinRange(getUnixTime(), consideredEvent.menuEventBegin, consideredEvent.menuEventEnd) ? "now" : getTimeDifference(getUnixTime(), (getUnixTime()<consideredEvent.displayEventBegin ? consideredEvent.displayEventBegin : consideredEvent.displayEventEnd)), withinRange(getUnixTime(), consideredEvent.accessibleEventBegin, consideredEvent.accessibleEventEnd), consideredEvent.id, null);
        if (getUnixTime()<=consideredEvent.displayEventEnd) {
          let userInfo=this.data.userData.info[`${consideredEvent.id}Data`];
          if (userInfo !== undefined && userInfo.joined===true) {
            if (withinRange(getUnixTime(), consideredEvent.menuEventBegin, consideredEvent.menuEventEnd)) {
              if (this.data.masterEventsData[i].preview instanceof SecureCodePreview) {
                if (userInfo.secureCodeString !== undefined) {
                  let currentPreviewPort = `previewPort${i}`;
                  newPreviewGenerator.push({eventId: consideredEvent.id,previewMode: "secureCodePreview", previewPort: currentPreviewPort, previewData: {userCode: userInfo.secureCodeString}});
  
                  displayRow.previewData={previewMode: "secureCodePreview", title: this.data.masterEventsData[i].preview!.title, subtitle: this.data.masterEventsData[i].preview!.caption, previewPort: currentPreviewPort };
                }
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
      if (this.data.viewVisible) {
        for (let i=0;i<newPreviewGenerator.length;i++) {
          if (newPreviewGenerator[i].previewMode==="secureCodePreview") {
            let accessCodeContents=generatePreviewCode("secureCode", newPreviewGenerator[i].previewData.userCode, newPreviewGenerator[i].eventId);
            if (accessCodeContents !== this.data.previewLastGen.get(newPreviewGenerator[i].previewPort)) {
              let myCreateQRCode = createQRCode.bind(this);
              myCreateQRCode(newPreviewGenerator[i].previewPort, accessCodeContents, 'ECECEC');
              this.data.previewLastGen.set(newPreviewGenerator[i].previewPort, accessCodeContents);
            }
          }
        }
      }
      let date = new Date();
      let newUpdateString=`${extendNumberToLengthString(date.getHours(), 2)}:${extendNumberToLengthString(date.getMinutes(), 2)}:${extendNumberToLengthString(date.getSeconds(), 2)}`;
      this.setData({
        lastUpdateTime: newUpdateString,
      });
    },
    onShow: function() {
      this.data.viewVisible = true;
    },
    onHide: function() {
      this.data.viewVisible = false;
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