chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {

        if (request.inputRequest == "pageType") {

            sendResponse({ isGoogleDoc: false });

        } else if (request.inputRequest == "hello") {
            // var inputs = document.getElementsByTagName("textArea");

            // if (inputs.length == 0) {
            //     alert("No input found")
            //     return
            // }

            console.log("responding");
            sendResponse({ isGoogleDoc: false });
        }
    }
)