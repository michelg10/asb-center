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
          allowConsent: getConsentDeadline.data[0].startTime<=(Date.now()/1000) && (Date.now()/1000)<=getConsentDeadline.data[0].endTime,
          allowMeal: getMealDeadline.data[0].startTime<=(Date.now()/1000) && (Date.now()/1000)<=getMealDeadline.data[0].endTime,
          allowHouse: getHouseDeadline.data[0].startTime<=(Date.now()/1000) && (Date.now()/1000)<=getHouseDeadline.data[0].endTime,
          allowMusic: getMusicDeadline.data[0].startTime<=(Date.now()/1000) && (Date.now()/1000)<=getMusicDeadline.data[0].endTime,
        });
        this.setData({
          allowPreOptions: this.data.allowConsent && !this.data.consentDone || this.data.allowMeal,
          allowLateOptions: this.data.allowHouse || this.data.allowMusic
        })
      },
      onLoad: async function(){
        this.data.db = wx.cloud.database();
        const eventChannel = this.getOpenerEventChannel();
        eventChannel.on('userData', (data: UserDataType) => {
          this.setData({
              userData: data,
          });
          this.data.db.collection("BlackoutTickets").where({
            userId: this.data.userData.student?.id,
          }).get().then((res) => {
            if (res.data.length > 0) {
              this.setData({
                holderStatus: true
              });
            };
          })
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
        this.setData({
          allowConsent: getConsentDeadline.data[0].startTime<=(Date.now()/1000) && (Date.now()/1000)<=getConsentDeadline.data[0].endTime,
          allowMeal: getMealDeadline.data[0].startTime<=(Date.now()/1000) && (Date.now()/1000)<=getMealDeadline.data[0].endTime,
          allowHouse: getHouseDeadline.data[0].startTime<=(Date.now()/1000) && (Date.now()/1000)<=getHouseDeadline.data[0].endTime,
          allowMusic: getMusicDeadline.data[0].startTime<=(Date.now()/1000) && (Date.now()/1000)<=getMusicDeadline.data[0].endTime,
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
          allowPreOptions: this.data.allowConsent && !this.data.consentDone || this.data.allowMeal,
          allowLateOptions: this.data.allowHouse || this.data.allowMusic
        })
      }
  }
})