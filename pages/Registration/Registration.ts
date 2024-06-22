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
    onLoad: function() {
      this.data.skipBeenTapped=false;
      this.data.db = wx.cloud.database();
      this.setData({
        scrollViewHeight: wx.getSystemInfoSync().windowHeight-340-122,
        matchingIndexes: [],
      }); // 340px from the bottom, 122px from the top
      this.loadData();

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
