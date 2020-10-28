const MAX_QUOTE_LEN = 300;

let quoteServerUrl = "https://api.onelook.com/sentences";

window.addEventListener("DOMContentLoaded", function () {
    sizeIfExtension();

    activateHelpButton();

    handleLocalStore();

    var quoteFinder = document.getElementById("findQuotes");

    quoteFinder.addEventListener("click", () => {
        searchPage();
        $("#userInput").select();
    });

    document.getElementById("userInput").addEventListener("keydown", function (e) {
        if (e.metaKey && e.key == "Enter") {
            e.preventDefault();
            // $("#userInput").select();
            $("#findQuotes").click();
        }
    });

    activateSortButtons();

    $("#showSaved").on("click", showSavedQuotes);

    $("#hideSaved").on("click", hideSavedQuotes);

    $("a").on("click", function () {
        chrome.tabs.create({ url: $(this).attr("href") });
    })
});

function sizeIfExtension() {
    if (window.chrome && chrome.runtime && chrome.runtime.id) {
        $("body").css("width", "600px");
    } else {
        $(".container-fluid").css("width", "800px");
        $(".saved-buttons-wrapper").addClass("clear");
    }
}

function activateHelpButton() {
    $("#help").on("click", function () {
        $("#helpInfo").toggleClass("clear");
        // $("#helpInfo").on("click", () => {
        //     $("#helpInfo").toggleClass("clear");
        //     $("#spruceMain").toggleClass("clear");
        // });
        $("#spruceMain").toggleClass("clear");
        $(".saved-buttons-wrapper").toggleClass("clear");
    });
}

function activateSortButtons() {

    $("#sortForm").on("change", (e) => {

        var id = $("#displayTable thead tr").find("th").eq(3).find("div").eq(0);

        var relevance = $("#displayTable thead tr").find("th").eq(4).find("div").eq(0);

        var complexity = $("#displayTable thead tr").find("th").eq(5).find("div").eq(0);

        var sortBy = e.target.value;

        id.click();
        switch (sortBy) {
            case "relevance":
                relevance.click();
                relevance.click();
                break;
            case "complexity":
                complexity.click();
                complexity.click();
                break;
            case "simplicity":
                complexity.click();
                break;
        }
    });
}

// Handles the case where there is text to be 
// analyzed in localStorage 
// (for when activated through context menu)
function handleLocalStore() {
    var text = localStorage["text"];

    if (text != undefined) {
        if (text != "undefined") {
            $("#userInput").val(text);
        }
        searchPage();
        $("body").css("width", "");
        localStorage.clear();
    }
}


function searchPage() {
    console.log("Using Extension Input")
    let userInput = $("#userInput");
    var userText = userInput.val();
    userInput.select();

    if (userText.trim() != "") {
        queryQuotes(userText);
    } else {
        $("#displayTable").addClass("clear");
        $("#sortForm").addClass("clear");
        $("#noInput").removeClass("clear");
    }
}

function queryQuotes(userText) {
    var table = $("#displayTable");
    table.addClass("clear");
    // table.html("<tr><th>Copy</th><th>Quotes</th><th class='sources'>Sources</th></tr>");

    var loading = $("#loading");
    loading.removeClass("clear");

    // Make the relevance boxed check on load
    $("#relevance").click();

    hideSortButtons();

    $("#noResults").addClass("clear");
    $("#noInput").addClass("clear");

    var input_data = { "query": userText, "doc_mode": true, "selector": getQueryType(), "max_results": 50, "wke": false };
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
    // First we must reset the table
    $("#table-wrapper").html("<table id='displayTable'></table>");

    // Get the table from the popup page
    var table = $("#displayTable");

    let sentences = preprocessQuotes(d.sentences);
    console.log(sentences)
    // console.log(sentences);

    var columns = [
        { "field": "buttons", "sortable": false, "title": "Copy" },
        { "field": "sentence", "sortable": false, "title": "Sentence", "class": "sentenceColumn" },
        { "field": "linked_title", "sortable": false, "title": "Source", "class": "sourceColumn" },
        { "field": "faiss_idx", "sortable": true, "title": "ID", "class": "clear" },
        { "field": "score", "sortable": true, "title": "score", "class": "clear" },
        { "field": "complexity", "sortable": true, "title": "complexity", "class": "clear" },

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

        loadButtons(sentences.length);

        loadJS();

        $("[data-field='sentence']").css("width", "66%");

        table.removeClass("clear");

        displaySortButtons();

        $("#sortForm").on("change", () => { loadButtons(sentences.length); loadJS() });

        removeNbsp();
    } else {
        $("#noResults").removeClass("clear")
    }
    // Now that all of the copyButtons have been created
    // we can activate their bootstrap popover functionality


    // Get the loading message to hide it
    $("#loading").addClass("clear");


}

function removeNbsp() {
    $("td.sentenceColumn").html((i, text) => {
        return text.replace(/&nbsp;/g, ' ');
    });
}

function loadJS() {
    $("td a").on("click", function () {
        chrome.tabs.create({ url: $(this).attr("href") });
    });

    $('[data-toggle="popover"]').popover({ content: "copied!", animation: true, placement: "top", trigger: "focus" });
}

function loadButtons(sentencesLen) {
    for (let i = 0; i < sentencesLen; i++) {
        let button = $("[data-index='" + i + "']").find("td").eq(0).find("button").eq(0);
        button.on("click", function () {
            let children = $(`[data-index="${i}"]`).children();
            let text = children[1].innerText;
            let source = children[2].children[0].outerHTML;
            let sourceText = children[2].innerText;
            let id = children[3].innerText;

            navigator.clipboard.writeText(`"${text}" (${sourceText})`);

            // chrome.storage.sync.set({ savedQuotes: ["hello there"] }, function () {
            //     console.log("Saved quote")
            // })
            chrome.storage.sync.get(['savedQuotes'], function (results) {
                var savedQuotes = results.savedQuotes;

                if (savedQuotes == undefined) {
                    savedQuotes = {};
                }
                savedQuotes[id] = { text, source };

                chrome.storage.sync.set({ savedQuotes }, function () {
                    console.log("Saved quote");
                });

            });
        });
    }
}

function loadDeleteButton(sentencesLen) {
    for (let i = 0; i < sentencesLen; i++) {
        let button = $("[data-index='" + i + "']").find("td").eq(0).find("button").eq(1);
        button.on("click", function () {
            let children = $(`[data-index="${i}"]`).children();
            let id = children[3].innerText;
            chrome.storage.sync.get(["savedQuotes"], (r) => {
                delete r.savedQuotes[id];
                chrome.storage.sync.set({ savedQuotes: r.savedQuotes });
            });
            $(`[data-index="${i}"]`).eq(0).css("display", "none");
        })
    }
}

function preprocessQuotes(sentences) {
    for (let i = 0; i < sentences.length; i++) {
        let buttons = `<button id=${"button" + i} data-toggle="popover">${String.fromCodePoint("0x1f4cb")}</button>`;
        sentences[i].buttons = buttons;
        sentences[i].complexity = sentences[i].sentence.length;
    }
    sentences = sentences.filter((e) => e.sentence.length < 100);
    return sentences
}

function displaySortButtons() {
    // Get the sort button to reveal it
    $("#sortForm").removeClass("clear");
    return
}

function hideSortButtons() {
    // Get the sort button to reveal it
    $("#sortForm").addClass("clear");
    return
}

function showSavedQuotes() {
    console.log("Showing Saved Quotes");
    $("#input-wrapper").hide();
    $("#quoteTypeForm").hide();
    $("#sortForm").hide();
    $("#display-wrapper").hide();


    var table = $("#savedQuotesTable");
    var columns = [
        { "field": "buttons", "sortable": false, "title": "Copy" },
        { "field": "text", "sortable": false, "title": "Sentence" },
        { "field": "source", "sortable": false, "title": "Source", "class": "sourceColumn" },
        { "field": "faiss_idx", "sortable": false, "title": "ID", "class": "clear" },
    ]
    chrome.storage.sync.get(["savedQuotes"], (r) => {
        var data = [];
        for (const [id, sentence] of Object.entries(r.savedQuotes)) {
            sentence.faiss_idx = id;
            data.push(sentence)
        }

        for (let i = 0; i < data.length; i++) {
            data[i].buttons = `<button id=${"button" + i} data-toggle="popover">${String.fromCodePoint("0x1f4cb")}</button> <button id=${"delete" + i}>X</button>`;
        }

        table.bootstrapTable({
            data,
            columns
        });

        loadButtons(data.length);
        loadDeleteButton(data.length);
        loadJS();
        removeNbsp();
    });
    table.removeClass('clear');
    $("#hideSaved").removeClass('clear');
    $("#showSaved").addClass('clear');

    $("[data-field='text']").css("width", "66%");
}

function hideSavedQuotes() {
    $("#hideSaved").addClass("clear");
    $("#showSaved").removeClass("clear");

    $("#savedQuotesTableWrapper").html('<table id="savedQuotesTable" class="clear"></table>')

    $("#input-wrapper").show();
    $("#quoteTypeForm").show();
    $("#sortForm").show();
    $("#display-wrapper").show();

}


function clearSavedQuotes() {
    chrome.storage.sync.clear();
}