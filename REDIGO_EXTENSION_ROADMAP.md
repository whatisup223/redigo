# Redigo Extension Pivot Roadmap

## 🎯 The Goal
Transition Redigo from a centralized Reddit OAuth API model to a decentralized, secure "SaaS + Chrome Extension" hybrid model. This ensures 100% protection against Reddit API bans by acting as a Human-in-the-loop system while maintaining all our AI and Analytics capabilities.

## 🛑 Strict Rule
Do NOT skip any step. Every step MUST be implemented and verified to work 100% before moving to the next. No improvisations.

---

## 🛠️ Phase 1: Chrome Extension Base (The Muscle)
**Objective:** Create a standalone Chrome Extension that can listen to our dashboard and interact with Reddit.

- [x] 1.1 Create `extension/` directory in the root project.
- [x] 1.2 Create `manifest.json` (Manifest V3) with permissions for `activeTab`, `scripting`, `storage`, `tabs`, and host permissions for `*.reddit.com` and `localhost:5173`.
- [x] 1.3 Create `background.js` to act as the Service Worker to relay messages.
- [x] 1.4 Create `content.js` to inject into Reddit pages (to paste text and click post) AND into the Redigo Dashboard (to bridge `window.postMessage` to the extension background).
- [x] 1.5 Create `popup.html` and `popup.js` to show basic connection status to the user.
- [x] **TEST:** Verify the extension can be loaded unpacked without errors and the popup displays correctly.

---

## 🌉 Phase 2: Connecting Dashboard to Extension (The Bridge)
**Objective:** Make our React Dashboard communicate with the Extension instead of our backend API for posting.

- [x] 2.1 Update `ContentArchitect.tsx` (or where the Reply/Post buttons are).
- [x] 2.2 Replace the `axios.post('/api/reddit/post')` call with a secure `window.postMessage({ type: 'REDIGO_DEPLOY', text, targetUrl }, '*')`.
- [x] 2.3 Implement a listener in the dashboard to receive success/failure responses from the extension to update UI state (loading, success, error).
- [x] **TEST:** Click "Deploy" on the dashboard and verify the extension receives the payload and attempts to open the Reddit tab.

---

## 🧠 Phase 3: Transition Backend to Public JSON (The Brain)
**Objective:** Stop using the blocked Reddit OAuth API for fetching data, and use the public `.json` endpoints instead.

- [x] 3.1 Open `server/index.js`.
- [x] 3.2 Freeze (comment out) all Reddit OAuth callback and login routes (`/api/auth/reddit`, `/api/auth/reddit/callback`). Do NOT delete them.
- [x] 3.3 Rewrite `searchReddit` (or equivalent fetching logic) to use `https://www.reddit.com/r/.../new.json`. Ensure data mapping matches our existing structures perfectly.
- [x] 3.4 Ensure MongoDB schemas remain untouched (add `hasExtension: Boolean` to User model if necessary, but do not drop old tokens).
- [x] **TEST:** Open the dashboard and verify that subreddits/posts are fetched successfully without requiring a Reddit login session. AI analysis should process this data normally.

---

## ✨ Phase 4: UI/UX & Onboarding Updates (The Polish)
**Objective:** Update the user journey to emphasize the extension as a security feature and enforce its installation.

- [x] 4.1 Update `LandingPage.tsx`: Add a feature block highlighting the "Decentralized & Safe Home-IP Architecture".
- [x] 4.2 Update `OnboardingWizard.tsx`: Remove the Reddit Login step. Add an "Install The Security Engine" step. The app must detect if the extension is installed before allowing the user to proceed.
- [x] 4.3 Update `Layout.tsx`: Implement a global banner check. If the extension is not detected or the user is on mobile, show a warning banner: "Extension missing! Please install the Redigo Chrome Extension to enable posting."
- [x] **TEST:** Run through the entire user flow from Landing Page -> Signup -> Onboarding -> Content Generator. Ensure no old OAuth redirects occur and UI is cohesive.

---
*Created as the single source of truth for the Redigo Pivot implementation.*
