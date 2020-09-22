chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {

        var inputs = document.getElementsByTagName("textArea");


        if (inputs.length == 0) {
            alert("No input found")
            return
        }

        if (request.inputRequest == "hello") {
            console.log("responding");
            sendResponse({ farewell: inputs[0].value });
        }
    }
)