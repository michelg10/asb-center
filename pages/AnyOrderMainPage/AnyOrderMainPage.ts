// pages/AnyOrderMainPage/AnyOrderMainPage.ts

import { CacheSingleton } from "../../classes/CacheSingleton";
import { Student } from "../../classes/student";
import allCollectionsData from "../../utils/allCollectionsData";
import { UserDataType } from "../../utils/common";

export type OrderObject = {
    _id: String,
    cost: Number,
    name: String,
};
type ComponentDataInterface = {
    eventName: String,
    eventId: String,
    userData: UserDataType,
    order: Order,
    db: DB.Database,
    errorMessage: String | undefined,
    orderHasDelta: boolean,
    orderObjects: OrderObject[],
    cacheSingleton: CacheSingleton,
}
type StudentOrderInfo = {
    name: String,
    class: String,
}
export type ObjectAndQuantity = {
    objectId: String,
    computedObjectName: String,
    computedSingleObjectCost: Number,
    quantity: Number,
}
export type Suborder = {
    recipientType: "student" | "teacher",
    studentRecipientId: String | null,
    computedStudentRecipientName: String | null,
    teacherRecipientName: String,
    objects: ObjectAndQuantity[],
    computedTotalCost: Number
}
export type Order = {
    orderUser: String,
    orderFrom: StudentOrderInfo | null,
    subordersList: Suborder[],
    orderStatus: "unsub" | "sub" | "acc",
    computedTotalCost: Number,
}

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
        computeCosts: function() {
            if (this.data.order === undefined || this.data.orderObjects === undefined) {
                return;
            }
            
            let newOrder = this.data.order;
            console.log("compute costs");
            let idToCostMap = new Map<string, OrderObject>();
            for (let i=0;i<this.data.orderObjects.length;i++) {
                idToCostMap.set(this.data.orderObjects[i]._id.toString(), this.data.orderObjects[i]);
            } 
            let totalCost = 0;
            for (let i=0;i<this.data.order.subordersList.length;i++) {
                let currentTotalCost = 0;
                for (let j=0;j<this.data.order.subordersList[i].objects.length;j++) {
                    currentTotalCost+=idToCostMap.get(this.data.order.subordersList[i].objects[j].objectId.valueOf())!.cost.valueOf()*this.data.order.subordersList[i].objects[j].quantity.valueOf();
                    newOrder.subordersList[i].objects[j].computedSingleObjectCost=idToCostMap.get(this.data.order.subordersList[i].objects[j].objectId.valueOf())!.cost;
                }
                newOrder.subordersList[i].computedTotalCost=currentTotalCost;
                totalCost+=currentTotalCost;
            }
            newOrder.computedTotalCost = totalCost;
            this.setData({
                order: newOrder,
            });
        },
        submitButtonClicked: function() {
            let newOrder = this.data.order;
            newOrder.orderStatus = "sub";
            this.setData({
                order: newOrder,
                orderHasDelta: true,
            });
            this.uploadOrder();
        },
        deleteOrderTapped: function(x: any) {
            let newOrder = this.data.order;
            let index: number = x.currentTarget.dataset.index;
            newOrder.subordersList.splice(index, 1);
            this.setData({
                order: newOrder,
                orderHasDelta: true,
            });
            this.computeCosts();
        },
        handleSuborderPassBack: function(res: any) {
            let index: number|null = res.index;
            let suborder: Suborder = res.suborder;
            let newOrder = this.data.order;
            if (index === null) {
                newOrder.subordersList.push(suborder);
            } else {
                newOrder.subordersList[index] = suborder;
            }
            this.setData({
                order: newOrder,
                orderHasDelta: true,
            });
            this.computeCosts();
        },
        editOrderTapped: function(x: any) {
            let index: number = x.currentTarget.dataset.index;
            wx.navigateTo({
                url: "/pages/AnyOrderSuborder/AnyOrderSuborder",
                success: (res) => {
                    res.eventChannel.on("suborderPassBack", (res) => {
                        this.handleSuborderPassBack(res);
                    });
                    res.eventChannel.emit("data", {
                        eventId: this.data.eventId,
                        suborder: {...this.data.order.subordersList[index]},
                        suborderIndex: index,
                        orderObjects: this.data.orderObjects,
                        cacheSingleton: this.data.cacheSingleton,
                    });
                }
            });
        },
        newOrderTapped: function() {
            let newSuborder: Suborder = {
                recipientType: "student",
                studentRecipientId: null,
                computedStudentRecipientName: null,
                teacherRecipientName: "",
                objects: [],
                computedTotalCost: 0,
            };
            wx.navigateTo({
                url: "/pages/AnyOrderSuborder/AnyOrderSuborder",
                success: (res) => {
                    res.eventChannel.on("suborderPassBack", (res) => {
                        this.handleSuborderPassBack(res);
                    });
                    res.eventChannel.emit("data", {
                        eventId: this.data.eventId,
                        suborder: newSuborder,
                        suborderIndex: null,
                        orderObjects: this.data.orderObjects,
                        cacheSingleton: this.data.cacheSingleton,
                    });
                }
            });
        },
        classBind: function(x: any) { // class text field edited
            let newOrder = this.data.order;
            if (newOrder.orderFrom !== null) {
                newOrder.orderFrom!.class=x.detail.value;
            }
            this.setData({
                order: newOrder,
                orderHasDelta: true,
            });
        },
        nameBind: function(x: any) { // name text field edited
            let newOrder = this.data.order;
            if (newOrder.orderFrom !== null) {
                newOrder.orderFrom!.name=x.detail.value;
            }
            this.setData({
                order: newOrder,
                orderHasDelta: true,
            });
        },
        onUnload: function(x: any) {
            this.uploadOrder();
        },
        setAnonymity: function(x: any) {
            if (this.data.order.orderStatus !== "unsub") {
                return;
            }
            let newOrder = this.data.order;
            if (x.currentTarget.dataset.id === "named") {
                if (this.data.order.orderFrom !== null) {
                    return;
                }
                newOrder.orderFrom = {
                    name: "",
                    class: "",
                };
                this.setData({
                    order: newOrder,
                    orderHasDelta: true,
                });
            } else if (x.currentTarget.dataset.id === "anonymous") {
                newOrder.orderFrom = null;
                this.setData({
                    order: newOrder,
                    orderHasDelta: true,
                });
            }
        }, 
        cancelButtonPressed: function() {
            let newOrder = this.data.order;
            newOrder.orderStatus = "unsub";
            this.setData({
                order: newOrder,
                orderHasDelta: true,
            });
            this.uploadOrder();
        }, uploadOrder: async function() {
            if (!this.data.orderHasDelta) {
                return;
            }
            console.log("Running upload...");
            this.data.orderHasDelta=false;
            let result=await wx.cloud.callFunction({
                name: "AnyOrderUpdateOrder",
                data: {
                    orderEvent: this.data.eventId,
                    order: this.data.order,
                }
            });
            let returnedError = (result!.result! as AnyObject).error;
            if (returnedError !== "") {
                console.log("Error reported: "+returnedError);
                // refetch
                await this.loadOrderFromServer(this.data.eventId);
            } else {
                console.log("Upload completed without fail");
            }
        }, loadOrderFromServer: async function(event: String) {
            let myOrder=await wx.cloud.callFunction({
                name: "AnyOrderGetOrders",
                data: {
                    orderEvent: event,
                }
            });
            if (myOrder !== undefined) {
                if (myOrder.result !== undefined) {
                    if ((myOrder.result as AnyObject).error !== "") {
                        this.setData({
                            errorMessage: "An error occurred. ("+(myOrder.result as AnyObject).error+")",
                        });
                    } else {
                        this.setData({
                            order: (myOrder.result as AnyObject).data,
                            orderHasDelta: false,
                        });
                        this.computeCosts();
                    }
                } else {
                    this.setData({
                        errorMessage: "An unexpected error occurred (MYORDERRESUNDEF). Check your network connection?",
                    });
                }
            } else {
                this.setData({
                    errorMessage: "An unexpected error occurred (MYORDERUNDEF). Check your network connection?",
                });
            }
        }, onLoad: function() {
            this.data.db = wx.cloud.database();
            const eventChannel = this.getOpenerEventChannel();
            eventChannel.on('userData', (data: UserDataType) => {
                this.setData({
                    userData: data,
                });
            });
            eventChannel.on('eventName', (data: String) => {
                this.setData({
                    eventName: data,
                });
            });
            eventChannel.on('cacheSingleton', (data: CacheSingleton) => {
                this.data.cacheSingleton = data;
            });
            eventChannel.on('eventId', async (data: String) => {
                this.setData({
                    eventId: data,
                });
                allCollectionsData(this.data.db, (data+"Objects").toString()).then((res) => {
                    this.setData({
                        orderObjects:res.data,
                    });
                    this.computeCosts();
                });
                await this.loadOrderFromServer(data);
            })
            setTimeout(
                () => {
                    setInterval(() => {this.uploadOrder()}, 30*1000);
                }, 38*1000
            );
        }
    }
})
