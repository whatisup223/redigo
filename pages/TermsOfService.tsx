import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, ArrowLeft } from 'lucide-react';

export const TermsOfService: React.FC = () => {
    return (
        <div className="min-h-screen font-['Outfit'] bg-white">
            <div className="max-w-4xl mx-auto px-6 py-24">
                <Link to="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-orange-600 mb-8 transition-colors">
                    <ArrowLeft size={16} /> Back to Home
                </Link>

                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600">
                        <FileText size={20} />
                    </div>
                    <span className="text-sm font-bold text-orange-600 tracking-wider uppercase">Use Guidelines</span>
                </div>

                <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">Terms of Service</h1>
                <p className="text-lg text-slate-500 mb-12">Last updated: February 25, 2026</p>

                <div className="prose prose-lg prose-slate max-w-none space-y-2">
                    <p>
                        Welcome to RedditGo ("we," "us," or "our"). By accessing or using our service at <strong>redditgo.online</strong>, you agree to be bound by these Terms of Service. Please read them carefully. These terms incorporate and require compliance with Reddit's <a href="https://www.redditinc.com/policies/user-agreement" target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:underline">User Agreement</a>, Reddit's <a href="https://support.reddithelp.com/hc/en-us/articles/42728983564564" target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:underline">Responsible Builder Policy</a>, and Reddit's Data API Terms.
                    </p>

                    <h3 className="text-2xl font-bold text-slate-900 mt-12 mb-4">1. Human Oversight &amp; User Responsibility</h3>
                    <div className="bg-orange-50 border border-orange-100 rounded-2xl p-6 mb-6">
                        <p className="font-bold text-slate-900 mb-2">RedditGo is an AI-powered <em>assistant</em>, not an autonomous bot.</p>
                        <p className="text-slate-600">All AI-generated content (replies, posts, suggestions) requires your explicit review and manual approval before being submitted to Reddit. You are solely responsible for every piece of content posted to Reddit through your account. RedditGo provides suggestions — you make the final decision.</p>
                    </div>

                    <h3 className="text-2xl font-bold text-slate-900 mt-12 mb-4">2. Reddit API Compliance &amp; User Obligations</h3>
                    <p>By using RedditGo, you agree to:</p>
                    <ul className="list-disc pl-6 space-y-2 mb-6 text-slate-600">
                        <li>Comply fully with Reddit's <a href="https://www.redditinc.com/policies/user-agreement" target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:underline">User Agreement</a>, <a href="https://www.reddit.com/rules/" target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:underline">Content Policy</a>, and the rules of each individual subreddit you participate in.</li>
                        <li>Comply with Reddit's <a href="https://support.reddithelp.com/hc/en-us/articles/42728983564564" target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:underline">Responsible Builder Policy</a> and Data API Terms.</li>
                        <li>Not use RedditGo in a way that exceeds Reddit's API rate limits or circumvents Reddit's access controls or safety mechanisms.</li>
                        <li>Ensure that any content you post via RedditGo is reviewed and approved by you before submission.</li>
                        <li>Not register multiple Reddit or RedditGo accounts to circumvent usage limits.</li>
                    </ul>

                    <h3 className="text-2xl font-bold text-slate-900 mt-12 mb-4">3. Prohibited Uses</h3>
                    <p>You agree <strong>NOT</strong> to use RedditGo for any of the following purposes:</p>
                    <ul className="list-disc pl-6 space-y-2 mb-6 text-slate-600">
                        <li><strong>Spam:</strong> Posting identical or substantially similar content across multiple subreddits, or engaging in any form of automated, repetitive, or unsolicited posting.</li>
                        <li><strong>Vote Manipulation:</strong> Using our service to artificially inflate or deflate votes (upvotes/downvotes) on Reddit content, or to game Reddit's karma system.</li>
                        <li><strong>Circumventing Safety Mechanisms:</strong> Bypassing Reddit's user blocking, account bans, shadowbans, or any other Reddit safety or moderation systems.</li>
                        <li><strong>AI Model Training:</strong> Using Reddit data accessed through our service to train, fine-tune, or improve any machine learning or AI models.</li>
                        <li><strong>Sensitive Data Processing:</strong> Using our service to infer sensitive characteristics about Reddit users (health, political views, sexual orientation, religion, etc.) or to re-identify anonymized users.</li>
                        <li><strong>Data Commercialization:</strong> Selling, licensing, sharing, or commercially exploiting Reddit data accessed through our service.</li>
                        <li><strong>Illegal or Malicious Activities:</strong> Using our service for any illegal, harmful, deceptive, or malicious purposes, or to violate any third-party rights.</li>
                        <li><strong>Impersonation:</strong> Using our service to impersonate any person, entity, or Reddit user.</li>
                        <li><strong>Harrassment:</strong> Using our service to harass, threaten, bully, or harm any Reddit user or community.</li>
                    </ul>
                    <p>Violation of these prohibitions may result in immediate account suspension and reporting to Reddit if applicable.</p>

                    <h3 className="text-2xl font-bold text-slate-900 mt-12 mb-4">4. Subscriptions &amp; Billing</h3>
                    <p>
                        By subscribing to a paid plan, you agree to recurring billing based on your selected cycle (Monthly or Yearly).
                    </p>
                    <ul className="list-disc pl-6 mt-4 space-y-2">
                        <li><strong>Auto-Renewal:</strong> Subscriptions renew automatically unless cancelled via the Billing settings at least 24 hours before the period ends.</li>
                        <li><strong>Cancellation:</strong> You may cancel auto-renewal at any time. You will retain access to premium features until the end of your current billing period.</li>
                    </ul>

                    <h3 className="text-2xl font-bold text-slate-900 mt-12 mb-4">5. Refund Policy</h3>
                    <p>
                        We strive for transparency in our refund process. Refunds are processed manually and are subject to the following "Fair Use" criteria:
                    </p>
                    <ul className="list-disc pl-6 mt-4 space-y-2">
                        <li><strong>Time Window:</strong> Refund requests must be submitted within the timeframe specified in our global policy (defaulting to 7 days from purchase).</li>
                        <li><strong>Usage Threshold:</strong> To prevent abuse, refunds are only eligible if credit consumption is below the defined threshold (defaulting to 20% of the plan's total credits).</li>
                        <li><strong>Discretionary Refunds:</strong> Management reserves the right to deny refunds if patterns of abuse or system exploitation are detected.</li>
                    </ul>

                    <h3 className="text-2xl font-bold text-slate-900 mt-12 mb-4">6. Account Deletion &amp; Termination</h3>
                    <p>
                        We respect your right to be forgotten. However, to prevent accidental or malicious data loss, the following protocol applies:
                    </p>
                    <ul className="list-disc pl-6 mt-4 space-y-2">
                        <li><strong>Scheduled Deletion:</strong> Upon request, accounts are scheduled for deletion and permanently removed after a <strong>14-day grace period</strong>. Reddit OAuth tokens are revoked immediately upon deletion request.</li>
                        <li><strong>Reactivation:</strong> You may cancel a deletion request at any time during the 14-day grace period by logging into your account.</li>
                        <li><strong>Reddit Content:</strong> Any Reddit-sourced content stored in our system is deleted within <strong>48 hours</strong> of the deletion request, ahead of the full account deletion.</li>
                        <li><strong>Suspension:</strong> We reserve the right to suspend or terminate accounts immediately for non-payment, payment disputes (chargebacks), violation of Reddit's API rules, or violation of these Terms of Service.</li>
                    </ul>

                    <h3 className="text-2xl font-bold text-slate-900 mt-12 mb-4">7. Liability &amp; Disclaimers</h3>
                    <p>
                        RedditGo is an AI-powered suggestion and management tool. You are <strong>solely responsible</strong> for reviewing all AI-generated content and ensuring your use of RedditGo complies with Reddit's Terms of Service, Content Policy, and Anti-Spam policies, as well as all applicable laws and regulations.
                    </p>
                    <p className="mt-4">
                        RedditGo is <strong>not responsible</strong> for any account bans, content removals, karma penalties, or other restrictions imposed by Reddit as a result of your use of our service. We provide tools and suggestions — you make the decisions.
                    </p>
                    <p className="mt-4">
                        Our service is provided "as is" without warranties of any kind. We do not guarantee specific results, engagement rates, or Reddit account outcomes.
                    </p>

                    <h3 className="text-2xl font-bold text-slate-900 mt-12 mb-4">8. Changes to These Terms</h3>
                    <p>
                        We may update these Terms of Service from time to time. We will notify you of significant changes via email. Continued use of our service after changes are posted constitutes your acceptance of the updated terms. The "Last Updated" date at the top of this page reflects the most recent revision.
                    </p>

                    <h3 className="text-2xl font-bold text-slate-900 mt-12 mb-4">9. Contact Us</h3>
                    <p>If you have questions about these Terms of Service, please contact us:</p>
                    <ul className="list-none pl-0 space-y-1 mt-4 text-slate-600">
                        <li><strong>Email:</strong> <a href="mailto:legal@redditgo.online" className="text-orange-600 hover:underline">legal@redditgo.online</a></li>
                        <li><strong>Website:</strong> <a href="https://redditgo.online" className="text-orange-600 hover:underline">redditgo.online</a></li>
                    </ul>
                </div>
            </div>
        </div>
    );
};
