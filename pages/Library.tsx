
import React, { useState, useEffect } from 'react';
import {
    Database,
    Search,
    Filter,
    LayoutGrid,
    List,
    ExternalLink,
    Copy,
    Trash2,
    RefreshCw,
    CheckCircle,
    Clock,
    AlertCircle,
    Download,
    Image as ImageIcon,
    MessageSquare,
    Zap,
    ChevronRight,
    TrendingUp,
    FileText
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LibraryItem {
    id: string;
    _id?: string;
    type: 'post' | 'reply';
    postTitle: string;
    postContent?: string;
    comment?: string;
    subreddit: string;
    status: 'Draft' | 'Posted' | 'Failed';
    createdAt: string;
    imageUrl?: string;
    postUrl?: string;
}

const StatusBadge = ({ status }: { status: string }) => {
    const styles = {
        'Posted': 'bg-emerald-50 text-emerald-600 border-emerald-100',
        'Draft': 'bg-orange-50 text-orange-600 border-orange-100',
        'Failed': 'bg-red-50 text-red-600 border-red-100',
    }[status] || 'bg-slate-50 text-slate-600 border-slate-100';

    const Icon = {
        'Posted': CheckCircle,
        'Draft': Clock,
        'Failed': AlertCircle,
    }[status] || Clock;

    return (
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider ${styles}`}>
            <Icon size={12} />
            {status}
        </div>
    );
};

export const Library: React.FC = () => {
    const { user } = useAuth();
    const [items, setItems] = useState<LibraryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'All' | 'Draft' | 'Posted' | 'Failed'>('All');
    const [typeFilter, setTypeFilter] = useState<'All' | 'post' | 'reply'>('All');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const fetchLibrary = async () => {
        if (!user?.id) return;
        setLoading(true);
        try {
            const [postsRes, repliesRes] = await Promise.all([
                fetch(`/api/user/posts?userId=${user.id}`),
                fetch(`/api/user/replies?userId=${user.id}`)
            ]);

            const postsData = await postsRes.json();
            const repliesData = await repliesRes.json();

            const normalizedPosts = (Array.isArray(postsData) ? postsData : []).map(p => ({
                ...p,
                id: p.id || p._id,
                type: 'post' as const,
                postContent: p.postContent?.startsWith('{') ? JSON.parse(p.postContent).content : p.postContent
            }));

            const normalizedReplies = (Array.isArray(repliesData) ? repliesData : []).map(r => ({
                ...r,
                id: r.id || r._id,
                type: 'reply' as const,
                postContent: r.comment // For unified display
            }));

            const allItems = [...normalizedPosts, ...normalizedReplies].sort((a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );

            setItems(allItems);
        } catch (err) {
            console.error('Failed to fetch library:', err);
            showToast('Failed to load library content', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLibrary();
    }, [user?.id]);

    const handleDelete = async (item: LibraryItem) => {
        if (!window.confirm('Are you sure you want to delete this content permanently?')) return;

        try {
            const endpoint = item.type === 'post' ? `/api/user/posts` : `/api/user/replies`;
            const response = await fetch(`${endpoint}?id=${item.id}`, { method: 'DELETE' });

            if (response.ok) {
                showToast('Item deleted successfully', 'success');
                setItems(prev => prev.filter(i => i.id !== item.id));
            } else {
                throw new Error('Delete failed');
            }
        } catch (err) {
            showToast('Failed to delete item', 'error');
        }
    };

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        showToast('Copied to clipboard!', 'success');
    };

    const handleDownload = async (url: string) => {
        try {
            const filename = `redditgo-${Date.now()}.png`;
            const proxyUrl = `/api/proxy-download?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}`;
            const a = document.createElement('a');
            a.href = proxyUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            showToast('Download started!', 'success');
        } catch (err) {
            showToast('Failed to download image', 'error');
        }
    };

    const filteredItems = items.filter(item => {
        const matchesSearch = (item.postTitle || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.subreddit || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.postContent || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
        const matchesType = typeFilter === 'All' || item.type === typeFilter;
        return matchesSearch && matchesStatus && matchesType;
    });

    const stats = {
        total: items.length,
        posted: items.filter(i => i.status === 'Posted').length,
        drafts: items.filter(i => i.status === 'Draft' || !i.status).length,
        successRate: items.length > 0 ? Math.round((items.filter(i => i.status === 'Posted').length / items.length) * 100) : 100
    };

    return (
        <div className="max-w-[1600px] mx-auto space-y-10 animate-fade-in font-['Outfit'] pt-4 px-4 pb-20">
            {/* Header & Stats */}
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-8 bg-orange-600 rounded-full" />
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Content Library</h1>
                    </div>
                    <p className="text-slate-500 font-medium text-lg pl-4">Manage your lifetime generated posts and replies.</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1 max-w-4xl">
                    {[
                        { label: 'Total Managed', value: stats.total, icon: Database, color: 'text-slate-600', bg: 'bg-slate-50' },
                        { label: 'Live on Reddit', value: stats.posted, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                        { label: 'Pending Drafts', value: stats.drafts, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
                        { label: 'Success Rate', value: `${stats.successRate}%`, icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
                    ].map((stat, i) => (
                        <div key={i} className={`${stat.bg} p-5 rounded-[2rem] border border-white/50 shadow-sm flex flex-col items-center text-center space-y-1 transform transition-all hover:scale-105 duration-300`}>
                            <stat.icon size={20} className={stat.color} />
                            <div className="text-2xl font-black text-slate-900 leading-none">{stat.value}</div>
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Persistence Warning Banner */}
            <div className="bg-slate-900 rounded-[2.5rem] p-6 border border-slate-800 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-orange-600/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
                <div className="relative z-10 flex items-center gap-5">
                    <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-orange-500 border border-white/5">
                        <Zap size={28} />
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-xl font-black text-white">Credit-Efficient Workflow</h3>
                        <p className="text-slate-400 text-sm font-medium">Reposting from library consumes 0 credits. You own this content forever.</p>
                    </div>
                </div>
                <div className="relative z-10 hidden md:block">
                    <span className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black text-orange-400 uppercase tracking-widest shadow-inner">Autosave Active</span>
                </div>
            </div>

            {/* Filters & Actions Toolbar */}
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 space-y-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 flex-1">
                        {/* Search */}
                        <div className="relative flex-1 group">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-600 transition-colors" size={18} />
                            <input
                                type="text"
                                placeholder="Search Titles, Content, or Subreddits..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-[1.5rem] text-sm font-bold focus:outline-none focus:ring-4 focus:ring-orange-50 focus:border-orange-500 transition-all shadow-inner"
                            />
                        </div>

                        {/* Status Filter */}
                        <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                            {['All', 'Posted', 'Draft', 'Failed'].map(status => (
                                <button
                                    key={status}
                                    onClick={() => setStatusFilter(status as any)}
                                    className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all ${statusFilter === status ? 'bg-white text-orange-600 shadow-sm border border-orange-100' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2.5 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white text-orange-600 shadow-sm border border-orange-100' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <LayoutGrid size={20} />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white text-orange-600 shadow-sm border border-orange-100' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <List size={20} />
                            </button>
                        </div>

                        <button
                            onClick={fetchLibrary}
                            disabled={loading}
                            className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-orange-600 transition-all shadow-lg active:scale-95 disabled:opacity-50"
                        >
                            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mr-2">Filter Type:</p>
                    {['All', 'post', 'reply'].map(type => (
                        <button
                            key={type}
                            onClick={() => setTypeFilter(type as any)}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${typeFilter === type ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-100 hover:border-orange-200'}`}
                        >
                            {type === 'reply' ? '💬 Replies' : type === 'post' ? '📝 Posts' : '🌈 Show All'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Library Content */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="bg-slate-50/50 rounded-[2.5rem] h-[400px] animate-pulse border border-slate-100" />
                    ))}
                </div>
            ) : filteredItems.length === 0 ? (
                <div className="bg-white rounded-[3rem] border border-slate-100 p-20 text-center space-y-6 shadow-xl shadow-slate-200/30">
                    <div className="w-32 h-32 bg-orange-50 text-orange-600 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner border border-orange-100 transform -rotate-6">
                        <FileText size={56} />
                    </div>
                    <div className="max-w-md mx-auto space-y-2">
                        <h3 className="text-2xl font-black text-slate-900">No content found</h3>
                        <p className="text-slate-500 font-medium">You haven't generated any {typeFilter !== 'All' ? typeFilter + 's' : 'content'} matching these filters yet.</p>
                    </div>
                    <button
                        onClick={() => window.location.href = typeFilter === 'reply' ? '/comment-agent' : '/post-agent'}
                        className="px-8 py-4 bg-orange-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-orange-200 hover:bg-orange-700 hover:-translate-y-1 transition-all inline-flex items-center gap-2"
                    >
                        Create New Content <ChevronRight size={18} />
                    </button>
                </div>
            ) : (
                <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8" : "space-y-4"}>
                    {filteredItems.map((item) => (
                        <div
                            key={item.id}
                            className={`bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm hover:shadow-2xl hover:border-orange-100 transition-all group ${viewMode === 'list' ? 'flex flex-row items-center p-4 gap-6' : 'flex flex-col'}`}
                        >
                            {/* Image Preview Overlay */}
                            {viewMode === 'grid' && item.imageUrl && (
                                <div className="relative h-48 overflow-hidden bg-slate-900">
                                    <img src={item.imageUrl} alt="AI Content" className="w-full h-full object-cover opacity-80 group-hover:scale-110 group-hover:opacity-100 transition-all duration-700" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
                                    <div className="absolute top-4 left-4 flex gap-2">
                                        <StatusBadge status={item.status || 'Draft'} />
                                    </div>
                                    <button
                                        onClick={() => handleDownload(item.imageUrl!)}
                                        className="absolute bottom-4 right-4 w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center text-white border border-white/20 hover:bg-white hover:text-orange-600 transition-all hover:scale-110"
                                        title="Download original image"
                                    >
                                        <Download size={18} />
                                    </button>
                                </div>
                            )}

                            <div className="p-8 flex-1 flex flex-col space-y-5">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shadow-inner border ${item.type === 'post' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                                            {item.type === 'post' ? 'P' : 'R'}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.type}</span>
                                            <span className="text-xs font-bold text-slate-900">r/{item.subreddit}</span>
                                        </div>
                                    </div>
                                    {item.imageUrl && viewMode === 'list' && (
                                        <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-100 shadow-sm shrink-0">
                                            <img src={item.imageUrl} alt="AI Preview" className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                    {viewMode === 'list' ? (
                                        <div className="flex items-center gap-4">
                                            <StatusBadge status={item.status || 'Draft'} />
                                            <div className="text-xs font-bold text-slate-400">{new Date(item.createdAt).toLocaleDateString()}</div>
                                        </div>
                                    ) : (
                                        (!item.imageUrl && <StatusBadge status={item.status || 'Draft'} />)
                                    )}
                                </div>

                                <div className="space-y-3 flex-1">
                                    <h4 className="text-lg font-black text-slate-900 leading-tight group-hover:text-orange-600 transition-colors line-clamp-2">{item.postTitle}</h4>
                                    <p className="text-sm text-slate-500 font-medium leading-relaxed italic line-clamp-4">
                                        “{item.postContent || item.comment}”
                                    </p>
                                </div>

                                <div className="pt-6 border-t border-slate-50 flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-1.5 overflow-hidden">
                                        {item.postUrl && (
                                            <a
                                                href={item.postUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:bg-orange-50 hover:text-orange-600 hover:border-orange-100 transition-all border border-transparent"
                                            >
                                                <ExternalLink size={16} />
                                            </a>
                                        )}
                                        <button
                                            onClick={() => handleCopy(item.postContent || item.comment || '')}
                                            className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:bg-orange-50 hover:text-orange-600 hover:border-orange-100 transition-all border border-transparent"
                                            title="Copy content"
                                        >
                                            <Copy size={16} />
                                        </button>
                                        {item.imageUrl && viewMode === 'list' && (
                                            <button
                                                onClick={() => handleDownload(item.imageUrl!)}
                                                className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:bg-orange-50 hover:text-orange-600 hover:border-orange-100 transition-all border border-transparent"
                                                title="Download image"
                                            >
                                                <ImageIcon size={16} />
                                            </button>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleDelete(item)}
                                            className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all border border-transparent"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                        <button
                                            onClick={async () => {
                                                const originalStatus = item.status;
                                                // Repost Logic: Toggle status to Draft so it appears in the Assistant
                                                if (originalStatus === 'Posted') {
                                                    try {
                                                        await fetch('/api/item/status', {
                                                            method: 'POST',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({ id: item.id || item._id, status: 'Draft' })
                                                        });
                                                        setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'Draft' } : i));
                                                    } catch (err) {
                                                        showToast('Failed to prepare for repost', 'error');
                                                        return;
                                                    }
                                                }

                                                const assistantButton = document.getElementById('redigo-assistant-button');
                                                if (assistantButton) {
                                                    assistantButton.click();
                                                    showToast(originalStatus === 'Posted' ? 'Preparing Repost...' : 'Item loaded in Assistant!', 'success');
                                                }
                                            }}
                                            className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-600 transition-all shadow-lg active:scale-95"
                                        >
                                            {item.status === 'Posted' ? 'Repost ♻️' : 'Publish 🚀'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Global Toast */}
            {toast && (
                <div className={`fixed bottom-10 right-10 z-[100] px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-right-10 duration-500 text-white font-black text-xs uppercase tracking-widest ${toast.type === 'success' ? 'bg-emerald-600 shadow-emerald-200' : 'bg-red-600 shadow-red-200'}`}>
                    {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                    {toast.message}
                </div>
            )}
        </div>
    );
};
