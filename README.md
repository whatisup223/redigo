<div align="center">
  <h1 align="center">🚀 RedditGo</h1>
  <p align="center"><b>The AI-Powered Reddit Growth Assistant for Founders</b></p>
  <p align="center"><i>Find relevant discussions, craft authentic replies, and grow your brand — with you in control every step of the way.</i></p>

  [![License: Proprietary](https://img.shields.io/badge/License-Proprietary-red.svg?style=for-the-badge)]()
  [![Stack: MERN](https://img.shields.io/badge/Stack-MERN-61DAFB?style=for-the-badge&logo=react)]()
  [![AI: Gemini Pro 1.5](https://img.shields.io/badge/AI-Gemini_Pro_1.5-EA4335?style=for-the-badge&logo=google-gemini)]()
  [![SaaS: Ready](https://img.shields.io/badge/SaaS-Ready-00D1B2?style=for-the-badge)]()
  [![Reddit: API Compliant](https://img.shields.io/badge/Reddit_API-Compliant-FF4500?style=for-the-badge&logo=reddit)]()
  [![Human In Loop](https://img.shields.io/badge/Human--in--the--Loop-Required-brightgreen?style=for-the-badge)]()

</div>

---

## 💎 What is RedditGo?

**RedditGo** is a **human-assisted** AI SaaS platform that helps founders, marketers, and agencies participate authentically in Reddit communities. Powered by **Google Gemini Pro 1.5**, it drafts value-first content suggestions — but **you always review, edit, and manually approve every action before anything is posted.**

> ⚠️ **RedditGo is not an automation bot.** Every post and comment requires explicit user action. We are fully compliant with Reddit's [Responsible Builder Policy](https://support.reddithelp.com/hc/en-us/articles/16160319875092-Reddit-Developer-Terms) and [Data API Terms](https://www.reddit.com/wiki/api-terms/).

---

## ✨ Core Features

### 🤖 AI Reply Agent
Suggests context-aware, value-first replies based on Reddit thread analysis. Choose from 4 psychological tones:
- **Helpful Peer** — Relatable and approachable
- **Thought Leader** — Expert insights and structured value
- **Storyteller** — Emotional connection through anecdotes
- **Skeptic** — Intellectual challenge, then solution

### 🎯 Opportunity Scoring System
Manually search for relevant threads. The platform scores posts by:
- High-intent signals (people asking for your solution)
- Engagement potential (traffic vs. competition)
- Keyword relevance to your niche

### 🎨 Content Architect
Draft full Reddit posts in seconds. AI generates the headline and body — you review and optionally publish:
- **AI Text Engine**: Long-form posts tuned for your brand voice
- **Image Generator**: Built-in DALL-E style image support
- **Brand Intelligence**: Learns your product and embeds it naturally

### 🔗 Link Tracking & Analytics
Built-in click-tracking to measure ROI per comment — converts every mention into a trackable lead.

### 💰 Credit System
Every AI action (generate, fetch, post) costs credits. Fully admin-configurable:
- Per-action costs for: comment, post, image, fetch
- Daily point limits per subscription plan
- Real-time credit sync after each action

---

## 🛡️ Reddit API Compliance

RedditGo is built from the ground up to respect Reddit's rules.

### ✅ Human-in-the-Loop (No Automation)
- **No auto-posting.** Every comment and post requires a manual click.
- **No scheduled posting.** Actions only happen when the user initiates them.
- **No auto-fetch on load.** The feed only loads when the user clicks "Search Posts."

### ✅ OAuth2 — Minimum Required Scopes
| Scope | Purpose |
|---|---|
| `identity` | Read username, karma, and profile icon |
| `read` | Browse posts and comments |
| `submit` | Post only when user explicitly clicks "Post" |

### ✅ Compliant User-Agent
All Reddit API requests use a dynamic, per-user User-Agent:
```
RedditGoApp/1.0 by u/<reddit_username>
```

### ✅ Rate Limiting (Per-User, Server-Side)
| Endpoint | Limit |
|---|---|
| Feed fetch (`/api/reddit/posts`) | 10 requests / 2 minutes |
| Post & Reply (`/api/reddit/post`, `/api/reddit/reply`) | 5 requests / 10 minutes |
| AI Generation (`/api/generate`) | 20 requests / 1 minute |
| UI Reload Cooldown | 30 seconds between fetches |

### ✅ Anti-Spam Protections
- **Double-reply check**: Cannot send two replies to the same thread
- **Duplicate post check**: Cannot repost same title within 1 hour
- **Randomized delays**: 5–15 second human-like wait before each API call

### ✅ Data Retention Policy
Reddit-sourced content (`postContent`) stored in `RedditReply` is **automatically deleted after 90 days** via MongoDB TTL index — in compliance with Reddit's Data API Policy.

### ✅ Transparent User Disclosure
Users are shown a clear permission notice before connecting their Reddit account, listing all OAuth scopes and what data is stored.

---

## 🔒 Security

- **Helmet.js** — Secure HTTP headers
- **express-rate-limit** — API abuse prevention
- **express-mongo-sanitize** — NoSQL injection prevention
- **bcryptjs** — Password hashing
- **JWT Authentication** — Stateless, token-based sessions
- **Atomic credit deduction** — MongoDB `$inc` prevents race conditions

---

## 🛠️ Architecture

RedditGo is a **Full-Stack MERN** application:

| Layer | Technology |
|---|---|
| Frontend | React 18 (TypeScript) + Vite + Tailwind CSS |
| Backend | Node.js / Express.js |
| Database | MongoDB + Mongoose (TTL indexes) |
| AI | Google Gemini 1.5 / OpenAI / OpenRouter |
| Payments | Stripe (subscriptions) + PayPal (top-ups) |
| Auth | JWT + bcrypt + optional 2FA (email OTP) |
| Email | Nodemailer + SMTP (fully templated) |

---

## ⚡ Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/whatisup223/redigo.git
cd redigo
npm install
```

### 2. Configure Environment
```ini
BASE_URL=https://your-app.com
MONGO_URI=mongodb+srv://...
JWT_SECRET=your_secret_key
ADMIN_EMAIL=admin@domain.com
ADMIN_PASSWORD=your_admin_password
GEMINI_API_KEY=your_gemini_key
```

### 3. Run Development
```bash
npm run dev
```

---

## 📋 Changelog — v2.1 (2026-02-25)

### 🆕 New in v2.1 — Reddit Compliance & Credit System
- ✅ Credit deduction on every Reddit feed fetch
- ✅ Admin-configurable fetch cost in AI Settings panel
- ✅ No auto-fetch on page load — user must manually trigger
- ✅ Fixed token refresh to use dynamic User-Agent (was using static admin setting)
- ✅ Added `redditPostLimiter`: 5 posts/replies per user per 10 minutes
- ✅ Added `generateLimiter`: 20 AI requests per user per minute
- ✅ Fixed MOCK post ID bypass with proper regex validation
- ✅ 90-day TTL auto-expiry on Reddit content in MongoDB
- ✅ Added Reddit OAuth permission notice in Settings page
- ✅ Removed all misleading automation language from Landing Page
- ✅ Added subreddit rules reminder badge before publish in ContentArchitect

---

## 📖 Technical Documentation
👉 **[FULL TECHNICAL DOCUMENTATION](./DOCUMENTATION.md)**

---

## ⚖️ License & Legal Notice

**Proprietary Software — All Rights Reserved**

Usage of this codebase is strictly prohibited without explicit written permission from the developer. Any unauthorized use, reproduction, or distribution will result in immediate legal action and prosecution to the fullest extent of the law.

---

**حقوق الملكية — جميع الحقوق محفوظة**

الاستخدام غير مسموح به إلا بإذن كتابي صريح من المطور. أي استخدام، نسخ، أو توزيع غير مصرح به يعرض صاحبه للمساءلة القانونية والملاحقة القضائية فوراً وبأقصى عقوبة يقررها القانون.

---

<div align="center">
  <h3>Developed & Maintained by <a href="https://marketation.online">Marketation</a></h3>
  <p>Reddit API Compliant · Human-in-the-Loop · Production Ready</p>
</div>
