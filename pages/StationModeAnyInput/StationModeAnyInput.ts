interface componentDataInterface {
  inputCodeData: '',
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
  data: {} as componentDataInterface,

  /**
   * Component methods
   */
  methods: {
    onShow: function() {
      this.setData({
        inputCodeData: '',
      });
    },
    /*handleDataInput: function(x: any) {
      this.setData({
        inputCodeData: x.detail.value,
      });
    },*/
    returnPageClicked: function() {
      wx.navigateBack();
    },
    confirmClicked: function(x: any) {
      this.setData({
        inputCodeData: x.detail.value,
      });
      if (this.data.inputCodeData !== '') {
        const eventChannel = this.getOpenerEventChannel();
        eventChannel.emit("data", this.data.inputCodeData);
        wx.navigateBack();
      }
    }
  }
})