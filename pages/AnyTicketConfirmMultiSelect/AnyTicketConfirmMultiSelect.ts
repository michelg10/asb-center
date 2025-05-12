import { Student } from "../../classes/student";

type componentDataInterface = {
  studentData: Student[],
  db: DB.Database,
  sizeMin: number,
  sizeMax: number,
  groupLimit: number,
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
      this.data.db = wx.cloud.database();
      const eventChannel = this.getOpenerEventChannel();
      eventChannel.on('selectedData', (data) => {
        this.setData({
          studentData: data,
        });
      });
      this.data.db.collection("PromDeadlines").where({
        optionId: "house",
      }).get().then((res) => {
        this.setData({
          sizeMax: res.data[0].sizeMax,
          sizeMin: res.data[0].sizeMin,
          groupLimit: res.data[0].limit
        });
      })
    },
    confirmClicked: function() {
      let allowHouseFinal = true;
      wx.showModal({
        title: "Confirm Selection",
        content: "Confirm selection? You will not be able to change your selection after confirming.",
        cancelText: "Cancel",
        confirmText: "Confirm",
        success: async (res) => {
          if (res.confirm){
            wx.showLoading({
              title: "Please Wait...",
              mask: true,
            });            
            let checkGroupLimit = await this.data.db.collection("PromDeadlines").where({
              optionId: "house",
            }).get();
            if (checkGroupLimit.data[0].current>=this.data.groupLimit){
              wx.showModal({
                title: "Sign-Up Full",
                content: "We're sorry, sign-ups for table groups are currently full.",
                showCancel: false,
                confirmText: "Dismiss"
              });
              allowHouseFinal = false;
              wx.hideLoading();
              return;
            }
            else if (this.data.studentData.length<this.data.sizeMin || this.data.studentData.length>this.data.sizeMax){
              wx.showModal({
                title: "Invalid Selection",
                content: `Your group size must be between ${this.data.sizeMin} to ${this.data.sizeMax} people.`,
                showCancel: false,
                confirmText: "Dismiss"
              });
              allowHouseFinal = false;
              wx.hideLoading();
              wx.navigateBack();
              return;
            }
            else {
              for(let i=0;i<this.data.studentData.length;i++){
                let checkStudent = await this.data.db.collection("PromStudentData").where({
                  userId: this.data.studentData[i].id,
                }).get();
                if (checkStudent){
                  if (checkStudent.data[0]?.house===undefined || checkStudent.data[0].house<=0){
                    //no house group
                  }
                  else{
                    //already in a house group
                    let checkStudentName = await this.data.db.collection("studentData").where({
                      _id: this.data.studentData[i].id,
                    }).get();
                    let getStudentNickname = checkStudentName.data[0].nickname as string;
                    wx.showModal({
                      title: "Group Member Unavailable",
                      content: `${getStudentNickname} is already in another table group.`,
                      showCancel: false,
                      confirmText: "Return",
                      success: (res) => {
                        if (res.confirm){
                          wx.hideLoading();
                          wx.navigateBack();
                        }
                      }
                    })
                    wx.hideLoading();
                    allowHouseFinal = false;
                    return;
                  }
                }
              }
              if (allowHouseFinal){
                for(let i=0;i<this.data.studentData.length;i++){
                  console.log(this.data.studentData[i].id);
                  let checkStudent = await this.data.db.collection("PromStudentData").where({
                    userId: this.data.studentData[i].id,
                  }).get();
                  if (checkStudent && checkStudent.data.length!==0){
                    console.log("houseModify");
                    await wx.cloud.callFunction({
                      name: "AnyTicketSetStudentData",
                      data: {
                        type: "houseModify",
                        userId: this.data.studentData[i].id,
                        house: checkGroupLimit.data[0].current+1
                      }
                    })
                  }
                  else{
                    console.log("houseAdd");
                    await wx.cloud.callFunction({
                      name: "AnyTicketSetStudentData",
                      data: {
                        type: "houseAdd",
                        userId: this.data.studentData[i].id,
                        house: checkGroupLimit.data[0].current+1
                      }
                    })
                  }
                }
                wx.hideLoading();
                wx.navigateBack();
              }
            }
          }
        }
      })
    }
  }
})