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
                chrome.tabs.query({active: true, currentWindow: true}, tabs => {
                    chrome.tabs.sendMessage(tabs[0].id, {products: data});
                    return true
                });
            })
    }
    return true
}, {urls: ["https://catalog.onliner.by/sdapi/catalog.api/search/*"]})


chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Get', request)
    if (request.message === 'get items') {
        chrome.storage.sync.get("items", (items) => {
            console.log('Get from storage:', items)
            sendResponse({
                response: items
            })
        })
        return true
    }
    return true
})


chrome.commands.onCommand.addListener((command) => {
    console.log('Command:', command)
    chrome.tabs.query({active: true, currentWindow: true}, tabs => {
        chrome.tabs.sendMessage(tabs[0].id, {changeCurrency: true});
        return true
    });
})


{
    let contextId = 0;

    chrome.contextMenus.create(
        {
            id: (++contextId).toString(),
            type: "normal",
            title: "Delete this item from page",
            contexts: ["link"]
        }
    )
}



chrome.contextMenus.onClicked.addListener((info, tab) => {
    console.log(info)
    chrome.tabs.query({active: true, currentWindow: true}, tabs => {
        chrome.tabs.sendMessage(tabs[0].id, {delete: info.linkUrl});
        return true
    });
})