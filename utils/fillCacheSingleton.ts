import { Student } from "../classes/student";
import { CacheSingleton } from "../pages/MainMenu/MainMenu";
import allCollectionsData from "./allCollectionsData";

export async function fillCacheSingleton(db: DB.Database, cacheSingleton: CacheSingleton) {
    if (cacheSingleton.studentData !== undefined) {
        return
    }

    let studentData = await allCollectionsData(db, "studentData");
    let tmpStudentData=[];
    for (let i=0;i<studentData.data.length;i++) {
        tmpStudentData.push(new Student(studentData.data[i]._id as string, studentData.data[i].nickname, studentData.data[i].uniqueNickname, studentData.data[i].englishName, studentData.data[i].chineseName, studentData.data[i].grade, studentData.data[i].class, studentData.data[i].pseudoId));
    }
    cacheSingleton.studentData = tmpStudentData;
}