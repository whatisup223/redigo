/**
 * ONE-TIME MIGRATION SCRIPT
 * Removes the deprecated `lastKnownRedditAccounts` field from all user documents.
 * Self-deletes after successful execution.
 *
 * Usage: node server/migrate-cleanup.mjs
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error('❌ MONGO_URI not found in .env — aborting.');
    process.exit(1);
}

console.log('🔌 Connecting to MongoDB...');
await mongoose.connect(MONGO_URI);
console.log('✅ Connected.');

// Run the migration
console.log('🧹 Removing lastKnownRedditAccounts from all user documents...');
const result = await mongoose.connection.db.collection('users').updateMany(
    { lastKnownRedditAccounts: { $exists: true } },
    { $unset: { lastKnownRedditAccounts: '' } }
);

console.log(`✅ Migration complete. Modified ${result.modifiedCount} user document(s).`);

// Verify no documents with the field remain
const remaining = await mongoose.connection.db.collection('users').countDocuments({
    lastKnownRedditAccounts: { $exists: true }
});

if (remaining === 0) {
    console.log('✅ Verification passed — no remaining documents with lastKnownRedditAccounts.');
} else {
    console.warn(`⚠️  ${remaining} document(s) still have the field. Check and re-run if needed.`);
}

await mongoose.disconnect();
console.log('🔌 Disconnected from MongoDB.');

// Self-delete this script
fs.unlinkSync(__filename);
console.log('🗑️  Script self-deleted successfully. All clean!');
