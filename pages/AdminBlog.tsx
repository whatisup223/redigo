import React, { useState, useEffect } from 'react';
import { Pencil, Trash2, Plus, RefreshCw, X, Save, FileText, CheckCircle, Eye } from 'lucide-react';

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

export const AdminBlog: React.FC = () => {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editingPost, setEditingPost] = useState<Partial<BlogPost> | null>(null);

    const fetchPosts = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/admin/blog/posts', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setPosts(await res.json());
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, []);

    const handleSave = async () => {
        if (!editingPost?.title || !editingPost?.slug || !editingPost?.content) {
            return alert('Title, Slug, and Content are required.');
        }

        setIsSaving(true);
        const isUpdate = !!editingPost.id;
        const url = isUpdate ? `/api/admin/blog/posts/${editingPost.id}` : '/api/admin/blog/posts';
        const method = isUpdate ? 'PUT' : 'POST';

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(editingPost)
            });

            if (res.ok) {
                setIsModalOpen(false);
                fetchPosts();
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to save');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this post?')) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/admin/blog/posts/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) fetchPosts();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 font-['Outfit'] pb-20">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-100">
                <div className="space-y-2">
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                        <FileText className="text-orange-600" /> Blog Management
                    </h1>
                    <p className="text-slate-400 font-medium">Create and publish SEO-optimized articles.</p>
                </div>
                <button
                    onClick={() => { setEditingPost({ status: 'draft' }); setIsModalOpen(true); }}
                    className="px-6 py-3 bg-slate-900 text-white font-bold rounded-2xl hover:bg-orange-600 transition-all shadow-xl shadow-slate-200 active:scale-95 flex items-center gap-2"
                >
                    <Plus size={18} /> New Post
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center p-12"><RefreshCw className="animate-spin text-orange-600" size={32} /></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {posts.map(post => (
                        <div key={post.id} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col justify-between group hover:shadow-lg transition-all">
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <span className={`text-[10px] uppercase font-black px-2 py-1 rounded-lg ${post.status === 'published' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'}`}>
                                        {post.status}
                                    </span>
                                    {post.status === 'published' && <a href={`/blog/${post.slug}`} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-blue-500"><Eye size={18} /></a>}
                                </div>
                                <h3 className="font-bold text-lg mb-2 line-clamp-2">{post.title}</h3>
                                <p className="text-xs text-slate-500 line-clamp-3 mb-4">{post.excerpt}</p>
                            </div>
                            <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                                <span className="text-xs text-slate-400 font-medium">{new Date(post.createdAt).toLocaleDateString()}</span>
                                <div className="flex gap-2">
                                    <button onClick={() => { setEditingPost(post); setIsModalOpen(true); }} className="p-2 text-slate-400 hover:text-blue-600 transition-colors"><Pencil size={18} /></button>
                                    <button onClick={() => handleDelete(post.id)} className="p-2 text-slate-400 hover:text-red-600 transition-colors"><Trash2 size={18} /></button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {posts.length === 0 && <div className="col-span-fulltext-center py-12 text-slate-400">No blog posts found. Create your first one!</div>}
                </div>
            )}

            {isModalOpen && editingPost && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white rounded-[2rem] w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4">
                        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
                            <h3 className="text-xl font-black text-slate-900">{editingPost.id ? 'Edit Post' : 'New Post'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-200 rounded-xl"><X size={20} /></button>
                        </div>
                        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <label className="block">
                                    <span className="text-sm font-bold text-slate-700 mb-2 block">Title *</span>
                                    <input type="text" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl" value={editingPost.title || ''} onChange={e => {
                                        const title = e.target.value;
                                        setEditingPost(prev => ({
                                            ...prev,
                                            title,
                                            slug: prev?.id ? prev.slug : title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
                                        }));
                                    }} placeholder="e.g. How to use Reddit for SaaS" />
                                </label>
                                <label className="block">
                                    <span className="text-sm font-bold text-slate-700 mb-2 block">Slug (URL) *</span>
                                    <input type="text" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl" value={editingPost.slug || ''} onChange={e => setEditingPost({ ...editingPost, slug: e.target.value })} />
                                </label>
                            </div>

                            <label className="block">
                                <span className="text-sm font-bold text-slate-700 mb-2 block">Excerpt (SEO Description)</span>
                                <textarea rows={2} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl" value={editingPost.excerpt || ''} onChange={e => setEditingPost({ ...editingPost, excerpt: e.target.value })} />
                            </label>

                            <label className="block">
                                <span className="text-sm font-bold text-slate-700 mb-2 block">Cover Image URL (Direct link)</span>
                                <input type="text" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl" value={editingPost.coverImage || ''} onChange={e => setEditingPost({ ...editingPost, coverImage: e.target.value })} />
                            </label>

                            <label className="block h-96 flex flex-col">
                                <span className="text-sm font-bold text-slate-700 mb-2 block">Content (HTML) *</span>
                                <textarea className="w-full flex-1 p-4 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-sm leading-relaxed" value={editingPost.content || ''} onChange={e => setEditingPost({ ...editingPost, content: e.target.value })} placeholder="<h1>Heading</h1><p>Start writing...</p>" />
                            </label>

                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <span className="text-sm font-bold text-slate-700">Publication Status</span>
                                <select className="p-2 border rounded-xl font-bold" value={editingPost.status || 'draft'} onChange={e => setEditingPost({ ...editingPost, status: e.target.value as any })}>
                                    <option value="draft">Draft</option>
                                    <option value="published">Published</option>
                                </select>
                            </div>
                        </div>
                        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                            <button onClick={() => setIsModalOpen(false)} className="px-6 py-3 text-slate-500 font-bold hover:bg-slate-200 rounded-xl transition-colors">Cancel</button>
                            <button onClick={handleSave} disabled={isSaving} className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 hover:shadow-blue-200 transition-all flex items-center gap-2">
                                {isSaving ? <RefreshCw className="animate-spin" size={18} /> : <CheckCircle size={18} />} Save Post
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
