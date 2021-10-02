export class Student {
  id: string;
  nickname: string;
  englishName: string;
  chineseName: string;
  studentGrade: number;
  studentClass: number;
  constructor(id: string, nickname: string, englishName: string, chineseName: string, studentGrade: number, studentClass:number) {
    this.id = id;
    this.nickname = nickname;
    this.englishName = englishName;
    this.chineseName = chineseName;
    this.studentGrade = studentGrade;
    this.studentClass = studentClass;
  }
}