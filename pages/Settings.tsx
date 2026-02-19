
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
    User, CreditCard, Shield, Globe, Link as LinkIcon,
    LogOut, RefreshCw, CheckCircle2, Tag, Palette,
    Building2, Target, Zap, Save, Check, Pencil,
    Upload, Trash2, Eye, X
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
    const { user, logout, updateUser } = useAuth();
    const [activeTab, setActiveTab] = useState<Tab>('profile');
    const [redditStatus, setRedditStatus] = useState<{ connected: boolean; accounts: any[] }>({ connected: false, accounts: [] });
    const [loading, setLoading] = useState(true);
    const [brandSaving, setBrandSaving] = useState(false);
    const [brandSaved, setBrandSaved] = useState(false);
    const [brandError, setBrandError] = useState('');
    const [brandProfile, setBrandProfile] = useState({ ...DEFAULT_BRAND });

    // Profile State
    const [profileName, setProfileName] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [isProfileSaving, setIsProfileSaving] = useState(false);
    const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const [previewInvoice, setPreviewInvoice] = useState<string | null>(null);

    const generateInvoiceImage = (user: any) => {
        return new Promise<string>((resolve) => {
            const canvas = document.createElement('canvas');
            canvas.width = 800;
            canvas.height = 600;
            const ctx = canvas.getContext('2d');

            // Plan Details Logic
            let planCredits = 0;
            let planPrice = '0.00';
            const planName = user.plan || 'Free';

            if (planName.toLowerCase() === 'professional' || planName.toLowerCase() === 'pro') {
                planCredits = 150;
                planPrice = '29.00';
            } else if (planName.toLowerCase() === 'agency') {
                planCredits = 600;
                planPrice = '99.00';
            } else {
                planCredits = 100; // Starter/Free default
                planPrice = '0.00';
            }

            if (ctx) {
                // Background
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, 800, 600);

                // Header
                ctx.fillStyle = '#f8fafc';
                ctx.fillRect(0, 0, 800, 150);

                ctx.font = 'bold 40px Arial';
                ctx.fillStyle = '#ea580c';
                ctx.fillText('Redigo', 50, 90);

                ctx.font = '20px Arial';
                ctx.fillStyle = '#64748b';
                ctx.textAlign = 'right';
                ctx.fillText('INVOICE', 750, 90);

                // Bill To
                ctx.textAlign = 'left';
                ctx.font = 'bold 18px Arial';
                ctx.fillStyle = '#0f172a';
                ctx.fillText('Bill To:', 50, 200);

                ctx.font = '16px Arial';
                ctx.fillStyle = '#334155';
                ctx.fillText(user.name || 'Valued Customer', 50, 230);
                ctx.fillText(user.email || '', 50, 255);

                // Info
                ctx.textAlign = 'right';
                const date = new Date().toLocaleDateString();
                ctx.fillText(`Date: ${date}`, 750, 230);
                ctx.fillText(`Invoice #: INV-${Math.floor(1000 + Math.random() * 9000)}`, 750, 255);

                // Item Row
                ctx.fillStyle = '#f1f5f9';
                ctx.fillRect(50, 300, 700, 40);
                ctx.fillStyle = '#475569';
                ctx.font = 'bold 14px Arial';
                ctx.textAlign = 'left';
                ctx.fillText('DESCRIPTION', 70, 325);
                ctx.textAlign = 'right';
                ctx.fillText('AMOUNT', 730, 325);

                // Item Details
                ctx.font = '16px Arial';
                ctx.fillStyle = '#1e293b';
                ctx.textAlign = 'left';
                ctx.fillText(`${planName} Plan Subscription`, 70, 370);

                ctx.font = '14px Arial';
                ctx.fillStyle = '#64748b';
                ctx.fillText(`Includes ${planCredits} Credits`, 70, 395);

                ctx.textAlign = 'right';
                ctx.font = '16px Arial';
                ctx.fillStyle = '#1e293b';
                ctx.fillText(`$${planPrice}`, 730, 370);

                // Total Line
                ctx.beginPath();
                ctx.moveTo(500, 430);
                ctx.lineTo(750, 430);
                ctx.strokeStyle = '#e2e8f0';
                ctx.stroke();

                ctx.font = 'bold 20px Arial';
                ctx.fillStyle = '#0f172a';
                ctx.fillText(`Total: $${planPrice}`, 730, 470);

                // Footer
                ctx.textAlign = 'center';
                ctx.font = '14px Arial';
                ctx.fillStyle = '#94a3b8';
                ctx.fillText('Thank you for choosing Redigo.', 400, 550);

                resolve(canvas.toDataURL('image/png'));
            }
        });
    };

    useEffect(() => {
        if (user) {
            setProfileName(user.name || '');
            setAvatarUrl(user.avatar || '');
        }
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

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 800 * 1024) {
                setProfileMessage({ type: 'error', text: 'Image too large. Max 800KB.' });
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarUrl(reader.result as string);
                setProfileMessage(null); // Clear errors
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveProfile = async () => {
        if (!user?.id) return;
        setIsProfileSaving(true);
        setProfileMessage(null);

        try {
            const response = await fetch(`/api/users/${user.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: profileName,
                    avatar: avatarUrl
                })
            });

            if (!response.ok) throw new Error('Failed to update profile');

            const updatedUser = await response.json();
            // Update local auth context
            updateUser({ name: profileName, avatar: avatarUrl });

            setProfileMessage({ type: 'success', text: 'Profile updated successfully!' });
            setTimeout(() => setProfileMessage(null), 3000);
        } catch (error) {
            setProfileMessage({ type: 'error', text: 'Failed to update profile' });
        } finally {
            setIsProfileSaving(false);
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
                                <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 text-2xl font-black border-4 border-white shadow-lg shrink-0 overflow-hidden relative">
                                    {avatarUrl ? (
                                        <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                    ) : (
                                        profileName ? profileName.substring(0, 2).toUpperCase() : user.name.substring(0, 2).toUpperCase()
                                    )}
                                </div>
                                <div className="space-y-1 flex-1">
                                    <h3 className="font-bold text-slate-900 text-lg">{user.email}</h3>
                                    <p className="text-xs text-slate-400">Profile ID: #{user.id}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <label className="space-y-2">
                                    <span className="text-sm font-bold text-slate-700">Display Name</span>
                                    <input
                                        type="text"
                                        value={profileName}
                                        onChange={(e) => setProfileName(e.target.value)}
                                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-bold text-slate-900 focus:border-orange-500 transition-colors"
                                    />
                                </label>
                                <label className="space-y-2">
                                    <span className="text-sm font-bold text-slate-700">Profile Picture</span>
                                    <div className="flex gap-2">
                                        <label className="flex-1 cursor-pointer group">
                                            <div className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-500 group-hover:bg-slate-100 group-hover:border-orange-200 group-hover:text-orange-600 transition-all flex items-center justify-center gap-2">
                                                <Upload size={18} />
                                                <span className="text-sm">Choose Image...</span>
                                            </div>
                                            <input
                                                type="file"
                                                accept="image/png, image/jpeg, image/gif"
                                                onChange={handleFileChange}
                                                className="hidden"
                                            />
                                        </label>
                                        {avatarUrl && (
                                            <button
                                                onClick={() => setAvatarUrl('')}
                                                className="p-3.5 bg-red-50 border border-red-100 text-red-500 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm"
                                                title="Remove Avatar"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-medium px-1">Max 800KB (JPG, PNG)</p>
                                </label>
                                <label className="space-y-2 md:col-span-2">
                                    <span className="text-sm font-bold text-slate-700">Email Address</span>
                                    <input
                                        type="email"
                                        value={user.email}
                                        className="w-full p-4 bg-slate-100 border border-slate-200 rounded-xl focus:outline-none font-bold text-slate-500 cursor-not-allowed"
                                        disabled
                                    />
                                </label>
                            </div>

                            {profileMessage && (
                                <div className={`p-4 rounded-xl text-sm font-bold ${profileMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                    {profileMessage.type === 'success' ? <CheckCircle2 className="inline mr-2" size={16} /> : null}
                                    {profileMessage.text}
                                </div>
                            )}

                            <div className="flex justify-end pt-2">
                                <button
                                    onClick={handleSaveProfile}
                                    disabled={isProfileSaving || !profileName.trim()}
                                    className="px-8 py-3 bg-slate-900 text-white rounded-xl font-black hover:bg-orange-600 transition-all disabled:opacity-50 disabled:grayscale flex items-center gap-2"
                                >
                                    {isProfileSaving ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
                                    Save Changes
                                </button>
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
                                    : 'bg-orange-600 text-white hover:bg-orange-50 shadow-2xl shadow-orange-200 disabled:opacity-50 disabled:grayscale'
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
                    <section className="space-y-6">
                        <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                            <CreditCard className="text-purple-600" size={20} /> Subscription & Usage
                        </h2>

                        {/* Current Plan Card */}
                        <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-[2.5rem] shadow-2xl text-white relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-80 h-80 bg-orange-600/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 group-hover:bg-orange-600/20 transition-all duration-700" />
                            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                                <div>
                                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-lg text-[10px] font-black tracking-widest uppercase mb-4 text-orange-400">
                                        <Shield size={12} /> Current Plan
                                    </div>
                                    <p className="text-4xl font-extrabold mb-2">{user.plan || 'Free'} Plan</p>
                                    <p className="text-slate-400 text-sm opacity-80">
                                        {user.plan === 'Free'
                                            ? 'Basic access. Upgrade to unlock more power.'
                                            : 'Your plan serves you well. Keep growing!'}
                                    </p>
                                </div>
                                <div className="text-right">
                                    {user.plan === 'Free' ? (
                                        <Link to="/pricing" className="px-8 py-3 bg-orange-600 text-white rounded-xl font-black hover:bg-orange-500 hover:shadow-lg hover:shadow-orange-600/30 transition-all inline-block">
                                            UPGRADE NOW
                                        </Link>
                                    ) : (
                                        <div className="space-y-1">
                                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Status</p>
                                            <div className="flex items-center justify-end gap-2 text-green-400 font-black">
                                                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                                                Active
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Usage & Credits */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white p-8 rounded-[2rem] border border-slate-200/60 shadow-sm space-y-4">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                        <Zap size={20} fill="currentColor" />
                                    </div>
                                    <div>
                                        <p className="font-extrabold text-slate-900">Credit Balance</p>
                                        <p className="text-xs text-slate-400 font-medium">AI generations remaining</p>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-end">
                                        <span className="text-3xl font-black text-slate-900">{user.credits || 0}</span>
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Credits</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-orange-500 rounded-full"
                                            style={{ width: `${Math.min(100, ((user.credits || 0) / 100) * 100)}%` }}
                                        />
                                    </div>
                                    <p className="text-[10px] text-slate-400 pt-1">
                                        Need more? <Link to="/pricing" className="text-orange-600 font-bold hover:underline">Top up credits</Link>
                                    </p>
                                </div>
                            </div>

                            <div className="bg-white p-8 rounded-[2rem] border border-slate-200/60 shadow-sm space-y-4">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                                        <CreditCard size={20} />
                                    </div>
                                    <div>
                                        <p className="font-extrabold text-slate-900">Recent Invoices</p>
                                        <p className="text-xs text-slate-400 font-medium">Last 3 payments</p>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    {/* Placeholder Invoices - In a real app, fetch these */}
                                    {user.plan === 'Free' ? (
                                        <p className="text-sm text-slate-400 italic py-2">No payment history available.</p>
                                    ) : (
                                        [1].map((_, i) => (
                                            <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 group hover:border-orange-200 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-white rounded-lg border border-slate-100 text-slate-400 group-hover:text-orange-500 transition-colors">
                                                        <CreditCard size={14} />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-slate-900">Subscription Renewal</p>
                                                        <p className="text-[10px] text-slate-400">{new Date().toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="text-right">
                                                        <p className="text-xs font-bold text-slate-900">$29.00</p>
                                                        <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-md">PAID</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            onClick={async () => {
                                                                const dataUrl = await generateInvoiceImage(user);
                                                                setPreviewInvoice(dataUrl);
                                                            }}
                                                            className="p-2 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                            title="Preview Invoice"
                                                        >
                                                            <Eye size={16} />
                                                        </button>
                                                        <button
                                                            onClick={async () => {
                                                                const dataUrl = await generateInvoiceImage(user);
                                                                const link = document.createElement('a');
                                                                link.download = `Redigo-Invoice-${new Date().toISOString().split('T')[0]}.png`;
                                                                link.href = dataUrl;
                                                                link.click();
                                                            }}
                                                            className="p-2 text-slate-300 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all"
                                                            title="Download Invoice"
                                                        >
                                                            <Upload className="rotate-180" size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            )}

            {/* Invoice Preview Modal */}
            {previewInvoice && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                            <h3 className="text-lg font-bold text-slate-900">Invoice Preview</h3>
                            <button
                                onClick={() => setPreviewInvoice(null)}
                                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-all"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-auto p-8 bg-slate-50 flex justify-center">
                            <img src={previewInvoice} alt="Invoice Preview" className="shadow-xl rounded-lg max-w-full h-auto border border-slate-200" />
                        </div>
                        <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-white">
                            <button
                                onClick={() => setPreviewInvoice(null)}
                                className="px-5 py-2.5 text-slate-600 font-bold hover:bg-slate-50 rounded-xl transition-all"
                            >
                                Close
                            </button>
                            <button
                                onClick={() => {
                                    const link = document.createElement('a');
                                    link.download = `Redigo-Invoice-${new Date().toISOString().split('T')[0]}.png`;
                                    link.href = previewInvoice;
                                    link.click();
                                }}
                                className="px-5 py-2.5 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-500 shadow-lg shadow-orange-200 transition-all flex items-center gap-2"
                            >
                                <Upload className="rotate-180" size={16} /> Download
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};
