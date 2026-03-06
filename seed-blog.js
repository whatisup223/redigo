import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import crypto from 'crypto';
import { BlogPost } from './server/models.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const p1 = {
            id: crypto.randomUUID(),
            title: 'How to Get Your First 100 SaaS Customers from Reddit',
            slug: 'how-to-get-first-100-saas-customers-reddit',
            excerpt: 'Reddit is an absolute goldmine for early-stage SaaS founders. In this guide, we break down exactly how to find and pitch your ideal customers natively without getting banned or looking like a spammer.',
            content: '<h2>The Reddit Advantage</h2><p>Getting your first 100 customers is the hardest part of building a SaaS. But what if there was a place where people actively complained about the exact problem your tool solves? That place is Reddit.</p><h3>1. Find the Right Subreddits</h3><p>Start by identifying niche communities. Do not just go to r/SaaS or r/Entrepreneur. If you built a tool for copywriters, go to r/copywriting. Use the search bar to find posts with keywords like <strong>"how do you guys manage"</strong> or <strong>"what is the best tool for"</strong>.</p><h3>2. The Bridge Approach</h3><p>Never just drop a link. Answer their question genuinely, provide massive value, and then casually mention your tool as a logical next step (the bridge).</p><h3>3. Automate the Hunt</h3><p>Instead of manual searching, use a tool like Redigo to automatically find high-intent leads using AI. This saves hours of scrolling and gets you straight to the people who are ready to buy.</p>',
            coverImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=1200&h=600',
            author: 'Redigo Growth Team',
            status: 'published',
            tags: ['SaaS', 'Marketing', 'Growth'],
            publishedAt: new Date()
        };

        const p2 = {
            id: crypto.randomUUID(),
            title: 'Reddit Marketing Strategies in 2026: The Anti-Spam Playbook',
            slug: 'reddit-marketing-strategies-anti-spam',
            excerpt: 'The days of automated spamming on Reddit are over. To win on Reddit right now, you need authenticity, value-first mentalities, and precise AI targeting. Here is the modern playbook.',
            content: '<h2>Stop Acting Like a Marketer</h2><p>Redditors hate marketers. If you sound like an ad, you will be downvoted and banned in minutes. The key is to act like a helpful power-user.</p><h3>Rule 1: No Corporate Speak</h3><p>Avoid words like "synergy", "leverage", or "game-changer". Speak like a normal human being. Use contractions and formatting to make your post readable.</p><h3>Rule 2: The 90/10 Rule</h3><p>90% of your activity should be answering questions, sharing free resources, and participating in discussions. Only 10% should be mentioning your own product.</p><h3>Rule 3: Deep Search Intent</h3><p>Look for posts that show high purchase intent. Instead of "how to do X", look for "I am tired of doing X manually" or "Is there a tool that does X automatically?".</p>',
            coverImage: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1200&h=600',
            author: 'Redigo Growth Team',
            status: 'published',
            tags: ['Reddit Marketing', 'B2B', 'Lead Gen'],
            publishedAt: new Date()
        };

        const p3 = {
            id: crypto.randomUUID(),
            title: 'Why Finding "Thirsty Leads" is Better Than Praying for Viral Growth',
            slug: 'finding-thirsty-leads-better-than-viral-growth',
            excerpt: 'Viral marketing is great for ego, but terrible for predictable MRR. Instead of hoping for a post to blow up, you should be finding users who are already looking to buy your solution right now.',
            content: '<h2>The Problem with Virality</h2><p>Everyone wants their product hunt launch or viral tweet to bring in thousands of users. But what happens on day 3? The traffic dies. The signups stop. You are back to square one.</p><h3>Enter: The Thirsty Lead</h3><p>A thirsty lead is someone who is actively experiencing the pain point your product solves, right now. They are asking questions on Reddit, complaining on Twitter, or looking for recommendations.</p><h3>How to Find Them</h3><p>Instead of broadcasting to everyone, use semantic search AI to filter out noise and find these high-intent conversations. Reach out directly. Be a savior, not a salesperson. That is how predictable growth works.</p>',
            coverImage: 'https://images.unsplash.com/photo-1533750516457-a7f992034fec?auto=format&fit=crop&q=80&w=1200&h=600',
            author: 'Redigo Editorial',
            status: 'published',
            tags: ['Startup', 'Sales', 'Lead Gen'],
            publishedAt: new Date()
        };

        await BlogPost.create(p1);
        await BlogPost.create(p2);
        await BlogPost.create(p3);
        console.log('Successfully seeded blog posts!');
        mongoose.disconnect();
    } catch (e) {
        console.error(e);
        mongoose.disconnect();
    }
};

seed();
