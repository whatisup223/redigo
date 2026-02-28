// dashboard_bridge.js - Injected into localhost:5173 / redditgo.online ONLY
// This script listens for events from React (window.postMessage) and passes them to Chrome Extension APIs

console.log('🔗 Redigo Dashboard Bridge Connected');

// Global state for heartbeat
let activeUserId = null;
let heartbeatInterval = null;

// Tell the React dashboard "Hey, I am installed!" by setting a data attribute on the DOM.
document.documentElement.setAttribute('data-redigo-extension', 'installed');

// ── EXTENSION PRESENCE PING ─────────────────────────────────────────────────
// Announce presence immediately when the bridge loads (page load / tab refresh)
window.postMessage({ source: 'REDIGO_EXT', type: 'EXTENSION_PONG' }, '*');

function sendHeartbeat(userId) {
    if (!userId) return;
    const token = localStorage.getItem('token');
    if (token) {
        fetch('/api/user/extension-ping', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ userId })
        }).catch(() => { });
    }
}

// Listen for messages from the React app
window.addEventListener('message', (event) => {
    // Basic filter for Redigo messages
    if (!event.data || event.data.source !== 'REDIGO_WEB_APP') return;

    console.log('📬 Bridge Received Message:', event.data.type);

    // ── Handle Presence Detection Request ───────────────────────────────────
    if (event.data.type === 'EXTENSION_PING') {
        window.postMessage({ source: 'REDIGO_EXT', type: 'EXTENSION_PONG' }, '*');

        // Capture userId for heartbeat
        if (event.data.userId) {
            activeUserId = event.data.userId;

            // Immediate heartbeat
            sendHeartbeat(activeUserId);

            // Set up periodic heartbeat (every 5 minutes)
            if (heartbeatInterval) clearInterval(heartbeatInterval);
            heartbeatInterval = setInterval(() => {
                sendHeartbeat(activeUserId);
            }, 5 * 60 * 1000);
        }
    }

    // ── Handle Deploy (Posting/Commenting) ──────────────────────────────────
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
                window.postMessage({ source: 'REDIGO_EXT', type: 'DEPLOY_RESPONSE', payload: response }, '*');
            }
        );
    }
    // ── Handle Search (Fetching posts via Extension) ────────────────────────
    if (event.data.type === 'REDDIT_SEARCH') {
        const { subreddit, keywords, sortBy } = event.data;
        chrome.runtime.sendMessage(
            {
                type: 'REDDIT_SEARCH',
                subreddit,
                keywords,
                sortBy
            },
            (response) => {
                window.postMessage({ source: 'REDIGO_EXT', type: 'SEARCH_RESPONSE', payload: response }, '*');
            }
        );
    }
});
