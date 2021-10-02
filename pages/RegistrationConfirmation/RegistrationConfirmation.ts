import { Student } from "../../classes/student";

// pages/RegistrationConfirmation.ts
interface componentDataInterface {
  studentData: Student;
  yesBeenTapped: boolean; // prevent yes from being tapped multiple times
};
Component({

  /**
   * Page initial data
   */
  data: {} as componentDataInterface,

  methods: {
    onLoad: function() {
      this.data.yesBeenTapped=false;
      const eventChannel = this.getOpenerEventChannel();
      eventChannel.on('registrationConfirmationStudent', (data: Student) => {
        this.setData({
          studentData: data,
        });
      });
    },
    handleNoClick: function() {
      wx.navigateBack();
    },
    handleYesClick: async function() {
      if (this.data.yesBeenTapped) {
        return;
      }
      this.data.yesBeenTapped=true;
      await wx.cloud.callFunction({
        name: "registerUser",
        data: {
          studentId: this.data.studentData.id,
        }
      })
      wx.reLaunch({
        url: "/pages/MainMenu/MainMenu",
      });
    }
  }
})