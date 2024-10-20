import { UserDataType } from "../../utils/common";

type ComponentDataInterface = {
    eventName: String,
    eventId: String,
    userData: UserDataType,
    holderStatus: boolean | false,
    isAdmin: boolean,
    consentDone: boolean | false,
    allowConsent: boolean | false,
    allowMeal: boolean | false,
    allowHouse: boolean | false,
    allowMusic: boolean | false,
    allowPreOptions: boolean | true,
    allowLateOptions: boolean | true,
    db: DB.Database,
    errorMessage: String | undefined,
    consentStart: number,
    mealStart: number,
    houseStart: number,
    musicStart: number,
    consentEnd: number,
    mealEnd: number,
    houseEnd: number,
    musicEnd: number,
    consentEndDisplay: string,
    mealEndDisplay: string,
    houseEndDisplay: string,
    musicEndDisplay: string,
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
      adminButtonTapped: function(){
        wx.navigateTo({
          url: "/pages/AnyTicketCheckTicket/AnyTicketCheckTicket",
          success: (res) => {
            res.eventChannel.emit("myId", this.data.userData.id);
          }
        });
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
      mealOptionTap: function(){
        if(this.data.allowMeal){
          wx.navigateTo({
            url: "/pages/AnyTicketSubOption/AnyTicketSubOption",
            success: (res) => {
              res.eventChannel.emit("eventName", this.data.eventName);
              res.eventChannel.emit("option", "meal");
              res.eventChannel.emit("dueDate", this.data.mealEndDisplay);
              res.eventChannel.emit("userData", this.data.userData);
            }
          });
        }
      },
      hauntedHouseTap: function(){
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
        wx.navigateTo({
          url: "/pages/AnyTicketStationCheckTicket/AnyTicketStationCheckTicket",
          success: (res) => {
            res.eventChannel.emit("myId", this.data.userData.id);
          }
        });
      },
      onShow: async function(){
        let getConsentDeadline = await this.data.db.collection("BlackoutDeadlines").where({
          optionId: "consent",
        }).get();
        let getMealDeadline = await this.data.db.collection("BlackoutDeadlines").where({
          optionId: "meal",
        }).get();
        let getHouseDeadline = await this.data.db.collection("BlackoutDeadlines").where({
          optionId: "house",
        }).get();
        let getMusicDeadline = await this.data.db.collection("BlackoutDeadlines").where({
          optionId: "music",
        }).get();
        let checkErrorMsg = await this.data.db.collection("BlackoutDeadlines").where({
          optionId: "errorMsg",
        }).get();
        if (getConsentDeadline.data.length===0||getMealDeadline.data.length===0||getHouseDeadline.data.length===0||getMusicDeadline.data.length===0){
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
        let getConsentStatus = await this.data.db.collection("BlackoutStudentData").where({
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
          mealStart: getMealDeadline.data[0].startTime,
          houseStart: getHouseDeadline.data[0].startTime,
          musicStart: getMusicDeadline.data[0].startTime,
          consentEnd: getConsentDeadline.data[0].endTime,
          mealEnd: getMealDeadline.data[0].endTime,
          houseEnd: getHouseDeadline.data[0].endTime,
          musicEnd: getMusicDeadline.data[0].endTime,
        });
        this.setData({
          allowConsent: this.data.consentStart<=(Date.now()/1000) && (Date.now()/1000)<=this.data.consentEnd,
          allowMeal: this.data.mealStart<=(Date.now()/1000) && (Date.now()/1000)<=this.data.mealEnd,
          allowHouse: this.data.houseStart<=(Date.now()/1000) && (Date.now()/1000)<=this.data.houseEnd,
          allowMusic: this.data.musicStart<=(Date.now()/1000) && (Date.now()/1000)<=this.data.musicEnd,
        })
        this.setData({
          allowPreOptions: this.data.allowConsent && !this.data.consentDone || this.data.allowMeal,
          allowLateOptions: this.data.allowHouse || this.data.allowMusic,
          consentEndDisplay: this.convertUnixTime(this.data.consentEnd),
          mealEndDisplay: this.convertUnixTime(this.data.mealEnd),
          houseEndDisplay: this.convertUnixTime(this.data.houseEnd),
          musicEndDisplay: this.convertUnixTime(this.data.musicEnd),
        })
      },
      onLoad: async function(){
        this.data.db = wx.cloud.database();
        const eventChannel = this.getOpenerEventChannel();
        eventChannel.on('userData', (data: UserDataType) => {
          this.setData({
              userData: data,
          });
          if (this.data.userData.student){
            console.log("User registered.")
            this.data.db.collection("BlackoutTickets").where({
              userId: this.data.userData.student.id,
            }).get().then((res) => {
              if (res.data.length > 0) {
                this.setData({
                  holderStatus: true
                });
              };
            })
          }
          else{
            console.log("User not registered.")
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
        let getConsentDeadline = await this.data.db.collection("BlackoutDeadlines").where({
          optionId: "consent",
        }).get();
        let getMealDeadline = await this.data.db.collection("BlackoutDeadlines").where({
          optionId: "meal",
        }).get();
        let getHouseDeadline = await this.data.db.collection("BlackoutDeadlines").where({
          optionId: "house",
        }).get();
        let getMusicDeadline = await this.data.db.collection("BlackoutDeadlines").where({
          optionId: "music",
        }).get();
        if (getConsentDeadline.data.length===0||getMealDeadline.data.length===0||getHouseDeadline.data.length===0||getMusicDeadline.data.length===0){
          this.setData({
            errorMessage: "An unexpected error occurred (GETDDLUNDEF). Check your network connection?",
          });
        }
        this.setData({
          consentStart: getConsentDeadline.data[0].startTime,
          mealStart: getMealDeadline.data[0].startTime,
          houseStart: getHouseDeadline.data[0].startTime,
          musicStart: getMusicDeadline.data[0].startTime,
          consentEnd: getConsentDeadline.data[0].endTime,
          mealEnd: getMealDeadline.data[0].endTime,
          houseEnd: getHouseDeadline.data[0].endTime,
          musicEnd: getMusicDeadline.data[0].endTime,
        });
        let getConsentStatus = await this.data.db.collection("BlackoutStudentData").where({
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
          allowMeal: this.data.mealStart<=(Date.now()/1000) && (Date.now()/1000)<=this.data.mealEnd,
          allowHouse: this.data.houseStart<=(Date.now()/1000) && (Date.now()/1000)<=this.data.houseEnd,
          allowMusic: this.data.musicStart<=(Date.now()/1000) && (Date.now()/1000)<=this.data.musicEnd,
        })
        this.setData({
          allowPreOptions: this.data.allowConsent && !this.data.consentDone || this.data.allowMeal,
          allowLateOptions: this.data.allowHouse || this.data.allowMusic,
          consentEndDisplay: this.convertUnixTime(this.data.consentEnd),
          mealEndDisplay: this.convertUnixTime(this.data.mealEnd),
          houseEndDisplay: this.convertUnixTime(this.data.houseEnd),
          musicEndDisplay: this.convertUnixTime(this.data.musicEnd),
        })
      }
  }
})