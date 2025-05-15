// import { gNumber } from "../../classes/gNumber";
import { Student } from "../../classes/student";
import allCollectionsData from "../../utils/allCollectionsData";
import { UserDataType } from "../../utils/common";
import { cutStringToSearchTokens } from "../../utils/cutStringToSearchTokens";
import CacheSingleton from "../../classes/CacheSingleton";

type ComponentDataInterface = {
  db: DB.Database,
  cacheSingleton: CacheSingleton,
  userData: UserDataType,
  eventName: String,
  consent: boolean | false,
  // meal: boolean | false,
  house: boolean | false,
  music: boolean | false,
  consentStu: string,
  consentParent: string,
  // mealSelection: string,
  // mealSelectionClass: string,
  // cheese: boolean | false,
  // fish: boolean | false,
  musicName: string,
  musicComposer: string,
  dueDate: number,
  // bus: number,
  // busOptions: string[],
  totalSelected: number,
  ticketData: string[],
  studentData: Student[],
  // gNumber: gNumber[],
  houseData: Student[],
  // houseIndex: number[],
  studentListSearch: string,
  userSelect: boolean[],
  matchingIndexes: number[],
  houseStatus: boolean,
  houseNumber: number,
  allowHouse: boolean,
  showStudentChoose: boolean,
  houseMin: number,
  houseMax: number,
  studentSearchTextfield: string,
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
      // busChanged: function(x: any) {
      //   this.setData({
      //       bus: x.detail.value,
      //   });
      // },
      // onConsentSubmit: async function(){
      //   if(this.data.consentStu !== '' && this.data.consentParent !== ''){
      //   wx.showModal({
      //     title: "Submit Form 提交",
      //     content: "By submitting, you certify your digital signature is effective. You cannot edit this form after submission.\n确认提交则声明您的电子签名具有同等效应，提交后不可修改。",
      //     success: async (res) => {
      //       if(res.confirm){
      //           let checkDatabase = await this.data.db.collection("PromStudentData").where({
      //             userId: this.data.userData.student?.id,
      //           }).get();
      //           if (checkDatabase.data.length!==0){
      //             wx.cloud.callFunction({
      //               name: "AnyTicketSetStudentData",
      //               data: {
      //                 type: "submitConsent",
      //                 userId: this.data.userData.student?.id,
      //                 consent: true,
      //                 consentData: [this.data.consentStu, this.data.consentParent, this.data.busOptions[this.data.bus], Date.now()]
      //               }
      //             })
      //           }
      //           else{
      //             wx.cloud.callFunction({
      //               name: "AnyTicketSetStudentData",
      //               data: {
      //                 type: "submitConsentNew",
      //                 userId: this.data.userData.student?.id,
      //                 consent: true,
      //                 consentData: [this.data.consentStu, this.data.consentParent, this.data.busOptions[this.data.bus], Date.now()]
      //               }
      //             })
      //           }
      //           wx.navigateBack();
      //         }
      //       }
      //     })
      //   }
      //   else{
      //     wx.showModal({
      //       title: "请输入电子签名 Input Signature",
      //       content: "学生或监护人电子签名不能为空。Student and parent signature fields cannot be empty.",
      //       showCancel: false,
      //     })
      //   }
      // },
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
              await wx.cloud.callFunction({
                name: "AnyTicketSetStudentData",
                data: {
                  type: "submitMusic",
                  userData: this.data.userData,
                  musicName: this.data.musicName,
                  musicComposer: this.data.musicComposer,
                }
              })
              await wx.showToast({
                title: 'Submitted',
                icon: 'success'
              })
              this.setData({
                musicName: '',
                musicComposer: ''
              })
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
      // checkMealSelection: async function(){
      //   let checkMeal = await this.data.db.collection("PromStudentData").where({
      //     userId: this.data.userData.student?.id,
      //   }).get();
      //   if(checkMeal.data.length===0 || checkMeal.data[0].dinnerOption===undefined){
      //     this.setData({
      //       mealSelection: "Not Selected",
      //       mealSelectionClass: "no"
      //     });
      //   }
      //   else{
      //     this.setData({
      //       mealSelection: checkMeal.data[0].dinnerOption,
      //       mealSelectionClass: "yes"
      //     });
      //   }
      // },
      onShow: async function(){
        await this.checkHouseAvail();
        this.setData({
          consentStu: '',
          consentParent: '',
          // bus: 0,
          musicName: '',
          musicComposer: '',
          // studentSearchTextfield: '',
        })
        if(this.data.userData && this.data.userData.student){
          let checkHouse = await this.data.db.collection("PromStudentData").where({
            userId: this.data.userData.student?.id,
          }).get();
          if (checkHouse.data[0].house===undefined || !checkHouse.data[0].house){
            this.setData({
              houseStatus: false,
            })
          } else {
            if (this.data.house){
              this.displayStudentsInSameHouse();
              this.setData({
                houseStatus: true,
                // houseNumber: checkHouse.data[0].house
              })
            }
          }
        }
      },
      onLoad: async function(){
        this.data.consentStu = '';
        this.data.consentParent = '';
        this.data.musicName = '';
        this.data.musicComposer = '';
        // this.data.studentSearchTextfield = '';
        this.data.cacheSingleton = CacheSingleton.getInstance();
        this.data.db = wx.cloud.database();
        const eventChannel = this.getOpenerEventChannel();
        eventChannel.on('eventName', (res) => {
          this.setData({
            eventName: res,
            // bus: 0,
            // busOptions: ['无 None', '古北 Gubei', '莘庄 Xinzhuang', '浦东商城路 Pudong Shangcheng Rd', '浦东⻓清路 Changqing Rd', '徐家汇 Xujiahui', '虹梅 Hongmei', '江苏路 Jiangsu Rd'],
            // totalSelected: 0,
            // showStudentChoose: false
          });
        })
        eventChannel.on('dueDate', (res) => {
          this.setData({
            dueDate: res,
          });
        })
        eventChannel.on('option', async (res) => {
          if (res==='consent'){
            this.setData({
              consent: true,
            });
          }
          // else if (res==='meal'){
          //   this.setData({
          //     meal: true,
          //   });
          //   wx.showLoading({
          //     title: "Loading...",
          //     mask: true,
          //   });
          // }
          else if (res==='house'){
            this.setData({
              house: true,
            });
            wx.showLoading({
              title: "Loading...",
              mask: true,
            });
            await this.checkHouseAvail();
            if (this.data.allowHouse){
              let tmpTicketData: string[] = [];
              let tmpStudentData: Student[] = [];
              // let tmpGNumbers: gNumber[] = [];

              const allStudentRes = await this.data.cacheSingleton.getStudentData();
              const ticketRes = await allCollectionsData(this.data.db, "PromTickets");
              // const gNumberRes = await allCollectionsData(this.data.db, "gNumbers");

              const allStudentData = allStudentRes;
              const allTickets = ticketRes.data;
              // const allGData = gNumberRes.data;

              // Filter valid ticket holders
              for (let i = 0; i < allTickets.length; i++) {
                const t = allTickets[i];
                if ((t?.userId !== undefined && t.userId !== "") && t.status === "Issued" && (t?.house === undefined || t.house <= 0)) {
                  tmpTicketData.push(t.userId);
                }
              }

              // Filter students by ticket holders
              for (let j = 0; j < tmpTicketData.length; j++) {
                const sid = tmpTicketData[j];
                const match = allStudentData.find(stu => stu.id === sid);
                if (match) {
                  tmpStudentData.push(new Student(
                    match.id,
                    match.nickname,
                    match.uniqueNickname,
                    match.englishName,
                    match.chineseName,
                    match.studentGrade,
                    match.studentClass,
                    match.pseudoId
                  ));
                }
              }

              // Match gNumbers
              // for (let j = 0; j < tmpTicketData.length; j++) {
              //   const sid = tmpTicketData[j];
              //   const match = allGData.find((g: {_id: string; gnumber: gNumber; studentId: string;}) => g.studentId === sid);
              //   if (match) {
              //     tmpGNumbers.push(new gNumber(
              //       match._id,
              //       match.gnumber,
              //       match.studentId
              //     ));
              //   }
              // }

              // Build userSelect array
              let newUserSelect: boolean[] = tmpTicketData.map(() => false);
              let currentUserIndex = tmpStudentData.findIndex(s => s.id === this.data.userData.student?.id);
              if (currentUserIndex !== -1) {
                newUserSelect[currentUserIndex] = true;
              }

              this.setData({
                ticketData: tmpTicketData,
                studentData: tmpStudentData,
                // gNumber: tmpGNumbers,
                userSelect: newUserSelect,
                totalSelected: newUserSelect.filter(x => x).length,
                showStudentChoose: true
              });
            }
            wx.hideLoading();
            /*allCollectionsData(this.data.db, "PromTickets").then((res) => {
              let tmpTicketData = [];
              let tmpStudentData: Student[] = [];
              let tmpGNumbers: gNumber[] = [];
              // Gather ticket data for issued tickets
              for (let i = 0; i < res.data.length; i++) {
                if ((res.data[i]?.userId !== undefined && res.data[i].userId !== "") && res.data[i].status === "Issued" && (res.data[i]?.house === undefined || res.data[i].house <= 0)) {
                  tmpTicketData.push(res.data[i].userId);
                }
                // else if ((res.data[i]?.userId !== undefined && res.data[i].userId !== "") && res.data[i].status === "Lost" && (res.data[i]?.house === undefined || res.data[i].house <= 0)){
                //   tmpTicketData.push(res.data[i].userId.substring(0,res.data[i].userId.length-4));
                // }
              }
              this.setData({
                ticketData: tmpTicketData,
              });
              let newUserSelect: boolean[] = Array(this.data.ticketData.length);
              // Fetch student data and gNumber for each ticket
              let promises = [];
              for (let j = 0; j < this.data.ticketData.length; j++) {
                let studentPromise = this.data.db.collection("studentData").where({
                  _id: this.data.ticketData[j],
                }).get().then((res) => {
                  if (res.data && res.data.length!==0){
                    tmpStudentData.push(new Student(
                      res.data[0]._id as string, 
                      res.data[0].nickname, 
                      res.data[0].uniqueNickname, 
                      res.data[0].englishName, 
                      res.data[0].chineseName, 
                      res.data[0].grade, 
                      res.data[0].class, 
                      res.data[0].pseudoId
                    ));
                    if (res.data[0]._id === this.data.userData.student?.id){
                      newUserSelect.push(true);
                      this.setData({
                        totalSelected: 1
                      })
                    }
                    else{
                      newUserSelect.push(false);
                    }
                  }
                });
                let gNumberPromise = this.data.db.collection("gNumbers").where({
                  studentId: this.data.ticketData[j],
                }).get().then((res) => {
                  if (res.data && res.data.length!==0){
                    tmpGNumbers.push(new gNumber(
                      res.data[0]._id as string, 
                      res.data[0].gnumber, 
                      res.data[0].studentId
                    ));
                  }
                });
                newUserSelect.push(false);
                promises.push(studentPromise, gNumberPromise);
              }
            
              // Once all student and gNumber data are fetched
              Promise.all(promises).then(() => {
                this.setData({
                  studentData: tmpStudentData,
                  gNumber: tmpGNumbers,
                  userSelect: newUserSelect
                });
                let defaultUserSelect = this.data.userSelect || [];
                const currentUserIndex = this.data.studentData.findIndex(res => res.id === this.data.userData.student?.id);
                if (currentUserIndex !== -1) {
                  defaultUserSelect[currentUserIndex] = true;
                }
                this.setData({
                  userSelect: defaultUserSelect,
                  totalSelected: defaultUserSelect.filter(selected => selected).length
                });
                this.setData({
                  showStudentChoose: true
                })
                wx.hideLoading();
              });
            });*/
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
          wx.showLoading({
            title: "Loading...",
            mask: true,
          });
          let checkHouse = await this.data.db.collection("PromStudentData").where({
            userId: this.data.userData.student?.id,
          }).get();
          // if(checkMeal.data.length===0){
          //   this.setData({
          //     mealSelection: "Not Selected",
          //     mealSelectionClass: "no",
          //     houseStatus: false
          //   });
          //   if (!this.data.house){
          //     wx.hideLoading();
          //   }
          // }
          // else{
          //   if(checkMeal.data[0].dinnerOption===undefined){
          //     this.setData({
          //       mealSelection: "Not Selected",
          //       mealSelectionClass: "no"
          //     });
          //   }
          //   else{
          //     this.setData({
          //       mealSelection: checkMeal.data[0].dinnerOption,
          //       mealSelectionClass: "yes"
          //     });
          //     if (checkMeal.data[0].dinnerOption === "Fish"){
          //       this.setData({
          //         cheese: false,
          //         fish: true,
          //       });
          //     }
          //     else if(checkMeal.data[0].dinnerOption === "Cheese"){
          //       this.setData({
          //         cheese: true,
          //         fish: false,
          //       });
          //     }
          //   }
            // if(checkMeal.data.length !== 0 && checkMeal.data[0].consent === true && this.data.consent === true){
            //   wx.navigateBack();
            // }
            if(checkHouse.data.length === 0 || checkHouse.data[0].house===undefined || !checkHouse.data[0].house){
              this.setData({
                houseStatus: false
              });
              wx.hideLoading();
            } else {
              if (this.data.house) {
                this.displayStudentsInSameHouse();
                this.setData({
                  houseStatus: true,
                  // houseNumber: checkHouse.data[0].house
                });
                wx.hideLoading();
              }
              wx.hideLoading();
            } if (!this.data.house){
              wx.hideLoading();
            }
          // }
        })
        /*allCollectionsData(this.data.db, "BlackoutTickets").then((res) => {
          let tmpTicketData = [];
          let tmpStudentData: Student [] = [];
          let tmpGNumbers: gNumber [] = [];
          for (let i=0;i<res.data.length;i++) {
            if (res.data[i].userId && res.data[i].status==="Issued"){
              if (res.data[i].userId!==""){
                tmpTicketData.push(res.data[i].userId);
              }
            }
          }
          this.setData({
            ticketData: tmpTicketData,
          });
          for (let j=0;j<this.data.ticketData.length;j++){
            this.data.db.collection("studentData").where({
              _id: this.data.ticketData[j],
            }).get().then((res) => {
              tmpStudentData.push(new Student(res.data[j]._id as string, res.data[j].nickname, res.data[j].uniqueNickname, res.data[j].englishName, res.data[j].chineseName, res.data[j].grade, res.data[j].class, res.data[j].pseudoId));
            })
            this.data.db.collection("gNumbers").where({
              studentId: this.data.ticketData[j],
            }).get().then((res) => {
              tmpGNumbers.push(new gNumber(res.data[j]._id as string, res.data[j].gnumber, res.data[j].studentId));
            })
          }
          this.setData({
            studentData: tmpStudentData,
            gNumber: tmpGNumbers,
          });
          console.log(this.data.studentData)
        });*/
      },
      checkHouseAvail: async function() {
        let checkGroupLimit = await this.data.db.collection("PromDeadlines").where({
          optionId: "house",
        }).get();
        // if (checkGroupLimit.data[0].current>=checkGroupLimit.data[0].limit){
        if (checkGroupLimit.data[0].full){
          this.setData({
            allowHouse: false
          })
        } else {
          this.setData({
            allowHouse: true,
            houseMin: checkGroupLimit.data[0].sizeMin,
            houseMax: checkGroupLimit.data[0].sizeMax
          })
        }
      },
      displayStudentsInSameHouse: async function() {
        if (this.data.userData && this.data.userData.student){
          wx.showLoading({
            title: "Loading...",
            mask: true,
          });
          const allStudentRes = await this.data.cacheSingleton.getStudentData();
          const res = await this.data.db.collection("PromTables").where({
            guests: this.data.db.command.elemMatch(this.data.db.command.eq(this.data.userData.student.id))
          }).limit(1).get();
          const tableDoc = res.data[0];
          const guestIds: string[] = tableDoc.guests;
          const allStudentData = allStudentRes;
          const tmpStudentData: Student[] = [];
          // const matchingStudentDataIndexes: number[] = [];
          for (let i = 0; i < guestIds.length; i++) {
            const id = guestIds[i];
            const match = allStudentData.find(stu => stu.id === id);
            if (match) {
              tmpStudentData.push(match);
              // matchingStudentDataIndexes.push(i);
            }
          }
          this.setData({
            houseData: tmpStudentData,
            // houseIndex: matchingStudentDataIndexes,
            houseNumber: res.data[0].tableId
          });
          wx.hideLoading();
        } else {
          wx.showModal({
            title: "Not Registered",
            content: "You must complete registration to participate in this event.",
            showCancel: false,
            confirmText: "Dismiss",
          })
        }
        // try {
        //   let studentData = await this.data.db.collection("PromStudentData").where({
        //     userId: this.data.userData.student?.id,
        //   }).get();
        //   let houseNumber = studentData.data[0].house;
        //   let houseStudents = await this.data.db.collection("PromStudentData").where({
        //     house: houseNumber,
        //   }).get();
        //   let matchingStudentDataIndexes: number[] = [];
        //   let tmpStudentData: Student[] = [];
        //   let promises = [];
        //   for (let j = 0; j < houseStudents.data.length; j++) {
        //     let studentPromise = this.data.db.collection("studentData").where({
        //       _id: houseStudents.data[j].userId,
        //     }).get().then((res) => {
        //       tmpStudentData.push(new Student(
        //         res.data[0]._id as string,
        //         res.data[0].nickname,
        //         res.data[0].uniqueNickname,
        //         res.data[0].englishName,
        //         res.data[0].chineseName,
        //         res.data[0].grade,
        //         res.data[0].class,
        //         res.data[0].pseudoId
        //       ));
        //       matchingStudentDataIndexes.push(j);
        //     });
        //     promises.push(studentPromise);
        //   }
        //   Promise.all(promises).then(() => {
        //     this.setData({
        //       houseData: tmpStudentData,
        //       houseIndex: matchingStudentDataIndexes
        //     });
        //   });
        // } catch (error) {
        //   console.error("Error retrieving house data:", error);
        // }
      },      
    //   cheeseTap: function(){
    //     this.setData({
    //       cheese: true,
    //       fish: false,
    //     });
    //   },
    //   fishTap: function(){
    //     this.setData({
    //       fish: true,
    //       cheese: false
    //     });
    //   },
    //   onSaveDinner: async function(){
    //     wx.showLoading({
    //       title: "Loading...",
    //       mask: true,
    //     });
    //     let checkMeal = await this.data.db.collection("PromStudentData").where({
    //       userId: this.data.userData.student?.id,
    //     }).get();
    //     if(checkMeal.data.length===0){
    //       if (this.data.cheese===true){
    //         wx.showModal({
    //           title: "Save Option",
    //           content: "Save your meal option? You can still edit your meal option before the due date after saving.",
    //           cancelText: "Cancel",
    //           confirmText: "Confirm",
    //           success: async (res) => {
    //             if(res.confirm){
    //               await wx.cloud.callFunction({
    //                 name: "AnyTicketSetStudentData",
    //                 data: {
    //                   type: "dinner",
    //                   userId: this.data.userData.student?.id,
    //                   dinnerOption: "Cheese"
    //                 }
    //               })
    //               await this.checkMealSelection();
    //               wx.hideLoading();
    //               await wx.showToast({
    //                 title: 'Success',
    //                 icon: 'success',
    //                 duration: 1500,
    //               });
    //               wx.navigateBack();
    //             }
    //             else{
    //               wx.hideLoading();
    //             }
    //           }
    //         })
    //       }
    //       else if (this.data.fish===true){
    //         wx.showModal({
    //           title: "Save Option",
    //           content: "Save your meal option? You can still edit your meal option before the due date after saving.",
    //           cancelText: "Cancel",
    //           confirmText: "Confirm",
    //           success: async (res) => {
    //             if(res.confirm){
    //               await wx.cloud.callFunction({
    //                 name: "AnyTicketSetStudentData",
    //                 data: {
    //                   type: "dinner",
    //                   userId: this.data.userData.student?.id,
    //                   dinnerOption: "Fish"
    //                 }
    //               })
    //               await this.checkMealSelection();
    //               wx.hideLoading();
    //               await wx.showToast({
    //                 title: 'Success',
    //                 icon: 'success',
    //                 duration: 1500,
    //               });
    //               wx.navigateBack();
    //             }
    //             else{
    //               wx.hideLoading();
    //             }
    //           }
    //         })
    //       }
    //       else{
    //         this.checkMealSelection();
    //         wx.hideLoading();
    //         wx.showModal({
    //           title: "Invalid Selection",
    //           content: "Please select a dinner option.",
    //           showCancel: false,
    //           confirmText: "Dismiss"
    //         })
    //       }
    //     }
    //     else{
    //       if (this.data.cheese===true){
    //         wx.showModal({
    //           title: "Save Option",
    //           content: "Save your meal option? You can still edit your meal option before the due date after saving.",
    //           cancelText: "Cancel",
    //           confirmText: "Confirm",
    //           success: async (res) => {
    //             if(res.confirm){
    //               await wx.cloud.callFunction({
    //                 name: "AnyTicketSetStudentData",
    //                 data: {
    //                   type: "dinnerModify",
    //                   userId: this.data.userData.student?.id,
    //                   dinnerOption: "Cheese"
    //                 }
    //               })
    //               await this.checkMealSelection();
    //               wx.hideLoading();
    //               await wx.showToast({
    //                 title: 'Success',
    //                 icon: 'success',
    //                 duration: 1500,
    //               });
    //               wx.navigateBack();
    //             }
    //             else{
    //               wx.hideLoading();
    //             }
    //           }
    //         })
    //       }
    //       else if (this.data.fish===true){
    //         wx.showModal({
    //           title: "Save Option",
    //           content: "Save your meal option? You can still edit your meal option before the due date after saving.",
    //           cancelText: "Cancel",
    //           confirmText: "Confirm",
    //           success: async (res) => {
    //             if(res.confirm){
    //               await wx.cloud.callFunction({
    //                 name: "AnyTicketSetStudentData",
    //                 data: {
    //                   type: "dinnerModify",
    //                   userId: this.data.userData.student?.id,
    //                   dinnerOption: "Fish"
    //                 }
    //               })
    //               await this.checkMealSelection();
    //               wx.hideLoading();
    //               await wx.showToast({
    //                 title: 'Success',
    //                 icon: 'success',
    //                 duration: 1500,
    //               });
    //               wx.navigateBack();
    //             }
    //             else{
    //               wx.hideLoading();
    //             }
    //           }
    //         })
    //       }
    //       else {
    //         this.checkMealSelection();
    //         wx.hideLoading();
    //         wx.showModal({
    //           title: "Invalid Selection",
    //           content: "Please select a dinner option.",
    //           showCancel: false,
    //           confirmText: "Dismiss"
    //         })
    //       }
    //     }
    //   },
      handleSearchBoxChange: function(e: any) {
        if (this.data.studentData === undefined) {
          return;
        }
        let searchTokens = cutStringToSearchTokens(e.detail.value);
        let matchingStudentDataIndexes=[];
        if (searchTokens.length!==0) {
          for (let i=0;i<this.data.studentData.length;i++) {
            // check whether or not the user input matches this student data entry
            // in order to match this user data entry, every single search token has to match any of the tokens from this student data entry
            let currentTokens: string[]=[];
            currentTokens.push.apply(currentTokens, (cutStringToSearchTokens(this.data.studentData[i].nickname)));
            currentTokens.push.apply(currentTokens, (cutStringToSearchTokens(this.data.studentData[i].englishName)));
            currentTokens.push.apply(currentTokens, (cutStringToSearchTokens(this.data.studentData[i].chineseName)));
            currentTokens.push.apply(currentTokens, (cutStringToSearchTokens(this.data.studentData[i].studentClass.toString())));
            currentTokens.push.apply(currentTokens, (cutStringToSearchTokens(this.data.studentData[i].studentGrade.toString())));
            let match = true;
            for (let j=0;j<searchTokens.length;j++) {
              let thisTokenMatch = false;
              // does this search token match any of the entry tokens?
              for (let k=0; k<currentTokens.length; k++) {
                if (searchTokens[j].length<=currentTokens[k].length) {
                  if (currentTokens[k].substr(0,searchTokens[j].length)===searchTokens[j]) {
                    thisTokenMatch=true;
                    break;
                  }
                }
              }
              if (!thisTokenMatch) {
                match=false;
                break;
              }
            }
            if (match) {
              matchingStudentDataIndexes.push(i);
            }
          }
        } else {
          for (let i=0;i<this.data.userSelect.length;i++) {
            if (this.data.userSelect[i]) {
              matchingStudentDataIndexes.push(i);
            }
          }
        }
        const limitItems=50;
        if (matchingStudentDataIndexes.length>limitItems) {
          matchingStudentDataIndexes=matchingStudentDataIndexes.slice(0, limitItems);
        }
        this.setData({
          matchingIndexes: matchingStudentDataIndexes,
        });
      },
      handlePersonChoose: async function(x: any) {
        this.setData({
          studentSearchTextfield: ''
        })
        let newUserSelect = this.data.userSelect;
        let newTotalSelected = this.data.totalSelected;
        const currentUserIndex = this.data.studentData.findIndex(student => student.id === this.data.userData.student?.id);
        if (x.currentTarget.dataset.chosenid === currentUserIndex){
          wx.showModal({
            title: "Invalid Selection",
            content: "You may not deselect yourself.",
            showCancel: false,
            confirmText: "Dismiss"
          })
          return;
        } else if (this.data.totalSelected >= this.data.houseMax && !newUserSelect[x.currentTarget.dataset.chosenid]){
          wx.showModal({
            title: "Invalid Selection",
            content: `Only up to ${this.data.houseMax} group members can be selected.`,
            showCancel: false,
            confirmText: "Dismiss"
          })
          return;
        } else {
          newUserSelect[x.currentTarget.dataset.chosenid] = !newUserSelect[x.currentTarget.dataset.chosenid];
          if (newUserSelect[x.currentTarget.dataset.chosenid]) {
            newTotalSelected+=1;
          } else {
            newTotalSelected-=1;
          }
          this.setData({
            userSelect: newUserSelect,
            totalSelected: newTotalSelected,
          });
        }
      },
      nextClicked: async function() {
        await this.checkHouseAvail();
        if(this.data.allowHouse === true){
          if (this.data.totalSelected<this.data.houseMin) {
            wx.showModal({
              title: "Invalid Selection",
              content: `You must select a minimum of ${this.data.houseMin} group members to continue.`,
              showCancel: false,
              confirmText: "Dismiss"
            })
            return;
          }
          else {
            wx.navigateTo({
              url: '/pages/AnyTicketConfirmMultiSelect/AnyTicketConfirmMultiSelect',
              success: (res) => {
                let selectedData:Student[]=[];
                for (let i=0;i<this.data.userSelect.length;i++) {
                  if (this.data.userSelect[i]) {
                    selectedData.push(this.data.studentData[i]);
                  }
                }
                res.eventChannel.emit('selectedData', selectedData);
                res.eventChannel.emit('eventName', this.data.eventName);
                res.eventChannel.emit('dueDate', this.data.dueDate);
              }
            });
          }
        }
      else{
        wx.showModal({
          title: "Sign-Up Full",
          content: "We're sorry, sign-ups for table groups are currently full.",
          showCancel: false,
          confirmText: "Dismiss"
        });
        return;
      }
    },
  }
})