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
        fetchNames: function() {
            this.data.teacherNames = Array<string>(this.data.babyQuestionCount);
            this.data.db.collection("BabyTeachersInfo").doc("teacherNames").get().then((res) => {
                let names = res.data.value;
                for (let i=0;i<this.data.babyQuestionCount;i++) {
                    this.data.teacherNames[i] = names[i];
                }
            })
        },
        onLoad: function() {
            const eventChannel = this.getOpenerEventChannel();
            this.data.db = wx.cloud.database();
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
                this.data.babyQuestionCount = totalSize.data.value;
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
