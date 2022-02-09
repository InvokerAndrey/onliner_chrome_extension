/* TODO 
    chrome.commands - bind keyboard keys to switch currency
    chrome.contentSettings - block cookies and etc.

    maybe do chrome.contextMenus to show prices of mini-phones selectively

    maybe chrome.desctopCapture to take screenshots of a webpage

    mb chrome.download could download useful info from a page to local file

    chrome.fontSettings to change font
*/


function getMedianOfPrices(prices) {
    if (!prices) return null;
    if(prices.length === 0) return 0;

    prices.sort((a,b) => {
        return a - b;
    });

    let half = Math.floor(prices.length / 2);
    
    if (prices.length % 2) return prices[half];

    return (prices[half - 1] + prices[half]) / 2.0;
}


const average = array => array.reduce((a,b) => a + b, 0) / array.length;


function sendRequest(url) {
    return fetch(url).then(response => { return response.json() })
}


function createSpan(div, innerHtml, clsName) {
    div.appendChild(document.createElement('br'))
    let elem = document.createElement('span');
    elem.className = clsName;
    elem.innerHTML = innerHtml;
    div.appendChild(elem);
}


function prettifyAvgs(avgs) {
    let objs = {}
    let obj = {}
    for (let i = 0; i < avgs.length; i++) {
        obj[avgs[i]._id] = {
            "avg": avgs[i].avg,
            "median": avgs[i].median
        }
        objs = {...objs, ...obj}
    }
    return objs
}


function getShopsFromURL() {
    const strParams = decodeURI(window.location.search)
    if (!strParams) return [];
    let shops = [];
    params = strParams.split('&')
    for (let i = 0; i < params.length; i++) {
        if (params[i].includes('shops')) {
            let shop = params[i].replace(/ *\[[^\]]*]/, '').replace('?', '').replace('shops', '').replace('=', '');
            shop = Number(shop)
            if (shop) {
                shops.push(shop)
            }
        }
    }
    return shops
}


function toUSD(price, exchange_rate) {
    price = price.replace('р.', '').replace(',', '.')
    price = parseFloat(price);
    price = price / exchange_rate
    return price.toFixed(2)
}


function toBYN(price, exchange_rate) {
    price = price.replace('$', '')
    price = parseFloat(price)
    price = price * exchange_rate
    return price.toFixed(2)
}


function changeCurrency(currency) {
    const exchange_rate = parseFloat(document.getElementsByClassName('_u js-currency-amount')[0].innerText.replace('$ ', '').replace(',', '.'))
    let priceDivs = document.getElementsByClassName('schema-product__price');
        
    for (let i = 0; i < priceDivs.length; i++) {
        let spans = priceDivs[i].getElementsByTagName('span');
        for (let j = 0; j < spans.length; j++) {
            if (currency == 2) {
                if (spans[j].innerText.includes('$')) return;
                if (spans[j].getAttribute('data-bind') == "html: $root.format.minPrice($data.prices, 'BYN')") {
                    spans[j].innerText = `$${toUSD(spans[j].innerText, exchange_rate)}`;
                }
                if (spans[j].className == 'average_price') {
                    spans[j].innerText = `Средняя: $${toUSD(spans[j].innerText.replace('Средняя: ', ''), exchange_rate)}`;
                } else if (spans[j].className == 'median_price') {
                    spans[j].innerText = `По медиане: $${toUSD(spans[j].innerText.replace('По медиане: ', ''), exchange_rate)}`;
                }
            } else if (currency == 1) {
                if (spans[j].innerText.includes('р.')) return;
                if (spans[j].getAttribute('data-bind') == "html: $root.format.minPrice($data.prices, 'BYN')") {
                    spans[j].innerText = `${toBYN(spans[j].innerText, exchange_rate)} р.`;
                }
                if (spans[j].className == 'average_price') {
                    spans[j].innerText = `Средняя: ${toBYN(spans[j].innerText.replace('Средняя: ', ''), exchange_rate)} р.`;
                } else if (spans[j].className == 'median_price') {
                    spans[j].innerText = `По медиане: ${toBYN(spans[j].innerText.replace('По медиане: ', ''), exchange_rate)} р.`;
                }
            }
            
        }
    }

}


function handlePricesRequests(keys, shops) {
    avgs = []
    for (let i = 0; i < keys.length; i++) {
        url = "https://catalog.onliner.by/sdapi/shop.api/products/" + keys[i] + "/positions?town=all&has_prime_delivery=1&town_id=17030"
        avgs.push(sendRequest(url)
            .then(data => {
                let prices = []
                let json_response = data.positions.primary
                for (let k in json_response) {
                    if (json_response.hasOwnProperty(k)) {
                        if (shops.length > 0) {
                            shop_id = json_response[k].shop_id;
                            if (shops.includes(shop_id)) {
                                prices.push(Number(json_response[k].position_price.amount))
                                product_id = json_response[k].product_url.split('/').pop()
                            }
                        } else {
                            prices.push(Number(json_response[k].position_price.amount))
                            product_id = json_response[k].product_url.split('/').pop()
                        }
                    }
                }
                return {
                    "_id": product_id,
                    "avg": average(prices).toFixed(2),
                    "median": getMedianOfPrices(prices).toFixed(2)
                }
            }))
    }
    return Promise.all(avgs)
}


function displayPrices(productsData) {
    console.log('Displaying prices...')

    const shops = getShopsFromURL();

    let keys = []
    for (let k in productsData.products) {
        if (productsData.products.hasOwnProperty(k) && productsData.products[k].prices) {
            keys.push(productsData.products[k].key);
            // for (let j = 0; j < data.products[k].children.length; j++) {
            //     keys.push(data.products[k].children[j].key)
            // }
        }
    }

    handlePricesRequests(keys, shops)
        .then(avgs => {
            let prettyAvgs = prettifyAvgs(avgs)
            let priceDivs = document.getElementsByClassName('schema-product__price');
            for (let i = 0; i < priceDivs.length; i++) {
                let spans = priceDivs[i].getElementsByTagName('span');
                let price = null;
                for (let j = 0; j < spans.length; j++) {
                    if (spans[j].getAttribute('data-bind') == "html: $root.format.minPrice($data.prices, 'BYN')") {
                        price = spans[j].innerText;
                    }
                }
                if (price) {
                    try {
                        _id = priceDivs[i].getElementsByTagName('a')[0].href.replace('/prices', '').split('/').pop()
                        average_price = prettyAvgs[_id].avg;
                        median_price = prettyAvgs[_id].median;
                        createSpan(priceDivs[i], `Средняя: ${average_price} р.`, "average_price");
                        createSpan(priceDivs[i], `По медиане: ${median_price} р.`, "median_price");                       
                    } catch {}
                }
            }
            console.log('Done.')
        })
        .catch(error => console.error(error))
}


chrome.runtime.onMessage.addListener((message) => {
    if (message.products) {
        displayPrices(message.products)
    }
})


function initStorage() {
    const items = {
        'id1': 1,
        'id2': 2
    }
    chrome.runtime.sendMessage({items})
}

function getItemsFromStorage() {
    return chrome.runtime.sendMessage({message: 'get items'}, response => console.log('Got from background storage:', response))
}


const messagesFromReactAppListener = (message) => {
    if (message.message) {
        console.log('msg:', message.message)
        changeCurrency(message.message)
    }
}


chrome.runtime.onMessage.addListener(messagesFromReactAppListener);


chrome.runtime.onMessage.addListener((message) => {
    if (message.changeCurrency) {
        let priceDivs = document.getElementsByClassName('schema-product__price');
        let spans = priceDivs[0].getElementsByTagName('span');
        if (spans[0].innerText.includes('$')) {
            changeCurrency(1)
        } else {
            changeCurrency(2)
        }
    }
});