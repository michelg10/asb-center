import allCollectionsData from "../../utils/allCollectionsData";
import { createQRCode, darkContainerColor, lightContainerColor, UserDataType } from "../../utils/common";
import { extendNumberToLengthString } from "../../utils/util";
import { generateQrCode } from "../../utils/generateQrCode";
import { isDarkTheme } from "../../utils/isDarkTheme";

type ComponentDataInterface = {
    eventName: String,
    eventId: String,
    userData: UserDataType,
    upcomingEventDisplay: upcomingEventDisplayType[],
    eventsList: EventsListItemType[],
    reloadEventListSetInterval: any,
    holderStatus: boolean | false,
    holderLostStatus: boolean | false,
    holderTicketId: string,
    ticketUsed: boolean | false,
    isAdmin: boolean,
    canIssueTicketToGuest: boolean,
    // consentDone: boolean | false,
    // allowConsent: boolean | false,
    // allowMeal: boolean | false,
    allowHouse: boolean | false,
    hideHouse: boolean | false,
    allowPerf: boolean | false,
    allowSuggestions: boolean | false,
    allowPrompose: boolean | false,
    allowMusic: boolean | false,
    allowTicket: boolean | false,
    allowValidation: boolean | false,
    allowPreOptions: boolean | true,
    allowLateOptions: boolean | true,
    db: DB.Database,
    errorMessage: string | undefined,
    // consentStart: number,
    // mealStart: number,
    houseStart: number,
    perfStart: number,
    suggestionsStart: number,
    promposeStart: number,
    musicStart: number,
    ticketStart: number,
    eventStart: number,
    // consentEnd: number,
    // mealEnd: number,
    houseEnd: number,
    perfEnd: number,
    suggestionsEnd: number,
    promposeEnd: number,
    musicEnd: number,
    ticketEnd: number,
    eventEnd: number,
    // consentEndDisplay: string,
    // mealEndDisplay: string,
    houseEndDisplay: string,
    houseStartDisplay: string,
    perfEndDisplay: string,
    suggestionsEndDisplay: string,
    promposeEndDisplay: string,
    musicEndDisplay: string,
    ticketStartDisplay: string,
    ticketEndDisplay: string,
    recomputeCaller: any,
    viewVisible: boolean,
    codeLastGen: string
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
      convertUnixTimeToMin(unixTime: number): string {
        const date = new Date(unixTime * 1000);
        const options: Intl.DateTimeFormatOptions = {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            //second: '2-digit',
            hour12: false
        };
        return date.toLocaleString('en-US', options);
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
      // consentFormTap: function(){
      //   if(this.data.allowConsent && !this.data.consentDone){
      //     wx.navigateTo({
      //       url: "/pages/AnyTicketSubOption/AnyTicketSubOption",
      //       success: (res) => {
      //         res.eventChannel.emit("eventName", this.data.eventName);
      //         res.eventChannel.emit("option", "consent");
      //         res.eventChannel.emit("dueDate", this.data.consentEndDisplay);
      //         res.eventChannel.emit("userData", this.data.userData);
      //       }
      //     });
      //   }
      // },
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
      houseTap: function(){
        if(this.data.allowHouse){
          wx.navigateTo({
            url: "/pages/AnyTicketSubOption/AnyTicketSubOption",
            success: (res) => {
              res.eventChannel.emit("eventName", this.data.eventName);
              res.eventChannel.emit("option", "house");
              res.eventChannel.emit("dueDate", this.data.houseEndDisplay);
              res.eventChannel.emit("userData", this.data.userData);
            }
          });
        }
      },
      performanceTap: function(){
        if(this.data.allowPerf){
          wx.openEmbeddedMiniProgram({
            appId: 'wxebadf544ddae62cb',
            path: 'pages/webview/index?sid=21147588&hash=vx69&navigateBackMiniProgram=true',
            allowFullScreen: true
          });
        }
      },
      promposalTap: function(){
        if(this.data.allowPrompose){
          wx.openEmbeddedMiniProgram({
            appId: 'wxebadf544ddae62cb',
            path: 'pages/webview/index?sid=21147569&hash=2o6b&navigateBackMiniProgram=true',
            allowFullScreen: true
          });
        }
      },
      suggestionsTap: function() {
        wx.navigateTo({
          url: '/pages/AnyEventIdea/AnyEventIdea',
          success: (res) => {
            res.eventChannel.emit('userData', this.data.userData);
            res.eventChannel.emit('eventName', "PROM 2025 Suggestions");
          }
        })
      },
      musicRequestTap: function() {
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
      ticketTap: function(){
        if(this.data.allowTicket){
          if(this.data.userData.student){
            wx.openEmbeddedMiniProgram({
              appId: 'wxebadf544ddae62cb',
              path: 'pages/webview/index?sid=21597613&hash=xd16&navigateBackMiniProgram=true',
              allowFullScreen: true
            });
          } else {
            wx.showModal({
              title: "Not Registered",
              content: "You must complete registration to participate in this event.",
              showCancel: false,
              confirmText: "Dismiss",
            })
          }
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
        let deadlineRes = await this.data.db.collection("PromDeadlines").get();
        let getHouseDeadline = deadlineRes.data.find(d => d.optionId === "house");
        let getPerfDeadline = deadlineRes.data.find(d => d.optionId === "perf");
        let getSuggestionsDeadline = deadlineRes.data.find(d => d.optionId === "suggestions");
        let getPromposeDeadline = deadlineRes.data.find(d => d.optionId === "promposal");
        let getMusicDeadline = deadlineRes.data.find(d => d.optionId === "music");
        let getTicketDeadline = deadlineRes.data.find(d => d.optionId === "ticket");
        let getEventDeadline = deadlineRes.data.find(d => d.optionId === "validate");
        let checkErrorMsg = deadlineRes.data.find(d => d.optionId === "errorMsg");
        if (!getHouseDeadline || !getPerfDeadline || !getSuggestionsDeadline || !getPromposeDeadline || !getMusicDeadline || !getTicketDeadline || !getEventDeadline || !checkErrorMsg){
          this.setData({
            errorMessage: "An unexpected error occurred (GETDDLUNDEF). Check your network connection?",
          });
        } else if (checkErrorMsg) {
          if (checkErrorMsg.startTime<=(Date.now()/1000) && (Date.now()/1000)<=checkErrorMsg.endTime){
            this.setData({
              errorMessage: `Announcement from the ASB: \n${checkErrorMsg?.message}`,
            });
          }
        }
        // let getConsentStatus = await this.data.db.collection("TedXStudentData").where({
        //   userId: this.data.userData.student?.id,
        // }).get();
        // if(getConsentStatus.data.length!==0){
        //   if(getConsentStatus.data[0].consent){
        //     this.setData({
        //       consentDone: true
        //     })
        //   }
        //   else{
        //     this.setData({
        //       consentDone: false
        //     })
        //   }
        // }
        // else{
        //   this.setData({
        //     consentDone: false
        //   })
        // }
        this.setData({
          // consentStart: getConsentDeadline.data[0].startTime,
          // mealStart: getMealDeadline.data[0].startTime,
          houseStart: getHouseDeadline?.startTime,
          perfStart: getPerfDeadline?.startTime,
          suggestionsStart: getSuggestionsDeadline?.startTime,
          promposeStart: getPromposeDeadline?.startTime,
          musicStart: getMusicDeadline?.startTime,
          ticketStart: getTicketDeadline?.startTime,
          eventStart: getEventDeadline?.startTime,
          // consentEnd: getConsentDeadline.data[0].endTime,
          // mealEnd: getMealDeadline.data[0].endTime,
          houseEnd: getHouseDeadline?.endTime,
          hideHouse: getHouseDeadline?.hide,
          perfEnd: getPerfDeadline?.endTime,
          suggestionsEnd: getSuggestionsDeadline?.endTime,
          promposeEnd: getPromposeDeadline?.endTime,
          musicEnd: getMusicDeadline?.endTime,
          ticketEnd: getTicketDeadline?.endTime,
          eventEnd: getEventDeadline?.endTime
        });
        this.setData({
          // allowConsent: this.data.consentStart<=(Date.now()/1000) && (Date.now()/1000)<=this.data.consentEnd,
          // allowMeal: this.data.mealStart<=(Date.now()/1000) && (Date.now()/1000)<=this.data.mealEnd,
          allowHouse: this.data.houseStart<=(Date.now()/1000) && (Date.now()/1000)<=this.data.houseEnd,
          allowPerf: this.data.perfStart<=(Date.now()/1000) && (Date.now()/1000)<=this.data.perfEnd,
          allowSuggestions: this.data.suggestionsStart<=(Date.now()/1000) && (Date.now()/1000)<=this.data.suggestionsEnd,
          allowPrompose: this.data.promposeStart<=(Date.now()/1000) && (Date.now()/1000)<=this.data.promposeEnd,
          allowMusic: this.data.musicStart<=(Date.now()/1000) && (Date.now()/1000)<=this.data.musicEnd,
          allowTicket: this.data.ticketStart<=(Date.now()/1000) && (Date.now()/1000)<=this.data.ticketEnd,
          allowValidation: this.data.eventStart<=(Date.now()/1000) && (Date.now()/1000)<=this.data.eventEnd
        })
        this.setData({
          allowPreOptions: this.data.allowPrompose || this.data.allowPerf,
          allowLateOptions: this.data.allowMusic || this.data.allowSuggestions,
          // consentEndDisplay: this.convertUnixTime(this.data.consentEnd),
          // mealEndDisplay: this.convertUnixTime(this.data.mealEnd),
          houseStartDisplay: this.convertUnixTimeToMin(this.data.houseStart),
          houseEndDisplay: this.convertUnixTimeToMin(this.data.houseEnd),
          perfEndDisplay: this.convertUnixTime(this.data.perfEnd),
          suggestionsEndDisplay: this.convertUnixTime(this.data.suggestionsEnd),
          promposeEndDisplay: this.convertUnixTime(this.data.promposeEnd),
          musicEndDisplay: this.convertUnixTime(this.data.musicEnd),
          ticketStartDisplay: this.convertUnixTime(this.data.ticketStart),
          ticketEndDisplay: this.convertUnixTime(this.data.ticketEnd),
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
        this.data.viewVisible = true;
        const eventChannel = this.getOpenerEventChannel();
        eventChannel.on('userData', (data: UserDataType) => {
          this.setData({
              userData: data,
          });
          if (this.data.userData.student){
            this.data.db.collection("TedXTickets").where({
              userId: this.data.userData.student.id,
            }).get().then((res) => {
              if (res.data.length > 0) {
                this.setData({
                  holderStatus: true,
                  holderTicketId: res.data[0].ticketId
                });
                if (res.data[0].entry){
                  this.setData({
                    ticketUsed: true
                  })
                }
                setTimeout(
                  () => {
                    this.data.recomputeCaller = setInterval(() => {this.recomputeCode()}, 500);
                  }, 500
                );
              }
              else {
                if (this.data.userData.student){
                  this.data.db.collection("TedXTickets").where({
                    userId: this.data.userData.student.id.concat("LOST"),
                  }).get().then((res) => {
                    if (res.data.length > 0) {
                      this.setData({
                        holderLostStatus: true
                      });
                    }
                  })
                } else {
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
        let deadlineRes = await this.data.db.collection("PromDeadlines").get();

        let getHouseDeadline = deadlineRes.data.find(d => d.optionId === "house");
        let getPerfDeadline = deadlineRes.data.find(d => d.optionId === "perf");
        let getSuggestionsDeadline = deadlineRes.data.find(d => d.optionId === "suggestions");
        let getPromposeDeadline = deadlineRes.data.find(d => d.optionId === "promposal");
        let getMusicDeadline = deadlineRes.data.find(d => d.optionId === "music");
        let getTicketDeadline = deadlineRes.data.find(d => d.optionId === "ticket");
        let getEventDeadline = deadlineRes.data.find(d => d.optionId === "validate");
        let checkErrorMsg = deadlineRes.data.find(d => d.optionId === "errorMsg");
        if (!getHouseDeadline || !getPerfDeadline || !getSuggestionsDeadline || !getPromposeDeadline || !getMusicDeadline || !getTicketDeadline || !getEventDeadline || !checkErrorMsg){
          this.setData({
            errorMessage: "An unexpected error occurred (GETDDLUNDEF). Check your network connection?",
          });
        } else if (checkErrorMsg) {
          if (checkErrorMsg.startTime<=(Date.now()/1000) && (Date.now()/1000)<=checkErrorMsg.endTime){
            this.setData({
              errorMessage: `Announcement from the ASB: \n${checkErrorMsg?.message}`,
            });
          }
        }
        this.setData({
          // consentStart: getConsentDeadline.data[0].startTime,
          // mealStart: getMealDeadline.data[0].startTime,
          houseStart: getHouseDeadline?.startTime,
          perfStart: getPerfDeadline?.startTime,
          suggestionsStart: getSuggestionsDeadline?.startTime,
          promposeStart: getPromposeDeadline?.startTime,
          musicStart: getMusicDeadline?.startTime,
          ticketStart: getTicketDeadline?.startTime,
          eventStart: getEventDeadline?.startTime,
          // consentEnd: getConsentDeadline.data[0].endTime,
          // mealEnd: getMealDeadline.data[0].endTime,
          houseEnd: getHouseDeadline?.endTime,
          hideHouse: getHouseDeadline?.hide,
          perfEnd: getPerfDeadline?.endTime,
          suggestionsEnd: getSuggestionsDeadline?.endTime,
          promposeEnd: getPromposeDeadline?.endTime,
          musicEnd: getMusicDeadline?.endTime,
          ticketEnd: getTicketDeadline?.endTime,
          eventEnd: getEventDeadline?.endTime
        });
        // let getConsentStatus = await this.data.db.collection("TedXStudentData").where({
        //   userId: this.data.userData.student?.id,
        // }).get();
        // if(getConsentStatus.data.length!==0){
        //   if(getConsentStatus.data[0].consent){
        //     this.setData({
        //       consentDone: true
        //     })
        //   }
        //   else{
        //     this.setData({
        //       consentDone: false
        //     })
        //   }
        // }
        // else{
        //   this.setData({
        //     consentDone: false
        //   })
        // }
        this.setData({
          // allowConsent: this.data.consentStart<=(Date.now()/1000) && (Date.now()/1000)<=this.data.consentEnd,
          // allowMeal: this.data.mealStart<=(Date.now()/1000) && (Date.now()/1000)<=this.data.mealEnd,
          allowHouse: this.data.houseStart<=(Date.now()/1000) && (Date.now()/1000)<=this.data.houseEnd,
          allowPerf: this.data.perfStart<=(Date.now()/1000) && (Date.now()/1000)<=this.data.perfEnd,
          allowSuggestions: this.data.suggestionsStart<=(Date.now()/1000) && (Date.now()/1000)<=this.data.suggestionsEnd,
          allowPrompose: this.data.promposeStart<=(Date.now()/1000) && (Date.now()/1000)<=this.data.promposeEnd,
          allowMusic: this.data.musicStart<=(Date.now()/1000) && (Date.now()/1000)<=this.data.musicEnd,
          allowTicket: this.data.ticketStart<=(Date.now()/1000) && (Date.now()/1000)<=this.data.ticketEnd,
          allowValidation: this.data.eventStart<=(Date.now()/1000) && (Date.now()/1000)<=this.data.eventEnd
        })
        this.setData({
          allowPreOptions: this.data.allowPrompose || this.data.allowPerf,
          allowLateOptions: this.data.allowMusic || this.data.allowSuggestions,
          // consentEndDisplay: this.convertUnixTime(this.data.consentEnd),
          // mealEndDisplay: this.convertUnixTime(this.data.mealEnd),
          houseStartDisplay: this.convertUnixTimeToMin(this.data.houseStart),
          houseEndDisplay: this.convertUnixTimeToMin(this.data.houseEnd),
          perfEndDisplay: this.convertUnixTime(this.data.perfEnd),
          suggestionsEndDisplay: this.convertUnixTime(this.data.suggestionsEnd),
          promposeEndDisplay: this.convertUnixTime(this.data.promposeEnd),
          musicEndDisplay: this.convertUnixTime(this.data.musicEnd),
          ticketStartDisplay: this.convertUnixTime(this.data.ticketStart),
          ticketEndDisplay: this.convertUnixTime(this.data.ticketEnd),
        })
        allCollectionsData(this.data.db, "PromTimetable").then((res) => {
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
      },
      recomputeCode: function() {
        if (this.data.viewVisible) {
          let qrCodeData=[];
          for (let i=0;i<this.data.holderTicketId.length;i++) {
            qrCodeData.push(this.data.holderTicketId.charCodeAt(i));
          }
          let accessCodeContents=generateQrCode("ticketCode", "inputTicketEventId25", qrCodeData);
          if (accessCodeContents !== this.data.codeLastGen) {
            let myCreateQRCode = createQRCode.bind(this);
            if (isDarkTheme()) {
              myCreateQRCode("ticketcodecanvas", accessCodeContents, 'FFFFFF', darkContainerColor);
            } else {
              myCreateQRCode("ticketcodecanvas", accessCodeContents, '000000', lightContainerColor);
            }
            this.data.codeLastGen=accessCodeContents;
          }
          let date = new Date();
          let newUpdateString=`${extendNumberToLengthString(date.getHours(), 2)}:${extendNumberToLengthString(date.getMinutes(), 2)}:${extendNumberToLengthString(date.getSeconds(), 2)}`;
          this.setData({
            lastUpdateTime: newUpdateString,
          });
        }
      },
      onHide: function() {
        this.data.viewVisible = false;
      },
      onUnload: function() {
        clearInterval(this.data.recomputeCaller);
      },
  }
})