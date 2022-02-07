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
// .replace(/ *\[[^\]]*]/, '').replace('?', '').replace('shops', '').replace('=', '');

function getProductsURL() {
    const href = decodeURI(window.location.href)
    const href_split = href.split('?');
    const pathname_split = window.location.pathname.split('/');
    let url_params = '';
    let product_type = '';
    if (href_split.length >= 2) {
        url_params = href_split.at(-1)
    } else {
        url_params = ""
    }
    if (pathname_split.length === 3) {
        product_type = "/" + pathname_split.at(-2)
        url_params = "mfr[0]=" + pathname_split.at(-1)
    } else {
        product_type = window.location.pathname
    }
    return `https://catalog.onliner.by/sdapi/catalog.api/search${product_type}?${url_params}&group=1`
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


function changeCurrency(currency) {
    if (currency == 2) {
        const exchange_rate = parseFloat(document.getElementsByClassName('_u js-currency-amount')[0].innerText.replace('$ ', '').replace(',', '.'))
        let priceDivs = document.getElementsByClassName('schema-product__price');
        for (let i = 0; i < priceDivs.length; i++) {
            let spans = priceDivs[i].getElementsByTagName('span');
            for (let j = 0; j < spans.length; j++) {
                if (spans[j].innerText.includes('$')) return;
                if (spans[j].getAttribute('data-bind') == "html: $root.format.minPrice($data.prices, 'BYN')") {
                    spans[j].innerText = `$${toUSD(spans[j].innerText, exchange_rate)}`;
                }
                if (spans[j].className == 'average_price') {
                    spans[j].innerText = `Средняя: $${toUSD(spans[j].innerText.replace('Средняя: ', ''), exchange_rate)}`;
                } else if (spans[j].className == 'median_price') {
                    spans[j].innerText = `По медиане: $${toUSD(spans[j].innerText.replace('По медиане: ', ''), exchange_rate)}`;
                }
            }
        }
    } else {
        window.location.reload();
    }
}


function displayPrices() {
    const products_url = getProductsURL()
    console.log('Making products request:', products_url)
    const shops = getShopsFromURL();
    sendRequest(products_url)
        .then(data => {
            keys = []
            for (let k in data.products) {
                if (data.products.hasOwnProperty(k) && data.products[k].prices) {
                    keys.push(data.products[k].key);
                    // for (let j = 0; j < data.products[k].children.length; j++) {
                    //     keys.push(data.products[k].children[j].key)
                    // }
                }
            }
            return keys
        })
        .then(keys => {
            let url = ''
            let avgs = []
            let product_id = null
            for (let i = 0; i < keys.length; i++) {
                url = "https://catalog.onliner.by/sdapi/shop.api/products/" + keys[i] + "/positions?town=all&has_prime_delivery=1&town_id=17030"
                console.log('Making prices request:', url)
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
                                    console.log('IGNORING SHOPS')
                                    prices.push(Number(json_response[k].position_price.amount))
                                    product_id = json_response[k].product_url.split('/').pop()
                                }
                            }
                        }
                        console.log('PRICES:', prices)
                        return {
                            "_id": product_id,
                            "avg": average(prices).toFixed(2),
                            "median": getMedianOfPrices(prices).toFixed(2)
                        }
                    }))
            }
            return Promise.all(avgs)
        })
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
        })
        .catch(error => console.error(error))
}


window.onload = (event) => {
    console.log('True price injected!');
    let shops = getShopsFromURL()
    console.log('SHOPS:', shops);
    displayPrices();
    let lastUrl = location.href;
    new MutationObserver(() => {
      const url = location.href;
      if (url !== lastUrl) {
        lastUrl = url;
        displayPrices();
      }
    }).observe(document, {subtree: true, childList: true});
}


// chrome.runtime.onMessage.addListener((message) => {
//     console.log('MSG:', message.url)
// })


const messagesFromReactAppListener = (message) => {
    console.log('msg:', message.message)
    changeCurrency(message.message);
}


const main = () => {
    console.log('[content.js] Main')
    /**
     * Fired when a message is sent from either an extension process or a content script.
     */
    chrome.runtime.onMessage.addListener(messagesFromReactAppListener);
}

main();