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
                        Welcome to RedditGo ("we," "us," or "our"). By accessing our service at <strong>redditgo.online</strong>, you agree to be bound by these Terms of Service. RedditGo is an AI-powered assistant designed to facilitate authentic engagement on Reddit through our proprietary <strong>Browser Extension Bridge</strong>.
                    </p>

                    <h3 className="text-2xl font-bold text-slate-900 mt-12 mb-4">1. Human-in-the-Loop &amp; Final Approval</h3>
                    <div className="bg-orange-50 border border-orange-100 rounded-2xl p-6 mb-6">
                        <p className="font-bold text-slate-900 mb-2">RedditGo is NOT an autonomous bot.</p>
                        <p className="text-slate-600">Our platform generates <strong>suggestions</strong>. No content (replies or posts) is ever submitted to Reddit without your explicit manual review and approval through the RedditGo dashboard and browser extension. You maintain 100% control and ownership over all content posted via your account.</p>
                    </div>

                    <h3 className="text-2xl font-bold text-slate-900 mt-12 mb-4">2. The Extension Bridge Architecture</h3>
                    <p>To ensure maximum account safety, RedditGo utilizes a "Bridge" model:</p>
                    <ul className="list-disc pl-6 space-y-2 mb-6 text-slate-600">
                        <li><strong>Local Execution:</strong> All authorized actions are executed locally on your machine via our browser extension. This ensures actions originate from your personal IP address, maintaining account consistency.</li>
                        <li><strong>No Credential Storage:</strong> We do not ask for or store your Reddit password. The extension utilizes your active, authorized browser session.</li>
                        <li><strong>User Responsibility:</strong> You are solely responsible for keeping the extension updated and ensuring your browser environment is secure.</li>
                    </ul>

                    <h3 className="text-2xl font-bold text-slate-900 mt-12 mb-4">3. Acceptable Use &amp; Reddit Compliance</h3>
                    <p>You agree to use RedditGo in full compliance with Reddit's <a href="https://www.redditinc.com/policies/content-policy" target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:underline">Content Policy</a>, <a href="https://www.redditinc.com/policies/user-agreement" target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:underline">User Agreement</a>, and <a href="https://support.reddithelp.com/hc/en-us/articles/42728983564564" target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:underline">Responsible Builder Policy</a>. Prohibited activities include:</p>
                    <ul className="list-disc pl-6 space-y-2 mb-6 text-slate-600">
                        <li>Generating or posting spam, deceptive content, or harmful material.</li>
                        <li>Using RedditGo to circumvent Reddit's safety mechanisms or subreddit rules.</li>
                        <li>Automating actions without manual review (violating our "Assistant" philosophy).</li>
                        <li>Engaging in vote manipulation or karma farming.</li>
                    </ul>

                    <h3 className="text-2xl font-bold text-slate-900 mt-12 mb-4">4. Limitation of Liability &amp; Disclaimers</h3>
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 mb-6 font-medium text-slate-700">
                        <p><strong>Account Safety Disclaimer:</strong> While the Extension Bridge model is designed to minimize risk, RedditGo is <strong>not responsible</strong> for any account restrictions, shadowbans, or permanent bans imposed by Reddit. Use of automation-assisted tools involves inherent risks, and you assume all such risks by using the service.</p>
                    </div>
                    <p>RedditGo is provided "as is" without warranties of any kind regarding the performance, accuracy, or continuous availability of the "Bridge" between the dashboard and the extension.</p>

                    <h3 className="text-2xl font-bold text-slate-900 mt-12 mb-4">5. Subscriptions &amp; Fair Use</h3>
                    <p>
                        Subscriptions are billed on a recurring basis. We reserve the right to suspend accounts that exhibit patterns of system abuse, credit exploitation, or payment disputes (chargebacks). Refunds are discretionary and based on our Fair Use policy (usage below 20% of credits).
                    </p>

                    <h3 className="text-2xl font-bold text-slate-900 mt-12 mb-4">6. Contact Information</h3>
                    <p>For legal inquiries, contact <a href="mailto:legal@redditgo.online" className="text-orange-600 hover:underline">legal@redditgo.online</a>.</p>
                </div>
            </div>
        </div>
    );
};
