import { getUnixTime } from "../utils/util";

export default class Event {
  constructor(id, name, preview, eventVisibleDate, displayEventBegin, displayEventEnd, accessibleEventBegin, accessibleEventEnd, menuEventBegin, menuEventEnd) {
    this.id=id;
    this.name=name;
    this.eventVisibleDate=eventVisibleDate
    if (preview.type !== "noPreview" && preview.type !== "secureCodePreview") {
      console.log(`Preview type ${preview.type} not supported`);
      preview = {type:"noPreview"};
    }
    if (preview.type==="secureCodePreview") {
      let previewParseFailure = false;
      if (preview.title === undefined) {
        console.log(`Required field of secureCodePreview title is missing`);
        previewParseFailure=true;
      }
      if (preview.caption === undefined) {
        console.log(`Required field of secureCodePreview caption is missing`);
        previewParseFailure=true;
      }
      if (previewParseFailure) {
        preview = {type:"noPreview"};
      }
    }
    this.preview=preview;
    this.displayEventBegin=displayEventBegin;
    this.displayEventEnd=displayEventEnd;
    this.accessibleEventBegin=accessibleEventBegin;
    this.accessibleEventEnd=accessibleEventEnd;
    this.menuEventBegin=menuEventBegin;
    this.menuEventEnd=menuEventEnd;
  }
  
  eventAccessible() {
    let currentTime=getUnixTime();
    return currentTime>=this.accessibleEventBegin && currentTime<=this.accessibleEventEnd;
  }
}