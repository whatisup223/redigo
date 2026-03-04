import React, { useState, useEffect } from 'react';
import { Copy, ExternalLink, CheckCircle, RefreshCw, Trash2, Smartphone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface PendingItem {
    id: string;
    type: 'post' | 'reply';
    subreddit: string;
    content: string;
    sourceUrl?: string; // postUrl from reply
    postTitle?: string;
    deployedAt: string;
}

export const MobileAssistant: React.FC = () => {
    const { user } = useAuth();
    const [items, setItems] = useState<PendingItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const fetchItems = async () => {
        setLoading(true);
        try {
            const [postsRes, repliesRes] = await Promise.all([
                fetch(`/api/user/posts/sync?userId=${user?.id}`),
                fetch(`/api/user/replies/sync?userId=${user?.id}`)
            ]);
            const posts = await postsRes.json();
            const replies = await repliesRes.json();

            const combined: PendingItem[] = [
                ...posts.filter((p: any) => p.status?.toLowerCase() === 'pending').map((p: any) => ({
                    id: p.id,
                    type: 'post',
                    subreddit: p.subreddit,
                    content: p.postContent || '',
                    postTitle: p.postTitle,
                    deployedAt: p.deployedAt || p.createdAt,
                })),
                ...replies.filter((r: any) => r.status?.toLowerCase() === 'pending').map((r: any) => ({
                    id: r.id,
                    type: 'reply',
                    subreddit: r.subreddit,
                    content: r.comment || '',
                    sourceUrl: r.postUrl,
                    postTitle: r.postTitle,
                    deployedAt: r.deployedAt || r.createdAt,
                }))
            ];

            // Sort by newest first
            combined.sort((a, b) => new Date(b.deployedAt).getTime() - new Date(a.deployedAt).getTime());

            setItems(combined);
        } catch (error) {
            console.error('Failed to fetch pending items', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchItems();
    }, [user?.id]);

    const handleCopy = (id: string, text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleDismiss = async (id: string, type: 'post' | 'reply') => {
        try {
            await fetch('/api/reddit/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user?.id, id, type, redditId: 'deleted' })
            });
            setItems(items.filter(i => i.id !== id));
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-gradient-to-br from-indigo-900 via-blue-900 to-indigo-800 rounded-[2.5rem] p-8 md:p-12 text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl -mr-16 -mt-16" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl -ml-12 -mb-12" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-[1.5rem] flex items-center justify-center border border-white/20 shadow-inner">
                            <Smartphone size={32} className="text-blue-300" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black tracking-tight mb-1">Mobile Assistant</h1>
                            <p className="text-blue-200 font-medium">Your generated content ready for manual posting.</p>
                        </div>
                    </div>
                    <button
                        onClick={fetchItems}
                        disabled={loading}
                        className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl font-bold transition-all disabled:opacity-50"
                    >
                        <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                        Sync Progress
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                {loading ? (
                    <div className="flex justify-center p-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    </div>
                ) : items.length === 0 ? (
                    <div className="bg-white rounded-[2rem] p-12 text-center border border-slate-200 shadow-sm flex flex-col items-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle size={32} className="text-slate-300" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">You're all caught up!</h3>
                        <p className="text-slate-500 max-w-sm">No pending content found. Use the Post or Comment agent to generate new content.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {items.map((item) => (
                            <div
                                key={item.id}
                                className="bg-white rounded-[1.5rem] border border-slate-200 shadow-sm overflow-hidden group hover:shadow-md hover:border-indigo-200 transition-all animate-in slide-in-from-bottom-2 fade-in"
                            >
                                <div className="p-5 sm:p-6 flex flex-col gap-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                                            <span className={`px-3 py-1 text-xs font-black uppercase tracking-wider rounded-lg ${item.type === 'post' ? 'bg-indigo-50 text-indigo-700' : 'bg-emerald-50 text-emerald-700'
                                                }`}>
                                                {item.type}
                                            </span>
                                            <span className="text-sm font-bold text-slate-700">r/{item.subreddit || 'unknown'}</span>
                                            <span className="text-xs font-medium text-slate-400">• {new Date(item.deployedAt).toLocaleString()}</span>
                                        </div>
                                        <button
                                            onClick={() => handleDismiss(item.id, item.type)}
                                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Discard this item"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>

                                    {item.postTitle && (
                                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                            <p className="text-sm font-bold text-slate-800 line-clamp-2">{item.postTitle}</p>
                                            {item.sourceUrl && (
                                                <a href={item.sourceUrl.startsWith('http') ? item.sourceUrl : `https://reddit.com${item.sourceUrl}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 mt-2 hover:underline w-fit">
                                                    <ExternalLink size={14} /> Open Target Post
                                                </a>
                                            )}
                                        </div>
                                    )}

                                    <div className="relative">
                                        <div className="bg-slate-50 p-4 pb-14 rounded-xl text-slate-700 font-medium text-sm whitespace-pre-wrap leading-relaxed border border-slate-100/50">
                                            {item.content || <em className="text-slate-400">No content text (Image only maybe)</em>}
                                        </div>

                                        <button
                                            onClick={() => handleCopy(item.id, item.content)}
                                            className={`absolute bottom-3 right-3 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm ${copiedId === item.id
                                                    ? 'bg-emerald-500 text-white shadow-emerald-200'
                                                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                                                }`}
                                        >
                                            {copiedId === item.id ? (
                                                <><CheckCircle size={16} /> Copied!</>
                                            ) : (
                                                <><Copy size={16} /> Copy Text</>
                                            )}
                                        </button>
                                    </div>

                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
