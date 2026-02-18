
import React, { useState, useEffect } from 'react';
import {
    LayoutDashboard,
    Users,
    Activity,
    Settings,
    Cpu,
    Search,
    Filter,
    MoreHorizontal,
    Save,
    RefreshCw,
    CheckCircle,
    AlertTriangle,
    Server,
    Database,
    Shield,
    Zap,
    Trash2,
    Edit2,
    CreditCard,
    Globe,
    Copy,
} from 'lucide-react';

// Mock Data Types
interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    plan: string;
    status: string;
}

interface AISettings {
    provider: 'google' | 'openai' | 'openrouter';
    model: string;
    temperature: number;
    maxOutputTokens: number;
    systemPrompt: string;
    apiKey: string;
    baseUrl?: string;
}

interface StripeSettings {
    publishableKey: string;
    secretKey: string;
    webhookSecret: string;
    isSandbox: boolean;
}

interface RedditSettings {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    userAgent: string;
}

import { useLocation } from 'react-router-dom';

export const Admin: React.FC = () => {
    const location = useLocation();
    // Determine active tab based on URL
    const getActiveTab = () => {
        const path = location.pathname;
        if (path.includes('/users')) return 'users';
        if (path.includes('/settings')) return 'settings';
        if (path.includes('/logs')) return 'logs';
        return 'overview';
    };

    const activeTab = getActiveTab();
    const [settingsTab, setSettingsTab] = useState<'ai' | 'payments' | 'reddit'>('ai');

    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [aiSettings, setAiSettings] = useState<AISettings>({
        provider: 'google',
        model: 'gemini-1.5-flash',
        temperature: 0.7,
        maxOutputTokens: 1024,
        systemPrompt: '',
        apiKey: '',
        baseUrl: 'https://openrouter.ai/api/v1'
    });
    const [stripeSettings, setStripeSettings] = useState<StripeSettings>({
        publishableKey: '',
        secretKey: '',
        webhookSecret: '',
        isSandbox: true
    });
    const [redditSettings, setRedditSettings] = useState<RedditSettings>({
        clientId: '',
        clientSecret: '',
        redirectUri: 'http://localhost:5173/auth/reddit/callback',
        userAgent: 'web:redigo:v1.0.0 (by /u/yourusername)'
    });
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeSubscriptions: 0,
        apiUsage: 0,
        systemHealth: 'Unknown'
    });

    // Fetch Data Function (Real Backend)
    const fetchData = async () => {
        setLoading(true);
        try {
            // Parallel requests for efficiency
            const [statsRes, usersRes, aiRes, stripeRes, redditRes] = await Promise.all([
                fetch('/api/admin/stats'),
                fetch('/api/admin/users'),
                fetch('/api/admin/ai-settings'),
                fetch('/api/admin/stripe-settings'),
                fetch('/api/admin/reddit-settings')
            ]);

            if (statsRes.ok) setStats(await statsRes.json());
            if (usersRes.ok) setUsers(await usersRes.json());
            if (aiRes.ok) setAiSettings(await aiRes.json());

            if (stripeRes.ok) setStripeSettings(await stripeRes.json());

            if (redditRes.ok) setRedditSettings(await redditRes.json());


        } catch (error) {
            console.error("Failed to fetch admin data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSaveSettings = async () => {
        try {
            const res = await fetch('/api/admin/ai-settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(aiSettings)
            });
            if (res.ok) {
                alert('Settings saved successfully!');
            } else {
                alert('Failed to save settings.');
            }
        } catch (e) {
            console.error(e);
            alert('Error saving settings.');
        }
    };

    const handleSaveStripeSettings = async () => {
        try {
            const res = await fetch('/api/admin/stripe-settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(stripeSettings)
            });
            if (res.ok) {
                alert('Stripe settings saved successfully!');
            } else {
                alert('Failed to save Stripe settings.');
            }
        } catch (e) {
            console.error(e);
            alert('Error saving Stripe settings.');
        }
    };

    const handleSaveRedditSettings = async () => {
        try {
            const res = await fetch('/api/admin/reddit-settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(redditSettings)
            });
            if (res.ok) {
                alert('Reddit settings saved successfully!');
            } else {
                alert('Failed to save Reddit settings.');
            }
        } catch (e) {
            console.error(e);
            alert('Error saving Reddit settings.');
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-fade-in font-['Outfit'] pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-100">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                            {activeTab === 'overview' && 'System Overview'}
                            {activeTab === 'users' && 'User Management'}
                            {activeTab === 'settings' && 'Platform Configuration'}
                            {activeTab === 'logs' && 'System Logs'}
                        </h1>
                    </div>
                    <p className="text-slate-400 font-medium">
                        {activeTab === 'overview' && 'Real-time platform metrics.'}
                        {activeTab === 'users' && 'Manage access and subscriptions.'}
                        {activeTab === 'settings' && 'Manage AI, Payments, and Integrations.'}
                        {activeTab === 'logs' && 'Server events and activity.'}
                    </p>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <RefreshCw className="animate-spin text-orange-600" size={32} />
                </div>
            ) : (
                <>
                    {/* Overview Tab */}
                    {activeTab === 'overview' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Stats Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div className="bg-white p-6 rounded-[2rem] border border-slate-200/60 shadow-sm flex items-center justify-between group hover:shadow-lg transition-all">
                                    <div>
                                        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Total Users</p>
                                        <p className="text-3xl font-extrabold text-slate-900">{stats.totalUsers.toLocaleString()}</p>
                                    </div>
                                    <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl group-hover:scale-110 transition-transform">
                                        <Users size={24} />
                                    </div>
                                </div>
                                <div className="bg-white p-6 rounded-[2rem] border border-slate-200/60 shadow-sm flex items-center justify-between group hover:shadow-lg transition-all">
                                    <div>
                                        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Active Subs</p>
                                        <p className="text-3xl font-extrabold text-slate-900">{stats.activeSubscriptions.toLocaleString()}</p>
                                    </div>
                                    <div className="p-4 bg-green-50 text-green-600 rounded-2xl group-hover:scale-110 transition-transform">
                                        <Activity size={24} />
                                    </div>
                                </div>
                                <div className="bg-white p-6 rounded-[2rem] border border-slate-200/60 shadow-sm flex items-center justify-between group hover:shadow-lg transition-all">
                                    <div>
                                        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">API Usage</p>
                                        <p className="text-3xl font-extrabold text-slate-900">{stats.apiUsage}%</p>
                                    </div>
                                    <div className="p-4 bg-orange-50 text-orange-600 rounded-2xl group-hover:scale-110 transition-transform">
                                        <Cpu size={24} />
                                    </div>
                                </div>
                                <div className="bg-white p-6 rounded-[2rem] border border-slate-200/60 shadow-sm flex items-center justify-between group hover:shadow-lg transition-all">
                                    <div>
                                        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">System Health</p>
                                        <p className="text-3xl font-extrabold text-slate-900">{stats.systemHealth}</p>
                                    </div>
                                    <div className="p-4 bg-purple-50 text-purple-600 rounded-2xl group-hover:scale-110 transition-transform">
                                        <Server size={24} />
                                    </div>
                                </div>
                            </div>

                            {/* Charts Section */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm h-80 flex flex-col items-center justify-center text-slate-400">
                                    <Activity size={48} className="mb-4 opacity-20" />
                                    <p className="font-bold">Usage Metrics Chart Component Placeholder</p>
                                </div>
                                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm h-80 flex flex-col items-center justify-center text-slate-400">
                                    <Database size={48} className="mb-4 opacity-20" />
                                    <p className="font-bold">Database Growth Chart Component Placeholder</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Users Tab */}
                    {activeTab === 'users' && (
                        <div className="bg-white rounded-[2.5rem] border border-slate-200/60 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-4 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200/50 w-full max-w-md">
                                    <Search size={18} className="text-slate-400" />
                                    <input type="text" placeholder="Search users by name, email..." className="bg-transparent border-none outline-none text-sm font-medium w-full" />
                                </div>
                                <div className="flex gap-2">
                                    <button className="p-2 text-slate-400 hover:text-slate-900 transition-colors"><Filter size={20} /></button>
                                    <button className="p-2 text-slate-400 hover:text-slate-900 transition-colors"><RefreshCw size={20} /></button>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50/50 text-slate-500 text-xs font-extrabold uppercase tracking-wider border-b border-slate-100">
                                        <tr>
                                            <th className="px-8 py-4">User</th>
                                            <th className="px-8 py-4">Role</th>
                                            <th className="px-8 py-4">Plan</th>
                                            <th className="px-8 py-4">Status</th>
                                            <th className="px-8 py-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-sm font-medium">
                                        {users.map((user) => (
                                            <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                                                <td className="px-8 py-4">
                                                    <div>
                                                        <p className="text-slate-900 font-bold">{user.name}</p>
                                                        <p className="text-slate-400 text-xs">{user.email}</p>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-4">
                                                    <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${user.role === 'admin' ? 'bg-purple-50 text-purple-600' : 'bg-slate-100 text-slate-600'}`}>{user.role}</span>
                                                </td>
                                                <td className="px-8 py-4">
                                                    <span className="text-slate-700 font-bold">{user.plan}</span>
                                                </td>
                                                <td className="px-8 py-4">
                                                    <span className={`flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider w-fit ${user.status === 'Active' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                                        <span className={`w-2 h-2 rounded-full ${user.status === 'Active' ? 'bg-green-600' : 'bg-red-600'}`}></span>
                                                        {user.status}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button className="p-2 bg-white border border-slate-200 rounded-lg hover:text-orange-600 hover:border-orange-200 transition-all shadow-sm"><Edit2 size={14} /></button>
                                                        <button className="p-2 bg-white border border-slate-200 rounded-lg hover:text-red-600 hover:border-red-200 transition-all shadow-sm"><Trash2 size={14} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Settings Tab (Consolidated) */}
                    {activeTab === 'settings' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Sub-Navigation */}
                            <div className="flex p-1 bg-slate-100/80 backdrop-blur-sm rounded-2xl w-fit border border-slate-200/60">
                                <button
                                    onClick={() => setSettingsTab('ai')}
                                    className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 ${settingsTab === 'ai' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    <Cpu size={18} />
                                    AI Models
                                </button>
                                <button
                                    onClick={() => setSettingsTab('payments')}
                                    className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 ${settingsTab === 'payments' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    <CreditCard size={18} />
                                    Payments
                                </button>
                                <button
                                    onClick={() => setSettingsTab('reddit')}
                                    className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 ${settingsTab === 'reddit' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    <Globe size={18} />
                                    Reddit API
                                </button>
                            </div>

                            {/* Content Area */}
                            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm min-h-[500px]">
                                {settingsTab === 'ai' && (
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                                                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                                                    <Cpu size={24} />
                                                </div>
                                                <div>
                                                    <h2 className="text-xl font-bold text-slate-900">Generative AI Configuration</h2>
                                                    <p className="text-slate-400 text-sm">Manage LLM parameters and API keys.</p>
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                <label className="block">
                                                    <span className="text-sm font-bold text-slate-700 mb-2 block">AI Provider</span>
                                                    <select
                                                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 focus:outline-none transition-all font-bold text-slate-700 appearance-none"
                                                        value={aiSettings.provider}
                                                        onChange={(e) => {
                                                            const provider = e.target.value as any;
                                                            let defaultModel = 'gemini-1.5-flash';
                                                            if (provider === 'openai') defaultModel = 'gpt-4o';
                                                            if (provider === 'openrouter') defaultModel = 'anthropic/claude-3-sonnet';
                                                            setAiSettings({ ...aiSettings, provider, model: defaultModel });
                                                        }}
                                                    >
                                                        <option value="google">Google Gemini</option>
                                                        <option value="openai">OpenAI</option>
                                                        <option value="openrouter">OpenRouter</option>
                                                    </select>
                                                </label>

                                                <label className="block">
                                                    <span className="text-sm font-bold text-slate-700 mb-2 block">Model Selection</span>
                                                    <div className="relative">
                                                        {aiSettings.provider === 'openrouter' ? (
                                                            <input
                                                                type="text"
                                                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 focus:outline-none transition-all font-bold text-slate-700"
                                                                value={aiSettings.model}
                                                                onChange={(e) => setAiSettings({ ...aiSettings, model: e.target.value })}
                                                                placeholder="e.g. meta-llama/llama-3-70b-instruct"
                                                            />
                                                        ) : (
                                                            <select
                                                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 focus:outline-none transition-all font-bold text-slate-700 appearance-none"
                                                                value={aiSettings.model}
                                                                onChange={(e) => setAiSettings({ ...aiSettings, model: e.target.value })}
                                                            >
                                                                {aiSettings.provider === 'google' && (
                                                                    <>
                                                                        <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                                                                        <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                                                                        <option value="gemini-1.0-pro">Gemini 1.0 Pro</option>
                                                                    </>
                                                                )}
                                                                {aiSettings.provider === 'openai' && (
                                                                    <>
                                                                        <option value="gpt-4o">GPT-4o</option>
                                                                        <option value="gpt-4">GPT-4 Turbo</option>
                                                                        <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                                                                    </>
                                                                )}
                                                            </select>
                                                        )}
                                                    </div>
                                                </label>

                                                {aiSettings.provider === 'openrouter' && (
                                                    <label className="block">
                                                        <span className="text-sm font-bold text-slate-700 mb-2 block">Base URL</span>
                                                        <input
                                                            type="text"
                                                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 focus:outline-none transition-all font-mono text-sm leading-relaxed"
                                                            value={aiSettings.baseUrl}
                                                            onChange={(e) => setAiSettings({ ...aiSettings, baseUrl: e.target.value })}
                                                            placeholder="https://openrouter.ai/api/v1"
                                                        />
                                                    </label>
                                                )}
                                                <div className="grid grid-cols-2 gap-4">
                                                    <label className="block">
                                                        <span className="text-sm font-bold text-slate-700 mb-2 block">Temperature</span>
                                                        <input
                                                            type="number"
                                                            step="0.1"
                                                            min="0"
                                                            max="1"
                                                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 focus:outline-none transition-all font-bold text-slate-700"
                                                            value={aiSettings.temperature}
                                                            onChange={(e) => setAiSettings({ ...aiSettings, temperature: parseFloat(e.target.value) })}
                                                        />
                                                    </label>
                                                    <label className="block">
                                                        <span className="text-sm font-bold text-slate-700 mb-2 block">Max Tokens</span>
                                                        <input
                                                            type="number"
                                                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 focus:outline-none transition-all font-bold text-slate-700"
                                                            value={aiSettings.maxOutputTokens}
                                                            onChange={(e) => setAiSettings({ ...aiSettings, maxOutputTokens: parseInt(e.target.value) })}
                                                        />
                                                    </label>
                                                </div>
                                                <label className="block">
                                                    <span className="text-sm font-bold text-slate-700 mb-2 block">API Key</span>
                                                    <div className="relative">
                                                        <input
                                                            type="password"
                                                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 focus:outline-none transition-all font-mono text-sm"
                                                            value={aiSettings.apiKey}
                                                            onChange={(e) => setAiSettings({ ...aiSettings, apiKey: e.target.value })}
                                                            placeholder="sk-..."
                                                        />
                                                    </div>
                                                </label>
                                            </div>
                                            <button
                                                onClick={handleSaveSettings} // Changed from handleSaveAiSettings to handleSaveSettings as per original
                                                className="w-full py-4 bg-slate-900 text-white rounded-[2rem] font-bold shadow-xl hover:bg-indigo-600 hover:shadow-indigo-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                                            >
                                                <Save size={20} />
                                                Save AI Configuration
                                            </button>
                                        </div>
                                        <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                                            <label className="block h-full flex flex-col">
                                                <span className="text-sm font-bold text-slate-700 mb-4 block">System Prompt</span>
                                                <textarea
                                                    className="w-full flex-1 p-6 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 focus:outline-none transition-all font-medium text-slate-600 leading-relaxed resize-none shadow-sm"
                                                    value={aiSettings.systemPrompt}
                                                    onChange={(e) => setAiSettings({ ...aiSettings, systemPrompt: e.target.value })}
                                                    placeholder="Define the AI persona and constraints..."
                                                />
                                            </label>
                                        </div>
                                    </div>
                                )}

                                {settingsTab === 'payments' && (
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                                                <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-100">
                                                    <CreditCard size={24} />
                                                </div>
                                                <div>
                                                    <h2 className="text-xl font-bold text-slate-900">Stripe Payment Gateway</h2>
                                                    <p className="text-slate-400 text-sm">Configure API keys and billing settings.</p>
                                                </div>
                                            </div>

                                            <div className="space-y-6">
                                                <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-200/60">
                                                    <div>
                                                        <h3 className="font-bold text-slate-900">Sandbox Mode</h3>
                                                        <p className="text-slate-500 text-xs">Enable for testing payments.</p>
                                                    </div>
                                                    <button
                                                        onClick={() => setStripeSettings({ ...stripeSettings, isSandbox: !stripeSettings.isSandbox })}
                                                        className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 relative ${stripeSettings.isSandbox ? 'bg-orange-600' : 'bg-slate-300'}`}
                                                    >
                                                        <div className={`w-6 h-6 bg-white rounded-full shadow-sm transition-transform duration-300 ${stripeSettings.isSandbox ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                                    </button>
                                                </div>

                                                <label className="block">
                                                    <span className="text-sm font-bold text-slate-700 mb-2 block">Publishable Key</span>
                                                    <input
                                                        type="text"
                                                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-50 focus:border-emerald-500 focus:outline-none transition-all font-mono text-sm"
                                                        value={stripeSettings.publishableKey}
                                                        onChange={(e) => setStripeSettings({ ...stripeSettings, publishableKey: e.target.value })}
                                                        placeholder="pk_test_..."
                                                    />
                                                </label>
                                                <label className="block">
                                                    <span className="text-sm font-bold text-slate-700 mb-2 block">Secret Key</span>
                                                    <input
                                                        type="password"
                                                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-50 focus:border-emerald-500 focus:outline-none transition-all font-mono text-sm"
                                                        value={stripeSettings.secretKey}
                                                        onChange={(e) => setStripeSettings({ ...stripeSettings, secretKey: e.target.value })}
                                                        placeholder="sk_test_..."
                                                    />
                                                </label>
                                                <label className="block">
                                                    <span className="text-sm font-bold text-slate-700 mb-2 block">Webhook Secret</span>
                                                    <input
                                                        type="password"
                                                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-50 focus:border-emerald-500 focus:outline-none transition-all font-mono text-sm"
                                                        value={stripeSettings.webhookSecret}
                                                        onChange={(e) => setStripeSettings({ ...stripeSettings, webhookSecret: e.target.value })}
                                                        placeholder="whsec_..."
                                                    />
                                                </label>
                                            </div>
                                            <button
                                                onClick={handleSaveStripeSettings}
                                                className="w-full py-4 bg-slate-900 text-white rounded-[2rem] font-bold shadow-xl hover:bg-emerald-600 hover:shadow-emerald-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                                            >
                                                <Save size={20} />
                                                Save Payment Config
                                            </button>
                                        </div>
                                        {/* Helper content or stats could go here */}
                                        <div className="bg-emerald-50/50 p-8 rounded-[2rem] border border-emerald-100 flex items-center justify-center">
                                            <div className="text-center space-y-4">
                                                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm text-emerald-600">
                                                    <CreditCard size={32} />
                                                </div>
                                                <h3 className="font-bold text-slate-900">Payment Security</h3>
                                                <p className="text-slate-500 text-sm max-w-xs mx-auto">
                                                    Keys are stored securely. Ensure you are using restricted API keys for production environments.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {settingsTab === 'reddit' && (
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                                                <div className="w-12 h-12 bg-orange-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-100">
                                                    <Globe size={24} />
                                                </div>
                                                <div>
                                                    <h2 className="text-xl font-bold text-slate-900">Reddit API Configuration</h2>
                                                    <p className="text-slate-400 text-sm">Set up your application credentials.</p>
                                                </div>
                                            </div>

                                            <div className="space-y-6">
                                                <label className="block">
                                                    <span className="text-sm font-bold text-slate-700 mb-2 block">Client ID</span>
                                                    <input
                                                        type="text"
                                                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-orange-50 focus:border-orange-500 focus:outline-none transition-all font-mono text-sm"
                                                        value={redditSettings.clientId}
                                                        onChange={(e) => setRedditSettings({ ...redditSettings, clientId: e.target.value })}
                                                        placeholder="e.g. -XyZ123abc..."
                                                    />
                                                </label>
                                                <label className="block">
                                                    <span className="text-sm font-bold text-slate-700 mb-2 block">Client Secret</span>
                                                    <input
                                                        type="password"
                                                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-orange-50 focus:border-orange-500 focus:outline-none transition-all font-mono text-sm"
                                                        value={redditSettings.clientSecret}
                                                        onChange={(e) => setRedditSettings({ ...redditSettings, clientSecret: e.target.value })}
                                                    />
                                                </label>
                                                <label className="block">
                                                    <span className="text-sm font-bold text-slate-700 mb-2 block">Redirect URI</span>
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="text"
                                                            className="w-full p-4 bg-slate-100 border border-slate-200 rounded-2xl font-mono text-sm text-slate-500 cursor-not-allowed"
                                                            value={redditSettings.redirectUri}
                                                            readOnly
                                                        />
                                                        <button
                                                            onClick={() => navigator.clipboard.writeText(redditSettings.redirectUri)}
                                                            className="bg-white border border-slate-200 p-4 rounded-2xl hover:text-orange-600 hover:border-orange-200 transition-colors"
                                                            title="Copy"
                                                        >
                                                            <Copy size={20} />
                                                        </button>
                                                    </div>
                                                </label>
                                                <label className="block">
                                                    <span className="text-sm font-bold text-slate-700 mb-2 block">User Agent</span>
                                                    <input
                                                        type="text"
                                                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-orange-50 focus:border-orange-500 focus:outline-none transition-all font-mono text-sm"
                                                        value={redditSettings.userAgent}
                                                        onChange={(e) => setRedditSettings({ ...redditSettings, userAgent: e.target.value })}
                                                    />
                                                </label>
                                            </div>
                                            <button
                                                onClick={handleSaveRedditSettings}
                                                className="w-full py-4 bg-slate-900 text-white rounded-[2rem] font-bold shadow-xl hover:bg-orange-600 hover:shadow-orange-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                                            >
                                                <Save size={20} />
                                                Save Reddit Config
                                            </button>
                                        </div>
                                        <div className="bg-orange-50/50 p-8 rounded-[2rem] border border-orange-100 flex items-center justify-center">
                                            <div className="text-center space-y-4">
                                                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm text-orange-600">
                                                    <Globe size={32} />
                                                </div>
                                                <h3 className="font-bold text-slate-900">API Policy</h3>
                                                <p className="text-slate-500 text-sm max-w-xs mx-auto">
                                                    Ensure your User Agent is unique to avoid rate limiting.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Logs Tab */}
                    {activeTab === 'logs' && (
                        <div className="bg-slate-900 text-slate-300 p-8 rounded-[2.5rem] font-mono text-sm leading-relaxed shadow-2xl h-[600px] overflow-y-auto custom-scrollbar">
                            <div className="flex items-center gap-2 text-green-400 mb-2">
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                <span>System Online</span>
                            </div>
                            <p>[2026-02-18 04:22:12] INFO: Server started on port 3000</p>
                            <p>[2026-02-18 04:22:15] INFO: Database connection established</p>
                            <p className="text-orange-400">[2026-02-18 04:25:30] WARN: API latency spike detected (1200ms)</p>
                            <p>[2026-02-18 04:26:01] INFO: User 'Jane Doe' logged in</p>
                            <p>[2026-02-18 04:30:45] INFO: AI Generation request handled (Tokens: 145)</p>
                            {/* ... more mock logs */}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};
