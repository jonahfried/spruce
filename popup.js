const MAX_QUOTE_LEN = 300;

let quoteServerUrl = "https://api.rhymezone.com/sentences";

window.addEventListener("DOMContentLoaded", function () {

    activateHelpButton()

    handleGoogleDoc();

    handleLocalStore();

    var quoteFinder = document.getElementById("findQuotes");

    quoteFinder.addEventListener("click", searchPage);

    document.getElementById("userInput").addEventListener("keydown", function (e) {
        if (e.metaKey && e.key == "Enter") {
            e.preventDefault();
            searchPage(this.value);
        }
    });

    $("#showSaved").on("click", showSavedQuotes)
});

function activateHelpButton() {
    let content = 'To get started using Spruce just highlight some text, '
        + 'right click to pull up the context menu, then "Spruce up your selection!" '
        + 'Otherwise, you can type or paste text below to get quote suggestions. '
        + '<a id="github-link" class="link" style="color:blue;" href="https://github.com/jonahfried/spruce"> Click here for more help.</a>';
    $('[data-toggle="popover"]').popover({
        title: "Welcome to Spruce!",
        content,
        animation: true,
        placement: "left",
        html: true,
        trigger: "focus"
    });

    $("#help").on("click", function () {
        $("#github-link").on("click", function () {
            chrome.tabs.create({ url: $(this).attr("href") })
        })
    });
}

function handleLocalStore() {
    if (localStorage["text"] != undefined) {
        // First we disable the findQuotes button as it isn't necessary 
        $("#input-wrapper").addClass("clear");
        $("#quoteTypeForm").addClass("clear");
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

    var input_data = { "query": userText, "doc_mode": true, "selector": getQueryType(), "wke": false };
    $.ajax({
        method: "POST",
        url: quoteServerUrl,
        contentType: "application/json",
        data: JSON.stringify(input_data)
    }).done(displayQuery);
}

function getQueryType() {
    return $("#quoteTypeForm [name='option']:checked").val()
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
        { "field": "faiss_idx", "sortable": true, "title": "ID", "class": "clear" }

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
                let id = children[3].innerText;
                navigator.clipboard.writeText(`"${text}" (${source})`);

                // chrome.storage.sync.set({ savedQuotes: ["hello there"] }, function () {
                //     console.log("Saved quote")
                // })
                chrome.storage.sync.get(['savedQuotes'], function (results) {
                    var savedQuotes = results.savedQuotes;

                    // If savedQuotes is yet undefined, we must 
                    // initialize it as an empty object

                    if (savedQuotes == undefined) {
                        savedQuotes = {};
                    }

                    savedQuotes[id] = { text, source };

                    chrome.storage.sync.set({ savedQuotes: savedQuotes }, function () {
                        console.log("Saved quote");
                        console.log(savedQuotes)
                    })
                });


            });
        }

        $("a").on("click", function () {
            chrome.tabs.create({ url: $(this).attr("href") });
        });

        $('[data-toggle="popover"]').popover({ content: "copied!", animation: true, placement: "top", trigger: "focus" });

        $("[data-field='sentence']").css("width", "66%");

        table.removeClass("clear");
    } else {
        $("#noResults").removeClass("clear")
    }
    // Now that all of the copyButtons have been created
    // we can activate their bootstrap popover functionality


    // Get the loading message to hide it
    $("#loading").addClass("clear");

}

function showSavedQuotes() {
    console.log("Showing Saved Quotes");
    var table = $("#savedQuotesTable");
    var columns = [
        { "field": "text", "sortable": false, "title": "Sentence" },
        { "field": "source", "sortable": false, "title": "Source" },
    ]
    chrome.storage.sync.get(["savedQuotes"], (r) => {
        var data = [];
        for (const [id, sentence] of Object.entries(r.savedQuotes)) {
            sentence.faiss_idx = id;
            data.push(sentence)
        }
        table.bootstrapTable({
            data,
            columns
        })
    });
    table.removeClass('clear')
}