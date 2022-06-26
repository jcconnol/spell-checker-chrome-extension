
//TODO make toggle to show on popup
//TODO make toggle to highlight on page
//TODO make to where person can add words to be excluded from dictionary

var numericRegExp = new RegExp('^((?:NaN|-?(?:(?:\\d+|\\d*\\.\\d+)(?:[E|e][+|-]?\\d+)?|Infinity)))$')

document.addEventListener('DOMContentLoaded', function() {
    //TODO future improvement - save table string and set table to that text
    chrome.storage.sync.get(["pageObject","showTable","pageHighlight","includeAltText"], async function(result) {
        var getSpellCheckButton = document.getElementsByClassName('run-spell-check-button')[0];

        var currentURL = null;

        chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
            currentURL = tabs[0].url;

            if(result && currentURL == result.pageObject.url){
                if(result.pageObject.textArray.length > 0) {
                    var wordTable = buildTableFromData(result.pageObject.textArray, "spell-check-text-container");
                    document.getElementById("spell-check-text-container").innerHTML = wordTable;
                }

                if(result.pageObject.altArray.length > 0 && result.includeAltText) {
                    var altTextTable = buildTableFromData(result.pageObject.altArray, "spell-check-alt-container");
                    document.getElementById("spell-check-alt-container").innerHTML = altTextTable;
                }
                
                initSortTable(document.getElementById('spell-check-text-container'));
                initSortTable(document.getElementById('spell-check-alt-container'));
                getSpellCheckButton.disabled = false;
            }
        });
    });

    //Settings storage retrieval
    chrome.storage.sync.get([
        "showTable",
        "pageHighlight",
        "includeAltText"
    ], function(items){
        //document.getElementsByClassName('show-table')[0].checked = items.showTable;
        //document.getElementsByClassName('page-highlight')[0].checked = items.pageHighlight;
        document.getElementsByClassName('include-alt-text')[0].checked = items.includeAltText;
    });

    $('.switch #setting-switch').click(function(event) {
        var inputClicked = event.target;
        var key = null;
        var value = event.target.checked;    

        if(inputClicked.matches(".show-table")){
            key = "showTable";
        }
        else if(inputClicked.matches(".include-alt-text")){
            key = "includeAltText";
        }
        else if(inputClicked.matches(".page-highlight")){
            key = "pageHighlight";
        }
        
        if(key){
            chrome.storage.sync.set({
                [key]: value
            });
        }
    });
});

window.addEventListener('load', function(event){
    var runSpellCheckButton = document.getElementsByClassName('run-spell-check-button')[0]
    runSpellCheckButton.addEventListener("click", 
        function(){ 
            var messageTo = {
                subject: "DOMInfo",
                from: "imgs"
            }
        
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                chrome.tabs.sendMessage(tabs[0].id, messageTo);
            });
        });
});

chrome.runtime.onMessage.addListener(
    async function(request, sender) {
        var runSpellCheckButton = document.getElementsByClassName('run-spell-check-button')[0];

        if(sender.tab.active === true){
            runSpellCheckButton.disabled = true;

            var progressBar = document.getElementById("inner-prog-bar");            

            var textData = request.pageText
            var altTextData = request.altText
            var totalDataLength = altTextData.length + textData.length

            for(var i = 0; i < totalDataLength; i++){
                var progressWidth = (i/(totalDataLength))*100;
                progressWidth = Math.ceil(progressWidth);

                if(i === (totalDataLength-1)){
                    progressWidth = 100;
                }

                progressBar.style.width = progressWidth + '%'; 
                progressBar.innerHTML = progressWidth * 1  + '%';
            }

            var sortedTextData = textData.sort();
            var sortedAltData = altTextData.sort();

            await chrome.tabs.query({active: true, currentWindow: true}, async function(tabs){   
                var currentURL = tabs[0].url;
                
                var pageObject = {
                    "textArray": sortedTextData,
                    "altArray": sortedAltData,
                    "url": currentURL
                }

                chrome.storage.sync.set({"pageObject": pageObject}, function() {

                    var wordTable = buildTableFromData(sortedTextData, "spell-check-text-container");
                    document.getElementById("spell-check-text-container").innerHTML = wordTable;

                    if(sortedAltData.length > 0){
                        var altWordTable = buildTableFromData(sortedAltData, "spell-check-alt-container");
                        document.getElementById("spell-check-alt-container").innerHTML = altWordTable;
                        document.getElementById("spell-check-alt-container").style.display = "block";
                        document.getElementsByClassName("page-alt-table-header").text = "block";
                    }
                    else{
                        document.getElementById("spell-check-alt-container").style.display = "none";
                        document.getElementsByClassName("page-alt-table-header").text = "none";
                    }

                    initSortTable(document.getElementById('spell-check-text-container'));
                    initSortTable(document.getElementById('spell-check-alt-container'));

                    runSpellCheckButton.disabled = false;
                });
            });
        }
    }
);

function sendMessage(){

    var runSpellCheckButton = document.getElementsByClassName('run-spell-check-button')[0];

    runSpellCheckButton.disabled = true;

    var params = {
        active: true,
        currentWindow: true
    }

    var messageTo = {
        subject: "DOMInfo",
        from: "imgs"
    }

    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendRequest(tabs[0].id, messageTo);
    });
}

function buildTableFromData(tableArray, tableId){
    var buildTable = `<table id=\"${tableId}\"><thead><tr class=\"image-table-header\">`;
    buildTable += `<th class="sorting"></th>`;
    buildTable += `<th class="sorting">Misspelling</th>`;
    buildTable += `<th class="sorting">Occurrences</th>`;
    buildTable += `</tr></thead><tbody><tr>`;

    for(var i = 0; i < tableArray.length; i++){
        var value = tableArray[i].word;
        var occurance = tableArray[i].count; 

        buildTable += `<td>${i+1}</td>`;
        buildTable += `<td>${value}</td>`;
        buildTable += `<td>${occurance}</td>`;

        if ((i+1) < buildTable.length) { 
            buildTable += "</tr><tr>";
        }
    }
    
    buildTable += "</tr><tbody></table>";
    return buildTable;
}

//Helper functions for sorting
function isNumeric (value) {
    return numericRegExp.test(String(value))
}

function toArray (value) {
    if (!value) {
        return []
    }
    
    if (Array.isArray(value)) {
        return value
    }
    
    if (value instanceof window.NodeList || value instanceof window.HTMLCollection) {
        return Array.prototype.slice.call(value)
    }
    
    return [ value ]
}

function sortTable (table, ordering) {
    var thead = table.querySelector('thead')
    var tbody = table.querySelector('tbody')
    var rows = toArray(tbody.rows)
    var headers = toArray(thead.rows[0].cells)

    var current = toArray(thead.querySelectorAll('.sorting_desc, .sorting_asc'))
    
    current.filter(function (item) { return !!item }).forEach(function (item) {
        item.classList.remove('sorting_desc')
        item.classList.remove('sorting_asc')
    })
    
    headers.filter(function (item) { return !!item }).forEach(function (header) {
        header.classList.remove('sorting_desc')
        header.classList.remove('sorting_asc')
    })
    
    ordering.forEach(function (order) {
        var index = order.idx
        var direction = order.dir || 'asc'
        
        var header = headers[index]
        header.classList.add('sorting_' + direction)
    })
    
    rows.sort(function sorter (a, b) {
        var i = 0
        var order = ordering[i]
        var length = ordering.length
        var aText
        var bText
        var result = 0
        var dir
        
        while (order && result === 0) {
            dir = order.dir === 'desc' ? -1 : 1


            if(!a.cells[order.idx]){
                break;
            }

            if(!b.cells[order.idx]){
                break;
            }

            // if(!('textContent' in a.cells[order.idx])){
            //     break;
            // }

            // if(!('textContent' in b.cells[order.idx])){
            //     break;
            // }
            
            aText = a.cells[order.idx].textContent
            bText = b.cells[order.idx].textContent

            if (isNumeric(aText) && isNumeric(bText)) {
                result = dir * (parseFloat(aText) - parseFloat(bText))
            } else {
                result = dir * aText.localeCompare(bText)
            }
            
            i += 1
            order = ordering[i]
        }
        
        return result
    }).forEach(function each (row) {
        tbody.appendChild(row)
    })
}

function find (array, predicate) {
    return toArray(array).filter(predicate)[0]
}

function initSortTable (table) {
    var thead = table.querySelector('thead')
    var ordering = [{idx:2,dir:'asc'},{idx:1,dir:'asc'}]
    
    table.__ordering = ordering
    
    thead.addEventListener('click', function onClick (event) {
        var src = event.target || event.srcElement
        var tagName = src.tagName.toLowerCase()
        
        if (tagName !== 'th') {
        return
        }
        
        if (!event.shiftKey) {
        table.__ordering = [
            {
            idx: src.cellIndex,
            dir: src.classList.contains('sorting_asc') ? 'desc' : 'asc'
            }
        ]
        } else {
        var order = find(table.__ordering, function (item) {
            return item.idx === src.cellIndex
        })
        
        if (order) {
            order.dir = order.dir === 'asc' ? 'desc' : 'asc'
        } else {
            table.__ordering.push({
            idx: src.cellIndex,
            dir: 'asc'
            })
        }
        }
        
        sortTable(table, table.__ordering)
    }, false)
}