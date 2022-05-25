runSpellCheck();

//Run on page load if setting selected
function runSpellCheck(){
    chrome.storage.sync.get(["Toggle"], function(items){
        if(items.upgradeBrowserToggle === true || items.upgradeBrowserToggle === "true"){
            //Do something
        }
    });
}

//Runs when "Run Spell Check" button is clicked
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        //TODO make spell check happen
        var popupArrayResponse = [];

        var imageArray = document.getElementsByTagName("img");
        

        chrome.runtime.sendMessage({ 
            action: "show", 
            imgsArray: popupArrayResponse
        });
        
        return true;
    }
);

function formatArray(array){
    //remove duplicate urls from different sources
    if(!array || array.length < 1){
        return [];
    }

    var uniqueArray = [];
    for(var j = 0; j < array.length; j++){
        if(uniqueArray.indexOf(array[j]) == -1){
            uniqueArray.push(array[j])
        }
    }

    //remove undefined's
    uniqueArray = uniqueArray.filter(function( element ) {
        if(element == undefined){
            return false;
        }

        if(element.trim() === ""){
            return false;
        }

        if(element.includes("data:image/")){
            return false;
        }

        if(element.includes(".woff2") || element.includes(".woff")){
            return false;
        }

        return true;
    });

    return uniqueArray;
}

function removeURLParameters(url){
    if(url){
        if(url.indexOf('?') > 0){
            return url.substring(0, url.indexOf('?'))
        }
    }
    else {
        return null
    }
}