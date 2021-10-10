import { Event } from "../../classes/event";
import allCollectionsData from "../../utils/allCollectionsData";
import { createQRCode, userDataType } from "../../utils/common";
import { generatePreviewCode } from "../../utils/generatePreviewCode";
import { extendNumberToLengthString } from "../../utils/util";
import { PreviewGenerator } from "../MainMenu/MainMenu";

// pages/SportsMeet.js

type upcomingEventDisplayType = {
  name: string,
  location: string,
  isUpcoming: boolean,
  time: string,
  id: string,
};
type EventsListItemType = {
  dateDay: number,
  dateMonth: number;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  id: string,
  location: string,
  name: string;
};
type LogElementType = {
  _id: string,
  eventId: string,
  eventName: string,
  issuerId: string,
  issuerName: string,
  pointNumber: number|null,
  stampNumber: number|null,
  timeStamp: number,
  userId: string,
  leaderboardEvents: LeaderboardsEventItem[],
}
type LeaderboardsEventItem = {
  name: string,
  id: string,
  myRank: string,
};
type HomeroomComputedLeaderboardType = {
  class: number,
  classPoints: number,
  lastRank: number,
  stampPoints: number,
  classComputedName: string,
  computedScore: number,
}
interface componentDataInterface {
  userData: userDataType,
  db: DB.Database,
  leaderboardEvents: LeaderboardsEventItem[];
  eventId: string;
  eventInfo: Event;
  previewInfo: PreviewGenerator;
  codeLastGen: string;
  previewPort: string;
  lastUpdateTime: string;
  recomputeCaller: any;
  isAdmin: boolean;
  upcomingEventDisplay: upcomingEventDisplayType[];
  eventsList: EventsListItemType[];
  reloadEventListSetInterval: any;
  regularLogs: LogElementType[],
  pseudoLogs: LogElementType[],
  mergedLogs: LogElementType[],
  regularWatcher: DB.RealtimeListener,
  pseudoWatcher: DB.RealtimeListener,
  purchaseWatcher: DB.RealtimeListener,
  totalStamps: number,
  regularUsedStamps: number,
  usedPseudoStamps: number;
  stickerAngles: number[],
  viewVisible: boolean,
  leaderboardWatcher: DB.RealtimeListener,
  leaderboardRanks: number[][],
  leaderboardData: any[];
  homeroomRank: number[],
  myHomeroomRank: string,
  homeroomData: HomeroomComputedLeaderboardType[],
  homeroomLeaderboardWatcher: DB.RealtimeListener,
  leaderboardPageEventChannel: null|any,
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
    adminButtonTapped: function() {
      wx.navigateTo({
        url: "/pages/SportsMeetAdminPanel/SportsMeetAdminPanel",
      });
    },
    leaderboardButtonTapped: function(x: any) {
      let showSearch: boolean;
      let title: string;
      let usePins: boolean;
      let data: any[];
      let lastRankProperty: string;
      let pointProperty: string;
      let nameProperty: string;

      if (x !== -1) {
        let tapped=this.data.leaderboardEvents[x.currentTarget.dataset.index];
        showSearch = true;
        title = tapped.name;
        usePins = true;
        data = this.data.leaderboardData;
        lastRankProperty = `studentLastRank${tapped.id}`;
        pointProperty = `studentPointScore${tapped.id}`;
        nameProperty = "studentNickname";
      } else {
        showSearch = false;
        title = "Homeroom";
        usePins = false;
        data = this.data.homeroomData;
        lastRankProperty = "lastRank";
        pointProperty = "computedScore";
        nameProperty = "classComputedName";
      }
      wx.navigateTo({
        url: "/pages/SportsMeetLeaderboards/SportsMeetLeaderboards",
        events: {
          pageClose: () => {
            this.data.leaderboardPageEventChannel = null;
          }
        },
        success: (res) => {
          this.data.leaderboardPageEventChannel = res.eventChannel;
          res.eventChannel.emit("showSearch", showSearch);
          res.eventChannel.emit("title", title);
          res.eventChannel.emit("usePins", usePins);
          res.eventChannel.emit("data", data);
          res.eventChannel.emit("lastRankProperty", lastRankProperty);
          res.eventChannel.emit("pointProperty", pointProperty);
          res.eventChannel.emit("nameProperty", nameProperty);
        }
      })
    },
    reloadUpcomingEventList: function() {
      let date = new Date();
      console.log("Reload upcoming events list");
      let currentDayTimeMark = date.getHours()*60+date.getMinutes();
      let newUpcomingEventDisplay: upcomingEventDisplayType[] = [];
      for (let i=0;i<this.data.eventsList.length;i++) {
        let currentItem = this.data.eventsList[i];
        // if it is not today
        if (date.getMonth()+1 !== currentItem.dateMonth || date.getDate() !== currentItem.dateDay) {
          continue;
        }
        let thisEntryStartDayTimeMark = currentItem.startHour*60+currentItem.startMinute;
        let thisEntryEndDayTimeMark = currentItem.endHour*60+currentItem.endMinute;
        if (currentDayTimeMark>thisEntryEndDayTimeMark) {
          // after the end time
          continue;
        }
        let includeEntry = false;
        let entryIsNow = false;
        if (thisEntryStartDayTimeMark<=currentDayTimeMark && currentDayTimeMark<=thisEntryEndDayTimeMark) {
          includeEntry = true;
          entryIsNow = true;
        } else {
          let minutesToEvent = thisEntryStartDayTimeMark-currentDayTimeMark;
          if (minutesToEvent<30) {
            includeEntry = true;
          }
        }
        let convertToDisplayTime = (a: number, b: number) => {
          let timePostfix = (a>=12 ? "PM" : "AM");
          let actualA = a-12;
          return `${actualA}:${extendNumberToLengthString(b, 2)}${timePostfix}`;
        }
        if (includeEntry) {
          newUpcomingEventDisplay.push({
            name: currentItem.name,
            location: currentItem.location,
            isUpcoming: !entryIsNow,
            time: `${convertToDisplayTime(currentItem.startHour, currentItem.startMinute)} - ${convertToDisplayTime(currentItem.endHour, currentItem.endMinute)}`,
            id: currentItem.id,
          });
        }
      }
      this.setData({
        upcomingEventDisplay: newUpcomingEventDisplay,
      });
    },
    recomputeMerge: function() {
      console.log("Running data merge...");
      let newMergedResult: LogElementType[]=[];
      newMergedResult.push.apply(newMergedResult, this.data.regularLogs);
      newMergedResult.push.apply(newMergedResult, this.data.pseudoLogs);
      newMergedResult.sort((a, b) => {
        if (a.timeStamp < b.timeStamp) {
          return -1;
        }
        return 1;
      });
      for (let i=0;i<newMergedResult.length;i++) {
        if (newMergedResult[i].pointNumber === undefined) {
          newMergedResult[i].pointNumber=null;
        }
        if (newMergedResult[i].stampNumber === undefined) {
          newMergedResult[i].stampNumber=null;
        }
      }
      let eventDoneMap = new Map();
      let newTotalStampNumber = 0;
      for (let i=0;i<newMergedResult.length;i++) {
        if (!eventDoneMap.has(newMergedResult[i].eventId)) {
          eventDoneMap.set(newMergedResult[i].eventId, true);
          newTotalStampNumber+=5;
        }
        if (newMergedResult[i].stampNumber !== null) {
          newTotalStampNumber+=newMergedResult[i].stampNumber!;
        }
      }
      let stickerDisplayStamps = Math.min(3, newTotalStampNumber/5.0);
      
      let newStickerAngles = Array(3);
      for (let i=0;i<3;i++) {
        newStickerAngles[i]=360;
      }
      for (let i=0;i<stickerDisplayStamps;i++) {
        newStickerAngles[i]=360-Math.min(stickerDisplayStamps-i, 1)*360;
      }
      this.setData({
        stickerAngles: newStickerAngles,
        mergedLogs: newMergedResult,
        totalStamps: newTotalStampNumber,
      });
    },
    onLoad: async function() {
      const eventChannel = this.getOpenerEventChannel();
      this.setData({
        previewPort: "SportsMeetInnerPreviewPort",
        viewVisible: true,
        leaderboardPageEventChannel: null,
      });
      this.data.db = wx.cloud.database();
      {
        let getLeaderboardEvents = await allCollectionsData(this.data.db, "SportsMeet2021Events");
        let newLeaderboardEvents: LeaderboardsEventItem[]=[];
        for (let i=0;i<getLeaderboardEvents.data.length;i++) {
          if (getLeaderboardEvents.data[i].rankLeaderboard) {
            newLeaderboardEvents.push({
              name: getLeaderboardEvents.data[i].name,
              id: getLeaderboardEvents.data[i].id,
              myRank: "",
            });
          }
        }
        this.setData({
          leaderboardEvents: newLeaderboardEvents,
        });
      }
      eventChannel.on('userData', (data: userDataType) => {
        this.setData({
          userData: data,
        });
        this.data.leaderboardWatcher=this.data.db.collection(`SportsMeet2021LeaderboardProcessed${data.student!.grade}`).watch({
          onChange: (snapshot) => {
            let myIndexWithinDocs = -1;
            for (let i=0;i<snapshot.docs.length;i++) {
              if (snapshot.docs[i].studentId ===data.id) {
                myIndexWithinDocs = i;
              }
            }
            let newLeaderboardEvents = this.data.leaderboardEvents;
            let newLeaderboardRanks:number[][]=[];
            for (let i=0;i<newLeaderboardEvents.length;i++) {
              let sortMapping:number[] = Array(snapshot.docs.length); // eventually invert this to get everyone's ranking
              for (let i=0;i<snapshot.docs.length;i++) {
                sortMapping[i]=i;
              }
              let currentConsideringProperty = `studentPointScore${newLeaderboardEvents[i].id}`;
              sortMapping.sort((a,b) => {
                let actualA = snapshot.docs[a][currentConsideringProperty];
                let actualB = snapshot.docs[b][currentConsideringProperty];
                if (actualA === actualB) {
                  return 0;
                }
                if (actualA < actualB) {
                  return 1;
                }
                return -1;
              });
              let ranking:number[] = Array(sortMapping.length);
              for (let i=0;i<ranking.length;i++) {
                ranking[sortMapping[i]]=i;
              }
              newLeaderboardRanks.push(ranking);
              if (myIndexWithinDocs === -1) {
                newLeaderboardEvents[i].myRank = "Error";
              } else {
                let myRank=(ranking[myIndexWithinDocs]+1).toString();
                if (ranking[myIndexWithinDocs]+1 === 1) {
                  myRank=`${myRank}st`;
                } else if (ranking[myIndexWithinDocs]+1 === 2) {
                  myRank=`${myRank}nd`;
                } else if (ranking[myIndexWithinDocs]+1 === 3) {
                  myRank=`${myRank}rd`;
                } else {
                  myRank=`${myRank}th`;
                }
                newLeaderboardEvents[i].myRank = myRank;
              }
            }
            this.setData({
              leaderboardData: snapshot.docs as any[],
              leaderboardRanks: newLeaderboardRanks,
              leaderboardEvents: newLeaderboardEvents,
            });
            if (this.data.leaderboardPageEventChannel !== null) {
              console.log("Emitting change to leaderboard page");
              this.data.leaderboardPageEventChannel.emit("data", this.data.leaderboardData);
            }
          }, onError: function(err) {
            console.error('the leaderboard watch closed because of error', err)          
          }
        });
        this.data.homeroomLeaderboardWatcher=this.data.db.collection(`SportsMeet2021HomeroomProcessed${data.student!.grade}`).watch({
          onChange: (snapshot) => {
            let newHomeroomData = snapshot.docs as HomeroomComputedLeaderboardType[];
            for (let i=0;i<newHomeroomData.length;i++) {
              newHomeroomData[i].classComputedName=`${data.student!.grade}-${newHomeroomData[i].class}`;
              newHomeroomData[i].computedScore=newHomeroomData[i].classPoints+newHomeroomData[i].stampPoints/10;
            }
            let myIndexWithinDocs = -1;
            let newMyHomeroomRank = "";
            for (let i=0;i<newHomeroomData.length;i++) {
              if (newHomeroomData[i].class ===data.student!.class) {
                myIndexWithinDocs = i;
              }
            }
            let sortMapping:number[] = Array(newHomeroomData.length); // eventually invert this to get everyone's ranking
            for (let i=0;i<newHomeroomData.length;i++) {
              sortMapping[i]=i;
            }
            sortMapping.sort((a, b) => {
              // negative if a<b, zero if equal and positive if a>b
              let actualA = newHomeroomData[a].computedScore;
              let actualB = newHomeroomData[b].computedScore;
              if (actualA === actualB) {
                return 0;
              }
              if (actualA < actualB) {
                return 1;
              }
              return -1;
            });
            let ranking:number[] = Array(sortMapping.length);
            for (let i=0;i<ranking.length;i++) {
              ranking[sortMapping[i]]=i;
            }
            if (myIndexWithinDocs === -1) {
              newMyHomeroomRank = "Error";
            } else {
              let myRank=(ranking[myIndexWithinDocs]+1).toString();
              if (ranking[myIndexWithinDocs]+1 === 1) {
                myRank=`${myRank}st`;
              } else if (ranking[myIndexWithinDocs]+1 === 2) {
                myRank=`${myRank}nd`;
              } else if (ranking[myIndexWithinDocs]+1 === 3) {
                myRank=`${myRank}rd`;
              } else {
                myRank=`${myRank}th`;
              }
              newMyHomeroomRank = myRank;
            }
            this.setData({
              homeroomRank: ranking,
              myHomeroomRank: newMyHomeroomRank,
              homeroomData: newHomeroomData,
            });
          }, onError: function(err) {
            console.error('the homeroom watch closed because of error', err);
          }
        })
        this.data.regularWatcher=this.data.db.collection(`SportsMeet2021StampLog${data.student?.grade}`).where({
          userId: data.id,
        }).watch({
          onChange: (snapshot) => {
            this.data.regularLogs = snapshot.docs as any[],
            this.recomputeMerge();
          }, onError: function(err) {
            console.error('the user watch closed because of error', err)
          }
        });
        this.data.pseudoWatcher=this.data.db.collection(`SportsMeet2021StampLog${data.student?.grade}`).where({
          userId: data.student!.pseudoId,
        }).watch({
          onChange: (snapshot) => {
            this.data.pseudoLogs = snapshot.docs as any[],
            this.recomputeMerge();
          }, onError: function(err) {
            console.error('the pseudo watch closed because of error', err);
          }
        });
        this.data.purchaseWatcher=this.data.db.collection(`SportsMeet2021TransactionLog${data.student?.grade}`).where({
          userId: data.id,
        }).watch({
          onChange: (snapshot) => {
            let totalPurchase=0;
            for (let i=0;i<snapshot.docs.length;i++) {
              totalPurchase+=snapshot.docs[i].itemCost;
            }
            this.setData({
              regularUsedStamps: totalPurchase,
            });
          }, onError: function(err) {
            console.error('the purchase watch closed because of error', err)
          }
        });
        allCollectionsData(this.data.db, `SportsMeet2021TransactionLog${data.student?.grade}`, {
          userId: data.student!.pseudoId
        }).then((res) => {
          let newUsedPseudoStamps = 0;
          for (let i=0;i<res.data.length;i++) {
            newUsedPseudoStamps+=res.data[i].itemCost;
          }
          this.setData({
            usedPseudoStamps: newUsedPseudoStamps,
          });
        })
        allCollectionsData(this.data.db, "SportsMeet2021Timetable").then((res) => {
          let newEventsList: EventsListItemType[] = [];
          for (let i=0;i<res.data.length;i++) {
            // if it isn't available for the current grade
            if (res.data[i][`grade${data.student!.grade}StartHour`] === undefined) {
              continue;
            }

            newEventsList.push({
              dateDay: res.data[i].dateDay,
              dateMonth: res.data[i].dateMonth,
              startHour: res.data[i][`grade${data.student!.grade}StartHour`],
              startMinute: res.data[i][`grade${data.student!.grade}StartMinute`],
              endHour: res.data[i][`grade${data.student!.grade}EndHour`],
              endMinute: res.data[i][`grade${data.student!.grade}EndMinute`],
              id: res.data[i].id,
              location: res.data[i].location,
              name: res.data[i].name,
            });
          }
          // earlier events first
          newEventsList.sort((a, b) => {
            if (a.dateMonth < b.dateMonth) {
              return -1;
            }
            if (a.dateMonth > b.dateMonth) {
              return 1;
            }
            if (a.dateDay < b.dateDay) {
              return -1;
            }
            if (a.dateDay > b.dateDay) {
              return 1;
            }
            if (a.startHour < b.startHour) {
              return -1;
            }
            if (a.startHour > b.startHour) {
              return 1;
            }
            if (a.startMinute < b.startMinute) {
              return -1;
            }
            if (a.startMinute > b.startMinute) {
              return 1;
            }
            if (a.endMinute < b.endMinute) {
              return -1;
            }
            if (a.endMinute > b.endMinute) {
              return 1;
            }
            if (a.name < b.name) {
              return -1;
            }
            if (a.name > b.name) {
              return 1;
            }
            return 0;
          });
          this.setData({
            eventsList: newEventsList,
          });
          this.reloadUpcomingEventList();
          this.data.reloadEventListSetInterval = setInterval(() => {
            this.reloadUpcomingEventList();
          }, 10*1000);
        });

        this.data.db.collection("SportsMeet2021Admin").where({
          adminId: this.data.userData.id,
        }).get().then((res) => {
          this.setData({
            isAdmin:  res.data.length !== 0,
          });
        });
      });
      eventChannel.on('eventId', (data: string) => {
        this.setData({
          eventId: data,
        });
      });
      eventChannel.on('eventInfo', (data: Event) => {
        this.setData({
          eventInfo: data,
        });
      })
      eventChannel.on('previewInfo', (data: PreviewGenerator) => {
        this.setData({
          previewInfo: data,
        });
      })
      this.data.codeLastGen = "";
      setTimeout(
        () => {
          this.data.recomputeCaller = setInterval(() => {this.recomputeCode()}, 500);
        }, 500
      );
    },
    onShow: function() {
      this.data.viewVisible = true;
    }, onHide: function() {
      this.data.viewVisible = false;
    },
    recomputeCode: function() {
      if (this.data.viewVisible) {
        let accessCodeContents=generatePreviewCode(this.data.previewInfo.previewData.userCode);
        if (accessCodeContents !== this.data.codeLastGen) {
          let myCreateQRCode = createQRCode.bind(this);
          myCreateQRCode(this.data.previewPort, accessCodeContents, 'FFFFFF');
          this.data.codeLastGen=accessCodeContents;
        }
        let date = new Date();
        let newUpdateString=`${extendNumberToLengthString(date.getHours(), 2)}:${extendNumberToLengthString(date.getMinutes(), 2)}:${extendNumberToLengthString(date.getSeconds(), 2)}`;
        this.setData({
          lastUpdateTime: newUpdateString,
        });
      }
    },
    onUnload: function() {
      clearInterval(this.data.recomputeCaller);
      clearInterval(this.data.reloadEventListSetInterval);
      this.data.regularWatcher.close();
      this.data.pseudoWatcher.close();
      this.data.purchaseWatcher.close();
      this.data.leaderboardWatcher.close();
      this.data.homeroomLeaderboardWatcher.close();
    }
  }
})
