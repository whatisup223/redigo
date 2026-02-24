# RedditGo - Premium AI-Powered Reddit Growth SaaS
## Technical Documentation & Buyer's Guide

Welcome to the official technical documentation for **RedditGo**. This document provides a comprehensive overview of the architecture, features, and setup instructions for the new owner of this high-performance SaaS application.

---

## 1. Project Overview
**RedditGo** is a specialized SaaS platform designed for founders, marketers, and community managers to scale their presence on Reddit. Unlike generic automation bots, RedditGo leverages Google's **Gemini 1.5 Pro/Flash** to generate "Value-First" content that adheres to Reddit's community guidelines, reducing the risk of bans while maximizing engagement and lead generation.

### Key Value Propositions
- **AI Comment Assistant**: Smart analysis of Reddit threads with context-aware reply generation.
- **Content Architect**: Viral thread creation with integrated AI image generation (DALL-E style).
- **Link Tracking System**: Built-in analytics to measure CRT (Click-Through Rate) from Reddit to external products.
- **Multi-Account Support**: Manage several Reddit identities from a single dashboard.
- **Credit-Based Monetization**: Fully integrated subscription and top-up system via Stripe and PayPal.

---

## 2. Technology Stack
Built on the industry-standard **MERN** stack with modern enhancements:

- **Frontend**: React 18 with TypeScript, Vite (for ultra-fast builds), Lucide Icons, and Tailwind CSS.
- **Backend**: Node.js & Express.js with a modular API structure.
- **Database**: MongoDB (Mongoose ODM) with robust schema definitions for users, logs, and transactions.
- **AI Engine**: Google Gemini API for natural language processing and content strategy.
- **Styling**: Premium Custom CSS + Tailwind for a sleek, dark-mode/glassmorphism aesthetic.
- **Authentication**: JWT (JSON Web Tokens) with secure cookie/header handling and Reddit OAuth2.

---

## 3. Core Architecture & Folder Structure

```text
redigo/
├── pages/              # Main application views (Dashboard, Admin, Comments, etc.)
├── components/         # Reusable UI components (Modals, Banners, Navigation)
├── services/           # Frontend API & AI Service wrappers
├── server/             # Backend Logic
│   ├── index.js        # Main Entry Point & API Endpoints
│   └── models.js       # Database Schema Definitions
├── context/            # Global State Management (Auth, Theme)
├── public/             # Static assets (Logos, Icons)
└── server.js           # Production entry (Production Build)
```

---

## 4. Key Systems Breakdown

### A. AI Generation Engine (`services/geminiService.ts`)
The AI engine doesn't just "write text"; it follows a **Tone Strategy**.
- **Helpful Peer**: Relatable and non-salesy.
- **Thought Leader**: Insightful and structured.
- **Storyteller**: Emotionally engaging.
- **Skeptic**: Intellectual and logical.
- **JSON Recovery**: The engine includes a robust extraction layer that handles fragmented AI responses to ensure the UI never breaks.

### B. Credit & Usage System
A sophisticated tiered system that manages platform economics:
- **Credits**: Consumed per Comment (1), Post (2), or Image (5).
- **Daily Limits**: Prevents API abuse and controls costs based on the user's plan (Starter vs. Pro vs. Ultimate).
- **Auto-Sync**: Real-time credit updates across multiple tabs using AuthContext.

### C. Reddit OAuth2 & Safety
- **Anti-Spam Delay**: Randomized delays (5-15s) between posts to mimic human behavior.
- **Double-Reply Check**: Prevents users from accidentally replying to the same thread twice and getting flagged.
- **Dynamic User-Agents**: Each user request carries unique headers to avoid fingerprinting by Reddit's security systems.

---

## 5. Deployment & Environment Setup

### Environment Variables (.env)
Fill in these variables to activate core services:

```ini
PORT=3000
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=secure_password
BASE_URL=https://your-app-link.com
MONGO_URI=mongodb://...
JWT_SECRET=generate_a_random_string
```

### Reddit API Setup
1. Create an app at [reddit.com/prefs/apps](https://www.reddit.com/prefs/apps).
2. Type: **web app**.
3. Redirect URI: `{BASE_URL}/api/auth/reddit/callback`.
4. Input the `Client ID` and `Client Secret` into the **Admin Panel > Reddit Settings**.

### AI & Payments
- **Gemini**: Obtain a key from [Google AI Studio](https://aistudio.google.com/).
- **Stripe/PayPal**: Enter your keys in the Admin Panel to start accepting payments immediately.

---

## 6. Admin Panel (The Nerve Center)
Accessible via `/admin`, the panel allows the owner to:
- **Monitor Pulse**: See real-time system activity and logs.
- **Manage Users**: Suspend, award credits, or change plans.
- **Live Config**: Update pricing, credit costs, and AI prompts without redeploying code.
- **Analytics**: Track churn, most active subreddits, and revenue distribution.

---

## 7. Handover Checklist for the Buyer
1. [ ] **Update Credentials**: Change the `ADMIN_PASSWORD` in `.env`.
2. [ ] **Brand Identity**: Update logos in `/public` and `LandingPage.tsx`.
3. [ ] **Domain Linkage**: Update `BASE_URL` in `.env`.
4. [ ] **API Keys**: Replace Google Gemini, Reddit, Stripe, and PayPal keys in the Admin UI.
5. [ ] **Support Setup**: Configure the SMTP settings in the Admin Panel to receive support tickets.

---

## 8. Development Roadmap
For future growth, consider implementing:
- **Subreddit Scraper**: Automated discovery of trending subreddits.
- **AI Agent Autopilot**: Fully automated scheduling based on brand "office hours."
- **Internal CRM**: Track which Reddit users turned into paying customers.

---
*Documentation prepared by Antigravity (Advanced AI Engineering for RedditGo).*
