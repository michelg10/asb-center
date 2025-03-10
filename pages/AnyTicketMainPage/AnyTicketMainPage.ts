import allCollectionsData from "../../utils/allCollectionsData";
import { UserDataType } from "../../utils/common";
import { extendNumberToLengthString } from "../../utils/util";

type ComponentDataInterface = {
    eventName: String,
    eventId: String,
    userData: UserDataType,
    upcomingEventDisplay: upcomingEventDisplayType[],
    eventsList: EventsListItemType[],
    reloadEventListSetInterval: any,
    holderStatus: boolean | false,
    holderLostStatus: boolean | false,
    isAdmin: boolean,
    canIssueTicketToGuest: boolean,
    consentDone: boolean | false,
    allowConsent: boolean | false,
    // allowMeal: boolean | false,
    // allowHouse: boolean | false,
    allowMusic: boolean | false,
    allowValidation: boolean | false,
    // allowPreOptions: boolean | true,
    // allowLateOptions: boolean | true,
    db: DB.Database,
    errorMessage: String | undefined,
    consentStart: number,
    // mealStart: number,
    // houseStart: number,
    musicStart: number,
    eventStart: number,
    consentEnd: number,
    // mealEnd: number,
    // houseEnd: number,
    musicEnd: number,
    eventEnd: number,
    consentEndDisplay: string,
    // mealEndDisplay: string,
    // houseEndDisplay: string,
    musicEndDisplay: string,
};

type EventsListItemType = {
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  id: string,
  location: string,
  name: string;
};

type upcomingEventDisplayType = {
  name: string,
  location: string,
  isUpcoming: boolean,
  time: string,
  id: string,
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
    data: {} as ComponentDataInterface,

    /**
     * Component methods
     */
    methods: {
      convertUnixTime(unixTime: number): string {
        // Create a Date object from Unix time (convert seconds to milliseconds)
        const date = new Date(unixTime * 1000);

        // Options for formatting the date
        const options: Intl.DateTimeFormatOptions = {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            /*hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false // Change to true for 12-hour format*/
        };

        // Format the date to a string using the specified options
        return date.toLocaleString('en-US', options); // Change 'en-US' to your desired locale
      },
      adminButtonTapped: async function(){
        if (this.data.allowValidation){
          wx.navigateTo({
            url: "/pages/AnyTicketCheckTicket/AnyTicketCheckTicket",
            success: (res) => {
              res.eventChannel.emit("myId", this.data.userData.id);
            }
          });
        }
        else{
          wx.showModal({
            title: "Access Denied",
            content: "Ticket validation function can only be accessed on the event day.",
            showCancel: false,
            confirmText: "Dismiss"
          })
        }
      },
      consentFormTap: function(){
        if(this.data.allowConsent && !this.data.consentDone){
          wx.navigateTo({
            url: "/pages/AnyTicketSubOption/AnyTicketSubOption",
            success: (res) => {
              res.eventChannel.emit("eventName", this.data.eventName);
              res.eventChannel.emit("option", "consent");
              res.eventChannel.emit("dueDate", this.data.consentEndDisplay);
              res.eventChannel.emit("userData", this.data.userData);
            }
          });
        }
      },
      // mealOptionTap: function(){
      //   if(this.data.allowMeal){
      //     wx.navigateTo({
      //       url: "/pages/AnyTicketSubOption/AnyTicketSubOption",
      //       success: (res) => {
      //         res.eventChannel.emit("eventName", this.data.eventName);
      //         res.eventChannel.emit("option", "meal");
      //         res.eventChannel.emit("dueDate", this.data.mealEndDisplay);
      //         res.eventChannel.emit("userData", this.data.userData);
      //       }
      //     });
      //   }
      // },
      // hauntedHouseTap: function(){
      //   if(this.data.allowHouse){
      //     wx.navigateTo({
      //       url: "/pages/AnyTicketSubOption/AnyTicketSubOption",
      //       success: (res) => {
      //         res.eventChannel.emit("eventName", this.data.eventName);
      //         res.eventChannel.emit("option", "house");
      //         res.eventChannel.emit("dueDate", this.data.houseEndDisplay);
      //         res.eventChannel.emit("userData", this.data.userData);
      //       }
      //     });
      //   }
      // },
      musicRequestTap: function(){
        if(this.data.allowMusic){
          wx.navigateTo({
            url: "/pages/AnyTicketSubOption/AnyTicketSubOption",
            success: (res) => {
              res.eventChannel.emit("eventName", this.data.eventName);
              res.eventChannel.emit("option", "music");
              res.eventChannel.emit("dueDate", this.data.musicEndDisplay);
              res.eventChannel.emit("userData", this.data.userData);
            }
          });
        }
      },
      adminStationMode: function(){
        if (this.data.canIssueTicketToGuest) {
          wx.navigateTo({
            url: "/pages/AnyTicketStationCheckTicket/AnyTicketStationCheckTicket",
            success: (res) => {
              res.eventChannel.emit("myId", this.data.userData.id);
            }
          });
        };
      },
      onShow: async function(){
        let getConsentDeadline = await this.data.db.collection("SpringFormalDeadlines").where({
          optionId: "consent",
        }).get();
        // let getMealDeadline = await this.data.db.collection("SpringFormalDeadlines").where({
        //   optionId: "meal",
        // }).get();
        // let getHouseDeadline = await this.data.db.collection("SpringFormalDeadlines").where({
        //   optionId: "house",
        // }).get();
        let getMusicDeadline = await this.data.db.collection("SpringFormalDeadlines").where({
          optionId: "music",
        }).get();
        let getEventDeadline = await this.data.db.collection("SpringFormalDeadlines").where({
          optionId: "validate",
        }).get();
        let checkErrorMsg = await this.data.db.collection("SpringFormalDeadlines").where({
          optionId: "errorMsg",
        }).get();
        if (getConsentDeadline.data.length === 0 || getMusicDeadline.data.length === 0){
          this.setData({
            errorMessage: "An unexpected error occurred (GETDDLUNDEF). Check your network connection?",
          });
        }
        else if (checkErrorMsg.data.length!==0){
          if (checkErrorMsg.data[0].startTime<=(Date.now()/1000) && (Date.now()/1000)<=checkErrorMsg.data[0].endTime){
            this.setData({
              errorMessage: `Announcement from Admin: \n${checkErrorMsg.data[0].message}`,
            });
          }
        }
        let getConsentStatus = await this.data.db.collection("SpringFormalStudentData").where({
          userId: this.data.userData.student?.id,
        }).get();
        if(getConsentStatus.data.length!==0){
          if(getConsentStatus.data[0].consent){
            this.setData({
              consentDone: true
            })
          }
          else{
            this.setData({
              consentDone: false
            })
          }
        }
        else{
          this.setData({
            consentDone: false
          })
        }
        this.setData({
          consentStart: getConsentDeadline.data[0].startTime,
          // mealStart: getMealDeadline.data[0].startTime,
          // houseStart: getHouseDeadline.data[0].startTime,
          musicStart: getMusicDeadline.data[0].startTime,
          eventStart: getEventDeadline.data[0].startTime,
          consentEnd: getConsentDeadline.data[0].endTime,
          // mealEnd: getMealDeadline.data[0].endTime,
          // houseEnd: getHouseDeadline.data[0].endTime,
          musicEnd: getMusicDeadline.data[0].endTime,
          eventEnd: getEventDeadline.data[0].endTime
        });
        this.setData({
          allowConsent: this.data.consentStart<=(Date.now()/1000) && (Date.now()/1000)<=this.data.consentEnd,
          // allowMeal: this.data.mealStart<=(Date.now()/1000) && (Date.now()/1000)<=this.data.mealEnd,
          // allowHouse: this.data.houseStart<=(Date.now()/1000) && (Date.now()/1000)<=this.data.houseEnd,
          allowMusic: this.data.musicStart<=(Date.now()/1000) && (Date.now()/1000)<=this.data.musicEnd,
          allowValidation: this.data.eventStart<=(Date.now()/1000) && (Date.now()/1000)<=this.data.eventEnd
        })
        this.setData({
          // allowPreOptions: this.data.allowConsent && !this.data.consentDone,
          // allowLateOptions: this.data.allowMusic,
          consentEndDisplay: this.convertUnixTime(this.data.consentEnd),
          // mealEndDisplay: this.convertUnixTime(this.data.mealEnd),
          // houseEndDisplay: this.convertUnixTime(this.data.houseEnd),
          musicEndDisplay: this.convertUnixTime(this.data.musicEnd),
        })
      },
      reloadUpcomingEventList: function() {
        let date = new Date();
        let currentDayTimeMark = date.getHours()*60+date.getMinutes();
        let newUpcomingEventDisplay: upcomingEventDisplayType[] = [];
        for (let i=0;i<this.data.eventsList.length;i++) {
          let currentItem = this.data.eventsList[i];
          let thisEntryStartDayTimeMark = currentItem.startHour*60+currentItem.startMinute;
          let thisEntryEndDayTimeMark = currentItem.endHour*60+currentItem.endMinute;
          let entryIsNow = false;
          if (thisEntryStartDayTimeMark<=currentDayTimeMark && currentDayTimeMark<=thisEntryEndDayTimeMark) {
            entryIsNow = true;
          }
          let convertToDisplayTime = (a: number, b: number) => {
            let timePostfix = (a>=12 ? "PM" : "AM");
            let actualA = (a >= 13 ? a-12 : a);
            return `${actualA}:${extendNumberToLengthString(b, 2)}${timePostfix}`;
          }
          newUpcomingEventDisplay.push({
            name: currentItem.name,
            location: currentItem.location,
            isUpcoming: !entryIsNow && !(currentDayTimeMark>thisEntryEndDayTimeMark),
            time: `${convertToDisplayTime(currentItem.startHour, currentItem.startMinute)} - ${convertToDisplayTime(currentItem.endHour, currentItem.endMinute)}`,
            id: currentItem.id,
          });
        }
        this.setData({
          upcomingEventDisplay: newUpcomingEventDisplay,
        });
      },
      onLoad: async function(){
        this.data.db = wx.cloud.database();
        const eventChannel = this.getOpenerEventChannel();
        eventChannel.on('userData', (data: UserDataType) => {
          this.setData({
              userData: data,
          });
          if (this.data.userData.student){
            this.data.db.collection("SpringFormalTickets").where({
              userId: this.data.userData.student.id,
            }).get().then((res) => {
              if (res.data.length > 0) {
                this.setData({
                  holderStatus: true
                });
              }
              else {
                if (this.data.userData.student){
                  this.data.db.collection("SpringFormalTickets").where({
                    userId: this.data.userData.student.id.concat("LOST"),
                  }).get().then((res) => {
                    if (res.data.length > 0) {
                      this.setData({
                        holderLostStatus: true
                      });
                    }
                  })
                }
                else{
                  wx.showModal({
                    title: "Not Registered",
                    content: "You must complete registration to participate in this event.",
                    showCancel: false,
                    confirmText: "Dismiss",
                  })
                }
              }
            })
          }
          else{
            wx.showModal({
              title: "Not Registered",
              content: "You must complete registration to participate in this event.",
              showCancel: false,
              confirmText: "Dismiss",
              /*success: (res) => {
                if (res.confirm){
                  wx.navigateBack();
                }
              }*/
            })
          }
          this.data.db.collection("admins").where({
            userId: this.data.userData.id,
          }).get().then((res) => {
            if (res.data.length > 0) {
              this.setData({
                isAdmin: true
              });
              if (res.data[0].canIssueTicketToGuest){
                this.setData({
                  canIssueTicketToGuest: true
                });
              }
            };
          })
        });
        eventChannel.on('eventName', (data: String) => {
          this.setData({
              eventName: data,
          });
        });
        eventChannel.on('eventId', async (data: String) => {
          this.setData({
              eventId: data,
          });
        });
        let getConsentDeadline = await this.data.db.collection("SpringFormalDeadlines").where({
          optionId: "consent",
        }).get();
        // let getMealDeadline = await this.data.db.collection("SpringFormalDeadlines").where({
        //   optionId: "meal",
        // }).get();
        // let getHouseDeadline = await this.data.db.collection("SpringFormalDeadlines").where({
        //   optionId: "house",
        // }).get();
        let getMusicDeadline = await this.data.db.collection("SpringFormalDeadlines").where({
          optionId: "music",
        }).get();
        let getEventDeadline = await this.data.db.collection("SpringFormalDeadlines").where({
          optionId: "validate",
        }).get();
        if (getConsentDeadline.data.length === 0 || getMusicDeadline.data.length === 0){
          this.setData({
            errorMessage: "An unexpected error occurred (GETDDLUNDEF). Check your network connection?",
          });
        }
        this.setData({
          consentStart: getConsentDeadline.data[0].startTime,
          // mealStart: getMealDeadline.data[0].startTime,
          // houseStart: getHouseDeadline.data[0].startTime,
          musicStart: getMusicDeadline.data[0].startTime,
          eventStart: getEventDeadline.data[0].startTime,
          consentEnd: getConsentDeadline.data[0].endTime,
          // mealEnd: getMealDeadline.data[0].endTime,
          // houseEnd: getHouseDeadline.data[0].endTime,
          musicEnd: getMusicDeadline.data[0].endTime,
          eventEnd: getEventDeadline.data[0].endTime
        });
        let getConsentStatus = await this.data.db.collection("SpringFormalStudentData").where({
          userId: this.data.userData.student?.id,
        }).get();
        if(getConsentStatus.data.length!==0){
          if(getConsentStatus.data[0].consent){
            this.setData({
              consentDone: true
            })
          }
          else{
            this.setData({
              consentDone: false
            })
          }
        }
        else{
          this.setData({
            consentDone: false
          })
        }
        this.setData({
          allowConsent: this.data.consentStart<=(Date.now()/1000) && (Date.now()/1000)<=this.data.consentEnd,
          // allowMeal: this.data.mealStart<=(Date.now()/1000) && (Date.now()/1000)<=this.data.mealEnd,
          // allowHouse: this.data.houseStart<=(Date.now()/1000) && (Date.now()/1000)<=this.data.houseEnd,
          allowMusic: this.data.musicStart<=(Date.now()/1000) && (Date.now()/1000)<=this.data.musicEnd,
          allowValidation: this.data.eventStart<=(Date.now()/1000) && (Date.now()/1000)<=this.data.eventEnd
        })
        this.setData({
          // allowPreOptions: this.data.allowConsent && !this.data.consentDone,
          // allowLateOptions: this.data.allowMusic,
          consentEndDisplay: this.convertUnixTime(this.data.consentEnd),
          // mealEndDisplay: this.convertUnixTime(this.data.mealEnd),
          // houseEndDisplay: this.convertUnixTime(this.data.houseEnd),
          musicEndDisplay: this.convertUnixTime(this.data.musicEnd),
        })
        allCollectionsData(this.data.db, "SpringFormalTimetable").then((res) => {
          let newEventsList: EventsListItemType[] = [];
          for (let i=0;i<res.data.length;i++) {
            newEventsList.push({
              startHour: res.data[i].startHour,
              startMinute: res.data[i].startMinute,
              endHour: res.data[i].endHour,
              endMinute: res.data[i].endMinute,
              id: res.data[i].id,
              location: res.data[i].location,
              name: res.data[i].name,
            });
          }
          // earlier events first
          newEventsList.sort((a, b) => {
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
      }
  }
})