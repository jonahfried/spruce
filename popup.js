const MAX_QUOTE_LEN = 300;

let quoteServerUrl = "https://api.onelook.com/sentences?k=spruce_chrome";

window.addEventListener("DOMContentLoaded", function () {
    sizeIfExtension();

    activateHelpButton();

    // activateThemeButton();

    // activateJokesToggle();

    handleLocalStore();

    // handleJokeToggle();

    // handleTheme();

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

function activateThemeButton() {
    $("#sun").on("click", () => {
        console.log("setting theme to dark");
        activateDarkTheme();
    });

    $("#moon").on("click", () => {
        console.log("setting theme to light");
        activateLightTheme();
    });
}

function handleTheme() {
    chrome.storage.sync.get(["spruceTheme"], r => {
        if (r.spruceTheme == "dark") {
            activateDarkTheme();
        }
    })
}

function activateDarkTheme() {
    $(".container-fluid").css("background-color", 'rgb(117, 170, 86)');
    $("body").css("background-image", 'url("./more-leaves-on-green.png")');

    chrome.storage.sync.set({ spruceTheme: "dark" })
    $("#moon").removeClass("clear");
    $("#sun").addClass("clear");
}

function activateLightTheme() {
    $(".container-fluid").css("background-color", 'rgb(218, 252, 218)');
    $("body").css("background-image", 'url("./more-leaves.png")');

    chrome.storage.sync.set({ spruceTheme: "light" })
    $("#moon").addClass("clear");
    $("#sun").removeClass("clear");
}

function activateJokesToggle() {
    $("#jokes-checkbox").on("change", e => {
        var jokesOn = document.getElementById("jokes-checkbox").checked;
        chrome.storage.sync.set({ jokesOn }, () => console.log("Jokes toggled"));
        $("#jokes-selector").toggleClass("clear");
    })
}

function handleJokeToggle() {
    chrome.storage.sync.get(["jokesOn"], r => {
        if (r.jokesOn === undefined) {
            return
        }
        document.getElementById("jokes-checkbox").checked = r.jokesOn;
        if (r.jokesOn) {
            $("#jokes-selector").removeClass("clear");
        }
    })
}

function sizeIfExtension() {
    let params = new URLSearchParams(window.location.search);

    if (params.has("source") && (params.get("source") == "extension")) {
        console.log("Spruce running from extension menu");
        $("#chrome-extension").addClass('clear');
        // $("body").css("width", "600px");
        activateJokesToggle();
        handleJokeToggle();
    } else if (params.has("source") && params.get("source") == "context") {
        $("#chrome-extension").addClass('clear');
        activateJokesToggle();
        handleJokeToggle();

    } else {
        console.log("Spruce running from tab");
        // $(".container-fluid").css("width", "66%");
        $(".saved-buttons-wrapper").addClass("clear");
        $("#dropdown-item-save").addClass("clear");
        $("#jokes-help-section").addClass("clear");
    }
}

function activateHelpButton() {
    $(".help").on("click", function () {
        $("#helpInfo").toggleClass("clear");
        // $("#helpInfo").on("click", () => {
        //     $("#helpInfo").toggleClass("clear");
        //     $("#spruceMain").toggleClass("clear");
        // });
        $("#spruceMain").toggleClass("clear");
        $(".saved-buttons-wrapper").toggleClass("clear");
        gtagBrowser("click", "Navigation", "help");
        // $(".help").toggleClass("clear");
    });
}

function activateSortButtons() {

    $("#sortForm").on("change", (e) => {
        var start_time = new Date().getTime();

        var id = $("#displayTable thead tr").find("th").eq(3).find("div").eq(0);

        var relevance = $("#displayTable thead tr").find("th").eq(4).find("div").eq(0);

        var complexity = $("#displayTable thead tr").find("th").eq(5).find("div").eq(0);

        var sortBy = e.target.value;

        id.click();
        switch (sortBy) {
            case "relevance":
                gtagBrowser("click", "Sorting", "relevance");
                relevance.click();
                relevance.click();
                break;
            case "complexity":
                gtagBrowser("click", "Sorting", "complexity");
                complexity.click();
                complexity.click();
                break;
            case "simplicity":
                gtagBrowser("click", "Sorting", "simplicity");
                complexity.click();
                break;
        }
        var delta_time = new Date().getTime() - start_time;
        glogBrowser(sortBy, delta_time)
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
        // $("body").css("width", "");
        localStorage.clear();
    }
}


function searchPage() {
    gtagBrowser("click", "Search", "find_quotes");
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
    var start_time = new Date().getTime();

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

    var selector = getQueryType();
    var doc_mode = true;
    var input_data = {
        "query": userText, "doc_mode": doc_mode,
        "selector": selector, "max_results": 50, "wke": false
    };
    $.ajax({
        method: "POST",
        url: quoteServerUrl + "&mode=" + getQueryType(),
        contentType: "application/json",
        data: JSON.stringify(input_data)
    }).done(
        (d) => {
            displayQuery(d);
            glogBrowser("query", new Date().getTime())
        }
    );

}

function getQueryType() {
    return $("#quoteTypeForm [name='option']:checked").val()
}

function displayQuery(d) {
    var start_time = new Date().getTime();
    // First we must reset the table
    $("#table-wrapper").html("<table id='displayTable'></table>");

    // Get the table from the popup page
    var table = $("#displayTable");

    let sentences = preprocessQuotes(d.sentences);
    console.log(sentences)
    // console.log(sentences);

    var columns = [
        { "field": "buttons", "sortable": false, "title": "" },
        { "field": "sentence", "sortable": false, "title": "Sentence", "class": "sentence" },
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

        // loadButtons(sentences.length);

        loadJS();

        $("[data-field='sentence']").css("width", "66%");

        table.removeClass("clear");

        displaySortButtons();

        removeNbsp();

        $("#sortForm").on("change", () => { loadJS(); removeNbsp(); });

    } else {
        $("#noResults").removeClass("clear")
    }
    // Now that all of the copyButtons have been created
    // we can activate their bootstrap popover functionality


    // Get the loading message to hide it
    $("#loading").addClass("clear");
    glogBrowser("display", new Date().getTime() - start_time);
}

function removeNbsp() {
    $("td.sentence").html((i, text) => {
        return text.replace(/&nbsp;/g, ' ');
    });
}

function loadJS() {
    $("td a").on("click", function () {
        chrome.tabs.create({ url: $(this).attr("href") });
    });

    $("#displayTable tbody tr td button").contextMenu({
        menuSelector: "#contextMenu",
        menuSelected: function ($invokedOn, $selectedMenu) {
            // var msg = "MENU 1\nYou selected the menu item '" + $selectedMenu.text() + "' (" + $selectedMenu.attr("value") + ") " + " on the value '" + $invokedOn.text() + "'";
            // alert(msg);
            var row = $invokedOn.parent().parent();
            handleActionSelection(row, $selectedMenu.attr("value"));

        },
        onMenuShow: function ($invokedOn) {
            var tr = $invokedOn.closest("tr");
            $(tr).addClass("selected-row");
        },
        onMenuHide: function ($invokedOn) {
            var tr = $invokedOn.closest("tr");
            $(tr).removeClass("selected-row");
        }
    });


}

function handleActionSelection(row, action) {
    switch (action) {
        case "copy":
            gtagBrowser("click", "Action", "copy");
            var text = row.find("td").eq(1).text();
            let sourceText = row.find("td").eq(2).text();
            navigator.clipboard.writeText(`"${text}" (${sourceText})`);
            break;

        case "save":
            gtagBrowser("click", "Action", "save");
            var children = row.children();
            var text = children[1].innerText;
            var source = children[2].children[0].outerHTML;
            var id = children[3].innerText;
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
            break;

        case "similar":
            gtagBrowser("click", "Action", "similar");
            var text = row.find("td").eq(1).text();
            $("#userInput").val(text);
            $("#findQuotes").click();
            break;

        case "report":
            gtagBrowser("click", "Action", "report");
            var children = row.children();
            var sentence = children[1].innerText;
            var title = children[2].children[0].outerHTML;
            var faiss_idx = children[3].innerText;
            var reported = true;
            if (confirm("Report this quotation?")) {
                $.ajax({
                    method: "POST",
                    url: quoteServerUrl,
                    contentType: "application/json",
                    data: JSON.stringify({ sentence, faiss_idx, title, reported })
                }).done(() => alert("Thank you for your report."));
                row.hide();
            }
            break;
    }
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
        let buttons = `<button id=${"button" + i} data-toggle="popover">${"&#9776;"}</button>`;
        sentences[i].buttons = buttons;
        sentences[i].complexity = sentences[i].sentence.length;
    }
    // sentences = sentences.filter((e) => e.sentence.length < 100);
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
    chrome.storage.sync.set({ savedQuotes: {} }, () => console.log("saved quotes cleared"));
}



function gtagBrowser(name, category, label) {
    /* EXCLUDE_IF_WEB 
     gtag("event", name, {
         "event_category": category,
         "event_label": label
     });
 
     EXCLUDE_IF_WEB */
}

function glogBrowser(name, delta) {
    /* EXCLUDE_IF_WEB
    gtag("event", 'timing_complete', {
        'name': name,
        'value': delta,
        'event_category': "time_logging"
    })
    EXCLUDE_IF_WEB */
}