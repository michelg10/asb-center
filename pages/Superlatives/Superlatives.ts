import { Student } from "../../classes/student";
import allCollectionsData from "../../utils/allCollectionsData";
import { fillCacheSingleton } from "../../utils/fillCacheSingleton";
import { CacheSingleton } from "../MainMenu/MainMenu"

// pages/Superlatives/Superlatives.ts
type SuperlativeQuestion = {
    id: string,
    question: string
}

type QuestionResponse = {
    question: string,
    response: string
}

type QuestionDisplayInformation = {
    question: string,
    name: string | undefined
};

type ComponentDataInterface = {
    db: DB.Database,
    cacheSingleton: CacheSingleton,
    eventDescription: string,
    superlativeQuestions: SuperlativeQuestion[]
    userResponses: Map<string,string>
    studentMap: Map<string, Student>
    userId: string
    displayInformation: QuestionDisplayInformation[]
}

// store the responses with the questions so that they can be matched to each other

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
        buildStudentMap: function() {
            this.data.cacheSingleton.studentData!.forEach(element => {
                this.data.studentMap.set(element.id, element);
            });
        },
        getResponseForQuestion(id: string): string | undefined {
            return this.data.userResponses.get(id);
        },
        getDisplayNameForQuestion(id: string): string | undefined {
            let nameId = this.getResponseForQuestion(id);
            if (nameId === undefined) {
                return undefined;
            }
            if (this.data.studentMap === undefined) {
                return "";
            }
            let student = this.data.studentMap.get(nameId)!;
            return student.uniqueNickname;
        },
        buildDisplayInformation: function() {
            if (this.data.superlativeQuestions === undefined) {
                return;
            }
            let newDisplayInformation: QuestionDisplayInformation[] = [];
            this.data.superlativeQuestions.forEach(element => {
                newDisplayInformation.push({
                    question: element.question,
                    name: this.getDisplayNameForQuestion(element.id),
                });
            });
            this.setData({
                displayInformation: newDisplayInformation
            });
        },
        onLoad: function() {
            const eventChannel = this.getOpenerEventChannel();
            this.data.db = wx.cloud.database();
            this.data.studentMap = new Map<string, Student>();
            eventChannel.on('cacheSingleton', async (data: any) => {
                this.data.cacheSingleton = data;
                await fillCacheSingleton(this.data.db, data);
                this.buildStudentMap();
                this.buildDisplayInformation();
            });
            eventChannel.on('userId', (data: any) => {
                this.data.userId = data;
                this.data.db.collection("SuperlativesData").where({
                    correspondingOpenId: "{openid}"
                }).get().then((res) => {
                    console.log(res.data);
                    let userData: QuestionResponse[] = res.data[0].choices as any;
                    let userResponses = new Map<string, string>();
                    userData.forEach(element => {
                        userResponses.set(element.question, element.response);
                    });
                    this.data.userResponses = userResponses;
                    this.buildDisplayInformation();
                })
            });
            this.data.db.collection("SuperlativesInfo").doc("introduction").get().then((res) => {
                this.setData({
                    eventDescription: res.data.value,
                });
            });
            this.data.db.collection("SuperlativesInfo").doc("questions").get().then((res) => {
                this.data.superlativeQuestions = res.data.value;
                this.buildDisplayInformation();
            });
        }
    }
})
