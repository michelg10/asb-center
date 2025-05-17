import { Student } from "../../classes/student";
import allCollectionsData from "../../utils/allCollectionsData";
import CacheSingleton from "../../classes/CacheSingleton";

type tableGroup = {
  tableId: number,
  limit: number,
  guests: string[]
};
type componentDataInterface = {
  studentData: Student[],
  db: DB.Database,
  cacheSingleton: CacheSingleton,
  tableGroups: tableGroup[],
  allStudentData: Student[],
  selectedTableGuests: Student[],
  eventName: String,
  tableSelect: boolean[],
  sizeMin: number,
  sizeMax: number,
  groupLimit: number,
  dueDate: number,
  selectedTable: number,
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
    onLoad: async function() {
      wx.showLoading({
        title: "Loading...",
        mask: true,
      });
      this.data.db = wx.cloud.database();
      this.data.cacheSingleton = CacheSingleton.getInstance();
      const eventChannel = this.getOpenerEventChannel();
      eventChannel.on('selectedData', async (data) => {
        const allStudentRes = await this.data.cacheSingleton.getStudentData();
        this.setData({
          studentData: data,
          allStudentData: allStudentRes
        });
      });
      eventChannel.on('eventName', (res) => {
        this.setData({
          eventName: res,
          selectedTable: -1
        });
      });
      eventChannel.on('dueDate', (res) => {
        this.setData({
          dueDate: res,
        });
      });
      await this.data.db.collection("PromDeadlines").where({
        optionId: "house",
      }).get().then((res) => {
        this.setData({
          sizeMax: res.data[0].sizeMax,
          sizeMin: res.data[0].sizeMin,
          groupLimit: res.data[0].limit
        });
      });
      await this.updateFields();
      wx.hideLoading();
    },
    updateFields: async function(){
      wx.showLoading({
        title: "Loading...",
        mask: true,
      });
      const tableRes = await allCollectionsData(this.data.db, "PromTables");
      const rawTableData = tableRes.data;
      const tableGroups: tableGroup[] = rawTableData.map((doc: any) => {
        return {
          tableId: doc.tableId,
          limit: doc.limit,
          guests: doc.guests
        };
      });
      this.setData({
        tableGroups,
      });
      let newTableSelect: boolean[] = this.data.tableGroups.map(() => false);
      this.setData({
        tableSelect: newTableSelect
      });
      wx.hideLoading();
    },
    handleTableChoose: function(x: any) {
      const item = x.currentTarget.dataset.chosenid;
      if (this.data.studentData.length + item.guests.length <= item.limit && item.guests.length < item.limit){
        let newTableSelect: boolean[] = this.data.tableGroups.map(() => false);
        newTableSelect[item.tableId - 1] = true;
        this.setData({
          selectedTable: item.tableId - 1,
          tableSelect: newTableSelect
        })
        const selectedTableData = this.data.tableGroups.find(t => t.tableId === this.data.selectedTable + 1);
        let selectedTableGuests: Student[] = [];
        if (selectedTableData && selectedTableData.guests) {
          selectedTableGuests = this.data.allStudentData.filter(student =>
            selectedTableData.guests.includes(student.id)
          );
        }
        this.setData({
          selectedTableGuests
        });
      }
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
              title: "Loading...",
              mask: true,
            });            
            let checkGroupLimit = await this.data.db.collection("PromTables").where({
              tableId: this.data.selectedTable + 1,
            }).get();
            if (checkGroupLimit.data[0].guests.length + this.data.studentData.length > checkGroupLimit.data[0].limit){
              wx.showModal({
                title: "Table Unavailable",
                content: "We're sorry, this table is currently full or has insufficient capacity remaining.",
                showCancel: false,
                confirmText: "Dismiss"
              });
              allowHouseFinal = false;
              await this.updateFields();
              wx.hideLoading();
              return;
            } else if (this.data.studentData.length<this.data.sizeMin || this.data.studentData.length>this.data.sizeMax){
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
            } else {
              for(let i=0;i<this.data.studentData.length;i++){
                let checkStudent = await this.data.db.collection("PromStudentData").where({
                  userId: this.data.studentData[i].id,
                }).get();
                if (checkStudent){
                  if (checkStudent.data[0]?.house===undefined || checkStudent.data[0].house<=0){
                    //no house group
                  } else {
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
              if (allowHouseFinal) {
                const guestIds: string[] = [
                  ...this.data.selectedTableGuests.map(s => s.id),
                  ...this.data.studentData.map(s => s.id)
                ];
                await wx.cloud.callFunction({
                  name: "AnyTicketSetStudentData",
                  data: {
                    type: "houseModifyTable",
                    tableId: this.data.selectedTable+1,
                    guests: guestIds
                  }
                })
                for(let i=0;i<this.data.studentData.length;i++){
                  // console.log(this.data.studentData[i].id);
                  // let checkStudent = await this.data.db.collection("PromStudentData").where({
                  //   userId: this.data.studentData[i].id,
                  // }).get();
                  // if (checkStudent && checkStudent.data.length!==0){
                  //   console.log("houseModify");
                  //   await wx.cloud.callFunction({
                  //     name: "AnyTicketSetStudentData",
                  //     data: {
                  //       type: "houseModify",
                  //       userId: this.data.studentData[i].id,
                  //       house: checkGroupLimit.data[0].current+1
                  //     }
                  //   })
                  // }else{
                    // console.log("houseAdd");
                    await wx.cloud.callFunction({
                      name: "AnyTicketSetStudentData",
                      data: {
                        type: "houseAdd",
                        userId: this.data.studentData[i].id,
                        // house: checkGroupLimit.data[0].current+1,
                      }
                    })
                  // }
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