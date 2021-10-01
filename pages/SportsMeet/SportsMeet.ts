import { Event } from "../../classes/event";
import { createQRCode, userDataType } from "../../utils/common";
import { sha256 } from "../../utils/sha256";
import { extendNumberToLengthString, getUnixTime } from "../../utils/util";
import { PreviewGenerator } from "../MainMenu/MainMenu";

// pages/SportsMeet.js

interface componentDataInterface {
  userData: userDataType,
  eventId: string;
  eventInfo: Event;
  previewInfo: PreviewGenerator;
  codeLastGen: string;
  previewPort: string;
  lastUpdateTime: string;
  recomputeCaller: any;
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
    onLoad: function() {
      const eventChannel = this.getOpenerEventChannel();
      this.setData({
        previewPort: "SportsMeetInnerPreviewPort",
      });
      eventChannel.on('userData', (data: userDataType) => {
        this.setData({
          userData: data,
        });
      });
      eventChannel.on('eventId', (data: string) => {
        this.setData({
          eventId: data,
        });
      })
      eventChannel.on('eventInfo', (data: Event) => {
        console.log(data);
        this.setData({
          eventInfo: data,
        });
      })
      eventChannel.on('previewInfo', (data: PreviewGenerator) => {
        console.log(data);
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
      let previewTimePeriod=Math.floor(getUnixTime()/3);
      let accessCodeContents=this.data.previewInfo.previewData.userCode+previewTimePeriod.toString();
      accessCodeContents=sha256(accessCodeContents)!;
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
