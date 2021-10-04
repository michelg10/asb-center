// pages/PersonaDetail/PersonaDetail.ts
interface componentDataInterface {
  userId: string,
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
      const eventChannel = this.getOpenerEventChannel();
      eventChannel.on('userId', (data: string) => {
        this.setData({
          userId: data,
        });
      });
    }
  }
})
