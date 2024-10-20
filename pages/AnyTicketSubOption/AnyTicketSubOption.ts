import { UserDataType } from "../../utils/common";

type ComponentDataInterface = {
  db: DB.Database,
  userData: UserDataType,
  eventName: String,
  consent: boolean | false,
  meal: boolean | false,
  house: boolean | false,
  music: boolean | false,
  consentStu: string,
  consentParent: string,
  mealSelection: string,
  mealSelectionClass: string,
  cheese: boolean | false,
  fish: boolean | false,
  musicName: string,
  musicComposer: string,
  dueDate: number,
  bus: number,
  busOptions: string[],
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
    data: {} as ComponentDataInterface,

    /**
     * Component methods
     */
    methods: {
      handleStuInput: function(x: any) {
        this.setData({
          consentStu: x.detail.value,
        });
      },
      handleParentInput: function(x: any) {
        this.setData({
          consentParent: x.detail.value,
        });
      },
      busChanged: function(x: any) {
        this.setData({
            bus: x.detail.value,
        });
      },
      onConsentSubmit: async function(){
        if(this.data.consentStu !== '' && this.data.consentParent !== ''){
        wx.showModal({
          title: "Submit Form 提交",
          content: "By submitting, you certify your digital signature is effective. You cannot edit this form after submission.\n确认提交则声明您的电子签名具有同等效应，提交后不可修改。",
          success: async (res) => {
            if(res.confirm){
                let checkDatabase = await this.data.db.collection("BlackoutStudentData").where({
                  userId: this.data.userData.student?.id,
                }).get();
                if (checkDatabase.data.length!==0){
                  wx.cloud.callFunction({
                    name: "AnyTicketSetStudentData",
                    data: {
                      type: "submitConsent",
                      userId: this.data.userData.student?.id,
                      consent: true,
                      consentData: [this.data.consentStu, this.data.consentParent, this.data.busOptions[this.data.bus], Date.now()]
                    }
                  })
                }
                else{
                  wx.cloud.callFunction({
                    name: "AnyTicketSetStudentData",
                    data: {
                      type: "submitConsentNew",
                      userId: this.data.userData.student?.id,
                      consent: true,
                      consentData: [this.data.consentStu, this.data.consentParent, this.data.busOptions[this.data.bus], Date.now()]
                    }
                  })
                }
                wx.navigateBack();
              }
            }
          })
        }
        else{
          wx.showModal({
            title: "请输入电子签名 Input Signature",
            content: "学生或监护人电子签名不能为空。Student and parent signature fields cannot be empty.",
            showCancel: false,
          })
        }
      },
      handleMusicNameInput: function(x: any) {
        this.setData({
          musicName: x.detail.value,
        });
      },
      handleMusicComposerInput: function(x: any) {
        this.setData({
          musicComposer: x.detail.value,
        });
      },
      onSubmitMusic: async function(){
        if(this.data.musicName !== '' && this.data.musicComposer !== ''){
        wx.showModal({
          title: "Submit Request",
          content: "Confirm Submission?",
          success: async (res) => {
            if(res.confirm){
                  wx.cloud.callFunction({
                    name: "AnyTicketSetStudentData",
                    data: {
                      type: "submitMusic",
                      userData: this.data.userData,
                      musicName: this.data.musicName,
                      musicComposer: this.data.musicComposer,
                    }
                  })
                wx.navigateBack();
              }
            }
          })
        }
        else{
          wx.showModal({
            title: "Input Request",
            content: "Music name and composer fields cannot be empty.",
            showCancel: false,
          })
        }
      },
      checkMealSelection: async function(){
        let checkMeal = await this.data.db.collection("BlackoutStudentData").where({
          userId: this.data.userData.student?.id,
        }).get();
        if(checkMeal.data.length===0 || checkMeal.data[0].dinnerOption===undefined){
          this.setData({
            mealSelection: "Not Selected",
            mealSelectionClass: "no"
          });
        }
        else{
          this.setData({
            mealSelection: checkMeal.data[0].dinnerOption,
            mealSelectionClass: "yes"
          });
        }
      },
      onShow: function(){
        this.setData({
          consentStu: '',
          consentParent: '',
          bus: 0,
          musicName: '',
          musicComposer: ''
        })
      },
      onLoad: async function(){
        this.data.consentStu = '';
        this.data.consentParent = '';
        this.data.musicName = '';
        this.data.musicComposer = '';
        this.data.db = wx.cloud.database();
        const eventChannel = this.getOpenerEventChannel();
        eventChannel.on('eventName', (res) => {
          this.setData({
            eventName: res,
            bus: 0,
            busOptions: ['无 None', '古北 Gubei', '莘庄 Xinzhuang', '浦东商城路 Pudong Shangcheng Rd', '浦东⻓清路 Changqing Rd', '徐家汇 Xujiahui', '虹梅 Hongmei', '江苏路 Jiangsu Rd']
          });
        })
        eventChannel.on('dueDate', (res) => {
          this.setData({
            dueDate: res,
          });
        })
        eventChannel.on('option', (res) => {
          if (res==='consent'){
            this.setData({
              consent: true,
            });
          }
          else if (res==='meal'){
            this.setData({
              meal: true,
            });
          }
          else if (res==='house'){
            this.setData({
              house: true,
            });
          }
          else if (res==='music'){
            this.setData({
              music: true,
            });
          }
        })
        eventChannel.on('userData', async (res) => {
          this.setData({
            userData: res,
          });
          let checkMeal = await this.data.db.collection("BlackoutStudentData").where({
            userId: this.data.userData.student?.id,
          }).get();
          if(checkMeal.data.length===0){
            this.setData({
              mealSelection: "Not Selected",
              mealSelectionClass: "no"
            });
          }
          else{
            if(checkMeal.data[0].dinnerOption===undefined){
              this.setData({
                mealSelection: "Not Selected",
                mealSelectionClass: "no"
              });
            }
            else{
              this.setData({
                mealSelection: checkMeal.data[0].dinnerOption,
                mealSelectionClass: "yes"
              });
            }
            if(checkMeal.data[0].consent===true){
              wx.navigateBack();
            }
          }
        })
      },
      cheeseTap: function(){
        this.setData({
          cheese: true,
          fish: false,
        });
      },
      fishTap: function(){
        this.setData({
          fish: true,
          cheese: false
        });
      },
      onSaveDinner: async function(){
        let checkMeal = await this.data.db.collection("BlackoutStudentData").where({
          userId: this.data.userData.student?.id,
        }).get();
        if(checkMeal.data.length===0){
          if (this.data.cheese===true){
            await wx.cloud.callFunction({
              name: "AnyTicketSetStudentData",
              data: {
                type: "dinner",
                userId: this.data.userData.student?.id,
                dinnerOption: "Cheese"
              }
            })
            await this.checkMealSelection();
            wx.navigateBack();
          }
          else if (this.data.fish===true){
            await wx.cloud.callFunction({
              name: "AnyTicketSetStudentData",
              data: {
                type: "dinner",
                userId: this.data.userData.student?.id,
                dinnerOption: "Fish"
              }
            })
            await this.checkMealSelection();
            wx.navigateBack();
          }
          else{
            this.checkMealSelection();
            wx.showModal({
              title: "Invalid Selection",
              content: "Please select a dinner option.",
              showCancel: false,
              confirmText: "Dismiss"
            })
          }
        }
        else{
          if (this.data.cheese===true){
            await wx.cloud.callFunction({
              name: "AnyTicketSetStudentData",
              data: {
                type: "dinnerModify",
                userId: this.data.userData.student?.id,
                dinnerOption: "Cheese"
              }
            })
            await this.checkMealSelection();
            wx.navigateBack();
          }
          else if (this.data.fish===true){
            await wx.cloud.callFunction({
              name: "AnyTicketSetStudentData",
              data: {
                type: "dinnerModify",
                userId: this.data.userData.student?.id,
                dinnerOption: "Fish"
              }
            })
            await this.checkMealSelection();
            wx.navigateBack();
          }
          else {
            this.checkMealSelection();
            wx.showModal({
              title: "Invalid Selection",
              content: "Please select a dinner option.",
              showCancel: false,
              confirmText: "Dismiss"
            })
          }
        }
      },
  }
})