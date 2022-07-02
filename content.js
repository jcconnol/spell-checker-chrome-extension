//TODO future improvement - check if removing S makes it valid word
chrome.runtime.onMessage.addListener(
    async function(request, sender, sendResponse) {
        chrome.storage.sync.get([
            "pageHighlight",
            "includeAltText"
        ], async function(result) {
            var textString = document.body.innerText;
            var textList = stringToUpperWordArray(textString);
            var dictionaryURL = chrome.runtime.getURL("dictionary.json")
            var imageArray = document.getElementsByTagName("img");
            var imageAltTextArray = [];
            var imageAltTextString = "";

            var dictionaryJSON = await fetch(dictionaryURL)
                .then((response) => response.json())
                .then((json) => {return json});
            
            var showHighlight = result.pageHighlight;
            var includeAltText = result.includeAltText;
        
            var altTextString = "";
            var wrongAltWordArray = [];

            if(includeAltText){
                for(var i = 0; i < imageArray.length; i++){
                    var imageAltText = imageArray[i].alt;
                    if(imageAltText != ""){
                        altTextString += " " + imageAltText;
                    }
                }

                var altTextWordArray = stringToUpperWordArray(altTextString);
                wrongAltWordArray = getWrongWordArray(altTextWordArray, dictionaryJSON);
            }
            
            var textWordArray = stringToUpperWordArray(textString);
            var wrongWordArray = getWrongWordArray(textWordArray, dictionaryJSON);

            if(showHighlight){
                for(var i = 0; i < wrongWordArray.length; i++){
                    let text = document.evaluate(`//*[contains(text(), '${wrongWordArray[i].original}')]`,
                            document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE).snapshotItem(0).innerText;
                    let re = new RegExp(wrongWordArray[i].original,"g");
                    let newText = text.replace(re, `<mark>${wrongWordArray[i].upper}</mark>`);
                    document.evaluate(`//*[contains(text(), '${wrongWordArray[i].original}')]`, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE).snapshotItem(0).innerHTML = newText;
                }
            }

            chrome.runtime.sendMessage({ 
                action: "show",
                pageText: wrongWordArray,
                altText: wrongAltWordArray
            });
        })
    }
);

function stringToUpperWordArray(incoming_string){
    var stringArray = incoming_string.match(/\b(\w+)\b/g);

    for(var i = 0; i < stringArray.length; i++){
        stringArray[i] = {
            upper: stringArray[i].toUpperCase(),
            original: stringArray[i]
        }
    }

    return stringArray
}

function getWrongWordArray(wordArray, dictionary){
    var wrongWordArray = []
    for(var i = 0; i < wordArray.length; i++){
        if(dictionary[wordArray[i].upper] != "1" && !hasNum(wordArray[i].upper)){
            wrongWordArray.push(wordArray[i])
        }
    }

    var wrongWordObj = arrayToOccurancesObj(wrongWordArray)

    return wrongWordObj
}

function arrayToOccurancesObj(duplicatesArray){
    // [what, what] To [{what:2}]
    var countsObj = {};
    var capitalObj = {};

    for (var num of duplicatesArray) {
        var upper = num.upper;
        var original = num.original;
        capitalObj[upper] = original;
        countsObj[upper] = countsObj[upper] ? countsObj[upper] + 1 : 1;
    }

    var countsArray = [];
    for(var key in countsObj) {
        countsArray.push({
            "upper": key,
            "original": capitalObj[key],
            "count": countsObj[key]
        });
    }

    return countsArray
}

function hasNum(string){
    return /\d/.test(string);
}