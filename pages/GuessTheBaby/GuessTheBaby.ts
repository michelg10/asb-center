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
            this.setData({
                questionDisplayInformation: newQuestionDisplayInformation,
            });
        },
        responseTapped: function(x: any) {
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
            })
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
                let closingTime = res.data.data;
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
            eventChannel.on('cacheSingleton', async (data: any) => {
                this.data.cacheSingleton = data;
                // fetch count
                let totalSize = await this.data.db.collection("BabyTeachersInfo").doc("size").get();
                this.data.questionDisplayInformation = Array<QuestionDisplayInformation>(totalSize.data.value as number);
                this.data.response = Array<number>(totalSize.data.value as number);
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
