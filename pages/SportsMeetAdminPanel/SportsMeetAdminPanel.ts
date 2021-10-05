import { Student } from "../../classes/student";
import allCollectionsData from "../../utils/allCollectionsData";
import { cutStringToSearchTokens } from "../../utils/cutStringToSearchTokens";

// pages/SportsMeetAdminPanel/SportsMeetAdminPanel.ts
type componentDataInterface = {
  db: DB.Database,
  studentData: Student[],
  matchingIndexes: number[],
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
    onLoad: async function() {
      this.data.db = wx.cloud.database();
      let studentData = await allCollectionsData(this.data.db, "studentData");
      let tmpStudentData=[];
      for (let i=0;i<studentData.data.length;i++) {
        tmpStudentData.push(new Student(studentData.data[i]._id as string, studentData.data[i].nickname, studentData.data[i].englishName, studentData.data[i].chineseName, studentData.data[i].grade, studentData.data[i].class));
      }
      this.setData({
        studentData: tmpStudentData,
      });
    },
    handlePersonChoose: function(e: any) {
      let chosenId=e.currentTarget.dataset.chosenid;
      console.log(this.data.studentData[chosenId]);
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
