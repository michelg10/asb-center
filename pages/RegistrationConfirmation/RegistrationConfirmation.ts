import { Student } from "../../classes/Student";

// pages/RegistrationConfirmation.ts
interface componentDataInterface {
  studentData: Student;
  confirmBeenTapped: boolean; // prevent yes from being tapped multiple times
  gNumber:string;
  error: string|null,
  gInput: string,
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
    handleGInput: function(x: any) {
      this.data.gInput = x.detail.value;
    },
    handleSubmitClick: async function() {
      if (this.data.confirmBeenTapped) {
        return;
      }
      if (this.data.gInput !== "test") {
        if (this.data.gInput.length !== 10) {
          this.setData({
            error: "G-number invalid",
          });
          return;
        }
        for (let i=0;i<this.data.gInput.length;i++) {
          if (!(this.data.gInput[i]>='0' && this.data.gInput[i]<='9')) {
            this.setData({
              error: "G-number invalid",
            });
            return;
          }
        }
      }
      this.setData({
        error: "",
      });
      this.data.confirmBeenTapped=true;
      let res = await wx.cloud.callFunction({
        name: "registerUser",
        data: {
          studentId: this.data.studentData.id,
          gNumber: this.data.gInput,
        }
      })
      this.data.confirmBeenTapped=false;
      if ((res.result as any).status === "success") {
        wx.reLaunch({
          url: "/pages/MainMenu/MainMenu",
        });
      } else {
        this.setData({
          error: (res.result as any).reason,
        });
      }
    }
  }
})