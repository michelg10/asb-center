import { createQRCode, lightBackgroundColor, UserDataType } from "../../utils/common";
import { generatePreviewCode } from "../../utils/generatePreviewCode";
import { generateQrCode } from "../../utils/generateQrCode";
import { isDarkTheme } from "../../utils/isDarkTheme";
import { extendNumberToLengthString } from "../../utils/util";

// pages/PersonalCode/PersonalCode.ts
interface componentDataInterface {
  isAdmin: boolean,
  userData: UserDataType,
  recomputeCaller: any,
  db: DB.Database,
  viewVisible: boolean,
  codeLastGen: string,
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
      this.data.db = wx.cloud.database();
      this.data.viewVisible = true;
      const eventChannel = this.getOpenerEventChannel();
      eventChannel.on('userData', (data: UserDataType) => {
        this.setData({
          userData: data,
        });
        this.data.db.collection("admins").where({
          userId:this.data.userData.id,
        }).get().then((res) => {
          console.log(res);
          
        })
        setTimeout(
          () => {
            this.data.recomputeCaller = setInterval(() => {this.recomputeCode()}, 500);
          }, 500
        );
      })
    },
    recomputeCode: function() {
      if (this.data.viewVisible) {
        let qrCodeData=[];
        for (let i=0;i<this.data.userData.compactId.length;i++) {
          qrCodeData.push(this.data.userData.compactId.charCodeAt(i));
        }
        let accessCodeContents=generateQrCode("userCode", null, qrCodeData);
        if (accessCodeContents !== this.data.codeLastGen) {
          let myCreateQRCode = createQRCode.bind(this);
          if (isDarkTheme()) {
            myCreateQRCode("personalcodecanvas", accessCodeContents, 'FFFFFF', '000000');
          } else {
            myCreateQRCode("personalcodecanvas", accessCodeContents, '000000', lightBackgroundColor);
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
    onShow: function() {
      this.data.viewVisible = true;
    },
    onHide: function() {
      this.data.viewVisible = false;
    },
    onUnload: function() {
      clearInterval(this.data.recomputeCaller);
    }
  }
})