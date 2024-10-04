import { gNumber } from "../../classes/gNumber";
import { Student } from "../../classes/student";
import { cutStringToSearchTokens } from "../../utils/cutStringToSearchTokens";
// pages/SportsMeet2021MultiSelect/SportsMeet2021MultiSelect.ts

type componentDataInterface = {
  studentData: Student[],
  gNumber: gNumber[],
  studentListSearch: string,
  showSearch: boolean,
  userSelect: boolean[],
  matchingIndexes: number[],
  totalSelected: number,
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
      } else {
        for (let i=0;i<this.data.userSelect.length;i++) {
          if (this.data.userSelect[i]) {
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
            let newUserSelect = this.data.userSelect;
            let newTotalSelected = this.data.totalSelected;
            newUserSelect[matchingStudentDataIndexes[0]] = !newUserSelect[matchingStudentDataIndexes[0]];
            if (newUserSelect[matchingStudentDataIndexes[0]]) {
              newTotalSelected+=1;
            } else {
              newTotalSelected-=1;
            }
            this.setData({
              userSelect: newUserSelect,
              totalSelected: newTotalSelected,
              matchingIndexes: matchingStudentDataIndexes,
              showSearch: false,
            });
          }
        },
        fail: () => {
          this.setData({
            showSearch: true,
          })
        }
      })
    },
    handlePersonChoose: function(x: any) {
      let newUserSelect = this.data.userSelect;
      let newTotalSelected = this.data.totalSelected;
      newUserSelect[x.currentTarget.dataset.chosenid] = !newUserSelect[x.currentTarget.dataset.chosenid];
      if (newUserSelect[x.currentTarget.dataset.chosenid]) {
        newTotalSelected+=1;
      } else {
        newTotalSelected-=1;
      }
      this.setData({
        userSelect: newUserSelect,
        totalSelected: newTotalSelected,
        showSearch: false,
      });
    },
    nextClicked: function() {
      if (this.data.totalSelected === 0) {
        return;
      }
      wx.navigateTo({
        url: '/pages/SportsMeetConfirmMultiSelect/SportsMeetConfirmMultiSelect',
        success: (res) => {
          let selectedData:Student[]=[];
          for (let i=0;i<this.data.userSelect.length;i++) {
            if (this.data.userSelect[i]) {
              selectedData.push(this.data.studentData[i]);
            }
          }
          res.eventChannel.emit('selectedData', selectedData);
        }
      });
    },
    onLoad: function() {
      this.setData({
        totalSelected: 0,
        showSearch: false,
      });
      const eventChannel = this.getOpenerEventChannel();
      eventChannel.on('studentData', (data) => {
        let newUserSelect: boolean[] = Array(data.length);
        for (let i=0;i<newUserSelect.length;i++) {
          newUserSelect[i] = false;
        }
        this.setData({
          studentData: data,
          userSelect: newUserSelect,
        });
      });
      eventChannel.on('gNumber', (data) => {
        this.setData({
          gNumber: data,
        });
      });
    }
  }
})
