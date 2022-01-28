// pages/StudentChoose/StudentChoose.ts

import { Student } from "../../classes/student";
import allCollectionsData from "../../utils/allCollectionsData";
import { cutStringToSearchTokens } from "../../utils/cutStringToSearchTokens";
import { CacheSingleton } from "../MainMenu/MainMenu"

type ComponentDataInterface = {
    studentData: Student[],
    db: DB.Database,
    matchingIndexes: number[],
    searchString: string,
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
    data: { } as ComponentDataInterface,
    
    /**
    * Component methods
    */
    methods: {
        selectStudent: function(x: any) {
            let index = x.currentTarget.dataset.index;
            const eventChannel = this.getOpenerEventChannel();
            eventChannel.emit("selectedStudent", this.data.studentData[index]);
            wx.navigateBack();
        },
        onLoad: function() {
            this.data.db = wx.cloud.database();
            this.data.matchingIndexes = [];
            const eventChannel = this.getOpenerEventChannel();
            eventChannel.on('cacheSingleton', async (data: CacheSingleton) => {
                if (data.studentData === undefined) {
                    // fetch from server
                    let studentData = await allCollectionsData(this.data.db, "studentData");
                    let tmpStudentData=[];
                    for (let i=0;i<studentData.data.length;i++) {
                        tmpStudentData.push(new Student(studentData.data[i]._id as string, studentData.data[i].nickname, studentData.data[i].uniqueNickname, studentData.data[i].englishName, studentData.data[i].chineseName, studentData.data[i].grade, studentData.data[i].class, studentData.data[i].pseudoId));
                    }
                    data.studentData = tmpStudentData;
                }
                this.setData({
                    studentData: data.studentData,
                });
            });
        },
        doSearch: function(e: any) {
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
