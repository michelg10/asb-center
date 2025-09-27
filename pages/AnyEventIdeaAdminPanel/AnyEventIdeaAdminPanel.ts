import CacheSingleton from "../../classes/CacheSingleton";
import { anyEventIdeaLog } from "../../classes/anyEventIdeaLog";

interface componentDataInterface {
  isAdmin: boolean,
  canResolve: boolean,
  isWaiting: boolean,
  db: DB.Database,
  cacheSingleton: CacheSingleton,
  suggestions: anyEventIdeaLog[],
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
     * Lifecycle function--Called when page load
     */

    methods: {
      onLoad: async function() {
        const eventChannel = this.getOpenerEventChannel();
        eventChannel.on('isAdmin', (data: boolean) => {
          this.setData({
            isAdmin: data,
          });
        });
        eventChannel.on('canResolve', (data: boolean) => {
          this.setData({
            canResolve: data,
          });
        });
        this.data.cacheSingleton = CacheSingleton.getInstance();
        // this.setData({
        //   suggestions: await this.data.cacheSingleton.fetchAnyEventIdeaLogs(),
        // });
      },
      resolveSuggestionLog: function(x: any) {
        if (this.data.isWaiting) {
          return;
        }
        this.data.isWaiting = true;
        wx.showModal({
          title: "Confirm?",
          content: "Mark this suggestion log as read? This action is not reversible.",
          confirmText: "Confirm",
          cancelText: "Cancel",
          success: (res) => {
            if (res.confirm) {
              wx.cloud.callFunction({
                name: "SuggestionsBoxResolve",
                data: {
                  type: 'anyEventIdea',
                  logId: this.data.suggestions[x.currentTarget.dataset.itemindex].logId,
                }
              }).then(async () => {
                // await this.data.cacheSingleton.getAnyEventIdeaLogs();
                // this.setData({
                //   suggestions: await this.data.cacheSingleton.fetchAnyEventIdeaLogs(),
                // })
              })
            }
          }
        })
        this.data.isWaiting = false;
      }
    }
})