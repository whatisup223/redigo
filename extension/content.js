// content.js - Injected ONLY into reddit.com pages
console.log('🛡️ Redigo Security Engine connected to Reddit tab.');

chrome.storage.local.get(['redigo_assistant_draft'], (res) => {
  if (res.redigo_assistant_draft) {
    const { title, text, imageUrl } = res.redigo_assistant_draft;
    injectFloatingAssistant(title, text, imageUrl, true);
  }
});

function injectFloatingAssistant(title, text, imageUrl, fromStorage = false) {
  // Prevent duplicate injections
  if (document.getElementById('redigo-assistant-root')) return;

  if (!fromStorage) {
    chrome.storage.local.set({ redigo_assistant_draft: { title, text, imageUrl } });
  }

  const style = document.createElement('style');
  style.textContent = `
    #redigo-assistant-root {
      position: fixed; bottom: 20px; right: 20px; z-index: 999999;
      background: white; border-radius: 16px; box-shadow: 0 10px 40px rgba(0,0,0,0.15);
      width: 320px; font-family: 'Segoe UI', system-ui, sans-serif;
      border: 1px solid #f1f5f9; overflow: hidden;
      animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes slideIn { from { transform: translateY(100px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    .redigo-header {
      background: #ea580c; color: white; padding: 12px 16px;
      display: flex; justify-content: space-between; align-items: center; font-weight: 600; font-size: 14px;
    }
    .redigo-close { cursor: pointer; opacity: 0.8; }
    .redigo-close:hover { opacity: 1; }
    .redigo-body { padding: 16px; display: flex; flex-direction: column; gap: 12px; }
    .redigo-btn {
      display: flex; align-items: center; gap: 8px; justify-content: center;
      background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px; border-radius: 8px;
      font-weight: 600; color: #334155; cursor: pointer; transition: all 0.2s; font-size: 13px; width: 100%;
    }
    .redigo-btn:hover { background: #ea580c; border-color: #ea580c; color: white; }
    .redigo-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #94a3b8; font-weight: 700; margin-bottom: -4px;}
    .redigo-toast {
      position: absolute; top: 10px; left: 50%; transform: translateX(-50%);
      background: #22c55e; color: white; padding: 4px 12px; border-radius: 20px;
      font-size: 11px; font-weight: bold; opacity: 0; transition: opacity 0.3s; pointer-events: none;
    }
    .redigo-toast.show { opacity: 1; }
  `;
  document.head.appendChild(style);

  const container = document.createElement('div');
  container.id = 'redigo-assistant-root';

  container.innerHTML = `
    <div class="redigo-toast" id="redigo-toast">Copied!</div>
    <div class="redigo-header">
      <div style="display:flex; align-items:center; gap:8px;">
        <span style="font-size:16px;">🛡️</span> Redigo Assistant
      </div>
      <div class="redigo-close" id="redigo-close">✕</div>
    </div>
    <div class="redigo-body">
      ${title ? `
        <span class="redigo-label">Title</span>
        <button class="redigo-btn" id="redigo-copy-title">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
          Copy Post Title
        </button>
      ` : ''}
      
      ${text ? `
        <span class="redigo-label">Content</span>
        <button class="redigo-btn" id="redigo-copy-text">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
          Copy Post Body
        </button>
      ` : ''}

      ${imageUrl ? `
        <span class="redigo-label">Image</span>
        <img src="${imageUrl}" style="width:100%; border-radius:8px; margin-bottom:-4px; border:1px solid #e2e8f0; object-fit: cover; max-height: 180px;" />
        <button class="redigo-btn" id="redigo-download-img">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          Download Image
        </button>
      ` : ''}
      
      <div style="font-size: 11px; color:#64748b; text-align:center; display:flex; gap: 4px; align-items:center; justify-content:center; margin-top:4px;">
         <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
         Click to copy, then paste in Reddit's boxes.
      </div>
    </div>
  `;

  document.body.appendChild(container);

  const showToast = (msg = 'Copied!') => {
    const t = document.getElementById('redigo-toast');
    t.innerText = typeof msg === 'string' ? msg : 'Copied!';
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


chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'PASTE_REPLY') {
    const textToPaste = request.text;
    const titleToPaste = request.title;
    const imageUrl = request.imageUrl;

    // Inject the beautiful helper UI
    injectFloatingAssistant(titleToPaste, textToPaste, imageUrl);
  }
});
