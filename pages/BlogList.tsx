import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, Clock, Calendar } from 'lucide-react';

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

export const BlogList: React.FC = () => {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        window.scrollTo(0, 0);
        fetch('/api/blog/posts')
            .then(res => res.json())
            .then(data => {
                setPosts(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    return (
        <div className="min-h-screen bg-[#fcfcfd] font-['Outfit'] pt-32 pb-24">
            <div className="max-w-7xl mx-auto px-6">
                <div className="mb-12">
                    <Link to="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-orange-600 font-bold mb-6 transition-colors">
                        <ArrowLeft size={16} /> Back to Home
                    </Link>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight mb-4">
                        RedditGo <span className="text-orange-600">Blog</span>
                    </h1>
                    <p className="text-lg text-slate-500 max-w-2xl font-medium">
                        Insights, playbooks, and strategies to help you scale your SaaS natively on Reddit without getting banned.
                    </p>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-96 bg-slate-100 rounded-[2rem] animate-pulse"></div>
                        ))}
                    </div>
                ) : posts.length === 0 ? (
                    <div className="text-center py-24 bg-white rounded-[3rem] border border-slate-200">
                        <BookOpen size={48} className="mx-auto text-slate-300 mb-4" />
                        <h3 className="text-2xl font-bold text-slate-900 mb-2">No articles yet</h3>
                        <p className="text-slate-500">We are currently writing some amazing content for you. Check back soon!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {posts.map(post => (
                            <Link key={post.id} to={`/blog/${post.slug}`} className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                {post.coverImage ? (
                                    <div className="h-56 w-full overflow-hidden bg-slate-100 relative">
                                        <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    </div>
                                ) : (
                                    <div className="h-56 w-full bg-gradient-to-br from-orange-100 to-orange-50 flex items-center justify-center text-orange-200">
                                        <BookOpen size={64} />
                                    </div>
                                )}
                                <div className="p-8 flex-1 flex flex-col">
                                    <div className="flex items-center gap-4 text-[11px] font-black uppercase tracking-widest text-slate-400 mb-4">
                                        <span className="flex items-center gap-1.5"><Calendar size={14} className="text-orange-500" /> {new Date(post.publishedAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                        <span className="flex items-center gap-1.5"><Eye size={14} className="text-blue-500" /> {post.views} views</span>
                                    </div>
                                    <h2 className="text-xl font-bold text-slate-900 leading-snug mb-3 group-hover:text-orange-600 transition-colors line-clamp-2">
                                        {post.title}
                                    </h2>
                                    <p className="text-sm font-medium text-slate-500 line-clamp-3 mb-6">
                                        {post.excerpt}
                                    </p>
                                    <div className="mt-auto flex items-center gap-2 text-sm font-bold text-orange-600">
                                        Read Article <ArrowLeft size={16} className="rotate-180 group-hover:translate-x-1 transition-transform" />
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

const Eye = ({ size, className }: { size: number, className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" /><circle cx="12" cy="12" r="3" /></svg>
);
