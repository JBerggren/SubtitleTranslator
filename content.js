var className = "_video-player__text-tracks_qoxkq_1";
var subtitleEl = document.querySelector("." + className);
const config = { attributes: false, childList: true, subtree: false };
var key = "YOUR_OWN_API_KEY";
var googleTranslateUrl = "https://translation.googleapis.com/language/translate/v2";
var sourceLang = "sv";
var targetLang = "en";

function translateLeetSpeak(subtitleParent){
    var oldText = subtitleParent.innerText;
    var newText = oldText.replace(/o/g,"0").replace(/l/g,"1").replace(/r/g,"2").replace(/e/g,"3").replace(/a/g,"4").replace(/s/g,"5").replace(/g/g,"6").replace(/t/g,"7").replace(/b/g,"8");
    var newP = document.createElement("p");
    newP.textContent = newText;
    subtitleParent.replaceChildren(newP);
}

function translateGoogle(subtitleParent){
    var oldText = subtitleParent.innerText;
    if(!oldText){
        return;
    }
    console.log("Got old text:" + oldText);
    var url = googleTranslateUrl + `?q=${encodeURIComponent(oldText)}&source=${sourceLang}&target=${targetLang}&key=${key}`;
    fetch(url,{method:'POST'}).then(result=>result.json()).then(result=>{
        if(result.data.translations && result.data.translations.length != 0){
            var text = result.data.translations[0].translatedText;
            var spanEl = document.createElement("span");
            //text = text.replace(/\s-/g,"<br/>-"); //Fix newline 
            spanEl.innerHTML = text; 
            var pEl = document.createElement("p");
            pEl.appendChild(spanEl);
            subtitleParent.replaceChildren(pEl);
        }
    });
}

const callback = function(mutationsList, observer) {
    // Use traditional 'for loops' for IE 11
    for(const mutation of mutationsList) {
        if (mutation.type === 'childList' && mutation.addedNodes) {
           for(var addedNode of mutation.addedNodes){
            translateGoogle(addedNode);
           }
        }
    }
};

const observer = new MutationObserver(callback);
observer.observe(subtitleEl, config);