// ==UserScript==
// @name            SearchBar
// @description     Adds icons next to Google's search bar which let you search from other sites.
// @match   https://www.google.com/search*
// ==/UserScript==

const newButtonsList = [
    [ 'Yandex', 'https://yandex.com/', 'search/?text=', 'https://www.google.com/s2/favicons?domain=yandex.com&sz=32'],
    [ 'Bing', 'https://www.bing.com/', 'search?q=', 'https://www.google.com/s2/favicons?domain=bing.com&sz=32'],
    [ 'DuckDuckGo', 'https://duckduckgo.com/', '?q=', 'https://www.google.com/s2/favicons?domain=duckduckgo.com&sz=32'],
    [ 'Startpage', 'https://www.startpage.com/', 'do/search?q=', 'https://www.google.com/s2/favicons?domain=startpage.com&sz=32'],
    [ 'Brave Search', 'https://search.brave.com/', 'search?q=', 'https://www.google.com/s2/favicons?domain=brave.com&sz=32'],
    [ 'Qwant', 'https://www.qwant.com/', '?q=', 'https://www.google.com/s2/favicons?domain=qwant.com&sz=32'],
    [ 'Searx', 'https://search.inetol.net/', 'search?q=', 'https://search.inetol.net/favicon.ico'],
    [ 'Yahoo', 'https://search.yahoo.com/', 'search?p=', 'https://www.google.com/s2/favicons?domain=yahoo.com&sz=32'],
    [ 'Perplexity', 'https://www.perplexity.ai/', 'search?q=', 'https://www.google.com/s2/favicons?domain=perplexity.ai&sz=32'],
    [ 'Ecosia', 'https://www.ecosia.org/', 'search?q=', 'https://www.google.com/s2/favicons?domain=ecosia.org&sz=32'],
    [ 'Reddit', 'https://www.reddit.com/', 'search?q=', 'https://www.google.com/s2/favicons?domain=reddit.com&sz=32'],
    [ 'Medium', 'https://medium.com/', 'search?q=', 'https://www.google.com/s2/favicons?domain=medium.com&sz=32'],
    [ 'Wikipedia', 'https://en.wikipedia.org/', 'wiki/Special:Search?search=', 'https://www.google.com/s2/favicons?domain=wikipedia.org&sz=32'],
    [ 'ChatGPT', 'https://chat.openai.com/', '?q=', 'https://www.google.com/s2/favicons?domain=openai.com&sz=32'],
    [ 'Quora', 'https://www.quora.com/', 'search?q=', 'https://www.google.com/s2/favicons?domain=quora.com&sz=32'],
    [ 'Github ', 'https://github.com/', 'search?q=', 'https://www.google.com/s2/favicons?domain=github.com&sz=32'],
    [ 'Stack Overflow', 'https://stackoverflow.com/', 'search?q=', 'https://www.google.com/s2/favicons?domain=stackoverflow.com&sz=32'],
    [ 'LibGen', 'https://libgen.is/', 'search.php?req=', 'https://libgen.is/favicon.ico']
]
let searchForm = document.querySelector('*[name="q"]');
let searchTerms = searchForm.value;

if (searchForm) {
    searchForm.addEventListener('input', function(event) {
        searchTerms = event.target.value;
        letsRock(true);
    });
}

let newButtonsHTML = ''

function makeButtonsHTML() {
    newButtonsHTML = '<div class="customSearch">';
    for ( var i = 0; i < newButtonsList.length; i++ ) {
        newButtonsHTML = newButtonsHTML.concat( '<a title="', newButtonsList[i][0], '" class="customSearchItem" href="', newButtonsList[i][1] );
        if (searchTerms) { newButtonsHTML = newButtonsHTML.concat( newButtonsList[i][2], encodeURIComponent(searchTerms) ) }
        newButtonsHTML = newButtonsHTML.concat( '" target="_self"><span><img src="', newButtonsList[i][3], '" /></span></a>');
    }
    newButtonsHTML = newButtonsHTML.concat( '</div>' );
}

function letsRock(update) {
    var container = document.querySelector('.customSearch');
    if (!update && container ) { return }
    makeButtonsHTML();
    var insertHere = document.querySelector('button[aria-label="Search"]') || document.querySelector('button[aria-label="Google Search"]') || document.querySelector('div[aria-label="Search by image"]');
    if (container) { container.remove() }
    insertHere.insertAdjacentHTML('afterend', newButtonsHTML);
}

const bodyColor = window.getComputedStyle(document.querySelector('body')).backgroundColor;

const buttonWidth = Math.ceil(newButtonsList.length / 2) * 16;

document.body.appendChild(document.createElement('style')).textContent = `
    .customSearch {
        position: relative;
        left: 10px;
        display: flex;
        flex-flow: column wrap;
        align-items: center;
        justify-content: space-around;
        gap: 4px;
        height: 44px;
        width: 0;
        padding: 0;
    }
    .customSearchItem:hover {
    transform: scale(1.5);
    z-index: 1;
    }
    .customSearchItem {
        display: flex;
        height: 18px;
        width: 18px;
        padding: 1px 5px;
        margin: 0px;
        transition: transform 0.1s ease-out;
    }
    .customSearchItem svg,
    .customSearchItem img,
    .customSearchItem > span {
        height: 16px;
        width: 16px;
    }
    /* .minidiv = when search box is fixed to the top after scrolling down  */
    .minidiv .RNNXgb {
        margin-top: 10px !important;
        height: 32px !important;
    }
    .minidiv .customSearch {
        margin: -6px 0;
    }
    /* for Google.com home page */
    div[aria-label="Search by image"] + .customSearch {
        left: 20px;
    }
    /* centering on home page  */
    .o3j99.ikrT4e.om7nvf .A8SBwf[jscontroller="cnjECf"] {
        position: relative;
        left: -`+ buttonWidth +`px;
    }
    .o3j99.ikrT4e.om7nvf .FPdoLc.lJ9FBc {
        position: relative;
        left: `+ buttonWidth +`px;
    }
    /* for Google doodle underneath buttons  */
    .customSearch:before {
        z-index: -1;
        position: absolute;
        left: 0;
        content: "";
        background-color: `+ bodyColor +`;
        opacity: .8;
        width: `+ (buttonWidth * 2) +`px;
        height: 55px;
    }
    .minidiv .customSearch:before {
        opacity: 0;
    }
`;

letsRock();
