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
                        At RedditGo, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website (<strong>redditgo.online</strong>) and use our application. We operate in full compliance with Reddit's <strong>Responsible Builder Policy</strong>, Reddit's Data API Terms, and all applicable privacy laws.
                    </p>

                    <h3 className="text-2xl font-bold text-slate-900 mt-12 mb-4">1. Information We Collect</h3>
                    <p>We may collect the following categories of information:</p>
                    <ul className="list-disc pl-6 space-y-2 mb-6 text-slate-600">
                        <li><strong>Personal Data:</strong> Name, email address, and demographic information you voluntarily provide when registering or using our application.</li>
                        <li><strong>Derivative Data:</strong> Technical information automatically collected when you access our service, such as IP address, browser type, operating system, and access times. This data is used solely to operate and improve the service.</li>
                        <li><strong>Reddit Integration Data:</strong> We access your Reddit account data (public posts, subreddit information, account identity) exclusively through Reddit's official OAuth2 API on your behalf, and only after you grant explicit permission. We <strong>do not</strong> store your Reddit password. Access tokens are encrypted and stored securely.</li>
                        <li><strong>Usage Data:</strong> Information about how you use our features (e.g., number of AI suggestions generated, posts reviewed) to improve service quality.</li>
                    </ul>

                    <h3 className="text-2xl font-bold text-slate-900 mt-12 mb-4">2. How We Use Your Information</h3>
                    <p>We use your information strictly to provide and improve our service. Specifically:</p>
                    <ul className="list-disc pl-6 space-y-2 mb-6 text-slate-600">
                        <li>Create and manage your account.</li>
                        <li>Generate AI-powered reply and post <strong>suggestions</strong> for your Reddit engagement (all suggestions require your explicit approval before posting).</li>
                        <li>Monitor and analyze usage and trends to improve your experience.</li>
                        <li>Notify you of updates, low credits, and account changes.</li>
                        <li>Process payments and manage subscriptions.</li>
                        <li>Respond to support tickets and inquiries.</li>
                    </ul>

                    <h3 className="text-2xl font-bold text-slate-900 mt-12 mb-4">3. Reddit Data — Special Handling</h3>
                    <div className="bg-orange-50 border border-orange-100 rounded-2xl p-6 mb-6">
                        <p className="font-bold text-slate-900 mb-3">Our commitments regarding Reddit data:</p>
                        <ul className="list-disc pl-6 space-y-2 text-slate-600">
                            <li><strong>Reddit Content Deletion:</strong> If you delete a post or comment from Reddit, any copy of that content stored in our system will be permanently deleted within <strong>48 hours</strong>, in accordance with Reddit's Data API Terms.</li>
                            <li><strong>No AI Model Training:</strong> We <strong>do not</strong> use any Reddit user-generated content — including public posts, comments, or subreddit data — to train, fine-tune, or improve any machine learning or artificial intelligence models. This is strictly prohibited under Reddit's terms, and we fully comply.</li>
                            <li><strong>No Re-identification:</strong> We will never attempt to re-identify, de-anonymize, or reverse-engineer data about Reddit users.</li>
                            <li><strong>No Sensitive Inference:</strong> We do not process Reddit data to infer sensitive characteristics about users, including health conditions, political affiliation, sexual orientation, or religious beliefs.</li>
                            <li><strong>No Data Commercialization:</strong> We do not sell, license, or share Reddit data with any third party for commercial purposes.</li>
                            <li><strong>Minimum Necessary Access:</strong> We request only the OAuth2 scopes strictly required for our features (<code>identity</code>, <code>submit</code>, <code>read</code>, <code>history</code>). We do not request unnecessary permissions.</li>
                            <li><strong>Reddit API Compliance:</strong> We comply fully with Reddit's Responsible Builder Policy, Data API Terms, and applicable rate limits (100 QPM per OAuth client).</li>
                        </ul>
                    </div>

                    <h3 className="text-2xl font-bold text-slate-900 mt-12 mb-4">4. Disclosure of Your Information</h3>
                    <p>We do not sell your personal data. We may share information only in the following limited circumstances:</p>
                    <ul className="list-disc pl-6 space-y-2 mb-6 text-slate-600">
                        <li><strong>By Law or to Protect Rights:</strong> To respond to legal process, investigate violations of our policies, or protect the rights and safety of others.</li>
                        <li><strong>Third-Party Service Providers:</strong> We share data with trusted partners that perform services for us, including payment processing (Stripe/PayPal), transactional email, and hosting infrastructure. These providers are contractually prohibited from using your data for any other purpose.</li>
                        <li><strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of assets, your data may be transferred. We will provide notice before your data is transferred and becomes subject to a different privacy policy.</li>
                    </ul>

                    <h3 className="text-2xl font-bold text-slate-900 mt-12 mb-4">5. Data Retention &amp; Deletion</h3>
                    <p>We believe in your right to data control. Our retention policies are as follows:</p>
                    <ul className="list-disc pl-6 mt-4 space-y-2 mb-6 text-slate-600">
                        <li><strong>Reddit Content (48-hour rule):</strong> Any Reddit post, comment, or content stored in our system that has been deleted from Reddit will be removed from our databases within <strong>48 hours</strong>.</li>
                        <li><strong>Account Deletion Grace Period:</strong> When you request account deletion, your account enters a <strong>14-day grace period</strong>. During this time, your account is deactivated but data is preserved to allow restoration if you change your mind. Reddit OAuth tokens are revoked immediately.</li>
                        <li><strong>Permanent Removal:</strong> After the 14-day grace period, all personal data, brand profiles, AI-generated content, and Reddit integration tokens are <strong>permanently purged</strong> from our active databases.</li>
                        <li><strong>Financial Records:</strong> Transaction data is retained as required by law for accounting and tax purposes, even after account deletion.</li>
                        <li><strong>Routine Deletion:</strong> We routinely delete stored Reddit user data and content on a rolling basis, consistent with Reddit's recommendation of no longer than 48 hours for deleted content.</li>
                    </ul>

                    <h3 className="text-2xl font-bold text-slate-900 mt-12 mb-4">6. Your Rights (GDPR &amp; CCPA)</h3>
                    <p>Depending on your location, you may have the following rights regarding your personal data:</p>
                    <ul className="list-disc pl-6 space-y-2 mb-6 text-slate-600">
                        <li><strong>Right to Access:</strong> You may request a copy of the personal data we hold about you.</li>
                        <li><strong>Right to Rectification:</strong> You may request that we correct inaccurate or incomplete data.</li>
                        <li><strong>Right to Erasure ("Right to be Forgotten"):</strong> You may request deletion of your personal data. We will process this within 30 days (and Reddit-sourced content within 48 hours).</li>
                        <li><strong>Right to Restriction of Processing:</strong> You may request that we limit how we use your data.</li>
                        <li><strong>Right to Data Portability:</strong> You may request your data in a structured, machine-readable format.</li>
                        <li><strong>Right to Object:</strong> You may object to our processing of your data for certain purposes.</li>
                        <li><strong>California Residents (CCPA):</strong> You have the right to know what personal information is collected, to opt out of the sale of personal information (we do not sell personal information), and to non-discrimination for exercising your rights.</li>
                    </ul>
                    <p>To exercise any of these rights, please contact us at <a href="mailto:privacy@redditgo.online" className="text-orange-600 hover:underline">privacy@redditgo.online</a>.</p>

                    <h3 className="text-2xl font-bold text-slate-900 mt-12 mb-4">7. Security of Your Data</h3>
                    <p>
                        We use administrative, technical, and physical security measures to protect your personal information, including encryption of Reddit OAuth tokens, HTTPS enforcement, rate limiting, and input sanitization. However, no method of transmission over the Internet or electronic storage is 100% secure. We encourage you to use strong passwords and enable two-factor authentication on your account.
                    </p>

                    <h3 className="text-2xl font-bold text-slate-900 mt-12 mb-4">8. Cookies &amp; Tracking</h3>
                    <p>
                        We use session-based authentication tokens (stored securely in your browser) to maintain your logged-in state. We do not use third-party advertising cookies or cross-site tracking technologies. Any analytics we use are for the sole purpose of improving our service.
                    </p>

                    <h3 className="text-2xl font-bold text-slate-900 mt-12 mb-4">9. Third-Party Links</h3>
                    <p>
                        Our service integrates with Reddit's platform via their official API. Your use of Reddit is governed by Reddit's own <a href="https://www.reddit.com/policies/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:underline">Privacy Policy</a> and <a href="https://www.redditinc.com/policies/user-agreement" target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:underline">User Agreement</a>. We encourage you to review those policies.
                    </p>

                    <h3 className="text-2xl font-bold text-slate-900 mt-12 mb-4">10. Policy Updates</h3>
                    <p>
                        We may update this privacy policy from time to time to reflect changes in our practices or applicable laws. The "Last Updated" date at the top of this page will reflect the most recent changes. We will notify registered users of material changes via email.
                    </p>

                    <h3 className="text-2xl font-bold text-slate-900 mt-12 mb-4">11. Contact Us</h3>
                    <p>If you have questions, concerns, or requests regarding this Privacy Policy or your personal data, please contact us:</p>
                    <ul className="list-none pl-0 space-y-1 mt-4 text-slate-600">
                        <li><strong>Email:</strong> <a href="mailto:privacy@redditgo.online" className="text-orange-600 hover:underline">privacy@redditgo.online</a></li>
                        <li><strong>Website:</strong> <a href="https://redditgo.online" className="text-orange-600 hover:underline">redditgo.online</a></li>
                    </ul>
                </div>
            </div>
        </div>
    );
};
