
window.onload = (event) => {
    let priceDivs = document.getElementsByClassName('schema-product__price');

    for (let i = 0; i < priceDivs.length; i++) {
        let spans = priceDivs[i].getElementsByTagName('span');
        for (let j = 0; j < spans.length; j++) {
            if (spans[j].getAttribute('data-bind') == "html: $root.format.minPrice($data.prices, 'BYN')") {
                spans[j].innerText += 'ASD'
            }
        }
    }
};