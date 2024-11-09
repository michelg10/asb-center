import { Student } from "../../classes/student";

type componentDataInterface = {
  studentData: Student[],
  db: DB.Database,
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
            let checkGroupLimit = await this.data.db.collection("BlackoutDeadlines").where({
              optionId: "house",
            }).get();
            if (checkGroupLimit.data[0].current>=checkGroupLimit.data[0].limit){
              wx.showModal({
                title: "Sign-Up Full",
                content: "We're sorry, sign-ups for the haunted house are currently full.",
                showCancel: false,
                confirmText: "Dismiss"
              });
              allowHouseFinal = false;
              wx.hideLoading();
              return;
            }
            else if (this.data.studentData.length<checkGroupLimit.data[0].sizeMin || this.data.studentData.length>checkGroupLimit.data[0].sizeMax){
              wx.showModal({
                title: "Invalid Selection",
                content: `Your group size must be between ${checkGroupLimit.data[0].sizeMin as string} to ${checkGroupLimit.data[0].sizeMax as string} people.`,
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
                let checkStudent = await this.data.db.collection("BlackoutStudentData").where({
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
                      content: `${getStudentNickname} is already in another haunted house group.`,
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
                  let checkStudent = await this.data.db.collection("BlackoutStudentData").where({
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