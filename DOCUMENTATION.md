# RedditGo — Technical Documentation
## Architecture Overview & Setup Guide

---

## 1. Project Overview

**RedditGo** is a human-assisted AI SaaS platform that helps founders, marketers, and creators participate authentically in Reddit communities. The platform uses Google Gemini to draft contextually relevant reply and post suggestions — but **every action requires explicit human review and approval before anything is submitted to Reddit.**

RedditGo is **not an automation bot**. It is a drafting and discovery assistant designed to help users engage more thoughtfully and efficiently with Reddit communities relevant to their business.

### Core Value Propositions
- **AI Reply Assistant**: Analyzes Reddit thread context and drafts value-first reply suggestions for user review.
- **Content Architect**: Helps draft original Reddit posts based on brand voice — user reviews and manually publishes.
- **Opportunity Scoring**: Helps users discover relevant discussions by searching subreddits based on keywords.
- **Link Tracking System**: Measures click-through rates from Reddit to external products.
- **Multi-Account Support**: Users can connect multiple personal Reddit accounts (within plan limits) via official OAuth2.
- **Credit-Based Monetization**: Subscription and top-up system via Stripe and PayPal.

---

## 2. Technology Stack

Built on the **MERN** stack:

- **Frontend**: React 18 (TypeScript), Vite, Lucide Icons, Tailwind CSS
- **Backend**: Node.js & Express.js with modular API structure
- **Database**: MongoDB (Mongoose ODM) with TTL indexes for data retention compliance
- **AI Engine**: Google Gemini API (text generation), optional OpenAI/OpenRouter
- **Authentication**: JWT + bcrypt + optional 2FA (email OTP), Reddit OAuth2
- **Security**: Helmet.js, express-rate-limit, express-mongo-sanitize

---

## 3. Folder Structure

```text
redigo/
├── pages/              # Main application views (Dashboard, Admin, Comments, etc.)
├── components/         # Reusable UI components (Modals, Banners, Navigation)
├── services/           # Frontend API & AI Service wrappers
├── server/             # Backend Logic
│   ├── index.js        # Main Entry Point & API Endpoints
│   └── models.js       # Database Schema Definitions (with TTL indexes)
├── context/            # Global State Management (Auth, Theme)
├── public/             # Static assets (Logos, Icons)
└── server.js           # Production entry point
```

---

## 4. Key Systems Breakdown

### A. AI Generation Engine (`services/geminiService.ts`)
The AI engine generates reply and post suggestions based on thread context. It supports 4 writing styles:
- **Helpful Peer**: Relatable and value-first.
- **Thought Leader**: Insightful and structured.
- **Storyteller**: Emotionally engaging.
- **Skeptic**: Intellectual and logical.

The engine includes a robust response parser to handle varied AI output formats gracefully.

### B. Credit & Usage System
- **Credits**: Consumed per action — Comment (default: 1pt), Post (default: 2pt), Image (default: 5pt), Feed Fetch (default: 1pt). All costs are admin-configurable.
- **Daily Limits**: Each subscription plan has a daily credit cap, preventing excessive API usage.
- **Fetch Cost**: Manually searching for Reddit posts costs credits, discouraging excessive data retrieval.
- **Real-time Sync**: Credit balance updates immediately after each action via AuthContext.

### C. Reddit API Integration & Safety Controls

**Authentication & Scopes:**
- OAuth2 with minimum required scopes: `identity`, `read`, `submit`
- Access tokens stored securely, refreshed automatically when expired
- All API calls use a compliant User-Agent: `RedditGoApp/1.0 by u/{reddit_username}`

**Human-in-the-Loop Design:**
- No action is taken on Reddit without explicit user approval
- Feed fetch requires a manual button click (no auto-fetch on page load)
- AI drafts replies — the user reads, edits, and clicks "Post" to submit

**Anti-Spam & Rate Limiting:**
- **Double-Reply Check**: Server queries database before every API call to prevent duplicate replies on the same post
- **Duplicate Post Check**: Cannot submit a post with the same title within 1 hour
- **Randomized Delays**: Server enforces a 5–15 second random sleep before each `api/comment` or `api/submit` call
- **Server-Side Rate Limits** (per user):
  - Feed fetch: max 10 requests / 2 minutes
  - Post & Reply: max 5 requests / 10 minutes
  - AI Generation: max 20 requests / 1 minute

**Data Retention:**
- Reddit post content stored in our database is automatically deleted after **90 days** via MongoDB TTL index
- Users can trigger immediate deletion of their Reddit data via Account Settings

---

## 5. Deployment & Environment Setup

### Environment Variables (.env)
```ini
PORT=3000
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=secure_password
BASE_URL=https://your-app-link.com
MONGO_URI=mongodb://...
JWT_SECRET=generate_a_random_string
GEMINI_API_KEY=your_gemini_api_key
```

### Reddit API Setup
1. Create an app at [reddit.com/prefs/apps](https://www.reddit.com/prefs/apps)
2. Type: **web app**
3. Redirect URI: `{BASE_URL}/auth/reddit/callback`
4. Enter the `Client ID` and `Client Secret` in the **Admin Panel → Reddit Settings**

### AI & Payments
- **Gemini**: Obtain a key from [Google AI Studio](https://aistudio.google.com/)
- **Stripe/PayPal**: Enter your keys in the Admin Panel

---

## 6. Admin Panel

Accessible via `/admin`. Allows the operator to:
- **Monitor System Pulse**: Real-time activity logs and error tracking
- **Manage Users**: Award credits, adjust plans, suspend accounts
- **Live Configuration**: Update credit costs, AI prompts, and rate limits without redeploying
- **Analytics**: Track plan distribution, revenue, and usage trends
- **Reddit Settings**: Configure OAuth2 client credentials, delay times, and anti-spam rules

---

## 7. Reddit API Compliance Summary

| Policy Area | Implementation |
|---|---|
| User-Agent | Dynamic, per-user: `RedditGoApp/1.0 by u/{username}` |
| OAuth Scopes | Minimum required: `identity read submit` |
| No Automation | All posts/replies require explicit user action |
| Rate Limiting | Server-side limiters on all Reddit-facing endpoints |
| Anti-Spam | Double-reply check + duplicate post check + human delays |
| Data Retention | 90-day TTL auto-delete on Reddit content |
| User Disclosure | OAuth scope notice shown before account linking |

---

## 8. Setup Checklist

1. [ ] **Update Credentials**: Change `ADMIN_PASSWORD` in `.env`
2. [ ] **Brand Identity**: Update logos in `/public` and `LandingPage.tsx`
3. [ ] **Domain**: Update `BASE_URL` in `.env` and Reddit OAuth redirect URI
4. [ ] **API Keys**: Set Google Gemini, Reddit Client ID/Secret, Stripe, PayPal in Admin UI
5. [ ] **SMTP**: Configure email settings in Admin Panel for transactional emails
6. [ ] **Review Subreddit Rules**: Ensure users are informed to read each subreddit's rules before posting

---

*RedditGo is built for responsible, human-supervised Reddit participation.*
