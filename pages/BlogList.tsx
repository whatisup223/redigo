import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BookOpen, Calendar, Zap } from 'lucide-react';

interface BlogPost {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    coverImage: string;
    author: string;
    views: number;
    publishedAt: string;
}

const Eye = ({ size, className }: { size: number; className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
        <circle cx="12" cy="12" r="3" />
    </svg>
);

export const BlogList: React.FC = () => {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        window.scrollTo(0, 0);
        fetch('/api/blog/posts')
            .then(res => res.json())
            .then(data => { setPosts(Array.isArray(data) ? data : []); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    return (
        <div className="min-h-screen bg-[#fcfcfd] font-['Outfit'] pb-32">

            {/* ── Hero Banner ─────────────────────────────────────────────── */}
            <div className="relative overflow-hidden bg-gradient-to-br from-orange-600 via-orange-500 to-red-500 pt-32 pb-24 px-6">
                {/* Decorative blobs */}
                <div className="absolute -top-20 -left-20 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-orange-900/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl pointer-events-none" />

                <div className="max-w-4xl mx-auto text-center relative z-10 flex flex-col items-center gap-6">
                    {/* Back link */}
                    <Link to="/" className="inline-flex items-center gap-2 text-orange-100 hover:text-white font-bold text-sm transition-colors self-start md:self-center">
                        <ArrowLeft size={16} /> Back to Home
                    </Link>

                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm text-white text-xs font-black uppercase tracking-[0.2em] px-4 py-2 rounded-full border border-white/20 shadow-lg">
                        <Zap size={14} fill="currentColor" /> Redigo Blog
                    </div>

                    {/* Headline */}
                    <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-[1.1]">
                        Insights &amp; Playbooks<br className="hidden md:block" />
                        <span className="text-orange-100">for Reddit Growth</span>
                    </h1>

                    {/* Sub */}
                    <p className="text-orange-50 text-lg md:text-xl font-medium max-w-2xl leading-relaxed">
                        Strategies to help you scale your SaaS natively on Reddit — without getting banned.
                    </p>

                    {/* Stats strip */}
                    <div className="flex items-center gap-8 mt-2 text-white/80 text-sm font-bold">
                        <div className="flex flex-col items-center gap-1">
                            <span className="text-3xl font-black text-white">{posts.length || 3}+</span>
                            <span className="text-[11px] uppercase tracking-widest text-orange-100">Articles</span>
                        </div>
                        <div className="w-px h-10 bg-white/20" />
                        <div className="flex flex-col items-center gap-1">
                            <span className="text-3xl font-black text-white">100%</span>
                            <span className="text-[11px] uppercase tracking-widest text-orange-100">Free to Read</span>
                        </div>
                        <div className="w-px h-10 bg-white/20" />
                        <div className="flex flex-col items-center gap-1">
                            <span className="text-3xl font-black text-white">AI</span>
                            <span className="text-[11px] uppercase tracking-widest text-orange-100">Powered Tips</span>
                        </div>
                    </div>
                </div>
            </div>
            {/* Smooth wave transition */}
            <div className="h-12 bg-gradient-to-b from-orange-50 to-[#fcfcfd] -mt-1" />

            {/* ── Posts Grid ──────────────────────────────────────────────── */}
            <div className="max-w-7xl mx-auto px-6 mt-8">
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-96 bg-slate-100 rounded-[2rem] animate-pulse" />
                        ))}
                    </div>
                ) : posts.length === 0 ? (
                    <div className="text-center py-24 bg-white rounded-[3rem] border border-slate-200 shadow-sm">
                        <BookOpen size={56} className="mx-auto text-slate-300 mb-5" />
                        <h3 className="text-2xl font-black text-slate-900 mb-2">No articles yet</h3>
                        <p className="text-slate-500 font-medium">We're writing amazing content for you. Check back soon!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {posts.map(post => (
                            <Link
                                key={post.id}
                                to={`/blog/${post.slug}`}
                                className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col group hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300"
                            >
                                {post.coverImage ? (
                                    <div className="h-52 w-full overflow-hidden bg-slate-100 relative">
                                        <img
                                            src={post.coverImage}
                                            alt={post.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                ) : (
                                    <div className="h-52 w-full bg-gradient-to-br from-orange-100 to-orange-50 flex items-center justify-center">
                                        <BookOpen size={56} className="text-orange-200" />
                                    </div>
                                )}

                                <div className="p-7 flex-1 flex flex-col">
                                    <div className="flex flex-wrap items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">
                                        <span className="flex items-center gap-1.5">
                                            <Calendar size={12} className="text-orange-500" />
                                            {new Date(post.publishedAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <Eye size={12} className="text-blue-500" />
                                            {post.views} views
                                        </span>
                                    </div>

                                    <h2 className="text-lg font-black text-slate-900 leading-snug mb-3 group-hover:text-orange-600 transition-colors line-clamp-2">
                                        {post.title}
                                    </h2>

                                    <p className="text-sm font-medium text-slate-500 line-clamp-3 mb-6 leading-relaxed flex-1">
                                        {post.excerpt}
                                    </p>

                                    <div className="mt-auto flex items-center gap-2 text-sm font-bold text-orange-600">
                                        Read Article
                                        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
