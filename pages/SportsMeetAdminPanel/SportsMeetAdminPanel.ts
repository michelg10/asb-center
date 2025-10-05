import { gNumber } from "../../classes/gNumber";
import { Student } from "../../classes/student";
import allCollectionsData from "../../utils/allCollectionsData";
import { UserDataType } from "../../utils/common";
import { cutStringToSearchTokens } from "../../utils/cutStringToSearchTokens";
import { handleSecureCode } from "../../utils/handleSecureCode";
import { sportsMeetGetSecureCodes } from "../../utils/SportsMeetFunctions";
import { LogType, PurchaseLogType } from "../SportsMeetPersonaDetail/SportsMeetPersonaDetail";

// pages/SportsMeetAdminPanel/SportsMeetAdminPanel.ts
let grades=[9,10,11,12];
type componentDataInterface = {
  myId: string,
  db: DB.Database,
  studentData: Student[],
  gNumber: gNumber[],
  studentListSearch: string,
  matchingIndexes: number[],
  multiselectEnabled: boolean,
  pastLogDeletionError: string,
  logs: LogType[],
  purchaseLogs: PurchaseLogType[],
  exchangeLogDeletionError: string,
  indivGradesLogs: LogType[][],
  indivGradesPurchaseLogs: PurchaseLogType[][],
  userData: UserDataType,
  events: SMEventType[],
  selectedEventIndex: number,
  eventSelectorOpen: boolean,
  stampValue: number,
  pointValue: number,
  logAddFeedback: string,
  logAddFeedbackClass: string,
  inputCodeData: string,
  displayStationMode: boolean,
  isWaiting: boolean,
  showSearch: boolean,
  showScan: boolean,
  showAdmin: boolean
};
export type SMEventType = {
  wxId: string,
  allowStamps: boolean;
  id: string,
  name: string,
  rankLeaderboard: boolean,
  stampForExperience: number,
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
    deleteActivityLog: function(x: any) {
      if (this.data.isWaiting) {
        return;
      }
      this.data.isWaiting = true;
      wx.cloud.callFunction({
        name: "SportsMeetDeleteActivityLog",
        data: {
          deleteLogId: this.data.logs[x.currentTarget.dataset.itemindex]._id,
          logGrade: this.data.logs[x.currentTarget.dataset.itemindex].studentGrade,
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
          let newLogs = this.data.logs;
          newLogs.splice(x.currentTarget.dataset.itemindex, 1);
          this.setData({
            logs: newLogs,
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
          logGrade: this.data.purchaseLogs[x.currentTarget.dataset.itemindex].studentGrade,
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
          let newPurchaseLogs = this.data.purchaseLogs;
          newPurchaseLogs.splice(x.currentTarget.dataset.itemindex, 1);
          this.setData({
            purchaseLogs: newPurchaseLogs,
          });
        }
        this.data.isWaiting = false;
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
    toggleStationMode: function() {
      this.setData({
        displayStationMode: !this.data.displayStationMode
      })
    },
    addActivityLog: function() {
      if (this.data.isWaiting) return;
      wx.scanCode({
        onlyFromCamera: true,
        success: async (res) => {
          wx.showLoading({
            title: "Loading...",
            mask: true,
          });
          let secureCodeRes = await handleSecureCode(this, res.result);
          this.data.isWaiting = true;
          wx.cloud.callFunction({
            name: "SportsMeetAddActivityLog",
            data: {
              userId: secureCodeRes,
              eventId: this.data.events[this.data.selectedEventIndex].id,
              stampValue: this.data.stampValue,
              pointValue: this.data.pointValue,
            }
          }).then((res) => {
            this.data.isWaiting = false;
            wx.hideLoading()
            let logAddFeedback = "";
            let result: any = res.result;
            let logAddClass = "";
            if (result.status === "success") {
              logAddFeedback = `Added log (${Math.floor(Math.random()*100000)})`;
              logAddClass = "button-feedback-success-text";
            } else if (result.status === "suspicious") {
              this.data.isWaiting = true;
              logAddFeedback = result.reason;
              logAddClass = "button-feedback-warn-text";
              wx.showModal({
                title: "Suspicious Activity",
                content: "Suspicious activity has been detected by the system. Please ensure you are not giving false stamps. Your action is being verified by the system administrator before it can be credited to the student.",
                showCancel: false,
                confirmText: "Dismiss",
                success: (res) => {
                  if (res.confirm){
                    wx.navigateBack();
                  }
                }
              })
            } else {
              logAddFeedback = result.reason;
              logAddClass = "button-feedback-warn-text";
            }
            this.setData({
              logAddFeedback: logAddFeedback,
              logAddFeedbackClass: logAddClass,
            });
          });
          wx.hideLoading();
        }, fail(res) {
          console.error(res);
        }
      });
    },
    confirmStationModeInput: async function(x: any) {
      this.setData({
        inputCodeData: x.detail.value,
      });
      if (this.data.inputCodeData !== '') {
        if (this.data.isWaiting) return;
        wx.showLoading({
          title: "Loading...",
          mask: true,
        });
        this.data.isWaiting = true;
        let secureCodeRes = await handleSecureCode(this, this.data.inputCodeData);
        this.setData({
          inputCodeData: '',
        });
        wx.cloud.callFunction({
          name: "SportsMeetAddActivityLog",
          data: {
            userId: secureCodeRes,
            eventId: this.data.events[this.data.selectedEventIndex].id,
            stampValue: this.data.stampValue,
            pointValue: this.data.pointValue,
          }
        }).then((res) => {
          this.data.isWaiting = false;
          wx.hideLoading()
          let logAddFeedback = "";
          let result: any = res.result;
          let logAddClass = "";
          if (result.status === "success") {
            logAddFeedback = `Added log (${Math.floor(Math.random()*100000)})`;
            logAddClass = "button-feedback-success-text";
          } else if (result.status === "suspicious") {
            this.data.isWaiting = true;
            logAddFeedback = result.reason;
            logAddClass = "button-feedback-warn-text";
            wx.showModal({
              title: "Suspicious Activity",
              content: "Suspicious activity has been detected by the system. Please ensure you are not giving false stamps. Your action is being verified by the system administrator before it can be credited to the student.",
              showCancel: false,
              confirmText: "Dismiss",
              success: (res) => {
                if (res.confirm){
                  wx.navigateBack();
                }
              }
            })
          } else {
            logAddFeedback = result.reason;
            logAddClass = "button-feedback-warn-text";
          }
          this.setData({
            logAddFeedback: logAddFeedback,
            logAddFeedbackClass: logAddClass,
          });
        });
        wx.hideLoading();
      }
    },
    sportsMeetFetchSecureCodes: async function() {
      return await sportsMeetGetSecureCodes(this);
    },
    onLoad: async function() {
      wx.showLoading({
        title: "Loading...",
        mask: true,
      });
      this.data.db = wx.cloud.database();
      const eventChannel = this.getOpenerEventChannel();
      eventChannel.on('userData', (data: UserDataType) => {
        this.data.userData = data;
        this.data.myId = data.id;
        // this.data.db.collection("SportsMeetAdmin").where({
        //   adminId: data,
        // }).get().then((res) => {
        //   if (res.data.length === 0) {
        //     wx.hideLoading();
        //     wx.showModal({
        //       title: 'Access Denied',
        //       content: 'Your account is not authorized to access Sports Carnival admin panel.',
        //       showCancel: false,
        //       confirmText: 'Dismiss',
        //       success: (modalRes) => {
        //         if (modalRes.confirm) {
        //           wx.navigateBack();
        //         }
        //       }
        //     })
        //   }
        //   if (res.data.length > 0 && res.data[0].suspended) {
        //     wx.hideLoading();
        //     wx.showModal({
        //       title: 'Access Suspended',
        //       content: "Your account's admin previlage to access Sports Carnival admin panel is currently suspended by the system due to suspicious activity. Please contact the system administrator for clarification details.",
        //       showCancel: false,
        //       confirmText: 'Dismiss',
        //       success: (modalRes) => {
        //         if (modalRes.confirm) {
        //           wx.navigateBack();
        //         }
        //       }
        //     })
        //   }
        //   this.setData({
        //     showAdmin: res.data[0].canAddAdmin
        //   })
        // })
        for (let i=0;i<grades.length;i++) {
          allCollectionsData(this.data.db, `SportsMeetTransactionLog${grades[i]}`, {
            issuerId: this.data.myId,
          }).then((res) => {
            let newPurchaseLogs: PurchaseLogType[]=[];
            for (let j=0;j<res.data.length;j++) {
              newPurchaseLogs.push({
                userId: res.data[j].userId,
                issuerId: res.data[j].issuerId,
                issuerName: res.data[j].issuerName,
                itemId: res.data[j].itemId,
                itemName: res.data[j].itemName,
                itemCost: res.data[j].itemCost,
                _id: res.data[j]._id,
                studentNickname: res.data[j].studentNickname,
                timeStamp: res.data[j].timeStamp,
                studentGrade: grades[i],
              });
            }
            this.data.indivGradesPurchaseLogs[i] = newPurchaseLogs;
            this.generatePurchaseLogs();
          });
        }
        for (let i=0;i<grades.length;i++) {
          allCollectionsData(this.data.db, `SportsMeetStampLog${grades[i]}`, {
            issuerId: this.data.myId,
          }).then((res) => {
            let newLogs: LogType[]=[];
            for (let j=0;j<res.data.length;j++) {
              newLogs.push({
                _id: res.data[j]._id as string,
                issuerId: res.data[j].issuerId,
                issuerName: res.data[j].issuerName,
                userId: res.data[j].userId,
                eventId: res.data[j].eventId,
                eventName: res.data[j].eventName,
                pointNumber: res.data[j].pointNumber === undefined ? null : res.data[j].pointNumber,
                stampNumber: res.data[j].stampNumber === undefined ? null : res.data[j].stampNumber,
                studentNickname: res.data[j].studentNickname,
                timeStamp: res.data[j].timeStamp,
                studentGrade: grades[i]
              });
            }
            this.data.indivGradesLogs[i] = newLogs;
            this.generateLogs();
          });
        }
      });
      this.data.indivGradesLogs=Array(grades.length);
      this.data.indivGradesPurchaseLogs=Array(grades.length);
      await allCollectionsData(this.data.db, "studentData").then((res) => {
        let tmpStudentData=[];
        for (let i=0;i<res.data.length;i++) {
          tmpStudentData.push(new Student(res.data[i]._id as string, res.data[i].nickname, res.data[i].uniqueNickname, res.data[i].englishName, res.data[i].chineseName, res.data[i].grade, res.data[i].class, res.data[i].pseudoId));
        }
        this.setData({
          studentData: tmpStudentData,
          multiselectEnabled: true,
        });
      });
      await allCollectionsData(this.data.db, "gNumbers").then((res) => {
        let tmpGNumbers=[];
        for (let i=0;i<res.data.length;i++) {
          tmpGNumbers.push(new gNumber(res.data[i]._id as string, res.data[i].gnumber, res.data[i].studentId));
        }
        this.setData({
          gNumber: tmpGNumbers,
          showScan: true,
          showSearch: false,
        });
      });
      await allCollectionsData(this.data.db, "SportsMeetEvents").then((res) => {
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
          eventSelectorOpen: false,
          stampValue: 0,
          pointValue: 0,
        });
      });
      wx.hideLoading();
    },
    onShow: async function() {
      await this.data.db.collection("SportsMeetAdmin").where({
        adminId: this.data.myId,
      }).get().then((res) => {
        if (res.data.length === 0) {
          wx.showModal({
            title: 'Access Denied',
            content: 'Your account is not authorized to access Sports Carnival admin panel.',
            showCancel: false,
            confirmText: 'Dismiss',
            success: (modalRes) => {
              if (modalRes.confirm) {
                wx.navigateBack();
              }
            }
          })
        }
        if (res.data.length > 0 && res.data[0].suspended) {
          wx.showModal({
            title: 'Access Suspended',
            content: "Your account's admin previlage to access Sports Carnival admin panel is currently suspended by the system due to suspicious activity. Please contact the system administrator for clarification details.",
            showCancel: false,
            confirmText: 'Dismiss',
            success: (modalRes) => {
              if (modalRes.confirm) {
                wx.navigateBack();
              }
            }
          })
        }
        this.setData({
          showAdmin: res.data[0].canAddAdmin
        })
      });
    },
    handleActivityOptionClick: function(x:any) {
      let optionClickedIndex = x.currentTarget.dataset.itemindex;
      this.setData({
        selectedEventIndex: optionClickedIndex,
        eventSelectorOpen: false,
        stampValue: 0,
        pointValue: 0,
      });
    },
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
    },
    adminButtonTapped: function() {
      wx.vibrateShort({
        type: "light"
      });
      wx.requestSubscribeMessage({
        tmplIds: ['DdJ1P80P0pOf8sAcE_aZbaiNgBXAz-v4Qt1Mofvc4XA'],
      })
      wx.navigateTo({
        url: '/pages/SportsMeetApproval/SportsMeetApproval',
        success: (res) => {
          res.eventChannel.emit('canAddAdmin', this.data.showAdmin);
        }
      })
    },
    generateLogs: function() {
      for (let i=0;i<this.data.indivGradesLogs.length;i++) {
        if (this.data.indivGradesLogs[i] === undefined) {
          return;
        }
      }
      console.log("Generating log...");
      let newLog: LogType[] = [];
      for (let i=0;i<this.data.indivGradesLogs.length;i++) {
        newLog.push.apply(newLog, this.data.indivGradesLogs[i]);
      }
      newLog.sort((a,b) => {
        if (a.timeStamp > b.timeStamp) {
          return -1;
        }
        return 1;
      });
      this.setData({
        logs: newLog,
      });
    },
    generatePurchaseLogs: function() {
      for (let i=0;i<this.data.indivGradesPurchaseLogs.length;i++) {
        if (this.data.indivGradesPurchaseLogs[i] === undefined) {
          return;
        }
      }
      console.log("Generating purchase log...");
      let newPurchaseLog: PurchaseLogType[] = [];
      for (let i=0;i<this.data.indivGradesPurchaseLogs.length;i++) {
        newPurchaseLog.push.apply(newPurchaseLog, this.data.indivGradesPurchaseLogs[i]);
      }
      newPurchaseLog.sort((a,b) => {
        if (a.timeStamp > b.timeStamp) {
          return -1;
        }
        return 1;
      });
      this.setData({
        purchaseLogs: newPurchaseLog,
      });
    },
    selectMultipleTap: function() {
      wx.navigateTo({
        url: '/pages/SportsMeetMultiSelect/SportsMeetMultiSelect',
        success: (res) => {
          res.eventChannel.emit('studentData', this.data.studentData);
          res.eventChannel.emit('gNumber', this.data.gNumber);
        }
      });
    },
    homeroomPointsTap: function() {
      wx.showToast({
        title: "Function Disabled",
        icon: "error"
      })
      /*wx.navigateTo({
        url: "/pages/SportsMeetHomeroomAdmin/SportsMeetHomeroomAdmin"
      });*/
    },
    handlePersonChoose: function(e: any) {
      let chosenId=e.currentTarget.dataset.chosenid;
      wx.requestSubscribeMessage({
        tmplIds: ['EaZhkxxp1LaCulPWys7nLWWbwVxur0F_7oWgO0KG3Jw', 'tlnosM16T4q1OGOtVnBjEjD4vthnnKBYMlm-ujFIG5I'],
      })
      wx.navigateTo({
        url: '/pages/SportsMeetPersonaDetail/SportsMeetPersonaDetail',
        success: (res) => {
          res.eventChannel.emit('userId', this.data.studentData[chosenId].pseudoId);
        }
      });
      this.setData({
        showSearch: false,
      })
    },
    handleSearchBoxChange: function(e: any) {
      if (this.data.studentData === undefined) {
        return;
      }
      let searchTokens = cutStringToSearchTokens(e.detail.value);
      let matchingStudentDataIndexes=[];
      if (searchTokens.length!==0) {
        for (let i=0;i<this.data.studentData.length;i++) {
          // check whether or not the user input matches this student data entry
          // in order to match this user data entry, every single search token has to match any of the tokens from this student data entry
          let currentTokens: string[]=[];
          currentTokens.push.apply(currentTokens, (cutStringToSearchTokens(this.data.studentData[i].nickname)));
          currentTokens.push.apply(currentTokens, (cutStringToSearchTokens(this.data.studentData[i].englishName)));
          currentTokens.push.apply(currentTokens, (cutStringToSearchTokens(this.data.studentData[i].chineseName)));
          currentTokens.push.apply(currentTokens, (cutStringToSearchTokens(this.data.studentData[i].studentClass.toString())));
          currentTokens.push.apply(currentTokens, (cutStringToSearchTokens(this.data.studentData[i].studentGrade.toString())));
          //currentTokens.push.apply(currentTokens, (cutStringToSearchTokens(this.data.gNumber[i].gnumber)));
          let match = true;
          for (let j=0;j<searchTokens.length;j++) {
            let thisTokenMatch = false;
            // does this search token match any of the entry tokens?
            for (let k=0;k<currentTokens.length;k++) {
              if (searchTokens[j].length<=currentTokens[k].length) {
                if (currentTokens[k].substr(0,searchTokens[j].length)===searchTokens[j]) {
                  thisTokenMatch=true;
                  break;
                }
              }
            }
            if (!thisTokenMatch) {
              match=false;
              break;
            }
          }
          if (match) {
            matchingStudentDataIndexes.push(i);
          }
        }
      }
      const limitItems=50;
      if (matchingStudentDataIndexes.length>limitItems) {
        matchingStudentDataIndexes=matchingStudentDataIndexes.slice(0, limitItems);
      }
      this.setData({
        matchingIndexes: matchingStudentDataIndexes,
      });
    },
    handleSearchBoxScan: function(){
      wx.showModal({
        title: "Scan Student ID Card?",
        content: "This function is only used to access a participant's pseudo-account by scanning their student ID card. If scanning a Sports Carnival ID Code, please navigate to the main page.",
        confirmText: "Continue",
        cancelText: "Cancel",
        success: (res) => {
          if (res.confirm) {
            wx.scanCode({
              onlyFromCamera: true,
              success: (res) => {
                this.setData({
                  studentListSearch: res.result,
                });
                //this.handleSearchBoxChange(this.data.studentListSearch);
                if (this.data.studentData === undefined) {
                  return;
                }
                let searchTokens = cutStringToSearchTokens(this.data.studentListSearch);
                let matchingStudentDataIndexes=[];
                if (searchTokens.length!==0) {
                  for (let i=0;i<this.data.studentData.length;i++) {
                    // check whether or not the user input matches this student data entry
                    // in order to match this user data entry, every single search token has to match any of the tokens from this student data entry
                    let currentTokens: string[]=[];
                    currentTokens.push.apply(currentTokens, (cutStringToSearchTokens(this.data.gNumber[i].gnumber)));
                    let match = true;
                    for (let j=0;j<searchTokens.length;j++) {
                      let thisTokenMatch = false;
                      // does this search token match any of the entry tokens?
                      for (let k=0;k<currentTokens.length;k++) {
                        if (searchTokens[j].length<=currentTokens[k].length) {
                          if (currentTokens[k].substr(0,searchTokens[j].length)===searchTokens[j]) {
                            thisTokenMatch=true;
                            break;
                          }
                        }
                      }
                      if (!thisTokenMatch) {
                        match=false;
                        break;
                      }
                    }
                    if (match) {
                      matchingStudentDataIndexes.push(i);
                    }
                  }
                }
                const limitItems=50;
                if (matchingStudentDataIndexes.length>limitItems) {
                  matchingStudentDataIndexes=matchingStudentDataIndexes.slice(0, limitItems);
                }
                if (matchingStudentDataIndexes.length === 0){
                  this.setData({
                    matchingIndexes: matchingStudentDataIndexes,
                    showSearch: true,
                  });
                  wx.showModal({
                    title: "Code Scan Failure",
                    content: "This student ID code is invalid. Search and select the participant's name.",
                    confirmText: "Dismiss",
                    showCancel: false
                  })
                }
                else{
                  let chosenId=matchingStudentDataIndexes[0];
                  wx.navigateTo({
                    url: '/pages/SportsMeetPersonaDetail/SportsMeetPersonaDetail',
                    success: (res) => {
                      res.eventChannel.emit('userId', this.data.studentData[chosenId].pseudoId);
                    }
                  });
                  this.setData({
                    showSearch: false,
                    matchingIndexes: matchingStudentDataIndexes,
                  });
                }
              },
              fail: () => {
                this.setData({
                  showSearch: true,
                })
              }
            })
          }
          if (res.cancel) {
            wx.showModal({
              title: "Navigate to Main Page?",
              content: "Do you want to navigate to the main page?",
              confirmText: "Continue",
              cancelText: "Cancel",
              success: (res) => {
                if (res.confirm) {
                  this.navMainMenu();
                }
              }
            })
          }
        }
      })
    },
    navMainMenu: function() {
      wx.reLaunch({
        url: "/pages/MainMenu/MainMenu",
      });
    }
  }
})
