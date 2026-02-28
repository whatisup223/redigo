// dashboard_bridge.js - Injected into localhost:5173 / redditgo.online ONLY
// This script listens for events from React (window.postMessage) and passes them to Chrome Extension APIs

console.log('🔗 Redigo Dashboard Bridge Connected');

// Tell the React dashboard "Hey, I am installed!" by setting a data attribute on the DOM.
// This avoids Chrome Extension Manifest V3 Content Security Policy (CSP) errors.
document.documentElement.setAttribute('data-redigo-extension', 'installed');

// Listen for messages from the React app
window.addEventListener('message', (event) => {
    // Security check: Ignore messages from untrusted sources
    if (event.source !== window || !event.data || event.data.source !== 'REDIGO_WEB_APP') {
        return;
    }

    // Pass it to the background script
    if (event.data.type === 'REDIGO_DEPLOY') {
        chrome.runtime.sendMessage(
            {
                type: 'REDIGO_DEPLOY',
                text: event.data.text,
                title: event.data.title,
                imageUrl: event.data.imageUrl,
                targetUrl: event.data.targetUrl,
                isPost: event.data.isPost || false
            },
            (response) => {
                // Send the response back to React
                window.postMessage({ source: 'REDIGO_EXT', type: 'DEPLOY_RESPONSE', payload: response }, '*');
            }
        );
    }
});
