
import express from 'express';
import cors from 'cors';
import Stripe from 'stripe';
import dotenv from 'dotenv';

import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// MongoDB Integration
import mongoose from 'mongoose';
import { User, TrackingLink, BrandProfile, Plan, Ticket, Setting, RedditReply, RedditPost, SystemLog } from './models.js';

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';

const JWT_SECRET = process.env.JWT_SECRET || 'secret_fallback_key_123';

// Connect to MongoDB
if (process.env.MONGO_URI) {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB!');
  } catch (err) {
    console.error('❌ Failed to connect to MongoDB:', err);
  }
}

let settingsCache = {};
const savedData = {};

const initSettings = async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      const allSettings = await Setting.find({});
      allSettings.forEach(s => {
        savedData[s.key] = s.value;
        settingsCache[s.key] = s.value;
      });
      console.log(`✅ Loaded ${allSettings.length} settings from MongoDB into cache`);
    }
  } catch (e) {
    console.error('Failed to load settings from DB.', e);
  }
};

await initSettings();

const loadSettings = () => settingsCache;

const saveSettings = (data) => {
  if (data) {
    Object.assign(settingsCache, data);
    for (const [key, value] of Object.entries(data)) {
      Setting.findOneAndUpdate({ key }, { value }, { upsert: true }).exec().catch(err => console.error('Failed to save setting:', key, err));
    }
  }
};

// ─── Email Service Logic ───────────────────────────────────────────────
const DEFAULT_EMAIL_TEMPLATES = {
  'welcome': {
    name: 'Welcome Email',
    subject: 'Welcome to Redditgo! 🚀',
    body: `<h1>Welcome, {{name}}!</h1><p>We're thrilled to have you here. Redditgo is designed to help you scale your Reddit outreach authentically.</p><p>Get started by connecting your Reddit account in the dashboard.</p><p>Best,<br/>The Redditgo Team</p>`,
    active: true
  },
  'reset_password': {
    name: 'Reset Password',
    subject: 'Reset your password - Redditgo',
    body: `<h1>Password Reset Request</h1><p>You requested a password reset. Click the button below to set a new password:</p><p><a href="{{reset_link}}" style="background:#EA580C;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:bold;display:inline-block;">Reset Password</a></p><p>If you didn't request this, you can safely ignore this email.</p>`,
    active: true
  },
  'payment_success': {
    name: 'Payment Successful',
    subject: 'Payment Successful! 🎉',
    body: `<h1>Thank you for your purchase!</h1><p>Your subscription to <strong>{{plan_name}}</strong> is now active.</p><p>Credits added: {{credits_added}}</p><p>Total balance: {{final_balance}}</p>`,
    active: true
  },
  'low_credits': {
    name: 'Low Credits Warning',
    subject: 'Low Credits Warning ⚠️',
    body: `<h1>Running low on credits!</h1><p>Hi {{name}}, your credit balance is down to {{balance}}.</p><p>To ensure your outreach doesn't stop, consider topping up or upgrading your plan.</p>`,
    active: true
  },
  'ticket_created': {
    name: 'Ticket Confirmation',
    subject: 'Support Ticket Received #{{ticket_id}}',
    body: `<h1>We've received your ticket!</h1><p>Hi {{name}}, thanks for reaching out. Our team is looking into your issue: <strong>{{subject}}</strong></p><p>You'll receive an email when we reply.</p>`,
    active: true
  },
  'admin_reply': {
    name: 'Admin Reply',
    subject: 'New Reply to Ticket #{{ticket_id}}',
    body: `<h1>You have a new reply!</h1><p>Hi {{name}}, an admin has replied to your ticket "<strong>{{subject}}</strong>":</p><div style="padding: 15px; background: #f3f4f6; border-radius: 10px; margin: 15px 0;">{{reply_message}}</div>`,
    active: true
  },
  'verify_email': {
    name: 'Verify Email',
    subject: 'Action Required: Verify your email - Redditgo',
    body: `<h1>Welcome to Redditgo, {{name}}!</h1><p>Please confirm your email address to activate your account and start your outreach journey.</p><p><a href="{{verify_link}}" style="background:#EA580C;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:bold;display:inline-block;">Verify Email</a></p><p>This link will expire in 24 hours.</p>`,
    active: true
  }
};

const getEmailTemplates = () => {
  const cached = settingsCache.emailTemplates || {};
  const merged = { ...DEFAULT_EMAIL_TEMPLATES };
  for (const key in cached) {
    if (cached[key]) merged[key] = { ...merged[key], ...cached[key] };
  }
  return merged;
};

const sendEmail = async (templateId, to, variables = {}) => {
  try {
    const templates = getEmailTemplates();
    const template = templates[templateId];

    if (!template || !template.active) return;

    if (!smtpSettings || !smtpSettings.host) {
      console.warn('[EMAIL] SMTP not configured. Skipping email.');
      return;
    }

    const port = parseInt(smtpSettings.port) || 587;
    // port 465 => implicit SSL (secure: true), other ports => STARTTLS (secure: false + requireTLS)
    const useImplicitSSL = smtpSettings.secure && port === 465;
    const transporter = nodemailer.createTransport({
      host: smtpSettings.host,
      port: port,
      secure: useImplicitSSL,
      ...((!useImplicitSSL && smtpSettings.secure) ? { requireTLS: true } : {}),
      auth: {
        user: smtpSettings.user,
        pass: smtpSettings.pass
      },
      tls: {
        rejectUnauthorized: false,
        ciphers: 'SSLv3'
      }
    });

    let subject = template.subject;
    let body = template.body;

    // Replace variables
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      subject = subject.replace(regex, value);
      body = body.replace(regex, value);
    });

    const mailOptions = {
      from: smtpSettings.from || `"Redditgo" <${smtpSettings.user}>`,
      to,
      subject,
      html: `
        <div style="font-family: 'Inter', sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 16px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #EA580C; margin: 0;">Redditgo</h1>
          </div>
          <div style="line-height: 1.6;">
            ${body}
          </div>
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #f1f5f9; text-align: center; color: #94a3b8; font-size: 12px;">
            © ${new Date().getFullYear()} Redditgo. All rights reserved.
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    addSystemLog('INFO', `Email sent: ${templateId} to ${to}`, { messageId: info.messageId });
    return info;
  } catch (err) {
    addSystemLog('ERROR', `Email failed: ${templateId} to ${to}`, { error: err.message });
    console.error('[EMAIL ERROR]', err);
  }
};

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

    const { userEmail, plan, credits, billingCycle } = session.metadata || {};
    const stripeCustomerEmail = session.customer_details?.email;
    const emailToSearch = userEmail || stripeCustomerEmail;

    addSystemLog('INFO', `[Webhook] Processing: ${emailToSearch} | Plan: ${plan} | Cycle: ${billingCycle}`);
    console.log(`[Webhook] Processing: ${emailToSearch} | Plan: ${plan} | Cycle: ${billingCycle}`);

    if (emailToSearch && plan) {
      try {
        const dbUser = await User.findOne({ email: new RegExp('^' + emailToSearch + '$', 'i') });

        if (dbUser) {
          let creditsToAdd = credits ? parseInt(credits) : await getPlanCredits(plan);

          // UPFRONT CREDITS FOR YEARLY
          if (billingCycle === 'yearly') {
            creditsToAdd = creditsToAdd * 12;
            addSystemLog('INFO', `[Webhook] Yearly billing detected. Multiplying credits by 12: ${creditsToAdd}`);
          }

          const currentCredits = dbUser.credits || 0;
          const now = new Date();
          const expirationDate = new Date(now);
          if (billingCycle === 'yearly') expirationDate.setFullYear(expirationDate.getFullYear() + 1);
          else expirationDate.setMonth(expirationDate.getMonth() + 1);

          dbUser.plan = plan;
          dbUser.billingCycle = billingCycle || 'monthly';
          dbUser.status = 'Active';
          dbUser.credits = currentCredits + creditsToAdd;
          dbUser.subscriptionStart = now.toISOString();
          dbUser.subscriptionEnd = expirationDate.toISOString();

          if (!dbUser.transactions) dbUser.transactions = [];
          const newBalance = currentCredits + creditsToAdd;

          dbUser.transactions.push({
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

          await dbUser.save();
          addSystemLog('SUCCESS', `[Webhook] User ${emailToSearch} upgraded to ${plan}`);
          console.log(`[Webhook] SUCCESS: ${emailToSearch} upgraded.`);

          // Send Payment Success Email
          sendEmail('payment_success', emailToSearch, {
            plan_name: plan,
            credits_added: creditsToAdd.toString(),
            final_balance: (currentCredits + creditsToAdd).toString()
          });
        } else {
          addSystemLog('ERROR', `[Webhook] User ${emailToSearch} not found.`);
          console.warn(`[Webhook] ERROR: User ${emailToSearch} not found.`);
        }
      } catch (err) {
        addSystemLog('ERROR', `[Webhook] DB Error modifying user ${emailToSearch}: ${err.message}`);
        console.error(`[Webhook] DB Error:`, err);
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


// --- System Logging (MongoDB) ---
const addSystemLog = async (level, message, metadata = {}) => {
  try {
    const logEntry = new SystemLog({
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      timestamp: new Date(),
      level: level.toUpperCase(),
      message,
      metadata
    });
    await logEntry.save();

    // Optional: Keep only last 2000 logs in DB to prevent bloating
    // This is better done as a periodic task, but for now we'll just insert.
    return logEntry;
  } catch (err) {
    console.error('Failed to save system log to DB:', err);
  }
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

    addSystemLog(logLevel, `${req.method} ${path}`, {
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      user: req.userEmail || 'Guest'
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

// Data Models are now managed by MongoDB schemas in models.js


// ─── Tracking Redirector ──────────────────────────────────────────────────
app.get(['/t/:id', '/t/:id/'], async (req, res) => {
  try {
    const { id } = req.params;
    const cleanId = id.replace(/\/$/, '').toLowerCase();

    const link = await TrackingLink.findOne({ id: new RegExp('^' + cleanId + '$', 'i') });

    if (!link) {
      console.warn(`[TRACKING] 404 - Link not found: ${cleanId}`);
      addSystemLog('WARN', `Tracking link not found: ${cleanId}`, {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        requestedUrl: req.originalUrl
      });
      return res.status(404).send("Tracking link not found");
    }

    link.clicks = (Number(link.clicks) || 0) + 1;
    const now = new Date().toISOString();

    if (!link.clickDetails) link.clickDetails = [];
    link.clickDetails.push({
      timestamp: now,
      userAgent: req.headers['user-agent'] || 'unknown',
      referer: req.headers['referer'] || 'direct',
      ip: req.headers['x-forwarded-for'] || req.ip || 'unknown'
    });
    link.lastClickedAt = now;

    if (link.clickDetails.length > 10000) {
      link.clickDetails = link.clickDetails.slice(-10000);
    }

    link.markModified('clickDetails');
    await link.save();

    addSystemLog('INFO', `Tracking Click: ${cleanId} [Total: ${link.clicks}]`, {
      id: cleanId,
      url: link.originalUrl,
      userId: link.userId,
      subreddit: link.subreddit
    });
    console.log(`[TRACKING DATA] Click Recorded: ${cleanId} | New Total: ${link.clicks} | User: ${link.userId}`);

    res.redirect(302, link.originalUrl);
  } catch (e) {
    res.status(500).send("Error");
  }
});

// ─── Create Tracking Link ──────────────────────────────────────────────────
app.post('/api/tracking/create', async (req, res) => {
  try {
    const { userId, originalUrl, subreddit, postId, type } = req.body;
    if (!userId || !originalUrl) return res.status(400).json({ error: 'Missing required fields' });

    const user = await User.findOne({ id: userId.toString() });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const userPlan = await Plan.findOne({ $or: [{ id: user.plan }, { name: user.plan }] });

    if (user.role !== 'admin' && userPlan && userPlan.allowTracking === false) {
      return res.status(403).json({ error: 'Link tracking is not included in your current plan.' });
    }

    let baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
    if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);
    if (!baseUrl.startsWith('http')) baseUrl = `https://${baseUrl}`;

    const id = Math.random().toString(36).substring(2, 8);
    const trackingUrl = `${baseUrl}/t/${id}`;

    const newLink = new TrackingLink({
      id,
      userId: userId.toString(),
      originalUrl,
      trackingUrl,
      subreddit,
      postId,
      type,
      createdAt: new Date().toISOString(),
      clicks: 0,
      clickDetails: []
    });

    await newLink.save();
    console.log(`[TRACKING] Created Link: ${id} | User: ${userId} | Target: ${originalUrl}`);
    res.json({ id, trackingUrl });
  } catch (e) {
    console.error('Create tracking tracking link error: ', e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/tracking/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const userLinks = await TrackingLink.find({ userId: userId.toString() }).sort({ createdAt: -1 });
    res.json(userLinks);
  } catch (e) {
    console.error('Fetch user tracking link error:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// Superuser enforcement
const setupAdmin = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminEmail || !adminPassword) return;

    let adminUser = await User.findOne({ email: adminEmail });
    if (!adminUser) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      adminUser = new User({
        id: '1',
        name: 'Admin',
        email: adminEmail,
        password: hashedPassword,
        role: 'admin',
        plan: 'Professional',
        status: 'Active',
        credits: 999999,
        hasCompletedOnboarding: true
      });
      await adminUser.save();
      console.log(`--- ADMIN ACCOUNT CREATED: ${adminEmail} ---`);
    } else {
      if (adminUser.role !== 'admin') {
        adminUser.role = 'admin';
        adminUser.hasCompletedOnboarding = true;
        await adminUser.save();
      }
      console.log(`--- ADMIN ACCOUNT READY: ${adminEmail} ---`);
    }
  } catch (e) {
    console.error('Error setting up admin account:', e);
  }
};
setupAdmin();

// ─── Middleware & Logic ───

// General Auth Middleware to enforce Bans/Suspensions on every request
const generalAuth = async (req, res, next) => {
  const path = req.path.replace(/\/$/, '');

  // Exempt public routes explicitly
  const publicRoutes = ['/api/auth/login', '/api/auth/signup', '/api/auth/verify-email', '/api/auth/resend-verification', '/api/auth/forgot-password', '/api/auth/reset-password', '/api/health', '/api/webhook'];
  if (publicRoutes.includes(path)) return next();

  // Try to extract user from token or ID
  const authHeader = req.headers.authorization;
  let userId = req.body?.userId || req.query?.userId || req.params?.id;
  let decodedUser = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    if (token === 'mock-jwt-token-123') {
      decodedUser = { role: 'admin' };
    } else if (token.startsWith('mock-user-token-')) {
      userId = token.replace('mock-user-token-', '');
    } else {
      try {
        decodedUser = jwt.verify(token, JWT_SECRET);
        if (!userId) userId = decodedUser.id;
      } catch (e) {
        // Fallback to existing userId or continue to let specific routes handle if auth is truly needed
      }
    }
  }

  // If we have a userId, check status
  if (userId) {
    try {
      const user = await User.findOne({ id: userId.toString() });
      if (user) {
        req.userEmail = user.email;
        if (user.status === 'Banned' || user.status === 'Suspended') {
          console.log(`[AUTH] Blocked ${user.status} user: ${user.email}`);
          return res.status(403).json({
            error: `Your account has been ${user.status.toLowerCase()}.`,
            reason: user.statusMessage || 'Contact support for details.'
          });
        }
      }
    } catch (e) {
      console.error('Error in generalAuth:', e);
    }
  } else if (decodedUser?.role === 'admin' || authHeader === 'Bearer mock-jwt-token-123') {
    // Admin token - check if admin is banned
    try {
      const adminId = decodedUser?.id;
      const adminUser = adminId ? await User.findOne({ id: adminId.toString() }) : await User.findOne({ role: 'admin' });
      if (adminUser) {
        req.userEmail = adminUser.email;
        if (adminUser.status === 'Banned' || adminUser.status === 'Suspended') {
          return res.status(403).json({
            error: `Your account has been ${adminUser.status.toLowerCase()}.`,
            reason: adminUser.statusMessage || ''
          });
        }
      }
    } catch (e) {
      console.error('Error in generalAuth (Admin check):', e);
    }
  }

  next();
};

app.use(generalAuth);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: new RegExp('^' + email + '$', 'i') });

    if (user) {
      let isMatch = false;
      if (user.password.startsWith('$2')) {
        // It's a bcrypt hash
        isMatch = await bcrypt.compare(password, user.password);
      } else {
        // Plain text legacy fallback
        isMatch = (user.password === password);
        if (isMatch) {
          user.password = await bcrypt.hash(password, 10);
          await user.save();
        }
      }

      if (!isMatch) {
        addSystemLog('WARN', `Failed login attempt (wrong password) for: ${email}`);
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Check if user is banned or suspended
      if (user.status === 'Banned' || user.status === 'Suspended') {
        addSystemLog('WARN', `[LOGIN] Blocked ${user.status} user: ${user.email}`);
        console.log(`[LOGIN] Blocked ${user.status} user: ${user.email}`);
        return res.status(403).json({
          error: `Your account has been ${user.status.toLowerCase()}.`,
          reason: user.statusMessage || 'No specific reason provided.'
        });
      }

      // Check if user is verified
      if (!user.isVerified) {
        return res.status(403).json({
          error: 'Email not verified.',
          reason: 'Please check your inbox to verify your email address before logging in.',
          isUnverified: true
        });
      }

      let updated = false;
      if (user.subscriptionEnd && new Date() > new Date(user.subscriptionEnd)) {
        addSystemLog('INFO', `[Subscription] User ${user.email} subscription expired. Downgrading and resetting period.`);
        console.log(`[Subscription] User ${user.email} subscription expired. Downgrading and resetting period.`);

        // Find Starter Plan
        const starterPlan = await Plan.findOne({ id: 'starter' }) || { credits: 100 };

        user.plan = 'Starter';
        const now = new Date();
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);

        user.credits = starterPlan.credits;
        user.subscriptionStart = now.toISOString();
        user.subscriptionEnd = nextMonth.toISOString();
        updated = true;
      }

      if (updated) {
        await user.save();
      }

      addSystemLog('INFO', `User logged in: ${user.email}`, { userId: user.id || user._id, role: user.role });

      const userObj = user.toObject();
      delete userObj.password;
      userObj.id = user.id || user._id.toString();

      // Implement real JWT
      const payload = { id: userObj.id, email: userObj.email, role: userObj.role };
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

      res.json({ user: userObj, token });
    } else {
      addSystemLog('WARN', `Failed login attempt for: ${email}`);
      res.status(401).json({ error: 'Invalid email or password' });
    }
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email: new RegExp('^' + email + '$', 'i') });
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

    const hashedPassword = await bcrypt.hash(password, 10);
    const tempId = Math.random().toString(36).substring(2, 9);

    const crypto = await import('crypto');
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const newUser = new User({
      id: tempId,
      name,
      email,
      password: hashedPassword,
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
      usageStats: { fill: true },
      isVerified: false,
      verificationToken: verificationToken,
      verificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    });

    await newUser.save();
    addSystemLog('SUCCESS', `New user registered (unverified): ${email}`, { userId: newUser.id || newUser._id });

    // Build verification link
    const host = req.get('host');
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const baseUrl = process.env.BASE_URL || `${protocol}://${host}`;
    const verifyLink = `${baseUrl}/verify-email?token=${verificationToken}&email=${encodeURIComponent(email)}`;

    // Send Verification Email
    sendEmail('verify_email', email, { name: name || 'there', verify_link: verifyLink });

    // Don't log them in yet, they must verify first
    res.status(201).json({
      success: true,
      message: 'Registration successful! Please check your email to verify your account.'
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
// ─── Rate Limiting for Emails ───
const emailRateLimits = new Map();

const checkRateLimit = (ip, email, action) => {
  const key = `${action}_${ip}_${email}`;
  const now = Date.now();
  const limitWindow = 15 * 60 * 1000; // 15 minutes
  const maxRequests = 3;

  if (!emailRateLimits.has(key)) {
    emailRateLimits.set(key, { count: 1, resetAt: now + limitWindow });
    return true; // allowed
  }

  const record = emailRateLimits.get(key);
  if (now > record.resetAt) {
    emailRateLimits.set(key, { count: 1, resetAt: now + limitWindow });
    return true;
  }

  if (record.count >= maxRequests) {
    return false; // blocked
  }

  record.count += 1;
  return true;
};

// ─── Auth Endpoints ───

app.post('/api/auth/verify-email', async (req, res) => {
  try {
    const { token, email } = req.body;
    if (!token || !email) {
      return res.status(400).json({ error: 'Token and email are required' });
    }

    const user = await User.findOne({
      email: new RegExp('^' + email + '$', 'i'),
      verificationToken: token,
      verificationExpires: { $gt: new Date() } // Must not be expired
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired verification link.' });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationExpires = undefined;
    await user.save();

    addSystemLog('SUCCESS', `User verified email: ${user.email}`);

    res.json({ success: true, message: 'Email successfully verified. You can now log in.' });
  } catch (err) {
    console.error('Verify email error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const user = await User.findOne({ email: new RegExp('^' + email + '$', 'i') });
    if (!user) {
      return res.status(400).json({ error: 'User not found.' });
    }

    if (user.isVerified) {
      return res.status(400).json({ error: 'Account is already verified.' });
    }

    // Rate Limiting
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    if (!checkRateLimit(ip, user.email, 'resend_verify')) {
      return res.status(429).json({ error: 'Too many requests. Please try again after 15 minutes.' });
    }

    // Generate new token
    const crypto = await import('crypto');
    const verificationToken = crypto.randomBytes(32).toString('hex');

    user.verificationToken = verificationToken;
    user.verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    await user.save();

    const host = req.get('host');
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const baseUrl = process.env.BASE_URL || `${protocol}://${host}`;
    const verifyLink = `${baseUrl}/verify-email?token=${verificationToken}&email=${encodeURIComponent(user.email)}`;

    await sendEmail('verify_email', user.email, { name: user.name || 'there', verify_link: verifyLink });

    res.json({ success: true, message: 'Verification email resent. Please check your inbox.' });
  } catch (err) {
    console.error('Resend verification error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const user = await User.findOne({ email: new RegExp('^' + email + '$', 'i') });

    if (user) {
      // Rate limit check
      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      if (!checkRateLimit(ip, user.email, 'forgot_password')) {
        return res.status(429).json({ error: 'Too many requests. Please try again after 15 minutes.' });
      }

      // Check if user is banned or suspended
      if (user.status === 'Banned' || user.status === 'Suspended') {
        return res.status(403).json({
          error: `Your account has been ${user.status.toLowerCase()}.`,
          reason: user.statusMessage || 'Contact support for details.'
        });
      }

      // Generate a secure random token
      const crypto = await import('crypto');
      const resetToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Save token to DB
      user.resetPasswordToken = resetToken;
      user.resetPasswordExpires = expiresAt;
      await user.save();

      // Build reset link
      const host = req.get('host');
      const protocol = host.includes('localhost') ? 'http' : 'https';
      const baseUrl = process.env.BASE_URL || `${protocol}://${host}`;
      const resetLink = `${baseUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(user.email)}`;

      addSystemLog('INFO', `[Password Reset] Token generated for: ${user.email}`);

      // Send email using the reset_password template
      const emailResult = await sendEmail('reset_password', user.email, {
        name: user.name || 'User',
        reset_link: resetLink
      });

      if (emailResult) {
        addSystemLog('SUCCESS', `[Password Reset] Email sent to: ${user.email}`);
      } else {
        addSystemLog('WARN', `[Password Reset] Email not sent (SMTP not configured?) - Token: ${resetToken}`);
        console.log(`[Password Reset] Reset link (for debug): ${resetLink}`);
      }
    }

    // Always return generic message for security (don't reveal if account exists)
    res.json({ message: 'If an account with this email exists, a reset link has been sent.' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reset Password with token
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, email, newPassword } = req.body;
    if (!token || !email || !newPassword) {
      return res.status(400).json({ error: 'Token, email, and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const user = await User.findOne({
      email: new RegExp('^' + email + '$', 'i'),
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() } // token must not be expired
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired password reset link. Please request a new one.' });
    }

    // Hash and save the new password
    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    addSystemLog('SUCCESS', `[Password Reset] Password successfully reset for: ${user.email}`);

    res.json({ success: true, message: 'Your password has been reset successfully. You can now log in.' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});



app.post('/api/user/complete-onboarding', async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findOne({ id: userId.toString() });

    if (user) {
      user.hasCompletedOnboarding = true;
      await user.save();
      addSystemLog('INFO', `User completed onboarding: ${user.email}`);
      res.json({
        success: true,
        hasCompletedOnboarding: true,
        credits: user.credits
      });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (err) {
    console.error('Onboarding error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/user/brand-profile', async (req, res) => {
  try {
    const { userId, ...brandData } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId required' });

    const user = await User.findOne({ id: userId.toString() });

    if (user) {
      let bonusAwarded = false;
      const isProfileEmpty = !user.brandProfile || Object.keys(user.brandProfile).length === 0;

      if (!user.hasCompletedOnboarding || (user.credits <= 100 && isProfileEmpty)) {
        if (!user.hasCompletedOnboarding) {
          user.credits = (user.credits || 0) + 100;
          bonusAwarded = true;
        }
      }

      user.brandProfile = brandData;
      user.hasCompletedOnboarding = true;
      user.markModified('brandProfile');

      // Ensure tracking in BrandProfile collection for completeness, though User embedded is main
      await BrandProfile.findOneAndUpdate(
        { userId: userId.toString() },
        { ...brandData, userId: userId.toString() },
        { upsert: true, new: true }
      );

      await user.save();

      console.log(`[BRAND] Profile updated for user ${userId} (${user.email}). Bonus: ${bonusAwarded}`);
      addSystemLog('INFO', `Brand profile updated for: ${user.email}`, {
        userId,
        brandName: brandData.brandName,
        bonusAwarded
      });

      res.json({
        success: true,
        credits: user.credits,
        bonusAwarded,
        brandProfile: user.brandProfile
      });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (err) {
    console.error('Brand profile error:', err);
    res.status(500).json({ error: 'Internal server error' });
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

// SMTP Settings (In-memory)
let smtpSettings = savedData.smtp || {
  host: '',
  port: 587,
  user: '',
  pass: '',
  from: '',
  secure: false
};

// Store user Reddit tokens (Initialized from DB/Cache)
if (!settingsCache.userRedditTokens) settingsCache.userRedditTokens = {};
const userRedditTokens = settingsCache.userRedditTokens;

// Plans API Endpoints
// Public configuration for UI
app.get('/api/config', (req, res) => {
  res.json({
    creditCosts: aiSettings.creditCosts
  });
});

app.get('/api/plans', async (req, res) => {
  try {
    const plansDb = await Plan.find({});
    res.json(plansDb);
  } catch (err) {
    console.error('Error fetching plans:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/plans', async (req, res) => {
  try {
    const { id, name, monthlyPrice, yearlyPrice, credits, dailyLimitMonthly, dailyLimitYearly, features, isPopular, highlightText, allowImages, allowTracking } = req.body;

    if (!id || !name || monthlyPrice === undefined || yearlyPrice === undefined || credits === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const existingPlan = await Plan.findOne({ id });
    if (existingPlan) {
      return res.status(400).json({ error: 'Plan ID already exists' });
    }

    const newPlanDb = new Plan({
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
      isCustom: true
    });

    await newPlanDb.save();
    addSystemLog('INFO', `New plan created: ${newPlanDb.name} (${newPlanDb.id})`);
    res.status(201).json(newPlanDb);
  } catch (err) {
    console.error('Error creating plan:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/plans/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const planDb = await Plan.findOne({ id });

    if (!planDb) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    const { name, monthlyPrice, yearlyPrice, credits, dailyLimitMonthly, dailyLimitYearly, features, isPopular, highlightText, allowImages, allowTracking } = req.body;

    planDb.name = name || planDb.name;
    if (monthlyPrice !== undefined) planDb.monthlyPrice = parseFloat(monthlyPrice);
    if (yearlyPrice !== undefined) planDb.yearlyPrice = parseFloat(yearlyPrice);
    if (credits !== undefined) planDb.credits = parseInt(credits);
    if (dailyLimitMonthly !== undefined) planDb.dailyLimitMonthly = parseInt(dailyLimitMonthly);
    if (dailyLimitYearly !== undefined) planDb.dailyLimitYearly = parseInt(dailyLimitYearly);
    if (features) planDb.features = features;
    if (isPopular !== undefined) planDb.isPopular = Boolean(isPopular);
    if (highlightText !== undefined) planDb.highlightText = String(highlightText);
    if (allowImages !== undefined) planDb.allowImages = Boolean(allowImages);
    if (allowTracking !== undefined) planDb.allowTracking = Boolean(allowTracking);
    planDb.isCustom = true;

    await planDb.save();
    addSystemLog('INFO', `Plan updated: ${planDb.name} (${id})`);
    res.json(planDb);
  } catch (err) {
    console.error('Error updating plan:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/plans/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const planDb = await Plan.findOne({ id });

    if (!planDb) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    // Check if any users are on this plan
    const usersOnPlan = await User.find({ plan: { $regex: new RegExp('^' + planDb.name + '$', 'i') } });
    if (usersOnPlan.length > 0) {
      return res.status(400).json({ error: 'Cannot delete plan with active users' });
    }

    const deletedPlanName = planDb.name;
    await Plan.deleteOne({ id });
    addSystemLog('WARN', `Plan deleted: ${deletedPlanName} (${id})`);
    res.json({ success: true, message: 'Plan deleted' });
  } catch (err) {
    console.error('Error deleting plan:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/user/subscribe', async (req, res) => {
  try {
    const { userId, planId, billingCycle } = req.body;

    const user = await User.findOne({ id: userId.toString() });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const plan = await Plan.findOne({ id: planId });
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    // If plan is free, activate immediately
    if (plan.monthlyPrice === 0 && plan.yearlyPrice === 0) {
      user.plan = plan.name;
      user.credits = plan.credits;
      user.status = 'Active';
      user.subscriptionStart = new Date().toISOString();
      user.subscriptionEnd = null;

      await user.save();
      addSystemLog('INFO', `User activated free plan: ${user.email} (${plan.name})`);
      return res.json({ success: true, user, message: 'Free plan activated' });
    }

    // If paid plan, create Stripe Session
    const stripe = getStripe();
    if (!stripe) {
      console.warn('[Stripe] Keys missing. Activating plan instantly for testing.');
      user.plan = plan.name;
      const currentCredits = user.credits || 0;
      user.credits = currentCredits + plan.credits;
      user.status = 'Active';

      const now = new Date();
      const end = new Date(now);
      if (billingCycle === 'yearly') end.setFullYear(end.getFullYear() + 1);
      else end.setMonth(end.getMonth() + 1);

      user.subscriptionStart = now.toISOString();
      user.subscriptionEnd = end.toISOString();

      await user.save();
      addSystemLog('WARN', `[TEST MODE] User activated plan: ${user.email} -> ${plan.name}`);
      return res.json({ success: true, user, message: 'Plan activated (Test Mode)' });
    }

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
        mode: 'payment',
        customer_email: user.email,
        metadata: {
          userEmail: user.email,
          plan: plan.name,
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
  } catch (err) {
    console.error('Subscription error:', err);
    res.status(500).json({ error: 'Internal server error' });
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

app.get('/api/user/brand-profile', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'userId required' });

    const user = await User.findOne({ id: userId.toString() });
    let profile = user ? user.brandProfile : null;

    // Fallback to separate collection if not in user document
    if (!profile || Object.keys(profile).length === 0) {
      profile = await BrandProfile.findOne({ userId: userId.toString() });
    }

    res.json(profile && (profile.brandName || profile.website || Object.keys(profile).length > 2) ? profile : DEFAULT_BRAND_PROFILE);
  } catch (err) {
    console.error('Error fetching brand profile:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// (Duplicate POST /api/user/brand-profile removed as it's now handled above)

const saveTokens = async (userId, username, tokenData) => {
  if (!userRedditTokens[userId]) userRedditTokens[userId] = {};
  userRedditTokens[userId][username] = tokenData;
  saveSettings({ userRedditTokens });

  try {
    const user = await User.findOne({ id: userId.toString() });
    if (user && user.connectedAccounts) {
      const acc = user.connectedAccounts.find(a => a.username === username);
      if (acc) {
        acc.accessToken = tokenData.accessToken;
        acc.refreshToken = tokenData.refreshToken;
        acc.expiresAt = tokenData.expiresAt;
        user.markModified('connectedAccounts');
        await user.save();
      }
    }
  } catch (err) {
    console.error('Error saving tokens to DB:', err);
  }
};

// Initialize Stripe Client dynamically
const getStripe = () => {
  if (!stripeSettings.secretKey) return null;
  return new Stripe(stripeSettings.secretKey);
};

// Auth Middleware for Admin Routes
const adminAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(403).json({ error: 'Unauthorized access to admin API' });

  const token = authHeader.replace('Bearer ', '');
  if (token === 'mock-jwt-token-123') return next(); // Fallback for hardcoded frontends

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role === 'admin') {
      next();
    } else {
      res.status(403).json({ error: 'Unauthorized access to admin API' });
    }
  } catch (err) {
    res.status(403).json({ error: 'Unauthorized access to admin API' });
  }
};

// Admin Stats
app.get('/api/admin/stats', adminAuth, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const allUsers = await User.find({});
    const allPlans = await Plan.find({});
    const allTickets = await Ticket.find({});

    const activeSubs = allUsers.filter(u =>
      u.status === 'Active' &&
      u.plan !== 'Starter' &&
      (u.role !== 'admin' || (u.email !== process.env.ADMIN_EMAIL))
    ).length;

    let totalPointsSpentToday = 0;
    let totalDailyCapacity = 0;

    allUsers.forEach(u => {
      if (u.lastUsageDate === today) {
        totalPointsSpentToday += (u.dailyUsagePoints || 0);
      }
      if (u.status === 'Active') {
        const plan = allPlans.find(p => (p.name || '').toLowerCase() === (u.plan || '').toLowerCase());
        const planLimit = u.billingCycle === 'yearly' ? plan?.dailyLimitYearly : plan?.dailyLimitMonthly;
        const effectiveLimit = (Number(u.customDailyLimit) > 0) ? Number(u.customDailyLimit) : (Number(planLimit) || 0);
        totalDailyCapacity += effectiveLimit;
      }
    });

    const apiUsagePercent = totalDailyCapacity > 0
      ? Math.min(100, Math.round((totalPointsSpentToday / totalDailyCapacity) * 100))
      : 0;

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const systemLogs = await SystemLog.find({ timestamp: { $gte: oneHourAgo } });
    const recentErrors = systemLogs.filter(log =>
      log.level === 'ERROR'
    ).length;

    let healthStatus = 'Healthy';
    let healthPercent = '100%';

    if (recentErrors > 15) {
      healthStatus = 'Critical';
      healthPercent = '65%';
    } else if (recentErrors > 5) {
      healthStatus = 'Degraded';
      healthPercent = '88%';
    } else if (recentErrors > 0) {
      healthStatus = 'Stable';
      healthPercent = '99%';
    }

    res.json({
      totalUsers: allUsers.length,
      activeSubscriptions: activeSubs,
      apiUsage: apiUsagePercent,
      systemHealth: healthPercent,
      healthLabel: healthStatus,
      ticketStats: {
        total: allTickets.length,
        open: allTickets.filter(t => t.status === 'open').length,
        inProgress: allTickets.filter(t => t.status === 'in_progress').length,
        resolved: allTickets.filter(t => t.status === 'resolved').length,
        closed: allTickets.filter(t => t.status === 'closed').length
      }
    });
  } catch (err) {
    console.error('Error fetching admin stats:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin Logs
app.get('/api/admin/logs', adminAuth, async (req, res) => {
  try {
    const logs = await SystemLog.find({}).sort({ timestamp: -1 }).limit(2000);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

// User Management
app.get('/api/admin/users', adminAuth, async (req, res) => {
  try {
    const allUsers = await User.find({});
    res.json(allUsers);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/admin/users', adminAuth, async (req, res) => {
  try {
    const newUser = new User({ id: Math.random().toString(36).substring(2, 9), ...req.body });
    await newUser.save();
    addSystemLog('INFO', `[Admin] Created new user: ${newUser.email}`, { admin: 'Superuser' });
    res.status(201).json(newUser);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/admin/users/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    let user = await User.findOne({ id: id.toString() });

    if (user) {
      const updateData = { ...req.body };
      if (!updateData.password) {
        delete updateData.password;
      }

      const oldPlanName = user.plan;
      const oldCredits = user.credits || 0;

      if (req.body.status) updateData.status = req.body.status;
      if (req.body.statusMessage !== undefined) updateData.statusMessage = req.body.statusMessage;

      if (updateData.plan && updateData.plan !== oldPlanName) {
        const newPlanObj = await Plan.findOne({ name: updateData.plan });
        const newPlanCredits = newPlanObj?.credits ?? oldCredits;
        updateData.credits = newPlanCredits;

        if (!user.transactions) updateData.transactions = [];
        const txs = user.transactions || [];
        txs.push({
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
        updateData.transactions = txs;
      }

      if (updateData.extraCreditsToAdd !== undefined && parseInt(updateData.extraCreditsToAdd) > 0) {
        const extra = parseInt(updateData.extraCreditsToAdd);
        const baseCredits = updateData.credits ?? oldCredits;
        const finalCredits = baseCredits + extra;
        updateData.credits = finalCredits;

        const txs = updateData.transactions || user.transactions || [];
        txs.push({
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
          planName: updateData.plan || user.plan,
          isAdjustment: true
        });
        updateData.transactions = txs;
      }

      delete updateData.extraCreditsToAdd;
      delete updateData.creditAdjustmentType;

      Object.assign(user, updateData);
      await user.save();

      if (req.body.status && req.body.status !== 'Active') {
        addSystemLog('WARN', `[Admin] User ${user.email} status changed to ${req.body.status}`);
      } else if (req.body.credits !== undefined) {
        addSystemLog('INFO', `[Admin] Adjusted credits for ${user.email} (New Balance: ${user.credits})`);
      } else {
        addSystemLog('INFO', `[Admin] Updated user profile: ${user.email}`);
      }

      res.json(user);
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (err) {
    console.error('Admin update user error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: Get detailed user stats
app.get('/api/admin/users/:id/stats', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findOne({ id: id.toString() });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const safeUser = user.toObject();
    delete safeUser.password;

    const stats = user.usageStats || { posts: 0, comments: 0, images: 0, postsCredits: 0, commentsCredits: 0, imagesCredits: 0, totalSpent: 0, history: [] };

    const history = stats.history || [];
    let avgPerDay = 0;
    if (history.length > 0) {
      const oldest = new Date(history[0].date);
      const days = Math.max(1, Math.ceil((Date.now() - oldest.getTime()) / (1000 * 60 * 60 * 24)));
      avgPerDay = Math.round(stats.totalSpent / days);
    }

    const planObj = await Plan.findOne({ name: user.plan });

    res.json({
      ...safeUser,
      usageStats: stats,
      avgPerDay,
      planCredits: planObj?.credits ?? 0,
      transactions: user.transactions || []
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});



// Get Single User Profile (Safe)
app.get('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findOne({ id: id.toString() });

    if (user) {
      // PROACTIVE DAILY LIMIT RESET
      const today = new Date().toISOString().split('T')[0];
      if (user.role !== 'admin' && user.lastUsageDate !== today) {
        user.dailyUsage = 0;
        user.dailyUsagePoints = 0;
        user.lastUsageDate = today;
        await user.save();
      }

      // PROACTIVE MONTHLY CREDIT RENEWAL
      if ((user.plan === 'Starter' || user.plan === 'starter') && user.subscriptionEnd && new Date() > new Date(user.subscriptionEnd)) {
        const now = new Date();
        const nextEnd = new Date(now);
        nextEnd.setMonth(nextEnd.getMonth() + 1);

        const freePlan = await Plan.findOne({ id: 'starter' });
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

        await user.save();
        addSystemLog('SUCCESS', `[Renewal] Monthly credits refilled for Starter user: ${user.email}`);
      }

      const safeUser = user.toObject();
      delete safeUser.password;
      res.json(safeUser);
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (err) {
    console.error('User fetch error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// User Self-Update Endpoint
app.put('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findOne({ id: id.toString() });

    if (user) {
      const { name, avatar } = req.body;
      if (name) user.name = name;
      if (avatar !== undefined) user.avatar = avatar;

      await user.save();
      const safeUser = user.toObject();
      delete safeUser.password;
      res.json(safeUser);
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Change Password Endpoint
app.put('/api/users/:id/password', async (req, res) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }

    const user = await User.findOne({ id: id.toString() });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    let isMatch = false;
    if (user.password.startsWith('$2')) {
      isMatch = await bcrypt.compare(currentPassword, user.password);
    } else {
      isMatch = (user.password === currentPassword);
    }

    if (!isMatch) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash and save new password
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    addSystemLog('INFO', `User changed password: ${user.email}`);
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    console.error('Password change error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/admin/users/:id', adminAuth, async (req, res) => {
  try {
    await User.deleteOne({ id: req.params.id.toString() });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Internal error' });
  }
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

// SMTP Settings Management
app.get('/api/admin/smtp-settings', adminAuth, (req, res) => {
  const safe = { ...smtpSettings };
  if (safe.pass) safe.pass = '********';
  res.json(safe);
});

app.post('/api/admin/smtp-settings', adminAuth, (req, res) => {
  const newSettings = { ...req.body };
  if (newSettings.pass && newSettings.pass.includes('****')) delete newSettings.pass;

  smtpSettings = { ...smtpSettings, ...newSettings };
  saveSettings({ smtp: smtpSettings });
  console.log('[SMTP] Configuration updated');
  res.json({ message: 'SMTP settings updated', settings: smtpSettings });
});

// Email Template Management
app.get('/api/admin/email-templates', adminAuth, (req, res) => {
  res.json(getEmailTemplates());
});

app.post('/api/admin/email-templates', adminAuth, (req, res) => {
  const templates = req.body;
  saveSettings({ emailTemplates: templates });
  res.json({ message: 'Email templates updated' });
});

app.post('/api/admin/email-templates/test', adminAuth, async (req, res) => {
  const { templateId, to, variables } = req.body;
  try {
    const info = await sendEmail(templateId, to, variables || {
      name: 'Admin Tester',
      subject: 'Test Subject',
      reply_message: 'This is a test reply from the admin dashboard.',
      ticket_id: '1234',
      plan_name: 'Pro Plan',
      credits_added: '500',
      final_balance: '1200',
      balance: '150'
    });
    if (info) res.json({ success: true, message: 'Test email sent!' });
    else res.status(400).json({ error: 'Failed to send email. Check SMTP settings or template status.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Support Ticketing System ---

app.get('/api/support/tickets', async (req, res) => {
  try {
    const { email, role } = req.query;
    if (!email) return res.status(400).json({ error: 'Email required' });

    if (role?.toLowerCase() === 'admin') {
      const authHeader = req.headers.authorization;
      if (authHeader !== 'Bearer mock-jwt-token-123') {
        return res.status(403).json({ error: 'Admin role requires valid authorization' });
      }
      const allTickets = await Ticket.find({}).sort({ createdAt: -1 });
      res.json(allTickets);
    } else {
      const userTickets = await Ticket.find({ userEmail: email }).sort({ createdAt: -1 });
      res.json(userTickets);
    }
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/support/tickets', async (req, res) => {
  try {
    const newTicket = new Ticket({
      ...req.body,
      id: `TKT-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
    });
    await newTicket.save();
    res.status(201).json(newTicket);

    // Send Ticket Confirmation Email
    sendEmail('ticket_created', newTicket.userEmail || newTicket.email, {
      name: newTicket.userName || 'Customer',
      ticket_id: newTicket.id,
      subject: newTicket.subject
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/support/tickets/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const ticket = await Ticket.findOne({ id });

    if (ticket) {
      const isNewAdminMessage =
        req.body.messages &&
        req.body.messages.length > (ticket.messages || []).length;

      let lastAdminMsg = null;
      if (isNewAdminMessage) {
        const lastMsg = req.body.messages[req.body.messages.length - 1];
        if (lastMsg.sender === 'Admin') {
          lastAdminMsg = lastMsg.text;
        }
      }

      Object.assign(ticket, req.body);
      ticket.updatedAt = new Date().toISOString().replace('T', ' ').substring(0, 16);
      await ticket.save();

      if (lastAdminMsg) {
        sendEmail('admin_reply', ticket.userEmail || ticket.email, {
          name: ticket.userName || 'Customer',
          ticket_id: ticket.id,
          subject: ticket.subject,
          reply_message: lastAdminMsg
        });
        addSystemLog('INFO', `Admin reply email sent for Ticket ${ticket.id}`);
      }

      res.json(ticket);
    } else {
      res.status(404).json({ error: 'Ticket not found' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
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

    const meRes = await fetch('https://oauth.reddit.com/api/v1/me', {
      headers: {
        'Authorization': `Bearer ${data.access_token}`,
        'User-Agent': redditSettings.userAgent
      }
    });

    const meData = await meRes.json();
    const redditUsername = meData.name;
    const redditIcon = meData.icon_img;

    const user = await User.findOne({ id: userId.toString() });
    if (user) {
      let limit = 1;
      if (user.plan) {
        const userPlan = await Plan.findOne({ name: { $regex: new RegExp('^' + user.plan + '$', 'i') } });
        if (userPlan) limit = userPlan.maxAccounts || 1;
      }

      const currentAccounts = user.connectedAccounts || [];
      const alreadyConnected = currentAccounts.find(a => a.username === redditUsername);

      if (!alreadyConnected && currentAccounts.length >= limit) {
        return res.status(403).json({ error: `Account limit reached for ${user.plan} plan (${limit} accounts max).` });
      }

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
      await user.save();
    }

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
  let targetAccount = null;
  const user = await User.findOne({ id: userId.toString() });

  if (user && user.connectedAccounts && user.connectedAccounts.length > 0) {
    targetAccount = username
      ? user.connectedAccounts.find(a => a.username === username)
      : user.connectedAccounts[0];
  }

  // Fallback to memory if not found in DB or DB missing tokens
  if (!targetAccount || !targetAccount.accessToken) {
    if (userRedditTokens[userId]) {
      const uName = username || Object.keys(userRedditTokens[userId])[0];
      if (userRedditTokens[userId][uName]) {
        targetAccount = { ...userRedditTokens[userId][uName], username: uName };
      }
    }
  }

  if (!targetAccount || !targetAccount.accessToken) return null;

  if (Date.now() < targetAccount.expiresAt - 60000) {
    return targetAccount.accessToken;
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
        refresh_token: targetAccount.refreshToken
      })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error);

    const newTokens = {
      accessToken: data.access_token,
      refreshToken: targetAccount.refreshToken,
      expiresAt: Date.now() + (data.expires_in * 1000)
    };

    await saveTokens(userId, targetAccount.username || username, newTokens);
    return data.access_token;
  } catch (err) {
    console.error('[Reddit Token Refresh Error]', err);
    return null;
  }
};

app.get('/api/user/reddit/status', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'User ID required' });

    const user = await User.findOne({ id: userId.toString() });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const accounts = user.connectedAccounts || [];

    res.json({
      connected: accounts.length > 0,
      accounts: accounts
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/user/reddit/disconnect', async (req, res) => {
  try {
    const { userId, username } = req.body;
    if (!userId || !username) return res.status(400).json({ error: 'Missing userId or username' });

    const user = await User.findOne({ id: userId.toString() });
    if (user && user.connectedAccounts) {
      user.connectedAccounts = user.connectedAccounts.filter(a => a.username !== username);
      await user.save();
    }

    if (userRedditTokens[userId]) {
      delete userRedditTokens[userId][username];
      saveSettings({ userRedditTokens });
    }

    addSystemLog('INFO', `User disconnected Reddit account: ${username}`, { userId });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper to get credits for a plan
const getPlanCredits = async (planName) => {
  if (!planName) return 0;
  const p = await Plan.findOne({
    $or: [
      { id: { $regex: new RegExp('^' + planName + '$', 'i') } },
      { name: { $regex: new RegExp('^' + planName + '$', 'i') } }
    ]
  });
  return p ? p.credits : 0;
};


app.post('/api/generate', async (req, res) => {
  try {
    const { prompt, context, userId, type } = req.body; // type can be 'comment' or 'post'
    const keyToUse = aiSettings.apiKey || process.env.GEMINI_API_KEY;

    if (!keyToUse) {
      return res.status(500).json({ error: 'AI provider is not configured. Please contact the administrator.' });
    }

    const user = await User.findOne({ id: userId.toString() });
    if (!user) return res.status(404).json({ error: 'User not found' });

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
      const plan = await Plan.findOne({ $or: [{ id: user.plan }, { name: user.plan }] });
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
    user.markModified('usageStats');

    await user.save();
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

app.post('/api/generate-image', async (req, res) => {
  try {
    const { prompt, userId } = req.body;
    const keyToUse = aiSettings.apiKey || process.env.GEMINI_API_KEY;

    if (!keyToUse || !keyToUse.startsWith('sk-')) {
      return res.status(400).json({ error: 'OpenAI API Key required for image generation.' });
    }

    // CHECK CREDITS
    const user = await User.findOne({ id: userId.toString() });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const plan = await Plan.findOne({ $or: [{ id: user.plan }, { name: user.plan }] });

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
    user.markModified('usageStats');

    // SAVE LATEST IMAGE FOR RECOVERY
    user.latestImage = {
      url: data.data[0].url,
      prompt: prompt,
      date: new Date().toISOString()
    };

    await user.save();
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

app.get('/api/user/latest-image', async (req, res) => {
  try {
    const { userId } = req.query;
    const user = await User.findOne({ id: userId.toString() });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user.latestImage || null);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
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
    let redditCommentId = null;

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

      const redditResponse = await response.json();
      try {
        const commentData = redditResponse.json?.data?.things?.[0]?.data;
        if (commentData && commentData.id) {
          redditCommentId = `t1_${commentData.id}`;
        }
      } catch (e) {
        console.error('Error parsing Reddit comment ID:', e);
      }
    }

    // Save to history
    const entry = new RedditReply({
      id: Math.random().toString(36).substr(2, 9),
      userId: userId.toString(),
      postId,
      redditCommentId,
      postTitle: postTitle || 'Reddit Post',
      postUrl: req.body.postUrl || '#',
      postContent: req.body.postContent || '',
      subreddit: subreddit || 'unknown',
      comment,
      productMention,
      redditUsername: redditUsername || 'unknown',
      deployedAt: new Date().toISOString(),
      status: 'Sent',
      ups: 0,
      replies: 0,
      sentiment: 'Neutral'
    });

    await entry.save();
    addSystemLog('SUCCESS', `Reddit Reply sent by User ${userId}`, { subreddit, postTitle });

    res.json({ success: true, entry });
  } catch (error) {
    addSystemLog('ERROR', `Reddit Reply Failed: ${error.message}`);
    console.error('Reddit Reply Posting Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Fetch User Reply History
app.get('/api/user/replies', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'User ID required' });

    const history = await RedditReply.find({ userId: userId.toString() }).sort({ deployedAt: -1 });
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create New Reddit Post
app.post('/api/reddit/post', async (req, res) => {
  try {
    const { userId, subreddit, title, text, kind, redditUsername } = req.body;
    if (!userId || !subreddit || !title) return res.status(400).json({ error: 'Missing required fields' });

    const token = await getValidToken(userId, redditUsername);
    if (!token) return res.status(401).json({ error: 'Reddit account not linked' });

    const bodyParams = new URLSearchParams({
      api_type: 'json',
      sr: subreddit,
      title: title,
      kind: kind || 'self',
    });

    if (kind === 'link') bodyParams.append('url', text);
    else bodyParams.append('text', text);

    const response = await fetch('https://oauth.reddit.com/api/submit', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': redditSettings.userAgent
      },
      body: bodyParams
    });

    const redditResponse = await response.json();
    if (!response.ok) throw new Error(redditResponse.json?.errors?.[0]?.[1] || 'Failed to submit to Reddit API');

    const entry = new RedditPost({
      id: Math.random().toString(36).substring(2, 11),
      userId: userId.toString(),
      subreddit,
      postTitle: title,
      postContent: text,
      postUrl: `https://reddit.com${redditResponse.json.data.url || ''}`,
      redditUsername: redditUsername || 'unknown',
      redditCommentId: redditResponse.json.data.id || redditResponse.json.data.name || null,
      deployedAt: new Date().toISOString(),
      status: 'Sent',
      ups: 0,
      replies: 0,
      sentiment: 'Neutral'
    });

    await entry.save();
    addSystemLog('SUCCESS', `Reddit Post submitted: ${title}`, { subreddit });

    res.json({ success: true, redditResponse });
  } catch (error) {
    addSystemLog('ERROR', `Reddit Post Failed: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// Fetch User Posts History
app.get('/api/user/posts', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'User ID required' });

    const history = await RedditPost.find({ userId: userId.toString() }).sort({ deployedAt: -1 });
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Sync History for Posts with Real Reddit Data
app.get('/api/user/posts/sync', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'User ID required' });

    const userPosts = await RedditPost.find({ userId: userId.toString(), redditCommentId: { $ne: null } });

    if (userPosts.length > 0) {
      const token = await getValidToken(userId);
      if (token) {
        const ids = userPosts.map(r => r.redditCommentId.startsWith('t3_') ? r.redditCommentId : `t3_${r.redditCommentId}`).join(',');
        const response = await fetch(`https://oauth.reddit.com/api/info?id=${ids}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'User-Agent': redditSettings.userAgent
          }
        });

        if (response.ok) {
          const data = await response.json();
          const liveItems = data.data.children;

          for (const child of liveItems) {
            const liveData = child.data;
            const entryIdMatch = liveData.name || `t3_${liveData.id}`;
            await RedditPost.updateOne(
              { $or: [{ redditCommentId: entryIdMatch }, { redditCommentId: entryIdMatch.replace('t3_', '') }] },
              { $set: { ups: liveData.ups, replies: liveData.num_comments || 0 } }
            );
          }
        }
      }
    }

    const updatedHistory = await RedditPost.find({ userId: userId.toString() }).sort({ deployedAt: -1 });
    res.json(updatedHistory);
  } catch (error) {
    console.error('[Reddit Post Sync Error]', error);
    res.status(500).json({ error: 'Sync failed' });
  }
});

// Sync History with Real Reddit Data
app.get('/api/user/replies/sync', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'User ID required' });

    const userReplies = await RedditReply.find({ userId: userId.toString(), redditCommentId: { $ne: null } });

    if (userReplies.length > 0) {
      const token = await getValidToken(userId);
      if (token) {
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

          for (const child of liveItems) {
            const liveData = child.data;
            await RedditReply.updateOne(
              { redditCommentId: liveData.name },
              { $set: { ups: liveData.ups, replies: liveData.num_comments || 0 } }
            );
          }
        }
      }
    }

    const updatedHistory = await RedditReply.find({ userId: userId.toString() }).sort({ deployedAt: -1 });
    res.json(updatedHistory);
  } catch (error) {
    console.error('[Reddit Sync Error] Non-critical sync failure:', error);
    res.status(500).json({ error: 'Sync failed' });
  }
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
    // Prevent unhandled API routes from returning HTML, avoiding SyntaxError JSON parse crashes
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'Endpoint not found' });
    }
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('❌ SERVER ERROR:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
    path: req.path
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
