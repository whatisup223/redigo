/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║         ONE-TIME DATABASE CLEANUP + SELF-DESTRUCT SCRIPT        ║
 * ║  Removes all Intelligence Engine artifacts from MongoDB          ║
 * ║  ⚠️  After running, this file DELETES ITSELF automatically      ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 * HOW TO RUN:
 *   node server/cleanup-once.js
 *
 * WHAT IT CLEANS:
 *   ✦ users.brandProfile.vector
 *   ✦ users.lastSearchLeads
 *   ✦ redditposts: vector, opportunityScore, intent, analysisReason,
 *                  topics, clusterId, isHot, competitors, isDiscovery
 *   ✦ Drops: redditsearchcaches collection
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: new URL('../.env', import.meta.url).pathname });

const __filename = fileURLToPath(import.meta.url);

async function cleanup() {
    const results = {};

    try {
        console.log('\n🧹 Redigo — One-Time Database Cleanup');
        console.log('═══════════════════════════════════════');

        if (!process.env.MONGO_URI) {
            throw new Error('MONGO_URI not found in .env file');
        }

        console.log('📡 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected!\n');

        const db = mongoose.connection.db;

        // ── 1. CLEAN USERS ──────────────────────────────────────────────
        console.log('👤 Cleaning User documents...');
        const userResult = await db.collection('users').updateMany({}, {
            $unset: {
                'brandProfile.vector': '',
                'lastSearchLeads': ''
            }
        });
        results.usersUpdated = userResult.modifiedCount;
        console.log(`   ✓ Updated ${userResult.modifiedCount} user(s)`);

        // ── 2. CLEAN REDDIT POSTS ───────────────────────────────────────
        console.log('📝 Cleaning RedditPost documents...');
        const postResult = await db.collection('redditposts').updateMany({}, {
            $unset: {
                vector: '',
                opportunityScore: '',
                intent: '',
                analysisReason: '',
                topics: '',
                clusterId: '',
                isHot: '',
                competitors: '',
                isDiscovery: ''
            }
        });
        results.postsUpdated = postResult.modifiedCount;
        console.log(`   ✓ Cleaned ${postResult.modifiedCount} post(s)`);

        // ── 3. DROP NEW COLLECTIONS ─────────────────────────────────────
        console.log('🗑️  Checking for new collections to drop...');
        const collections = await db.listCollections().toArray();
        const names = collections.map(c => c.name);
        const toDrop = ['redditsearchcaches'];
        const dropped = [];

        for (const col of toDrop) {
            if (names.includes(col)) {
                await db.collection(col).drop();
                dropped.push(col);
                console.log(`   ✓ Dropped collection: ${col}`);
            } else {
                console.log(`   - Collection not found (skipped): ${col}`);
            }
        }
        results.droppedCollections = dropped;

        await mongoose.disconnect();
        console.log('\n🎉 DATABASE CLEANUP COMPLETE!');
        console.log('   Results:', results);
        console.log('═══════════════════════════════════════\n');

    } catch (err) {
        console.error('\n❌ CLEANUP FAILED:', err.message);
        console.error('   Make sure your MONGO_URI in .env is correct');
        console.error('   and MongoDB is reachable.\n');
        try { await mongoose.disconnect(); } catch (_) { }
        selfDestruct();
        process.exit(1);
    }

    // ── SELF-DESTRUCT ───────────────────────────────────────────────
    selfDestruct();
}

function selfDestruct() {
    try {
        fs.unlinkSync(__filename);
        console.log('💥 Self-destruct complete: cleanup-once.js has been deleted.\n');
    } catch (e) {
        console.warn('⚠️  Could not self-delete (maybe already removed):', e.message);
    }
}

cleanup();
