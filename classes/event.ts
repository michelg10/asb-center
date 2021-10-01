import { getUnixTime } from "../utils/util";
export class SecureCodePreview {
  title: string;
  caption: string;
  constructor (title: string, caption: string) {
    this.title=title;
    this.caption=caption;
  }
};
export type AnyPreviewType = null | SecureCodePreview;
export class Event {
  id: string;
  name: string;
  eventVisibleDate: number;
  preview: AnyPreviewType;
  displayEventBegin: number;
  displayEventEnd: number;
  accessibleEventBegin: number;
  accessibleEventEnd: number;
  menuEventBegin: number;
  menuEventEnd: number;
  grades: null|[number];
  restrictAccess: boolean;
  constructor(id: string, name: string, preview: AnyPreviewType, eventVisibleDate: number, displayEventBegin: number, displayEventEnd: number, accessibleEventBegin: number, accessibleEventEnd: number, menuEventBegin: number, menuEventEnd: number, grades: [number], restrictAccess: boolean) {
    this.id=id;
    this.name=name;
    this.eventVisibleDate=eventVisibleDate
    this.preview=preview;
    this.displayEventBegin=displayEventBegin;
    this.displayEventEnd=displayEventEnd;
    this.accessibleEventBegin=accessibleEventBegin;
    this.accessibleEventEnd=accessibleEventEnd;
    this.menuEventBegin=menuEventBegin;
    this.menuEventEnd=menuEventEnd;
    this.grades=grades;
    this.restrictAccess=restrictAccess;
  }
  
  eventAccessible() {
    let currentTime=getUnixTime();
    return currentTime>=this.accessibleEventBegin && currentTime<=this.accessibleEventEnd;
  }
}