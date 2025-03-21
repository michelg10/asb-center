export class anyEventIdeaLog {
  logId: string;
  contactInformation: string;
  name: string;
  read: boolean;
  suggestion: string;
  timestamp: number;
  type: string;
  constructor(logId: string, contactInformation: string, name: string, read: boolean, suggestion: string, timestamp: number, type: string) {
    this.logId = logId;
    this.contactInformation = contactInformation;
    this.name = name;
    this.read = read;
    this.suggestion = suggestion;
    this.timestamp = timestamp;
    this.type = type;
  }
}