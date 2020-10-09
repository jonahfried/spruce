chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        if (request.inputRequest == "pageType") {

            sendResponse({ isGoogleDoc: true });

        } else if (request.inputRequest == "hello") {
            // var inputs = document.getElementsByTagName("textArea");
            var googleDoc = googleDocsUtil.getGoogleDocument();
            var text = getText(googleDoc)
            console.log("responding");
            sendResponse({ isGoogleDoc: true, googleDocsText: text });
        }
    }
)

function getText(doc) {

    // look for text selected on the google doc
    var text = doc.selectedText;

    // if none is found, then take all loaded text
    if (text == "") {
        for (let i = 0; i < doc.text.length; i++) {
            text += doc.text[i];
        }
    }

    // console.log("Found Doc Text: " + text);

    return text

}