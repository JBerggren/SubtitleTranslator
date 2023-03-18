var config = {
    url:"https://translation.googleapis.com/language/translate/v2",
    source:'sv',
    target:'en',
    apiKey:'',
    showOriginal:false,
    fontSize:22
};

var lastTranslation ={original:'',translated:''};

function startTranslation(){
    if(window.translationStarted) return;
    window.translationStarted = true;
    chrome.storage.sync.get({
        source: 'sv',
        target: 'en',
        apiKey: '',
        showOriginal:false,
        fontSize:22
      }, function (items) {

        if(!items.apiKey){
            alert("No api key found!");
            return;
        }
        config.source = items.source;
        config.target = items.target;
        config.apiKey = items.apiKey;
        config.showOriginal = items.showOriginal;
        config.fontSize = items.fontSize;

        var subtitleEl = document.querySelector("._video-player__text-tracks_qoxkq_1"); //SVT Play
        if(subtitleEl == null){
            subtitleEl = document.querySelector(".player-timedtext"); //Netflix
        }

        if(subtitleEl != null){ //SVT or Netflix
            var observer = new MutationObserver(callback);
            observer.observe(subtitleEl, { attributes: false, childList: true, subtree: false });
            return;
        }
 
        var videoEl = document.querySelector("video");
        if(!!videoEl && videoEl.textTracks && videoEl.textTracks.length > 0){
            var styleTag = document.createElement("style")
            styleTag.innerText = 'video::-webkit-media-text-track-container{ display:none;}';
            document.head.append(styleTag);
            var textEl = document.createElement("div");
            textEl.setAttribute("style", "pointer-events:none;position:absolute;left:0;bottom:1%;text-align:center;z-index:1000;width:100%")
            document.body.append(textEl);
            videoEl.textTracks[0].oncuechange = (event) =>{
                textEl.innerHTML ="";
                for(var i=0;i<event.target.activeCues.length;i++){
                    textEl.innerText +=  event.target.activeCues[i].text + "\n";
                }
                console.log(textEl.innerText);
                //textEl.append(tSpan);
                translate(textEl);
            }; 
        }else{
            alert("Cannot find subtitles");
            return;
        }
      });
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
    pEl.style.fontSize = config.fontSize + "px";
    var spanEl = document.createElement("span");
    spanEl.innerHTML = text;//text.replace(/[^|\n]-/g,"<br>-");
    pEl.appendChild(spanEl);
    return pEl;
}

startTranslation();

