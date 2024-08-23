import allCollectionsData from "../utils/allCollectionsData";
import { Student } from "./student";
let instance: CacheSingleton | null = null;

class CacheSingleton {
    #studentData: Student[] | undefined
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
}

export default CacheSingleton;