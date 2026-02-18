
import express from 'express';
import cors from 'cors';
import Stripe from 'stripe';
// import { GoogleGenerativeAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Mock Database
let users = [
  { id: 1, name: 'Jane Doe', email: 'jane@example.com', password: 'password123', role: 'admin', plan: 'Pro', status: 'Active' },
  { id: 2, name: 'John Smith', email: 'john@example.com', password: 'password123', role: 'user', plan: 'Free', status: 'Inactive' },
  { id: 3, name: 'Alice Johnson', email: 'alice@example.com', password: 'password123', role: 'user', plan: 'Business', status: 'Active' },
];

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
    status: 'Active'
  };

  users.push(newUser);
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

let aiSettings = {
  model: 'gemini-1.5-flash',
  temperature: 0.7,
  maxOutputTokens: 1024,
  systemPrompt: 'You are a helpful Reddit assistant. Generate engaging and valuable replies.',
  apiKey: process.env.GEMINI_API_KEY || ''
};

// Stripe Settings (In-memory storage for demo)
let stripeSettings = {
  publishableKey: '',
  secretKey: '',
  webhookSecret: '',
  isSandbox: true
};

// Initialize Stripe Client dynamically
const getStripe = () => {
  if (!stripeSettings.secretKey) return null;
  return new Stripe(stripeSettings.secretKey);
};

// Routes

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// Admin Stats
app.get('/api/admin/stats', (req, res) => {
  res.json({
    totalUsers: users.length,
    activeSubscriptions: users.filter(u => u.status === 'Active').length,
    apiUsage: Math.floor(Math.random() * 100), // Mock percentage
    systemHealth: '98%'
  });
});

// User Management
app.get('/api/admin/users', (req, res) => {
  res.json(users);
});

app.post('/api/admin/users', (req, res) => {
  const newUser = { id: users.length + 1, ...req.body };
  users.push(newUser);
  res.status(201).json(newUser);
});

app.put('/api/admin/users/:id', (req, res) => {
  const { id } = req.params;
  const index = users.findIndex(u => u.id == id);
  if (index !== -1) {
    users[index] = { ...users[index], ...req.body };
    res.json(users[index]);
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});

app.delete('/api/admin/users/:id', (req, res) => {
  users = users.filter(u => u.id != req.params.id);
  res.status(204).send();
});

// AI Settings
app.get('/api/admin/ai-settings', (req, res) => {
  const safeSettings = { ...aiSettings };
  // safeSettings.apiKey = '********'; // Hide key in response
  res.json(safeSettings);
});

app.post('/api/admin/ai-settings', (req, res) => {
  aiSettings = { ...aiSettings, ...req.body };
  res.json({ message: 'Settings updated', settings: aiSettings });
});

// Stripe Settings Management
app.get('/api/admin/stripe-settings', (req, res) => {
  // SECURITY NOTE: Never send secret keys to the client in a real app unless absolutely necessary for admin verification (and obfuscate them).
  // For this demo admin panel, we send them so you can edit them.
  res.json(stripeSettings);
});

app.post('/api/admin/stripe-settings', (req, res) => {
  stripeSettings = { ...stripeSettings, ...req.body };
  console.log('[Stripe] Configuration updated');
  res.json({ message: 'Stripe settings updated', settings: stripeSettings });
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
      return res.status(500).json({ error: 'API Key not configured' });
    }

    // const genAI = new GoogleGenerativeAI(keyToUse);
    // const model = genAI.getGenerativeModel({ model: aiSettings.model });

    // const result = await model.generateContent([
    //   aiSettings.systemPrompt,
    //   `Context: ${JSON.stringify(context)}`,
    //   `User Prompt: ${prompt}`
    // ]);
    // const response = await result.response;
    // const text = response.text();
    const text = "AI generation temporarily disabled.";

    res.json({ text });
  } catch (error) {
    console.error('AI Generation Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
