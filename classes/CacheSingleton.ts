import allCollectionsData from "../utils/allCollectionsData";
import { Student } from "./student";
import { suggestionLog } from "./suggestionLog";
import { anyEventIdeaLog } from "./anyEventIdeaLog";
let instance: CacheSingleton | null = null;

class CacheSingleton {
    #studentData: Student[] | undefined
    #suggestionLogs: suggestionLog[] | undefined
    #anyEventIdeaLogs: anyEventIdeaLog[] | undefined
    #imageUrls: string[] | undefined
    #db!: DB.Database
    #userOpenId: string | undefined
    private constructor(db: DB.Database) {
        this.#db = db;
        this.#studentData = undefined;
    }
    static initialize(db: DB.Database): CacheSingleton {
        if (instance === null) {
          instance = new CacheSingleton(db);
        }
        return instance!;
    }
    static getInstance(): CacheSingleton {
        if (instance === null) {
          throw new Error("CacheSingleton not initialized");
        }
        return instance!;
    }

    async forceGetStudentData() {
        if (this.#studentData !== undefined) {
            return;
        }
        this.#studentData = new Array<Student>()
        let studentData = await allCollectionsData(this.#db, "studentData");
        for (let i=0;i<studentData.data.length;i++) {
            this.#studentData.push(new Student(studentData.data[i]._id as string, studentData.data[i].nickname, studentData.data[i].uniqueNickname, studentData.data[i].englishName, studentData.data[i].chineseName, studentData.data[i].grade, studentData.data[i].class, studentData.data[i].pseudoId));
        }
    }

    async getStudentData(): Promise<Student[]> {
        await this.forceGetStudentData();
        return this.#studentData!;
    }

    async getTeacherImages(totalImages: number, rerenderCallback: () => any) {
        if (this.#imageUrls !== undefined) {
            rerenderCallback();
            return;
        }
        this.#imageUrls = Array(totalImages);
        for (let i=1;i<=totalImages;i++) {
            wx.cloud.downloadFile({
                fileID: `cloud://asb-center-7gixak2a33f2f3e5.6173-asb-center-7gixak2a33f2f3e5-1307575779/BabyPictures/${i}.jpg`
            }).then((res) => {
                this.#imageUrls![i-1] = res.tempFilePath;
                rerenderCallback();
            })
        }
    }

    fetchImageUrls(): string[] {
        return this.#imageUrls!;
    }

    async fetchUserOpenId(): Promise<string> {
      if (this.#userOpenId !== undefined) {
        return this.#userOpenId;
      }
      let res: string = ((await wx.cloud.callFunction({
        name: "getUserOpenId",
      })).result as any).openid;
      this.#userOpenId = res;
      return this.#userOpenId;
    }

    async getSuggestionLogs() {
      this.#suggestionLogs = new Array<suggestionLog>();
      let suggestionLogs = await allCollectionsData(this.#db, "SuggestionsBox");
      for (let i=0;i<suggestionLogs.data.length;i++) {
          let name = "Anonymous";
          let contactInformation = "undefined";
          if (suggestionLogs.data[i].name !== "") {
            name = suggestionLogs.data[i].name as string;
          }
          if (suggestionLogs.data[i].contactInformation !== "") {
            contactInformation = suggestionLogs.data[i].contactInformation as string;
          }
          this.#suggestionLogs.push(new suggestionLog(suggestionLogs.data[i]._id as string, contactInformation, suggestionLogs.data[i].grade as number, name, suggestionLogs.data[i].suggestion as string, suggestionLogs.data[i].resolved as boolean, suggestionLogs.data[i].timestamp as number));
      }
    }

    async fetchSuggestionLogs(): Promise<suggestionLog[]> {
      if (this.#suggestionLogs !== undefined) {
        return this.#suggestionLogs!;
      } else {
        await this.getSuggestionLogs();
        return this.#suggestionLogs!;
      }
    }

    async getAnyEventIdeaLogs() {
      this.#anyEventIdeaLogs = new Array<anyEventIdeaLog>();
      let anyEventIdeaLogs = await allCollectionsData(this.#db, "PromIdeas");
      for (let i=0;i<anyEventIdeaLogs.data.length;i++) {
          let name = "Anonymous";
          let contactInformation = "undefined";
          if (anyEventIdeaLogs.data[i].name !== "") {
            name = anyEventIdeaLogs.data[i].name as string;
          }
          if (anyEventIdeaLogs.data[i].contactInformation !== "") {
            contactInformation = anyEventIdeaLogs.data[i].contactInformation as string;
          }
          this.#anyEventIdeaLogs.push(new anyEventIdeaLog(anyEventIdeaLogs.data[i]._id as string, contactInformation, name, anyEventIdeaLogs.data[i].read as boolean, anyEventIdeaLogs.data[i].suggestion as string, anyEventIdeaLogs.data[i].timestamp as number, anyEventIdeaLogs.data[i].type as string));
      }
    }

    async fetchAnyEventIdeaLogs(): Promise<anyEventIdeaLog[]> {
      if (this.#anyEventIdeaLogs !== undefined) {
        return this.#anyEventIdeaLogs!;;
      } else {
        await this.getAnyEventIdeaLogs();
        return this.#anyEventIdeaLogs!;
      }
    }
}

export default CacheSingleton;