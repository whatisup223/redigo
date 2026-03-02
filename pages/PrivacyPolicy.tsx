import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ArrowLeft } from 'lucide-react';

export const PrivacyPolicy: React.FC = () => {
    return (
        <div className="min-h-screen font-['Outfit'] bg-white">
            <div className="max-w-4xl mx-auto px-6 py-24">
                <Link to="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-orange-600 mb-8 transition-colors">
                    <ArrowLeft size={16} /> Back to Home
                </Link>

                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600">
                        <ShieldCheck size={20} />
                    </div>
                    <span className="text-sm font-bold text-orange-600 tracking-wider uppercase">Privacy &amp; Safety</span>
                </div>

                <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">Privacy Policy</h1>
                <p className="text-lg text-slate-500 mb-12">Last updated: February 25, 2026</p>

                <div className="prose prose-lg prose-slate max-w-none space-y-2">
                    <p>
                        At RedditGo, we prioritize your privacy and account security through our unique <strong>"Local Bridge"</strong> architecture. This Privacy Policy explains how we collect, use, and safeguard your information when you use our platform and browser extension. Unlike traditional automation tools, RedditGo operates as a <strong>human-first assistant</strong> that executes authorized actions through your local browser environment.
                    </p>

                    <h3 className="text-2xl font-bold text-slate-900 mt-12 mb-4">1. Information We Collect</h3>
                    <p>We collect minimal data required to provide our AI-assisted features:</p>
                    <ul className="list-disc pl-6 space-y-2 mb-6 text-slate-600">
                        <li><strong>Account Information:</strong> Name, email address, and billing details provided during registration.</li>
                        <li><strong>Brand Profiles:</strong> Contextual data you provide (product descriptions, target audience) used solely by our AI to generate relevant suggestions.</li>
                        <li><strong>Extension Metadata:</strong> To ensure secure communication between the dashboard and your browser, we process temporary session handshakes. We <strong>never</strong> access your Reddit password or sensitive browser data.</li>
                        <li><strong>Usage Analytics:</strong> Anonymous data on feature usage (e.g., number of leads extracted) to optimize our AI models and service performance.</li>
                    </ul>

                    <h3 className="text-2xl font-bold text-slate-900 mt-12 mb-4">2. The "Extension Bridge" &amp; Your Data</h3>
                    <div className="bg-orange-50 border border-orange-100 rounded-2xl p-6 mb-6">
                        <p className="font-bold text-slate-900 mb-3">Our Secure Architecture Commitment:</p>
                        <ul className="list-disc pl-6 space-y-2 text-slate-600">
                            <li><strong>Local IP Processing:</strong> All Reddit interactions (posting, replying) are executed via our browser extension using your <strong>Local IP address</strong>. RedditGo servers never "act" as you on Reddit's platform.</li>
                            <li><strong>No Server-Side Posting:</strong> We do not store Reddit account credentials or persistent OAuth "submit" tokens on our central servers. All automation triggers require an active browser session controlled by you.</li>
                            <li><strong>Zero Tracking:</strong> Our extension only interacts with Reddit tabs specifically targeted for authorized actions. We do not track your general browsing history or personal data outside of the RedditGo/Reddit workflow.</li>
                        </ul>
                    </div>

                    <h3 className="text-2xl font-bold text-slate-900 mt-12 mb-4">3. Data Retention &amp; Security</h3>
                    <p>We use industry-standard encryption to protect your account data. For Reddit-sourced content:</p>
                    <ul className="list-disc pl-6 space-y-2 mb-6 text-slate-600">
                        <li><strong>Ephemeral Indexing:</strong> Reddit leads and thread data are indexed temporarily to provide you with insights. We comply with Reddit's 48-hour deletion rule for content removed from their platform.</li>
                        <li><strong>Model Privacy:</strong> Your brand data is private and is <strong>never</strong> used to train public AI models or shared with third parties for commercial use.</li>
                        <li><strong>Instant Revocation:</strong> You can disconnect the extension or delete your RedditGo account at any time, which immediately severs all communication bridges.</li>
                    </ul>

                    <h3 className="text-2xl font-bold text-slate-900 mt-12 mb-4">4. Compliance &amp; Legal Disclosures</h3>
                    <p>
                        RedditGo operates in alignment with Reddit's <a href="https://support.reddithelp.com/hc/en-us/articles/42728983564564" target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:underline">Responsible Builder Policy</a>. We do not sell user data. Information is only disclosed if required by law or to protect our legal rights, particularly in cases of system abuse or fraudulent payment activity.
                    </p>

                    <h3 className="text-2xl font-bold text-slate-900 mt-12 mb-4">5. Contact &amp; Updates</h3>
                    <p>We may update this policy to reflect new security features. For privacy inquiries, contact us at <a href="mailto:privacy@redditgo.online" className="text-orange-600 hover:underline">privacy@redditgo.online</a>.</p>
                </div>
            </div>
        </div>
    );
};
