var config = {
    url:"https://translation.googleapis.com/language/translate/v2",
    source:'sv',
    target:'en',
    apiKey:'',
    showOriginal:false
};

var lastTranslation ={original:'',translated:''};

function startTranslation(){
    chrome.storage.sync.get({
        source: 'sv',
        target: 'en',
        apiKey: '',
        showOriginal:false
      }, function (items) {
        if(!items.apiKey){
            alert("No api key found!");
            return;
        }
        var subtitleEl = document.querySelector("._video-player__text-tracks_qoxkq_1"); //SVT Play
        if(subtitleEl == null){
            subtitleEl = document.querySelector(".player-timedtext"); //Netflix
        }
        if(subtitleEl == null){
            alert("Cannot find subtitles");
            return;
        }
        config.source = items.source;
        config.target = items.target;
        config.apiKey = items.apiKey;
        config.showOriginal = items.showOriginal;

        var observer = new MutationObserver(callback);
        observer.observe(subtitleEl, { attributes: false, childList: true, subtree: false });
      });
}

function translate(subtitleParent){
    var originalText = subtitleParent.innerText;
    if(!originalText){
        return;
    }
    
    if(config.target == "leet"){
        var newText = originalText.replace(/o/g,"0").replace(/l/g,"1").replace(/r/g,"2").replace(/e/g,"3").replace(/a/g,"4").replace(/s/g,"5").replace(/g/g,"6").replace(/t/g,"7").replace(/b/g,"8");
        appendSubtitle(originalText,newText,subtitleParent);
    }else if(originalText == lastTranslation.original){
        appendSubtitle(lastTranslation.original,lastTranslation.translated,subtitleParent);
    }else{
        subtitleParent.replaceChildren();
        var url = config.url + `?q=${encodeURIComponent(originalText)}&source=${config.source}&target=${config.target}&key=${config.apiKey}`;
        fetch(url,{method:'POST'}).then(result=>result.json()).then(result=>{
            if(result.data.translations && result.data.translations.length != 0){
                var text = result.data.translations[0].translatedText;
                lastTranslation = {
                    original: originalText,
                    translated: text
                };
                appendSubtitle(lastTranslation.original,lastTranslation.translated,subtitleParent);
            }
        });
    }
}

function appendSubtitle(originalText,translatedText,parent){
    parent.replaceChildren(createSubtitleElement(translatedText));

    if(config.showOriginal){
        parent.appendChild(createSubtitleElement(originalText));
    }
}

function createSubtitleElement(text){
    var pEl = document.createElement("p");
    pEl.style.fontSize = "19px";
    var spanEl = document.createElement("span");
    spanEl.innerHTML = text;
    pEl.appendChild(spanEl);
    return pEl;
}

var callback = function(mutationsList, observer) {
    for(const mutation of mutationsList) {
        if (mutation.type === 'childList' && mutation.addedNodes) {
           for(var addedNode of mutation.addedNodes){
            translate(addedNode);
           }
        }
    }
};

startTranslation();

