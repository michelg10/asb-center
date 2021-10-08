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
}

interface componentDataInterface {
  userData: userDataType,
  db: DB.Database,
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
    reloadUpcomingEventList: function() {
      let date = new Date();
      console.log("Reload upcoming events list");
      let currentDayTimeMark = date.getHours()*60+date.getMinutes();
      currentDayTimeMark = 13*60+59;
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
      this.setData({
        mergedLogs: newMergedResult,
      });
    },
    onLoad: function() {
      const eventChannel = this.getOpenerEventChannel();
      this.setData({
        previewPort: "SportsMeetInnerPreviewPort",
      });
      this.data.db = wx.cloud.database();
      eventChannel.on('userData', (data: userDataType) => {
        this.setData({
          userData: data,
        });
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
            console.error('the pseudo watch closed because of error', err)
          }
        });
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
    recomputeCode: function() {
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
    },
    onUnload: function() {
      clearInterval(this.data.recomputeCaller);
      clearInterval(this.data.reloadEventListSetInterval);
      this.data.regularWatcher.close();
      this.data.pseudoWatcher.close();
    }
  }
})
