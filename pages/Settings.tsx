
import React from 'react';
import { User, CreditCard, Shield, Bell, Github, Globe, Link as LinkIcon, LogOut } from 'lucide-react';

import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Settings: React.FC = () => {
    const { user } = useAuth();

    if (!user) return <div>Loading...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-10 animate-fade-in font-['Outfit'] pb-20">
            <div className="space-y-2 border-b border-slate-100 pb-6">
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Account Settings</h1>
                <p className="text-slate-400 font-medium">Manage your profile, subscription, and preferences.</p>
            </div>

            <div className="space-y-8">
                {/* Profile Section */}
                <section className="space-y-6">
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <User className="text-orange-600" size={20} />
                        Profile Information
                    </h2>
                    <div className="bg-white p-8 rounded-[2rem] border border-slate-200/60 shadow-sm space-y-6">
                        <div className="flex items-center gap-6">
                            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 text-2xl font-bold border-4 border-white shadow-lg">JD</div>
                            <div className="space-y-1">
                                <button className="text-sm font-bold text-orange-600 border border-orange-200 bg-orange-50 px-4 py-2 rounded-xl hover:bg-orange-100 transition-colors">Change Avatar</button>
                                <p className="text-xs text-slate-400">JPG, GIF or PNG. Max size of 800K</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <label className="space-y-2">
                                <span className="text-sm font-bold text-slate-700">Display Name</span>
                                <input type="text" defaultValue={user.name} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-bold text-slate-700" />
                            </label>
                            <label className="space-y-2">
                                <span className="text-sm font-bold text-slate-700">Email Address</span>
                                <input type="email" defaultValue={user.email} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-bold text-slate-700" disabled />
                            </label>
                        </div>
                    </div>
                </section>

                {/* Integrations */}
                <section className="space-y-6">
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <LinkIcon className="text-blue-600" size={20} />
                        Connected Accounts
                    </h2>
                    <div className="bg-white p-8 rounded-[2rem] border border-slate-200/60 shadow-sm space-y-4">
                        <div className="flex items-center justify-between p-4 bg-orange-50/50 rounded-2xl border border-orange-100">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">R</div>
                                <div>
                                    <p className="font-bold text-slate-900">Reddit Account</p>
                                    <p className="text-xs text-slate-500 font-medium">Connected as <span className="text-orange-600">u/jane_doe_builder</span></p>
                                </div>
                            </div>
                            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider">Active</span>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 opacity-60">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center text-white">
                                    <Github size={20} />
                                </div>
                                <div>
                                    <p className="font-bold text-slate-900">GitHub (Coming Soon)</p>
                                    <p className="text-xs text-slate-500 font-medium">Connect for repo analytics</p>
                                </div>
                            </div>
                            <button className="text-slate-400 font-bold text-sm" disabled>Connect</button>
                        </div>
                    </div>
                </section>

                {/* Subscription */}
                <section className="space-y-6">
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <CreditCard className="text-purple-600" size={20} />
                        Subscription & Billing
                    </h2>
                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-[2rem] shadow-xl text-white relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-white/10 transition-colors"></div>

                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div>
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Current Plan</p>
                                <p className="text-3xl font-extrabold mb-2">{user.plan} Plan</p>
                                <p className="text-slate-400 text-sm">
                                    {user.plan === 'Free' ? 'Free Forever' : 'Renews automatically'}
                                </p>
                            </div>
                            <div className="flex gap-3">
                                {user.plan === 'Free' ? (
                                    <Link to="/pricing" className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-orange-500/30 transition-all">
                                        Upgrade Plan
                                    </Link>
                                ) : (
                                    <button className="px-6 py-3 bg-white text-slate-900 rounded-xl font-bold hover:bg-slate-100 transition-colors">
                                        Manage Subscription
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Danger Zone */}
                <section className="pt-8 border-t border-slate-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-bold text-red-600">Delete Account</p>
                            <p className="text-sm text-slate-400">Permanently remove your account and all data.</p>
                        </div>
                        <button className="px-6 py-3 border-2 border-red-100 text-red-600 rounded-xl font-bold hover:bg-red-50 transition-colors">Delete Account</button>
                    </div>
                </section>
            </div>
        </div>
    );
};
