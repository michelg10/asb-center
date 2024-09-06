// pages/SuggestionsBox/SuggestionsBox.ts
type ComponentDataInterface = {
    db: DB.Database,
    hasBeenSubmitted: boolean,
    name: string,
    contactInformation: string,
    grade: number,
    gradeOptions: string[],
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
                grade: 0,
                gradeOptions: ['Please Select 请选择...', '9','10','11','12'],
                suggestion: "",
                language: "en",
                allowSubmission: true,
            });
        },
        nameInputChanged: function(x: any) {
            this.setData({
                name: x.detail.value,
            });
        },
        contactInformationChanged: function(x: any) {
            this.setData({
                contactInformation: x.detail.value,
            });
        },
        gradeChanged: function(x: any) {
          this.setData({
              grade: x.detail.value,
          });
        },
        suggestionChanged: function(x: any) {
            this.setData({
                suggestion: x.detail.value,
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
          console.log("Submit Tapped")
            if (!this.data.allowSubmission || this.data.hasBeenSubmitted) {
                console.log("Already Submitted")
                return;
            } //To prevent repeated submissions
            let canSubmit = true;
            if (this.data.suggestion === "") {
                canSubmit = false;
                console.log("No Suggestion Input")
                return;
            }
            else if (this.data.grade == 0) {
              canSubmit = false;
              console.log("No Grade Selection")
              return;
          }

            if (canSubmit) {
                console.log("Successfully Submitted");
                this.data.allowSubmission = false;
                await wx.cloud.callFunction({
                    name: "SuggestionsBoxSubmit",
                    data: {
                        name: this.data.name,
                        contactInformation: this.data.contactInformation,
                        grade: this.data.gradeOptions[this.data.grade],
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
