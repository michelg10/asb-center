/*import { handleCode } from '../../utils/handleCode';
import { UserDataType } from '../../utils/common';*/

interface componentDataInterface {
  /*userData: UserDataType,
  sportsMeetFetchSecureCodes: Function,*/
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
      /*
      const eventChannel = this.getOpenerEventChannel();
      eventChannel.on('userData', (data: UserDataType) => {
        this.setData({
          userData: data,
        });
      });
      eventChannel.on('sportsMeetFetchSecureCodes', (sportsMeetFetchSecureCodes: Function) => {
        this.setData({
          sportsMeetFetchSecureCodes: sportsMeetFetchSecureCodes,
        });
      });*/
      this.setData({
        inputCodeData: '',
      });
    },
    /*handleDataInput: function(x: any) {
      this.setData({
        inputCodeData: x.detail.value,
      });
    },*/
    mainPageClicked: function() {
      wx.reLaunch({
        url: "/pages/MainMenu/MainMenu"
      });
    },
    confirmClicked: function(x: any) {
      this.setData({
        inputCodeData: x.detail.value,
      });
      if (this.data.inputCodeData !== '') {
        wx.navigateTo({
          url: "/pages/MainMenu/MainMenu",
          success: (res) => {
            res.eventChannel.emit('stationModeData', this.data.inputCodeData);
          }
        });
      }
      //handleCode(this, this.data.inputCodeData);
    }
  }
})