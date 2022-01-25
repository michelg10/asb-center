// pages/AnyOrderSubOrder/AnyOrderSubOrder.ts

import { ObjectAndQuantity, OrderObject, Suborder } from "../AnyOrderMainPage/AnyOrderMainPage"
import { CacheSingleton } from "../MainMenu/MainMenu"

type ComponentDataInterface = {
    eventId: String,
    suborder: Suborder,
    suborderIndex: Number | null,
    orderObjects: OrderObject[],
    cacheSingleton: CacheSingleton,
    suborderTotalItems: Number;
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
        computeCosts: function() {
            let totalCost = 0;
            let totalQuantity = 0;
            for (let i=0;i<this.data.suborder.objects.length;i++) {
                totalCost+=this.data.suborder.objects[i].quantity.valueOf()*this.data.suborder.objects[i].computedSingleObjectCost.valueOf();
                totalQuantity+=this.data.suborder.objects[i].quantity.valueOf();
            }
            let newSuborder = this.data.suborder;
            newSuborder.computedTotalCost = totalCost;
            this.setData({
                suborder: newSuborder,
                suborderTotalItems: totalQuantity,
            })
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
                this.setData(newData);
                this.computeCosts();
            })
        },
        teacherNameInputChanged: function(x: any) {
            let newSuborder = this.data.suborder;
            newSuborder.teacherRecipientName=x.detail.value;
            this.setData({
                suborder: newSuborder,
            });
        },
        setRecipient: function(x: any) {
            let newRecipientType = x.currentTarget.dataset.id;
            let newSuborder = this.data.suborder;
            newSuborder.recipientType=newRecipientType;
            this.setData({
                suborder: newSuborder,
            });
        }
    }
})
