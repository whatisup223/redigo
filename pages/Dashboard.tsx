
import React, { useState, useEffect } from 'react';
import {
  Search,
  Flame,
  MessageSquarePlus,
  Clock,
  ArrowRight,
  RefreshCw,
  Send,
  Sparkles,
  AlertCircle,
  Zap,
  MoreVertical,
  ThumbsUp,
  Crown
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { RedditPost, GeneratedReply } from '../types';
import { generateRedditReply } from '../services/geminiService';
import { useAuth } from '../context/AuthContext';

const MOCK_POSTS: RedditPost[] = [
  {
    id: '1',
    title: 'How do you guys scale your React SaaS to 10k users?',
    author: 'dev_guru',
    subreddit: 'saas',
    ups: 1245,
    num_comments: 89,
    selftext: 'I am currently building a tool for designers and I am worried about backend scaling when we hit the front page of HN. What are your tips for infrastructure?',
    url: 'https://reddit.com/r/saas/1',
    created_utc: Date.now() / 1000 - 3600
  },
  {
    id: '2',
    title: 'Show HN: I built a better way to track Reddit engagement',
    author: 'indie_hacker_99',
    subreddit: 'sideproject',
    ups: 450,
    num_comments: 32,
    selftext: 'Tired of manual tracking? I made this open source tool...',
    url: 'https://reddit.com/r/sideproject/2',
    created_utc: Date.now() / 1000 - 7200
  },
  {
    id: '3',
    title: 'Best subreddit for learning TypeScript in 2025?',
    author: 'newbie_coder',
    subreddit: 'typescript',
    ups: 89,
    num_comments: 12,
    selftext: 'The documentation is great but I want community projects to join.',
    url: 'https://reddit.com/r/typescript/3',
    created_utc: Date.now() / 1000 - 10000
  }
];

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<RedditPost[]>(MOCK_POSTS);
  const [selectedPost, setSelectedPost] = useState<RedditPost | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedReply, setGeneratedReply] = useState<GeneratedReply | null>(null);
  const [editedComment, setEditedComment] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  // Mock credit system for Free plan
  const [usedCredits, setUsedCredits] = useState(0);
  const FREE_PLAN_LIMIT = 3;
  const isLimitReached = user?.plan === 'Free' && usedCredits >= FREE_PLAN_LIMIT;

  const handleGenerate = async (post: RedditPost) => {
    if (isLimitReached) return;

    setSelectedPost(post);
    setIsGenerating(true);
    setGeneratedReply(null);

    setUsedCredits(prev => prev + 1);

    try {
      const reply = await generateRedditReply(post, post.subreddit, 'helpful and professional', 'experienced founders');
      setGeneratedReply(reply);
      setEditedComment(reply.comment);
    } catch (err) {
      console.error(err);
      setToast({ message: 'Failed to generate AI reply. Check API key.', type: 'error' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePost = async () => {
    setIsPosting(true);
    // Simulate API call
    setTimeout(() => {
      setIsPosting(false);
      setToast({ message: 'Successfully scheduled reply on Reddit!', type: 'success' });
      setSelectedPost(null);
      setGeneratedReply(null);
    }, 1500);
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-fade-in font-['Outfit']">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-8 right-8 z-[60] p-5 rounded-3xl shadow-2xl text-white flex items-center gap-4 animate-in slide-in-from-right-10 duration-500 border border-white/20 ${toast.type === 'success' ? 'bg-orange-600' : 'bg-red-600'}`}>
          <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
            {toast.type === 'success' ? <Sparkles size={22} /> : <AlertCircle size={22} />}
          </div>
          <div>
            <p className="font-bold text-sm leading-tight">{toast.message}</p>
            <p className="text-white/70 text-xs">Action completed successfully.</p>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-4 border-b border-slate-100">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-8 bg-orange-600 rounded-full"></span>
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Post Feed</h1>
          </div>
          <p className="text-slate-400 font-medium text-lg">Opportunities matching your <span className="text-orange-600">marketing signals</span>.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors" size={20} />
            <input
              type="text"
              placeholder="Search conversations..."
              className="pl-12 pr-6 py-4 bg-white border border-slate-200/60 rounded-[1.5rem] focus:ring-4 focus:ring-orange-100 focus:border-orange-500 focus:outline-none w-full md:w-80 transition-all font-medium text-sm shadow-sm"
            />
          </div>
          <button className="p-4 bg-white text-slate-400 hover:text-orange-600 hover:shadow-md border border-slate-200/60 rounded-2xl transition-all active:scale-90">
            <RefreshCw size={22} />
          </button>
        </div>
      </div>

      {/* Credits Banner for Free Plan */}
      {
        user?.plan === 'Free' && (
          <div className="bg-slate-900 rounded-3xl p-6 flex items-center justify-between text-white shadow-xl shadow-slate-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-slate-800 rounded-full blur-3xl -mr-16 -mt-16 -z-0"></div>
            <div className="relative z-10 flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center text-orange-400 border border-slate-700">
                <Zap size={24} fill="currentColor" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Free Plan Active</h3>
                <p className="text-slate-400 text-sm font-medium">You have used <span className="text-white font-bold">{usedCredits}/{FREE_PLAN_LIMIT}</span> AI replies today.</p>
              </div>
            </div>

            {!isLimitReached ? (
              <div className="relative z-10">
                <div className="h-2 w-32 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-orange-500 transition-all duration-500" style={{ width: `${(usedCredits / FREE_PLAN_LIMIT) * 100}%` }}></div>
                </div>
              </div>
            ) : (
              <Link to="/pricing" className="relative z-10 bg-white text-slate-900 px-6 py-3 rounded-xl font-bold text-sm hover:bg-orange-50 transition-colors flex items-center gap-2">
                <Crown size={16} className="text-orange-600" />
                Upgrade Now
              </Link>
            )}
          </div>
        )
      }

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
        {/* Posts List */}
        <div className="xl:col-span-8 space-y-6">
          {posts.map(post => (
            <div
              key={post.id}
              className={`p-8 rounded-[2.5rem] transition-all duration-500 border-2 relative group overflow-hidden ${selectedPost?.id === post.id
                ? 'border-orange-500 bg-white shadow-2xl shadow-orange-100/50 scale-[1.02]'
                : 'border-transparent bg-white hover:border-slate-200/60 shadow-sm hover:shadow-xl'
                }`}
              onClick={() => setSelectedPost(post)}
            >
              <div className="flex flex-col md:flex-row items-start justify-between gap-6">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 px-3 py-1 bg-orange-50 rounded-xl border border-orange-100">
                      <Flame size={14} className="text-orange-600" />
                      <span className="text-xs font-bold text-orange-600 uppercase tracking-widest">r/{post.subreddit}</span>
                    </div>
                    <button className="p-2 text-slate-300 hover:text-slate-600 transition-colors">
                      <MoreVertical size={20} />
                    </button>
                  </div>

                  <h3 className="text-2xl font-bold text-slate-900 leading-tight group-hover:text-orange-600 transition-colors">{post.title}</h3>
                  <p className="text-slate-500 text-lg line-clamp-2 leading-relaxed font-medium">{post.selftext}</p>

                  <div className="flex items-center gap-8 pt-2">
                    <div className="flex items-center gap-2 group/stat">
                      <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover/stat:bg-orange-50 group-hover/stat:text-orange-600 transition-colors">
                        <ThumbsUp size={16} />
                      </div>
                      <span className="text-sm font-bold text-slate-600">{post.ups.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2 group/stat">
                      <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover/stat:bg-blue-50 group-hover/stat:text-blue-600 transition-colors">
                        <MessageSquarePlus size={16} />
                      </div>
                      <span className="text-sm font-bold text-slate-600">{post.num_comments}</span>
                    </div>
                    <div className="flex items-center gap-2 group/stat">
                      <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover/stat:bg-purple-50 group-hover/stat:text-purple-600 transition-colors">
                        <Clock size={16} />
                      </div>
                      <span className="text-sm font-bold text-slate-600">{Math.floor((Date.now() / 1000 - post.created_utc) / 3600)}h ago</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={(e) => { e.stopPropagation(); handleGenerate(post); }}
                  disabled={isGenerating && selectedPost?.id === post.id}
                  className="w-full md:w-auto flex-shrink-0 bg-slate-900 text-white px-8 py-4 rounded-[1.5rem] text-sm font-bold hover:bg-orange-600 disabled:opacity-50 transition-all duration-300 flex items-center justify-center gap-2 shadow-xl active:scale-95"
                >
                  {isGenerating && selectedPost?.id === post.id ? <RefreshCw className="animate-spin" size={18} /> : <Zap size={18} />}
                  Craft Reply
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Action Panel / AI View */}
        <div className="xl:col-span-4">
          <div className="sticky top-10 bg-white rounded-[2.5rem] border border-slate-200/60 shadow-2xl shadow-slate-200/30 overflow-hidden flex flex-col min-h-[600px]">
            <div className="p-6 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-extrabold text-xl flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-100">
                  <Sparkles size={20} />
                </div>
                Assistant
              </h2>
              <span className="text-[10px] font-extrabold text-orange-600 bg-orange-50 px-2 py-1 rounded-lg uppercase tracking-widest border border-orange-100">Live</span>
            </div>

            <div className="p-8 flex-1 flex flex-col">
              {!selectedPost ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 opacity-60">
                  <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-300 border border-slate-100">
                    <MessageSquarePlus size={40} />
                  </div>
                  <div className="space-y-2">
                    <p className="text-slate-900 text-lg font-bold">No Post Selected</p>
                    <p className="text-slate-400 text-sm font-medium px-8">Click on any post from the feed to start generating AI-powered responses.</p>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="space-y-2">
                    <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-[0.2em]">Context Focus</p>
                    <p className="text-lg font-bold text-slate-900 leading-snug line-clamp-2">{selectedPost.title}</p>
                  </div>

                  {isGenerating ? (
                    <div className="flex-1 space-y-6 flex flex-col justify-center py-12">
                      <div className="w-16 h-16 border-4 border-orange-100 border-t-orange-600 rounded-full animate-spin mx-auto"></div>
                      <p className="text-center text-slate-400 font-bold animate-pulse tracking-widest text-xs uppercase">Analyzing Sentiment & Context...</p>
                    </div>
                  ) : generatedReply ? (
                    <div className="flex-1 flex flex-col space-y-8">
                      <div className="space-y-3">
                        <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-[0.2em]">Drafted Response</label>
                        <textarea
                          className="w-full min-h-[280px] p-6 bg-slate-50 border border-slate-200/60 rounded-[2rem] text-slate-700 text-lg font-medium focus:ring-4 focus:ring-orange-50 focus:border-orange-500 focus:outline-none transition-all custom-scrollbar leading-relaxed"
                          value={editedComment}
                          onChange={(e) => setEditedComment(e.target.value)}
                        />
                      </div>

                      <div className="space-y-3">
                        <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-[0.2em]">Key Strategies</p>
                        <div className="flex flex-wrap gap-2">
                          {generatedReply.actionable_points.map((p, i) => (
                            <span key={i} className="text-[11px] bg-orange-50 text-orange-600 px-3 py-1.5 rounded-xl font-bold border border-orange-100">{p}</span>
                          ))}
                        </div>
                      </div>

                      <div className="pt-4 mt-auto">
                        <button
                          onClick={handlePost}
                          disabled={isPosting}
                          className="w-full bg-orange-600 text-white py-5 rounded-[2rem] font-bold hover:bg-orange-700 transition-all flex items-center justify-center gap-3 shadow-2xl shadow-orange-200 active:scale-95 disabled:opacity-50 text-lg"
                        >
                          {isPosting ? <RefreshCw className="animate-spin" size={20} /> : <Send size={20} />}
                          Deploy to Reddit
                        </button>
                      </div>
                    </div>
                  ) : isLimitReached ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 py-10 px-8 relative overflow-hidden">
                      <div className="absolute inset-0 bg-slate-50/50 backdrop-blur-sm z-0"></div>
                      <div className="relative z-10 bg-white p-8 rounded-[2.5rem] shadow-2xl shadow-orange-100 border border-orange-100 max-w-sm">
                        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 mx-auto mb-6 animate-pulse">
                          <Crown size={32} fill="currentColor" />
                        </div>
                        <h3 className="text-2xl font-extrabold text-slate-900 mb-2">Daily Limit Reached</h3>
                        <p className="text-slate-500 font-medium mb-8 leading-relaxed">
                          You've used all your free AI replies for today. Upgrade to Pro for unlimited access.
                        </p>
                        <Link
                          to="/pricing"
                          className="w-full block bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-xl hover:shadow-2xl active:scale-95 flex items-center justify-center gap-2"
                        >
                          Upgrade to Pro <ArrowRight size={18} />
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8 py-10">
                      <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600">
                        <Zap size={32} />
                      </div>
                      <div className="space-y-2">
                        <p className="text-xl font-bold text-slate-900">Ready to engage?</p>
                        <p className="text-slate-400 font-medium px-4">Generate a value-add reply for u/{selectedPost.author} in r/{selectedPost.subreddit}.</p>
                      </div>
                      <button
                        onClick={() => handleGenerate(selectedPost)}
                        className="bg-slate-900 text-white px-10 py-4 rounded-[1.5rem] font-bold hover:bg-orange-600 transition-all shadow-xl active:scale-95"
                      >
                        Start AI Generation
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div >
  );
};
