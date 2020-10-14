const MAX_QUOTE_LEN = 300;

let quoteServerUrl = "https://api.rhymezone.com/sentences";

window.addEventListener("DOMContentLoaded", function () {

    activateHelpButton()

    handleGoogleDoc();

    handleLocalStore();

    var quoteFinder = document.getElementById("findQuotes");

    quoteFinder.addEventListener("click", searchPage);
});

function activateHelpButton() {
    let content = 'To get started using Spruce just highlight some text, '
        + 'right click to pull up the context menu, then "Spruce up your selection!" '
        + 'Otherwise, you can type or paste text below to get quote suggestions. '
        + '<a class="link" style="color:blue;" href="https://github.com/jonahfried/spruce">Shift-click here for more help.</a>';
    $('[data-toggle="popover"]').popover({
        title: "Welcome to Spruce!",
        content,
        animation: true,
        placement: "left",
        html: true,
        trigger: "focus"
    });
}

function handleLocalStore() {
    if (localStorage["text"] != undefined) {
        // First we disable the findQuotes button as it isn't necessary 
        $("#input-wrapper").addClass("clear");
        queryQuotes(localStorage["text"]);
        $("body").css("width", "");
        localStorage.clear();
    }
}

// if the page is a google docs page
// we disable the input bar
function handleGoogleDoc() {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { inputRequest: "pageType" }, function (response) {
            if (response.isGoogleDoc) {
                $("#input-wrapper").addClass("clear");
                searchPage();
            }
        })
    });
}

function searchPage() {

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { inputRequest: "hello" }, function (response) {
            if (response.isGoogleDoc) {
                console.log("Google Docs Text Found");
                var userText = response.googleDocsText
            } else {
                console.log("Using Extension Input")
                let userInput = $("#userInput");
                var userText = userInput.val();
                userInput.select()
            }
            queryQuotes(userText);

        })
    });

}

function queryQuotes(userText) {
    var table = $("#displayTable");
    table.addClass("clear");
    // table.html("<tr><th>Copy</th><th>Quotes</th><th class='sources'>Sources</th></tr>");

    var loading = $("#loading");
    loading.removeClass("clear");

    $("#noResults").addClass("clear")

    var input_data = { "query": userText, "doc_mode": true, "selector": "quotes", "wke": false };
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
    for (let i = 0; i < sentences.length; i++) {
        sentences[i].test = `<button id=${"button" + i} data-toggle="popover">${String.fromCodePoint("0x1f4cb")}</button>`;
    }
    console.log(sentences)
    // console.log(sentences);

    var columns = [
        { "field": "test", "sortable": false, "title": "Copy" },
        { "field": "sentence", "sortable": true, "title": "Sentence" },
        { "field": "linked_title", "sortable": true, "title": "Source" },

        // { "field": "score", "sortable": true, "title": "Match score" },
        // { "field": "distance", "sortable": true, "title": "Min semantic distance" },
        // { "field": "occurrence_count", "sortable": true, "title": "Num. sentences matched" }
    ];

    if (sentences.length > 0) {
        table.bootstrapTable({
            data: sentences,
            columns: columns,
            exportTypes: ['excel', 'csv', 'txt'],
        });

        for (let i = 0; i < sentences.length; i++) {
            let id = "#button" + i;
            $(id).on("click", function () {
                let children = $(`[data-index="${i}"]`).children();
                let text = children[1].innerText;
                let source = children[2].innerText;
                navigator.clipboard.writeText(`"${text}" (${source})`);
            });
        }

        $("a").on("click", function () {
            chrome.tabs.create({ url: $(this).href })
        })

        $('[data-toggle="popover"]').popover({ content: "copied!", animation: true, placement: "top", trigger: "focus" });

        table.removeClass("clear");
    } else {
        $("#noResults").removeClass("clear")
    }
    // Now that all of the copyButtons have been created
    // we can activate their bootstrap popover functionality


    // Get the loading message to hide it
    $("#loading").addClass("clear");

}


// function displayQuery(d) {
//     // Get the table from the popup page
//     var table = $("#displayTable");

//     let sentences = d.sentences;
//     // console.log(sentences);

//     if (sentences.length > 0) {
//         for (let i = 0; i < sentences.length; i++) {
//             let sentence = sentences[i].sentence
//             if (sentence == "") {
//                 continue;
//             }
//             // We skip quotes that are too long because they break 
//             // the table css
//             if (sentence.length > MAX_QUOTE_LEN) { // This number is just a guess quick fix
//                 continue;
//             }
//             let source = sentences[i].title;
//             let sourceLink = $(sentences[i].linked_title);
//             sourceLink.on("click", function () {
//                 chrome.tabs.create({ url: $(this).attr("href") });
//                 return false;
//             });

//             // Create the table row 
//             let row = $("<tr></tr>");
//             let sentenceCell = $("<td></td>");
//             sentenceCell.append(sentence);

//             // Create copy line button that writes to sys clipboard
//             // let popoverInfo = "data-toggle='popover' data-content='copied!' data-trigger='focus' data-placement='top'"
//             let copyButton = $("<button data-toggle='popover'></button>");
//             copyButton.append(String.fromCodePoint("0x1f4cb"));
//             copyButton.addClass("btn");
//             copyButton.on("click", function () {
//                 let quotedSentence = '"' + sentence + '" ';
//                 let citation = "(" + source + ")";
//                 navigator.clipboard.writeText(quotedSentence + citation);
//             });
//             let copyCell = $("<td></td>");
//             copyCell.append(copyButton);

//             // Extract and create cell for author 
//             let sourceCell = $("<td></td>");
//             sourceCell.append(sourceLink);

//             //  Append data to the row and to the table
//             row.append(copyCell);
//             row.append(sentenceCell);
//             row.append(sourceCell);
//             table.append(row);

//         }

//         $('[data-toggle="popover"]').popover({ content: "copied!", animation: true, placement: "top", trigger: "focus" });

//         table.removeClass("clear");
//     } else {
//         $("#noResults").removeClass("clear")
//     }
//     // Now that all of the copyButtons have been created
//     // we can activate their bootstrap popover functionality


//     // Get the loading message to hide it
//     $("#loading").addClass("clear");

// }
