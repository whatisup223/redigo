import React, { useState, useEffect } from 'react';
import { Pencil, Trash2, Plus, RefreshCw, X, CheckCircle, FileText, Eye, Calendar, Globe } from 'lucide-react';

interface BlogPost {
    id: string;
    title: string;
    slug: string;
    content: string;
    excerpt: string;
    coverImage: string;
    author: string;
    status: 'draft' | 'published';
    tags: string[];
    views: number;
    createdAt: string;
    publishedAt?: string;
}

const EMPTY_POST: Partial<BlogPost> = { title: '', slug: '', excerpt: '', content: '', coverImage: '', author: 'Redigo Growth Team', status: 'draft', tags: [] };

export const AdminBlog: React.FC = () => {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editingPost, setEditingPost] = useState<Partial<BlogPost>>(EMPTY_POST);
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

    const showToast = (msg: string, ok = true) => {
        setToast({ msg, ok });
        setTimeout(() => setToast(null), 3000);
    };

    const fetchPosts = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/admin/blog/posts', { headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) setPosts(await res.json());
        } catch { } finally { setLoading(false); }
    };

    useEffect(() => { fetchPosts(); }, []);

    const openNew = () => { setEditingPost({ ...EMPTY_POST }); setIsModalOpen(true); };
    const openEdit = (p: BlogPost) => { setEditingPost({ ...p }); setIsModalOpen(true); };

    const handleSave = async () => {
        if (!editingPost.title?.trim() || !editingPost.slug?.trim() || !editingPost.content?.trim()) {
            return showToast('Title, Slug, and Content are required.', false);
        }
        setIsSaving(true);
        const isUpdate = !!editingPost.id;
        const url = isUpdate ? `/api/admin/blog/posts/${editingPost.id}` : '/api/admin/blog/posts';
        const method = isUpdate ? 'PUT' : 'POST';
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(editingPost),
            });
            if (res.ok) {
                setIsModalOpen(false);
                fetchPosts();
                showToast(isUpdate ? 'Post updated!' : 'Post created!');
            } else {
                const d = await res.json();
                showToast(d.error || 'Save failed', false);
            }
        } catch { showToast('Network error', false); } finally { setIsSaving(false); }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Delete this post permanently?')) return;
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/admin/blog/posts/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) { fetchPosts(); showToast('Post deleted'); }
    };

    const setField = (key: keyof BlogPost, val: any) =>
        setEditingPost(p => ({ ...p, [key]: val }));

    const autoSlug = (title: string) =>
        title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 font-['Outfit'] pb-20 relative">

            {/* Toast */}
            {toast && (
                <div className={`fixed top-6 right-6 z-[9999] px-6 py-4 rounded-2xl shadow-2xl font-bold text-white text-sm flex items-center gap-3 animate-in slide-in-from-top-2 ${toast.ok ? 'bg-emerald-600' : 'bg-red-600'}`}>
                    {toast.ok ? <CheckCircle size={18} /> : <X size={18} />} {toast.msg}
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-6 border-b border-slate-100">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-600 rounded-2xl flex items-center justify-center text-white shadow-lg"><FileText size={20} /></div>
                        Blog Management
                    </h1>
                    <p className="text-slate-400 font-medium mt-2">Write, edit, and publish SEO-optimized articles.</p>
                </div>
                <button
                    onClick={openNew}
                    className="px-6 py-3 bg-slate-900 text-white font-bold rounded-2xl hover:bg-orange-600 transition-all shadow-xl active:scale-95 flex items-center gap-2 whitespace-nowrap"
                >
                    <Plus size={18} /> New Post
                </button>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="flex justify-center p-12"><RefreshCw className="animate-spin text-orange-600" size={32} /></div>
            ) : posts.length === 0 ? (
                <div className="text-center py-24 bg-white rounded-[2rem] border border-dashed border-slate-300">
                    <FileText size={48} className="mx-auto text-slate-300 mb-4" />
                    <p className="text-slate-500 font-bold">No posts yet. Create your first one!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                    {posts.map(post => (
                        <div key={post.id} className="bg-white rounded-[2rem] border border-slate-200 shadow-sm flex flex-col overflow-hidden group hover:shadow-xl transition-all duration-300">
                            {post.coverImage && (
                                <div className="h-40 overflow-hidden bg-slate-100">
                                    <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                </div>
                            )}
                            <div className="p-6 flex-1 flex flex-col">
                                <div className="flex justify-between items-start mb-3">
                                    <span className={`text-[10px] uppercase font-black px-2.5 py-1 rounded-lg ${post.status === 'published' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'}`}>
                                        {post.status}
                                    </span>
                                    <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold">
                                        <Eye size={12} /> {post.views}
                                    </div>
                                </div>
                                <h3 className="font-bold text-slate-900 leading-snug line-clamp-2 mb-2 text-base">{post.title}</h3>
                                <p className="text-xs text-slate-400 line-clamp-2 font-medium flex-1">{post.excerpt}</p>
                                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                                    <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1"><Calendar size={11} /> {new Date(post.createdAt).toLocaleDateString()}</span>
                                    <div className="flex gap-1">
                                        {post.status === 'published' && (
                                            <a href={`/blog/${post.slug}`} target="_blank" rel="noreferrer" className="p-2 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"><Globe size={16} /></a>
                                        )}
                                        <button onClick={() => openEdit(post)} className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"><Pencil size={16} /></button>
                                        <button onClick={() => handleDelete(post.id)} className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"><Trash2 size={16} /></button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── MODAL ─────────────────────────────────────────────────── */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[200] flex items-start justify-center p-4 pt-20 sm:pt-10 overflow-y-auto">
                    {/* Backdrop */}
                    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />

                    {/* Panel */}
                    <div className="relative bg-white rounded-[2rem] w-full max-w-3xl shadow-2xl flex flex-col animate-in slide-in-from-bottom-4 duration-300 my-auto">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-5 sm:p-7 border-b border-slate-100 bg-slate-50/60 rounded-t-[2rem]">
                            <h3 className="text-xl font-black text-slate-900">{editingPost.id ? 'Edit Post' : 'New Post'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 rounded-xl transition-colors"><X size={20} /></button>
                        </div>

                        {/* Modal Body – scrollable */}
                        <div className="p-5 sm:p-7 space-y-5 overflow-y-auto max-h-[65vh] custom-scrollbar">
                            {/* Title */}
                            <label className="block">
                                <span className="text-sm font-bold text-slate-700 mb-1.5 block">Title *</span>
                                <input
                                    type="text"
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm"
                                    value={editingPost.title || ''}
                                    onChange={e => {
                                        const title = e.target.value;
                                        setField('title', title);
                                        if (!editingPost.id) setField('slug', autoSlug(title));
                                    }}
                                    placeholder="How to get 100 SaaS customers from Reddit"
                                />
                            </label>

                            {/* Slug */}
                            <label className="block">
                                <span className="text-sm font-bold text-slate-700 mb-1.5 block">Slug (URL) *</span>
                                <input
                                    type="text"
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm font-mono"
                                    value={editingPost.slug || ''}
                                    onChange={e => setField('slug', e.target.value)}
                                    placeholder="how-to-get-100-saas-customers-reddit"
                                />
                                <span className="text-[10px] text-slate-400 mt-1 block">redditgo.online/blog/{editingPost.slug || '...'}</span>
                            </label>

                            {/* Excerpt */}
                            <label className="block">
                                <span className="text-sm font-bold text-slate-700 mb-1.5 block">Excerpt (SEO Description)</span>
                                <textarea rows={2} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm resize-none" value={editingPost.excerpt || ''} onChange={e => setField('excerpt', e.target.value)} placeholder="A short description that appears in Google results..." />
                            </label>

                            {/* Cover Image */}
                            <label className="block">
                                <span className="text-sm font-bold text-slate-700 mb-1.5 block">Cover Image URL</span>
                                <input type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm" value={editingPost.coverImage || ''} onChange={e => setField('coverImage', e.target.value)} placeholder="https://..." />
                                {editingPost.coverImage && (
                                    <img src={editingPost.coverImage} alt="preview" className="w-full h-32 object-cover rounded-xl mt-2 border border-slate-100" onError={e => (e.currentTarget.style.display = 'none')} />
                                )}
                            </label>

                            {/* Author */}
                            <label className="block">
                                <span className="text-sm font-bold text-slate-700 mb-1.5 block">Author</span>
                                <input type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm" value={editingPost.author || ''} onChange={e => setField('author', e.target.value)} />
                            </label>

                            {/* Content */}
                            <label className="block">
                                <span className="text-sm font-bold text-slate-700 mb-1.5 block">Content (HTML) *</span>
                                <textarea rows={10} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm font-mono leading-relaxed resize-y" value={editingPost.content || ''} onChange={e => setField('content', e.target.value)} placeholder="<h2>Introduction</h2><p>Start writing...</p>" />
                            </label>

                            {/* Status */}
                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <div>
                                    <span className="text-sm font-bold text-slate-800 block">Status</span>
                                    <span className="text-xs text-slate-400">Draft = not visible to visitors</span>
                                </div>
                                <select
                                    className="p-2.5 border border-slate-200 rounded-xl font-bold text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
                                    value={editingPost.status || 'draft'}
                                    onChange={e => setField('status', e.target.value)}
                                >
                                    <option value="draft">Draft</option>
                                    <option value="published">Published</option>
                                </select>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-5 sm:p-7 border-t border-slate-100 bg-slate-50/60 rounded-b-[2rem] flex justify-end gap-3">
                            <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-slate-500 font-bold hover:bg-slate-200 rounded-xl transition-colors text-sm">Cancel</button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="px-7 py-2.5 bg-orange-600 text-white font-bold rounded-xl shadow-lg hover:bg-orange-700 transition-all flex items-center gap-2 text-sm active:scale-95 disabled:opacity-60"
                            >
                                {isSaving ? <RefreshCw className="animate-spin" size={16} /> : <CheckCircle size={16} />}
                                {isSaving ? 'Saving…' : 'Save Post'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
