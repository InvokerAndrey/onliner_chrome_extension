window.onload = (event) => {
    console.log('True price injected!!')

    let priceDivs = document.getElementsByClassName('schema-product__price');

    for (let i = 0; i < priceDivs.length; i++) {
        let spans = priceDivs[i].getElementsByTagName('span');
        let price = null
        for (let j = 0; j < spans.length; j++) {
            if (spans[j].getAttribute('data-bind') == "html: $root.format.minPrice($data.prices, 'BYN')") {
                price = spans[j].innerText
            }
        }
        if (price) {
            let elem = document.createElement('span');
            elem.innerHTML = '| Средняя цена: ' + price
            priceDivs[i].appendChild(elem)
            console.log(elem.innerHTML)
        }
    }
};
