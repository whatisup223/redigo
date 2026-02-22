
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
    X,
    CheckCircle2,
    Clock,
    Archive,
    LifeBuoy,
    ChevronRight,
    AlertCircle,
    Check,
    Eye,
    BarChart2,
    MessageSquare,
    FileText,
    Image,
    Mail,
    Bell,
    Code,
    TrendingUp,
    DollarSign,
    Zap as ZapIcon
} from 'lucide-react';

import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';

// Mock Data Types
interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    plan: string;
    status: string;
    statusMessage?: string;
    avatar?: string;
    credits: number;
    dailyUsagePoints?: number;
    customDailyLimit?: number;
    transactions?: any[];
}

interface AISettings {
    provider: 'google' | 'openai' | 'openrouter';
    model: string;
    temperature: number;
    maxOutputTokens: number;
    systemPrompt: string;
    apiKey: string;
    baseUrl?: string;
    creditCosts?: {
        comment: number;
        post: number;
        image: number;
    };
}

interface StripeSettings {
    publishableKey: string;
    secretKey: string;
    webhookSecret: string;
    isSandbox: boolean;
}

interface Plan {
    id: string;
    name: string;
    monthlyPrice: number;
    yearlyPrice: number;
    credits: number;
    dailyLimitMonthly: number;
    dailyLimitYearly: number;
    features: string[];
    isPopular: boolean;
    highlightText?: string;
    isCustom?: boolean;
    allowImages: boolean;
    allowTracking: boolean;
    maxAccounts: number;
    purchaseEnabled: boolean;
    isVisible: boolean;
}

interface RedditSettings {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    userAgent: string;
    minDelay?: number;
    maxDelay?: number;
    antiSpam?: boolean;
}

interface SMTPSettings {
    host: string;
    port: number;
    user: string;
    pass: string;
    from: string;
    secure: boolean;
}

import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Admin: React.FC = () => {
    const { user } = useAuth();
    const location = useLocation();
    // Determine active tab based on URL
    const getActiveTab = () => {
        const path = location.pathname;
        if (path.includes('/analytics')) return 'analytics';
        if (path.includes('/users')) return 'users';
        if (path.includes('/settings')) return 'settings';
        if (path.includes('/logs')) return 'logs';
        return 'overview';
    };

    const activeTab = getActiveTab();
    const [settingsTab, setSettingsTab] = useState<'ai' | 'payments' | 'reddit' | 'plans' | 'security' | 'smtp' | 'email'>('ai');

    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    // Users Filter & Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [filterRole, setFilterRole] = useState<'all' | 'admin' | 'user'>('all');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [filterPlan, setFilterPlan] = useState<string>('all');

    // Delete Modal State
    const [userToDelete, setUserToDelete] = useState<number | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const filteredUsers = users.filter(u => {
        const q = searchQuery.toLowerCase();
        return ((u.name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q))
            && (filterRole === 'all' || u.role === filterRole)
            && (filterStatus === 'all' || u.status === filterStatus)
            && (filterPlan === 'all' || u.plan === filterPlan);
    });

    const getInitials = (name: string) => name ? name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : '??';
    const [aiSettings, setAiSettings] = useState<AISettings>({
        provider: 'google',
        model: 'gemini-1.5-flash',
        temperature: 0.7,
        maxOutputTokens: 1024,
        systemPrompt: '',
        apiKey: '',
        baseUrl: 'https://openrouter.ai/api/v1',
        creditCosts: {
            comment: 1,
            post: 2,
            image: 5
        }
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
        redirectUri: '',
        userAgent: 'RedigoApp/1.0',
        minDelay: 5,
        maxDelay: 15,
        antiSpam: true
    });
    const [smtpSettings, setSmtpSettings] = useState<SMTPSettings>({
        host: '',
        port: 587,
        user: '',
        pass: '',
        from: '',
        secure: false
    });
    const [emailTemplates, setEmailTemplates] = useState<any>({});
    const [isEmailSaving, setIsEmailSaving] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<string | null>(null);
    const [testEmailLoading, setTestEmailLoading] = useState<string | null>(null);
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeSubscriptions: 0,
        apiUsage: 0,
        systemHealth: 'Unknown',
        ticketStats: {
            total: 0,
            open: 0,
            inProgress: 0,
            resolved: 0,
            closed: 0
        }
    });
    const [systemLogs, setSystemLogs] = useState<any[]>([]);
    const [analytics, setAnalytics] = useState<any>(null);
    const [analyticsLoading, setAnalyticsLoading] = useState(false);


    const [plans, setPlans] = useState<Plan[]>([]);

    // User Management Modal State
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
    const [planForm, setPlanForm] = useState<Partial<Plan>>({ features: [''] });

    const [editForm, setEditForm] = useState({ name: '', email: '', password: '', role: '', plan: '', status: '', statusMessage: '', credits: 0, extraCreditsToAdd: 0, showAddExtra: false, customDailyLimit: 0 });

    // Password State (for Admin Account)
    const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [isPasswordSaving, setIsPasswordSaving] = useState(false);
    const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // User Detail Modal State
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [detailUser, setDetailUser] = useState<any>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailRefreshing, setDetailRefreshing] = useState(false);
    const [detailLastUpdated, setDetailLastUpdated] = useState<Date | null>(null);

    const fetchDetailUser = async (userId: number, silent = false) => {
        const token = localStorage.getItem('token');
        if (!silent) setDetailLoading(true); else setDetailRefreshing(true);
        try {
            const res = await fetch(`/api/admin/users/${userId}/stats`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) {
                const data = await res.json();
                setDetailUser(data);
                setDetailLastUpdated(new Date());
            }
        } catch { }
        if (!silent) setDetailLoading(false); else setDetailRefreshing(false);
    };

    const openUserDetail = async (user: User) => {
        setDetailUser(user);
        setIsDetailModalOpen(true);
        await fetchDetailUser(user.id, false);
    };

    // Auto-refresh every 5s while modal is open
    useEffect(() => {
        if (!isDetailModalOpen || !detailUser) return;
        const interval = setInterval(() => fetchDetailUser(detailUser.id, true), 5000);
        return () => clearInterval(interval);
    }, [isDetailModalOpen, detailUser?.id]);

    // Fetch Data Function (Real Backend)
    const fetchData = async () => {
        const token = localStorage.getItem('token');
        const headers = { 'Authorization': `Bearer ${token}` };
        setLoading(true);
        try {
            const [statsRes, usersRes, aiRes, stripeRes, redditRes, smtpRes, plansRes, logsRes, emailRes] = await Promise.all([
                fetch('/api/admin/stats', { headers }),
                fetch('/api/admin/users', { headers }),
                fetch('/api/admin/ai-settings', { headers }),
                fetch('/api/admin/stripe-settings', { headers }),
                fetch('/api/admin/reddit-settings', { headers }),
                fetch('/api/admin/smtp-settings', { headers }),
                fetch('/api/plans', { headers }),
                fetch('/api/admin/logs', { headers }),
                fetch('/api/admin/email-templates', { headers })
            ]);

            if (statsRes.ok) setStats(await statsRes.json());
            if (usersRes.ok) setUsers(await usersRes.json());
            if (aiRes.ok) setAiSettings(await aiRes.json());
            if (stripeRes.ok) setStripeSettings(await stripeRes.json());
            if (redditRes.ok) setRedditSettings(await redditRes.json());
            if (smtpRes.ok) setSmtpSettings(await smtpRes.json());
            if (emailRes.ok) setEmailTemplates(await emailRes.json());
            if (plansRes.ok) setPlans(await plansRes.json());
            if (logsRes.ok) setSystemLogs(await logsRes.json());
        } catch (error) {
            console.error("Failed to fetch admin data", error);
        } finally {
            setLoading(false);
        }
    };

    // Poll logs when tab is active
    useEffect(() => {
        if (activeTab !== 'logs') return;

        const fetchLogs = async () => {
            const token = localStorage.getItem('token');
            try {
                const res = await fetch('/api/admin/logs', { headers: { 'Authorization': `Bearer ${token}` } });
                if (res.ok) {
                    setSystemLogs(await res.json());
                }
            } catch (e) {
                console.error("Error polling logs", e);
            }
        };

        fetchLogs(); // initial fetch
        const interval = setInterval(fetchLogs, 3000); // Poll every 3s
        return () => clearInterval(interval);
    }, [activeTab]);

    const fetchAnalytics = async () => {
        const token = localStorage.getItem('token');
        setAnalyticsLoading(true);
        try {
            const res = await fetch('/api/admin/analytics', { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) {
                const data = await res.json();
                setAnalytics(data);
            }
        } catch (e) {
            console.error('Failed to fetch analytics:', e);
        } finally {
            setAnalyticsLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'analytics') {
            fetchAnalytics();
        }
    }, [activeTab]);

    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser) return;
        const token = localStorage.getItem('token');
        try {
            const payload: any = {
                name: editForm.name,
                email: editForm.email,
                role: editForm.role,
                plan: editForm.plan,
                status: editForm.status,
                statusMessage: editForm.status === 'Active' ? '' : editForm.statusMessage,
                customDailyLimit: editForm.customDailyLimit
            };
            if (editForm.password) payload.password = editForm.password;
            if ((editForm.extraCreditsToAdd || 0) > 0) payload.extraCreditsToAdd = editForm.extraCreditsToAdd;
            const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                alert('User updated successfully!');
                setIsEditModalOpen(false);
                fetchData();
            }
        } catch (e) {
            alert('Failed to update user');
        }
    };

    const handleDeleteUser = (id: number) => {
        setUserToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const executeDeleteUser = async () => {
        if (!userToDelete) return;
        setIsDeleting(true);
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`/api/admin/users/${userToDelete}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                fetchData();
                setIsDeleteModalOpen(false);
                setUserToDelete(null);
            }
        } catch (e) {
            alert('Failed to delete user');
        } finally {
            setIsDeleting(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSaveSettings = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('/api/admin/ai-settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
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
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('/api/admin/stripe-settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
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

    const handleSavePlan = async () => {
        const token = localStorage.getItem('token');
        const isEditing = plans.some(p => p.id === planForm.id);
        const method = isEditing ? 'PUT' : 'POST';
        const url = isEditing ? `/api/plans/${planForm.id}` : '/api/plans';

        // Clean up features
        const cleanedFeatures = (planForm.features || []).filter(f => f.trim() !== '');

        try {
            const res = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ ...planForm, features: cleanedFeatures })
            });
            if (res.ok) {
                alert('Plan saved successfully!');
                setIsPlanModalOpen(false);
                fetchData();
            } else {
                const data = await res.json();
                alert(`Failed to save plan: ${data.error}`);
            }
        } catch (e) {
            console.error(e);
            alert('Error saving plan.');
        }
    };

    const handleDeletePlan = async (id: string) => {
        if (!confirm('Are you sure you want to delete this plan?')) return;
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`/api/plans/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                fetchData();
            } else {
                const data = await res.json();
                alert(`Failed to delete plan: ${data.error}`);
            }
        } catch (e) {
            alert('Failed to delete plan');
        }
    };

    const handleSaveRedditSettings = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('/api/admin/reddit-settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
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

    const handleSaveSMTPSettings = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('/api/admin/smtp-settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(smtpSettings)
            });
            if (res.ok) {
                alert('SMTP settings saved successfully!');
            } else {
                alert('Failed to save SMTP settings.');
            }
        } catch (e) {
            console.error(e);
            alert('Error saving SMTP settings.');
        }
    };

    const handleSaveEmailTemplates = async (updatedTemplates?: any) => {
        const token = localStorage.getItem('token');
        setIsEmailSaving(true);
        try {
            const res = await fetch('/api/admin/email-templates', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updatedTemplates || emailTemplates)
            });
            if (res.ok) {
                // Success - Fetch again to sync
                const headers = { 'Authorization': `Bearer ${token}` };
                const emailRes = await fetch('/api/admin/email-templates', { headers });
                if (emailRes.ok) setEmailTemplates(await emailRes.json());
                setEditingTemplate(null);
            } else {
                alert('Failed to save email templates.');
            }
        } catch (e) {
            console.error(e);
            alert('Error saving templates.');
        } finally {
            setIsEmailSaving(false);
        }
    };

    const handleTestEmail = async (templateId: string) => {
        const token = localStorage.getItem('token');
        const userEmail = prompt('Enter email to send test to:', user?.email || '');
        if (!userEmail) return;

        setTestEmailLoading(templateId);
        try {
            const res = await fetch('/api/admin/email-templates/test', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ templateId, to: userEmail })
            });
            const data = await res.json();
            if (res.ok) {
                alert('Test email sent successfully!');
            } else {
                alert(data.error || 'Failed to send test email.');
            }
        } catch (e) {
            console.error(e);
            alert('Error sending test email.');
        } finally {
            setTestEmailLoading(null);
        }
    };

    const handlePasswordChange = async () => {
        if (!user) {
            setPasswordMessage({ type: 'error', text: 'You must be logged in to change your password' });
            return;
        }

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setPasswordMessage({ type: 'error', text: 'New passwords do not match' });
            return;
        }

        if (passwordData.newPassword.length < 6) {
            setPasswordMessage({ type: 'error', text: 'Password must be at least 6 characters' });
            return;
        }

        setIsPasswordSaving(true);
        setPasswordMessage(null);
        const token = localStorage.getItem('token');

        try {
            const res = await fetch(`/api/users/${user.id}/password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword
                })
            });

            const data = await res.json();
            if (res.ok) {
                setPasswordMessage({ type: 'success', text: 'Password updated successfully!' });
                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            } else {
                setPasswordMessage({ type: 'error', text: data.error || 'Failed to update password' });
            }
        } catch (error) {
            console.error('Password change error:', error);
            setPasswordMessage({ type: 'error', text: 'Server error. Please try again later.' });
        } finally {
            setIsPasswordSaving(false);
        }
    };


    return (
        <>
            <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 font-['Outfit'] pb-20">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-100">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                                {activeTab === 'overview' && 'System Overview'}
                                {activeTab === 'analytics' && 'Platform Analytics'}
                                {activeTab === 'users' && 'User Management'}
                                {activeTab === 'settings' && 'Platform Configuration'}
                                {activeTab === 'logs' && 'System Logs'}
                            </h1>
                        </div>
                        <p className="text-slate-400 font-medium">
                            {activeTab === 'overview' && 'Real-time platform metrics.'}
                            {activeTab === 'analytics' && 'Financial and usage insights.'}
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

                                {/* Support Metrics Section */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-xl font-black text-slate-800 tracking-tight">Support Metrics</h2>
                                        <Link to="/support" className="text-xs font-bold text-orange-600 hover:underline flex items-center gap-1">
                                            View All Tickets <ChevronRight size={14} />
                                        </Link>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                                        <div className="bg-white p-6 rounded-[2rem] border border-slate-200/60 shadow-sm flex items-center justify-between group hover:shadow-lg transition-all">
                                            <div className="min-w-0">
                                                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1 truncate">Awaiting Response</p>
                                                <p className="text-3xl font-extrabold text-blue-600 truncate">{stats.ticketStats?.open || 0}</p>
                                            </div>
                                            <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl group-hover:rotate-12 transition-transform shrink-0 ml-4">
                                                <Clock size={24} />
                                            </div>
                                        </div>
                                        <div className="bg-white p-6 rounded-[2rem] border border-slate-200/60 shadow-sm flex items-center justify-between group hover:shadow-lg transition-all">
                                            <div className="min-w-0">
                                                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1 truncate">Under Review</p>
                                                <p className="text-3xl font-extrabold text-orange-600 truncate">{stats.ticketStats?.inProgress || 0}</p>
                                            </div>
                                            <div className="p-4 bg-orange-50 text-orange-600 rounded-2xl group-hover:rotate-12 transition-transform shrink-0 ml-4">
                                                <AlertCircle size={24} />
                                            </div>
                                        </div>
                                        <div className="bg-white p-6 rounded-[2rem] border border-slate-200/60 shadow-sm flex items-center justify-between group hover:shadow-lg transition-all">
                                            <div className="min-w-0">
                                                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1 truncate">Resolved Today</p>
                                                <p className="text-3xl font-extrabold text-green-600 truncate">{stats.ticketStats?.resolved || 0}</p>
                                            </div>
                                            <div className="p-4 bg-green-50 text-green-600 rounded-2xl group-hover:rotate-12 transition-transform shrink-0 ml-4">
                                                <CheckCircle2 size={24} />
                                            </div>
                                        </div>
                                        <div className="bg-white p-6 rounded-[2rem] border border-slate-200/60 shadow-sm flex items-center justify-between group hover:shadow-lg transition-all">
                                            <div className="min-w-0">
                                                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1 truncate">Archived/Closed</p>
                                                <p className="text-3xl font-extrabold text-slate-500 truncate">{stats.ticketStats?.closed || 0}</p>
                                            </div>
                                            <div className="p-4 bg-slate-50 text-slate-500 rounded-2xl group-hover:rotate-12 transition-transform shrink-0 ml-4">
                                                <Archive size={24} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Charts Section */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm h-80 flex flex-col items-center justify-center text-slate-400">
                                        <Activity size={48} className="mb-4 opacity-20" />
                                        <p className="font-bold text-center px-6">System usage metrics across all accounts will be visualized here.</p>
                                    </div>
                                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm h-80 flex flex-col items-center justify-center text-slate-400">
                                        <Database size={48} className="mb-4 opacity-20" />
                                        <p className="font-bold text-center px-6">Database health and infrastructure load metrics.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Analytics Tab */}
                        {activeTab === 'analytics' && (
                            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {analyticsLoading ? (
                                    <div className="flex flex-col items-center justify-center h-64 gap-4">
                                        <RefreshCw className="animate-spin text-orange-600" size={48} />
                                        <p className="text-slate-400 font-bold">Aggregating system data...</p>
                                    </div>
                                ) : !analytics ? (
                                    <div className="flex flex-col items-center justify-center h-64 gap-4 text-slate-400">
                                        <Activity size={64} className="opacity-10" />
                                        <p className="font-bold">No analytics data available.</p>
                                    </div>
                                ) : (
                                    <>
                                        {/* Top Cards */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                                            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm flex flex-col justify-between group hover:shadow-xl transition-all duration-500">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:scale-110 transition-transform">
                                                        <DollarSign size={24} />
                                                    </div>
                                                    <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">Gross Revenue</span>
                                                </div>
                                                <div>
                                                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Total Earnings</p>
                                                    <p className="text-3xl font-black text-slate-900">${analytics.totalRevenue?.toLocaleString()}</p>
                                                </div>
                                            </div>
                                            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm flex flex-col justify-between group hover:shadow-xl transition-all duration-500">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl group-hover:scale-110 transition-transform">
                                                        <ZapIcon size={24} />
                                                    </div>
                                                    <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">Paid Obligation</span>
                                                </div>
                                                <div>
                                                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Paid Credits in Circulation</p>
                                                    <p className="text-3xl font-black text-slate-900">{analytics.totalPaidCreditsCirculating?.toLocaleString()}</p>
                                                </div>
                                            </div>
                                            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm flex flex-col justify-between group hover:shadow-xl transition-all duration-500">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="p-3 bg-slate-50 text-slate-600 rounded-2xl group-hover:scale-110 transition-transform">
                                                        <ZapIcon size={24} />
                                                    </div>
                                                    <span className="text-xs font-black text-slate-600 bg-slate-50 px-2 py-1 rounded-lg">Free Obligation</span>
                                                </div>
                                                <div>
                                                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Free Credits in Circulation</p>
                                                    <p className="text-3xl font-black text-slate-900">{analytics.totalFreeCreditsCirculating?.toLocaleString()}</p>
                                                </div>
                                            </div>
                                            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm flex flex-col justify-between group hover:shadow-xl transition-all duration-500">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="p-3 bg-orange-50 text-orange-600 rounded-2xl group-hover:scale-110 transition-transform">
                                                        <TrendingUp size={24} />
                                                    </div>
                                                    <span className="text-xs font-black text-orange-600 bg-orange-50 px-2 py-1 rounded-lg">Daily Pulse</span>
                                                </div>
                                                <div>
                                                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Today's Consumption</p>
                                                    <p className="text-3xl font-black text-slate-900">{(analytics.chartData?.[analytics.chartData.length - 1]?.consumption || 0).toLocaleString()} <span className="text-sm font-bold text-slate-400">pts</span></p>
                                                </div>
                                            </div>
                                            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm flex flex-col justify-between group hover:shadow-xl transition-all duration-500">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl group-hover:scale-110 transition-transform">
                                                        <Users size={24} />
                                                    </div>
                                                    <span className="text-xs font-black text-purple-600 bg-purple-50 px-2 py-1 rounded-lg">Scale</span>
                                                </div>
                                                <div>
                                                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Total Users</p>
                                                    <p className="text-3xl font-black text-slate-900">{analytics.totalUsers?.toLocaleString()}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Main Charts */}
                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                            <div className="lg:col-span-2 bg-white p-10 rounded-[3rem] border border-slate-200/60 shadow-sm">
                                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
                                                    <div>
                                                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Financial & Usage Growth</h2>
                                                        <p className="text-sm font-bold text-slate-400 mt-1">Cross-analyzing revenue vs credit consumption (Last 30 Days)</p>
                                                    </div>
                                                    <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-2xl border border-slate-200/50">
                                                        <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-xl shadow-sm border border-slate-100">
                                                            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
                                                            <span className="text-[10px] font-black text-slate-600 uppercase">Revenue</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-xl shadow-sm border border-slate-100">
                                                            <div className="w-2.5 h-2.5 bg-orange-500 rounded-full" />
                                                            <span className="text-[10px] font-black text-slate-600 uppercase">Usage</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="h-80 w-full">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <AreaChart data={analytics.chartData}>
                                                            <defs>
                                                                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.1} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} /></linearGradient>
                                                                <linearGradient id="usageGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f97316" stopOpacity={0.1} /><stop offset="95%" stopColor="#f97316" stopOpacity={0} /></linearGradient>
                                                            </defs>
                                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                            <XAxis dataKey="displayDate" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#94a3b8' }} />
                                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#94a3b8' }} />
                                                            <Tooltip contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)', padding: '20px' }} />
                                                            <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#revenueGrad)" />
                                                            <Area type="monotone" dataKey="consumption" stroke="#f97316" strokeWidth={4} fillOpacity={1} fill="url(#usageGrad)" />
                                                        </AreaChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            </div>

                                            <div className="bg-white p-10 rounded-[3rem] border border-slate-200/60 shadow-sm">
                                                <h2 className="text-xl font-black text-slate-900 tracking-tight mb-2">Plan Distribution</h2>
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-10">User Subscription Tiers</p>
                                                <div className="h-64 w-full relative">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <PieChart>
                                                            <Pie
                                                                data={analytics.planDistribution}
                                                                cx="50%"
                                                                cy="50%"
                                                                innerRadius={60}
                                                                outerRadius={90}
                                                                paddingAngle={10}
                                                                dataKey="value"
                                                            >
                                                                {analytics.planDistribution.map((entry: any, index: number) => (
                                                                    <Cell key={`cell-${index}`} fill={['#f97316', '#3b82f6', '#10b981', '#6366f1'][index % 4]} strokeWidth={0} />
                                                                ))}
                                                            </Pie>
                                                            <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
                                                        </PieChart>
                                                    </ResponsiveContainer>
                                                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                                        <p className="text-3xl font-black text-slate-900">{analytics.totalUsers}</p>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Users</p>
                                                    </div>
                                                </div>
                                                <div className="mt-8 space-y-3">
                                                    {analytics.planDistribution.map((item: any, i: number) => (
                                                        <div key={item.name} className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ['#f97316', '#3b82f6', '#10b981', '#6366f1'][i % 4] }} />
                                                                <span className="text-sm font-bold text-slate-600">{item.name}</span>
                                                            </div>
                                                            <span className="text-sm font-black text-slate-900">{item.value}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Bottom Grid: Top Consumers & Live Activity */}
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                            {/* Top Consumers */}
                                            <div className="bg-white rounded-[3rem] border border-slate-200/60 shadow-sm overflow-hidden h-fit">
                                                <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
                                                    <h2 className="text-xl font-black text-slate-900 tracking-tight">Top Consumers</h2>
                                                    <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                                                        <BarChart2 size={20} />
                                                    </div>
                                                </div>
                                                <div className="p-4">
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full text-sm">
                                                            <thead>
                                                                <tr className="text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-50">
                                                                    <th className="px-4 py-4 text-left">User</th>
                                                                    <th className="px-4 py-4 text-left">Plan</th>
                                                                    <th className="px-4 py-4 text-right">Lifetime Spends</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-slate-50">
                                                                {analytics.topConsumers?.map((u: any, i: number) => (
                                                                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                                                        <td className="px-4 py-4">
                                                                            <div className="flex items-center gap-3">
                                                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500 uppercase">
                                                                                    {u.name?.substring(0, 2) || '??'}
                                                                                </div>
                                                                                <div className="min-w-0">
                                                                                    <p className="font-bold text-slate-900 truncate">{u.name}</p>
                                                                                    <p className="text-[10px] text-slate-400 truncate">{u.email}</p>
                                                                                </div>
                                                                            </div>
                                                                        </td>
                                                                        <td className="px-4 py-4">
                                                                            <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase shadow-sm ${u.plan === 'Pro' ? 'bg-indigo-50 text-indigo-600' :
                                                                                u.plan === 'Enterprise' ? 'bg-purple-50 text-purple-600' : 'bg-slate-100 text-slate-500'
                                                                                }`}>
                                                                                {u.plan}
                                                                            </span>
                                                                        </td>
                                                                        <td className="px-4 py-4 text-right">
                                                                            <div className="flex flex-col items-end">
                                                                                <span className="font-black text-slate-900">{u.totalSpent?.toLocaleString()} <span className="text-slate-400 text-[10px]">pts</span></span>
                                                                                <div className="w-24 h-1 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                                                                                    <div className="h-full bg-orange-500" style={{ width: `${(u.totalSpent / (analytics.topConsumers[0]?.totalSpent || 1)) * 100}%` }} />
                                                                                </div>
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Live Activity Feed */}
                                            <div className="bg-white rounded-[3rem] border border-slate-200/60 shadow-sm overflow-hidden">
                                                <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
                                                    <h2 className="text-xl font-black text-slate-900 tracking-tight">System Activity Pulse</h2>
                                                    <span className="flex h-2 w-2 relative">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                                                    </span>
                                                </div>
                                                <div className="p-4 max-h-[600px] overflow-y-auto custom-scrollbar">
                                                    <div className="space-y-4">
                                                        {analytics.recentActivity?.map((act: any, i: number) => (
                                                            <div key={i} className="group p-4 bg-white hover:bg-slate-50 rounded-2xl border border-slate-100/50 transition-all flex items-start gap-4">
                                                                <div className={`p-3 rounded-xl shrink-0 ${act.type === 'post' ? 'bg-blue-50 text-blue-600' :
                                                                    act.type === 'comment' ? 'bg-orange-50 text-orange-600' : 'bg-purple-50 text-purple-600'
                                                                    }`}>
                                                                    {act.type === 'post' ? <FileText size={18} /> :
                                                                        act.type === 'comment' ? <MessageSquare size={18} /> : <Image size={18} />}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center justify-between mb-0.5">
                                                                        <p className="text-sm font-black text-slate-900 truncate">{act.userName}</p>
                                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter whitespace-nowrap ml-2">
                                                                            {new Date(act.date).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                                        </span>
                                                                    </div>
                                                                    <p className="text-[11px] font-bold text-slate-500">
                                                                        Generated a <span className="text-slate-900">{act.type}</span> costing <span className="text-orange-600">-{act.cost} credits</span>
                                                                    </p>
                                                                </div>
                                                                <ChevronRight size={14} className="text-slate-200 group-hover:text-slate-400 self-center" />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {/* Users Tab */}
                        {activeTab === 'users' && (
                            <div className="bg-white rounded-[2.5rem] border border-slate-200/60 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                                    <div className="flex items-center gap-4 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200/50 w-full max-w-md focus-within:ring-2 focus-within:ring-orange-100 transition-all">
                                        <Search size={18} className="text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="Search users by name, email..."
                                            className="bg-transparent border-none outline-none text-sm font-medium w-full placeholder:text-slate-400 text-slate-700"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        {/* Status Filter */}
                                        <div className="relative">
                                            <select
                                                value={filterStatus}
                                                onChange={(e) => setFilterStatus(e.target.value)}
                                                className="appearance-none bg-slate-50 border-none text-slate-600 text-sm font-bold rounded-xl focus:ring-2 focus:ring-orange-100 outline-none pl-3 pr-8 py-2 cursor-pointer hover:bg-slate-100 transition-colors"
                                            >
                                                <option value="all">All Status</option>
                                                <option value="Active">Active</option>
                                                <option value="Suspended">Suspended</option>
                                                <option value="Banned">Banned</option>
                                            </select>
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                                                <Filter size={14} />
                                            </div>
                                        </div>

                                        {/* Plan Filter */}
                                        <div className="relative">
                                            <select
                                                value={filterPlan}
                                                onChange={(e) => setFilterPlan(e.target.value)}
                                                className="appearance-none bg-slate-50 border-none text-slate-600 text-sm font-bold rounded-xl focus:ring-2 focus:ring-orange-100 outline-none pl-3 pr-8 py-2 cursor-pointer hover:bg-slate-100 transition-colors"
                                            >
                                                <option value="all">All Plans</option>
                                                {plans.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                                            </select>
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                                                <Filter size={14} />
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => setFilterRole(curr => curr === 'all' ? 'admin' : curr === 'admin' ? 'user' : 'all')}
                                            className={`p-2 rounded-xl transition-colors ${filterRole !== 'all' ? 'text-blue-600 bg-blue-50' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'}`}
                                            title={`Filter Role: ${filterRole.charAt(0).toUpperCase() + filterRole.slice(1)}`}
                                        >
                                            <Users size={20} />
                                        </button>
                                        <button
                                            onClick={fetchData}
                                            className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors"
                                            title="Refresh Data"
                                        >
                                            <RefreshCw size={20} />
                                        </button>
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
                                            {filteredUsers.map((user) => (
                                                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                                                    <td className="px-8 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs border border-slate-200 flex-shrink-0">
                                                                {user.avatar ? (
                                                                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <span>{getInitials(user.name)}</span>
                                                                )}
                                                            </div>
                                                            <div>
                                                                <p className="text-slate-900 font-bold">{user.name}</p>
                                                                <p className="text-slate-400 text-xs">{user.email}</p>
                                                            </div>
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
                                                            <button
                                                                onClick={() => openUserDetail(user)}
                                                                className="p-2 bg-white border border-slate-200 rounded-lg hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm"
                                                                title="View Details"
                                                            >
                                                                <Eye size={14} />
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedUser(user);
                                                                    setEditForm({
                                                                        name: user.name,
                                                                        email: user.email || '',
                                                                        role: user.role,
                                                                        plan: user.plan,
                                                                        status: user.status,
                                                                        statusMessage: user.statusMessage || '',
                                                                        credits: user.credits || 0,
                                                                        password: '',
                                                                        extraCreditsToAdd: 0,
                                                                        showAddExtra: false,
                                                                        customDailyLimit: user.customDailyLimit || 0
                                                                    });
                                                                    setIsEditModalOpen(true);
                                                                }}
                                                                className="p-2 bg-white border border-slate-200 rounded-lg hover:text-orange-600 hover:border-orange-200 transition-all shadow-sm"
                                                            >
                                                                <Edit2 size={14} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteUser(user.id)}
                                                                className="p-2 bg-white border border-slate-200 rounded-lg hover:text-red-600 hover:border-red-200 transition-all shadow-sm"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
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
                                <div className="flex p-1 bg-slate-100/80 backdrop-blur-sm rounded-2xl w-full md:w-fit border border-slate-200/60 overflow-x-auto no-scrollbar">
                                    <button
                                        onClick={() => setSettingsTab('ai')}
                                        className={`flex-shrink-0 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 ${settingsTab === 'ai' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        <Cpu size={18} />
                                        AI Models
                                    </button>
                                    <button
                                        onClick={() => setSettingsTab('payments')}
                                        className={`flex-shrink-0 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 ${settingsTab === 'payments' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        <CreditCard size={18} />
                                        Payments
                                    </button>
                                    <button
                                        onClick={() => setSettingsTab('reddit')}
                                        className={`flex-shrink-0 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 ${settingsTab === 'reddit' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        <Globe size={18} />
                                        Reddit API
                                    </button>
                                    <button
                                        onClick={() => setSettingsTab('plans')}
                                        className={`flex-shrink-0 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 ${settingsTab === 'plans' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        <Zap size={18} />
                                        Plans
                                    </button>
                                    <button
                                        onClick={() => setSettingsTab('smtp')}
                                        className={`flex-shrink-0 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 ${settingsTab === 'smtp' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        <Mail size={18} />
                                        SMTP
                                    </button>
                                    <button
                                        onClick={() => setSettingsTab('security')}
                                        className={`flex-shrink-0 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 ${settingsTab === 'security' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        <Shield size={18} />
                                        Security
                                    </button>
                                    <button
                                        onClick={() => setSettingsTab('email')}
                                        className={`flex-shrink-0 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 ${settingsTab === 'email' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        <Bell size={18} />
                                        Email Automation
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
                                                                    placeholder="e.g. anthropic/claude-3-sonnet"
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
                                                                        </>
                                                                    )}
                                                                    {aiSettings.provider === 'openai' && (
                                                                        <>
                                                                            <option value="gpt-4o">GPT-4o</option>
                                                                            <option value="gpt-4o-mini">GPT-4o Mini</option>
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

                                                    <div className="pt-4 border-t border-slate-100">
                                                        <h3 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-2">
                                                            <CreditCard size={16} className="text-indigo-600" />
                                                            Dynamic Credit Costs
                                                        </h3>
                                                        <div className="grid grid-cols-3 gap-4">
                                                            <label className="block">
                                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Comment</span>
                                                                <input
                                                                    type="number"
                                                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 font-bold text-sm"
                                                                    value={aiSettings.creditCosts?.comment ?? 1}
                                                                    onChange={(e) => {
                                                                        const val = parseInt(e.target.value) || 0;
                                                                        setAiSettings({
                                                                            ...aiSettings,
                                                                            creditCosts: {
                                                                                post: 2, image: 5,
                                                                                ...aiSettings.creditCosts,
                                                                                comment: val
                                                                            }
                                                                        });
                                                                    }}
                                                                />
                                                            </label>
                                                            <label className="block">
                                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Post</span>
                                                                <input
                                                                    type="number"
                                                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 font-bold text-sm"
                                                                    value={aiSettings.creditCosts?.post ?? 2}
                                                                    onChange={(e) => {
                                                                        const val = parseInt(e.target.value) || 0;
                                                                        setAiSettings({
                                                                            ...aiSettings,
                                                                            creditCosts: {
                                                                                comment: 1, image: 5,
                                                                                ...aiSettings.creditCosts,
                                                                                post: val
                                                                            }
                                                                        });
                                                                    }}
                                                                />
                                                            </label>
                                                            <label className="block">
                                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Image</span>
                                                                <input
                                                                    type="number"
                                                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 font-bold text-sm"
                                                                    value={aiSettings.creditCosts?.image ?? 5}
                                                                    onChange={(e) => {
                                                                        const val = parseInt(e.target.value) || 0;
                                                                        setAiSettings({
                                                                            ...aiSettings,
                                                                            creditCosts: {
                                                                                comment: 1, post: 2,
                                                                                ...aiSettings.creditCosts,
                                                                                image: val
                                                                            }
                                                                        });
                                                                    }}
                                                                />
                                                            </label>
                                                        </div>
                                                    </div>
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
                                    )
                                    }

                                    {
                                        settingsTab === 'payments' && (
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
                                        )
                                    }

                                    {
                                        settingsTab === 'reddit' && (
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
                                                                    value={`${window.location.origin}/auth/reddit/callback`}
                                                                    readOnly
                                                                />
                                                                <button
                                                                    onClick={() => navigator.clipboard.writeText(`${window.location.origin}/auth/reddit/callback`)}
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

                                                        {/* Safety & Anti-Spam Section */}
                                                        <div className="pt-6 mt-6 border-t border-slate-100 space-y-4">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <Shield size={18} className="text-orange-600" />
                                                                <h3 className="text-sm font-bold text-slate-900">Safety & Anti-Spam</h3>
                                                            </div>

                                                            <div className="grid grid-cols-2 gap-4">
                                                                <label className="block">
                                                                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">Min Delay (sec)</span>
                                                                    <input
                                                                        type="number"
                                                                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-orange-50 focus:border-orange-500 focus:outline-none transition-all font-mono text-sm"
                                                                        value={redditSettings.minDelay || 5}
                                                                        onChange={(e) => setRedditSettings({ ...redditSettings, minDelay: parseInt(e.target.value) })}
                                                                    />
                                                                </label>
                                                                <label className="block">
                                                                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">Max Delay (sec)</span>
                                                                    <input
                                                                        type="number"
                                                                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-orange-50 focus:border-orange-500 focus:outline-none transition-all font-mono text-sm"
                                                                        value={redditSettings.maxDelay || 15}
                                                                        onChange={(e) => setRedditSettings({ ...redditSettings, maxDelay: parseInt(e.target.value) })}
                                                                    />
                                                                </label>
                                                            </div>

                                                            <div className="flex items-center justify-between p-4 bg-orange-50/50 rounded-2xl border border-orange-100">
                                                                <div>
                                                                    <p className="text-xs font-bold text-slate-900">Anti-Spam Guard</p>
                                                                    <p className="text-[10px] text-slate-500">Prevent double-replying to the same post</p>
                                                                </div>
                                                                <button
                                                                    onClick={() => setRedditSettings({ ...redditSettings, antiSpam: !redditSettings.antiSpam })}
                                                                    className={`w-12 h-6 rounded-full p-1 transition-colors ${redditSettings.antiSpam ? 'bg-orange-600' : 'bg-slate-300'}`}
                                                                >
                                                                    <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${redditSettings.antiSpam ? 'translate-x-6' : 'translate-x-0'}`} />
                                                                </button>
                                                            </div>
                                                        </div>
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
                                        )
                                    }

                                    {settingsTab === 'plans' && (
                                        <div>
                                            <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-slate-200">
                                                        <Zap size={24} />
                                                    </div>
                                                    <div>
                                                        <h2 className="text-xl font-bold text-slate-900">Subscription Plans</h2>
                                                        <p className="text-slate-400 text-sm">Create and manage pricing tiers.</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        setPlanForm({
                                                            id: '',
                                                            name: '',
                                                            monthlyPrice: 0,
                                                            yearlyPrice: 0,
                                                            credits: 0,
                                                            features: [''],
                                                            isPopular: false,
                                                            highlightText: '',
                                                            isCustom: true,
                                                            purchaseEnabled: true,
                                                            isVisible: true
                                                        });
                                                        setIsPlanModalOpen(true);
                                                    }}
                                                    className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold shadow-lg hover:bg-slate-800 transition-all flex items-center gap-2 text-sm"
                                                >
                                                    Create Plan
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {plans.map(plan => (
                                                    <div key={plan.id} className="bg-slate-50 border border-slate-200 p-6 rounded-[2rem] relative group hover:shadow-xl hover:border-slate-300 transition-all">
                                                        <div className="flex justify-between items-start mb-4">
                                                            <div>
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
                                                                    {plan.isPopular && (
                                                                        <span className="bg-orange-100 text-orange-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">Popular</span>
                                                                    )}
                                                                </div>
                                                                <div className="text-slate-500 font-mono text-xs uppercase tracking-wider">{plan.id}</div>
                                                            </div>
                                                            <div className="flex bg-white rounded-xl border border-slate-100 shadow-sm p-1">
                                                                <button
                                                                    onClick={() => {
                                                                        setPlanForm(plan);
                                                                        setIsPlanModalOpen(true);
                                                                    }}
                                                                    className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors"
                                                                >
                                                                    <Edit2 size={16} />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeletePlan(plan.id)}
                                                                    className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-red-600 transition-colors"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-4 mb-6">
                                                            <div className="bg-white p-3 rounded-xl border border-slate-100">
                                                                <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Monthly</div>
                                                                <div className="text-xl font-black text-slate-900">${plan.monthlyPrice}</div>
                                                            </div>
                                                            <div className="bg-white p-3 rounded-xl border border-slate-100">
                                                                <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Credits</div>
                                                                <div className="text-xl font-black text-slate-900">{plan.credits}</div>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-2">
                                                            <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Features</div>
                                                            {plan.features.slice(0, 3).map((f, i) => (
                                                                <div key={i} className="flex items-center gap-2 text-sm text-slate-600">
                                                                    <CheckCircle2 size={14} className="text-green-500" />
                                                                    <span className="truncate">{f}</span>
                                                                </div>
                                                            ))}
                                                            {plan.features.length > 3 && (
                                                                <div className="text-xs text-slate-400 font-bold pl-6">
                                                                    +{plan.features.length - 3} more...
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {settingsTab === 'security' && (
                                        <div className="max-w-2xl">
                                            <div className="flex items-center gap-4 mb-8">
                                                <div className="w-12 h-12 bg-orange-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-200">
                                                    <Shield size={24} />
                                                </div>
                                                <div>
                                                    <h2 className="text-xl font-bold text-slate-900">Account Security</h2>
                                                    <p className="text-slate-400 text-sm">Update your administrative password.</p>
                                                </div>
                                            </div>

                                            <div className="space-y-6 bg-slate-50/50 p-8 rounded-[2.5rem] border border-slate-200/60 transition-all">
                                                <div className="space-y-4">
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-bold text-slate-700 ml-1">Current Password</label>
                                                        <input
                                                            type="password"
                                                            className="w-full p-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-orange-50 focus:border-orange-500 focus:outline-none transition-all placeholder:text-slate-300"
                                                            placeholder="••••••••"
                                                            value={passwordData.currentPassword}
                                                            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                                        />
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div className="space-y-2">
                                                            <label className="text-sm font-bold text-slate-700 ml-1">New Password</label>
                                                            <input
                                                                type="password"
                                                                className="w-full p-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-orange-50 focus:border-orange-500 focus:outline-none transition-all placeholder:text-slate-300"
                                                                placeholder="••••••••"
                                                                value={passwordData.newPassword}
                                                                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-sm font-bold text-slate-700 ml-1">Confirm New Password</label>
                                                            <input
                                                                type="password"
                                                                className="w-full p-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-orange-50 focus:border-orange-500 focus:outline-none transition-all placeholder:text-slate-300"
                                                                placeholder="••••••••"
                                                                value={passwordData.confirmPassword}
                                                                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                {passwordMessage && (
                                                    <div className={`p-4 rounded-2xl flex items-center gap-3 text-sm font-bold animate-in fade-in slide-in-from-top-2 duration-300 ${passwordMessage.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                                                        {passwordMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                                                        {passwordMessage.text}
                                                    </div>
                                                )}

                                                <button
                                                    onClick={handlePasswordChange}
                                                    disabled={isPasswordSaving || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                                                    className="w-full py-4 bg-slate-900 text-white rounded-[2rem] font-bold shadow-xl hover:bg-orange-600 hover:shadow-orange-200 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:active:scale-100"
                                                >
                                                    {isPasswordSaving ? <RefreshCw size={20} className="animate-spin" /> : <Save size={20} />}
                                                    Update Password
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {settingsTab === 'smtp' && (
                                        <div className="max-w-2xl">
                                            <div className="flex items-center gap-4 mb-8">
                                                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                                                    <Mail size={24} />
                                                </div>
                                                <div>
                                                    <h2 className="text-xl font-bold text-slate-900">SMTP Configuration</h2>
                                                    <p className="text-slate-400 text-sm">Configure email sending settings.</p>
                                                </div>
                                            </div>

                                            <div className="space-y-6 bg-slate-50/50 p-8 rounded-[2.5rem] border border-slate-200/60 transition-all">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <label className="block">
                                                        <span className="text-sm font-bold text-slate-700 mb-2 block">SMTP Host</span>
                                                        <input
                                                            type="text"
                                                            className="w-full p-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-50 focus:border-blue-500 focus:outline-none transition-all placeholder:text-slate-300"
                                                            value={smtpSettings.host}
                                                            onChange={(e) => setSmtpSettings({ ...smtpSettings, host: e.target.value })}
                                                            placeholder="smtp.example.com"
                                                        />
                                                    </label>
                                                    <label className="block">
                                                        <span className="text-sm font-bold text-slate-700 mb-2 block">Port</span>
                                                        <input
                                                            type="number"
                                                            className="w-full p-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-50 focus:border-blue-500 focus:outline-none transition-all"
                                                            value={smtpSettings.port}
                                                            onChange={(e) => setSmtpSettings({ ...smtpSettings, port: parseInt(e.target.value) })}
                                                            placeholder="587"
                                                        />
                                                    </label>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <label className="block">
                                                        <span className="text-sm font-bold text-slate-700 mb-2 block">Username</span>
                                                        <input
                                                            type="text"
                                                            className="w-full p-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-50 focus:border-blue-500 focus:outline-none transition-all placeholder:text-slate-300"
                                                            value={smtpSettings.user}
                                                            onChange={(e) => setSmtpSettings({ ...smtpSettings, user: e.target.value })}
                                                            placeholder="user@example.com"
                                                        />
                                                    </label>
                                                    <label className="block">
                                                        <span className="text-sm font-bold text-slate-700 mb-2 block">Password</span>
                                                        <input
                                                            type="password"
                                                            className="w-full p-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-50 focus:border-blue-500 focus:outline-none transition-all placeholder:text-slate-300"
                                                            value={smtpSettings.pass}
                                                            onChange={(e) => setSmtpSettings({ ...smtpSettings, pass: e.target.value })}
                                                            placeholder="••••••••"
                                                        />
                                                    </label>
                                                </div>

                                                <label className="block">
                                                    <span className="text-sm font-bold text-slate-700 mb-2 block">From Email</span>
                                                    <input
                                                        type="text"
                                                        className="w-full p-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-50 focus:border-blue-500 focus:outline-none transition-all placeholder:text-slate-300"
                                                        value={smtpSettings.from}
                                                        onChange={(e) => setSmtpSettings({ ...smtpSettings, from: e.target.value })}
                                                        placeholder="noreply@example.com"
                                                    />
                                                </label>

                                                <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm">
                                                    <div>
                                                        <h3 className="font-bold text-slate-900">Secure (SSL/TLS)</h3>
                                                        <p className="text-slate-500 text-xs">Enable for secure connections.</p>
                                                    </div>
                                                    <button
                                                        onClick={() => setSmtpSettings({ ...smtpSettings, secure: !smtpSettings.secure })}
                                                        className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 relative ${smtpSettings.secure ? 'bg-blue-600' : 'bg-slate-300'}`}
                                                    >
                                                        <div className={`w-6 h-6 bg-white rounded-full shadow-sm transition-transform duration-300 ${smtpSettings.secure ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                                    </button>
                                                </div>

                                                <button
                                                    onClick={handleSaveSMTPSettings}
                                                    className="w-full py-4 bg-slate-900 text-white rounded-[2rem] font-bold shadow-xl hover:bg-blue-600 hover:shadow-blue-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                                                >
                                                    <Save size={20} />
                                                    Save SMTP Config
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {settingsTab === 'email' && (
                                        <div className="space-y-8 animate-in fade-in duration-500">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-purple-200">
                                                        <Bell size={24} />
                                                    </div>
                                                    <div>
                                                        <h2 className="text-xl font-bold text-slate-900">Email Automation</h2>
                                                        <p className="text-slate-400 text-sm">Manage automated email notifications and templates.</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                                {/* Template List */}
                                                <div className="lg:col-span-1 space-y-4">
                                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2">Templates</h3>
                                                    {Object.keys(emailTemplates).length === 0 ? (
                                                        <div className="p-8 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-300 text-slate-400 italic">
                                                            No templates found.
                                                        </div>
                                                    ) : (
                                                        Object.entries(emailTemplates).map(([id, template]: [string, any]) => (
                                                            <button
                                                                key={id}
                                                                onClick={() => setEditingTemplate(id)}
                                                                className={`w-full p-4 rounded-2xl border transition-all text-left flex items-center justify-between group ${editingTemplate === id ? 'bg-purple-600 border-purple-600 text-white shadow-lg shadow-purple-200' : 'bg-white border-slate-200 text-slate-700 hover:border-purple-300 hover:shadow-md'}`}
                                                            >
                                                                <div className="min-w-0">
                                                                    <p className="font-bold truncate">{template.name || id}</p>
                                                                    <p className={`text-[10px] font-bold uppercase tracking-wider ${editingTemplate === id ? 'text-purple-200' : 'text-slate-400'}`}>
                                                                        {template.active ? '● Active' : '○ Inactive'}
                                                                    </p>
                                                                </div>
                                                                <ChevronRight size={18} className={`transition-transform ${editingTemplate === id ? 'translate-x-1' : 'text-slate-300 group-hover:translate-x-1'}`} />
                                                            </button>
                                                        ))
                                                    )}
                                                </div>

                                                {/* Editor */}
                                                <div className="lg:col-span-2">
                                                    {editingTemplate ? (
                                                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm space-y-6 animate-in slide-in-from-right-4 duration-300">
                                                            <div className="flex items-center justify-between">
                                                                <h3 className="text-lg font-bold text-slate-900">Edit {emailTemplates[editingTemplate].name}</h3>
                                                                <div className="flex items-center gap-4">
                                                                    <button
                                                                        onClick={() => handleSaveEmailTemplates({
                                                                            ...emailTemplates,
                                                                            [editingTemplate]: { ...emailTemplates[editingTemplate], active: !emailTemplates[editingTemplate].active }
                                                                        })}
                                                                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${emailTemplates[editingTemplate].active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}
                                                                    >
                                                                        {emailTemplates[editingTemplate].active ? 'Active' : 'Inactive'}
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleTestEmail(editingTemplate)}
                                                                        disabled={testEmailLoading === editingTemplate}
                                                                        className="p-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all flex items-center gap-2 text-xs font-bold"
                                                                    >
                                                                        {testEmailLoading === editingTemplate ? <RefreshCw size={14} className="animate-spin" /> : <Mail size={14} />}
                                                                        Test
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            <div className="space-y-4">
                                                                <label className="block">
                                                                    <span className="text-sm font-bold text-slate-700 mb-2 block">Subject</span>
                                                                    <input
                                                                        type="text"
                                                                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-purple-50 focus:border-purple-500 focus:outline-none transition-all"
                                                                        value={emailTemplates[editingTemplate].subject}
                                                                        onChange={(e) => setEmailTemplates({
                                                                            ...emailTemplates,
                                                                            [editingTemplate]: { ...emailTemplates[editingTemplate], subject: e.target.value }
                                                                        })}
                                                                    />
                                                                </label>
                                                                <label className="block">
                                                                    <span className="text-sm font-bold text-slate-700 mb-2 block flex items-center justify-between">
                                                                        HTML Content
                                                                        <span className="flex items-center gap-1 text-[10px] text-slate-400">
                                                                            <Code size={12} />
                                                                            HTML Supported
                                                                        </span>
                                                                    </span>
                                                                    <textarea
                                                                        className="w-full h-80 p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-purple-50 focus:border-purple-500 focus:outline-none transition-all font-mono text-xs leading-relaxed"
                                                                        value={emailTemplates[editingTemplate].body}
                                                                        onChange={(e) => setEmailTemplates({
                                                                            ...emailTemplates,
                                                                            [editingTemplate]: { ...emailTemplates[editingTemplate], body: e.target.value }
                                                                        })}
                                                                    />
                                                                </label>
                                                            </div>

                                                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 italic">
                                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2 flex items-center gap-1">
                                                                    <Code size={12} /> Available Variables
                                                                </p>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {['name', 'plan_name', 'credits_added', 'final_balance', 'balance', 'ticket_id', 'subject', 'reply_message', 'reset_link'].map(v => (
                                                                        <span key={v} className="bg-white px-2 py-1 rounded-lg border border-slate-200 text-slate-500 text-[10px] font-mono">
                                                                            {`{{${v}}}`}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </div>

                                                            <button
                                                                onClick={() => handleSaveEmailTemplates()}
                                                                disabled={isEmailSaving}
                                                                className="w-full py-4 bg-slate-900 text-white rounded-[2rem] font-bold shadow-xl hover:bg-purple-600 hover:shadow-purple-200 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                                                            >
                                                                {isEmailSaving ? <RefreshCw size={20} className="animate-spin" /> : <Save size={20} />}
                                                                Save Template
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="h-full flex flex-col items-center justify-center p-12 bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-300 text-center space-y-4">
                                                            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-300 shadow-sm border border-slate-200">
                                                                <Bell size={32} />
                                                            </div>
                                                            <div>
                                                                <h3 className="text-lg font-bold text-slate-900">Select a Template</h3>
                                                                <p className="text-slate-400 text-sm">Choose a template from the list to preview or edit its content.</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Logs Tab */}
                        {activeTab === 'logs' && (
                            <div className="bg-slate-900 text-slate-300 p-8 rounded-[2.5rem] font-mono text-xs md:text-sm leading-relaxed shadow-2xl h-[600px] overflow-y-auto custom-scrollbar flex flex-col-reverse">

                                <div>
                                    {systemLogs.length === 0 ? (
                                        <div className="text-center text-slate-500 py-10 italic">No system logs available yet...</div>
                                    ) : (
                                        systemLogs.map((log) => {
                                            let colorClass = 'text-slate-300';
                                            if (log.level === 'WARN') colorClass = 'text-orange-400';
                                            if (log.level === 'ERROR') colorClass = 'text-red-400 font-bold';
                                            if (log.level === 'SUCCESS') colorClass = 'text-emerald-400 font-bold';

                                            return (
                                                <div key={log.id} className="mb-1 hover:bg-slate-800/50 p-1 rounded -mx-1 px-2 transition-colors break-words">
                                                    <span className="text-slate-500 mr-2">[{new Date(log.timestamp).toLocaleString()}]</span>
                                                    <span className={`uppercase w-16 inline-block font-bold text-[10px] tracking-wider ${colorClass}`}>{log.level}</span>
                                                    <span className={colorClass}>{log.message}</span>
                                                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                                                        <span className="text-slate-600 ml-2 text-xs">
                                                            {JSON.stringify(log.metadata)}
                                                        </span>
                                                    )}
                                                </div>
                                            );
                                        })
                                    )}
                                    <div className="flex items-center gap-2 text-green-400 mb-6 pb-4 border-b border-slate-800/50">
                                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                        <span className="text-xs font-bold uppercase tracking-widest">Live System Logs</span>
                                        <span className="ml-auto text-xs text-slate-600">Auto-refreshing (3s)</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Delete Confirmation Modal */}
                        {isDeleteModalOpen && (
                            <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
                                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsDeleteModalOpen(false)} />
                                <div className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
                                    <div className="flex flex-col items-center text-center space-y-4">
                                        <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-2">
                                            <AlertTriangle size={32} />
                                        </div>
                                        <h3 className="text-xl font-black text-slate-900">Delete User?</h3>
                                        <p className="text-slate-500 font-medium">
                                            Are you sure you want to delete this user? This action cannot be undone and will remove all associated data.
                                        </p>
                                        <div className="flex gap-3 w-full pt-4">
                                            <button
                                                onClick={() => setIsDeleteModalOpen(false)}
                                                className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={executeDeleteUser}
                                                disabled={isDeleting}
                                                className="flex-1 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                            >
                                                {isDeleting ? <RefreshCw size={18} className="animate-spin" /> : <Trash2 size={18} />}
                                                {isDeleting ? 'Deleting...' : 'Delete User'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* User Detail Modal */}
                        {isDetailModalOpen && detailUser && (
                            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsDetailModalOpen(false)} />
                                <div className="relative bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 w-full max-w-2xl flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
                                    {/* Header */}
                                    <div className="p-6 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-2xl overflow-hidden bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-orange-500/20 flex-shrink-0 border-4 border-white">
                                                {detailUser.avatar ? (
                                                    <img src={detailUser.avatar} alt={detailUser.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span>{getInitials(detailUser.name)}</span>
                                                )}
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-black text-slate-900">{detailUser.name}</h2>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <p className="text-sm text-slate-400">{detailUser.email}</p>
                                                    {detailLastUpdated && (
                                                        <span className="text-[10px] text-slate-300 font-mono">
                                                            · updated {detailLastUpdated.toLocaleTimeString()}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => fetchDetailUser(detailUser.id, true)}
                                                className={`p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-700 ${detailRefreshing ? 'animate-spin text-orange-500' : ''}`}
                                                title="Refresh now"
                                            >
                                                <RefreshCw size={16} />
                                            </button>
                                            <button onClick={() => { setIsDetailModalOpen(false); setDetailUser(null); }} className="p-2 hover:bg-slate-100 rounded-xl transition-colors"><X size={20} /></button>
                                        </div>
                                    </div>

                                    <div className="overflow-y-auto custom-scrollbar p-6 space-y-6">
                                        {detailLoading ? (
                                            <div className="flex items-center justify-center py-16 text-slate-400">
                                                <RefreshCw size={28} className="animate-spin" />
                                            </div>
                                        ) : (<>
                                            {/* Overview Stats */}
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                {[
                                                    { label: 'Balance', value: `${detailUser.credits ?? 0} pts`, color: 'text-orange-600', bg: 'bg-orange-50', icon: <Zap size={14} className="text-orange-500" /> },
                                                    { label: 'Plan', value: detailUser.plan || '—', color: 'text-blue-600', bg: 'bg-blue-50', icon: <CreditCard size={14} className="text-blue-500" /> },
                                                    { label: 'Total Spent', value: `${detailUser.usageStats?.totalSpent ?? 0} pts`, color: 'text-rose-600', bg: 'bg-rose-50', icon: <BarChart2 size={14} className="text-rose-500" /> },
                                                    { label: 'Avg / Day', value: `${detailUser.avgPerDay ?? 0} pts`, color: 'text-violet-600', bg: 'bg-violet-50', icon: <Activity size={14} className="text-violet-500" /> },
                                                    {
                                                        label: 'Daily Limit',
                                                        value: `${(Number(detailUser.customDailyLimit) > 0)
                                                            ? detailUser.customDailyLimit
                                                            : (() => {
                                                                const plan = plans.find(p => (p.name || '').toLowerCase() === (detailUser.plan || '').toLowerCase() || (p.id || '').toLowerCase() === (detailUser.plan || '').toLowerCase());
                                                                return (detailUser.billingCycle === 'yearly' ? plan?.dailyLimitYearly : plan?.dailyLimitMonthly) || 0;
                                                            })()} pts`,
                                                        color: 'text-emerald-600',
                                                        bg: 'bg-emerald-50',
                                                        icon: <Zap size={14} className="text-emerald-500" />
                                                    },
                                                ].map(s => (
                                                    <div key={s.label} className={`${s.bg} rounded-2xl p-4 flex flex-col gap-1`}>
                                                        <div className="flex items-center gap-1.5">{s.icon}<span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{s.label}</span></div>
                                                        <span className={`text-lg font-black ${s.color}`}>{s.value}</span>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Usage Breakdown */}
                                            <div className="space-y-3">
                                                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Usage Breakdown</h3>
                                                {(() => {
                                                    const s = detailUser.usageStats || {};
                                                    const total = (s.postsCredits || 0) + (s.commentsCredits || 0) + (s.imagesCredits || 0) || 1;
                                                    return [
                                                        { label: 'Posts', count: s.posts || 0, spent: s.postsCredits || 0, pct: Math.round(((s.postsCredits || 0) / total) * 100), color: 'bg-blue-500', light: 'bg-blue-50', text: 'text-blue-600', icon: <FileText size={14} className="text-blue-500" /> },
                                                        { label: 'Comments', count: s.comments || 0, spent: s.commentsCredits || 0, pct: Math.round(((s.commentsCredits || 0) / total) * 100), color: 'bg-violet-500', light: 'bg-violet-50', text: 'text-violet-600', icon: <MessageSquare size={14} className="text-violet-500" /> },
                                                        { label: 'Images', count: s.images || 0, spent: s.imagesCredits || 0, pct: Math.round(((s.imagesCredits || 0) / total) * 100), color: 'bg-rose-500', light: 'bg-rose-50', text: 'text-rose-600', icon: <Image size={14} className="text-rose-500" /> },
                                                    ].map(row => (
                                                        <div key={row.label} className={`${row.light} rounded-2xl p-4`}>
                                                            <div className="flex items-center justify-between mb-2">
                                                                <div className="flex items-center gap-2">{row.icon}<span className="text-sm font-black text-slate-700">{row.label}</span></div>
                                                                <div className="flex items-center gap-3">
                                                                    <span className="text-xs text-slate-400">{row.count} generated</span>
                                                                    <span className={`text-sm font-black ${row.text}`}>{row.spent} pts</span>
                                                                    <span className="text-xs text-slate-400 w-8 text-right">{row.pct}%</span>
                                                                </div>
                                                            </div>
                                                            <div className="w-full bg-white/70 rounded-full h-2">
                                                                <div className={`${row.color} h-2 rounded-full transition-all duration-700`} style={{ width: `${row.pct}%` }} />
                                                            </div>
                                                        </div>
                                                    ));
                                                })()}
                                            </div>
                                        </>)}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* User Edit Modal */}

                        {
                            isEditModalOpen && (
                                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsEditModalOpen(false)}></div>
                                    <div className="relative bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 w-full max-w-lg flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
                                        <div className="p-6 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
                                            <h2 className="text-2xl font-black text-slate-900">Edit User Details</h2>
                                            <button onClick={() => setIsEditModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors"><X size={24} /></button>
                                        </div>
                                        <form onSubmit={handleUpdateUser} className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">Full Name</label>
                                                    <input
                                                        type="text"
                                                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-orange-500 transition-all font-bold text-slate-700"
                                                        value={editForm.name}
                                                        onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                                        required
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">Email Address</label>
                                                    <input
                                                        type="email"
                                                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-orange-500 transition-all font-bold text-slate-700"
                                                        value={editForm.email}
                                                        onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                                                        required
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">User Role</label>
                                                    <select
                                                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-orange-500 transition-all font-bold text-slate-700"
                                                        value={editForm.role}
                                                        onChange={e => setEditForm({ ...editForm, role: e.target.value })}
                                                    >
                                                        <option value="user">User</option>
                                                        <option value="admin">Admin</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">Account Plan</label>
                                                    <select
                                                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-orange-500 transition-all font-bold text-slate-700"
                                                        value={editForm.plan}
                                                        onChange={e => {
                                                            const newPlan = plans.find(p => p.name === e.target.value);
                                                            setEditForm({ ...editForm, plan: e.target.value, credits: newPlan?.credits ?? editForm.credits, extraCreditsToAdd: 0, showAddExtra: false });
                                                        }}
                                                    >
                                                        {plans.map(p => (
                                                            <option key={p.id} value={p.name}>{p.name} — {p.credits} pts</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>

                                            {/* Credits */}
                                            <div className="space-y-2">
                                                {/* Current Balance Card */}
                                                <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl">
                                                    <div className="flex items-center gap-2">
                                                        <Zap size={15} className="text-orange-400 shrink-0" />
                                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Balance</span>
                                                    </div>
                                                    <span className="text-xl font-black text-orange-600">
                                                        {editForm.credits + (editForm.extraCreditsToAdd || 0)} pts
                                                    </span>
                                                </div>

                                                {/* Add Extra Credits Toggle */}
                                                {!editForm.showAddExtra ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => setEditForm({ ...editForm, showAddExtra: true })}
                                                        className="w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-slate-300 hover:border-green-400 hover:bg-green-50 rounded-2xl text-xs font-black text-slate-400 hover:text-green-600 transition-all"
                                                    >
                                                        <span className="text-base leading-none">+</span> Add Extra Credits
                                                    </button>
                                                ) : (
                                                    <div className="flex gap-2 items-center">
                                                        <div className="relative flex-1">
                                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-green-500 font-black">+</span>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                autoFocus
                                                                placeholder="How many credits to add?"
                                                                className="w-full pl-9 pr-4 py-3 bg-white border border-green-300 focus:border-green-500 focus:outline-none rounded-2xl font-bold text-slate-700 transition-all"
                                                                value={editForm.extraCreditsToAdd || ''}
                                                                onChange={e => setEditForm({ ...editForm, extraCreditsToAdd: parseInt(e.target.value) || 0 })}
                                                            />
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => setEditForm({ ...editForm, showAddExtra: false, extraCreditsToAdd: 0 })}
                                                            className="px-3 py-3 text-slate-400 hover:text-red-500 border border-slate-200 rounded-2xl hover:border-red-200 transition-all text-xs font-black"
                                                        >✕</button>
                                                    </div>
                                                )}
                                            </div>


                                            <div className="space-y-2">
                                                <label className="text-xs font-black uppercase tracking-widest text-slate-400">Custom Daily Limit (Points)</label>
                                                <div className="relative">
                                                    <Zap size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-400" />
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-orange-500 transition-all font-bold text-slate-700"
                                                        value={editForm.customDailyLimit || 0}
                                                        onChange={e => setEditForm({ ...editForm, customDailyLimit: parseInt(e.target.value) || 0 })}
                                                        placeholder="0 = Use plan default"
                                                    />
                                                </div>
                                                <p className="text-[10px] text-slate-400 font-medium pl-1">Set to <strong>0</strong> to use the default daily limit defined in the user's plan.</p>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-xs font-black uppercase tracking-widest text-slate-400">New Password (leave blank to keep current)</label>
                                                <input
                                                    type="password"
                                                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-orange-500 transition-all font-mono text-slate-700"
                                                    value={editForm.password}
                                                    placeholder="••••••••"
                                                    onChange={e => setEditForm({ ...editForm, password: e.target.value })}
                                                />
                                            </div>

                                            {/* Status Management */}
                                            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">Account Status</label>
                                                    <select
                                                        className={`w-full p-4 border rounded-2xl focus:outline-none transition-all font-bold ${editForm.status === 'Active' ? 'bg-green-50 text-green-700 border-green-200' :
                                                            editForm.status === 'Suspended' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                                                'bg-red-50 text-red-700 border-red-200'
                                                            }`}
                                                        value={editForm.status}
                                                        onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                                                    >
                                                        <option value="Active">Active</option>
                                                        <option value="Suspended">Suspended (Temporary)</option>
                                                        <option value="Banned">Banned (Permanent)</option>
                                                    </select>
                                                </div>

                                                {editForm.status !== 'Active' && (
                                                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                                        <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                                            <AlertTriangle size={12} className="text-red-500" />
                                                            Reason for {editForm.status}
                                                        </label>
                                                        <textarea
                                                            className="w-full p-4 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:border-red-500 transition-all font-medium text-slate-700 resize-none h-24"
                                                            placeholder={`Explain why the account is ${editForm.status.toLowerCase()}. This message will be shown to the user upon login attempt.`}
                                                            value={editForm.statusMessage}
                                                            onChange={e => setEditForm({ ...editForm, statusMessage: e.target.value })}
                                                        />
                                                    </div>
                                                )}
                                            </div>

                                            <div className="pt-4">
                                                <button type="submit" className="w-full py-4 bg-slate-900 text-white rounded-[2rem] font-bold shadow-xl hover:bg-orange-600 transition-all active:scale-95">
                                                    Save User Changes
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            )
                        }

                        {/* Plan Edit Modal */}
                        {
                            isPlanModalOpen && (
                                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsPlanModalOpen(false)}></div>
                                    <div className="relative bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                                        <div className="p-8 pb-4 border-b border-slate-100 flex items-center justify-between">
                                            <h2 className="text-2xl font-black text-slate-900">{planForm.id ? 'Edit Plan' : 'Create New Plan'}</h2>
                                            <button onClick={() => setIsPlanModalOpen(false)} className="bg-slate-50 p-2 rounded-xl text-slate-500 hover:text-red-500 hover:bg-red-50 transition-colors">
                                                <X size={24} />
                                            </button>
                                        </div>
                                        <div className="p-8 space-y-5 max-h-[70vh] overflow-y-auto custom-scrollbar">
                                            <div className="grid grid-cols-2 gap-4">
                                                <label className="space-y-2">
                                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Plan ID</span>
                                                    <input
                                                        type="text"
                                                        placeholder="e.g. pro-monthly"
                                                        value={planForm.id || ''}
                                                        onChange={(e) => setPlanForm({ ...planForm, id: e.target.value })}
                                                        disabled={!!planForm.id}
                                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 disabled:opacity-50"
                                                    />
                                                </label>
                                                <label className="space-y-2">
                                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Plan Name</span>
                                                    <input
                                                        type="text"
                                                        placeholder="e.g. Pro Plan"
                                                        value={planForm.name || ''}
                                                        onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                                                    />
                                                </label>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <label className="space-y-2">
                                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Daily Limit (Monthly)</span>
                                                    <input
                                                        type="number"
                                                        value={planForm.dailyLimitMonthly || 0}
                                                        onChange={(e) => setPlanForm({ ...planForm, dailyLimitMonthly: parseInt(e.target.value) || 0 })}
                                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                                                    />
                                                </label>
                                                <label className="space-y-2">
                                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Daily Limit (Yearly)</span>
                                                    <input
                                                        type="number"
                                                        value={planForm.dailyLimitYearly || 0}
                                                        onChange={(e) => setPlanForm({ ...planForm, dailyLimitYearly: parseInt(e.target.value) || 0 })}
                                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                                                    />
                                                </label>
                                            </div>

                                            <div className="grid grid-cols-3 gap-4">
                                                <label className="space-y-2">
                                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Monthly ($)</span>
                                                    <input
                                                        type="number"
                                                        value={planForm.monthlyPrice || 0}
                                                        onChange={(e) => setPlanForm({ ...planForm, monthlyPrice: parseFloat(e.target.value) || 0 })}
                                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                                                    />
                                                </label>
                                                <label className="space-y-2">
                                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Yearly ($)</span>
                                                    <input
                                                        type="number"
                                                        value={planForm.yearlyPrice || 0}
                                                        onChange={(e) => setPlanForm({ ...planForm, yearlyPrice: parseFloat(e.target.value) || 0 })}
                                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                                                    />
                                                </label>
                                                <label className="space-y-2">
                                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Credits</span>
                                                    <input
                                                        type="number"
                                                        value={planForm.credits || 0}
                                                        onChange={(e) => setPlanForm({ ...planForm, credits: parseInt(e.target.value) || 0 })}
                                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                                                    />
                                                </label>
                                            </div>

                                            <div className="space-y-2">
                                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Max Reddit Accounts</span>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={planForm.maxAccounts || 1}
                                                    onChange={(e) => setPlanForm({ ...planForm, maxAccounts: parseInt(e.target.value) || 1 })}
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Features (One per line)</span>
                                                <textarea
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 h-32"
                                                    placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
                                                    value={planForm.features?.join('\n') || ''}
                                                    onChange={(e) => setPlanForm({ ...planForm, features: e.target.value.split('\n') })}
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 pt-2">
                                                <label className="flex items-center gap-3 cursor-pointer group">
                                                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors ${planForm.allowImages ? 'bg-orange-500 border-orange-500 text-white' : 'border-slate-300 text-transparent group-hover:border-orange-400'}`}>
                                                        <Check size={16} strokeWidth={4} />
                                                        <input
                                                            type="checkbox"
                                                            className="hidden"
                                                            checked={planForm.allowImages || false}
                                                            onChange={(e) => setPlanForm({ ...planForm, allowImages: e.target.checked })}
                                                        />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-slate-700 text-xs">Allow AI Images</span>
                                                    </div>
                                                </label>

                                                <label className="flex items-center gap-3 cursor-pointer group">
                                                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors ${planForm.allowTracking ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 text-transparent group-hover:border-blue-400'}`}>
                                                        <Check size={16} strokeWidth={4} />
                                                        <input
                                                            type="checkbox"
                                                            className="hidden"
                                                            checked={planForm.allowTracking || false}
                                                            onChange={(e) => setPlanForm({ ...planForm, allowTracking: e.target.checked })}
                                                        />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-slate-700 text-xs">Allow Tracking</span>
                                                    </div>
                                                </label>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <label className="flex items-center gap-3 cursor-pointer group">
                                                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors ${planForm.purchaseEnabled ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 text-transparent group-hover:border-emerald-400'}`}>
                                                        <Check size={16} strokeWidth={4} />
                                                        <input
                                                            type="checkbox"
                                                            className="hidden"
                                                            checked={planForm.purchaseEnabled ?? true}
                                                            onChange={(e) => setPlanForm({ ...planForm, purchaseEnabled: e.target.checked })}
                                                        />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-slate-700 text-xs text-nowrap">Purchase Enabled</span>
                                                    </div>
                                                </label>

                                                <label className="flex items-center gap-3 cursor-pointer group">
                                                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors ${planForm.isVisible ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 text-transparent group-hover:border-indigo-400'}`}>
                                                        <Check size={16} strokeWidth={4} />
                                                        <input
                                                            type="checkbox"
                                                            className="hidden"
                                                            checked={planForm.isVisible ?? true}
                                                            onChange={(e) => setPlanForm({ ...planForm, isVisible: e.target.checked })}
                                                        />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-slate-700 text-xs text-nowrap">Visible in UI</span>
                                                    </div>
                                                </label>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <label className="flex items-center gap-3 cursor-pointer group">
                                                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors ${planForm.isPopular ? 'bg-orange-500 border-orange-500 text-white' : 'border-slate-300 text-transparent group-hover:border-orange-400'}`}>
                                                        <Check size={16} strokeWidth={4} />
                                                        <input
                                                            type="checkbox"
                                                            className="hidden"
                                                            checked={planForm.isPopular || false}
                                                            onChange={(e) => setPlanForm({ ...planForm, isPopular: e.target.checked })}
                                                        />
                                                    </div>
                                                    <span className="font-bold text-slate-700 text-sm">Mark as Popular</span>
                                                </label>
                                                {planForm.isPopular && (
                                                    <div className="flex-1">
                                                        <input
                                                            type="text"
                                                            placeholder="Highlight Text (e.g. Best Value)"
                                                            value={planForm.highlightText || ''}
                                                            onChange={(e) => setPlanForm({ ...planForm, highlightText: e.target.value })}
                                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 font-bold text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                                                        />
                                                    </div>
                                                )}
                                            </div>

                                            <button onClick={handleSavePlan} className="w-full py-4 bg-slate-900 text-white rounded-[2rem] font-bold shadow-xl hover:bg-orange-600 transition-all active:scale-95 flex items-center justify-center gap-2">
                                                <Save size={20} />
                                                Save Plan
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )
                        }
                    </>
                )}
            </div>
        </>
    );
};
