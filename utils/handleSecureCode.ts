import { getSecureCodesReturnType } from "./SportsMeetFunctions";
import { get256ToBinaryMap, get64ToBinaryMap } from "./binaryMapType";
import { getUnixTime } from "./util";
import { verifySecureCode } from "./verifySecureCode";

function reportCodeScanError(error: string) {
  wx.navigateTo({
    url: "/pages/ScanFailure/ScanFailure",
    success: (res) => {
      res.eventChannel.emit('errorDetail', error);
    }
  });
}
export async function handleSecureCode(obj: any, x: string) {
  // parse it
  if (x.length<4) {
    // not a valid ASB Center code
    reportCodeScanError("Not a valid ASB Center Code");
    return "error";
  }
  if (x.substr(0,4)!=="asC;") {
    // does not have the appropriate format header
    reportCodeScanError("Not a valid ASB Center Code");
    return "error";
  }
  x=x.substr(4);
  if (x.indexOf(';')===-1||x.indexOf(';')===x.length) {
    reportCodeScanError("Not a valid ASB Center Code");
    return "error";
  }
  let qrCodeVersion = x.substr(0, x.indexOf(';'));
  if (qrCodeVersion !== "1") {
    reportCodeScanError(`Code version not supported (code version ${qrCodeVersion}, supported code version 1)`);
    return "error";
  }
  x=x.substr(x.indexOf(';')+1);
  let portions = [];
  let lastParsePart=0;
  for (let i=0;i<x.length;i++) {
    if (x.charAt(i)===';') {
      portions.push(x.substr(lastParsePart,i-lastParsePart));
      lastParsePart=i+1;
    }
  }
  if (lastParsePart<x.length) {
    portions.push(x.substr(lastParsePart, x.length-lastParsePart));
  }
  let keyToValueMap = new Map();
  for (let i=0;i<portions.length;i++) {
    if (portions[i].indexOf('-')===-1) {
      reportCodeScanError(`Code parse error: could not find corresponding value for key ${portions[i]}`);
      return "error";
    }
    keyToValueMap.set(portions[i].substr(0, portions[i].indexOf('-')), portions[i].substr(portions[i].indexOf('-')+1));
  }
  // process special key-value pairs
  if (keyToValueMap.has('dat')) {
    // convert from base64
    let payload:string = keyToValueMap.get('dat');
    if (payload.indexOf('-')===-1 || payload.indexOf('-')===payload.length-1) {
      reportCodeScanError(`Code parse error: bad syntax for key "dat"`);
      return "error";
    }
    let length = Number.parseInt(payload.substr(0, payload.indexOf('-')));
    if (length === NaN || length < 0 || length > 1024) {
      reportCodeScanError(`Code parse error: bad length ${payload.substr(0, payload.indexOf('-'))} for key "dat"`);
      return "error";
    }
    let base64ToBinaryMap = get64ToBinaryMap();
    let payloadBinaryData:boolean[] = [];
    payload = payload.substr(payload.indexOf('-')+1);
    for (let i=0;i<payload.length;i++) {
      payloadBinaryData.push.apply(payloadBinaryData, base64ToBinaryMap[payload.charAt(i)]);
    }
    if (length*8>payloadBinaryData.length) {
      reportCodeScanError(`Code parse error: reported length exceeds data length`);
      return "error";
    }
    let payloadData: number[]=[];
    for (let i=0;i<length;i++) {
      let value=0;
      for (let j=i*8;j<i*8+8;j++) {
        value+=(payloadBinaryData[j] ? 1:0)*(1<<(8-1-j%8));
      }
      payloadData.push(value);
    }
    keyToValueMap.set("dat", payloadData);
  }
  
  // handle the code
  if (keyToValueMap.get("event")==="SM25") {
    if (keyToValueMap.get("type")==="secureCode") {
      let currentTime = getUnixTime();
      let secureCodesList:getSecureCodesReturnType = (await obj.sportsMeetFetchSecureCodes());
      if (secureCodesList.status === "forbidden") {
        reportCodeScanError(`Your account is not authorized to scan Sports Carnival ID Codes.`);
        return "error";
      }
      if (secureCodesList.status === "suspended") {
        reportCodeScanError(`Your account's admin previlages to scan Sports Carnival ID Codes are currently suspended by the system due to suspicious activity. Please contact the system administrator for clarification details.`);
        return "error";
      }
      let secureCodeVerification = verifySecureCode(keyToValueMap.get("dat") as number[], currentTime, secureCodesList.data);
      if (secureCodeVerification === null) {
        reportCodeScanError(`This Sports Carnival ID Code is invalid.`);
        return "error";
      }
      if (secureCodeVerification === obj.data.userData.id && obj.data.userData.compactId !== 'MICHAEL') {
        reportCodeScanError(`Your account is not authorized to scan your own Sports Carnival ID Code.`);
        return "error";
      }
      return secureCodeVerification;
    } else {
      reportCodeScanError(`This Sports Carnival ID Code is of unknown type ${keyToValueMap.get("type")}.`);
    }
  } else {
    reportCodeScanError(`This Code is bound to the unknown event ${keyToValueMap.get("event")}.`);
  }
}