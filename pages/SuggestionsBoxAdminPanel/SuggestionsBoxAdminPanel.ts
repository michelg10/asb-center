// pages/SuggestionsBoxAdminPanel/SuggestionsBoxAdminPanel.ts
import CacheSingleton from "../../classes/CacheSingleton";
import { suggestionLog } from "../../classes/suggestionLog";

interface componentDataInterface {
  isAdmin: boolean,
  canResolve: boolean,
  isWaiting: boolean,
  db: DB.Database,
  cacheSingleton: CacheSingleton,
  suggestions: suggestionLog[],
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
      async onLoad() {
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
        this.setData({
          suggestions: await this.data.cacheSingleton.fetchSuggestionLogs(),
        });
      },
      resolveSuggestionLog(x: any) {
        if (this.data.isWaiting) {
          return;
        }
        this.data.isWaiting = true;
        wx.showModal({
          title: "Confirm?",
          content: "Mark this suggestion log as resolved? This action is not reversible.",
          confirmText: "Confirm",
          cancelText: "Cancel",
          success: (res) => {
            if (res.confirm) {
              wx.cloud.callFunction({
                name: "SuggestionsBoxResolve",
                data: {
                  logId: this.data.suggestions[x.currentTarget.dataset.itemindex].logId,
                }
              }).then(() => {
                this.data.suggestions[x.currentTarget.dataset.itemindex].resolved = true;
                this.setData({
                  suggestions: this.data.suggestions
                })
              })
            }
          }
        })
        this.data.isWaiting = false;
      }
    }
})