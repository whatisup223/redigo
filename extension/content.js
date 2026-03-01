// content.js - Injected ONLY into reddit.com pages
console.log('🛡️ Redigo Security Engine connected to Reddit tab.');

chrome.storage.local.get(['redigo_assistant_draft', 'redigo_loading'], (res) => {
  if (res.redigo_assistant_draft) {
    const { title, text, imageUrl } = res.redigo_assistant_draft;
    injectFloatingAssistant(title, text, imageUrl, true);
  } else if (res.redigo_loading) {
    showRedigoLoader();
  }
});

function showRedigoLoader() {
  if (document.getElementById('redigo-loader-root')) return;
  const loader = document.createElement('div');
  loader.id = 'redigo-loader-root';
  loader.innerHTML = `
    <div class="redigo-loader-container">
      <div class="redigo-loader-spinner"></div>
      <div class="redigo-loader-logo">🛡️</div>
      <div class="redigo-loader-text">Redigo is preparing...</div>
    </div>
    <style>
      #redigo-loader-root {
        position: fixed; bottom: 30px; right: 30px; z-index: 9999999;
        font-family: 'Segoe UI', system-ui, sans-serif;
        pointer-events: none;
      }
      .redigo-loader-container {
        background: white; padding: 10px 20px; border-radius: 50px;
        box-shadow: 0 10px 40px rgba(234, 88, 12, 0.2);
        display: flex; align-items: center; gap: 12px;
        border: 2px solid #ea580c;
        animation: redigoPulse 2s infinite ease-in-out;
      }
      .redigo-loader-spinner {
        width: 18px; height: 18px; border: 3px solid #f3f3f3;
        border-top: 3px solid #ea580c; border-radius: 50%;
        animation: redigoSpin 1s linear infinite;
      }
      .redigo-loader-logo { font-size: 18px; }
      .redigo-loader-text { font-size: 12px; font-weight: 800; color: #ea580c; text-transform: uppercase; letter-spacing: 0.5px; }
      @keyframes redigoSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      @keyframes redigoPulse { 0%, 100% { transform: scale(1); opacity: 0.9; } 50% { transform: scale(1.05); opacity: 1; } }
    </style>
  `;
  document.body.appendChild(loader);

  // Failsafe: Remove loader after 10s if injection doesn't happen
  setTimeout(() => {
    const l = document.getElementById('redigo-loader-root');
    if (l) {
      l.remove();
      chrome.storage.local.set({ redigo_loading: false });
    }
  }, 10000);
}

function injectFloatingAssistant(title, text, imageUrl, fromStorage = false) {
  // Remove loading indicator if exists
  const loader = document.getElementById('redigo-loader-root');
  if (loader) loader.remove();
  chrome.storage.local.set({ redigo_loading: false });

  // Prevent duplicate injections
  if (document.getElementById('redigo-assistant-root')) return;

  if (!fromStorage) {
    chrome.storage.local.set({ redigo_assistant_draft: { title, text, imageUrl } });
  }

  const style = document.createElement('style');
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800&display=swap');

    #redigo-assistant-root {
      position: fixed; bottom: 24px; right: 24px; z-index: 999999;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border-radius: 24px;
      box-shadow: 0 20px 50px rgba(30, 41, 59, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.5);
      width: 340px; font-family: 'Outfit', 'Segoe UI', system-ui, sans-serif;
      border: 1px solid rgba(226, 232, 240, 0.8);
      overflow: hidden;
      animation: redigoSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes redigoSlideUp { from { transform: translateY(40px) scale(0.95); opacity: 0; } to { transform: translateY(0) scale(1); opacity: 1; } }

    .redigo-header {
      background: linear-gradient(135deg, #ea580c 0%, #f97316 100%);
      color: white; padding: 16px 20px;
      display: flex; justify-content: space-between; align-items: center; 
      font-weight: 800; font-size: 15px; letter-spacing: -0.02em;
      box-shadow: 0 4px 12px rgba(234, 88, 12, 0.2);
    }

    .redigo-close { 
      cursor: pointer; background: rgba(255,255,255,0.2); 
      width: 24px; height: 24px; border-radius: 8px; 
      display: flex; align-items: center; justify-content: center;
      transition: all 0.2s; font-size: 10px;
    }
    .redigo-close:hover { background: rgba(255,255,255,0.3); transform: rotate(90deg); }

    .redigo-body { padding: 20px; display: flex; flex-direction: column; gap: 14px; }

    .redigo-btn {
      display: flex; align-items: center; gap: 10px; justify-content: center;
      background: #ffffff; border: 1.5px solid #f1f5f9; padding: 12px; border-radius: 14px;
      font-weight: 700; color: #1e293b; cursor: pointer; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      font-size: 13px; width: 100%; box-shadow: 0 2px 4px rgba(0,0,0,0.02);
    }
    .redigo-btn:hover { 
      background: #f8fafc; border-color: #ea580c; color: #ea580c; 
      transform: translateY(-2px); box-shadow: 0 8px 15px rgba(234, 88, 12, 0.1);
    }
    .redigo-btn:active { transform: translateY(0); }
    .redigo-btn svg { transition: transform 0.2s; }
    .redigo-btn:hover svg { transform: scale(1.1); }

    .redigo-label { 
      font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; 
      color: #94a3b8; font-weight: 800; margin-bottom: -6px; margin-left: 2px;
    }

    .redigo-toast {
      position: absolute; top: 70px; left: 50%; transform: translateX(-50%) translateY(-10px);
      background: rgba(34, 197, 94, 0.95); backdrop-filter: blur(4px);
      color: white; padding: 8px 16px; border-radius: 12px;
      font-size: 12px; font-weight: 800; opacity: 0; transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      pointer-events: none; z-index: 100; box-shadow: 0 10px 20px rgba(34, 197, 94, 0.3);
      display: flex; align-items: center; gap: 6px;
    }
    .redigo-toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }
    
    .redigo-image-container {
      width: 100%; border-radius: 16px; overflow: hidden; 
      border: 1px solid #f1f5f9; margin-bottom: -4px; position: relative;
    }
    .redigo-image-preview { width: 100%; height: 160px; object-fit: cover; display: block; }
  `;
  document.head.appendChild(style);

  const container = document.createElement('div');
  container.id = 'redigo-assistant-root';

  container.innerHTML = `
    <div class="redigo-toast" id="redigo-toast">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
      Copied!
    </div>
    <div class="redigo-header">
      <div style="display:flex; align-items:center; gap:10px;">
        <div style="background:white; border-radius:8px; width:28px; height:28px; display:flex; align-items:center; justify-content:center; color:#ea580c; font-size:14px; box-shadow: 0 2px 6px rgba(0,0,0,0.1);">🛡️</div>
        <span>REDIGO ASSISTANT</span>
      </div>
      <div class="redigo-close" id="redigo-close">✕</div>
    </div>
    <div class="redigo-body">
      ${title ? `
        <span class="redigo-label">Headline</span>
        <button class="redigo-btn" id="redigo-copy-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
          Copy Title
        </button>
      ` : ''}
      
      ${text ? `
        <span class="redigo-label">Thread Content</span>
        <button class="redigo-btn" id="redigo-copy-text">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
          Copy Post Body
        </button>
      ` : ''}

      ${imageUrl ? `
        <span class="redigo-label">Creative Asset</span>
        <div class="redigo-image-container">
          <img src="${imageUrl}" class="redigo-image-preview" />
        </div>
        <button class="redigo-btn" id="redigo-download-img" style="background:#ea580c; color:white; border:none; box-shadow: 0 4px 15px rgba(234, 88, 12, 0.25);">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          Download Image
        </button>
      ` : ''}
      
      <div style="font-size: 11px; color:#94a3b8; text-align:center; display:flex; flex-direction:column; gap: 4px; align-items:center; justify-content:center; margin-top:6px; font-weight:600;">
         <div style="display:flex; gap:6px; align-items:center;">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
            <span>Click to copy, then paste in Reddit.</span>
         </div>
         <div style="color:#ea580c; font-size:10px; text-transform:uppercase; letter-spacing:0.5px;">💡 Use "Markdown Mode" on Reddit for links</div>
      </div>
    </div>
  `;

  document.body.appendChild(container);

  const showToast = (msg = 'Copied!') => {
    const t = document.getElementById('redigo-toast');
    const content = typeof msg === 'string' ? msg : 'Copied!';
    t.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> ${content}`;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2000);
  };

  const copyToClipboard = (content) => {
    navigator.clipboard.writeText(content).then(() => {
      showToast();
    }).catch(err => {
      console.error('Failed to copy', err);
      prompt("Oops! Your browser blocked auto-copy. Copy from here:", content);
    });
  };

  if (title) {
    document.getElementById('redigo-copy-title').addEventListener('click', () => copyToClipboard(title));
  }
  if (text) {
    document.getElementById('redigo-copy-text').addEventListener('click', () => copyToClipboard(text));
  }
  if (imageUrl) {
    document.getElementById('redigo-download-img').addEventListener('click', () => {
      chrome.runtime.sendMessage({ type: 'DOWNLOAD_IMAGE', url: imageUrl }, (response) => {
        if (response && response.success) {
          showToast("Downloading...");
        } else {
          showToast("Download Failed!");
          console.error("Download Error", response?.error);
        }
      });
    });
  }

  document.getElementById('redigo-close').addEventListener('click', () => {
    document.getElementById('redigo-assistant-root').remove();
    chrome.storage.local.remove('redigo_assistant_draft');
  });
}


// --- Analytics & Karma Tracking ---
let currentDraftId = null;
let currentDraftType = null;
let currentDraftUserId = null;

// Scrape Karma once on load (and whenever it might change)
function scrapeKarma() {
  try {
    // Newer Reddit (Shreddit) / Old Reddit compatibility
    let karmaValue = -1;

    // Attempt 1: Look for karma count in the top right menu
    const karmaElements = [
      ...document.querySelectorAll('[id*="karma"]'),
      ...document.querySelectorAll('span[id*="total-karma"]')
    ];

    if (karmaElements.length > 0) {
      const text = karmaElements[0].innerText.replace(/[^0-9-]/g, '');
      karmaValue = parseInt(text);
    }

    // Attempt 2: If we are on the user profile or menu is open
    if (isNaN(karmaValue) || karmaValue === -1) {
      // Just fallback to looking at any element that looks like a karma number
      // (This is a bit loose, but it's a fallback)
    }

    if (!isNaN(karmaValue) && karmaValue !== -1) {
      chrome.runtime.sendMessage({ type: 'UPDATE_KARMA', karma: karmaValue });
    }
  } catch (e) {
    console.warn('Redigo: Karma scrape failed', e);
  }
}

// Detection of "Post" or "Comment" button clicks
document.addEventListener('click', (e) => {
  // Find if click was on a button that contains "Comment" or "Post"
  const btn = e.target.closest('button');
  if (!btn) return;

  const text = btn.innerText.toLowerCase();

  // Logic: If we recently injected a draft, and the user clicks "Comment"
  if ((text.includes('comment') || text.includes('post') || text.includes('reply')) && currentDraftId) {
    console.log('🛡️ Redigo: Publication detected! Notifying dashboard...');

    // We wait a bit for the post to actually "go through"
    setTimeout(() => {
      // Try to find the permalink of the last comment added (this is tricky on Reddit)
      // For now, we communicate the SUCCESS. The link can be fetched 
      // by the user refreshing or by the extension looking for the newest comment by "Self"
      chrome.runtime.sendMessage({
        type: 'OUTREACH_CONFIRM',
        itemId: currentDraftId,
        userId: currentDraftUserId,
        itemType: currentDraftType
      });

      // Clear draft tracking
      currentDraftId = null;
    }, 2000);
  }
}, true);

// Run initial karma scrape
setTimeout(scrapeKarma, 3000);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'PASTE_REPLY') {
    const textToPaste = request.text;
    const titleToPaste = request.title;
    const imageUrl = request.imageUrl;

    // Store for tracking
    currentDraftId = request.itemId; // These need to be passed from dashboard
    currentDraftType = request.isPost ? 'post' : 'comment';
    currentDraftUserId = request.userId;

    // Inject the beautiful helper UI
    injectFloatingAssistant(titleToPaste, textToPaste, imageUrl);
  }

  if (request.type === 'FETCH_LIVE_STATS') {
    // This allows the background script to ask the content script 
    // to fetch stats for a specific URL it's currently on (not used yet but good for later)
  }
});
