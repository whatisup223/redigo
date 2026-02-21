import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { User, TrackingLink, BrandProfile, Plan, Ticket, Setting } from './models.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const SETTINGS_FILE = path.join(__dirname, '../settings.storage.json');

async function migrateData() {
    if (!process.env.MONGO_URI) {
        console.error('❌ MONGO_URI is missing in your .env file!');
        process.exit(1);
    }

    try {
        console.log('🔄 Connecting to MongoDB on Easypanel...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected successfully!');

        console.log('📖 Reading old JSON database...');
        if (!fs.existsSync(SETTINGS_FILE)) {
            console.log('❌ settings.storage.json not found! Nothing to migrate.');
            process.exit(0);
        }
        const data = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));

        // 1. Migrate Users
        if (data.users && data.users.length > 0) {
            console.log(`📦 Found ${data.users.length} users. Migrating...`);
            await User.deleteMany({}); // Optional: clear collection before migration if starting fresh
            await User.insertMany(data.users.map(u => ({ ...u, _id: undefined })));
            console.log(`✅ Successfully migrated ${data.users.length} users!`);
        }

        // 2. Migrate Tracking Links
        if (data.trackingLinks && data.trackingLinks.length > 0) {
            console.log(`🔗 Found ${data.trackingLinks.length} tracking links. Migrating...`);
            await TrackingLink.deleteMany({});
            await TrackingLink.insertMany(data.trackingLinks.map(t => ({ ...t, _id: undefined })));
            console.log(`✅ Successfully migrated ${data.trackingLinks.length} tracking links!`);
        }

        // 3. Migrate Plans
        if (data.plans && data.plans.length > 0) {
            console.log(`💳 Found ${data.plans.length} plans. Migrating...`);
            await Plan.deleteMany({});
            await Plan.insertMany(data.plans.map(p => ({ ...p, _id: undefined })));
            console.log('✅ Plans migrated.');
        }

        // 4. Migrate Tickets
        if (data.tickets && data.tickets.length > 0) {
            console.log(`🎫 Found ${data.tickets.length} support tickets. Migrating...`);
            await Ticket.deleteMany({});
            await Ticket.insertMany(data.tickets.map(t => ({ ...t, _id: undefined })));
            console.log('✅ Tickets migrated.');
        }

        // 5. Migrate other top-level keys into a "Settings" collection (stripe, ai, reddit env vars etc)
        const settingsObj = {};
        for (const key of Object.keys(data)) {
            if (!['users', 'trackingLinks', 'plans', 'tickets'].includes(key)) {
                settingsObj[key] = data[key];
            }
        }

        await Setting.deleteMany({});
        const settingsArr = Object.entries(settingsObj).map(([k, v]) => ({ key: k, value: v }));
        await Setting.insertMany(settingsArr);
        console.log('⚙️ System settings safely stored in DB.');

        console.log('🎉 MIGRATION COMPLETED SUCCESSFULLY!');
        console.log('⚠️ Important: Your data is now perfectly mirrored in MongoDB on Easypanel.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

migrateData();
