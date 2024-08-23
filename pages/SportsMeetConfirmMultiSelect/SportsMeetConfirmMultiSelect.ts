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
    confirmClicked: function() {
      wx.navigateTo({
        url: "/pages/SportsMeetMultiAddPoints/SportsMeetMultiAddPoints",
        success: (res) => {
          res.eventChannel.emit('studentData', this.data.studentData);
        }
      })
    }
  }
})
