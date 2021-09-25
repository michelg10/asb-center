"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Event = exports.SecureCodePreview = void 0;
const util_1 = require("../utils/util");
class SecureCodePreview {
    constructor(title, caption) {
        this.title = title;
        this.caption = caption;
    }
}
exports.SecureCodePreview = SecureCodePreview;
;
class Event {
    constructor(id, name, preview, eventVisibleDate, displayEventBegin, displayEventEnd, accessibleEventBegin, accessibleEventEnd, menuEventBegin, menuEventEnd) {
        this.id = id;
        this.name = name;
        this.eventVisibleDate = eventVisibleDate;
        this.preview = preview;
        this.displayEventBegin = displayEventBegin;
        this.displayEventEnd = displayEventEnd;
        this.accessibleEventBegin = accessibleEventBegin;
        this.accessibleEventEnd = accessibleEventEnd;
        this.menuEventBegin = menuEventBegin;
        this.menuEventEnd = menuEventEnd;
    }
    eventAccessible() {
        let currentTime = util_1.getUnixTime();
        return currentTime >= this.accessibleEventBegin && currentTime <= this.accessibleEventEnd;
    }
}
exports.Event = Event;
