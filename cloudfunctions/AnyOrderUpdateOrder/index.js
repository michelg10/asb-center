// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
    env: 'asc-5gg4yr483fce21b4'
});

let db = cloud.database();

// 云函数入口函数
exports.main = async (event, context) => {
    const wxContext = cloud.getWXContext()
    if (event.orderEvent !== "ChristmasSale2022") {
        return {
            error: "Order event doesn't exist",
        }
    }
    let getAccountIdForUser = await(db.collection("userData")).where({
        userId: wxContext.OPENID,
    }).get();
    if (getAccountIdForUser.data.length===0) {
        return {
            error: "User account does not exist",
        };
    }
    let userId = getAccountIdForUser.data[0]._id
    let getCurrentUserOrder = await(db.collection(event.orderEvent+"Orders")).where({
        orderUser: userId
    }).get();
    if (getCurrentUserOrder.data.length===0) {
        return {
            error: "Error: Order doesn't exist.",
        };
    }
    if (getCurrentUserOrder.data[0].orderStatus === "acc") {
        return {
            error: "Error: Order already accepted.",
        };
    }
    let subordersList=event.order.subordersList;
    if (event.order.orderStatus !== "unsub" && event.order.orderStatus !== "sub") {
        return {
            error: "Invalid orderStatus",
        };
    }
    let userOrder = {
        orderUser: userId,
        orderFrom: event.order.orderFrom,
        orderStatus: event.order.orderStatus,
    }

    let idToObjectMap = new Map();
    idToObjectMap.set("marshmallows", {
        _id: "marshmallows",
        cost: 4,
        name: "Marshmallows (4x)",
    });
    idToObjectMap.set("candycanes", {
        _id: "candycanes",
        cost: 4,
        name: "Candy Canes (2x)",
    });
    idToObjectMap.set("chocolates", {
        _id: "chocolates",
        cost: 7,
        name: "Chocolates (2x)",
    });
    idToObjectMap.set("gingerbreadcookies", {
        _id: "gingerbreadcookies",
        cost: 10,
        name: "Gingerbread Cookies (2x)",
    });
    idToObjectMap.set("teddybear", {
        _id: "teddybear",
        cost: 15,
        name: "Teddy Bear",
    });
    idToObjectMap.set("candle", {
        _id: "candle",
        cost: 20,
        name: "Candle",
    });
    idToObjectMap.set("giftbox", {
        _id: "giftbox",
        cost: 45,
        name: "Gift Box",
    });
    idToObjectMap.set("lovegiftbox", {
        _id: "lovegiftbox",
        cost: 45,
        name: "Couples' Gift Bag",
    });
    idToObjectMap.set("letter", {
        _id: "letter",
        cost: 5,
        name: "Letter",
    });
    // manually set this! this is to accelerate the cloud function. 
    // recompute everything that the user has computed and then update the order
    let newSubordersList = [];
    let totalCost = 0;
    for (let i=0;i<subordersList.length;i++) {
        if (subordersList[i].recipientType !== "student" && subordersList[i].recipientType !== "teacher") {
            return {
                error: "Invalid recipientType for suborder "+i.toString(),
            };
        }
        if (subordersList[i].objects.length===0) {
            return {
                error: "Empty suborders list for suborder "+i.toString(),
            };
        }
        let newSuborder = {
            recipientType: subordersList[i].recipientType,
        }
        if (newSuborder.recipientType === "student") {
            newSuborder.studentRecipientId = subordersList[i].studentRecipientId;
            newSuborder.computedStudentRecipientName = subordersList[i].computedStudentRecipientName;
        }
        if (newSuborder.recipientType === "teacher") {
            newSuborder.teacherRecipientName = subordersList[i].teacherRecipientName;
        }
        let objects = [];
        let suborderTotalCost = 0;
        for (let j=0;j<subordersList[i].objects.length;j++) {
            let individualObjectId = subordersList[i].objects[j].objectId;
            let individualObjectQuantity = parseInt(subordersList[i].objects[j].quantity);
            if (idToObjectMap.get(individualObjectId) === undefined) {
                return {
                    error: "Object not recognized: "+individualObjectId,
                };
            }
            if (individualObjectQuantity<=0 || individualObjectQuantity === NaN) {
                return {
                    error: "Object quantity invalid for objectt at position: "+i+","+j,
                };
            }
            let object = idToObjectMap.get(individualObjectId);
            objects.push({
                objectId: object._id,
                computedObjectName: object.name,
                computedSingleObjectCost: object.cost,
                quantity: individualObjectQuantity,
            });
            suborderTotalCost+=individualObjectQuantity*object.cost;
        }
        newSuborder.objects = objects;
        newSuborder.computedTotalCost = suborderTotalCost;
        newSubordersList.push(newSuborder);
        totalCost+=suborderTotalCost;
    }
    userOrder.subordersList = newSubordersList;
    userOrder.computedTotalCost = totalCost;
    // push an update to the database now
    await db.collection(event.orderEvent+"Orders").doc(getCurrentUserOrder.data[0]._id).set({
        data: userOrder,
    });
    return {
        error: "",
    };
}