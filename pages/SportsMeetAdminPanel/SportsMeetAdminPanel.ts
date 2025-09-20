import { gNumber } from "../../classes/gNumber";
import { Student } from "../../classes/student";
import allCollectionsData from "../../utils/allCollectionsData";
import { cutStringToSearchTokens } from "../../utils/cutStringToSearchTokens";
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
  isWaiting: boolean,
  showSearch: boolean,
  showScan: boolean,
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
    onLoad: async function() {
      wx.showLoading({
        title: "Loading...",
        mask: true,
      });
      this.data.db = wx.cloud.database();
      const eventChannel = this.getOpenerEventChannel();
      eventChannel.on('myId', (data) => {
        this.data.myId = data;
        this.data.db.collection("SportsMeetAdmin").where({
          adminId: data,
        }).get().then((res) => {
          if (res.data.length === 0) {
            wx.hideLoading();
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
            wx.hideLoading();
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
        })
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
      wx.hideLoading();
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
