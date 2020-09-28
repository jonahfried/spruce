function getContextClickHandler() {
    return function (info, tab) {
        // The srcUrl property is only available for image elements.
        var url = 'popup.html#';

        localStorage["text"] = info.selectionText;

        // Create a new window to the info page.
        chrome.windows.create({ url: url, width: 600, height: 800 });
    }
}

chrome.contextMenus.create({
    "title": "Spruce up your selection",
    "type": "normal",
    "contexts": ["all"],
    "onclick": getContextClickHandler()

})