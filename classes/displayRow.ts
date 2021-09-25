export interface SecureCodePreviewData {
  previewMode: "secureCodePreview";
  previewPort: string;
  title: string;
  subtitle: string;
}
export class DisplayRow {
  title: string;
  timeLeft: string;
  canJump: boolean;
  jumpTo: string;
  previewData: SecureCodePreviewData | null;
  constructor(title: string, timeLeft: string, canJump: boolean, jumpTo: string, previewData: SecureCodePreviewData | null) {
    this.title=title;
    this.timeLeft=timeLeft;
    this.canJump=canJump;
    this.jumpTo=jumpTo;
    this.previewData=previewData; // previewData - JavaScript object {previewMode: previewID:}
  }
}