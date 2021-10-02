import { Student } from "../../classes/student";
import allCollectionsData from "../../utils/allCollectionsData";

// pages/Registration/Registration.ts
interface componentDataInterface {
  scrollViewHeight: number;
  studentData: Student[];
  db: DB.Database;
  matchingIndexes: number[];
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
        tmpStudentData.push(new Student(studentData.data[i]._id as string, studentData.data[i].nickname, studentData.data[i].englishName, studentData.data[i].chineseName, studentData.data[i].grade, studentData.data[i].class));
      }
      this.setData({
        studentData: tmpStudentData,
      });
    },
    onLoad: function() {
      this.data.db = wx.cloud.database();
      this.setData({
        scrollViewHeight: wx.getSystemInfoSync().windowHeight-340-122,
        matchingIndexes: [],
      }); // 340px from the bottom, 122px from the top
      this.loadData();

    },
    cutStringToSearchTokens: function(s: string) {
      if (s.length===0) {
        return [];
      }
      // cut s into "search tokens. basically anything that's not a character or a number is taken as a space and everything separated by spaces is a search token.
      s=s.toLowerCase();
      let isImportantCharacter = (c: string) => {return c>='a'&&c<='z'||c>='0'&&c<='9'||c.charCodeAt(0)>127};
      let rturn: string[]=[];
      let tmp = "";
      for (let i=0;i<s.length;i++) {
        if (isImportantCharacter(s[i])) {
          tmp+=s[i];
        } else {
          if (tmp.length>0) {
            rturn.push(tmp);
            tmp="";
          }
        }
      }
      if (tmp.length>0) {
        rturn.push(tmp);
      }
      return rturn;
    },
    handleSearchBoxChange: function(e: any) {
      if (this.data.studentData === undefined) {
        return;
      }
      let searchTokens = this.cutStringToSearchTokens(e.detail.value);
      let matchingStudentDataIndexes=[];
      if (searchTokens.length!==0) {
        for (let i=0;i<this.data.studentData.length;i++) {
          // check whether or not the user input matches this student data entry
          // in order to match this user data entry, every single search token has to match any of the tokens from this student data entry
          let currentTokens: string[]=[];
          currentTokens.push.apply(currentTokens, (this.cutStringToSearchTokens(this.data.studentData[i].nickname)));
          currentTokens.push.apply(currentTokens, (this.cutStringToSearchTokens(this.data.studentData[i].englishName)));
          currentTokens.push.apply(currentTokens, (this.cutStringToSearchTokens(this.data.studentData[i].chineseName)));
          currentTokens.push.apply(currentTokens, (this.cutStringToSearchTokens(this.data.studentData[i].studentClass.toString())));
          currentTokens.push.apply(currentTokens, (this.cutStringToSearchTokens(this.data.studentData[i].studentGrade.toString())));
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
