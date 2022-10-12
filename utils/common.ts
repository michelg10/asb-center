export type PreviewEnum = "noPreview" | "secureCodePreview";
export type StudentDataType = {id: string, name: string, grade: number, class: number, pseudoId: string};
export type UserDataType = {id: string, student: StudentDataType | null, info: any, compactId: string, globalAdminName: string | null};
import drawQrcode from "./weapp.qrcode.esm.js";
export const darkBackgroundColor = "000000";
export const darkContainerColor = "1C1C1E";
export const lightBackgroundColor = "F2F1F6";
export const lightContainerColor = "FFFFFF";

export function createQRCode(canvasId: string, data: string, primaryColor: string, backgroundColor: string) { // data is the string value of the qr code
    const query = wx.createSelectorQuery();
    query.select(`#${canvasId}`)
    .fields({
        node: true,
        size: true
    }).exec((res) => {
        let canvas = res[0].node;
        const start = Date.now();
        drawQrcode({
            canvas: canvas,
            canvasId: canvasId,
            width: 184,
            height: 184,
            padding: 0,
            background: `#${backgroundColor}`,
            foreground: `#${primaryColor}`,
            text: data,
        })
        const end = Date.now();
        console.log(`Execution time: ${end - start} ms`);
    })
}