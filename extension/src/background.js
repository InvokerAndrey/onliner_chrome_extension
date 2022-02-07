// chrome.webRequest.onCompleted.addListener((response) => {
//     console.log(response.url)
//     chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
//         chrome.tabs.sendMessage(tabs[0].id, {url: response.url}, function(response) {});  
//     });
// }, {urls: ["https://catalog.onliner.by/sdapi/catalog.api/search/*"]})
