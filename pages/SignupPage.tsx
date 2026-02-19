import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Rocket, Users, TrendingUp, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const SignupPage: React.FC = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { signup } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Signup failed');
            }

            signup(data.token, data.user);
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 font-['Outfit'] flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background Decorative Elements similar to Landing Page */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-orange-200/40 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 -z-10 animate-pulse-slow"></div>
            <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-blue-200/30 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2 -z-10 animate-pulse-slow delay-700"></div>

            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col md:flex-row min-h-[600px]">

                {/* Left Side - Value Prop (Light Theme) */}
                <div className="w-full md:w-5/12 bg-slate-50 p-10 flex flex-col justify-between relative overflow-hidden">
                    {/* Background Gradients */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-orange-100 rounded-full blur-3xl -mr-16 -mt-16"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-green-50 rounded-full blur-3xl -ml-16 -mb-16"></div>

                    <div className="relative z-10">
                        <Link to="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-orange-600 transition-colors font-bold mb-8 group">
                            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                            Back to Home
                        </Link>

                        <div className="space-y-6">
                            <div className="inline-flex items-center gap-2 bg-orange-100 px-3 py-1 rounded-full w-fit">
                                <Rocket size={16} className="text-orange-600 fill-orange-600" />
                                <span className="text-orange-700 font-bold text-xs uppercase tracking-wider">Start Now</span>
                            </div>

                            <h1 className="text-4xl font-extrabold text-slate-900 leading-[1.1]">
                                Join <span className="text-orange-600">1K+ Founders</span> growing on autopilot.
                            </h1>

                            <div className="space-y-4 pt-2">
                                <div className="flex gap-4 p-4 bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                                    <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-600 flex-shrink-0">
                                        <TrendingUp size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 text-sm">Instant Growth</h3>
                                        <p className="text-slate-500 text-xs leading-relaxed mt-1">Start seeing karma and traffic increases within the first week.</p>
                                    </div>
                                </div>

                                <div className="flex gap-4 p-4 bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                                    <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 flex-shrink-0">
                                        <Users size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 text-sm">Community First</h3>
                                        <p className="text-slate-500 text-xs leading-relaxed mt-1">We respect Reddit's culture. No spam, just value.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="relative z-10 pt-8 text-slate-400 text-xs font-medium">
                        © 2026 RedditGo AI.
                    </div>
                </div>

                {/* Right Side - Form */}
                <div className="w-full md:w-7/12 bg-white p-10 flex flex-col justify-center">
                    <div className="max-w-sm mx-auto w-full space-y-6">
                        <div className="space-y-1">
                            <h2 className="text-2xl font-extrabold text-slate-900">Create your account</h2>
                            <p className="text-slate-500 text-base">Start your growth journey today.</p>
                        </div>

                        <form className="space-y-5" onSubmit={handleSubmit}>
                            {error && (
                                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg font-medium border border-red-100">
                                    {error}
                                </div>
                            )}
                            <div className="space-y-1.5">
                                <label className="text-sm font-bold text-slate-700" htmlFor="name">Full Name</label>
                                <input
                                    type="text"
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium text-slate-900 placeholder:text-slate-400"
                                    placeholder="John Doe"
                                    required
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-bold text-slate-700" htmlFor="email">Email address</label>
                                <input
                                    type="email"
                                    id="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium text-slate-900 placeholder:text-slate-400"
                                    placeholder="name@company.com"
                                    required
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-bold text-slate-700" htmlFor="password">Password</label>
                                <input
                                    type="password"
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium text-slate-900 placeholder:text-slate-400"
                                    placeholder="Create a strong password"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-3.5 bg-orange-600 text-white rounded-xl font-bold text-lg hover:bg-orange-500 transition-colors shadow-lg hover:shadow-xl hover:shadow-orange-500/30 hover:-translate-y-0.5 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isLoading ? <Loader2 className="animate-spin" size={20} /> : <>Get Started Free <ArrowRight size={20} /></>}
                            </button>
                        </form>

                        <div className="text-center">
                            <p className="text-slate-500 font-medium text-sm">
                                Already have an account? <Link to="/login" className="text-orange-600 font-bold hover:text-orange-700">Sign In</Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
