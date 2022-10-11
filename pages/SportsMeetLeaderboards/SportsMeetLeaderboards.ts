// pages/SportsMeetLeaderboards/SportsMeetLeaderboards.ts
interface leaderboardDisplayComponent {
  rank: number;
  change: "up" | "dup" | "down" | "ddown" | "nochange",
  name: string,
  pinned: boolean,
  points: number,
  id: string,
};
interface componentDataInterface {
  showSearch: boolean,
  title: string,
  pins: string[]|null,
  data: any[],
  lastRankProperty: string,
  pointProperty: string,
  nameProperty: string,
  searchTerm: string,
  doubleBoundary: number,
  leaderboardDisplay: leaderboardDisplayComponent[],
  pinsDisplay: leaderboardDisplayComponent[],
  pinsDisabled: boolean,
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
    togglePinned: function(x: any) {
      let userId = x.currentTarget.dataset.id;
      if (this.data.pins === null) {
        return;
      }
      let newPin = this.data.pins;
      if (newPin.indexOf(userId) === -1) {
        if (this.data.pins.length >= 5) {
          return;
        }
        newPin.push(userId);
      } else {
        newPin.splice(newPin.indexOf(userId), 1);
      }
      this.data.pins=newPin;
      this.savePins();
      this.reloadPins();
      this.applySearch();
    },
    reloadPins: function() {
      if (this.data.pins === null) {
        return;
      }
      let newPinsDisplay: leaderboardDisplayComponent[]=[];
      for (let i=0;i<this.data.data.length;i++) {
        if (this.data.pins.indexOf(this.data.data[i]._id) !== -1) {
          newPinsDisplay.push({
            rank: this.data.data[i].actualIndex+1,
            change: (this.data.data[i][this.data.lastRankProperty] === -1 ? "nochange" : this.classifyChange(this.data.data[i][this.data.lastRankProperty]-this.data.data[i].actualIndex)),
            name: this.data.data[i][this.data.nameProperty],
            pinned: true,
            points: this.data.data[i][this.data.pointProperty],
            id: this.data.data[i]._id,
          });
        }
      }
      this.setData({
        pinsDisplay: newPinsDisplay,
      });
    },
    handleSearchBoxChange: function(e: any) {
      this.setData({
        searchTerm: e.detail.value,
      });
      this.applySearch();
    },
    rerank: function() {
      if (this.data.lastRankProperty !== undefined && this.data.pointProperty !== undefined && this.data.nameProperty !== undefined && this.data.data !== undefined && this.data.doubleBoundary !== undefined && this.data.pinsDisabled !== undefined && (this.data.pins !== null || this.data.pinsDisabled)) {
        console.log("run rerank");
        let newData = this.data.data;
        newData.sort((a, b) => {
          let actualA = a[this.data.pointProperty];
          let actualB = b[this.data.pointProperty];
          if (actualA === actualB) {
            return 0;
          }
          if (actualA < actualB) {
            return 1;
          }
          return -1;
        });
        let newNewData:any[] = [];
        for (let i=0;i<newData.length;i++) {
          if (newData[i][this.data.pointProperty] !== 0 || this.data.pins?.indexOf(newData[i]._id) !== -1) {
            console.log("hi");
            newNewData.push({
              ...newData[i],
              actualIndex: i,
            });
          }
        }
        this.setData({
          data: newNewData,
        });
        this.applySearch();
        this.reloadPins();
      }
    },
    classifyChange: function(delta: number) {
      if (delta>=this.data.doubleBoundary) {
        return "dup";
      }
      if (delta>0) {
        return "up";
      }
      if (delta === 0) {
        return "nochange";
      }
      if (delta<=-this.data.doubleBoundary) {
        return "ddown";
      }
      return "down";
    },
    applySearch: function() {
      if (this.data.lastRankProperty !== undefined && this.data.pointProperty !== undefined && this.data.nameProperty !== undefined && this.data.data !== undefined && this.data.doubleBoundary !== undefined && this.data.pinsDisabled !== undefined && (this.data.pins !== null || this.data.pinsDisabled)) {
        let nextLeaderboardDisplay: leaderboardDisplayComponent[]=[];
        for (let i=0;i<this.data.data.length;i++) {
          let toSearch:string = this.data.data[i][this.data.nameProperty];
          toSearch = toSearch.toLowerCase();
          if (toSearch.indexOf(this.data.searchTerm.toLowerCase()) !== -1 || this.data.searchTerm === "") {
            let pinned: boolean;
            if (this.data.pins === null) {
              pinned=false;
            } else {
              pinned = this.data.pins.indexOf(this.data.data[i]._id) !== -1;
            }
            nextLeaderboardDisplay.push({
              rank: this.data.data[i].actualIndex+1,
              change: (this.data.data[i][this.data.lastRankProperty] === -1 ? "nochange" : this.classifyChange(this.data.data[i][this.data.lastRankProperty]-this.data.data[i].actualIndex)),
              name: this.data.data[i][this.data.nameProperty],
              pinned: pinned,
              points: this.data.data[i][this.data.pointProperty],
              id: this.data.data[i]._id,
            });
          }
        }
        const limit=50;
        if (nextLeaderboardDisplay.length>limit) {
          nextLeaderboardDisplay=nextLeaderboardDisplay.slice(0,limit);
        }
        this.setData({
          leaderboardDisplay: nextLeaderboardDisplay,
        });
      }
    },
    savePins: function() {
      wx.setStorage({
        key: "SportsMeet2022LeaderboardPins",
        data: this.data.pins,
      })
    },
    onLoad: function() {
      const eventChannel = this.getOpenerEventChannel();
      this.setData({
        searchTerm: "",
        pins: null,
      });
      eventChannel.on('showSearch', (data) => {
        this.setData({
          showSearch: data,
        });
      });
      eventChannel.on('title', (data) => {
        this.setData({
          title: data,
        });
      })
      eventChannel.on('usePins', (data: boolean) => {
        console.log(data);
        if (data) {
          wx.getStorage({
            key: 'SportsMeet2022LeaderboardPins',
            success: (res) => {
              this.setData({
                pinsDisabled: false,
              });
              this.setData({
                pins: res.data,
              });
              this.rerank();
              this.reloadPins();
              this.applySearch();
            },
            fail: () => {
              this.setData({
                pinsDisabled: false,
              });
              this.setData({
                pins: [],
              });
              this.rerank();
              this.savePins();
              this.reloadPins();
            }
          })
        }
        this.setData({
          pinsDisabled: true,
        });
        this.rerank();
      });
      eventChannel.on("data", (data: any[]) => {
        this.data.data = data;
        this.rerank();
      });
      eventChannel.on("lastRankProperty", (data) => {
        this.data.lastRankProperty = data;
        this.rerank();
      });
      eventChannel.on("pointProperty", (data) => {
        this.data.pointProperty = data;
        this.rerank();
      });
      eventChannel.on("nameProperty", (data) => {
        this.data.nameProperty = data;
        this.rerank();
      });
      eventChannel.on("doubleBoundary", (data) => {
        this.data.doubleBoundary = data;
        this.rerank();
      });
    },
    onUnload: function() {
      const eventChannel = this.getOpenerEventChannel();
      eventChannel.emit("pageClose");
    }
  }
})
