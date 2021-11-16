import { createQRCode, userDataType } from "../../utils/common";
import { generatePreviewCode } from "../../utils/generatePreviewCode";
import { extendNumberToLengthString } from "../../utils/util";

// pages/PersonalCode/PersonalCode.ts
interface componentDataInterface {
  isAdmin: boolean,
  userData: userDataType,
  recomputeCaller: any,
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
      this.data.viewVisible = true;
      const eventChannel = this.getOpenerEventChannel();
      eventChannel.on('userData', (data: userDataType) => {
        this.setData({
          userData: data,
        });
        setTimeout(
          () => {
            this.data.recomputeCaller = setInterval(() => {this.recomputeCode()}, 500);
          }, 500
        );
      })
    },
    recomputeCode: function() {
      if (this.data.viewVisible) {
        let accessCodeContents=generatePreviewCode("userCode", this.data.userData.compactId,null);
        if (accessCodeContents !== this.data.codeLastGen) {
          let myCreateQRCode = createQRCode.bind(this);
          myCreateQRCode("personalcodecanvas", accessCodeContents, 'FFFFFF');
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