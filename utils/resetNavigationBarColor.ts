import { darkBackgroundColor, lightBackgroundColor } from "./common"
import { isDarkTheme } from "./isDarkTheme"

export function resetNavigationBarColor() {
    if (isDarkTheme()) {
        wx.setNavigationBarColor({
            frontColor: "FFFFFF",
            backgroundColor: darkBackgroundColor
        })
    } else {
        wx.setNavigationBarColor({
            frontColor: "000000",
            backgroundColor: lightBackgroundColor
        })
    }
}