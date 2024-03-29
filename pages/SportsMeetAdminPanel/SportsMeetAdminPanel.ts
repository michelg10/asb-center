import { Student } from "../../classes/Student";
import allCollectionsData from "../../utils/allCollectionsData";
import { cutStringToSearchTokens } from "../../utils/cutStringToSearchTokens";
import { LogType, PurchaseLogType } from "../SportsMeetPersonaDetail/SportsMeetPersonaDetail";

// pages/SportsMeetAdminPanel/SportsMeetAdminPanel.ts
let grades=[9,10,11,12];
type componentDataInterface = {
  myId: string,
  db: DB.Database,
  studentData: Student[],
  matchingIndexes: number[],
  multiselectEnabled: boolean,
  pastLogDeletionError: string,
  logs: LogType[],
  purchaseLogs: PurchaseLogType[],
  exchangeLogDeletionError: string,
  indivGradesLogs: LogType[][],
  indivGradesPurchaseLogs: PurchaseLogType[][],
  isWaiting: boolean,
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
    onLoad: function() {
      this.data.db = wx.cloud.database();
      this.data.indivGradesLogs=Array(grades.length);
      this.data.indivGradesPurchaseLogs=Array(grades.length);
      allCollectionsData(this.data.db, "studentData").then((res) => {
        let tmpStudentData=[];
        for (let i=0;i<res.data.length;i++) {
          tmpStudentData.push(new Student(res.data[i]._id as string, res.data[i].nickname, res.data[i].uniqueNickname, res.data[i].englishName, res.data[i].chineseName, res.data[i].grade, res.data[i].class, res.data[i].pseudoId));
        }
        this.setData({
          studentData: tmpStudentData,
          multiselectEnabled: true,
        });
      });
      const eventChannel = this.getOpenerEventChannel();
      eventChannel.on('myId', (data) => {
        this.data.myId=data;
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
        }
      });
    },
    homeroomPointsTap: function() {
      wx.navigateTo({
        url: "/pages/SportsMeetHomeroomAdmin/SportsMeetHomeroomAdmin"
      });
    },
    handlePersonChoose: function(e: any) {
      let chosenId=e.currentTarget.dataset.chosenid;
      wx.navigateTo({
        url: '/pages/SportsMeetPersonaDetail/SportsMeetPersonaDetail',
        success: (res) => {
          res.eventChannel.emit('userId', this.data.studentData[chosenId].pseudoId);
        }
      });
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
    }
  }
})
