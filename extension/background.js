// background.js - Listens to messages from the Dashboard Bridge and handles tab creation
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'REDIGO_VERIFY_INSTALL') {
        sendResponse({ installed: true, version: chrome.runtime.getManifest().version });
    }

    if (request.type === 'REDIGO_DEPLOY') {
        const { text, targetUrl, itemId, userId } = request;

        // Set a loading flag so content.js can show a "Loading" indicator immediately
        chrome.storage.local.set({ redigo_loading: true });

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
                            itemId: itemId,
                            userId: userId,
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

    // ── NEW: Analytics Handlers ──────────────────────────────────────────────

    if (request.type === 'UPDATE_KARMA') {
        chrome.storage.local.get(['redigo_user_id', 'redigo_token'], (res) => {
            if (res.redigo_user_id && res.redigo_token) {
                fetch('https://redditgo.online/api/user/update-karma', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${res.redigo_token}`
                    },
                    body: JSON.stringify({ userId: res.redigo_user_id, karma: request.karma })
                }).catch(() => {
                    // Fallback for localhost dev if needed
                    fetch('http://localhost:3001/api/user/update-karma', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userId: res.redigo_user_id, karma: request.karma })
                    }).catch(() => { });
                });
            }
        });
    }

    if (request.type === 'OUTREACH_CONFIRM') {
        chrome.storage.local.get(['redigo_user_id', 'redigo_token'], (res) => {
            if (res.redigo_user_id && res.redigo_token) {
                fetch('https://redditgo.online/api/outreach/confirm', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${res.redigo_token}`
                    },
                    body: JSON.stringify({
                        itemId: request.itemId,
                        userId: request.userId,
                        type: request.itemType, // Use corrected itemType
                        permalink: sender.tab.url // Capture the URL where they clicked
                    })
                }).catch(() => {
                    fetch('http://localhost:3001/api/outreach/confirm', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            itemId: request.itemId,
                            userId: request.userId,
                            type: request.itemType,
                            permalink: sender.tab.url
                        })
                    }).catch(() => { });
                });
            }
        });
    }

    if (request.type === 'FETCH_REDDIT_STATS') {
        // Use Reddit's Public JSON API (Unauthenticated & Legal)
        const url = request.url.split('?')[0].replace(/\/$/, '') + '.json';
        fetch(url)
            .then(r => r.json())
            .then(data => {
                let ups = 0, replies = 0;

                // Reddit JSON structure varies for posts vs comments
                if (Array.isArray(data)) {
                    // Post or Comment thread
                    const main = data[0].data.children[0].data;
                    ups = main.ups;
                    replies = main.num_comments || 0;
                } else {
                    ups = data.data.children[0].data.ups;
                }

                // Update Backend
                chrome.storage.local.get(['redigo_user_id', 'redigo_token'], (res) => {
                    if (res.redigo_user_id && res.redigo_token) {
                        fetch('https://redditgo.online/api/outreach/update-stats', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${res.redigo_token}`
                            },
                            body: JSON.stringify({
                                itemId: request.itemId,
                                userId: res.redigo_user_id,
                                type: request.itemType, // Use correct item type
                                ups,
                                replies
                            })
                        }).catch(() => { });
                    }
                });

                sendResponse({ success: true, ups, replies });
            })
            .catch(e => sendResponse({ success: false, error: e.message }));
        return true;
    }

    if (request.type === 'REDDIT_SEARCH') {
        const { subreddit, keywords, sortBy } = request;
        const searchUrl = `https://www.reddit.com/r/${subreddit}/search.json?q=${encodeURIComponent(keywords)}&restrict_sr=on&sort=${sortBy || 'new'}&t=all&limit=100`;

        fetch(searchUrl)
            .then(response => {
                if (!response.ok) throw new Error(`Reddit error: ${response.status}`);
                return response.json();
            })
            .then(data => {
                sendResponse({ success: true, data });
            })
            .catch(error => {
                console.error('Extension Search Error:', error);
                sendResponse({ success: false, error: error.message });
            });
        return true;
    }

    if (request.type === 'DOWNLOAD_IMAGE') {
        chrome.downloads.download({
            url: request.url,
            filename: `redigo-image-${Date.now()}.png`
        }, (downloadId) => {
            if (chrome.runtime.lastError) {
                sendResponse({ success: false, error: chrome.runtime.lastError.message });
            } else {
                sendResponse({ success: true, downloadId });
            }
        });
        return true;
    }

    return true; // Keep message channel open for async response
});
