export type PreviewEnum = "noPreview" | "secureCodePreview";
export type StudentDataType = {id: string, name: string, grade: number, class: number, pseudoId: string};
export type UserDataType = {id: string, student: StudentDataType | null, info: any, compactId: string, globalAdminName: string | null};
let QRCode = require('weapp-qrcode')
export const darkBackgroundColor = "000000";
export const darkContainerColor = "1C1C1E";
export const lightBackgroundColor = "F2F1F6";
export const lightContainerColor = "FFFFFF";

export function createQRCode(canvasId: string, data: string, primaryColor: string, backgroundColor: string) { // data is the string value of the qr code
  let qrcode = new QRCode(canvasId, {
    usingIn: "",
    text: "",
    width: 184,
    height: 184,
    colorDark: `#${primaryColor}`,
    colorLight: `#${backgroundColor}`, // sync this with the interface color
    correctLevel: QRCode.CorrectLevel.H,
  });
  qrcode.makeCode(data)
}