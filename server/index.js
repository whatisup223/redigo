
import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Mock Database
let users = [
  { id: 1, name: 'Jane Doe', email: 'jane@example.com', role: 'admin', plan: 'Pro', status: 'Active' },
  { id: 2, name: 'John Smith', email: 'john@example.com', role: 'user', plan: 'Free', status: 'Inactive' },
  { id: 3, name: 'Alice Johnson', email: 'alice@example.com', role: 'user', plan: 'Business', status: 'Active' },
];

let aiSettings = {
  model: 'gemini-1.5-flash',
  temperature: 0.7,
  maxOutputTokens: 1024,
  systemPrompt: 'You are a helpful Reddit assistant. Generate engaging and valuable replies.',
  apiKey: process.env.GEMINI_API_KEY || ''
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

// AI Generation Proxy (Backend)
app.post('/api/generate', async (req, res) => {
  try {
    const { prompt, context } = req.body;

    const keyToUse = aiSettings.apiKey || process.env.GEMINI_API_KEY;

    if (!keyToUse) {
      return res.status(500).json({ error: 'API Key not configured' });
    }

    const genAI = new GoogleGenerativeAI(keyToUse);
    const model = genAI.getGenerativeModel({ model: aiSettings.model });

    const result = await model.generateContent([
      aiSettings.systemPrompt,
      `Context: ${JSON.stringify(context)}`,
      `User Prompt: ${prompt}`
    ]);
    const response = await result.response;
    const text = response.text();

    res.json({ text });
  } catch (error) {
    console.error('AI Generation Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
