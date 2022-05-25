document.addEventListener('DOMContentLoaded', function() {
    
}, false);

window.addEventListener('load', function(event){
    
    chrome.tabs.executeScript(null,
        {file: 'content.js'},
        sendMessage
    )
});

function sendMessage(){
    var getSpellCheckButton = document.getElementsByClassName('get-spell-check-button')[0];

    getSpellCheckButton.addEventListener('click', function() {

        getImageInfoButton.disabled = true;

        var params = {
            active: true,
            currentWindow: true
        }

        var messageTo = {
            subject: "DOMInfo",
            from: "imgs"
        }

        chrome.tabs.query(params, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, messageTo);
        });

    }, false);
}