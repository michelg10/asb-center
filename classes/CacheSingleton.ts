import allCollectionsData from "../utils/allCollectionsData";
import { Student } from "./student";

export class CacheSingleton {
    #studentData: Student[] | undefined
    #db: DB.Database
    constructor(db: DB.Database) {
        this.#db = db;
        this.#studentData = undefined
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
}