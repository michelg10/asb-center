// pages/ScanFailure/ScanFailure.ts
Component({
  /**
   * Component properties
   */
  properties: {

  },

  /**
   * Component initial data
   */
  data: {
    caption: "",
  },

  /**
   * Component methods
   */
  methods: {
    onLoad: function() {
      const eventChannel = this.getOpenerEventChannel();
      eventChannel.on('errorDetail', (data: string) => {
        this.setData({
          caption: data,
        });
      })
    },
    onOkClick: function() {
      wx.navigateBack();
    }
  }
})
