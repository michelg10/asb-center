import CacheSingleton from "../../classes/CacheSingleton";
import { Student } from "../../classes/student";
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
  cacheSingleton: CacheSingleton
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
      this.data.cacheSingleton = CacheSingleton.getInstance();
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
          if (res.data.length > 0) {
            this.setData({
              isAdmin: true
            });
          };
        })
        setTimeout(
          () => {
            this.data.recomputeCaller = setInterval(() => {this.recomputeCode()}, 500);
          }, 500
        );
      });
    },
    backButtonTapped: function() {
      wx.vibrateShort({
        type: "light"
      });
      wx.navigateBack();
    },
    buttonTapVibrate: function() {
      wx.vibrateShort({
        type: "medium"
      });
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
    },
    adminButtonTapped: function() {
      wx.vibrateShort({
        type: "light"
      });
      wx.navigateTo({
        url: "/pages/StudentChoose/StudentChoose",
        success: (res) => {
          res.eventChannel.emit("limitGradeTo", [9, 10, 11, 12]);
          res.eventChannel.on("selectedStudent", async (selectedStudent: Student) => {
            let userData = ((await wx.cloud.callFunction({
              name: "fetchUserInformation",
              data: {
                userId: selectedStudent.pseudoId,
              }
            })).result as any).data;
            let publicUserData = {
              _id: userData._id,
              compactId: userData.compactId,
              studentId: userData.studentId,
              userId: userData.userId,
            };
            wx.navigateTo({
              url: '/pages/StudentDetailForAdmin/StudentDetailForAdmin',
              success: (res) => {
                res.eventChannel.emit('userId', publicUserData);
              }
            });
          })
        }
      });
    }
  }
})