// background.js - Listens to messages from the Dashboard Bridge and handles tab creation
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'REDIGO_VERIFY_INSTALL') {
        sendResponse({ installed: true, version: chrome.runtime.getManifest().version });
    }

    if (request.type === 'REDIGO_DEPLOY') {
        const { text, targetUrl } = request;

        // 1. Create a new tab with the target Reddit post URL
        chrome.tabs.create({ url: targetUrl, active: true }, (newTab) => {

            // 2. We must wait until the tab has finished loading before sending it the payload
            const listener = (tabId, changeInfo) => {
                if (tabId === newTab.id && changeInfo.status === 'complete') {
                    chrome.tabs.onUpdated.removeListener(listener);

                    // 3. Send the text payload to the content.js injected in that Reddit tab
                    setTimeout(() => {
                        chrome.tabs.sendMessage(newTab.id, {
                            type: 'PASTE_REPLY',
                            text: text,
                            title: request.title,
                            imageUrl: request.imageUrl,
                            isPost: request.isPost
                        });
                    }, 1500); // 1.5s delay to ensure Reddit's heavy JS has populated the DOM
                }
            };

            chrome.tabs.onUpdated.addListener(listener);
        });

        sendResponse({ status: 'DEPLOYING', message: 'Opening Reddit tab' });
    }

    return true; // Keep message channel open for async response
});
