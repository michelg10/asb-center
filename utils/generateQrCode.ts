import { get256ToBinaryMap } from "./binaryMapType";

function toBase64(x: boolean[]) {
  let value=0;
  for (let i=0;i<6;i++) {
    value+=(x[i] ? 1:0)*(1<<(6-1-i));
  }
  if (value>=0&&value<26) {
    return String.fromCharCode(65+value);
  }
  if (value>=26&&value<26+26) {
    return String.fromCharCode(97+value-26);
  }
  if (value>=26+26&&value<26+26+10) {
    return String.fromCharCode(48+value-(26+26));
  }
  if (value===62) {
    return "=";
  }
  if (value===63) {
    return "_";
  }
  console.log("error in to base 64:", x, value);
  return ""; 
}
export function generateQrCode(type: string, event: string, payload: number[]) {
  let payloadBinaryData:boolean[]=[];
  type binaryMapType = {[key:number]: boolean[]};
  let binaryMap: binaryMapType=get256ToBinaryMap();
  for (let i=0;i<payload.length;i++) {
    payloadBinaryData.push.apply(payloadBinaryData, binaryMap[payload[i]]);
  }
  while (payloadBinaryData.length%6!==0) {
    payloadBinaryData.push(false);
  }
  let base64EncodedPayload:string="";
  for (let i=0;i<payloadBinaryData.length;i+=6) {
    base64EncodedPayload+=toBase64(payloadBinaryData.slice(i,i+6));
  }
  return `asC;1;type-${type};event-${event};payload-${payload.length}-${base64EncodedPayload}`;
}