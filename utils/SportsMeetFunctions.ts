export type secureCodesListItem = {
  id: string,
  code: string,
}
export type getSecureCodesReturnType = {
  status: "forbidden" | "success",
  data: secureCodesListItem[],
};
export async function sportsMeet2021GetSecureCodes(obj: any):Promise<getSecureCodesReturnType> {
  if (obj.data.sportsMeet2021SecureCodesCache !== undefined) {
    return obj.data.sportsMeet2021SecureCodesCache;
  }
  let functionRes = await wx.cloud.callFunction({
    name: "SportsMeet2021GetSecureCodes"
  });
  obj.data.sportsMeet2021SecureCodesCache = functionRes.result as getSecureCodesReturnType;
  return functionRes.result as getSecureCodesReturnType;
}