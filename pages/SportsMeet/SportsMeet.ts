import { Event } from "../../classes/event";
import { createQRCode, userDataType } from "../../utils/common";
import { generatePreviewCode } from "../../utils/generatePreviewCode";
import { extendNumberToLengthString } from "../../utils/util";
import { PreviewGenerator } from "../MainMenu/MainMenu";

// pages/SportsMeet.js

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
    }
  }
})
