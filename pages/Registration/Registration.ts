import { Student } from "../../classes/student";
import allCollectionsData from "../../utils/allCollectionsData";
import { cutStringToSearchTokens } from "../../utils/cutStringToSearchTokens";

// pages/Registration/Registration.ts
interface componentDataInterface {
  scrollViewHeight: number;
  studentData: Student[];
  db: DB.Database;
  matchingIndexes: number[];
  skipBeenTapped: boolean;
  startTime: number;
  endTime: number;
  startTimeDisplay: string;
  endTimeDisplay: string;
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
    loadData: async function() {
      let studentData = await allCollectionsData(this.data.db, "studentData");
      let tmpStudentData=[];
      for (let i=0;i<studentData.data.length;i++) {
        tmpStudentData.push(new Student(studentData.data[i]._id as string, studentData.data[i].nickname, studentData.data[i].uniqueNickname, studentData.data[i].englishName, studentData.data[i].chineseName, studentData.data[i].grade, studentData.data[i].class, studentData.data[i].pseudoId));
      }
      this.setData({
        studentData: tmpStudentData,
      });
    },
    onLoad: async function() {
      wx.showLoading({
        title: "Loading...",
        mask: true,
      });
      this.data.skipBeenTapped = false;
      this.data.db = wx.cloud.database();
      let deadlineRes = await this.data.db.collection("config").where({
        key: 'registration'
      }).get();
      let currentTime = Date.now()/1000;
      this.setData({
        scrollViewHeight: wx.getSystemInfoSync().windowHeight-340-122,
        matchingIndexes: [],
        startTime: deadlineRes.data[0].startTime,
        endTime: deadlineRes.data[0].endTime,
        startTimeDisplay: this.convertUnixTimeToMin(deadlineRes.data[0].startTime),
        endTimeDisplay: this.convertUnixTimeToMin(deadlineRes.data[0].endTime)
      }); // 340px from the bottom, 122px from the top
      if (!(this.data.startTime <= currentTime && currentTime <= this.data.endTime)) {
        wx.hideLoading();
        wx.showModal({
          title: "Access Denied",
          content: `Registration starts on ${this.data.startTimeDisplay} and ends on ${this.data.endTimeDisplay}. If you have any concerns, please contact the ASB.`,
          showCancel: false,
          confirmText: "Dismiss",
          success: (modalRes) => {
            if (modalRes.confirm) {
              wx.reLaunch({
                url: "/pages/MainMenu/MainMenu"
              });
            };
          }
        });
      };
      await this.loadData();
      wx.hideLoading();
    },
    convertUnixTimeToMin(unixTime: number): string {
      const date = new Date(unixTime * 1000);
      const options: Intl.DateTimeFormatOptions = {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          //second: '2-digit',
          hour12: false,
          timeZone: 'Asia/Shanghai'
      };
      return date.toLocaleString('zh-CN', options);
    },
    backButtonTapped: function() {
      wx.vibrateShort({
        type: "light"
      });
      wx.reLaunch({
        url: "/pages/MainMenu/MainMenu"
      });
    },
    buttonTapVibrate: function() {
      wx.vibrateShort({
        type: "medium"
      });
    },
    handlePersonChoose: function(e: any) {
      let chosenId=e.currentTarget.dataset.chosenid;
      wx.navigateTo({
        url: '/pages/RegistrationConfirmation/RegistrationConfirmation',
        success: (res) => {
          res.eventChannel.emit('registrationConfirmationStudent', this.data.studentData[chosenId]);
        }
      });
    },
    skipRegistration: async function() {
      if (this.data.skipBeenTapped) {
        return;
      }
      this.data.skipBeenTapped=true;
      await wx.cloud.callFunction({
        name: "registerUser",
        data: {}
      })
      wx.reLaunch({
        url: "/pages/MainMenu/MainMenu"
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
