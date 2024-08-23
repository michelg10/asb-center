import { Event } from "../../classes/event";

// pages/SuggestionsBox/SuggestionsBox.ts
type ComponentDataInterface = {
    db: DB.Database,
    hasBeenSubmitted: boolean,
    name: string,
    contactInformation: string,
    suggestion: string,
    language: string,
    allowSubmission: boolean,
};

Component({
    /**
     * Component properties
     */
    properties: {

    },

    /**
     * Component initial data
     */
    data: { } as ComponentDataInterface,

    /**
     * Component methods
     */
    methods: {
        onLoad: function() {
            this.setData({
                db: wx.cloud.database(),
                hasBeenSubmitted: false,
                name: "",
                contactInformation: "",
                suggestion: "",
                language: "en",
                allowSubmission: true,
            });
        },
        nameInputChanged: function(x: any) {
            console.log(x.detail.value);
            this.setData({
                name: x.detail.value,
            });
        },
        contactInformationChanged: function(x: any) {
            console.log(x.detail.value);
            this.setData({
                contactInformation: x.detail.value,
            });
        },
        suggestionChanged: function(x: any) {
            this.setData({
                suggestion: x.detail.value
            });
        },
        changeLanguage: function() {
            let nextLang;
            if (this.data.language === "en") {
                nextLang = "ch";
            } else if (this.data.language === "ch") {
                nextLang = "en";
            }
            this.setData({
                language: nextLang,
            });
        },
        submitButtonTapped: async function() {
            if (!this.data.allowSubmission) {
                return;
            }
            this.data.allowSubmission = false;
            let canSubmit = true;
            if (this.data.suggestion === "") {
                canSubmit = false;
            }

            if (canSubmit) {
                await wx.cloud.callFunction({
                    name: "SuggestionsBoxSubmit",
                    data: {
                        name: this.data.name,
                        contactInformation: this.data.contactInformation,
                        suggestion: this.data.suggestion,
                    }
                });

                this.setData({
                    hasBeenSubmitted: true,
                });
            }
        }
    }
})
