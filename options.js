function save_options() {
  var statusEl = document.getElementById('status');
  var source = document.getElementById('source').value;
  var target = document.getElementById('target').value;
  var fontSize = document.getElementById('fontSize').value;
  var showOriginal = document.getElementById('showOriginal').checked;

  if(!source || !target){
    statusEl.textContent = "You need to fill in all values";
    return;
  }

  chrome.storage.sync.set({
    source: source,
    target: target,
    showOriginal:showOriginal,
    fontSize:fontSize
  }, function () {
    // Update status to let user know options were saved.
    statusEl.textContent = 'Options saved.';
    setTimeout(function () {
      statusEl.textContent = '';
    }, 750);
  });
}

function restore_options() {
  // Use default value color = 'red' and likesColor = true.
  chrome.storage.sync.get({
    source: 'sv',
    target: 'en',
    showOriginal:false,
    fontSize:28
  }, function (items) {
    document.getElementById('source').value = items.source;
    document.getElementById('target').value = items.target;
    document.getElementById('showOriginal').checked = items.showOriginal;
    document.getElementById('fontSize').value = items.fontSize;
  });
}

document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click',
  save_options);