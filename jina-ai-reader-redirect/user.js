// ==UserScript==
// @name         Jina AI Reader Redirect
// @namespace    none
// @version      0.1
// @description  Press Ctrl+Alt+Q to redirect the current page to its Jina AI Reader version.
// @match        *://*/*
// ==/UserScript==

(function() {
    'use strict';
    const redirectUrlBase = 'https://r.jina.ai/';
    document.addEventListener('keydown', function(event) {
        if (event.ctrlKey && event.altKey && event.key.toLowerCase() === 'q') {
            event.preventDefault();
            const currentUrl = window.location.href;
            const newUrl = redirectUrlBase + currentUrl;
            console.log(`Redirecting to Jina AI Reader: ${newUrl}`);
            window.location.href = newUrl;
        }
    });
})();
