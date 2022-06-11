//TODO check alt text for spelling errors
//TODO check for and remove numbers from array
//TODO check if removing S makes it valid word

chrome.runtime.onMessage.addListener(
    async function(request, sender, sendResponse) {

        var textString = document.body.innerText;
        var textList = stringToUpperWordArray(textString);
        var dictionaryURL = chrome.runtime.getURL("dictionary.json")
        var imageArray = document.getElementsByTagName("img");
        var imageAltTextArray = [];
        var imageAltTextString = "";

        for(var i = 0; i < imageArray.length; i++){
            var imageAltText = imageArray[i].alt;
            if(imageAltText != ""){
                imageAltTextString += " " + imageAltText;
            }
        }

        var dictionaryJSON = await fetch(dictionaryURL)
            .then((response) => response.json())
            .then((json) => {return json});

        var altTextWordArray = []//stringToUpperWordArray(imageAltTextString);
        var textWordArray = stringToUpperWordArray(textString)
        
        var wrongAltWordArray = []//getWrongWordArray(altTextWordArray, dictionaryJSON);
        var wrongWordArray = getWrongWordArray(textWordArray, dictionaryJSON);
       
        chrome.runtime.sendMessage({ 
            action: "show", 
            pageText: wrongWordArray,
            altText: wrongAltWordArray
        });
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
    wordArray.push("asdf.123")
    wordArray.push("123asdf")
    console.log(wordArray)
    var wrongWordArray = []
    for(var i = 0; i < wordArray.length; i++){
        if(dictionary[wordArray[i]] != "1" && !hasNum(wordArray[i])){
            wrongWordArray.push(wordArray[i])
        }
    }

    console.log(wrongWordArray)

    return wrongWordArray
}

function hasNum(string){
    return /\d/.test(string);
}