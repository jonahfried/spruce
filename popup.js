let quoteServerUrl = "https://api.rhymezone.com/sentences"

window.addEventListener("DOMContentLoaded", function () {


    handleLocalStore();

    var quoteFinder = document.getElementById("findQuotes");

    quoteFinder.addEventListener("click", searchPage);
});


function handleLocalStore() {
    if (localStorage["text"] != undefined) {
        // First we disable the findQuotes button as it isn't necessary 
        $("#input-wrapper").addClass("clear");
        queryQuotes(localStorage["text"]);
        $("body").css("width", "");
        localStorage.clear();
    }
}

function searchPage() {

    let userInput = $("#userInput");
    let userText = userInput.val();
    queryQuotes(userText);
    // userInput.val("");
    userInput.select()


}

function queryQuotes(userText) {
    var table = $("#displayTable");
    table.addClass("clear");
    table.html("<tr><th>Copy</th><th>Quotes</th><th>Source</th></tr>");

    var loading = $("#loading");
    loading.removeClass("clear");

    var input_data = { "query": userText, "doc_mode": true, "wke": false };
    $.ajax({
        method: "POST",
        url: quoteServerUrl,
        contentType: "application/json",
        data: JSON.stringify(input_data)
    }).done(displayQuery);
}


function displayQuery(d) {
    // Get the table from the popup page
    var table = $("#displayTable");

    let sentences = d.sentences;
    console.log(sentences);

    for (let i = 0; i < sentences.length; i++) {
        let sentence = sentences[i].sentence
        if (sentence == "") {
            continue;
        }
        if (sentence.length > 100) { // This number is likely not right
            continue;
        }
        let source = sentences[i].title;
        let sourceLink = $(sentences[i].linked_title);
        sourceLink.on("click", function () {
            chrome.tabs.create({ url: $(this).attr("href") });
            return false;
        });

        // Create the table row 
        let row = $("<tr></tr>");
        let sentenceCell = $("<td></td>");
        sentenceCell.append(sentence);

        // Create copy line button that writes to sys clipboard
        // let popoverInfo = "data-toggle='popover' data-content='copied!' data-trigger='focus' data-placement='top'"
        let copyButton = $("<button data-toggle='popover'></button>");
        copyButton.append(String.fromCodePoint("0x1f4cb"));
        copyButton.addClass("btn");
        copyButton.on("click", function () {
            let quotedSentence = '"' + sentence + '" ';
            let citation = "(" + source + ")";
            navigator.clipboard.writeText(quotedSentence + citation);
        });
        let copyCell = $("<td></td>");
        copyCell.append(copyButton);

        // Extract and create cell for author 
        let sourceCell = $("<td></td>");
        sourceCell.append(sourceLink);

        //  Append data to the row and to the table
        row.append(copyCell);
        row.append(sentenceCell);
        row.append(sourceCell);
        table.append(row);

    }
    // Now that all of the copyButtons have been created
    // we can activate their bootstrap popover functionality
    $('[data-toggle="popover"]').popover({ content: "copied!", animation: true, placement: "top", trigger: "focus" });

    table.removeClass("clear");

    // Get the loading message to hide it
    $("#loading").addClass("clear");

}
