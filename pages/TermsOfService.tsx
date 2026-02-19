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
                <p className="text-lg text-slate-500 mb-12">Last updated: February 18, 2026</p>

                <div className="prose prose-lg prose-slate max-w-none">
                    <p>
                        These Terms of Service cover your use of RedditGo ("Service") and provide information about the RedditGo Service, outlined below. By creating an account or using our Service, you agree to these terms.
                    </p>

                    <h3 className="text-2xl font-bold text-slate-900 mt-12 mb-4">1. Use of Service</h3>
                    <p>
                        You must follow any policies made available to you within the Service. Don't misuse our Service. For example, don't interfere with our Service or try to access it using a method other than the interface and the instructions that we provide. You may use our Service only as permitted by law, including applicable export and re-export control laws and regulations.
                    </p>

                    <h3 className="text-2xl font-bold text-slate-900 mt-12 mb-4">2. Your RedditGo Account</h3>
                    <p>
                        You may need a RedditGo Account in order to use some of our Services. You may create your own RedditGo Account, or your RedditGo Account may be assigned to you by an administrator, such as your employer or educational institution. If you are using a RedditGo Account assigned to you by an administrator, different terms may apply and your administrator may be able to access or disable your account.
                    </p>

                    <h3 className="text-2xl font-bold text-slate-900 mt-12 mb-4">3. Content in our Services</h3>
                    <p>
                        Our Service allows you to upload, submit, store, send or receive content. You retain ownership of any intellectual property rights that you hold in that content. In short, what belongs to you stays yours.
                    </p>
                    <p className="mt-4">
                        When you upload, submit, store, send or receive content to or through our Services, you give RedditGo (and those we work with) a worldwide license to use, host, store, reproduce, modify, create derivative works (such as those resulting from translations, adaptations or other changes we make so that your content works better with our Services), communicate, publish, publicly perform, publicly display and distribute such content.
                    </p>

                    <h3 className="text-2xl font-bold text-slate-900 mt-12 mb-4">4. Privacy and Copyright Protection</h3>
                    <p>
                        RedditGo's privacy policies explain how we treat your personal data and protect your privacy when you use our Services. By using our Services, you agree that RedditGo can use such data in accordance with our privacy policies.
                    </p>

                    <h3 className="text-2xl font-bold text-slate-900 mt-12 mb-4">5. Modifying and Terminating our Services</h3>
                    <p>
                        We are constantly changing and improving our Services. We may add or remove functionalities or features, and we may suspend or stop a Service altogether.
                    </p>
                    <p className="mt-4">
                        You can stop using our Services at any time, although we'll be sorry to see you go. RedditGo may also stop providing Services to you, or add or create new limits to our Services at any time.
                    </p>
                </div>
            </div>
        </div>
    );
};
