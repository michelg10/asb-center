import { generateQrCode } from "./generateQrCode";
import { sha256 } from "./sha256";
import { getUnixTime } from "./util";

function mapBase16ToNumber(x: string) {
  if (x.charCodeAt(0)>=97&&x.charCodeAt(0)<=122) {
    return x.charCodeAt(0)-97+10;
  }
  return x.charCodeAt(0)-48;
}
export function generatePreviewCode(codeType: "secureCode"|"userCode", secureCodeString: string, eventName: string|null) {
  let previewTimePeriod=Math.floor(getUnixTime()/3);
  let accessCodeContents=secureCodeString+previewTimePeriod.toString();
  accessCodeContents=sha256(accessCodeContents)!;
  let base256Data:number[]=[];
  for (let i=0;i<accessCodeContents.length;i+=2) {
    base256Data.push((mapBase16ToNumber(accessCodeContents.charAt(i))<<4)+mapBase16ToNumber(accessCodeContents.charAt(i+1)));
  }
  return generateQrCode(codeType, eventName, base256Data);
}