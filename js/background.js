// Called when the user clicks on the browser action icon.
chrome.browserAction.onClicked.addListener(function(tab) {
   
  if (chrome.runtime.openOptionsPage) {
    // New way to open options pages, if supported (Chrome 42+).
    chrome.runtime.openOptionsPage();
  } else {
    // Reasonable fallback.
    window.open(chrome.runtime.getURL('options.html'));
  }

});