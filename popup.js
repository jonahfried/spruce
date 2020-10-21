const MAX_QUOTE_LEN = 300;

let quoteServerUrl = "https://api.rhymezone.com/sentences";

window.addEventListener("DOMContentLoaded", function () {
    sizeIfExtension();

    activateHelpButton();

    handleLocalStore();

    var quoteFinder = document.getElementById("findQuotes");

    quoteFinder.addEventListener("click", searchPage);

    document.getElementById("userInput").addEventListener("keydown", function (e) {
        if (e.metaKey && e.key == "Enter") {
            e.preventDefault();
            searchPage(this.value);
        }
    });

    activateSortButtons();
});

function sizeIfExtension() {
    if (window.chrome && chrome.runtime && chrome.runtime.id) {
        $("body").css("width", "600px");
    } else {
        $(".container-fluid").css("width", "800px");
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
    });
}

function activateSortButtons() {

    $("#sortForm").on("change", (e) => {
        var sentence = $("#displayTable thead tr").find("th").eq(1).find("div").eq(0);

        var relevance = $("#displayTable thead tr").find("th").eq(4).find("div").eq(0);

        var complexity = $("#displayTable thead tr").find("th").eq(5).find("div").eq(0);

        var sortBy = e.target.value;

        sentence.click();
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

function handleLocalStore() {
    if (localStorage["text"] != undefined) {
        // First we disable the findQuotes button as it isn't necessary 
        // $("#input-wrapper").addClass("clear");
        // $("#quoteTypeForm").addClass("clear");
        $("#userInput").val(localStorage["text"]);
        searchPage();
        $("body").css("width", "");
        localStorage.clear();
    }
}


function searchPage() {
    console.log("Using Extension Input")
    let userInput = $("#userInput");
    var userText = userInput.val();
    userInput.select()

    queryQuotes(userText);
}

function queryQuotes(userText) {
    var table = $("#displayTable");
    table.addClass("clear");
    // table.html("<tr><th>Copy</th><th>Quotes</th><th class='sources'>Sources</th></tr>");

    var loading = $("#loading");
    loading.removeClass("clear");

    // Make the relevance boxed check on load
    $("#relevance").prop("checked", true);

    hideSortButtons();

    $("#noResults").addClass("clear")

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
        { "field": "sentence", "sortable": false, "title": "Sentence" },
        { "field": "linked_title", "sortable": false, "title": "Source" },
        { "field": "faiss_idx", "sortable": false, "title": "ID", "class": "clear" },
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

        $("a").on("click", function () {
            chrome.tabs.create({ url: $(this).attr("href") });
        });

        $('[data-toggle="popover"]').popover({ content: "copied!", animation: true, placement: "top", trigger: "focus" });

        $("[data-field='sentence']").css("width", "66%");

        table.removeClass("clear");

        displaySortButtons();

        $("#sortForm").on("change", () => loadButtons(sentences.length));
    } else {
        $("#noResults").removeClass("clear")
    }
    // Now that all of the copyButtons have been created
    // we can activate their bootstrap popover functionality


    // Get the loading message to hide it
    $("#loading").addClass("clear");


}

function loadButtons(sentencesLen) {
    for (let i = 0; i < sentencesLen; i++) {
        let button = $("[data-index='" + i + "']").find("td").eq(0).find("button");
        console.log(button)
        button.on("click", function () {
            let children = $(`[data-index="${i}"]`).children();
            let text = children[1].innerText;
            let source = children[2].innerText;
            navigator.clipboard.writeText(`"${text}" (${source})`);

            // chrome.storage.sync.set({ savedQuotes: ["hello there"] }, function () {
            //     console.log("Saved quote")
            // })
            chrome.storage.sync.get(['savedQuotes'], function (results) {
                var savedQuotes = results.savedQuotes;

                if (savedQuotes == undefined) {
                    savedQuotes = [text];
                } else {
                    savedQuotes.push(text);
                }

                chrome.storage.sync.set({ savedQuotes }, function () {
                    console.log("Saved quote");
                });

            });
        });
    }
    $('[data-toggle="popover"]').popover({ content: "copied!", animation: true, placement: "top", trigger: "focus" });

}

function preprocessQuotes(sentences) {
    for (let i = 0; i < sentences.length; i++) {
        let buttons = `<button id=${"button" + i} data-toggle="popover">${String.fromCodePoint("0x1f4cb")}</button>`;
        sentences[i].buttons = buttons;
        sentences[i].complexity = sentences[i].sentence.length;
    }
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
