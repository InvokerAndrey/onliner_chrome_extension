function sendRequest(url) {
    return fetch(url).then(response => { return response.json() })
}


chrome.webRequest.onCompleted.addListener(response => {
    console.log('      URL:', response.url)
    console.log('     TYPE:', response.type)
    console.log('INITIATOR:', response.initiator)
    if (response.initiator == 'https://catalog.onliner.by') {
        sendRequest(response.url)
            .then(data => {
                console.log('Sending data to', response.tabId, 'tab id')
                chrome.tabs.sendMessage(response.tabId, {products: data});
            })
    }
    return true
}, {urls: ["https://catalog.onliner.by/sdapi/catalog.api/search/*"]})


chrome.commands.onCommand.addListener((command) => {
    console.log('Command:', command)
    chrome.tabs.query({url: "https://catalog.onliner.by/*", active: true, currentWindow: true}, tabs => {
        chrome.tabs.sendMessage(tabs[0].id, {changeCurrency: true});
        return true
    });
})


chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create(
        {
            id: "delete",
            type: "normal",
            title: "Delete this item from page",
            contexts: ["link"]
        }
    )
})


chrome.contextMenus.onClicked.addListener((info, tab) => {
    console.log('tab:', tab)
    console.log(info.linkUrl)
    chrome.tabs.sendMessage(tab.id, {delete: info.linkUrl});
})
