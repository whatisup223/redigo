// content.js - Injected ONLY into reddit.com pages
console.log('🛡️ Redigo Security Engine connected to Reddit tab.');

let currentDraftId = null;
let currentDraftType = null;
let currentDraftUserId = null;

chrome.storage.local.get(['redigo_assistant_draft', 'redigo_loading'], (res) => {
  if (res.redigo_assistant_draft) {
    const { title, text, imageUrl, itemId, userId, isPost } = res.redigo_assistant_draft;
    currentDraftId = itemId;
    currentDraftType = isPost ? 'post' : 'comment';
    currentDraftUserId = userId;
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

  setTimeout(() => {
    const l = document.getElementById('redigo-loader-root');
    if (l) {
      l.remove();
      chrome.storage.local.set({ redigo_loading: false });
    }
  }, 10000);
}

function injectFloatingAssistant(title, text, imageUrl, fromStorage = false) {
  const loader = document.getElementById('redigo-loader-root');
  if (loader) loader.remove();
  chrome.storage.local.set({ redigo_loading: false });

  if (document.getElementById('redigo-assistant-root')) return;

  if (!fromStorage) {
    chrome.storage.local.set({
      redigo_assistant_draft: {
        title, text, imageUrl,
        itemId: currentDraftId,
        userId: currentDraftUserId,
        isPost: currentDraftType === 'post'
      }
    });
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
    .redigo-btn:hover:not(:disabled) { 
      background: #f8fafc; border-color: #ea580c; color: #ea580c; 
      transform: translateY(-2px); box-shadow: 0 8px 15px rgba(234, 88, 12, 0.1);
    }
    .redigo-btn:disabled { opacity: 0.5; cursor: not-allowed; }

    .redigo-btn-confirm {
      background: #f1f5f9; color: #94a3b8; border: none; margin-top: 6px;
    }

    .redigo-glow-pulse {
      animation: redigoGlow 2s infinite !important;
      background: #10b981 !important;
      color: white !important;
      box-shadow: 0 0 20px rgba(16, 185, 129, 0.4) !important;
    }

    @keyframes redigoGlow {
      0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); transform: scale(1); }
      70% { box-shadow: 0 0 0 12px rgba(16, 185, 129, 0); transform: scale(1.02); }
      100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); transform: scale(1); }
    }

    .redigo-label { 
      font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; 
      color: #94a3b8; font-weight: 800; margin-bottom: -6px; margin-left: 2px;
    }

    .redigo-toast {
      position: absolute; top: 70px; left: 50%; transform: translateX(-50%) translateY(-10px);
      background: rgba(34, 197, 94, 0.95); backdrop-filter: blur(4px);
      color: white; padding: 8px 16px; border-radius: 12px;
      font-size: 12px; font-weight: 800; opacity: 0; transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      pointer-events: none; z-index: 100;
    }
    .redigo-toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }
  `;
  document.head.appendChild(style);

  const container = document.createElement('div');
  container.id = 'redigo-assistant-root';

  container.innerHTML = `
    <div class="redigo-toast" id="redigo-toast">Copied!</div>
    <div class="redigo-header">
      <div style="display:flex; align-items:center; gap:10px;">
        <div style="background:white; border-radius:8px; width:28px; height:28px; display:flex; align-items:center; justify-content:center; color:#ea580c; font-size:14px;">🛡️</div>
        <span>REDIGO ASSISTANT</span>
      </div>
      <div class="redigo-close" id="redigo-close">✕</div>
    </div>
    <div class="redigo-body">
      ${title ? `
        <span class="redigo-label">Headline</span>
        <button class="redigo-btn" id="redigo-copy-title">Copy Title</button>
      ` : ''}
      
      ${text ? `
        <span class="redigo-label">Content</span>
        <button class="redigo-btn" id="redigo-copy-text">Copy Post Body</button>
      ` : ''}

      ${imageUrl ? `
        <span class="redigo-label">Asset</span>
        <button class="redigo-btn" id="redigo-download-img" style="background:#ea580c; color:white; border:none;">Download Image</button>
      ` : ''}
      
      <div style="height: 1px; background: #f1f5f9; margin: 4px 0;"></div>

      <button class="redigo-btn redigo-btn-confirm" id="redigo-confirm-sent" disabled>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
        Confirm Publication
      </button>

      <div style="font-size: 10px; color:#94a3b8; text-align:center; font-weight:600;">
         Confirm after posting to track in Analytics
      </div>
    </div>
  `;

  document.body.appendChild(container);

  const showToast = (msg = 'Copied!') => {
    const t = document.getElementById('redigo-toast');
    t.innerText = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2000);
  };

  const activateConfirmButton = () => {
    const btn = document.getElementById('redigo-confirm-sent');
    if (btn && btn.disabled) {
      btn.disabled = false;
      btn.classList.add('redigo-glow-pulse');
    }
  };

  if (title) {
    document.getElementById('redigo-copy-title').addEventListener('click', () => {
      navigator.clipboard.writeText(title).then(() => {
        showToast();
        activateConfirmButton();
      });
    });
  }
  if (text) {
    document.getElementById('redigo-copy-text').addEventListener('click', () => {
      navigator.clipboard.writeText(text).then(() => {
        showToast();
        activateConfirmButton();
      });
    });
  }
  if (imageUrl) {
    document.getElementById('redigo-download-img').addEventListener('click', () => {
      chrome.runtime.sendMessage({ type: 'DOWNLOAD_IMAGE', url: imageUrl }, (response) => {
        if (response?.success) {
          showToast("Downloading...");
          activateConfirmButton();
        }
      });
    });
  }

  document.getElementById('redigo-confirm-sent').addEventListener('click', () => {
    const btn = document.getElementById('redigo-confirm-sent');
    btn.classList.remove('redigo-glow-pulse');
    btn.innerHTML = 'Confirmed ✓';
    btn.style.background = '#10b981';
    btn.style.color = 'white';
    btn.disabled = true;

    chrome.runtime.sendMessage({
      type: 'OUTREACH_CONFIRM',
      itemId: currentDraftId,
      userId: currentDraftUserId,
      itemType: currentDraftType,
      url: window.location.href
    });

    setTimeout(() => {
      document.getElementById('redigo-assistant-root').remove();
      chrome.storage.local.remove('redigo_assistant_draft');
    }, 1500);
  });

  document.getElementById('redigo-close').addEventListener('click', () => {
    document.getElementById('redigo-assistant-root').remove();
    chrome.storage.local.remove('redigo_assistant_draft');
  });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'PASTE_REPLY') {
    currentDraftId = request.itemId;
    currentDraftType = request.isPost ? 'post' : 'comment';
    currentDraftUserId = request.userId;
    injectFloatingAssistant(request.title, request.text, request.imageUrl);
  }
});
