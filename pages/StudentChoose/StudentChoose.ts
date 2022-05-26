// pages/StudentChoose/StudentChoose.ts

import { Student } from "../../classes/student";
import allCollectionsData from "../../utils/allCollectionsData";
import { cutStringToSearchTokens } from "../../utils/cutStringToSearchTokens";
import { fillCacheSingleton } from "../../utils/fillCacheSingleton";
import { CacheSingleton } from "../MainMenu/MainMenu"

type ComponentDataInterface = {
    studentData: Student[],
    db: DB.Database,
    matchingIndexes: number[],
    searchString: string,
    limitGradeTo: number[] | undefined,
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
            console.log("select");
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
                fillCacheSingleton(this.data.db, data);
                this.setData({
                    studentData: data.studentData,
                });
            });
            eventChannel.on('limitGradeTo', (data: number[]) => {
                this.setData({
                    limitGradeTo: data,
                });
            })
        },
        doSearch: function(e: any) {
            if (this.data.studentData === undefined) {
                return;
            }
            let searchTokens = cutStringToSearchTokens(e.detail.value);
            let matchingStudentDataIndexes=[];
            if (searchTokens.length!==0) {
                for (let i=0;i<this.data.studentData.length;i++) {
                    if (this.data.limitGradeTo !== undefined) {
                        if (!this.data.limitGradeTo.includes(this.data.studentData[i].studentGrade)) {
                            continue;
                        }
                    }
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
