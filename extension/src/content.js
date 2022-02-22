function getMedianOfPrices(prices) {
    if (!prices) return null;
    if(prices.length === 0) return 0;

    prices.sort((a, b) => {
        return a - b;
    });

    let half = Math.floor(prices.length / 2);
    
    if (prices.length % 2) return prices[half];

    return (prices[half - 1] + prices[half]) / 2.0;
}


function getAverageOfPrices(prices) {
    return prices.reduce((a, b) => a + b, 0) / prices.length;
}


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


function toUSD(price, exchangeRate) {
    price = price.replace('р.', '').replace(',', '.')
    price = parseFloat(price);
    price = price / exchangeRate
    return price.toFixed(2)
}


function toBYN(price, exchangeRate) {
    price = price.replace('$', '')
    price = parseFloat(price)
    price = price * exchangeRate
    return price.toFixed(2)
}


function rewritePrices(span, innerTextMinPrice, innerTextAvgPrice, innerTextMedianPrice) {
    if (span.getAttribute('data-bind') == "html: $root.format.minPrice($data.prices, 'BYN')") {
        span.innerText = innerTextMinPrice;
    }
    if (span.className == 'average_price') {
        span.innerText = innerTextAvgPrice;
    } else if (span.className == 'median_price') {
        span.innerText = innerTextMedianPrice;
    }
}


function changeCurrency(currency) {
    const exchangeRate = parseFloat(document.getElementsByClassName('_u js-currency-amount')[0].innerText.replace('$ ', '').replace(',', '.'))
    let priceDivs = document.getElementsByClassName('schema-product__price');

    let innerTextMinPrice = '';
    let innerTextAvgPrice = '';
    let innerTextMedianPrice = '';

        
    for (let i = 0; i < priceDivs.length; i++) {
        let spans = priceDivs[i].getElementsByTagName('span');
        for (let j = 0; j < spans.length; j++) {
            if (currency == 2) {
                if (spans[j].innerText.includes('$')) continue;

                innerTextMinPrice = `$${toUSD(spans[j].innerText, exchangeRate)}`;
                innerTextAvgPrice = `Средняя: $${toUSD(spans[j].innerText.replace('Средняя: ', ''), exchangeRate)}`;
                innerTextMedianPrice = `По медиане: $${toUSD(spans[j].innerText.replace('По медиане: ', ''), exchangeRate)}`;
                rewritePrices(spans[j], innerTextMinPrice, innerTextAvgPrice, innerTextMedianPrice)
            } else if (currency == 1) {
                if (spans[j].innerText.includes('р.')) continue;

                innerTextMinPrice = `${toBYN(spans[j].innerText, exchangeRate)} р.`;
                innerTextAvgPrice = `Средняя: ${toBYN(spans[j].innerText.replace('Средняя: ', ''), exchangeRate)} р.`;
                innerTextMedianPrice = `По медиане: ${toBYN(spans[j].innerText.replace('По медиане: ', ''), exchangeRate)} р.`;
                rewritePrices(spans[j], innerTextMinPrice, innerTextAvgPrice, innerTextMedianPrice)
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
                let jsonResponse = data.positions.primary
                for (let k in jsonResponse) {
                    if (jsonResponse.hasOwnProperty(k)) {
                        if (shops.length > 0) {
                            shopId = jsonResponse[k].shop_id;
                            if (shops.includes(shopId)) {
                                prices.push(Number(jsonResponse[k].position_price.amount))
                                productId = jsonResponse[k].product_url.split('/').pop()
                            }
                        } else {
                            prices.push(Number(jsonResponse[k].position_price.amount))
                            productId = jsonResponse[k].product_url.split('/').pop()
                        }
                    }
                }
                return {
                    "_id": productId,
                    "avg": getAverageOfPrices(prices).toFixed(2),
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
                        averagePrice = prettyAvgs[_id].avg;
                        medianPrice = prettyAvgs[_id].median;
                        createSpan(priceDivs[i], `Средняя: ${averagePrice} р.`, "average_price");
                        createSpan(priceDivs[i], `По медиане: ${medianPrice} р.`, "median_price");                       
                    } catch {}
                }
            }
            console.log('Done.')
        })
        .catch(error => {
            console.error(error)
        })
}


function deleteItemFromPage(href) {
    let mainDivs = document.getElementsByClassName('schema-product__group')
    for (let i = 0; i < mainDivs.length; i++) {
        if (mainDivs[i].querySelectorAll(`a[href='${href}']`).length > 0) {
            mainDivs[i].remove()
            break;
        }
    }
}


chrome.runtime.onMessage.addListener((message) => {
    if (message.products) {
        console.log('got products', message.products)
        displayPrices(message.products)
    }
    if (message.delete) {
        console.log('Deleting', message.delete)
        deleteItemFromPage(message.delete)
    }
    if (message.currency) {
        console.log('currency:', message.currency)
        changeCurrency(message.currency)
    }
    if (message.changeCurrency) {
        console.log('Change currency')
        let priceDivs = document.getElementsByClassName('schema-product__price');
        let spans = priceDivs[0].getElementsByTagName('span');
        for (span of spans) {
            if (span.getAttribute('data-bind') == "html: $root.format.minPrice($data.prices, 'BYN')") {
                if (span.innerText.includes('$')) {
                    changeCurrency(1)
                } else {
                    changeCurrency(2)
                }
                break;
            }
        }
    }
})
