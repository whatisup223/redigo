
import express from 'express';
import cors from 'cors';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const SETTINGS_FILE = path.join(__dirname, '../settings.storage.json');

const loadSettings = () => {
  if (fs.existsSync(SETTINGS_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
    } catch (e) {
      console.error('Error loading settings:', e);
    }
  }
  return {};
};

const saveSettings = (data) => {
  const current = loadSettings();
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify({ ...current, ...data }, null, 2));
};

const savedData = loadSettings();

const app = express();
app.set('trust proxy', true); // Trust reverse proxy (EasyPanel/Nginx)
const PORT = process.env.PORT || 3001;

// Webhook Handler (Must be before express.json)
app.post('/api/webhook', express.raw({ type: 'application/json' }), async (request, response) => {
  const sig = request.headers['stripe-signature'];
  const stripe = getStripe();
  const stripeSettings = loadSettings().stripe || {};

  let event;

  try {
    if (stripeSettings.webhookSecret && stripe && sig) {
      event = stripe.webhooks.constructEvent(request.body, sig, stripeSettings.webhookSecret);
    } else {
      addSystemLog('WARN', '[Webhook] Received without verification (Dev or Missing Secret)');
      console.log('[Webhook] Received without verification (Dev or Missing Secret)');
      event = JSON.parse(request.body.toString());
    }
  } catch (err) {
    addSystemLog('ERROR', `[Webhook] Signature verification failed: ${err.message}`);
    console.error('[Webhook] Signature verification failed.', err.message);
    return response.status(400).send(`Webhook Error: ${err.message}`);
  }

  addSystemLog('INFO', `[Webhook] Event: ${event.type}`);
  console.log(`[Webhook] Event: ${event.type}`);

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    // RELOAD USERS FROM DISK
    const freshData = loadSettings();
    const localUsers = freshData.users || [];

    const { userEmail, plan, credits, billingCycle } = session.metadata || {};
    const stripeCustomerEmail = session.customer_details?.email;
    const emailToSearch = userEmail || stripeCustomerEmail;

    addSystemLog('INFO', `[Webhook] Processing: ${emailToSearch} | Plan: ${plan} | Cycle: ${billingCycle}`);
    console.log(`[Webhook] Processing: ${emailToSearch} | Plan: ${plan} | Cycle: ${billingCycle}`);

    if (emailToSearch && plan) {
      const userIndex = localUsers.findIndex(u => u.email.toLowerCase() === emailToSearch.toLowerCase());

      if (userIndex !== -1) {
        let creditsToAdd = credits ? parseInt(credits) : getPlanCredits(plan);

        // UPFRONT CREDITS FOR YEARLY
        if (billingCycle === 'yearly') {
          creditsToAdd = creditsToAdd * 12;
          addSystemLog('INFO', `[Webhook] Yearly billing detected. Multiplying credits by 12: ${creditsToAdd}`);
        }

        const currentCredits = localUsers[userIndex].credits || 0;
        const now = new Date();
        const expirationDate = new Date(now);
        if (billingCycle === 'yearly') expirationDate.setFullYear(expirationDate.getFullYear() + 1);
        else expirationDate.setMonth(expirationDate.getMonth() + 1);

        localUsers[userIndex].plan = plan;
        localUsers[userIndex].billingCycle = billingCycle || 'monthly';
        localUsers[userIndex].status = 'Active';
        localUsers[userIndex].credits = currentCredits + creditsToAdd;
        localUsers[userIndex].subscriptionStart = now.toISOString();
        localUsers[userIndex].subscriptionEnd = expirationDate.toISOString();

        if (!localUsers[userIndex].transactions) localUsers[userIndex].transactions = [];
        const newBalance = currentCredits + creditsToAdd;

        localUsers[userIndex].transactions.push({
          id: session.id || `tx_stripe_${Date.now()}`,
          date: new Date().toISOString(),
          amount: (session.amount_total || 0) / 100,
          currency: session.currency || 'USD',
          type: 'stripe_payment',
          description: `Payment for ${plan} (${billingCycle}) plan successful.`,
          subDescription: `Previous: ${currentCredits} + New: ${creditsToAdd} = ${newBalance} Credits`,
          creditsAdded: creditsToAdd,
          previousBalance: currentCredits,
          finalBalance: newBalance,
          planName: plan
        });

        users = localUsers;
        saveSettings({ users: localUsers });
        addSystemLog('SUCCESS', `[Webhook] User ${emailToSearch} upgraded to ${plan}`);
        console.log(`[Webhook] SUCCESS: ${emailToSearch} upgraded.`);
      } else {
        addSystemLog('ERROR', `[Webhook] User ${emailToSearch} not found.`);
        console.warn(`[Webhook] ERROR: User ${emailToSearch} not found.`);
      }
    } else {
      addSystemLog('ERROR', `[Webhook] Missing email or plan information in session.`);
      console.warn(`[Webhook] ERROR: Missing email or plan information in session.`);
    }
  }

  response.send();
});

// Middleware
app.use(cors());
app.use(express.json());


// --- System Logging ---
const LOGS_FILE = './logs.storage.json';
let systemLogs = [];

// Load logs on startup
if (fs.existsSync(LOGS_FILE)) {
  try {
    systemLogs = JSON.parse(fs.readFileSync(LOGS_FILE, 'utf8'));
  } catch (e) {
    console.error('Error loading logs:', e);
    systemLogs = [];
  }
}

const saveLogs = () => {
  // debounce or just save
  try {
    fs.writeFileSync(LOGS_FILE, JSON.stringify(systemLogs, null, 2));
  } catch (e) {
    console.error('Error saving logs:', e);
  }
};

const addSystemLog = (level, message, metadata = {}) => {
  const logEntry = {
    id: Date.now().toString(36) + Math.random().toString(36).substr(2),
    timestamp: new Date().toISOString(),
    level: level.toUpperCase(),
    message,
    metadata
  };

  // Prepend to array
  systemLogs.unshift(logEntry);

  // Keep last 2000 logs
  if (systemLogs.length > 2000) {
    systemLogs = systemLogs.slice(0, 2000);
  }

  saveLogs();
  return logEntry;
};

// Request Logging Middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path.replace(/\/$/, '');

  // Log request start
  // console.log(`[${new Date().toISOString()}] ${req.method} ${path}`);

  // Capture response finish
  res.on('finish', () => {
    const duration = Date.now() - start;
    let logLevel = 'INFO';
    if (res.statusCode >= 400) logLevel = 'WARN';
    if (res.statusCode >= 500) logLevel = 'ERROR';

    // Don't flood logs with health checks or static assets if any
    if (path === '/api/health') return;

    let userEmail = 'Guest';
    if (req.body?.email) userEmail = req.body.email; // Try to capture email from body if present

    // Attempt to parse user from token if available (simple check)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer mock-user-token-')) {
      const uid = authHeader.replace('Bearer mock-user-token-', '');
      const u = users.find(user => user.id == uid);
      if (u) userEmail = u.email;
    } else if (authHeader === 'Bearer mock-user-token-123') {
      userEmail = 'Admin';
    }

    addSystemLog(logLevel, `${req.method} ${path}`, {
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      user: userEmail
    });
  });

  if (req.method === 'POST' && !path.includes('/api/webhook')) {
    // console.log('Body:', JSON.stringify(req.body));
  }
  next();
});

// JSON Error Handler
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    addSystemLog('ERROR', 'Invalid JSON payload received', { ip: req.ip });
    return res.status(400).json({ error: 'Invalid JSON payload' });
  }
  next();
});

// Mock Database
let users = savedData.users || [];
let plans = savedData.plans || [
  {
    id: 'starter',
    name: 'Starter',
    description: 'For individuals exploring AI replies.',
    monthlyPrice: 0,
    yearlyPrice: 0,
    credits: 100,
    dailyLimitMonthly: 5,
    dailyLimitYearly: 5,
    maxAccounts: 1,
    maxBrands: 1,
    allowOverride: false,
    allowImages: false, // Feature Flag
    allowTracking: false, // Feature Flag
    features: ['100 AI actions/mo', 'Basic Reddit Analytics', '1 Connected Account', '1 Brand Profile', 'Community Support'],
    isPopular: false,
    isCustom: true
  },
  {
    id: 'pro',
    name: 'Professional',
    description: 'Perfect for indie hackers and solo founders.',
    monthlyPrice: 29,
    yearlyPrice: 276,
    credits: 300,
    dailyLimitMonthly: 20,
    dailyLimitYearly: 50,
    maxAccounts: 3,
    maxBrands: 1,
    allowOverride: true,
    allowImages: true, // Feature Flag
    allowTracking: true, // Feature Flag
    features: ['300 AI actions/mo', 'Advanced Post Scheduling', '3 Connected Accounts', '1 Brand Profile (with Override)', 'Priority Support', 'Image Generation'],
    isPopular: true,
    highlightText: 'Most Popular',
    isCustom: true
  },
  {
    id: 'agency',
    name: 'Agency',
    description: 'For serious growth and small teams.',
    monthlyPrice: 99,
    yearlyPrice: 948,
    credits: 1000,
    dailyLimitMonthly: 100,
    dailyLimitYearly: 300,
    maxAccounts: -1,
    maxBrands: -1,
    allowOverride: true,
    allowImages: true, // Feature Flag
    allowTracking: true, // Feature Flag
    features: ['1000 AI actions/mo', 'Unlimited Accounts', 'Unlimited Brand Profiles', 'Team Collaboration', 'Dedicated Manager', 'API Access'],
    isPopular: false,
    isCustom: true
  }
];

// Mock Tracking Database
let trackingLinks = savedData.trackingLinks || [];

// ─── Tracking Redirector ──────────────────────────────────────────────────
app.get('/t/:id', (req, res) => {
  const { id } = req.params;
  const link = trackingLinks.find(l => l.id === id);

  if (!link) {
    return res.status(404).send('Tracking link not found or expired.');
  }

  // Log the click
  link.clicks = (link.clicks || 0) + 1;
  link.lastClickedAt = new Date().toISOString();

  // Optional: Capture more data from headers/ip if needed
  if (!link.clickDetails) link.clickDetails = [];
  link.clickDetails.push({
    timestamp: new Date().toISOString(),
    userAgent: req.headers['user-agent'],
    referer: req.headers['referer']
  });

  // Save changes for persistency
  saveSettings({ trackingLinks });

  addSystemLog('INFO', `Tracking Click: ${id} -> ${link.originalUrl}`, {
    subreddit: link.subreddit,
    userId: link.userId,
    clicks: link.clicks
  });

  // Premium feel: Meta refresh or simple redirect
  res.send(`
    <html>
      <head>
        <title>Redirecting...</title>
        <meta http-equiv="refresh" content="0;url=${link.originalUrl}">
        <style>
          body { font-family: 'Inter', sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #f8fafc; color: #64748b; }
          .loader { border: 3px solid #f3f3f3; border-top: 3px solid #f97316; border-radius: 50%; width: 24px; height: 24px; animate: spin 1s linear infinite; margin-right: 12px; }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        </style>
      </head>
      <body>
        <div class="loader"></div>
        <p>Redirecting you safely...</p>
        <script>window.location.href = "${link.originalUrl}";</script>
      </body>
    </html>
  `);
});

// ─── Create Tracking Link ──────────────────────────────────────────────────
app.post('/api/tracking/create', (req, res) => {
  const { userId, originalUrl, subreddit, postId, type } = req.body;
  if (!userId || !originalUrl) return res.status(400).json({ error: 'Missing required fields' });

  const user = users.find(u => u.id == userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const userPlan = plans.find(p => p.id === user.plan || p.name === user.plan);

  // PLAN PERMISSION CHECK
  if (user.role !== 'admin' && userPlan && userPlan.allowTracking === false) {
    return res.status(403).json({ error: 'Link tracking is not included in your current plan.' });
  }

  const id = Math.random().toString(36).substring(2, 8);
  const newLink = {
    id,
    userId: Number(userId),
    originalUrl,
    subreddit,
    postId,
    type, // 'comment' or 'post'
    createdAt: new Date().toISOString(),
    clicks: 0,
    clickDetails: []
  };

  trackingLinks.push(newLink);
  saveSettings({ trackingLinks });
  console.log(`[TRACKING] New link created: ${id} for user ${userId}`);

  const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
  const trackingUrl = `${baseUrl}/t/${id}`;

  addSystemLog('INFO', `Tracking Link Created: ${id}`, {
    userId,
    subreddit,
    trackingUrl,
    originalUrl
  });

  res.json({ id, trackingUrl });
});

// ─── Get User Tracking Links ──────────────────────────────────────────────
app.get('/api/tracking/user/:userId', (req, res) => {
  const { userId } = req.params;
  const userLinks = trackingLinks.filter(l => l.userId == userId);
  res.json(userLinks);
});


// Superuser enforcement - info@marketation.online is the ONLY admin for now
// Superuser enforcement - info@marketation.online is the ONLY admin for now
const superuser = {
  id: 1,
  name: 'Admin',
  email: process.env.ADMIN_EMAIL,
  password: process.env.ADMIN_PASSWORD,
  role: 'admin',
  plan: 'Professional',
  status: 'Active',
  credits: 999999,
  hasCompletedOnboarding: true
};

const adminIndex = users.findIndex(u => u.email === superuser.email);
if (adminIndex !== -1) {
  users[adminIndex].role = 'admin';
  users[adminIndex].hasCompletedOnboarding = true;
} else {
  users = [superuser, ...users];
}
saveSettings({ users });
console.log(`--- ADMIN ACCOUNT READY: ${superuser.email} ---`);

let tickets = savedData.tickets || [];
let sentReplies = savedData.replies || [];

// General Auth Middleware to enforce Bans/Suspensions on every request
const generalAuth = (req, res, next) => {
  const path = req.path.replace(/\/$/, '');
  // Try to extract user from token or ID
  const authHeader = req.headers.authorization;
  let userId = req.body?.userId || req.query?.userId || req.params?.id;

  if (!userId && authHeader && authHeader.startsWith('Bearer mock-user-token-')) {
    userId = authHeader.replace('Bearer mock-user-token-', '');
  }

  // Exempt public routes explicitly
  const publicRoutes = ['/api/auth/login', '/api/auth/signup', '/api/auth/forgot-password', '/api/health', '/api/webhook'];

  if (publicRoutes.includes(path)) return next();

  // If we have a userId, check status
  if (userId) {
    const user = users.find(u => u.id == userId);
    if (user && (user.status === 'Banned' || user.status === 'Suspended')) {
      console.log(`[AUTH] Blocked ${user.status} user: ${user.email}`);
      return res.status(403).json({
        error: `Your account has been ${user.status.toLowerCase()}.`,
        reason: user.statusMessage || 'Contact support for details.'
      });
    }
  } else if (authHeader === 'Bearer mock-jwt-token-123') {
    // Admin token - check if admin is banned
    const adminUser = users.find(u => u.role === 'admin');
    if (adminUser && (adminUser.status === 'Banned' || adminUser.status === 'Suspended')) {
      return res.status(403).json({
        error: `Your account has been ${adminUser.status.toLowerCase()}.`,
        reason: adminUser.statusMessage || ''
      });
    }
  }

  next();
};

app.use(generalAuth);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// Authentication Endpoints
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);

  if (user) {
    // Check if user is banned or suspended
    if (user.status === 'Banned' || user.status === 'Suspended') {
      addSystemLog('WARN', `[LOGIN] Blocked ${user.status} user: ${user.email}`);
      console.log(`[LOGIN] Blocked ${user.status} user: ${user.email}`);
      return res.status(403).json({
        error: `Your account has been ${user.status.toLowerCase()}.`,
        reason: user.statusMessage || 'No specific reason provided.'
      });
    }

    if (user.subscriptionEnd && new Date() > new Date(user.subscriptionEnd)) {
      addSystemLog('INFO', `[Subscription] User ${user.email} subscription expired. Downgrading and resetting period.`);
      console.log(`[Subscription] User ${user.email} subscription expired. Downgrading and resetting period.`);
      user.plan = 'Starter';
      const freePlan = plans.find(p => p.id === 'starter');
      const now = new Date();
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      user.credits = freePlan ? freePlan.credits : 100;
      user.subscriptionStart = now.toISOString();
      user.subscriptionEnd = nextMonth.toISOString();
      saveSettings({ users });
    }

    addSystemLog('INFO', `User logged in: ${user.email}`, { userId: user.id, role: user.role });

    // In a real app, generate a JWT token here
    const { password, ...userWithoutPassword } = user;
    const token = user.role === 'admin' ? 'mock-jwt-token-123' : `mock-user-token-${user.id}`;
    res.json({ user: userWithoutPassword, token });
  } else {
    addSystemLog('WARN', `Failed login attempt for: ${email}`);
    res.status(401).json({ error: 'Invalid email or password' });
  }
});

app.post('/api/auth/signup', (req, res) => {
  const { name, email, password } = req.body;

  const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existingUser) {
    if (existingUser.status === 'Banned' || existingUser.status === 'Suspended') {
      addSystemLog('WARN', `[SIGNUP] Blocked signup attempt for banned email: ${email}`);
      console.log(`[SIGNUP] Blocked ${existingUser.status} user: ${existingUser.email}`);
      return res.status(403).json({
        error: `Your account has been ${existingUser.status.toLowerCase()}.`,
        reason: existingUser.statusMessage || 'Contact support for details.'
      });
    }
    addSystemLog('WARN', `Signup failed: Email already exists (${email})`);
    return res.status(400).json({ error: 'User already exists' });
  }

  const newUser = {
    id: users.length + 1,
    name,
    email,
    password, // In a real app, hash this!
    role: 'user',
    plan: 'Starter',
    billingCycle: 'monthly',
    status: 'Active',
    credits: 100, // Grant initial credits upon signup
    subscriptionStart: new Date().toISOString(),
    subscriptionEnd: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString(),
    hasCompletedOnboarding: false,
    dailyUsage: 0,
    dailyUsagePoints: 0,
    customDailyLimit: 0,
    lastUsageDate: new Date().toISOString().split('T')[0],
    transactions: [],
    usageStats: {
      posts: 0,
      comments: 0,
      images: 0,
      postsCredits: 0,
      commentsCredits: 0,
      imagesCredits: 0,
      totalSpent: 0,
      history: []
    }
  };

  users.push(newUser);
  saveSettings({ users }); // Persist new user
  addSystemLog('SUCCESS', `New user registered: ${email}`, { userId: newUser.id });

  const { password: _, ...userWithoutPassword } = newUser;
  res.status(201).json({ user: userWithoutPassword, token: `mock-user-token-${newUser.id}` });
});

app.post('/api/auth/forgot-password', (req, res) => {
  const { email } = req.body;
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (user) {
    // Check if user is banned or suspended
    if (user.status === 'Banned' || user.status === 'Suspended') {
      console.log(`[FORGOT-PASSWORD] Blocked ${user.status} user: ${user.email}`);
      return res.status(403).json({
        error: `Your account has been ${user.status.toLowerCase()}.`,
        reason: user.statusMessage || 'Contact support for details.'
      });
    }

    console.log(`[Mock Email] Password reset link sent to ${email}`);
    res.json({ message: 'If an account exists, a reset link has been sent.' });
  } else {
    // For security, generic message
    res.json({ message: 'If an account exists, a reset link has been sent.' });
  }
});

app.post('/api/user/complete-onboarding', (req, res) => {
  const { userId } = req.body;
  const index = users.findIndex(u => u.id == userId);
  if (index !== -1) {
    // We already gave 100 at signup, so we just mark it as complete
    users[index].hasCompletedOnboarding = true;
    saveSettings({ users });
    addSystemLog('INFO', `User completed onboarding: ${users[index].email}`);
    res.json({
      success: true,
      hasCompletedOnboarding: true,
      credits: users[index].credits
    });
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});

app.post('/api/user/brand-profile', (req, res) => {
  const { userId, ...brandData } = req.body;
  const index = users.findIndex(u => u.id == userId);

  if (index !== -1) {
    const user = users[index];

    // Check if this is the first time completing onboarding to award bonus
    let bonusAwarded = false;
    if (!user.hasCompletedOnboarding || (user.credits === 0 && (!user.brandProfile || Object.keys(user.brandProfile).length === 0))) {
      user.credits = (user.credits || 0) + 100;
      bonusAwarded = true;
    }

    user.brandProfile = brandData;
    user.hasCompletedOnboarding = true; // Mark as complete

    saveSettings({ users });
    addSystemLog('INFO', `Brand profile updated for: ${user.email}`, { bonusAwarded });
    res.json({ success: true, credits: user.credits, bonusAwarded });
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});

let aiSettings = savedData.ai || {
  provider: 'google',
  model: 'gemini-1.5-flash',
  temperature: 0.75,
  maxOutputTokens: 1000,
  systemPrompt: `IDENTITY: You are a Reddit growth expert acting as a highly helpful, authentic power-user. You don't sell; you solve.

CORE STRATEGY:
1. VALUE FIRST: Address the OP's pain point immediately with a non-obvious, actionable insight.
2. AUTHENTICITY: Write like a human — vary sentence length, use contractions (it's, I've), and avoid corporate jargon.
3. SUBTLE MARKETING: Mention the product only if it directly solves a problem mentioned. Frame it as "I found this tool" or "I've been using X for this".
4. ANTI-AI RULES: Never use "Great question!", "leverage", "game-changer", "delve into", or "hope this helps".

STRUCTURE:
- Hook: Direct answer or relatable comment.
- Meat: 1-2 specific points of value.
- The Bridge: A natural transition to the tool/brand (if applicable).
- Closing: A low-friction question or a "tldr" statement.`,
  apiKey: process.env.GEMINI_API_KEY || '',
  baseUrl: 'https://openrouter.ai/api/v1',
  creditCosts: {
    comment: 1,
    post: 2,
    image: 5
  }
};

// Ensure creditCosts always exists and is fully populated
aiSettings.creditCosts = {
  comment: Number(aiSettings.creditCosts?.comment) || 1,
  post: Number(aiSettings.creditCosts?.post) || 2,
  image: Number(aiSettings.creditCosts?.image) || 5,
  ...aiSettings.creditCosts
};

// Stripe Settings (In-memory storage for demo)
let stripeSettings = savedData.stripe || {
  publishableKey: '',
  secretKey: '',
  webhookSecret: '',
  isSandbox: true
};

// Reddit Settings (In-memory)
let redditSettings = savedData.reddit || {
  clientId: '',
  clientSecret: '',
  redirectUri: '', // Dynamically handled in /url endpoint
  userAgent: 'RedditgoApp/1.0'
};

// Store user Reddit tokens (In-memory for now, should be in DB)
let userRedditTokens = savedData.userRedditTokens || {};

// Plans API Endpoints
// Public configuration for UI
app.get('/api/config', (req, res) => {
  res.json({
    creditCosts: aiSettings.creditCosts
  });
});

app.get('/api/plans', (req, res) => {
  const freshSettings = loadSettings();
  if (freshSettings.plans) {
    plans = freshSettings.plans;
  }
  res.json(plans);
});

app.post('/api/plans', (req, res) => {
  const { id, name, monthlyPrice, yearlyPrice, credits, dailyLimitMonthly, dailyLimitYearly, features, isPopular, highlightText, allowImages, allowTracking } = req.body;

  if (!id || !name || monthlyPrice === undefined || yearlyPrice === undefined || credits === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (plans.find(p => p.id === id)) {
    return res.status(400).json({ error: 'Plan ID already exists' });
  }

  const newPlan = {
    id,
    name,
    monthlyPrice: parseFloat(monthlyPrice),
    yearlyPrice: parseFloat(yearlyPrice),
    credits: parseInt(credits),
    dailyLimitMonthly: parseInt(dailyLimitMonthly) || 0,
    dailyLimitYearly: parseInt(dailyLimitYearly) || 0,
    features: features || [],
    isPopular: !!isPopular,
    highlightText: highlightText || '',
    allowImages: Boolean(allowImages || false),
    allowTracking: Boolean(allowTracking || false),
    isCustom: true // Mark as custom created plan
  };

  plans.push(newPlan);
  saveSettings({ plans });
  addSystemLog('INFO', `New plan created: ${newPlan.name} (${newPlan.id})`);
  res.status(201).json(newPlan);
});

app.put('/api/plans/:id', (req, res) => {
  const { id } = req.params;
  const planIndex = plans.findIndex(p => p.id === id);

  if (planIndex === -1) {
    return res.status(404).json({ error: 'Plan not found' });
  }

  const { name, monthlyPrice, yearlyPrice, credits, dailyLimitMonthly, dailyLimitYearly, features, isPopular, highlightText, allowImages, allowTracking } = req.body;

  plans[planIndex] = {
    ...plans[planIndex],
    name: name || plans[planIndex].name,
    monthlyPrice: monthlyPrice !== undefined ? parseFloat(monthlyPrice) : plans[planIndex].monthlyPrice,
    yearlyPrice: yearlyPrice !== undefined ? parseFloat(yearlyPrice) : plans[planIndex].yearlyPrice,
    credits: credits !== undefined ? parseInt(credits) : plans[planIndex].credits,
    dailyLimitMonthly: dailyLimitMonthly !== undefined ? parseInt(dailyLimitMonthly) : plans[planIndex].dailyLimitMonthly,
    dailyLimitYearly: dailyLimitYearly !== undefined ? parseInt(dailyLimitYearly) : plans[planIndex].dailyLimitYearly,
    features: features || plans[planIndex].features,
    isPopular: isPopular !== undefined ? Boolean(isPopular) : plans[planIndex].isPopular,
    highlightText: highlightText !== undefined ? String(highlightText) : plans[planIndex].highlightText,
    allowImages: allowImages !== undefined ? Boolean(allowImages) : (plans[planIndex].allowImages || false),
    allowTracking: allowTracking !== undefined ? Boolean(allowTracking) : (plans[planIndex].allowTracking || false),
    isCustom: true
  };

  saveSettings({ plans });
  addSystemLog('INFO', `Plan updated: ${plans[planIndex].name} (${id})`);
  res.json(plans[planIndex]);
});

app.delete('/api/plans/:id', (req, res) => {
  const { id } = req.params;
  const planIndex = plans.findIndex(p => p.id === id);

  if (planIndex === -1) {
    return res.status(404).json({ error: 'Plan not found' });
  }

  // Check if any users are on this plan (optional safety check)
  const usersOnPlan = users.filter(u => u.plan.toLowerCase() === plans[planIndex].name.toLowerCase());
  if (usersOnPlan.length > 0) {
    return res.status(400).json({ error: 'Cannot delete plan with active users' });
  }

  const deletedPlanName = plans[planIndex].name;
  plans.splice(planIndex, 1);
  saveSettings({ plans });
  addSystemLog('WARN', `Plan deleted: ${deletedPlanName} (${id})`);
  res.json({ success: true, message: 'Plan deleted' });
});

app.post('/api/user/subscribe', async (req, res) => {
  const { userId, planId, billingCycle } = req.body;

  const user = users.find(u => u.id == userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const plan = plans.find(p => p.id === planId);
  if (!plan) {
    return res.status(404).json({ error: 'Plan not found' });
  }

  // If plan is free, activate immediately
  if (plan.monthlyPrice === 0 && plan.yearlyPrice === 0) {
    user.plan = plan.name;
    user.credits = plan.credits;
    user.status = 'Active';
    user.subscriptionStart = new Date().toISOString();
    user.subscriptionEnd = null; // Free plans might not expire or expire in a month?

    saveSettings({ users });
    addSystemLog('INFO', `User activated free plan: ${user.email} (${plan.name})`);
    return res.json({ success: true, user, message: 'Free plan activated' });
  }

  // If paid plan, create Stripe Session
  const stripe = getStripe();
  if (!stripe) {
    // Fallback for dev without Stripe keys: Instant Activate (remove in prod)
    console.warn('[Stripe] Keys missing. Activating plan instantly for testing.');

    // -- COPY OF INSTANT ACTIVATION LOGIC --
    user.plan = plan.name;
    const currentCredits = user.credits || 0;
    user.credits = currentCredits + plan.credits; // Accumulate
    user.status = 'Active';

    const now = new Date();
    const end = new Date(now);
    if (billingCycle === 'yearly') end.setFullYear(end.getFullYear() + 1);
    else end.setMonth(end.getMonth() + 1);

    user.subscriptionStart = now.toISOString();
    user.subscriptionEnd = end.toISOString();

    saveSettings({ users });
    addSystemLog('WARN', `[TEST MODE] User activated plan: ${user.email} -> ${plan.name}`);
    return res.json({ success: true, user, message: 'Plan activated (Test Mode)' });
    // --------------------------------------
  }

  // Create Stripe Session
  try {
    const price = billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
    const baseUrl = `${req.protocol}://${req.get('host')}`;

    addSystemLog('INFO', `User initiated checkout: ${user.email} for ${plan.name} (${billingCycle})`);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${plan.name} Plan (${billingCycle})`,
            description: `Includes ${plan.credits} new credits. Your existing ${user.credits || 0} credits will be carried over (Total: ${(user.credits || 0) + plan.credits}).`
          },
          unit_amount: price * 100, // Cents
        },
        quantity: 1,
      }],
      mode: 'payment', // One-time payment for now, or 'subscription' if using Stripe Products
      customer_email: user.email,
      metadata: {
        userEmail: user.email,
        plan: plan.name, // Pass ID or Name
        billingCycle: billingCycle,
        credits: plan.credits.toString(),
        previousCreditsSnap: (user.credits || 0).toString()
      },
      success_url: `${baseUrl}/settings?success=true&plan=${plan.name}`,
      cancel_url: `${baseUrl}/pricing?canceled=true`,
    });

    return res.json({ checkoutUrl: session.url });

  } catch (error) {
    console.error('[Stripe Error]', error);
    return res.status(500).json({ error: 'Payment initialization failed' });
  }
});

// Brand Profiles per user
let brandProfiles = savedData.brandProfiles || {};

// Brand Profile Endpoints
// Default Profile fallback
const DEFAULT_BRAND_PROFILE = {
  brandName: 'RedditGo',
  description: 'AI-powered Reddit marketing tool that helps SaaS founders find leads and engage authentically in relevant conversations.',
  targetAudience: 'SaaS founders, indie hackers, and marketers',
  problem: 'Struggling to find relevant Reddit discussions and engaging without seeming like spam.',
  website: 'https://redditgo.online/',
  primaryColor: '#EA580C',
  secondaryColor: '#1E293B',
  brandTone: 'Helpful Peer'
};

app.get('/api/user/brand-profile', (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'userId required' });
  // Return user profile if exists, otherwise default (to avoid empty state/random AI generation)
  res.json(brandProfiles[userId] || DEFAULT_BRAND_PROFILE);
});

app.post('/api/user/brand-profile', (req, res) => {
  try {
    const { userId, brandName, description, targetAudience, problem, website, primaryColor, secondaryColor, brandTone, customTone } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId required' });
    brandProfiles[userId] = { brandName, description, targetAudience, problem, website, primaryColor, secondaryColor, brandTone, customTone };
    saveSettings({ brandProfiles });
    res.json({ success: true });
  } catch (err) {
    console.error('Brand profile save error:', err);
    res.status(500).json({ error: 'Failed to save brand profile' });
  }
});

const saveTokens = (userId, username, tokenData) => {
  if (!userRedditTokens[userId]) userRedditTokens[userId] = {};
  userRedditTokens[userId][username] = tokenData;
  saveSettings({ userRedditTokens });
};

// Initialize Stripe Client dynamically
const getStripe = () => {
  if (!stripeSettings.secretKey) return null;
  return new Stripe(stripeSettings.secretKey);
};

// Auth Middleware for Admin Routes
const adminAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  // In our mock system, the admin token is fixed
  if (authHeader === 'Bearer mock-jwt-token-123') {
    next();
  } else {
    res.status(403).json({ error: 'Unauthorized access to admin API' });
  }
};

// Admin Stats
app.get('/api/admin/stats', adminAuth, (req, res) => {
  res.json({
    totalUsers: users.length,
    activeSubscriptions: users.filter(u => u.status === 'Active').length,
    apiUsage: Math.floor(Math.random() * 100), // Mock percentage
    systemHealth: '98%',
    ticketStats: {
      total: tickets.length,
      open: tickets.filter(t => t.status === 'open').length,
      inProgress: tickets.filter(t => t.status === 'in_progress').length,
      resolved: tickets.filter(t => t.status === 'resolved').length,
      closed: tickets.filter(t => t.status === 'closed').length
    }
  });
});

// Admin Logs
app.get('/api/admin/logs', adminAuth, (req, res) => {
  res.json(systemLogs);
});

// User Management
app.get('/api/admin/users', adminAuth, (req, res) => {
  res.json(users);
});

app.post('/api/admin/users', adminAuth, (req, res) => {
  const newUser = { id: users.length + 1, ...req.body };
  users.push(newUser);
  saveSettings({ users });
  addSystemLog('INFO', `[Admin] Created new user: ${newUser.email}`, { admin: 'Superuser' });
  res.status(201).json(newUser);
});

app.put('/api/admin/users/:id', adminAuth, (req, res) => {
  const { id } = req.params;
  const index = users.findIndex(u => u.id == id);
  if (index !== -1) {
    const updateData = { ...req.body };
    // If password is empty or not provided, don't update it
    if (!updateData.password) {
      delete updateData.password;
    }

    // Logic for Plan Change & Refill
    const oldPlanName = users[index].plan;
    const oldCredits = users[index].credits;

    // Explicitly handle status updates first
    if (req.body.status) updateData.status = req.body.status;
    if (req.body.statusMessage !== undefined) updateData.statusMessage = req.body.statusMessage;

    // --- Plan changed: reset credits to new plan's default ---
    if (updateData.plan && updateData.plan !== oldPlanName) {
      const newPlanObj = plans.find(p => p.name === updateData.plan);
      const newPlanCredits = newPlanObj?.credits ?? oldCredits;
      // Base credits after plan change = new plan's credits
      updateData.credits = newPlanCredits;

      if (!users[index].transactions) users[index].transactions = [];
      users[index].transactions.push({
        id: `tx_admin_plan_${Date.now()}`,
        date: new Date().toISOString(),
        amount: 0, currency: 'USD',
        type: 'admin_plan_change',
        description: `Plan changed by Admin: ${oldPlanName} → ${updateData.plan}`,
        subDescription: `Credits reset to ${newPlanCredits} pts (was ${oldCredits} pts).`,
        creditsAdded: newPlanCredits - oldCredits,
        finalBalance: newPlanCredits,
        previousBalance: oldCredits,
        adjustmentType: 'plan_reset',
        planName: updateData.plan,
        isAdjustment: true
      });
    }

    // --- Add extra credits on top (applies after plan change if both sent) ---
    if (updateData.extraCreditsToAdd !== undefined && parseInt(updateData.extraCreditsToAdd) > 0) {
      const extra = parseInt(updateData.extraCreditsToAdd);
      const baseCredits = updateData.credits ?? oldCredits; // use post-plan-change value if applicable
      const finalCredits = baseCredits + extra;
      updateData.credits = finalCredits;

      if (!users[index].transactions) users[index].transactions = [];
      users[index].transactions.push({
        id: `tx_admin_extra_${Date.now()}`,
        date: new Date().toISOString(),
        amount: 0, currency: 'USD',
        type: 'admin_credit_adjustment',
        description: 'Extra Credits Added by Admin',
        subDescription: `${baseCredits} + ${extra} = ${finalCredits} pts.`,
        creditsAdded: extra,
        finalBalance: finalCredits,
        previousBalance: baseCredits,
        adjustmentType: 'add_extra',
        planName: updateData.plan || users[index].plan,
        isAdjustment: true
      });
    }
    // Clean up helper fields
    delete updateData.extraCreditsToAdd;
    delete updateData.creditAdjustmentType;

    users[index] = { ...users[index], ...updateData };
    saveSettings({ users });

    // Log specific sensitive changes
    if (req.body.status && req.body.status !== 'Active') {
      addSystemLog('WARN', `[Admin] User ${users[index].email} status changed to ${req.body.status}`);
    } else if (req.body.credits !== undefined) {
      addSystemLog('INFO', `[Admin] Adjusted credits for ${users[index].email} (New Balance: ${req.body.credits})`);
    } else {
      addSystemLog('INFO', `[Admin] Updated user profile: ${users[index].email}`);
    }

    res.json(users[index]);
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});

// Admin: Get detailed user stats
app.get('/api/admin/users/:id/stats', adminAuth, (req, res) => {
  const { id } = req.params;
  const user = users.find(u => u.id == id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const { password, ...safeUser } = user;
  const stats = user.usageStats || { posts: 0, comments: 0, images: 0, postsCredits: 0, commentsCredits: 0, imagesCredits: 0, totalSpent: 0, history: [] };

  // Compute avg/day from history
  const history = stats.history || [];
  let avgPerDay = 0;
  if (history.length > 0) {
    const oldest = new Date(history[0].date);
    const days = Math.max(1, Math.ceil((Date.now() - oldest.getTime()) / (1000 * 60 * 60 * 24)));
    avgPerDay = Math.round(stats.totalSpent / days);
  }

  // Plan info
  const planObj = plans.find(p => p.name === user.plan);

  res.json({
    ...safeUser,
    usageStats: stats,
    avgPerDay,
    planCredits: planObj?.credits ?? 0,
    transactions: user.transactions || []
  });
});



// Get Single User Profile (Safe)
app.get('/api/users/:id', (req, res) => {
  const { id } = req.params;
  const user = users.find(u => u.id == id);

  if (user) {
    // PROACTIVE DAILY LIMIT RESET
    const today = new Date().toISOString().split('T')[0];
    if (user.role !== 'admin' && user.lastUsageDate !== today) {
      user.dailyUsage = 0;
      user.dailyUsagePoints = 0;
      user.lastUsageDate = today;
      saveSettings({ users });
    }

    // PROACTIVE MONTHLY CREDIT RENEWAL (For Free/Starter Plan)
    // If the month is up for a free user, reset their credits to 100 and set next month
    if ((user.plan === 'Starter' || user.plan === 'starter') && user.subscriptionEnd && new Date() > new Date(user.subscriptionEnd)) {
      const now = new Date();
      const nextEnd = new Date(now);
      nextEnd.setMonth(nextEnd.getMonth() + 1);

      const freePlan = plans.find(p => p.id === 'starter' || p.name === 'Starter');
      const resetCredits = freePlan ? freePlan.credits : 100;

      user.credits = resetCredits;
      user.subscriptionStart = now.toISOString();
      user.subscriptionEnd = nextEnd.toISOString();

      if (!user.transactions) user.transactions = [];
      user.transactions.push({
        id: `renew_starter_${Date.now()}`,
        date: now.toISOString(),
        amount: 0,
        currency: 'USD',
        type: 'monthly_renewal',
        description: 'Monthly Free Plan Credit Renewal',
        subDescription: 'Your 100 monthly credits have been refilled.',
        creditsAdded: resetCredits,
        finalBalance: resetCredits,
        planName: 'Starter'
      });

      saveSettings({ users });
      addSystemLog('SUCCESS', `[Renewal] Monthly credits refilled for Starter user: ${user.email}`);
      console.log(`[Renewal] Monthly credits refilled for ${user.email}`);
    }

    const { password, ...safeUser } = user;
    res.json(safeUser);
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});

// User Self-Update Endpoint
app.put('/api/users/:id', (req, res) => {
  const { id } = req.params;
  const index = users.findIndex(u => u.id == id);

  if (index !== -1) {
    // Basic validation: prevent changing robust fields like role/credits/plan via this endpoint if needed
    // For this mock, we just take the body. In prod, strict schema validation.
    const { name, avatar } = req.body;

    // Only update allowed fields
    if (name) users[index].name = name;
    if (avatar) users[index].avatar = avatar; // assuming we add avatar field support

    saveSettings({ users });
    const { password, ...safeUser } = users[index];
    res.json(safeUser);
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});

app.delete('/api/admin/users/:id', adminAuth, (req, res) => {
  users = users.filter(u => u.id != req.params.id);
  saveSettings({ users });
  res.status(204).send();
});

// AI Settings
app.get('/api/admin/ai-settings', adminAuth, (req, res) => {
  const safeSettings = { ...aiSettings };
  if (safeSettings.apiKey) {
    safeSettings.apiKey = safeSettings.apiKey.substring(0, 4) + '****************' + safeSettings.apiKey.substring(safeSettings.apiKey.length - 4);
  }
  res.json(safeSettings);
});

app.post('/api/admin/ai-settings', adminAuth, (req, res) => {
  const newSettings = { ...req.body };
  // If API key is masked (contains asterisks), don't update it
  if (newSettings.apiKey && newSettings.apiKey.includes('****')) {
    delete newSettings.apiKey;
  }
  // Deep merge creditCosts if present
  if (newSettings.creditCosts) {
    newSettings.creditCosts = {
      comment: Number(newSettings.creditCosts.comment) || (aiSettings.creditCosts?.comment || 1),
      post: Number(newSettings.creditCosts.post) || (aiSettings.creditCosts?.post || 2),
      image: Number(newSettings.creditCosts.image) || (aiSettings.creditCosts?.image || 5)
    };
  }

  aiSettings = { ...aiSettings, ...newSettings };
  saveSettings({ ai: aiSettings });
  res.json({ message: 'Settings updated', settings: aiSettings });
});

// Stripe Settings Management
app.get('/api/admin/stripe-settings', adminAuth, (req, res) => {
  const safe = { ...stripeSettings };
  if (safe.secretKey) safe.secretKey = '********' + safe.secretKey.substring(safe.secretKey.length - 4);
  if (safe.webhookSecret) safe.webhookSecret = '********' + safe.webhookSecret.substring(safe.webhookSecret.length - 4);
  res.json(safe);
});

app.post('/api/admin/stripe-settings', adminAuth, (req, res) => {
  const newSettings = { ...req.body };
  // If keys are masked, don't update them
  if (newSettings.secretKey && newSettings.secretKey.includes('****')) delete newSettings.secretKey;
  if (newSettings.webhookSecret && newSettings.webhookSecret.includes('****')) delete newSettings.webhookSecret;

  stripeSettings = { ...stripeSettings, ...newSettings };
  saveSettings({ stripe: stripeSettings });
  console.log('[Stripe] Configuration updated');
  res.json({ message: 'Stripe settings updated', settings: stripeSettings });
});

// Reddit Settings Management
app.get('/api/admin/reddit-settings', adminAuth, (req, res) => {
  const safe = { ...redditSettings };
  if (safe.clientSecret) safe.clientSecret = '********' + safe.clientSecret.substring(safe.clientSecret.length - 4);
  res.json(safe);
});

app.post('/api/admin/reddit-settings', adminAuth, (req, res) => {
  const newSettings = { ...req.body };
  if (newSettings.clientSecret && newSettings.clientSecret.includes('****')) delete newSettings.clientSecret;
  redditSettings = { ...redditSettings, ...newSettings };
  saveSettings({ reddit: redditSettings });
  console.log('[Reddit] Configuration updated');
  res.json({ message: 'Reddit settings updated', settings: redditSettings });
});

// --- Support Ticketing System ---

app.get('/api/support/tickets', (req, res) => {
  const { email, role } = req.query;
  if (!email) return res.status(400).json({ error: 'Email required' });

  if (role?.toLowerCase() === 'admin') {
    // Also check token for admin access
    const authHeader = req.headers.authorization;
    if (authHeader !== 'Bearer mock-jwt-token-123') {
      return res.status(403).json({ error: 'Admin role requires valid authorization' });
    }
    res.json(tickets);
  } else {
    res.json(tickets.filter(t => t.userEmail === email));
  }
});

app.post('/api/support/tickets', (req, res) => {
  const newTicket = {
    ...req.body,
    id: `TKT-${Math.floor(1000 + Math.random() * 9000)}`,
    createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
  };
  tickets.unshift(newTicket);
  saveSettings({ tickets });
  res.status(201).json(newTicket);
});

app.put('/api/support/tickets/:id', (req, res) => {
  const { id } = req.params;
  const index = tickets.findIndex(t => t.id === id);
  if (index !== -1) {
    tickets[index] = { ...tickets[index], ...req.body, updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16) };
    saveSettings({ tickets });
    res.json(tickets[index]);
  } else {
    res.status(404).json({ error: 'Ticket not found' });
  }
});

// --- Reddit OAuth2 Flow ---

app.get('/api/auth/reddit/url', (req, res) => {
  if (!redditSettings.clientId) {
    return res.status(500).json({ error: 'Reddit Client ID not configured by Admin' });
  }

  const host = req.get('host');
  const protocol = host.includes('localhost') ? 'http' : 'https';
  // Use configured URI if available, otherwise construct dynamic one
  const redirectUri = redditSettings.redirectUri && redditSettings.redirectUri.trim() !== ''
    ? redditSettings.redirectUri
    : `${protocol}://${host}/auth/reddit/callback`;

  const state = Math.random().toString(36).substring(7);
  const scope = 'identity read submit';
  const url = `https://www.reddit.com/api/v1/authorize?client_id=${redditSettings.clientId}&response_type=code&state=${state}&redirect_uri=${encodeURIComponent(redirectUri)}&duration=permanent&scope=${scope}`;

  // Return the redirectUri used so frontend can store it if needed (optional)
  res.json({ url, redirectUri });
});

app.post('/api/auth/reddit/callback', async (req, res) => {
  const { code, userId } = req.body;
  if (!code) return res.status(400).json({ error: 'Code is required' });

  // Dynamic Redirect URI Logic (Must match exactly what was used in /url)
  const host = req.get('host');
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const redirectUri = redditSettings.redirectUri && redditSettings.redirectUri.trim() !== ''
    ? redditSettings.redirectUri
    : `${protocol}://${host}/auth/reddit/callback`;

  try {
    const auth = Buffer.from(`${redditSettings.clientId}:${redditSettings.clientSecret}`).toString('base64');

    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('code', code);
    params.append('redirect_uri', redirectUri);

    const response = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': redditSettings.userAgent || 'RedditgoApp/1.0'
      },
      body: params
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error);

    // Fetch user info to get username and icon
    const meRes = await fetch('https://oauth.reddit.com/api/v1/me', {
      headers: {
        'Authorization': `Bearer ${data.access_token}`,
        'User-Agent': redditSettings.userAgent
      }
    });
    const meData = await meRes.json();
    const redditUsername = meData.name;
    const redditIcon = meData.icon_img;

    // Check plan limits
    const user = users.find(u => u.id == userId);
    if (user) {
      // Find the limit from the configured plans
      const userPlan = plans.find(p => (p.id || '').toLowerCase() === (user.plan || '').toLowerCase() || (p.name || '').toLowerCase() === (user.plan || '').toLowerCase());
      const limit = userPlan?.maxAccounts || 1;

      const currentAccounts = user.connectedAccounts || [];
      const alreadyConnected = currentAccounts.find(a => a.username === redditUsername);

      if (!alreadyConnected && currentAccounts.length >= limit) {
        return res.status(403).json({ error: `Account limit reached for ${user.plan} plan (${limit} accounts max).` });
      }

      // Update or add to connectedAccounts
      if (alreadyConnected) {
        alreadyConnected.icon = redditIcon;
        alreadyConnected.lastSeen = new Date().toISOString();
      } else {
        if (!user.connectedAccounts) user.connectedAccounts = [];
        user.connectedAccounts.push({
          username: redditUsername,
          icon: redditIcon,
          connectedAt: new Date().toISOString(),
          lastSeen: new Date().toISOString()
        });
      }
      saveSettings({ users });
    }

    // Save tokens for this specific account
    saveTokens(userId, redditUsername, {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: Date.now() + (data.expires_in * 1000)
    });

    res.json({ success: true, username: redditUsername });
  } catch (error) {
    console.error('[Reddit OAuth Error]', error);
    res.status(500).json({ error: error.message });
  }
});

const getValidToken = async (userId, username) => {
  if (!userRedditTokens[userId]) return null;

  // If no username provided, try to get the first one (for backward compatibility if needed)
  const targetUsername = username || Object.keys(userRedditTokens[userId])[0];
  if (!targetUsername) return null;

  const tokens = userRedditTokens[userId][targetUsername];
  if (!tokens) return null;

  if (Date.now() < tokens.expiresAt - 60000) {
    return tokens.accessToken;
  }

  // Refresh token
  try {
    const auth = Buffer.from(`${redditSettings.clientId}:${redditSettings.clientSecret}`).toString('base64');
    const response = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': redditSettings.userAgent
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: tokens.refreshToken
      })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error);

    const newTokens = {
      accessToken: data.access_token,
      refreshToken: tokens.refreshToken,
      expiresAt: Date.now() + (data.expires_in * 1000)
    };

    saveTokens(userId, targetUsername, newTokens);
    return data.access_token;
  } catch (err) {
    console.error('[Reddit Token Refresh Error]', err);
    return null;
  }
};

app.get('/api/user/reddit/status', async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'User ID required' });

  const user = users.find(u => u.id == userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const accounts = user.connectedAccounts || [];

  res.json({
    connected: accounts.length > 0,
    accounts: accounts
  });
});


app.post('/api/user/reddit/disconnect', (req, res) => {
  const { userId, username } = req.body;
  if (!userId || !username) return res.status(400).json({ error: 'Missing userId or username' });

  const user = users.find(u => u.id == userId);
  if (user && user.connectedAccounts) {
    user.connectedAccounts = user.connectedAccounts.filter(a => a.username !== username);
    saveSettings({ users });
  }

  if (userRedditTokens[userId]) {
    delete userRedditTokens[userId][username];
    saveSettings({ userRedditTokens });
  }

  addSystemLog('INFO', `User disconnected Reddit account: ${username}`, { userId });

  res.json({ success: true });
});

// Helper to get credits for a plan
const getPlanCredits = (planName) => {
  if (!planName) return 0;
  // Try to find by name or id
  const p = plans.find(x => x.id.toLowerCase() === planName.toLowerCase() || x.name.toLowerCase() === planName.toLowerCase());
  return p ? p.credits : 0;
};


// AI Generation Proxy (Backend)
app.post('/api/generate', async (req, res) => {
  try {
    const { prompt, context, userId, type } = req.body; // type can be 'comment' or 'post'
    const keyToUse = aiSettings.apiKey || process.env.GEMINI_API_KEY;

    if (!keyToUse) {
      return res.status(500).json({ error: 'AI provider is not configured. Please contact the administrator.' });
    }

    const userIndex = users.findIndex(u => String(u.id) === String(userId));
    if (userIndex === -1) return res.status(404).json({ error: 'User not found' });
    const user = users[userIndex];

    const rawCost = (aiSettings.creditCosts && aiSettings.creditCosts[type]);
    const cost = Number(rawCost) || (type === 'post' ? 2 : 1);

    const today = new Date().toISOString().split('T')[0];

    // Reset daily usage if date changed (FOR EVERYONE)
    if (user.lastUsageDate !== today) {
      user.dailyUsage = 0;
      user.dailyUsagePoints = 0;
      user.lastUsageDate = today;
    }

    if (user.role !== 'admin') {
      const plan = plans.find(p => (p.name || '').toLowerCase() === (user.plan || '').toLowerCase() || (p.id || '').toLowerCase() === (user.plan || '').toLowerCase());
      const planLimit = user.billingCycle === 'yearly' ? plan?.dailyLimitYearly : plan?.dailyLimitMonthly;
      const dailyLimit = (Number(user.customDailyLimit) > 0) ? Number(user.customDailyLimit) : (Number(planLimit) || 0);

      if (dailyLimit > 0 && ((user.dailyUsagePoints || 0) + cost) > dailyLimit) {
        addSystemLog('WARN', `Daily limit reached for user: ${user.email}`, { dailyLimit, usagePoints: user.dailyUsagePoints, cost });
        return res.status(429).json({
          error: `Daily limit reached. Your ${Number(user.customDailyLimit) > 0 ? 'Custom' : user.plan} plan allows ${dailyLimit} credits per day.`,
          used: user.dailyUsagePoints,
          limit: dailyLimit
        });
      }

      if ((user.credits || 0) < cost) {
        return res.status(402).json({ error: `Insufficient credits. This action requires ${cost} credits.` });
      }
    }

    let text = '';

    if (aiSettings.provider === 'google') {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(keyToUse);
      const model = genAI.getGenerativeModel({
        model: aiSettings.model,
        generationConfig: {
          temperature: aiSettings.temperature,
          maxOutputTokens: aiSettings.maxOutputTokens,
        }
      });

      const result = await model.generateContent([
        aiSettings.systemPrompt,
        `Context: ${JSON.stringify(context)}`,
        `User Prompt: ${prompt}`
      ]);
      const response = await result.response;
      text = response.text();
    } else {
      // OpenAI or OpenRouter (OpenAI compatible API)
      const url = aiSettings.provider === 'openai'
        ? 'https://api.openai.com/v1/chat/completions'
        : `${aiSettings.baseUrl}/chat/completions`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${keyToUse}`,
          'HTTP-Referer': `https://redditgo.online`, // Specific for this app production or dynamic
          'X-Title': 'RedditGo Content Architect'
        },
        body: JSON.stringify({
          model: aiSettings.model,
          messages: [
            { role: 'system', content: aiSettings.systemPrompt },
            { role: 'user', content: `Context: ${JSON.stringify(context)}\n\nPrompt: ${prompt}` }
          ],
          temperature: aiSettings.temperature,
          max_tokens: aiSettings.maxOutputTokens
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || 'AI API Error');
      }
      if (data.choices && data.choices[0] && data.choices[0].message) {
        text = data.choices[0].message.content;
      } else {
        throw new Error('AI returned an empty or malformed response');
      }
    }

    // UPDATE STATS AND USAGE (FOR EVERYONE)
    if (user.role !== 'admin') {
      user.credits = Math.max(0, (user.credits || 0) - cost);
    }
    user.dailyUsage = (user.dailyUsage || 0) + 1;
    user.dailyUsagePoints = (user.dailyUsagePoints || 0) + cost;
    user.lastUsageDate = today;

    // Track usage stats
    if (!user.usageStats) user.usageStats = { posts: 0, comments: 0, images: 0, postsCredits: 0, commentsCredits: 0, imagesCredits: 0, totalSpent: 0, history: [] };
    const statKey = type === 'post' ? 'posts' : 'comments';
    const creditKey = type === 'post' ? 'postsCredits' : 'commentsCredits';
    user.usageStats[statKey] = (user.usageStats[statKey] || 0) + 1;
    user.usageStats[creditKey] = (user.usageStats[creditKey] || 0) + cost;
    user.usageStats.totalSpent = (user.usageStats.totalSpent || 0) + cost;
    user.usageStats.history = user.usageStats.history || [];
    user.usageStats.history.push({ date: new Date().toISOString(), type, cost });

    saveSettings({ users });
    addSystemLog('INFO', `AI Generation (${type}) by User ${userId}`, { cost, creditsRemaining: user.credits, role: user.role });

    res.json({
      text,
      credits: user.credits,
      dailyUsage: user.dailyUsage,
      dailyUsagePoints: user.dailyUsagePoints
    });
  } catch (error) {
    console.error('AI Generation Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// AI Image Generation
app.post('/api/generate-image', async (req, res) => {
  try {
    const { prompt, userId } = req.body;
    const keyToUse = aiSettings.apiKey || process.env.GEMINI_API_KEY;

    if (!keyToUse || !keyToUse.startsWith('sk-')) {
      return res.status(400).json({ error: 'OpenAI API Key required for image generation.' });
    }

    // CHECK CREDITS
    const userIndex = users.findIndex(u => String(u.id) === String(userId));
    if (userIndex === -1) return res.status(404).json({ error: 'User not found' });

    const user = users[userIndex];
    const plan = plans.find(p => (p.name || '').toLowerCase() === (user.plan || '').toLowerCase() || (p.id || '').toLowerCase() === (user.plan || '').toLowerCase());

    // PLAN FEATURE CHECK
    if (user.role !== 'admin' && plan && plan.allowImages === false) {
      addSystemLog('WARN', `Feature Blocked: Image generation attempted by ${user.plan} user: ${user.email}`);
      return res.status(403).json({
        error: 'AI Image Generation is not included in your current plan.',
        requiredPlan: 'Professional'
      });
    }

    const cost = Number(aiSettings.creditCosts?.image) || 5;

    const today = new Date().toISOString().split('T')[0];

    // Reset daily usage if date changed (FOR EVERYONE)
    if (user.lastUsageDate !== today) {
      user.dailyUsage = 0;
      user.dailyUsagePoints = 0;
      user.lastUsageDate = today;
    }

    if (user.role !== 'admin') {
      const planLimit = user.billingCycle === 'yearly' ? plan?.dailyLimitYearly : plan?.dailyLimitMonthly;
      const dailyLimit = (Number(user.customDailyLimit) > 0) ? Number(user.customDailyLimit) : (Number(planLimit) || 0);

      if (dailyLimit > 0 && ((user.dailyUsagePoints || 0) + cost) > dailyLimit) {
        addSystemLog('WARN', `Daily limit reached (Image) for user: ${user.email}`, { dailyLimit, usagePoints: user.dailyUsagePoints, cost });
        return res.status(429).json({
          error: `Daily limit reached. Your ${Number(user.customDailyLimit) > 0 ? 'Custom' : user.plan} plan allows ${dailyLimit} credits per day.`,
          used: user.dailyUsagePoints,
          limit: dailyLimit
        });
      }

      if ((user.credits || 0) < cost) {
        return res.status(402).json({ error: `Insufficient credits. Image generation requires ${cost} credits.` });
      }
    }

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${keyToUse}`
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: prompt,
        n: 1,
        size: "1024x1024"
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'Image AI API Error');

    // UPDATE STATS (FOR EVERYONE)
    if (user.role !== 'admin') {
      user.credits = Math.max(0, (user.credits || 0) - cost);
    }
    user.dailyUsage = (user.dailyUsage || 0) + 1;
    user.dailyUsagePoints = (user.dailyUsagePoints || 0) + cost;
    user.lastUsageDate = today;

    // Track usage stats
    if (!user.usageStats) user.usageStats = { posts: 0, comments: 0, images: 0, postsCredits: 0, commentsCredits: 0, imagesCredits: 0, totalSpent: 0, history: [] };
    user.usageStats.images = (user.usageStats.images || 0) + 1;
    user.usageStats.imagesCredits = (user.usageStats.imagesCredits || 0) + cost;
    user.usageStats.totalSpent = (user.usageStats.totalSpent || 0) + cost;
    user.usageStats.history = user.usageStats.history || [];
    user.usageStats.history.push({ date: new Date().toISOString(), type: 'image', cost });

    // SAVE LATEST IMAGE FOR RECOVERY
    user.latestImage = {
      url: data.data[0].url,
      prompt: prompt,
      date: new Date().toISOString()
    };

    saveSettings({ users });
    addSystemLog('INFO', `AI Image Generated by User ${userId}`, { cost, creditsRemaining: user.credits, role: user.role });

    res.json({
      url: data.data[0].url,
      credits: user.credits,
      dailyUsage: user.dailyUsage,
      dailyUsagePoints: user.dailyUsagePoints
    });
  } catch (error) {
    console.error("Image Gen Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to recover latest image
app.get('/api/user/latest-image', (req, res) => {
  const { userId } = req.query;
  const user = users.find(u => String(u.id) === String(userId));
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user.latestImage || null);
});

// Reddit Fetching Proxy (Free JSON Method)
// Post Reply to Reddit
app.post('/api/reddit/reply', async (req, res) => {
  try {
    const { userId, postId, comment, postTitle, subreddit, productMention, redditUsername } = req.body;
    if (!userId || !comment) return res.status(400).json({ error: 'Missing required fields' });

    console.log(`[Reddit] Posting reply for user ${userId} (account: ${redditUsername || 'default'}) on post ${postId}`);

    const token = await getValidToken(userId, redditUsername);
    let redditResponse = { success: true, message: 'Simulated success (Mock Post)' };

    // If it's a real Reddit post (not from MOCK_POSTS), attempt real API call
    if (token && postId && !['1', '2', '3', '4'].includes(postId)) {
      const response = await fetch('https://oauth.reddit.com/api/comment', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': redditSettings.userAgent
        },
        body: new URLSearchParams({
          api_type: 'json',
          text: comment,
          thing_id: `t3_${postId}`
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[Reddit Reply Error]', errorData);
        throw new Error('Failed to post to Reddit API');
      }
      redditResponse = await response.json();
      // Extract the real Reddit comment ID (format: t1_xxxx)
      try {
        const commentData = redditResponse.json?.data?.things?.[0]?.data;
        if (commentData && commentData.id) {
          redditResponse.commentId = `t1_${commentData.id}`;
        }
      } catch (e) {
        console.error('Error parsing Reddit comment ID:', e);
      }
    }

    // Save to history
    const entry = {
      id: Math.random().toString(36).substr(2, 9),
      userId,
      postId,
      redditCommentId: redditResponse.commentId || null,
      postTitle: postTitle || 'Reddit Post',
      postUrl: req.body.postUrl || '#',
      postContent: req.body.postContent || '',
      subreddit: subreddit || 'unknown',
      comment,
      productMention,
      redditUsername: redditUsername || 'unknown', // Track which account was used
      deployedAt: new Date().toISOString(),
      status: 'Sent',
      ups: 0,
      replies: 0,
      sentiment: 'Neutral'
    };

    sentReplies.unshift(entry);
    saveSettings({ replies: sentReplies });

    // Log the successful reply
    addSystemLog('SUCCESS', `Reddit Reply sent by User ${userId}`, { subreddit, postTitle });

    res.json({ success: true, entry });
  } catch (error) {
    addSystemLog('ERROR', `Reddit Reply Failed for User ${userId}: ${error.message}`);
    console.error('Reddit Reply Posting Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Fetch User Reply History
app.get('/api/user/replies', (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'User ID required' });

  const history = sentReplies.filter(r => r.userId == userId);
  res.json(history);
});

// Create New Reddit Post
app.post('/api/reddit/post', async (req, res) => {
  try {
    const { userId, subreddit, title, text, kind, redditUsername } = req.body;
    if (!userId || !subreddit || !title) return res.status(400).json({ error: 'Missing required fields' });

    console.log(`[Reddit] Creating new post for user ${userId} (account: ${redditUsername || 'default'}) in r/${subreddit}`);

    const token = await getValidToken(userId, redditUsername);
    if (!token) return res.status(401).json({ error: 'Reddit account not linked' });

    const bodyParams = new URLSearchParams({
      api_type: 'json',
      sr: subreddit,
      title: title,
      kind: kind || 'self',
    });

    if (kind === 'link') {
      bodyParams.append('url', text);
    } else {
      bodyParams.append('text', text);
    }

    const response = await fetch('https://oauth.reddit.com/api/submit', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': redditSettings.userAgent
      },
      body: bodyParams
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[Reddit Submit Error]', errorData);
      throw new Error('Failed to submit to Reddit API');
    }

    const redditResponse = await response.json();
    addSystemLog('SUCCESS', `Reddit Post submitted by User ${userId}: ${title}`, { subreddit });
    res.json({ success: true, redditResponse });
  } catch (error) {
    console.error('Reddit Post Submission Error:', error);
    addSystemLog('ERROR', `Reddit Post Failed for User ${userId}: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// Sync History with Real Reddit Data
app.get('/api/user/replies/sync', async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'User ID required' });

  console.log(`[Analytics] Syncing for User ${userId}. Store size: ${sentReplies.length}`);
  // Get current local history first to ensure we have something to return
  let history = sentReplies.filter(r => String(r.userId) === String(userId));
  console.log(`[Analytics] Found ${history.length} records for ${userId}`);

  try {
    const token = await getValidToken(userId);
    const userReplies = history.filter(r => r.redditCommentId);

    if (token && userReplies.length > 0) {
      console.log(`[Reddit Sync] Fetching live stats for ${userReplies.length} replies`);
      const ids = userReplies.map(r => r.redditCommentId).join(',');
      const response = await fetch(`https://oauth.reddit.com/api/info?id=${ids}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'User-Agent': redditSettings.userAgent
        }
      });

      if (response.ok) {
        const data = await response.json();
        const liveItems = data.data.children;

        liveItems.forEach(child => {
          const liveData = child.data;
          const entry = sentReplies.find(r => r.redditCommentId === liveData.name);
          if (entry) {
            entry.ups = liveData.ups;
            // num_comments is for posts, for comments we'd need to fetch more, but we can stick to upvotes for now
            entry.replies = liveData.num_comments || entry.replies || 0;
          }
        });

        // Refresh local history after sync
        history = sentReplies.filter(r => String(r.userId) === String(userId));
      }
    }
  } catch (error) {
    console.error('[Reddit Sync Error] Non-critical sync failure:', error);
    // Continue and return existing history even if sync fails
  }

  res.json(history);
});

// Fetch Real-time Reddit Profile (Karma)
app.get('/api/user/reddit/profile', async (req, res) => {
  const { userId, username } = req.query;
  if (!userId) return res.status(400).json({ error: 'User ID required' });

  try {
    const token = await getValidToken(userId, username);
    if (!token) return res.status(401).json({ error: 'Reddit account not linked' });

    const response = await fetch('https://oauth.reddit.com/api/v1/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'User-Agent': redditSettings.userAgent
      }
    });

    if (!response.ok) throw new Error('Failed to fetch Reddit profile');
    const data = await response.json();

    res.json({
      name: data.name,
      commentKarma: data.comment_karma,
      linkKarma: data.link_karma,
      totalKarma: data.total_karma,
      hasModMail: data.has_mod_mail,
      icon: data.icon_img
    });
  } catch (error) {
    console.error('Profile Fetch Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/reddit/posts', async (req, res) => {
  try {
    const { subreddit = 'saas', keywords = '', userId } = req.query;
    console.log(`[Reddit] Fetching for User ${userId} from r/${subreddit}`);

    const token = userId ? await getValidToken(userId) : null;

    let url, headers;

    if (token) {
      // Use Official API with OAuth Token
      const searchQuery = keywords ? `${keywords} subreddit:${subreddit}` : `subreddit:${subreddit}`;
      url = `https://oauth.reddit.com/r/${subreddit}/search.json?q=${encodeURIComponent(searchQuery)}&sort=new&limit=25`;
      headers = {
        'Authorization': `Bearer ${token}`,
        'User-Agent': redditSettings.userAgent
      };
    } else {
      return res.status(401).json({ error: 'Reddit account not linked. Please go to Settings to link your account.' });
    }

    const response = await fetch(url, { headers });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Reddit Error] Status: ${response.status} - ${errorText.substring(0, 100)}`);
      throw new Error(`Reddit API Blocked (Status ${response.status}). Please link your Reddit account in Dashboard.`);
    }

    const data = await response.json();
    const keywordList = keywords.toLowerCase().split(',').map(k => k.trim()).filter(k => k);

    const posts = data.data.children.map(child => {
      const post = child.data;

      // Relevance & Opportunity Scoring
      let score = 0;
      const content = (post.title + ' ' + post.selftext).toLowerCase();

      // Keyword matching
      let matchCount = 0;
      keywordList.forEach(word => {
        if (content.includes(word)) {
          score += 40;
          matchCount++;
        }
      });

      // Intent Detection
      let intent = 'General';
      if (content.match(/alternative|instead of|replace|better than/i)) intent = 'Seeking Alternative';
      else if (content.match(/how to|help|question|issue|problem/i)) intent = 'Problem Solving';
      else if (content.match(/recommend|best|any advice|suggestion/i)) intent = 'Request Advice';
      else if (content.match(/built|show|made|launched/i)) intent = 'Product Launch';

      // Score for intent
      if (intent !== 'General') score += 20;

      // Engagement score (capped)
      score += Math.min(post.ups / 5, 20);
      score += Math.min(post.num_comments * 2, 20);

      // Final normalized score (0-100)
      const opportunityScore = Math.min(Math.round(score), 100);

      // Competitor Detection (Mock list for demo, could be dynamic)
      const competitors = ['hubspot', 'salesforce', 'buffer', 'hootsuite'];
      const mentionedCompetitors = competitors.filter(c => content.includes(c));

      return {
        id: post.id,
        title: post.title,
        author: post.author,
        subreddit: post.subreddit,
        ups: post.ups,
        num_comments: post.num_comments,
        selftext: post.selftext,
        url: `https://reddit.com${post.permalink}`,
        created_utc: post.created_utc,
        opportunityScore,
        intent,
        isHot: post.ups > 100 || post.num_comments > 50,
        competitors: mentionedCompetitors
      };
    });

    res.json(posts.sort((a, b) => b.opportunityScore - a.opportunityScore).slice(0, 20));
  } catch (error) {
    console.error('Reddit Fetch Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));

  app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
