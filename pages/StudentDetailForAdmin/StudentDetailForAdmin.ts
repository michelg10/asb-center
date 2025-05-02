import CacheSingleton from "../../classes/CacheSingleton";
import { handleAnyTicketCode } from '../../utils/handleAnyTicketCode';
import { Order } from "../AnyOrderMainPage/AnyOrderMainPage";

// pages/StudentDetailForAdmin/StudentDetailForAdmin.ts
interface ComponentDataInterface {
    publicUserData: PublicUserData,
    computedUserName: string,
    // dinnerSelectionClass: string,
    // dinnerSelection: string,
    cheese: boolean | false,
    fish: boolean | false,
    displayAnyTicket: boolean,
    accountIsPseudo: boolean,
    otherAccounts: number,
    accessingUserId: string,
    userOpenId: string,
    studentGrade: number,
    studentClass: number,
    adminStatus: AdminStatusType,
    cacheSingleton: CacheSingleton,
    db: DB.Database,
    anyOrderOrder: Order|undefined,
    anyOrderName: string,
    updateOrderCallBusy: boolean,
    anyTicketName: string,
    anyTicketStatusClass: string,
    anyTicketStatus: string,
    anyTicketId: string,
};
type PublicUserData = {
    _id: string,
    compactId: string,
    studentId: string,
    userId: string,
};
type AdminStatusType = {
  wxId: string,
  userId: string,
  canIssueTicket: boolean,
  canIssueTicketToGuest: boolean,
  canAddAdmin: boolean,
  adminName: string,
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
        anyOrderUpdate: async function(orderEvent: string, orderId: string, newStatus: "sub" | "acc") {
            if (this.data.updateOrderCallBusy) {
                return;
            }
            if (this.data.anyOrderOrder === undefined) {
                return;
            }
            this.data.updateOrderCallBusy = true;
            let callUpdate = await wx.cloud.callFunction({
                name: "AnyOrderAdminUpdateOrderStatus",
                data: {
                    orderEvent: orderEvent,
                    orderId: orderId,
                    newStatus: newStatus,
                }
            });
            let callUpdateResult = callUpdate.result as any;
            if (callUpdateResult.status !== "success") {
                console.log(`Call update error ${callUpdateResult.reason}`);
                this.data.updateOrderCallBusy = false;
                return;
            }
            let newOrder = this.data.anyOrderOrder;
            if (callUpdateResult.newStatus === "unsub") {
                newOrder.orderStatus = "unsub";
            } else {
                newOrder = {
                    ...callUpdateResult.orderSnapshot,
                    _id: (this.data.anyOrderOrder as any)._id,
                };
            }
            // console.log(newOrder);
            this.setData({
                anyOrderOrder: newOrder,
            });
            this.data.updateOrderCallBusy=false;
        },
        anyOrderAcceptTapped: function() {
            this.anyOrderUpdate("ChristmasSale2022", (this.data.anyOrderOrder as any)._id, "acc");
        },
        anyOrderCancelTapped: function() {
            this.anyOrderUpdate("ChristmasSale2022", (this.data.anyOrderOrder as any)._id, "sub");
        },
        fetchUserStudentName: function(studentId: string) {
            // takes in studentId for the studentId
            // returns a Promise that resolves to the student's database entry within the studentData database
            return this.data.db.collection("studentData").where({
                _id: studentId,
            }).get().then((res) => {
                if (res.data.length === 0) {
                    return undefined;
                }
                let studentName: string = res.data[0].uniqueNickname;
                let studentGrade: number = res.data[0].grade;
                let studentClass: number = res.data[0].class;
                return [studentName, studentGrade, studentClass];
            })
        },
        fetchAnyOrderStatus: function(event: string, studentId: string) {
            // takes in event for the event name (e.g. WhiteV2022) and studentId for the _id of the student
            // returns a Promise that resolves to the call of AnyOrderAdminQueryOrder
            return wx.cloud.callFunction({
                name: "AnyOrderAdminQueryOrder",
                data: {
                    queryUserId: studentId,
                    orderEvent: event,
                }
            }).then((res) => {
                console.log(res);
                if ((res.result as AnyObject).status !== "success") {
                    return undefined;
                }
                let orderObject: Order = (res.result as AnyObject).data;
                console.log(orderObject);
                if (orderObject.orderStatus === undefined) {
                    return {
                        orderStatus: "unsub",
                    };
                }
                return orderObject;
            });
        },
        onUpdateStatus: async function() {
          let checkAnyTicketStatus = await this.data.db.collection("PromTickets").where({
            userId: this.data.publicUserData.studentId,
          }).get();
          let checkLostTicketStatus = await this.data.db.collection("PromTickets").where({
            userId: this.data.publicUserData.studentId.concat("LOST"),
          }).get();
          if (checkAnyTicketStatus.data.length === 0){
            //No active ticket
            if (checkLostTicketStatus.data.length === 0){
              //No lost ticket
              this.setData({
                anyTicketStatus: "No",
                anyTicketStatusClass: "sub"
              })
            }
            else {
              //Found lost ticket
              this.setData({
                anyTicketStatus: "Lost",
                anyTicketStatusClass: "unsub",
                anyTicketId: checkLostTicketStatus.data[0].ticketId
              })
            }
          }
          else{
            //Active ticket
            this.setData({
              anyTicketStatus: "Issued",
              anyTicketStatusClass: "acc",
              anyTicketId: checkAnyTicketStatus.data[0].ticketId
            })
          }
        },
        // onUpdateDinner: async function(){
        //   let checkDinnerStatus = await this.data.db.collection("PromStudentData").where({
        //     userId: this.data.publicUserData.studentId,
        //   }).get();
        //   if (checkDinnerStatus.data.length === 0 || checkDinnerStatus.data[0].dinnerOption===undefined){
        //     this.setData({
        //       dinnerSelection: "Not Selected",
        //       dinnerSelectionClass: "unsub",
        //     })
        //   }
        //   else {
        //     this.setData({
        //       dinnerSelection: checkDinnerStatus.data[0].dinnerOption,
        //       dinnerSelectionClass: "acc",
        //     })
        //   }
        // },
        onOperateTicket: function() {
          wx.navigateTo({
            url: '/pages/AnyTicketAdminPanel/AnyTicketAdminPanel',
            success: (res) => {
              res.eventChannel.emit('ticketId', this.data.anyTicketId);
            }
          });
        },
        onIssuePreview: function(){
          if (this.data.adminStatus.canIssueTicketToGuest){
            wx.showModal({
              title: "Enable Preview",
              // content: "Enable preview allows the current user to submit consent form, meal option, and music requests even without a physical ticket. This also makes the user discoverable within house grouping.",
              content: "Enable preview allows the current user to submit consent form and music requests even without a physical ticket.",
              cancelText: "Cancel",
              confirmText: "Confirm",
              success: async (res) => {
                if (res.confirm){
                  await wx.cloud.callFunction({
                    name: "AnyTicketIssueTicket",
                    data: {
                      type: "issuePreview",
                      issuerId: this.data.adminStatus.userId,
                      issuerName: this.data.adminStatus.adminName,
                      studentName: this.data.computedUserName,
                      userId: this.data.publicUserData.studentId
                    }
                  })
                  this.onUpdateStatus();
                  // this.onUpdateDinner();
                }
              }
            })
          }
        },
        onIssueTicket: function() {
          wx.scanCode({
            onlyFromCamera: true,
            success: async (res) => {
              wx.showLoading({
                title: "Please Wait...",
                mask: true,
              });
              let parseCodeData = await handleAnyTicketCode(this.data.adminStatus.adminName, res.result);
              if (parseCodeData!=="invalid"){
                if(parseCodeData[0]==="ticketCode"){
                  //Valid code format, check if already issued
                  let checkTicketStatus = await this.data.db.collection("PromTickets").where({
                    ticketId: parseCodeData[1],
                  }).get();
                  if(checkTicketStatus.data[0].status==="Available"){
                    await wx.cloud.callFunction({
                      name: "AnyTicketIssueTicket",
                      data: {
                        type: "issue",
                        ticketId: parseCodeData[1],
                        issuerId: this.data.adminStatus.userId,
                        issuerName: this.data.adminStatus.adminName,
                        studentName: this.data.computedUserName,
                        userId: this.data.publicUserData.studentId
                      }
                    })
                    wx.hideLoading();
                    this.onUpdateStatus();
                    // this.onUpdateDinner();
                  } else {
                    wx.hideLoading();
                    wx.showModal({
                      title: "Code Scan Failure",
                      content: `Ticket of status ${checkTicketStatus.data[0].status} cannot be issued.`,
                      showCancel: false,
                      confirmText: "Dismiss"
                    })
                  }
                } else {
                  wx.hideLoading();
                  wx.showModal({
                    title: "Code Scan Failure",
                    content: "Please scan Ticket Code, not Personal Code.",
                    showCancel: false,
                    confirmText: "Dismiss"
                  })
                }
              } else wx.hideLoading();
            },
          })
        },
        onIssueDigitalTicket: async function() {
          wx.showModal({
            title: 'Confirm Issuance',
            content: 'Are you sure you want to issue a digital event ticket to this guest? Confirm that the guest has paid before continuing.',
            cancelText: 'Cancel',
            confirmText: 'Confirm',
            success: async (res) => {
              if(res.confirm){
                wx.showLoading({
                  title: "Please Wait...",
                  mask: true,
                });
                let getAvailableTickets = await this.data.db.collection("PromTickets").where({
                  status: 'Available',
                }).limit(1).get();
                await wx.cloud.callFunction({
                  name: "AnyTicketIssueTicket",
                  data: {
                    type: "issue",
                    ticketId: getAvailableTickets.data[0].ticketId,
                    issuerId: this.data.adminStatus.userId,
                    issuerName: this.data.adminStatus.adminName,
                    studentName: this.data.computedUserName,
                    userId: this.data.publicUserData.studentId
                  }
                })
                wx.hideLoading();
                this.onUpdateStatus();
              }
            }
          })
        },
        onIssueTicketStation: async function() {
          wx.navigateTo({
            url: "/pages/StationModeAnyInput/StationModeAnyInput",
            success: (res) => {
              res.eventChannel.on("data", async (data) => {
                let parseCodeData = await handleAnyTicketCode(this.data.adminStatus.adminName, data);
                if (parseCodeData!=="invalid"){
                  if(parseCodeData[0]==="ticketCode"){
                    await wx.cloud.callFunction({
                      name: "AnyTicketIssueTicket",
                      data: {
                        type: "issue",
                        ticketId: parseCodeData[1],
                        issuerId: this.data.adminStatus.userId,
                        issuerName: this.data.adminStatus.adminName,
                        studentName: this.data.computedUserName,
                        userId: this.data.publicUserData.studentId
                      }
                    })
                    this.onUpdateStatus();
                    // this.onUpdateDinner();
                  }
                  else {
                    wx.showModal({
                      title: "Code Scan Failure",
                      content: "Please scan Ticket Code, not Personal Code.",
                      showCancel: false,
                      confirmText: "Dismiss"
                    })
                  }
                }
              })
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
        // onSaveDinner: async function(){
        //   let checkMeal = await this.data.db.collection("PromStudentData").where({
        //     userId: this.data.publicUserData.studentId,
        //   }).get();
        //   if(checkMeal.data.length===0){
        //     if (this.data.cheese===true){
        //       await wx.cloud.callFunction({
        //         name: "AnyTicketSetStudentData",
        //         data: {
        //           type: "dinner",
        //           userId: this.data.publicUserData.studentId,
        //           dinnerOption: "Cheese"
        //         }
        //       })
        //       // this.onUpdateDinner();
        //     }
        //     else if (this.data.fish===true){
        //       await wx.cloud.callFunction({
        //         name: "AnyTicketSetStudentData",
        //         data: {
        //           type: "dinner",
        //           userId: this.data.publicUserData.studentId,
        //           dinnerOption: "Fish"
        //         }
        //       })
        //       // this.onUpdateDinner();
        //     }
        //     else{
        //       // this.onUpdateDinner();
        //       wx.showModal({
        //         title: "Invalid Selection",
        //         content: "Please select a dinner option.",
        //         showCancel: false,
        //         confirmText: "Dismiss"
        //       })
        //     }
        //   }
        //   else{
        //     if (this.data.cheese===true){
        //       await wx.cloud.callFunction({
        //         name: "AnyTicketSetStudentData",
        //         data: {
        //           type: "dinnerModify",
        //           userId: this.data.publicUserData.studentId,
        //           dinnerOption: "Cheese"
        //         }
        //       })
        //       // this.onUpdateDinner();
        //     }
        //     else if (this.data.fish===true){
        //       await wx.cloud.callFunction({
        //         name: "AnyTicketSetStudentData",
        //         data: {
        //           type: "dinnerModify",
        //           userId: this.data.publicUserData.studentId,
        //           dinnerOption: "Fish"
        //         }
        //       })
        //       // this.onUpdateDinner();
        //     }
        //     else {
        //       // this.onUpdateDinner();
        //       wx.showModal({
        //         title: "Invalid Selection",
        //         content: "Please select a dinner option.",
        //         showCancel: false,
        //         confirmText: "Dismiss"
        //       })
        //     }
        //   }
        // },
        onShow: function(){
          this.onUpdateStatus();
          // this.onUpdateDinner();
        },
        onLoad: async function() {
            this.setData({
                anyOrderName: "Elfin Express",
                anyTicketName: "PROM 2025"
            });
            this.data.db = wx.cloud.database();
            this.data.updateOrderCallBusy = false;
            // act on eventChannel Data
            const eventChannel = this.getOpenerEventChannel();
            eventChannel.on("userId", async (userData: PublicUserData) => {
                await this.setData({
                    publicUserData: userData,
                    computedUserName: userData.compactId,
                });
                // get the student name to put on the title instead of an ID and fetch orders for White V
                if (this.data.publicUserData.studentId!==undefined) {
                  this.setData({
                    displayAnyTicket: true
                  })
                  let determineAccount = await this.data.db.collection("studentData").where({
                    _id: this.data.publicUserData.studentId,
                  }).get();
                  if (determineAccount.data[0].pseudoId === this.data.publicUserData._id){
                    let accountsNumber = await wx.cloud.callFunction({
                      name: "associatedAccountsNumber",
                      data: {
                        studentId: this.data.publicUserData.studentId,
                      }
                    });
                    this.setData({
                      accountIsPseudo: true,
                      otherAccounts: (accountsNumber.result as any).result-1,
                    })
                  }
                this.fetchUserStudentName(this.data.publicUserData.studentId).then((res) => {
                    if (res !== undefined) {
                        this.setData({
                            computedUserName: res[0] as string,
                            studentGrade: res[1] as number,
                            studentClass: res[2] as number
                        });
                    }
                });
                this.data.cacheSingleton = CacheSingleton.getInstance();
                this.data.userOpenId = await this.data.cacheSingleton.fetchUserOpenId();
                // now fetch admin status
                let accessingUserId = await this.data.db.collection("userData").where({
                  userId: this.data.userOpenId,
                }).get();
                if (accessingUserId.data.length === 0) {
                  // this error literally makes no sense but just in case i do something dumb
                  console.log("Current user not registered!");
                  wx.navigateBack();
                  return;
                }
                this.setData({
                  accessingUserId: accessingUserId.data[0]._id as string,
                });
                let checkAdmin = await this.data.db.collection("admins").where({
                  userId: this.data.accessingUserId,
                }).get();
                if (checkAdmin.data.length === 0) {
                  console.log("Current user is not admin!");
                  wx.navigateBack();
                  return;
                }
                this.setData({
                  adminStatus: {
                    wxId: checkAdmin.data[0]._id as string,
                    userId: checkAdmin.data[0].userId,
                    canIssueTicket: checkAdmin.data[0].canIssueTicket,
                    canIssueTicketToGuest: checkAdmin.data[0].canIssueTicketToGuest,
                    canAddAdmin: checkAdmin.data[0].canAddAdmin,
                    adminName: checkAdmin.data[0].adminName,
                  }
                  });
                let checkAnyTicketStatus = await this.data.db.collection("PromTickets").where({
                  userId: userData.studentId,
                }).get();
                let checkLostTicketStatus = await this.data.db.collection("PromTickets").where({
                  userId: userData.studentId.concat("LOST"),
                }).get();
                // let checkDinnerStatus = await this.data.db.collection("PromStudentData").where({
                //   userId: userData.studentId,
                // }).get();
                if (checkAnyTicketStatus.data.length === 0){
                  //No active ticket, check if lost ticket
                  if (checkLostTicketStatus.data.length === 0){
                    //No lost ticket
                    this.setData({
                      anyTicketStatus: "No",
                      anyTicketStatusClass: "sub"
                    })
                    this.onUpdateStatus();
                    // this.onUpdateDinner();
                  }
                  else{
                    //Found lost ticket
                    // if (checkDinnerStatus.data.length === 0 || checkDinnerStatus.data[0].dinnerOption===undefined){
                      //No dinner selection
                      this.setData({
                        // dinnerSelection: "Not Selected",
                        // dinnerSelectionClass: "unsub",
                        anyTicketStatus: "Lost",
                        anyTicketStatusClass: "unsub",
                        anyTicketId: checkLostTicketStatus.data[0].ticketId
                      })
                      this.onUpdateStatus();
                      // this.onUpdateDinner();
                    // }
                    // else {
                    //   this.setData({
                    //     //Lost ticket with dinner selection
                    //     dinnerSelection: checkDinnerStatus.data[0].dinnerOption,
                    //     dinnerSelectionClass: "acc",
                    //     anyTicketStatus: "Lost",
                    //     anyTicketStatusClass: "unsub",
                    //     anyTicketId: checkLostTicketStatus.data[0].ticketId
                    //   })
                    //   this.onUpdateStatus();
                    //   // this.onUpdateDinner();
                    // }
                  }
                }
                else{
                  //Active ticket
                    // if (checkDinnerStatus.data.length === 0 || checkDinnerStatus.data[0].dinnerOption===undefined){
                      //No dinner selection
                      this.setData({
                        // dinnerSelection: "Not Selected",
                        // dinnerSelectionClass: "unsub",
                        anyTicketStatus: "Issued",
                        anyTicketStatusClass: "acc",
                        anyTicketId: checkAnyTicketStatus.data[0].ticketId
                      })
                      this.onUpdateStatus();
                      // this.onUpdateDinner();
                    }
                    // else {
                    //   //Active ticket and dinner selection
                    //   this.setData({
                    //     dinnerSelection: checkDinnerStatus.data[0].dinnerOption,
                    //     dinnerSelectionClass: "acc",
                    //     anyTicketStatus: "Issued",
                    //     anyTicketStatusClass: "acc",
                    //     anyTicketId: checkAnyTicketStatus.data[0].ticketId
                    //   })
                    //   this.onUpdateStatus();
                    //   // this.onUpdateDinner();
                    // }
                  }
                /*this.fetchAnyOrderStatus("ChristmasSale2022", userData._id).then((res) => {
                    this.setData({
                        anyOrderOrder: res as any,
                    });
                });*/
            // }
          })
        },
        configureAdminClick: function() {
          wx.navigateTo({
            url: '/pages/ConfigureGlobalAdmin/ConfigureGlobalAdmin',
            success: (res) => {
              res.eventChannel.emit('userId', this.data.publicUserData._id);
            }
          })
        }
    }
})
