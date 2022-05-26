export function isDarkTheme(): boolean {
    let systemInfo = wx.getSystemInfoSync();
    return systemInfo.theme === "dark"
}