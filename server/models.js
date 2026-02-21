import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    id: String,
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: 'user' },
    name: String,
    company: String,
    plan: { type: String, default: 'Starter' },
    billingCycle: { type: String, default: 'monthly' },
    credits: { type: Number, default: 0 },
    customDailyLimit: Number,
    subscriptionEnd: Date,
    createdAt: { type: Date, default: () => new Date() },
    allowImages: Boolean,
    allowTracking: Boolean,
    dailyUsagePoints: { type: Number, default: 0 },
    dailyUsage: String,
    accounts: [{
        username: String,
        accessToken: String,
        refreshToken: String,
        tokenExpiry: Number
    }],
    history: [mongoose.Schema.Types.Mixed],
    postsHistory: [mongoose.Schema.Types.Mixed],
    transactions: [mongoose.Schema.Types.Mixed],
    prompts: [mongoose.Schema.Types.Mixed]
}, { strict: false }); // strict: false allows dynamic data from the old version safely

const TrackingLinkSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    userId: String,
    originalUrl: String,
    trackingUrl: String,
    postId: String,
    commentId: String,
    subreddit: String,
    redditUsername: String,
    clicks: { type: Number, default: 0 },
    createdAt: Date,
    clickDetails: [mongoose.Schema.Types.Mixed]
}, { strict: false });

const BrandProfileSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    brandName: String,
    website: String,
    description: String,
    targetAudience: String,
    problem: String,
    primaryColor: String,
    secondaryColor: String
});

const PlanSchema = new mongoose.Schema({
    id: String,
    name: String,
    description: String,
    monthlyPrice: Number,
    yearlyPrice: Number,
    credits: Number,
    dailyLimitMonthly: Number,
    dailyLimitYearly: Number,
    features: [String],
    isPopular: Boolean,
    highlightText: String,
    isCustom: Boolean,
    allowImages: Boolean,
    allowTracking: Boolean
});

const TicketSchema = new mongoose.Schema({
    id: String,
    subject: String,
    message: String,
    email: String,
    userId: String,
    status: { type: String, default: 'Open' },
    createdAt: Date,
    replies: [mongoose.Schema.Types.Mixed]
});

const SettingsSchema = new mongoose.Schema({
    key: { type: String, unique: true },
    value: mongoose.Schema.Types.Mixed
}, { strict: false });

export const User = mongoose.model('User', UserSchema);
export const TrackingLink = mongoose.model('TrackingLink', TrackingLinkSchema);
export const BrandProfile = mongoose.model('BrandProfile', BrandProfileSchema);
export const Plan = mongoose.model('Plan', PlanSchema);
export const Ticket = mongoose.model('Ticket', TicketSchema);
export const Setting = mongoose.model('Setting', SettingsSchema);
