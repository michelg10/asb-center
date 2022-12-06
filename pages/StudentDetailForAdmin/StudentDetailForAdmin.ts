import { Order } from "../AnyOrderMainPage/AnyOrderMainPage";

// pages/StudentDetailForAdmin/StudentDetailForAdmin.ts
interface ComponentDataInterface {
    publicUserData: PublicUserData,
    computedUserName: string,
    db: DB.Database,
    anyOrderOrder: Order|undefined,
    anyOrderName: string,
    orderExtraNotes: string,
    updateOrderCallBusy: boolean,
};
type PublicUserData = {
    _id: string,
    compactId: string,
    studentId: string,
    userId: string,
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
            this.updateOrderNotes(this.data.anyOrderOrder as Order);
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
                return studentName;
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
        onLoad: function() {
            this.setData({
                anyOrderName: "Elfin Express",
            });
            this.data.db = wx.cloud.database();
            this.data.updateOrderCallBusy = false;
            // act on eventChannel Data
            const eventChannel = this.getOpenerEventChannel();
            eventChannel.on("userId", async(userData: PublicUserData) => {
                this.setData({
                    publicUserData: userData,
                    computedUserName: userData.compactId,
                });

                // get the student name to put on the title instead of an ID and fetch orders for White V
                this.fetchUserStudentName(userData.studentId).then((res) => {
                    if (res !== undefined) {
                        this.setData({
                            computedUserName: res as string,
                        });
                    }
                })
                this.fetchAnyOrderStatus("ChristmasSale2022", userData._id).then((res) => {
                    this.setData({
                        anyOrderOrder: res as any,
                    });
                    this.updateOrderNotes(this.data.anyOrderOrder as Order);
                });
            })
        },
        updateOrderNotes: function(order: Order) {
            // for extra notes asb members need to know about the order, such as the number of letters
            let orderNotes = "";
            if (true) {
                // count letters
                let letterCount = 0;
                for (let i=0;i<order.subordersList.length;i++) {
                    let suborder = order.subordersList[i];
                    for (let j=0;j<suborder.objects.length;j++) {
                        let suborderObject = suborder.objects[j];
                        if (suborderObject.objectId === "letter") {
                            letterCount += suborderObject.quantity.valueOf();
                        }
                    }
                }
                orderNotes = `${letterCount} letter${letterCount === 1 ? '' : 's'}`;
            }
            this.setData({
                orderExtraNotes: orderNotes,
            });
        }
    }
})
