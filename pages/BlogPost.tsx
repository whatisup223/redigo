import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, Clock, Tag, User as UserIcon } from 'lucide-react';

interface PostData {
    id: string;
    title: string;
    slug: string;
    content: string;
    excerpt: string;
    coverImage: string;
    author: string;
    views: number;
    publishedAt: string;
    tags: string[];
}

export const BlogPost: React.FC = () => {
    const { slug } = useParams();
    const [post, setPost] = useState<PostData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        window.scrollTo(0, 0);
        fetch(`/api/blog/posts/${slug}`)
            .then(res => res.json())
            .then(data => {
                if (data.id) {
                    setPost(data);
                } else {
                    setPost(null);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [slug]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#fcfcfd] flex items-center justify-center p-6">
                <div className="animate-pulse space-y-8 w-full max-w-3xl">
                    <div className="h-64 bg-slate-200 rounded-[2rem]"></div>
                    <div className="h-12 w-3/4 bg-slate-200 rounded-xl"></div>
                    <div className="h-4 w-1/2 bg-slate-200 rounded-lg"></div>
                    <div className="space-y-4 pt-8">
                        <div className="h-4 w-full bg-slate-200 rounded"></div>
                        <div className="h-4 w-full bg-slate-200 rounded"></div>
                        <div className="h-4 w-5/6 bg-slate-200 rounded"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (!post) {
        return (
            <div className="min-h-screen bg-[#fcfcfd] flex flex-col items-center justify-center p-6 text-center">
                <div className="bg-white p-12 rounded-[3rem] shadow-sm border border-slate-200 max-w-lg w-full">
                    <BookOpen size={64} className="mx-auto text-slate-300 mb-6" />
                    <h1 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Post Not Found</h1>
                    <p className="text-slate-500 font-medium mb-8">This article might have been moved or deleted.</p>
                    <Link to="/blog" className="px-8 py-3 bg-orange-600 text-white font-bold rounded-2xl hover:bg-orange-700 shadow-xl shadow-orange-200 transition-all flex items-center justify-center gap-2">
                        <ArrowLeft size={18} /> Back to Blog
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <article className="min-h-screen bg-[#fcfcfd] font-['Outfit'] pb-32">
            {post.coverImage && (
                <div className="w-full h-[50vh] max-h-[500px] mb-12 relative overflow-hidden bg-slate-100">
                    <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover animate-in fade-in zoom-in-105 duration-1000" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#fcfcfd] via-transparent to-transparent"></div>
                </div>
            )}

            <div className="max-w-4xl mx-auto px-6">
                <Link to="/blog" className={`inline-flex items-center gap-2 text-slate-500 hover:text-orange-600 font-bold mb-8 transition-colors ${!post.coverImage ? 'mt-8' : ''}`}>
                    <ArrowLeft size={16} /> Back to Blog Articles
                </Link>

                <header className="mb-12 space-y-6">
                    <h1 className="text-4xl md:text-6xl font-black tracking-tight text-slate-900 leading-[1.15]">
                        {post.title}
                    </h1>

                    <div className="flex flex-wrap items-center gap-x-8 gap-y-4 text-sm font-bold text-slate-500 border-y border-slate-200/60 py-4">
                        <div className="flex items-center gap-2 text-slate-900">
                            <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex flex-col items-center justify-center">
                                <UserIcon size={16} />
                            </div>
                            <span>{post.author}</span>
                        </div>
                        <div className="flex items-center gap-2 uppercase tracking-widest text-[10px] bg-slate-100 px-3 py-1.5 rounded-lg text-slate-600">
                            <Clock size={14} className="text-blue-500" />
                            {new Date(post.publishedAt || Date.now()).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </div>
                        <div className="flex items-center gap-2 uppercase tracking-widest text-[10px] bg-emerald-50 px-3 py-1.5 rounded-lg text-emerald-600">
                            <Eye size={14} /> {post.views} views
                        </div>
                    </div>
                </header>

                <div
                    className="mt-12 text-slate-700
                    [&>h2]:text-3xl [&>h2]:md:text-4xl [&>h2]:font-black [&>h2]:mt-16 [&>h2]:mb-8 [&>h2]:tracking-tight [&>h2]:text-slate-900 [&>h2]:leading-tight
                    [&>h3]:text-2xl [&>h3]:md:text-3xl [&>h3]:font-bold [&>h3]:mt-12 [&>h3]:mb-6 [&>h3]:tracking-tight [&>h3]:text-slate-800 
                    [&>p]:text-lg [&>p]:leading-relaxed [&>p]:mb-8 [&>p]:font-medium [&>p]:text-slate-600 
                    [&>ul]:list-disc [&>ul]:pl-8 [&>ul]:mb-8 [&>ul>li]:mb-4 [&>ul>li]:text-lg [&>ul>li]:font-medium [&>ul>li]:text-slate-600 [&>ul>li]:leading-relaxed
                    [&>ol]:list-decimal [&>ol]:pl-8 [&>ol]:mb-8 [&>ol>li]:mb-4 [&>ol>li]:text-lg [&>ol>li]:font-medium [&>ol>li]:text-slate-600 [&>ol>li]:leading-relaxed
                    [&>strong]:text-slate-900 [&>strong]:font-bold
                    [&>a]:text-orange-600 [&>a]:underline [&>a]:font-bold hover:[&>a]:text-orange-700
                    [&>blockquote]:border-l-4 [&>blockquote]:border-orange-500 [&>blockquote]:pl-6 [&>blockquote]:italic [&>blockquote]:my-10 [&>blockquote]:text-slate-500 [&>blockquote]:text-xl"
                    dangerouslySetInnerHTML={{ __html: post.content }}
                />

                <footer className="mt-24 pt-12 border-t border-slate-200">
                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[3rem] p-12 text-center shadow-2xl shadow-slate-200 relative overflow-hidden">
                        <div className="absolute inset-0 bg-white/5 opacity-50 blur-3xl"></div>
                        <div className="relative z-10 flex flex-col items-center justify-center space-y-6">
                            <h3 className="text-3xl font-black text-white">Ready to scale faster?</h3>
                            <p className="text-slate-300 font-medium max-w-xl text-lg">Stop relying on luck. Use AI to find "Thirsty Leads" and authentically sell your product on Reddit without bans.</p>
                            <Link to="/signup" className="px-8 py-4 bg-orange-600 text-white font-bold rounded-2xl shadow-xl shadow-orange-900/50 hover:bg-orange-500 hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
                                Start Your Lead Hunt <ArrowLeft size={18} className="rotate-180" />
                            </Link>
                        </div>
                    </div>
                </footer>
            </div>
        </article>
    );
};

const Eye = ({ size, className }: { size: number, className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" /><circle cx="12" cy="12" r="3" /></svg>
);
