export class Student {
  id: string;
  nickname: string;
  englishName: string;
  chineseName: string;
  studentGrade: number;
  studentClass: number;
  pseudoId: string;
  constructor(id: string, nickname: string, englishName: string, chineseName: string, studentGrade: number, studentClass:number, pseudoId: string) {
    this.id = id;
    this.nickname = nickname;
    this.englishName = englishName;
    this.chineseName = chineseName;
    this.studentGrade = studentGrade;
    this.studentClass = studentClass;
    this.pseudoId = pseudoId;
  }
}