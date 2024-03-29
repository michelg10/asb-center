export type secureCodesListItem = {
  id: string,
  code: string,
}
export type getSecureCodesReturnType = {
  status: "forbidden" | "success",
  data: secureCodesListItem[],
};
export async function sportsMeetGetSecureCodes(obj: any):Promise<getSecureCodesReturnType> {
  if (obj.data.sportsMeetSecureCodesCache !== undefined) {
    return obj.data.sportsMeetSecureCodesCache;
  }
  let functionRes = await wx.cloud.callFunction({
    name: "SportsMeetGetSecureCodes"
  });
  obj.data.sportsMeetSecureCodesCache = functionRes.result as getSecureCodesReturnType;
  return functionRes.result as getSecureCodesReturnType;
}