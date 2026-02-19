
import express from 'express';
import cors from 'cors';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

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

// RESET ALL OTHER USERS FOR TESTING (Except specific testing accounts)
const excludedEmails = [superuser.email];
users.forEach(u => {
  if (!excludedEmails.includes(u.email)) {
    u.hasCompletedOnboarding = false;
  }
});
saveSettings({ users });
console.log(`--- ADMIN ACCOUNT READY: ${superuser.email} ---`);

let tickets = savedData.tickets || [];
let sentReplies = savedData.replies || [];

// Authentication Endpoints
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email && u.password === password);

  if (user) {
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
    users[index].hasCompletedOnboarding = true;
    saveSettings({ users });
    res.json({ success: true, hasCompletedOnboarding: true });
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});

app.post('/api/user/brand-profile', (req, res) => {
  const { userId, ...brandData } = req.body;
  const index = users.findIndex(u => u.id == userId);
  if (index !== -1) {
    users[index].brandProfile = brandData;
    saveSettings({ users });
    res.json({ success: true });
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
  baseUrl: 'https://openrouter.ai/api/v1'
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

const saveTokens = (tokens) => {
  userRedditTokens = { ...userRedditTokens, ...tokens };
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

    // Save tokens for this user
    saveTokens({
      [userId]: {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: Date.now() + (data.expires_in * 1000)
      }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('[Reddit OAuth Error]', error);
    res.status(500).json({ error: error.message });
  }
});

const getValidToken = async (userId) => {
  const tokens = userRedditTokens[userId];
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
      refreshToken: tokens.refreshToken, // Reddit might not return a new refresh token
      expiresAt: Date.now() + (data.expires_in * 1000)
    };

    saveTokens({ [userId]: newTokens });
    return data.access_token;
  } catch (err) {
    console.error('[Reddit Token Refresh Error]', err);
    return null;
  }
};

app.get('/api/user/reddit/status', async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'User ID required' });

  const token = await getValidToken(userId);
  if (!token) return res.json({ connected: false });

  try {
    const response = await fetch('https://oauth.reddit.com/api/v1/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'User-Agent': redditSettings.userAgent
      }
    });

    if (!response.ok) throw new Error('Failed to fetch Reddit user data');

    const data = await response.json();
    res.json({
      connected: true,
      username: data.name,
      icon: data.icon_img
    });
  } catch (err) {
    console.error('[Reddit Status Error]', err);
    res.json({ connected: false });
  }
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
      event = JSON.parse(request.body);
    }
  } catch (err) {
    console.error(`[Webhook Error] ${err.message}`);
    return response.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { userEmail, plan } = session.metadata || {};

    console.log(`[Webhook] Payment successful for ${userEmail}. Plan: ${plan}`);

    if (userEmail && plan) {
      const userIndex = users.findIndex(u => u.email === userEmail);
      if (userIndex !== -1) {
        users[userIndex].plan = plan;
        users[userIndex].status = 'Active';
        console.log(`[Database] User ${userEmail} upgraded to ${plan}`);
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
    const { prompt, context } = req.body;
    const keyToUse = aiSettings.apiKey || process.env.GEMINI_API_KEY;

    if (!keyToUse) {
      return res.status(500).json({ error: 'API Key not configured in Admin panel' });
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
      text = data.choices[0].message.content;
    }

    res.json({ text });
  } catch (error) {
    console.error('AI Generation Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// AI Image Generation
app.post('/api/generate-image', async (req, res) => {
  try {
    const { prompt } = req.body;
    const keyToUse = aiSettings.apiKey || process.env.GEMINI_API_KEY;

    if (!keyToUse || !keyToUse.startsWith('sk-')) {
      return res.status(400).json({ error: 'OpenAI API Key required for image generation.' });
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

    res.json({ url: data.data[0].url });
  } catch (error) {
    console.error("Image Gen Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Reddit Fetching Proxy (Free JSON Method)
// Post Reply to Reddit
app.post('/api/reddit/reply', async (req, res) => {
  try {
    const { userId, postId, comment, postTitle, subreddit, productMention } = req.body;
    if (!userId || !comment) return res.status(400).json({ error: 'Missing required fields' });

    console.log(`[Reddit] Posting reply for user ${userId} on post ${postId}`);

    const token = await getValidToken(userId);
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
    const { userId, subreddit, title, text, kind } = req.body;
    if (!userId || !subreddit || !title) return res.status(400).json({ error: 'Missing required fields' });

    console.log(`[Reddit] Creating new post for user ${userId} in r/${subreddit}`);

    const token = await getValidToken(userId);
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
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'User ID required' });

  try {
    const token = await getValidToken(userId);
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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
