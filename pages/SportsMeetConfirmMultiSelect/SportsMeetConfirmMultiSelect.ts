import { Student } from "../../classes/student";

// pages/SportsMeet2021ConfirmMultiSelect/SportsMeet2021ConfirmMultiSelect.ts
type componentDataInterface = {
  studentData: Student[],
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
  data: { } as componentDataInterface,

  /**
   * Component methods
   */
  methods: {
    onLoad: function() {
      const eventChannel = this.getOpenerEventChannel();
      eventChannel.on('selectedData', (data) => {
        this.setData({
          studentData: data,
        });
      });
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
    confirmClicked: function() {
      if (this.data.studentData.length === 1){
        console.log("Only 1 Person Selected in Multi-Select Mode");
        console.log("Directing to PersonaDetail Page");
        wx.navigateTo({
          url: '/pages/SportsMeetPersonaDetail/SportsMeetPersonaDetail',
          success: (res) => {
            res.eventChannel.emit('userId', this.data.studentData[0].pseudoId);
          }
        });
      }
      else{
        wx.navigateTo({
          url: "/pages/SportsMeetMultiAddPoints/SportsMeetMultiAddPoints",
          success: (res) => {
            res.eventChannel.emit('studentData', this.data.studentData);
          }
        })
      }
    }
  }
})