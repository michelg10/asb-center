"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DisplayRow = void 0;
class DisplayRow {
    constructor(title, timeLeft, canJump, jumpTo, previewData) {
        this.title = title;
        this.timeLeft = timeLeft;
        this.canJump = canJump;
        this.jumpTo = jumpTo;
        this.previewData = previewData; // previewData - JavaScript object {previewMode: previewID:}
    }
}
exports.DisplayRow = DisplayRow;
