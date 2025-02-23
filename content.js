var lastTranslation ={original:'',translated:''};

function startTranslation(){
    if(window.translationStarted) {
        tearDownSubtitleElementListner();
        teardownTextTrackListner();
        window.translationStarted = false;
        return;
    };
    window.translationStarted = true;
    chrome.storage.sync.get({
        url:"https://translation.googleapis.com/language/translate/v2",
        source: 'sv',
        target: 'en',
        showOriginal:false,
        fontSize:28,
        apiKey:'FILL_IN',
        ownKey:''
      }, function (items) {

        if(!items.apiKey){
            alert("You need to set the options first. Pin it and right click to select options");
            return;
        }
        config = items;
        setupVideoListner();
      });
}

function setupVideoListner(){
    var subtitleEl = document.querySelector(".player-timedtext"); //Netflix
    if(subtitleEl != null){ 
        var styleTag = document.createElement("style");
        styleTag.id = "textTrackStyle";
        styleTag.innerText = '.player-timedtext-text-container{left:0;right:0;white-space:break-spaces}';
        document.head.append(styleTag);
    }
    if(subtitleEl ==null){ //Try Disney
        subtitleEl = document.querySelector(".TimedTextOverlay"); //Disney, previous dss-hls-subtitle-overlay");
        if(subtitleEl!=null){ //Add specific styling
            var styleTag = document.createElement("style");
            styleTag.id = "textTrackStyle";
            styleTag.innerText = '.hive-subtitle-renderer-wrapper{display:flex;width:100%;height:95%;flex-direction:column;align-items:center;justify-content:end;margin:0 !important;}';
            styleTag.innerText+= '.hive-subtitle-renderer-wrapper p{color:white;margin:0.2em;}';
            document.head.append(styleTag);
        }
    }
    if(subtitleEl == null){ //Try Prime
        subtitleEl = document.querySelector(".atvwebplayersdk-captions-overlay"); //Prime
        if(subtitleEl!=null){ //Add specific styling
            var styleTag = document.createElement("style");
            styleTag.id = "textTrackStyle";
            styleTag.innerText = '.atvwebplayersdk-captions-overlay>div{position:absolute;bottom:0;left:0;right:0;text-align:center;color:white;height:auto;padding-bottom:5%}';
            document.head.append(styleTag);
        }
    }

    if(subtitleEl != null){ //If we have found a match
        setupSubtitleElementListner(subtitleEl);
    }else{
        var videoEl = document.querySelector("video");
        if(!!videoEl && videoEl.textTracks && videoEl.textTracks.length > 0){
            setupTextTrackListner(videoEl);
        }else{
            alert("Cannot find subtitles");
            return;
        }
    }
}

function setupSubtitleElementListner(subtitleEl){
    var observer = new MutationObserver(subtitleElementCallback);
    observer.observe(subtitleEl, { attributes: false, childList: true, subtree: false });
    config.observer = observer;
}

function tearDownSubtitleElementListner(){
    if(!!config.observer){
        config.observer.disconnect();
        config.observer = null;
    }
}

function setupTextTrackListner(videoEl){
    var styleTag = document.createElement("style");
    styleTag.id = "texttrackStyling";
    styleTag.innerText = 'video::-webkit-media-text-track-container{ display:none;}';
    styleTag.innerText += '#html-subtitles{display:none;}';
    styleTag.innerText += '#texttrackEl{pointer-events:none;position:absolute;left:0;bottom:5%;text-align:center;z-index:1000;width:100%}';
    
    var textEl = document.createElement("div");
    textEl.id= "texttrackEl";

    document.head.append(styleTag);
    videoEl.parentElement.append(textEl);

    config.textEl = textEl;
    config.styleEl = styleTag;
    config.textTrack = videoEl.textTracks[0];
    for(var i=1;i<videoEl.textTracks.length;i++){
        if(videoEl.textTracks[i].mode == "showing"){
            config.textTrack = videoEl.textTracks[i];
        }
    }
    config.textTrack.addEventListener("cuechange", textTrackCallback);
}

function teardownTextTrackListner(){
    if(!!config.textTrack){
        config.textTrack.oncuechange = null;
        config.styleEl.remove();
        config.styleEl = null;
        config.textEl.remove();
        config.textEl = null;
    }
}

function textTrackCallback(event){
    config.textEl.innerHTML ="";
    for(var i=0;i<event.target.activeCues.length;i++){
        var el = document.createElement("div");
        el.innerText = event.target.activeCues[i].text;
        config.textEl.append(el);
        translate(el);
    }
}


function subtitleElementCallback(mutationsList, observer) {
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
        var apiKey = config.apiKey;
        if(!!config.ownKey) apiKey = config.ownKey;
        var url = config.url + `?q=${encodeURIComponent(originalText)}&source=${config.source}&target=${config.target}&key=${apiKey}`;
        fetch(url,{method:'POST'}).then(result=>{
            if(result.status == 403) throw new Error("Error calling Google Translate. Check you own translation key?")
            return result.json();
        }).then(result=>{
            if(result.data.translations && result.data.translations.length != 0){
                var text = result.data.translations[0].translatedText;
                lastTranslation = {
                    original: originalText,
                    translated: text
                };
                appendSubtitle(lastTranslation.original,lastTranslation.translated,subtitleParent);
            }
        }).catch(err=>{
            alert(err);
            startTranslation();
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
    pEl.style.textShadow = "0px 0px 10px black";
    var spanEl = document.createElement("span");
    spanEl.innerHTML = text;//text.replace(/[^|\n]-/g,"<br>-");
    pEl.appendChild(spanEl);
    return pEl;
}

startTranslation();

