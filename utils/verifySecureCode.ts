import { secureCodesListItem } from "../pages/SportsMeet/SportsMeetFunctions";
import { get256To16Map } from "./binaryMapType";
import { sha256 } from "./sha256";

export function verifySecureCode(secureCode: number[], currentTime: number, codeList: secureCodesListItem[]): string | null {
  let secureCodeOriginal = "";
  let base256to16map = get256To16Map();
  for (let i=0;i<secureCode.length;i++) {
    secureCodeOriginal+=base256to16map[secureCode[i]];
  }
  let acceptableTimes = [Math.floor(currentTime/7), Math.floor(currentTime/7)-1];
  for (let i=0;i<acceptableTimes.length;i++) {
    for (let j=0;j<codeList.length;j++) {
      let accessCodeContents=codeList[j].code+acceptableTimes[i].toString();
      accessCodeContents=sha256(accessCodeContents)!;
      if (accessCodeContents === secureCodeOriginal) {
        return codeList[j].id;
      }
    }
  }
  return null;
}