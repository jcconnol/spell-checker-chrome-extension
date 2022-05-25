runSpellCheck();

function runSpellCheck(){
    chrome.storage.sync.get(["Toggle"], function(items){
        if(items.upgradeBrowserToggle === true || items.upgradeBrowserToggle === "true"){
            //Do something
        }
    });
}
