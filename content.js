//TODO check alt text for spelling errors
//TODO check for and remove numbers from array
//TODO check if removing S makes it valid word

chrome.runtime.onMessage.addListener(
    async function(request, sender, sendResponse) {
        chrome.storage.sync.get([
            "pageUnderline",
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
            
            var showTable = true;
            var showUnderline = false;
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
            
            var textWordArray = stringToUpperWordArray(textString)
            var wrongWordArray = getWrongWordArray(textWordArray, dictionaryJSON);
            console.log(wrongAltWordArray)
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
        stringArray[i] = stringArray[i].toUpperCase()
    }

    return stringArray
}

function getWrongWordArray(wordArray, dictionary){
    var wrongWordArray = []
    for(var i = 0; i < wordArray.length; i++){
        if(dictionary[wordArray[i]] != "1" && !hasNum(wordArray[i])){
            wrongWordArray.push(wordArray[i])
        }
    }

    var wrongWordObj = arrayToOccurancesObj(wrongWordArray)

    return wrongWordObj
}

function arrayToOccurancesObj(duplicatesArray){
    // [what, what] To [{what:2}]

    var countsObj = {};

    for (var num of duplicatesArray) {
        countsObj[num] = countsObj[num] ? countsObj[num] + 1 : 1;
    }

    var countsArray = [];
    for (var key in countsObj) {
        countsArray.push({
            "word": key,
            "count": countsObj[key]
        });
    }

    return countsArray
}

function hasNum(string){
    return /\d/.test(string);
}