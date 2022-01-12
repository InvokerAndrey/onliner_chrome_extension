function getMedianOfPrices(prices) {
    if (!prices) return null;
    if(prices.length === 0) return 0;

    prices.sort(function(a,b){
        return a-b;
    });

    let half = Math.floor(prices.length / 2);
    
    if (prices.length % 2)
        return prices[half];

    return (prices[half - 1] + prices[half]) / 2.0;
}


const average = array => array.reduce((a,b) => a + b, 0) / array.length;


function sendRequest(url) {
    return fetch(url).then(response => { return response.json() })
}


function createSpan(div, innerHtml) {
    div.appendChild(document.createElement('br'))
    let elem = document.createElement('span');
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


function displayPrices() {
    const urlParams = new URLSearchParams(window.location.search);
    const page = urlParams.get('page');
    const product_type = window.location.pathname
    const getProductsURL = `https://catalog.onliner.by/sdapi/catalog.api/search${product_type}?group=1&page=${page || 1}`;
    sendRequest(getProductsURL)
        .then(data => {
            keys = []
            for (let k in data.products) {
                if (data.products.hasOwnProperty(k)) {
                    keys.push(data.products[k].key);
                    for (let j = 0; j < data.products[k].children.length; j++) {
                        keys.push(data.products[k].children[j].key)
                    }
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
                avgs.push(sendRequest(url)
                    .then(data => {
                        let prices = []
                        let json_response = data.positions.primary
                        for (let k in json_response) {
                            if (json_response.hasOwnProperty(k)) {
                                prices.push(Number(json_response[k].position_price.amount))
                                product_id = json_response[k].product_url.split('/').pop()
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
                    _id = priceDivs[i].getElementsByTagName('a')[0].href.replace('/prices', '').split('/').pop()
                    try {
                        average_price = prettyAvgs[_id].avg;
                        median_price = prettyAvgs[_id].median;
                        createSpan(priceDivs[i], `Средняя: ${average_price} р.`);
                        createSpan(priceDivs[i], `По медиане: ${median_price} р.`);
                    } catch {
                        continue;
                    }
                }
            }
        })
        .catch(error => console.error(error))
}


window.onload = (event) => {
    console.log('True price injected!');
    displayPrices()
}
