
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

const SETTINGS_FILE = './settings.storage.json';

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
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Request Logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  if (req.method === 'POST') console.log('Body:', JSON.stringify(req.body));
  next();
});

// JSON Error Handler for Body Parser
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.error('Bad JSON request:', err.message);
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
    monthlyPrice: 0,
    yearlyPrice: 0,
    credits: 100,
    features: ['20 AI Actions/mo', 'Basic Reddit Analytics', '1 Connected Account', 'Community Support'],
    isPopular: false,
    isCustom: true
  },
  {
    id: 'pro',
    name: 'Professional',
    monthlyPrice: 29,
    yearlyPrice: 290,
    credits: 150,
    features: ['150 AI Actions/mo', 'Advanced Post Scheduling', '3 Connected Accounts', 'Priority Support', 'Image Generation'],
    isPopular: true,
    highlightText: 'Most Popular',
    isCustom: true
  },
  {
    id: 'agency',
    name: 'Agency',
    monthlyPrice: 99,
    yearlyPrice: 990,
    credits: 600,
    features: ['600 AI Actions/mo', 'Unlimited Accounts', 'Team Collaboration', 'Dedicated Manager', 'API Access', 'White-label Reports'],
    isPopular: false,
    isCustom: true
  }
];

// Superuser enforcement - info@marketation.online is the ONLY admin for now
// Superuser enforcement - info@marketation.online is the ONLY admin for now
const superuser = {
  id: 1,
  name: 'Admin',
  email: process.env.ADMIN_EMAIL,
  password: process.env.ADMIN_PASSWORD,
  role: 'admin',
  plan: 'Pro',
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

// Authentication Endpoints
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email && u.password === password);

  if (user) {
    if (user.subscriptionEnd && new Date() > new Date(user.subscriptionEnd)) {
      console.log(`[Subscription] User ${user.email} subscription expired. Downgrading.`);
      user.plan = 'Starter';
      const freePlan = plans.find(p => p.id === 'starter');
      user.credits = freePlan ? freePlan.credits : 50;
      user.subscriptionStart = null;
      user.subscriptionEnd = null;
      saveSettings({ users });
    }

    // In a real app, generate a JWT token here
    const { password, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword, token: 'mock-jwt-token-123' });
  } else {
    res.status(401).json({ error: 'Invalid email or password' });
  }
});

app.post('/api/auth/signup', (req, res) => {
  const { name, email, password } = req.body;

  if (users.find(u => u.email === email)) {
    return res.status(400).json({ error: 'User already exists' });
  }

  const newUser = {
    id: users.length + 1,
    name,
    email,
    password, // In a real app, hash this!
    role: 'user',
    plan: 'Free',
    status: 'Active',
    credits: 100, // Grant initial credits upon signup
    hasCompletedOnboarding: false
  };

  users.push(newUser);
  saveSettings({ users }); // Persist new user
  const { password: _, ...userWithoutPassword } = newUser;
  res.status(201).json({ user: userWithoutPassword, token: 'mock-jwt-token-new' });
});

app.post('/api/auth/forgot-password', (req, res) => {
  const { email } = req.body;
  const user = users.find(u => u.email === email);

  if (user) {
    console.log(`[Mock Email] Password reset link sent to ${email}`);
    res.json({ message: 'If an account exists, a reset link has been sent.' });
  } else {
    // For security, distinct generic message or same message
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
    res.json({ success: true, credits: user.credits, bonusAwarded });
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});

let aiSettings = savedData.ai || {
  provider: 'google',
  model: 'gemini-1.5-flash',
  temperature: 0.7,
  maxOutputTokens: 1024,
  systemPrompt: 'You are a helpful Reddit assistant. Generate engaging and valuable replies.',
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
  redirectUri: 'http://localhost:5173/auth/reddit/callback',
  userAgent: 'web:redigo:v1.0.0 (by /u/yourusername)'
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
  res.json(plans);
});

app.post('/api/plans', (req, res) => {
  const { id, name, monthlyPrice, yearlyPrice, credits, features, isPopular, highlightText } = req.body;

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
    features: features || [],
    isPopular: !!isPopular,
    highlightText: highlightText || '',
    isCustom: true // Mark as custom created plan
  };

  plans.push(newPlan);
  saveSettings({ plans });
  res.status(201).json(newPlan);
});

app.put('/api/plans/:id', (req, res) => {
  const { id } = req.params;
  const planIndex = plans.findIndex(p => p.id === id);

  if (planIndex === -1) {
    return res.status(404).json({ error: 'Plan not found' });
  }

  const { name, monthlyPrice, yearlyPrice, credits, features, isPopular, highlightText } = req.body;

  plans[planIndex] = {
    ...plans[planIndex],
    name: name || plans[planIndex].name,
    monthlyPrice: monthlyPrice !== undefined ? parseFloat(monthlyPrice) : plans[planIndex].monthlyPrice,
    yearlyPrice: yearlyPrice !== undefined ? parseFloat(yearlyPrice) : plans[planIndex].yearlyPrice,
    credits: credits !== undefined ? parseInt(credits) : plans[planIndex].credits,
    features: features || plans[planIndex].features,
    isPopular: isPopular !== undefined ? !!isPopular : plans[planIndex].isPopular,
    highlightText: highlightText || plans[planIndex].highlightText,
    isCustom: true
  };

  saveSettings({ plans });
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

  plans.splice(planIndex, 1);
  saveSettings({ plans });
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
    return res.json({ success: true, user, message: 'Plan activated (Test Mode)' });
    // --------------------------------------
  }

  // Create Stripe Session
  try {
    const price = billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: `${plan.name} Plan (${billingCycle})` },
          unit_amount: price * 100, // Cents
        },
        quantity: 1,
      }],
      mode: 'payment', // One-time payment for now, or 'subscription' if using Stripe Products
      customer_email: user.email,
      metadata: {
        userEmail: user.email,
        plan: plan.name, // Pass ID or Name
        credits: plan.credits
      },
      success_url: `http://localhost:5173/settings?success=true&plan=${plan.name}`,
      cancel_url: `http://localhost:5173/pricing?canceled=true`,
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
app.get('/api/user/brand-profile', (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'userId required' });
  res.json(brandProfiles[userId] || {});
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

// Routes

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

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

// User Management
app.get('/api/admin/users', adminAuth, (req, res) => {
  res.json(users);
});

app.post('/api/admin/users', adminAuth, (req, res) => {
  const newUser = { id: users.length + 1, ...req.body };
  users.push(newUser);
  saveSettings({ users });
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
    users[index] = { ...users[index], ...updateData };
    saveSettings({ users });
    res.json(users[index]);
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

  const state = Math.random().toString(36).substring(7);
  const scope = 'identity read submit';
  const url = `https://www.reddit.com/api/v1/authorize?client_id=${redditSettings.clientId}&response_type=code&state=${state}&redirect_uri=${encodeURIComponent(redditSettings.redirectUri)}&duration=permanent&scope=${scope}`;

  res.json({ url });
});

app.post('/api/auth/reddit/callback', async (req, res) => {
  const { code, userId } = req.body;
  if (!code) return res.status(400).json({ error: 'Code is required' });

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
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redditSettings.redirectUri
      })
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
      const planLimits = { 'Free': 1, 'Starter': 1, 'Professional': 3, 'Pro': 3, 'Agency': 100 };
      const limit = planLimits[user.plan] || 1;

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

// Create Checkout Session
app.post('/api/create-checkout-session', async (req, res) => {
  const stripe = getStripe();
  if (!stripe) return res.status(500).json({ error: 'Stripe not configured' });

  const { plan, cycle, userEmail } = req.body; // plan: 'Growth' | 'Agency', cycle: 'monthly' | 'yearly'

  const prices = {
    'Growth': { monthly: 2900, yearly: 29000 },
    'Agency': { monthly: 7900, yearly: 79000 }
  };

  const unitAmount = cycle === 'yearly' ? prices[plan].yearly : prices[plan].monthly;

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${plan} Plan (${cycle})`,
            },
            unit_amount: unitAmount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment', // Use 'subscription' for recurring, 'payment' for one-time
      customer_email: userEmail, // Pre-fill user email
      metadata: {
        plan: plan,
        userEmail: userEmail
      },
      success_url: `http://localhost:5173/dashboard?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: `http://localhost:5173/pricing?canceled=true`,
    });

    res.json({ id: session.id, url: session.url });
  } catch (error) {
    console.error('[Stripe Error]', error);
    res.status(500).json({ error: error.message });
  }
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

  res.json({ success: true });
});

// Helper to get credits for a plan
const getPlanCredits = (planName) => {
  if (!planName) return 0;
  // Try to find by name or id
  const p = plans.find(x => x.id.toLowerCase() === planName.toLowerCase() || x.name.toLowerCase() === planName.toLowerCase());
  return p ? p.credits : 0;
};

// Webhook Handler (Mock)
app.post('/api/webhook', express.raw({ type: 'application/json' }), async (request, response) => {
  const sig = request.headers['stripe-signature'];
  const stripe = getStripe();

  let event;

  try {
    if (stripeSettings.webhookSecret && stripe) {
      event = stripe.webhooks.constructEvent(request.body, sig, stripeSettings.webhookSecret);
    } else {
      // For development/sandbox without secret locally
      let bodyData = request.body;
      if (Buffer.isBuffer(bodyData)) {
        bodyData = bodyData.toString('utf8');
      }
      try {
        if (typeof bodyData === 'string') {
          event = JSON.parse(bodyData);
        } else {
          event = bodyData;
        }
      } catch (e) {
        // If parsing fails, just use body directly if simplistic
        event = request.body;
      }
    }
  } catch (err) {
    console.error(`[Webhook Error] ${err.message}`);
    return response.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    // Metadata is critical here
    const { userEmail, plan } = session.metadata || {};

    console.log(`[Webhook] Payment successful for ${userEmail}. Plan: ${plan}`);

    if (userEmail && plan) {
      const userIndex = users.findIndex(u => u.email === userEmail);
      if (userIndex !== -1) {

        // 1. Determine Credits to Add
        // User asked: "Shouldn't the points be added...?" -> YES.
        const creditsToAdd = getPlanCredits(plan);
        const currentCredits = users[userIndex].credits || 0;

        // 2. Calculate Subscription Period (1 Month explicitly)
        const now = new Date();
        const oneMonthLater = new Date(now);
        oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);

        // 3. Update User
        users[userIndex].plan = plan;
        users[userIndex].status = 'Active';
        users[userIndex].credits = currentCredits + creditsToAdd; // Accumulate
        users[userIndex].subscriptionStart = now.toISOString();
        users[userIndex].subscriptionEnd = oneMonthLater.toISOString();

        saveSettings({ users });
        console.log(`[Database] User ${userEmail} upgraded to ${plan}. Added ${creditsToAdd} credits. New Total: ${users[userIndex].credits}. Expires: ${oneMonthLater.toISOString()}`);
      } else {
        console.warn(`[Database] User ${userEmail} not found!`);
      }
    }
  }

  response.send();
});

// AI Generation Proxy (Backend)
app.post('/api/generate', async (req, res) => {
  try {
    const { prompt, context, userId, type } = req.body; // type can be 'comment' or 'post'
    const keyToUse = aiSettings.apiKey || process.env.GEMINI_API_KEY;

    if (!keyToUse) {
      return res.status(500).json({ error: 'AI provider is not configured. Please contact the administrator.' });
    }

    // CHECK CREDITS
    const userIndex = users.findIndex(u => String(u.id) === String(userId));
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[userIndex];
    const rawCost = (aiSettings.creditCosts && aiSettings.creditCosts[type]);
    const cost = Number(rawCost) || (type === 'post' ? 2 : 1);

    if (user.role !== 'admin' && (user.credits || 0) < cost) {
      return res.status(402).json({ error: `Insufficient credits. This action requires ${cost} credits.` });
    }

    let text = '';

    if (aiSettings.provider === 'google') {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(keyToUse);
      const model = genAI.getGenerativeModel({ model: aiSettings.model });

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
          'HTTP-Referer': 'http://localhost:5173', // Optional for OpenRouter
          'X-Title': 'Redigo' // Optional for OpenRouter
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

    // DEDUCT CREDIT (except for admin)
    if (user.role !== 'admin') {
      user.credits = Math.max(0, (user.credits || 0) - cost);
      saveSettings({ users });
    }

    res.json({ text, credits: user.credits });
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
    const cost = Number(aiSettings.creditCosts?.image) || 5;

    if (user.role !== 'admin' && (user.credits || 0) < cost) {
      return res.status(402).json({ error: `Insufficient credits. Image generation requires ${cost} credits.` });
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

    // DEDUCT CREDIT
    if (user.role !== 'admin') {
      user.credits = Math.max(0, (user.credits || 0) - cost);
      saveSettings({ users });
    }

    res.json({ url: data.data[0].url, credits: user.credits });
  } catch (error) {
    console.error("Image Gen Error:", error);
    res.status(500).json({ error: error.message });
  }
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

    // Deduct credits logic (simplified for mock)
    const userIndex = users.findIndex(u => u.id == userId);
    if (userIndex !== -1 && users[userIndex].plan === 'Free') {
      users[userIndex].credits = (users[userIndex].credits || 3) - 1;
    }

    res.json({ success: true, entry });
  } catch (error) {
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
    res.json({ success: true, redditResponse });
  } catch (error) {
    console.error('Reddit Post Submission Error:', error);
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

  app.get('(.*)', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
