// pages/AnyOrderSubOrder/AnyOrderSubOrder.ts

import { CacheSingleton } from "../../classes/CacheSingleton";
import { Student } from "../../classes/student";
import { ObjectAndQuantity, OrderObject, Suborder } from "../AnyOrderMainPage/AnyOrderMainPage"

type ComponentDataInterface = {
    eventId: String,
    suborder: Suborder,
    suborderIndex: Number | null,
    orderObjects: OrderObject[],
    cacheSingleton: CacheSingleton,
    suborderTotalItems: Number;
    warningText: string|null,
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
    data: { } as ComponentDataInterface,

    /**
     * Component methods
     */
    methods: {
        nudgeChangeTapped: function(x: any) {
            let changeBy:number = x.currentTarget.dataset.change;
            let index:number = x.currentTarget.dataset.index;
            let newSuborder = this.data.suborder;
            newSuborder.objects[index].quantity=Math.max(newSuborder.objects[index].quantity.valueOf()+changeBy, 0);
            this.setData({
                suborder: newSuborder,
            });
            this.recompute();
        },
        recompute: function() {
            let totalCost = 0;
            let totalQuantity = 0;
            for (let i=0;i<this.data.suborder.objects.length;i++) {
                totalCost+=this.data.suborder.objects[i].quantity.valueOf()*this.data.suborder.objects[i].computedSingleObjectCost.valueOf();
                totalQuantity+=this.data.suborder.objects[i].quantity.valueOf();
            }
            let newSuborder = this.data.suborder;
            newSuborder.computedTotalCost = totalCost;
            let newWarning = null;
            if (newSuborder.recipientType === "student" && newSuborder.studentRecipientId === null) {
                newWarning = "Select a student";
            }
            if (newSuborder.recipientType === "teacher" && newSuborder.teacherRecipientName === "") {
                newWarning = "Type a teacher's name";
            }
            if (totalQuantity === 0) {
                if (newWarning === null) {
                    newWarning = "Order something";
                } else {
                    newWarning += " and order something"; 
                }
            }
            if (newWarning !== null) {
                newWarning+=" before adding your order";
            }
            this.setData({
                suborder: newSuborder,
                suborderTotalItems: totalQuantity,
                warningText: newWarning,
            });
        },
        onLoad: function() {
            const eventChannel = this.getOpenerEventChannel();
            eventChannel.on('data', (data: any) => {
                let newData = data;
                let orderObjects: OrderObject[] = newData.orderObjects;
                // expand the suborder's objects to match the order objects
                let orderObjectIdToIndexMap = new Map<string, number>();
                for (let i=0;i<orderObjects.length;i++) {
                    orderObjectIdToIndexMap.set(orderObjects[i]._id.valueOf(), i);
                }
                let newSuborderObjects: ObjectAndQuantity[]=[];
                for (let i=0;i<data.orderObjects.length;i++) {
                    newSuborderObjects.push({
                        objectId: orderObjects[i]._id,
                        computedObjectName: orderObjects[i].name,
                        computedSingleObjectCost: orderObjects[i].cost,
                        quantity: 0,
                    });
                }
                let currentObjectsAndQuantityArray: ObjectAndQuantity[] = newData.suborder.objects;
                for (let i=0;i<currentObjectsAndQuantityArray.length;i++) {
                    newSuborderObjects[orderObjectIdToIndexMap.get(currentObjectsAndQuantityArray[i].objectId.valueOf())!.valueOf()].quantity = currentObjectsAndQuantityArray[i].quantity;
                }
                newData.suborder.objects = newSuborderObjects;
                newData.warningText = null;
                this.setData(newData);
                this.recompute();
            })
        },
        teacherNameInputChanged: function(x: any) {
            let newSuborder = this.data.suborder;
            newSuborder.teacherRecipientName=x.detail.value;
            this.setData({
                suborder: newSuborder,
            });
            this.recompute();
        },
        setRecipient: function(x: any) {
            let newRecipientType = x.currentTarget.dataset.id;
            let newSuborder = this.data.suborder;
            newSuborder.recipientType=newRecipientType;
            this.setData({
                suborder: newSuborder,
            });
            this.recompute();
        },
        studentChooseTapped: function() {
            wx.navigateTo({
                url: "/pages/StudentChoose/StudentChoose",
                success: (res) => {
                    res.eventChannel.emit("cacheSingleton", this.data.cacheSingleton);
                    res.eventChannel.emit("limitGradeTo", [11,12]);
                    res.eventChannel.on("selectedStudent", (res) => {
                        let student: Student = res;
                        let newSuborder = this.data.suborder;
                        newSuborder.computedStudentRecipientName = student.uniqueNickname;
                        newSuborder.studentRecipientId = student.id;
                        this.setData({
                            suborder: newSuborder,
                        });
                        this.recompute();
                    })
                }
            })
        },
        addOrEditOrderTapped: function() {
            this.recompute();
            if (this.data.warningText !== null) {
                return;
            }
            // cleanup suborder
            let cleanedSuborder = this.data.suborder;
            let newObjects: ObjectAndQuantity[] = [];
            for (let i=0;i<cleanedSuborder.objects.length;i++) {
                if (cleanedSuborder.objects[i].quantity > 0) {
                    newObjects.push(cleanedSuborder.objects[i]);
                }
            }
            cleanedSuborder.objects=newObjects;
            const eventChannel = this.getOpenerEventChannel();
            eventChannel.emit("suborderPassBack", {
                index: this.data.suborderIndex,
                suborder: cleanedSuborder,
            });
            wx.navigateBack();
        }
    }
})
