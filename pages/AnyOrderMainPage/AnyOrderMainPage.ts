// pages/AnyOrderMainPage/AnyOrderMainPage.ts

import allCollectionsData from "../../utils/allCollectionsData";
import { UserDataType } from "../../utils/common";

type OrderObject = {
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
    orderObjects: [OrderObject]
}
type StudentOrderInfo = {
    name: String,
    class: String,
}
type ObjectAndQuantity = {
    objectId: String,
    computedObjectName: String,
    computedSingleObjectCost: Number,
    quantity: Number,
}
type Suborder = {
    recipientType: "student" | "teacher",
    studentRecipientId: String,
    computedStudentRecipientName: String,
    teacherRecipientName: String,
    objects: [ObjectAndQuantity],
    computedTotalCost: Number
}
type Order = {
    orderUser: String,
    orderFrom: StudentOrderInfo | null,
    subordersList: [Suborder],
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
        nameBind: function(x: any) {
            let newOrder = this.data.order;
            if (newOrder.orderFrom !== null) {
                newOrder.orderFrom!.name=x.detail.value;
            }
            this.setData({
                order: newOrder,
            });
        },
        submitButtonClicked: function() {
            let newOrder = this.data.order;
            newOrder.orderStatus = "sub";
            this.setData({
                order: newOrder,
            });
        }, classBind: function(x: any) {
            let newOrder = this.data.order;
            if (newOrder.orderFrom !== null) {
                newOrder.orderFrom!.class=x.detail.value;
            }
            this.setData({
                order: newOrder,
            });
        },
        setAnonymity: function(x: any) {
            if (this.data.order.orderStatus !== "unsub") {
                return;
            }
            let newOrder = this.data.order;
            if (x.currentTarget.dataset.id === "named") {
                newOrder.orderFrom = {
                    name: "",
                    class: "",
                };
                this.setData({
                    order: newOrder,
                });
            } else if (x.currentTarget.dataset.id === "anonymous") {
                newOrder.orderFrom = null;
                this.setData({
                    order: newOrder,
                });
            }
        }, 
        cancelButtonPressed: function() {
            let newOrder = this.data.order;
            newOrder.orderStatus = "unsub";
            this.setData({
                order: newOrder,
            });
        }, uploadOrder: function() {

        }, onLoad: function() {
            this.data.db = wx.cloud.database();
            const eventChannel = this.getOpenerEventChannel();
            eventChannel.on('userData', (data: UserDataType) => {
                this.setData({
                    userData: data,
                });
            })
            eventChannel.on('eventName', (data: String) => {
                this.setData({
                    eventName: data,
                });
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
                let myOrder=await wx.cloud.callFunction({
                    name: "AnyOrderGetOrders",
                    data: {
                        orderEvent: data,
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
                            console.log(this.data.order);
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
            });
        }
    }
})
