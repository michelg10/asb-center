import CacheSingleton from "../../classes/CacheSingleton";

// pages/SportsMeetActivities/SportsMeetActivities.ts
interface componentDataInterface {
  db: DB.Database,
  cacheSingleton: CacheSingleton,
  displayImages: boolean,
  imageNames: string[],
  imageUrls: string[]
};

Component({
  properties: {

  },

  data: {} as componentDataInterface,

  methods: {
    /**
     * Lifecycle function--Called when page load
     */
    onLoad: function() {
      this.data.cacheSingleton = CacheSingleton.getInstance();
      this.data.db = wx.cloud.database();
      this.data.imageNames = ["superWheeler", "caterpillar", "threeLeggedRace", "limbo", "armWrestling", "snatchThatCone", "cupPong", "ringToss", "musicalChairs"];
      this.data.db.collection("SportsMeetConfig").where({
        key: "displayImages"
      }).get().then((res) => {
        this.setData({
          displayImages: res.data[0].value
        });
        if (this.data.displayImages) {
          this.data.cacheSingleton.getImageUrls(this.data.imageNames, () => {
            this.buildDisplayInformation();
          })
        } else {
          this.buildDisplayInformation();
        }
      });
    },
    buildDisplayInformation: function() {
      let newImageUrls = this.data.cacheSingleton.fetchImageUrls();
      if (newImageUrls !== undefined) {
        this.setData({
          imageUrls: newImageUrls
        })
      }
    },
    buttonTapVibrate: function() {
      wx.vibrateShort({
        type: "medium"
      });
    },
    backButtonTapped: function() {
      wx.vibrateShort({
        type: "light"
      });
      wx.navigateBack();
    },
    superWheeler: function() {
      wx.openChannelsActivity({
        finderUserName: "sphtAYYe2nh5GSy",
        feedId: "export/UzFfAgtgekIEAQAAAAAAstEWfZcpsAAAAAstQy6ubaLX4KHWvLEZgBPE1qI0KEVmHYmPzNPgMJpx38mU1ys6824Ry7twmkGE"
      });
    },
    caterpillarDash: function() {
      wx.openChannelsActivity({
        finderUserName: "sphtAYYe2nh5GSy",
        feedId: "export/UzFfAgtgekIEAQAAAAAA1kU1qklrbwAAAAstQy6ubaLX4KHWvLEZgBPEoKMMFgxYHYmPzNPgMJrCOg2ANM1kLW_PvLDtSuN0"
      });
    },
    threeLeggedRace: function() {
      wx.openChannelsActivity({
        finderUserName: "sphtAYYe2nh5GSy",
        feedId: "export/UzFfAgtgekIEAQAAAAAA5k4Rp630XAAAAAstQy6ubaLX4KHWvLEZgBPE3qIITxglHYmPzNPgMJqmgo3Dnl-FG__E8UWHslA4"
      });
    },
    limbo: function() {
      wx.openChannelsActivity({
        finderUserName: "sphtAYYe2nh5GSy",
        feedId: "export/UzFfAgtgekIEAQAAAAAAhLo33kJ7uQAAAAstQy6ubaLX4KHWvLEZgBPEv6NgYjMgPYmPzNPgMJqk9CIQ7UofHyC-jLFS3JKT"
      });
    },
    armWrestling: function() {
      wx.openChannelsActivity({
        finderUserName: "sphtAYYe2nh5GSy",
        feedId: "export/UzFfAgtgekIEAQAAAAAAB-EoKSHxXwAAAAstQy6ubaLX4KHWvLEZgBPErqMcAQ4RPYmPzNPgMJp4-vGNFAWSX0L75vQKiOVp"
      });
    },
    snatchThatCone: function() {
      wx.openChannelsActivity({
        finderUserName: "sphtAYYe2nh5GSy",
        feedId: "export/UzFfAgtgekIEAQAAAAAApKIMnXIDyQAAAAstQy6ubaLX4KHWvLEZgBPE2aIEJmB_MomPzNPgMJoPaoFBG3CsA0YxE1UBX0sz"
      });
    },
    cupPong: function() {
      wx.openChannelsActivity({
        finderUserName: "sphtAYYe2nh5GSy",
        feedId: "export/UzFfAgtgekIEAQAAAAAAFXAJHG_XxwAAAAstQy6ubaLX4KHWvLEZgBPE0KIkAmNHMomPzNPgMJqRDrf-BaEP8oP-HdahleF8"
      });
    },
    ringToss: function() {
      wx.openChannelsActivity({
        finderUserName: "sphtAYYe2nh5GSy",
        feedId: "export/UzFfAgtgekIEAQAAAAAAZrkRVbjNyAAAAAstQy6ubaLX4KHWvLEZgBPEpaMAEAsvMomPzNPgMJout7Ut2bsUolEwppY6lb2J"
      });
    },
    musicalChairs: function() {
      wx.openChannelsActivity({
        finderUserName: "sphtAYYe2nh5GSy",
        feedId: "export/UzFfAgtgekIEAQAAAAAAqzs2vfIFYwAAAAstQy6ubaLX4KHWvLEZgBPEpaNYGGw0MomPzNPgMJoCgjAlrM6nl993IVpjSGWS"
      });
    },
  }
})