
import React, { useState, useEffect } from 'react';
import {
    Users,
    Settings,
    Cpu,
    Activity,
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
    CreditCard
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
    model: string;
    temperature: number;
    maxOutputTokens: number;
    systemPrompt: string;
    apiKey: string;
}

interface StripeSettings {
    publishableKey: string;
    secretKey: string;
    webhookSecret: string;
    isSandbox: boolean;
}

import { useLocation } from 'react-router-dom';

export const Admin: React.FC = () => {
    const location = useLocation();
    // Determine active tab based on URL
    const getActiveTab = () => {
        const path = location.pathname;
        if (path.includes('/users')) return 'users';
        if (path.includes('/ai')) return 'ai';
        if (path.includes('/payments')) return 'payments';
        if (path.includes('/logs')) return 'logs';
        return 'overview';
    };

    const activeTab = getActiveTab();

    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [aiSettings, setAiSettings] = useState<AISettings>({
        model: 'gemini-1.5-flash',
        temperature: 0.7,
        maxOutputTokens: 1024,
        systemPrompt: '',
        apiKey: ''
    });
    const [stripeSettings, setStripeSettings] = useState<StripeSettings>({
        publishableKey: '',
        secretKey: '',
        webhookSecret: '',
        isSandbox: true
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
            const [statsRes, usersRes, aiRes, stripeRes] = await Promise.all([
                fetch('/api/admin/stats'),
                fetch('/api/admin/users'),
                fetch('/api/admin/ai-settings'),
                fetch('/api/admin/stripe-settings')
            ]);

            if (statsRes.ok) setStats(await statsRes.json());
            if (usersRes.ok) setUsers(await usersRes.json());
            if (aiRes.ok) setAiSettings(await aiRes.json());
            const stripeData = await stripeRes.json(); // May fail if not implemented on backend yet, define fallback
            if (stripeRes.ok) setStripeSettings(stripeData);


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

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-fade-in font-['Outfit'] pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-100">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                            {activeTab === 'overview' && 'System Overview'}
                            {activeTab === 'users' && 'User Management'}
                            {activeTab === 'ai' && 'AI Intelligence'}
                            {activeTab === 'payments' && 'Payment Gateway'}
                            {activeTab === 'logs' && 'System Logs'}
                        </h1>
                    </div>
                    <p className="text-slate-400 font-medium">
                        {activeTab === 'overview' && 'Real-time platform metrics.'}
                        {activeTab === 'users' && 'Manage access and subscriptions.'}
                        {activeTab === 'ai' && 'Configure Generative AI models.'}
                        {activeTab === 'payments' && 'Manage Stripe integration.'}
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

                    {/* AI Settings Tab */}
                    {activeTab === 'ai' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="col-span-2 space-y-8">
                                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm space-y-6">
                                    <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                                        <div className="w-12 h-12 bg-orange-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-100">
                                            <Zap size={24} />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-slate-900">Model Configuration</h2>
                                            <p className="text-slate-400 text-sm">Fine-tune the behavior of your AI agents.</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="block">
                                            <span className="text-sm font-bold text-slate-700 mb-2 block">System Prompt</span>
                                            <textarea
                                                className="w-full h-40 p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-orange-50 focus:border-orange-500 focus:outline-none transition-all font-mono text-sm leading-relaxed"
                                                value={aiSettings.systemPrompt}
                                                onChange={(e) => setAiSettings({ ...aiSettings, systemPrompt: e.target.value })}
                                                placeholder="Define the AI persona and constraints..."
                                            />
                                        </label>
                                    </div>
                                </div>

                                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm space-y-6">
                                    <h2 className="text-xl font-bold text-slate-900">API Gateway</h2>
                                    <div className="space-y-4">
                                        <label className="block">
                                            <span className="text-sm font-bold text-slate-700 mb-2 block">Gemini API Key</span>
                                            <div className="flex gap-3">
                                                <input
                                                    type="password"
                                                    className="flex-1 p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-orange-50 focus:border-orange-500 focus:outline-none transition-all font-mono text-sm"
                                                    value={aiSettings.apiKey}
                                                    onChange={(e) => setAiSettings({ ...aiSettings, apiKey: e.target.value })}
                                                    placeholder="sk-..."
                                                />
                                                <button className="px-6 font-bold bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors">Test</button>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200/60 shadow-sm">
                                    <h3 className="font-bold text-slate-900 mb-4">Parameters</h3>
                                    <div className="space-y-6">
                                        <div>
                                            <div className="flex justify-between text-sm font-medium mb-2">
                                                <span className="text-slate-500">Temperature</span>
                                                <span className="text-slate-900 font-bold">{aiSettings.temperature}</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0"
                                                max="1"
                                                step="0.1"
                                                value={aiSettings.temperature}
                                                onChange={(e) => setAiSettings({ ...aiSettings, temperature: parseFloat(e.target.value) })}
                                                className="w-full accent-orange-600"
                                            />
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-sm font-medium mb-2">
                                                <span className="text-slate-500">Max Tokens</span>
                                                <span className="text-slate-900 font-bold">{aiSettings.maxOutputTokens}</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="256"
                                                max="4096"
                                                step="256"
                                                value={aiSettings.maxOutputTokens}
                                                onChange={(e) => setAiSettings({ ...aiSettings, maxOutputTokens: parseInt(e.target.value) })}
                                                className="w-full accent-orange-600"
                                            />
                                        </div>
                                        <div>
                                            <span className="text-sm font-bold text-slate-700 mb-2 block">Model Version</span>
                                            <select
                                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-medium text-sm"
                                                value={aiSettings.model}
                                                onChange={(e) => setAiSettings({ ...aiSettings, model: e.target.value })}
                                            >
                                                <option value="gemini-1.5-flash">Gemini 1.5 Flash (Fastest)</option>
                                                <option value="gemini-1.5-pro">Gemini 1.5 Pro (Best Quality)</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={handleSaveSettings}
                                    className="w-full py-4 bg-slate-900 text-white rounded-[2rem] font-bold shadow-xl hover:bg-orange-600 hover:shadow-orange-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <Save size={20} />
                                    Save Configuration
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Payment Gateway Tab */}
                    {activeTab === 'payments' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="col-span-2 space-y-8">
                                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm space-y-6">
                                    <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                                        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                                            <CreditCard size={24} />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-slate-900">Stripe Configuration</h2>
                                            <p className="text-slate-400 text-sm">Manage API keys and payment processing modes.</p>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-200/60">
                                            <div>
                                                <h3 className="font-bold text-slate-900">Sandbox Mode</h3>
                                                <p className="text-slate-500 text-xs">Enable for testing payments without real charges.</p>
                                            </div>
                                            <button
                                                onClick={() => setStripeSettings({ ...stripeSettings, isSandbox: !stripeSettings.isSandbox })}
                                                className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 relative ${stripeSettings.isSandbox ? 'bg-orange-600' : 'bg-slate-300'}`}
                                            >
                                                <div className={`w-6 h-6 bg-white rounded-full shadow-sm transition-transform duration-300 ${stripeSettings.isSandbox ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                            </button>
                                        </div>

                                        <label className="block">
                                            <span className="text-sm font-bold text-slate-700 mb-2 block">Publishable Key {stripeSettings.isSandbox && '(Test)'}</span>
                                            <input
                                                type="text"
                                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 focus:outline-none transition-all font-mono text-sm leading-relaxed"
                                                value={stripeSettings.publishableKey}
                                                onChange={(e) => setStripeSettings({ ...stripeSettings, publishableKey: e.target.value })}
                                                placeholder={stripeSettings.isSandbox ? "pk_test_..." : "pk_live_..."}
                                            />
                                        </label>

                                        <label className="block">
                                            <span className="text-sm font-bold text-slate-700 mb-2 block">Secret Key {stripeSettings.isSandbox && '(Test)'}</span>
                                            <input
                                                type="password"
                                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 focus:outline-none transition-all font-mono text-sm leading-relaxed"
                                                value={stripeSettings.secretKey}
                                                onChange={(e) => setStripeSettings({ ...stripeSettings, secretKey: e.target.value })}
                                                placeholder={stripeSettings.isSandbox ? "sk_test_..." : "sk_live_..."}
                                            />
                                        </label>

                                        <label className="block">
                                            <span className="text-sm font-bold text-slate-700 mb-2 block">Webhook Signing Secret</span>
                                            <input
                                                type="password"
                                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 focus:outline-none transition-all font-mono text-sm leading-relaxed"
                                                value={stripeSettings.webhookSecret}
                                                onChange={(e) => setStripeSettings({ ...stripeSettings, webhookSecret: e.target.value })}
                                                placeholder="whsec_..."
                                            />
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="bg-indigo-900 p-6 rounded-[2.5rem] shadow-xl text-white relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
                                    <div className="relative z-10 space-y-4">
                                        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                                            <Shield size={24} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg">Secure Integration</h3>
                                            <p className="text-indigo-200 text-sm mt-2 opacity-80 leading-relaxed">
                                                Your keys are encrypted at rest. We use industry-standard security practices to protect payment data.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={handleSaveStripeSettings}
                                    className="w-full py-4 bg-slate-900 text-white rounded-[2rem] font-bold shadow-xl hover:bg-indigo-600 hover:shadow-indigo-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <Save size={20} />
                                    Save API Keys
                                </button>
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
