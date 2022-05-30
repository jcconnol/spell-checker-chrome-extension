//TODO check alt text for spelling errors
//TODO check for and remove numbers from array
//TODO check if removing S makes it valid word

chrome.runtime.onMessage.addListener(
    async function(request, sender, sendResponse) {
        console.log("recieved message");

        var textString = document.body.innerText;
        var textList = stringToUpperWordArray(textString);
        var dictionaryURL = chrome.runtime.getURL("dictionary.json")
        var wrongWordArray = [];
        var wrongAltWordArray = [];
        var imageArray = document.getElementsByTagName("img");
        var imageAltTextArray = []

        for(var i = 0; i < imageArray.length; i++){
            
            var imageAltText = imageArray[i].alt;
            if(imageAltText != ""){
                imageAltTextArray.push(imageAltText);
            }
        }

        var dictionaryJSON = await fetch(dictionaryURL)
            .then((response) => response.json())
            .then((json) => {return json});

        for(var i = 0; i < textList.length; i++){
            if(!dictionaryJSON[textList[i]]){
                wrongWordArray.push({
                    index: i,
                    word: textList[i]
                });
            }
        }

        console.log(wrongWordArray)
        
        chrome.runtime.sendMessage({ 
            action: "show", 
            pageText: wrongWordArray,
            altText: wrongAltWordArray
        });
    }
);

function splitSentenceArray(sentenceArray){
    var wordObjectArray = []
    for(var i = 0; i < sentenceArray.length; i++){
        var splitSentence = stringToUpperWordArray(sentenceArray[i])
        wordObjectArray.push(splitSentence);
    }

    return wordObjectArray;
}

function stringToUpperWordArray(string){
    var stringArray = string.match(/\b(\w+)\b/g);

    for(var i = 0; i < stringArray.length; i++){
        stringArray[i] = stringArray[i].toUpperCase()
    }

    return stringArray
}