export default class DisplayRow {
  constructor(title, timeLeft, canJump, jumpTo, previewData) {
    this.title=title;
    this.timeLeft=timeLeft;
    this.canJump=canJump;
    this.jumpTo=jumpTo;
    this.previewData=previewData; // previewData - JavaScript object {previewMode: previewID:}
  }
}