
import React, { useState, useEffect } from 'react';
import {
    User, CreditCard, Shield, Globe, Link as LinkIcon,
    LogOut, RefreshCw, CheckCircle2, Tag, Palette,
    Building2, Target, Zap, Save, Check, Pencil
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

type Tab = 'profile' | 'brand' | 'billing';

const DEFAULT_BRAND = {
    brandName: 'Redigo',
    description: 'An AI-powered Reddit outreach tool that helps SaaS founders find and engage with their target audience authentically.',
    targetAudience: 'SaaS founders, indie hackers, B2B marketers',
    problem: 'Manual Reddit outreach is slow, inconsistent, and hard to scale without sounding spammy.',
    website: 'https://redigo.io',
    primaryColor: '#EA580C',
    secondaryColor: '#1E293B',
    brandTone: 'professional',
    customTone: ''
};

const BRAND_TONES = [
    { id: 'professional', label: 'Professional', emoji: '💼', desc: 'Authoritative & trustworthy' },
    { id: 'friendly', label: 'Friendly', emoji: '😊', desc: 'Approachable & warm' },
    { id: 'bold', label: 'Bold', emoji: '⚡', desc: 'Confident & direct' },
    { id: 'educational', label: 'Educational', emoji: '📚', desc: 'Informative & helpful' },
    { id: 'custom', label: 'Custom', emoji: '✏️', desc: 'Define your own tone' },
];

export const Settings: React.FC = () => {
    const { user, logout } = useAuth();
    const [activeTab, setActiveTab] = useState<Tab>('profile');
    const [redditStatus, setRedditStatus] = useState<{ connected: boolean; accounts: any[] }>({ connected: false, accounts: [] });
    const [loading, setLoading] = useState(true);
    const [brandSaving, setBrandSaving] = useState(false);
    const [brandSaved, setBrandSaved] = useState(false);
    const [brandError, setBrandError] = useState('');
    const [brandProfile, setBrandProfile] = useState({ ...DEFAULT_BRAND });

    useEffect(() => {
        const fetchData = async () => {
            if (!user?.id) { setLoading(false); return; }
            try {
                const [redditRes, brandRes] = await Promise.all([
                    fetch(`/api/user/reddit/status?userId=${user.id}`),
                    fetch(`/api/user/brand-profile?userId=${user.id}`)
                ]);
                if (redditRes.ok) {
                    const status = await redditRes.json();
                    setRedditStatus(status);
                } else {
                    setRedditStatus({ connected: false, accounts: [] });
                }
            } catch (err) {
                console.error("Failed to fetch settings:", err);
                setRedditStatus({ connected: false, accounts: [] });
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user]);

    const handleConnectReddit = async () => {
        try {
            const response = await fetch('/api/auth/reddit/url');
            const data = await response.json();
            if (data.url) window.location.href = data.url;
        } catch {
            alert('Failed to initiate Reddit connection');
        }
    };

    const handleSaveBrand = async () => {
        if (!user?.id) return;
        setBrandSaving(true);
        setBrandError('');
        try {
            const res = await fetch('/api/user/brand-profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, ...brandProfile })
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Save failed');
            }
            setBrandSaved(true);
            setTimeout(() => setBrandSaved(false), 3000);
        } catch (err: any) {
            setBrandError(err.message || 'Failed to save. Please try again.');
        } finally {
            setBrandSaving(false);
        }
    };

    if (!user) return (
        <div className="min-h-[400px] flex items-center justify-center">
            <RefreshCw className="animate-spin text-orange-600" size={32} />
        </div>
    );

    const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
        { id: 'profile', label: 'Account', icon: <User size={15} /> },
        { id: 'brand', label: 'Brand Profile', icon: <Building2 size={15} /> },
        { id: 'billing', label: 'Billing', icon: <CreditCard size={15} /> },
    ];

    const hasBrand = !!brandProfile.brandName;

    return (
        <div className="max-w-4xl space-y-6 font-['Outfit'] pb-20 pt-4">

            {/* Header */}
            <div className="flex justify-between items-end border-b border-slate-100 pb-6">
                <div className="space-y-1">
                    <p className="text-slate-400 font-semibold text-sm">Welcome back, {user?.name?.split(' ')[0] || 'there'}</p>
                    <div className="flex items-center gap-2">
                        <span className="w-1.5 h-7 bg-orange-600 rounded-full" />
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Settings</h1>
                    </div>
                    <p className="text-slate-400 font-medium text-sm pl-4">Manage your account, brand, and preferences.</p>
                </div>
                <button onClick={logout} className="flex items-center gap-2 px-4 py-2 text-red-500 font-bold hover:bg-red-50 rounded-xl transition-colors">
                    <LogOut size={16} /> Logout
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1.5 bg-slate-100 p-1.5 rounded-2xl w-fit">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === tab.id
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        {tab.icon}
                        {tab.label}
                        {tab.id === 'brand' && hasBrand && (
                            <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                        )}
                    </button>
                ))}
            </div>

            {/* ── ACCOUNT TAB ── */}
            {activeTab === 'profile' && (
                <div className="space-y-8">
                    <section className="space-y-4">
                        <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                            <User className="text-orange-600" size={20} /> Profile Information
                        </h2>
                        <div className="bg-white p-8 rounded-[2rem] border border-slate-200/60 shadow-sm space-y-6">
                            <div className="flex items-center gap-6">
                                <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 text-2xl font-black border-4 border-white shadow-lg">
                                    {user.name.substring(0, 2).toUpperCase()}
                                </div>
                                <div className="space-y-1">
                                    <button className="text-sm font-bold text-orange-600 border border-orange-200 bg-orange-50 px-4 py-2 rounded-xl hover:bg-orange-100 transition-colors">Change Avatar</button>
                                    <p className="text-xs text-slate-400">JPG, GIF or PNG. Max 800K</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <label className="space-y-2">
                                    <span className="text-sm font-bold text-slate-700">Display Name</span>
                                    <input type="text" defaultValue={user.name} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-bold text-slate-700 focus:border-orange-500 transition-colors" />
                                </label>
                                <label className="space-y-2">
                                    <span className="text-sm font-bold text-slate-700">Email Address</span>
                                    <input type="email" defaultValue={user.email} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-bold text-slate-400 cursor-not-allowed" disabled />
                                </label>
                            </div>
                        </div>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                            <LinkIcon className="text-blue-600" size={20} /> Connected Accounts
                        </h2>
                        <div className="bg-white p-8 rounded-[2rem] border border-slate-200/60 shadow-sm space-y-4">
                            {loading ? (
                                <div className="flex items-center justify-center py-4">
                                    <RefreshCw className="animate-spin text-slate-400" size={20} />
                                </div>
                            ) : (
                                <>
                                    {/* Plan Limits Indicator */}
                                    <div className="flex items-center justify-between px-6 py-4 bg-slate-50 rounded-2xl border border-slate-100 mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                                <LinkIcon size={14} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Account Slots</p>
                                                <p className="text-sm font-bold text-slate-900">
                                                    {(redditStatus.accounts || []).length} / {user.plan === 'Agency' ? '∞' : (user.plan === 'Professional' || user.plan === 'Pro' || user.plan === 'Starter') ? (user.plan === 'Starter' ? '1' : '3') : '1'} <span className="text-slate-400 font-medium ml-1">accounts connected</span>
                                                </p>
                                            </div>
                                        </div>
                                        {(redditStatus.accounts || []).length >= ((user.plan === 'Professional' || user.plan === 'Pro') ? 3 : user.plan === 'Agency' ? 999 : 1) ? (
                                            <Link to="/pricing" className="text-[10px] font-black text-orange-600 bg-orange-50 px-3 py-1.5 rounded-lg hover:bg-orange-100 transition-colors">UPGRADE FOR MORE</Link>
                                        ) : (
                                            <button
                                                onClick={handleConnectReddit}
                                                className="text-[10px] font-black text-white bg-slate-900 px-4 py-1.5 rounded-lg hover:bg-orange-600 transition-all flex items-center gap-2"
                                            >
                                                <RefreshCw size={10} /> LINK NEW ACCOUNT
                                            </button>
                                        )}
                                    </div>

                                    {/* Account List */}
                                    {(redditStatus.accounts || []).length > 0 ? (
                                        <div className="space-y-3">
                                            {(redditStatus.accounts || []).map((acc: any) => (
                                                <div key={acc.username} className="flex items-center justify-between p-5 bg-white border border-slate-100 rounded-[1.5rem] hover:border-orange-200 transition-all group">
                                                    <div className="flex items-center gap-4">
                                                        {acc.icon
                                                            ? <img src={acc.icon} alt={acc.username} className="w-10 h-10 rounded-xl border-2 border-white shadow-sm" />
                                                            : <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center text-white font-black">R</div>
                                                        }
                                                        <div>
                                                            <p className="font-bold text-slate-900 group-hover:text-orange-600 transition-colors">u/{acc.username}</p>
                                                            <p className="text-[10px] text-slate-400 font-medium">Linked on {new Date(acc.connectedAt).toLocaleDateString()}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="flex items-center gap-1.5 bg-green-100 text-green-700 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider">
                                                            <CheckCircle2 size={12} /> Active
                                                        </span>
                                                        <button
                                                            onClick={async () => {
                                                                if (window.confirm(`Disconnect u/${acc.username}?`)) {
                                                                    const res = await fetch('/api/user/reddit/disconnect', {
                                                                        method: 'POST',
                                                                        headers: { 'Content-Type': 'application/json' },
                                                                        body: JSON.stringify({ userId: user.id, username: acc.username })
                                                                    });
                                                                    if (res.ok) window.location.reload();
                                                                }
                                                            }}
                                                            className="text-slate-300 hover:text-red-500 text-xs font-bold transition-colors py-2 px-2"
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-10 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
                                            <Globe className="mx-auto text-slate-300 mb-3" size={40} />
                                            <p className="font-bold text-slate-900">No Reddit accounts linked</p>
                                            <p className="text-xs text-slate-400 mb-6">Connect your first account to start using AI outreach.</p>
                                            <button onClick={handleConnectReddit} className="px-8 py-3 bg-slate-900 text-white rounded-xl text-xs font-black hover:bg-orange-600 transition-all shadow-xl shadow-slate-200">
                                                LINK REDDIT ACCOUNT
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </section>

                    <section className="pt-6 border-t border-slate-100">
                        <div className="bg-red-50/30 p-8 rounded-[2rem] border border-red-100/50 flex flex-col md:flex-row items-center justify-between gap-6">
                            <div>
                                <p className="font-black text-red-600 text-lg">Permanently Delete Account</p>
                                <p className="text-sm text-slate-400 font-medium">This action cannot be undone. All your data will be erased.</p>
                            </div>
                            <button className="px-8 py-4 bg-white border-2 border-red-100 text-red-600 rounded-2xl font-black hover:bg-red-600 hover:text-white hover:border-red-600 transition-all shadow-sm">
                                DELETE ACCOUNT
                            </button>
                        </div>
                    </section>
                </div>
            )}

            {/* ── BRAND PROFILE TAB ── */}
            {activeTab === 'brand' && (
                <div className="space-y-6">

                    {/* AI Memory Banner */}
                    <div className="p-5 bg-gradient-to-r from-orange-500 to-amber-500 rounded-3xl flex items-center gap-4 text-white shadow-xl shadow-orange-200">
                        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                            <Zap size={22} className="text-white" />
                        </div>
                        <div>
                            <p className="font-extrabold text-base">AI Brand Memory — Fill Once, Used Everywhere</p>
                            <p className="text-orange-100 text-sm font-medium mt-0.5">
                                Every AI post & comment will automatically use this context. No need to re-enter anything.
                            </p>
                        </div>
                    </div>

                    <div className="bg-white rounded-[2.5rem] border border-slate-200/60 shadow-sm overflow-hidden">

                        {/* ── Section 1: Brand Identity ── */}
                        <div className="p-8 space-y-6">
                            <div className="flex items-center gap-3 pb-2 border-b border-slate-50">
                                <div className="w-9 h-9 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center">
                                    <Building2 size={16} />
                                </div>
                                <div>
                                    <p className="font-extrabold text-slate-900">Brand Identity</p>
                                    <p className="text-xs text-slate-400 font-medium">Core information about your product</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                        <Tag size={10} /> Brand / Product Name *
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Redigo"
                                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:border-orange-500 font-bold transition-all text-slate-900"
                                        value={brandProfile.brandName}
                                        onChange={e => setBrandProfile(p => ({ ...p, brandName: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                        <Globe size={10} /> Website URL
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="https://yoursite.com"
                                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:border-orange-500 font-bold transition-all text-slate-900"
                                        value={brandProfile.website}
                                        onChange={e => setBrandProfile(p => ({ ...p, website: e.target.value }))}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">What does your product do?</label>
                                <textarea
                                    rows={2}
                                    placeholder="e.g. Redigo is an AI-powered Reddit outreach tool that helps SaaS founders find and engage with their target audience authentically."
                                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:border-orange-500 font-medium text-slate-700 resize-none transition-all"
                                    value={brandProfile.description}
                                    onChange={e => setBrandProfile(p => ({ ...p, description: e.target.value }))}
                                />
                            </div>
                        </div>

                        {/* ── Section 2: Audience & Problem ── */}
                        <div className="p-8 space-y-6 bg-slate-50/50 border-t border-slate-100">
                            <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                                <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                                    <Target size={16} />
                                </div>
                                <div>
                                    <p className="font-extrabold text-slate-900">Audience & Problem</p>
                                    <p className="text-xs text-slate-400 font-medium">Who you serve and what pain you solve</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Target Audience</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. SaaS founders, B2B marketers"
                                        className="w-full p-4 bg-white border border-slate-100 rounded-2xl focus:outline-none focus:border-orange-500 font-bold transition-all text-slate-900"
                                        value={brandProfile.targetAudience}
                                        onChange={e => setBrandProfile(p => ({ ...p, targetAudience: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Main Problem You Solve</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Manual Reddit outreach is slow and ineffective"
                                        className="w-full p-4 bg-white border border-slate-100 rounded-2xl focus:outline-none focus:border-orange-500 font-bold transition-all text-slate-900"
                                        value={brandProfile.problem}
                                        onChange={e => setBrandProfile(p => ({ ...p, problem: e.target.value }))}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* ── Section 3: Visual Identity ── */}
                        <div className="p-8 space-y-6 border-t border-slate-100">
                            <div className="flex items-center gap-3 pb-2 border-b border-slate-50">
                                <div className="w-9 h-9 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
                                    <Palette size={16} />
                                </div>
                                <div>
                                    <p className="font-extrabold text-slate-900">Visual Identity</p>
                                    <p className="text-xs text-slate-400 font-medium">Colors used when generating AI images for your posts</p>
                                </div>
                            </div>

                            {/* Color Pickers */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Primary Color */}
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Primary Color</label>
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <input
                                                type="color"
                                                value={brandProfile.primaryColor}
                                                onChange={e => setBrandProfile(p => ({ ...p, primaryColor: e.target.value }))}
                                                className="w-14 h-14 rounded-2xl cursor-pointer border-4 border-white shadow-lg"
                                                style={{ padding: '2px' }}
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <input
                                                type="text"
                                                value={brandProfile.primaryColor}
                                                onChange={e => setBrandProfile(p => ({ ...p, primaryColor: e.target.value }))}
                                                className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:border-orange-500 font-mono font-bold text-slate-700 text-sm"
                                                placeholder="#EA580C"
                                            />
                                            <p className="text-[10px] text-slate-400 font-medium mt-1 px-1">Main brand color</p>
                                        </div>
                                    </div>
                                    {/* Preset swatches */}
                                    <div className="flex gap-2 flex-wrap">
                                        {['#EA580C', '#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#06B6D4'].map(c => (
                                            <button
                                                key={c}
                                                onClick={() => setBrandProfile(p => ({ ...p, primaryColor: c }))}
                                                className={`w-7 h-7 rounded-lg border-2 transition-all hover:scale-110 ${brandProfile.primaryColor === c ? 'border-slate-900 scale-110' : 'border-white shadow-sm'}`}
                                                style={{ backgroundColor: c }}
                                                title={c}
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* Secondary Color */}
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Secondary Color</label>
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <input
                                                type="color"
                                                value={brandProfile.secondaryColor}
                                                onChange={e => setBrandProfile(p => ({ ...p, secondaryColor: e.target.value }))}
                                                className="w-14 h-14 rounded-2xl cursor-pointer border-4 border-white shadow-lg"
                                                style={{ padding: '2px' }}
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <input
                                                type="text"
                                                value={brandProfile.secondaryColor}
                                                onChange={e => setBrandProfile(p => ({ ...p, secondaryColor: e.target.value }))}
                                                className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:border-orange-500 font-mono font-bold text-slate-700 text-sm"
                                                placeholder="#1E293B"
                                            />
                                            <p className="text-[10px] text-slate-400 font-medium mt-1 px-1">Background / accent color</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 flex-wrap">
                                        {['#1E293B', '#111827', '#1E3A5F', '#064E3B', '#1C1917', '#312E81', '#4A044E', '#083344'].map(c => (
                                            <button
                                                key={c}
                                                onClick={() => setBrandProfile(p => ({ ...p, secondaryColor: c }))}
                                                className={`w-7 h-7 rounded-lg border-2 transition-all hover:scale-110 ${brandProfile.secondaryColor === c ? 'border-slate-400 scale-110' : 'border-white shadow-sm'}`}
                                                style={{ backgroundColor: c }}
                                                title={c}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Live Preview */}
                            <div className="p-5 rounded-2xl border border-slate-100 space-y-2">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Color Preview</p>
                                <div className="flex gap-3 items-center">
                                    <div className="flex-1 h-12 rounded-xl shadow-sm" style={{ backgroundColor: brandProfile.primaryColor }} />
                                    <div className="flex-1 h-12 rounded-xl shadow-sm" style={{ backgroundColor: brandProfile.secondaryColor }} />
                                    <div className="flex-1 h-12 rounded-xl shadow-sm flex items-center justify-center text-xs font-black" style={{ background: `linear-gradient(135deg, ${brandProfile.primaryColor}, ${brandProfile.secondaryColor})`, color: '#fff' }}>
                                        Gradient
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── Section 4: Brand Tone ── */}
                        <div className="p-8 space-y-6 bg-slate-50/50 border-t border-slate-100">
                            <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                                <div className="w-9 h-9 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
                                    <Pencil size={16} />
                                </div>
                                <div>
                                    <p className="font-extrabold text-slate-900">Default Brand Tone</p>
                                    <p className="text-xs text-slate-400 font-medium">How your brand communicates with the audience</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                                {BRAND_TONES.map(t => (
                                    <button
                                        key={t.id}
                                        onClick={() => setBrandProfile(p => ({ ...p, brandTone: t.id }))}
                                        className={`p-4 rounded-2xl border-2 text-left transition-all ${brandProfile.brandTone === t.id
                                            ? 'border-orange-500 bg-orange-50 shadow-md shadow-orange-100'
                                            : 'border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm'
                                            }`}
                                    >
                                        <div className="text-2xl mb-2">{t.emoji}</div>
                                        <p className="font-extrabold text-slate-900 text-sm leading-tight">{t.label}</p>
                                        <p className="text-[10px] text-slate-400 font-medium mt-0.5 leading-tight">{t.desc}</p>
                                        {brandProfile.brandTone === t.id && (
                                            <div className="mt-2">
                                                <Check size={12} className="text-orange-600" />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>

                            {/* Custom Tone Input */}
                            {brandProfile.brandTone === 'custom' && (
                                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                        <Pencil size={10} /> Describe Your Custom Tone
                                    </label>
                                    <textarea
                                        rows={3}
                                        placeholder="e.g. We communicate like a knowledgeable friend — never corporate, always direct, occasionally humorous, and always backed by data. We challenge assumptions and celebrate contrarian thinking."
                                        className="w-full p-4 bg-white border border-orange-200 rounded-2xl focus:outline-none focus:border-orange-500 font-medium text-slate-700 resize-none transition-all"
                                        value={brandProfile.customTone}
                                        onChange={e => setBrandProfile(p => ({ ...p, customTone: e.target.value }))}
                                    />
                                    <p className="text-[10px] text-slate-400 font-medium px-1">The more specific you are, the better the AI will match your voice.</p>
                                </div>
                            )}
                        </div>

                        {/* ── Save Button ── */}
                        <div className="p-8 border-t border-slate-100">
                            {brandError && (
                                <div className="mb-4 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-bold">
                                    ⚠️ {brandError}
                                </div>
                            )}
                            <button
                                onClick={handleSaveBrand}
                                disabled={brandSaving || !brandProfile.brandName}
                                className={`w-full py-5 rounded-[2rem] font-black transition-all flex items-center justify-center gap-3 text-lg ${brandSaved
                                    ? 'bg-green-600 text-white shadow-lg shadow-green-200'
                                    : 'bg-orange-600 text-white hover:bg-orange-500 shadow-2xl shadow-orange-200 disabled:opacity-50 disabled:grayscale'
                                    }`}
                            >
                                {brandSaving
                                    ? <><RefreshCw className="animate-spin" size={22} /> Saving Brand Profile...</>
                                    : brandSaved
                                        ? <><Check size={22} /> Brand Profile Saved! ✓</>
                                        : <><Save size={22} /> SAVE BRAND PROFILE</>
                                }
                            </button>
                            <p className="text-center text-[11px] text-slate-400 font-medium mt-3">
                                This profile is used automatically in all AI-generated posts and comments.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* ── BILLING TAB ── */}
            {activeTab === 'billing' && (
                <div className="space-y-8">
                    <section className="space-y-4">
                        <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                            <CreditCard className="text-purple-600" size={20} /> Subscription & Billing
                        </h2>
                        <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-10 rounded-[2.5rem] shadow-2xl text-white relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-80 h-80 bg-orange-600/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 group-hover:bg-orange-600/20 transition-all duration-700" />
                            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                                <div>
                                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-lg text-[10px] font-black tracking-widest uppercase mb-4 text-orange-400">
                                        <Shield size={12} /> Secure Account
                                    </div>
                                    <p className="text-3xl font-extrabold mb-2">{user.plan} Plan</p>
                                    <p className="text-slate-400 text-sm max-w-sm">
                                        {user.plan === 'Free'
                                            ? 'Access basic signals and limited Reddit searches. Upgrade for deeper insights.'
                                            : 'Full access to all market signals and advanced AI generation.'}
                                    </p>
                                </div>
                                <div>
                                    {user.plan === 'Free' ? (
                                        <Link to="/pricing" className="px-8 py-4 bg-orange-600 text-white rounded-2xl font-black hover:bg-orange-500 hover:shadow-2xl hover:shadow-orange-600/30 transition-all block text-center">
                                            UPGRADE NOW
                                        </Link>
                                    ) : (
                                        <button className="px-8 py-4 bg-white text-slate-900 rounded-2xl font-black hover:bg-slate-100 transition-all">
                                            MANAGE BILLING
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            )}
        </div>
    );
};
