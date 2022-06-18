//TODO make toggle for alt text
//TODO make toggle to show on popup 
//TODO make toggle to highlight on page
//TODO make to where person can add words to be excluded from dictionary

var numericRegExp = new RegExp('^((?:NaN|-?(?:(?:\\d+|\\d*\\.\\d+)(?:[E|e][+|-]?\\d+)?|Infinity)))$')

document.addEventListener('DOMContentLoaded', function() {
    chrome.storage.sync.get(["pageObject"], async function(result) {
        var getSpellCheckButton = document.getElementsByClassName('run-spell-check-button')[0];

        var currentURL = null;

        chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
            currentURL = tabs[0].url;

            if(result.pageObject && result.pageObject.textArray.length > 0 && currentURL == result.pageObject.url){
                var wordTable = buildTableFromData(result.pageObject.textArray);

                document.getElementById("spell-check-list-container").innerHTML = wordTable;

                initSortTable(document.querySelector('table'))

                getSpellCheckButton.disabled = false;
            }
        });
    });

    //Settings storage retrieval
    chrome.storage.sync.get([
        "showTable",
        "pageUnderline",
        "includeAltText"
    ], function(items){
        document.getElementsByClassName('show-table')[0].checked = items.showTable;
        document.getElementsByClassName('page-underline')[0].checked = items.pageUnderline;
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
        else if(inputClicked.matches(".page-underline")){
            key = "pageUnderline";
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
            //var altTextData = request.altText

            for(var i = 0; i < textData.length; i++){
                var progressWidth = (i/(textData.length))*100;
                progressWidth = Math.ceil(progressWidth);

                if(i === (textData.length-1)){
                    progressWidth = 100;
                }

                progressBar.style.width = progressWidth + '%'; 
                progressBar.innerHTML = progressWidth * 1  + '%';

                var value = textData[i];
            }

            //sort data array by size
            var sortedTextData = textData.sort();

            await chrome.tabs.query({active: true, currentWindow: true}, async function(tabs){   
                var currentURL = tabs[0].url;
                
                var pageObject = {
                    "textArray": sortedTextData,
                    "url": currentURL
                }

                chrome.storage.sync.set({"pageObject": pageObject}, function() {
                    var wordTable = buildTableFromData(sortedTextData);
                    document.getElementById("spell-check-list-container").innerHTML = wordTable;

                    initSortTable(document.querySelector('table'));

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

function buildTableFromData(tableArray){
    var buildTable = "<table><thead><tr class=\"image-table-header\">";
    buildTable += `<th class="sorting"></th>`;
    buildTable += `<th class="sorting">Misspelling</th>`;
    buildTable += `<th class="sorting">Occurrences</th>`;
    buildTable += "</tr></thead><tbody><tr>";

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