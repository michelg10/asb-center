import { CacheSingleton } from "../../classes/CacheSingleton";

// pages/GuessTheBaby/GuessTheBaby.ts

type QuestionDisplayInformation = {
    id: number,
    imageDisplayUrl: string,
    response: string | undefined,
};

interface ComponentDataInterface {
    db: DB.Database
    cacheSingleton: CacheSingleton,
    eventDescription: string,
    babyQuestionCount: number,
    response: number[], // stores user responses
    teacherNames: string[],
    
    currentActiveDropdown: number,
    userId: string,
    questionDisplayInformation: QuestionDisplayInformation[],
    isActive: boolean,
    serverFetchedChoices: number[],
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
        buildDisplayInformation: function() {
            let imageUrls = this.data.cacheSingleton.fetchImageUrls();
            let newQuestionDisplayInformation = this.data.questionDisplayInformation;
            if (imageUrls !== undefined) {
                for (let i=0;i<this.data.babyQuestionCount;i++) {
                    newQuestionDisplayInformation[i].imageDisplayUrl = imageUrls[i];
                }
            }
            if (this.data.response !== undefined && this.data.teacherNames !== undefined) {
                for (let i=0;i<this.data.babyQuestionCount;i++) {
                    newQuestionDisplayInformation[i].response = this.data.teacherNames[this.data.response[i]];
                }
            }
            this.setData({
                questionDisplayInformation: newQuestionDisplayInformation,
            });
        },
        responseTapped: function(x: any) {
            if (this.data.isActive === false) {
                return;
            }
            console.log("Response tapped");
            let index = x.currentTarget.dataset.index;
            this.setData({
                currentActiveDropdown: index,
            });
        },
        nameOptionTapped: function(x: any) {
            console.log("Name option tapped");
            let index = x.currentTarget.dataset.index;
            let newData = this.data.response;
            newData[this.data.currentActiveDropdown] = index;
            this.setData({
                currentActiveDropdown: -1,
                response: newData,
            });
            this.buildDisplayInformation();
            this.uploadData();
        },
        uploadData: function() {
            wx.cloud.callFunction({
                name: "GuessTheBabySubmit",
                data: {
                    userResponses: this.data.response,
                }
            });
        },
        dismissDropdown: function() {
            console.log("Dismiss dropdown");
            this.setData({
                currentActiveDropdown: -1,
            });
        },
        fetchNames: function() {
            this.data.db.collection("BabyTeachersInfo").doc("teacherNames").get().then((res) => {
                let teacherNames = Array<string>(this.data.babyQuestionCount);
                let names = res.data.value;
                for (let i=0;i<this.data.babyQuestionCount;i++) {
                    teacherNames[i] = names[i];
                }
                this.setData({
                    teacherNames: teacherNames,
                });
                this.buildDisplayInformation();
            })
        },
        mergeServerData: function() {
            console.log("MERGE");
            console.log(this.data.response);
            console.log(this.data.serverFetchedChoices);
            if (this.data.response === undefined || this.data.serverFetchedChoices === undefined) {
                return;
            }
            let newData = this.data.response;
            for (let i=0;i<newData.length;i++) {
                if (this.data.serverFetchedChoices[i] !== null && this.data.serverFetchedChoices[i] !== undefined) {
                    newData[i] = this.data.serverFetchedChoices[i];
                }
            }
            this.data.response = newData;
            this.buildDisplayInformation();
        },
        onLoad: function() {
            const eventChannel = this.getOpenerEventChannel();
            this.data.db = wx.cloud.database();
            this.setData({
                currentActiveDropdown: -1,
            });
            this.data.db.collection("BabyTeachersInfo").doc("description").get().then((res) => {
                this.setData({
                    eventDescription: res.data.value,
                });
            })
            this.data.db.collection("BabyTeachersInfo").doc("limitTime").get().then((res) => {
                let closingTime = res.data.value;
                if (Date.now()/1000.0<=closingTime) {
                    this.setData({
                        isActive: true,
                    });
                } else {
                    this.setData({
                        isActive: false,
                    });
                }
            })
            eventChannel.on("userId", (data: any) => {
                this.data.userId = data;
                this.data.db.collection("BabyTeachersData").where({
                    correspondingOpenId: "{openid}"
                }).get().then((res) => {
                    if (res.data.length === 1) {
                        this.data.serverFetchedChoices = res.data[0].choices;
                        this.mergeServerData();
                    }
                })
            })
            eventChannel.on('cacheSingleton', async (data: any) => {
                this.data.cacheSingleton = data;
                // fetch count
                let totalSize = await this.data.db.collection("BabyTeachersInfo").doc("size").get();
                this.data.questionDisplayInformation = Array<QuestionDisplayInformation>(totalSize.data.value as number);
                this.data.response = Array<number>(totalSize.data.value as number);
                this.mergeServerData();
                this.setData({
                    babyQuestionCount: totalSize.data.value,
                });
                for (let i=0;i<this.data.babyQuestionCount;i++) {
                    this.data.questionDisplayInformation[i] = {
                        id: i,
                        imageDisplayUrl: "",
                        response: undefined
                    };
                }
                this.fetchNames();
                this.buildDisplayInformation();
                this.data.cacheSingleton.getTeacherImages(this.data.babyQuestionCount, () => {
                    this.buildDisplayInformation();
                })
            })
        }
    }
})
