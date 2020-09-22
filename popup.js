window.addEventListener("DOMContentLoaded", function () {

    var quoteFinder = document.getElementById("findQuotes");

    quoteFinder.addEventListener("click", function () {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            chrome.tabs.sendMessage(tabs[0].id, { inputRequest: "hello" }, function (response) {
                var userText = response.farewell

                var table = $("#displayTable");
                table.addClass("clear");
                table.html("<tr><th>Copy</th><th>Quotes</th><th>Source</th></tr>");

                var loading = $("#loading");
                loading.removeClass("clear");

                // Query the server that performs the quote finding
                var input_data = { "query": userText, "doc_mode": true };
                $.ajax({
                    method: "POST",
                    url: "http://aws2.datamuse.com:5000/sentences",
                    contentType: "application/json",
                    data: JSON.stringify(input_data)
                }).done(displayQuery);

                // loading.toggleClass("clear");
            })
        })
    })
});


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
        let copyButton = $("<button></button>");
        copyButton.append(String.fromCodePoint("0x1f4cb"));
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
        table.removeClass("clear");

        // Get the loading message to hide it
        $("#loading").addClass("clear");

    }
}
