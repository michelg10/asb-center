export class suggestionLog {
  logId: string;
  contactInformation: string;
  grade: number;
  name: string;
  suggestion: string;
  resolved: boolean;
  timestamp: number;
  constructor(logId: string, contactInformation: string, grade: number, name: string, suggestion: string, resolved: boolean, timestamp: number) {
    this.logId = logId;
    this.contactInformation = contactInformation;
    this.grade = grade;
    this.name = name;
    this.suggestion = suggestion;
    this.resolved = resolved;
    this.timestamp = timestamp;
  }
}