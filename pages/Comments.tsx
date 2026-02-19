
import React, { useState, useEffect, useRef } from 'react';
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
  ThumbsUp,
  Crown,
  Type,
  Smile,
  ShieldCheck,
  Copy,
  ChevronDown,
  Target,
  Hash,
  Database,
  Zap,
  MoreVertical,
  Globe,
  ChevronRight,
  Quote,
  Wand2,
  Check,
  X,
  Building2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { RedditPost, GeneratedReply } from '../types';
import { generateRedditReply, fetchBrandProfile, BrandProfile } from '../services/geminiService';
import { useAuth } from '../context/AuthContext';
import CreditsBanner from '../components/CreditsBanner';

const PROGRESS_STEPS = [
  { message: 'Scanning the post context...', icon: '🔍', duration: 1000 },
  { message: 'Crafting your reply strategy...', icon: '🧠', duration: 1400 },
  { message: 'Writing the perfect comment...', icon: '✍️', duration: 1800 },
  { message: 'Optimizing for engagement...', icon: '🚀', duration: 1200 },
  { message: 'Finalizing your reply...', icon: '✨', duration: 800 },
];

const MOCK_POSTS: RedditPost[] = [
  {
    id: '1',
    title: 'Looking for a tool to automate my Reddit outreach',
    author: 'startup_founder_99',
    subreddit: 'saas',
    ups: 154,
    num_comments: 42,
    selftext: 'I spend 4 hours a day on Reddit trying to find leads. Is there any AI tool that can help me find relevant posts and draft replies?',
    url: 'https://reddit.com/r/saas/1',
    created_utc: Date.now() / 1000 - 3600
  },
  {
    id: '2',
    title: 'How do you handle growth marketing on a budget?',
    author: 'indie_maker_x',
    subreddit: 'marketing',
    ups: 89,
    num_comments: 15,
    selftext: 'I have $0 for ads. Currently trying to use community engagement but it is slow.',
    url: 'https://reddit.com/r/marketing/2',
    created_utc: Date.now() / 1000 - 7200
  },
  {
    id: '3',
    title: 'Show HN: My new tool for developers to track bugs',
    author: 'dev_alex',
    subreddit: 'sideproject',
    ups: 320,
    num_comments: 56,
    selftext: 'Built this because I was tired of Jira. What do you guys think?',
    url: 'https://reddit.com/r/sideproject/3',
    created_utc: Date.now() / 1000 - 10000
  },
  {
    id: '4',
    title: 'Best subreddits for early stage startups?',
    author: 'builder_jane',
    subreddit: 'startups',
    ups: 45,
    num_comments: 8,
    selftext: 'Need places where I can get honest feedback without being banned for self-promo.',
    url: 'https://reddit.com/r/startups/4',
    created_utc: Date.now() / 1000 - 15000
  }
];

export const Comments: React.FC = () => {
  const { user, updateUser } = useAuth();
  const replyCardRef = useRef<HTMLDivElement>(null);
  const [posts, setPosts] = useState<RedditPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<RedditPost | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [targetSubreddit, setTargetSubreddit] = useState('saas');
  const [searchKeywords, setSearchKeywords] = useState('');
  const [generatedReply, setGeneratedReply] = useState<GeneratedReply | null>(null);
  const [editedComment, setEditedComment] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  const [progressStep, setProgressStep] = useState(0);

  // Wizard State
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [costs, setCosts] = useState({ comment: 1, post: 2, image: 5 });

  useEffect(() => {
    fetch('/api/config')
      .then(res => res.json())
      .then(data => {
        if (data.creditCosts) setCosts(data.creditCosts);
      })
      .catch(console.error);
  }, []);
  const [wizardData, setWizardData] = useState({
    tone: 'helpful_peer',
    goal: 'help',
    productMention: '',
    productLink: '',
    description: '',
    targetAudience: ''
  });
  const [showBrandOverride, setShowBrandOverride] = useState(false);
  const [brandProfile, setBrandProfile] = useState<BrandProfile>({});
  const [language, setLanguage] = useState('English');

  const [activeTone, setActiveTone] = useState<'helpful_peer' | 'thought_leader' | 'skeptic' | 'storyteller'>(wizardData.tone as any);

  // Mock credit system for Free plan
  const isLimitReached = (user?.credits || 0) <= 0;

  const [isRedditConnected, setIsRedditConnected] = useState<boolean | null>(null);

  // Cycle progress steps while generating
  useEffect(() => {
    if (!isGenerating) { setProgressStep(0); return; }
    let current = 0;
    const cycle = () => {
      if (current < PROGRESS_STEPS.length - 1) {
        current++;
        setProgressStep(current);
        setTimeout(cycle, PROGRESS_STEPS[current].duration);
      }
    };
    setTimeout(cycle, PROGRESS_STEPS[0].duration);
  }, [isGenerating]);

  const handleGenerate = async (post: RedditPost, customSettings?: any) => {
    if ((user?.credits || 0) < costs.comment && user?.role !== 'admin') {
      setToast({ message: `Insufficient credits. You need ${costs.comment} points.`, type: 'error' });
      return;
    }

    setSelectedPost(post);
    setIsGenerating(true);
    setGeneratedReply(null);
    setIsWizardOpen(false);



    try {
      const tone = customSettings?.tone || wizardData.tone;
      const goal = customSettings?.goal || wizardData.goal;
      const product = customSettings?.productMention || wizardData.productMention;
      const link = customSettings?.productLink || wizardData.productLink;

      // Build override profile from wizard fields (only used when no saved profile or to override)
      const overrideProfile: Partial<BrandProfile> = {
        brandName: product || undefined,
        website: link || undefined,
        description: wizardData.description || undefined,
        targetAudience: wizardData.targetAudience || undefined,
      };

      const context = `Tone: ${tone}, Goal: ${goal}${product ? `, Product to mention: ${product}` : ''}${link ? `, Product URL: ${link}` : ''}`;
      const reply = await generateRedditReply(post, post.subreddit, tone, context, user?.id, overrideProfile, language);

      setGeneratedReply(reply);
      setEditedComment(reply.comment);
      setToast({ message: 'AI Reply Generated!', type: 'success' });

      // Synchronize credits from backend response
      if (reply.credits !== undefined) {
        updateUser({ credits: reply.credits });
      }

      // Scroll to reply card after a short delay
      setTimeout(() => {
        replyCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    } catch (err: any) {
      console.error(err);
      if (err.message === 'OUT_OF_CREDITS') {
        setToast({ message: 'Credits exhausted. Please upgrade your plan.', type: 'error' });
      } else {
        setToast({ message: 'Generation failed. Check API configuration.', type: 'error' });
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRefine = async (instruction: string) => {
    if (!selectedPost || !generatedReply) return;

    // Frontend pre-check
    if ((user?.credits || 0) < costs.comment && user?.role !== 'admin') {
      setToast({ message: `Insufficient credits. You need ${costs.comment} points.`, type: 'error' });
      return;
    }

    setIsGenerating(true);
    try {
      const reply = await generateRedditReply(selectedPost, selectedPost.subreddit, instruction, `Refine this reply: "${editedComment}". Instruction: ${instruction}`, user?.id);
      setGeneratedReply(reply);
      setEditedComment(reply.comment);
      if (reply.credits !== undefined) {
        updateUser({ credits: reply.credits });
      }
    } catch (err: any) {
      console.error(err);
      if (err.message === 'OUT_OF_CREDITS') {
        setToast({ message: 'Credits exhausted.', type: 'error' });
      } else {
        setToast({ message: 'Refinement failed.', type: 'error' });
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePost = async () => {
    if (!selectedPost || !editedComment || !user?.id) return;

    setIsPosting(true);
    try {
      const response = await fetch('/api/reddit/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          postId: selectedPost.id,
          comment: editedComment,
          postTitle: selectedPost.title,
          postUrl: selectedPost.url,
          postContent: selectedPost.selftext,
          subreddit: selectedPost.subreddit,
          productMention: wizardData.productMention
        })
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to post reply');
        } else {
          const errorText = await response.text();
          console.error('Non-JSON Error Response:', errorText);
          throw new Error(`Server Error (${response.status}): The server returned an unexpected response format.`);
        }
      }

      setToast({ message: 'Successfully deployed to Reddit!', type: 'success' });
      setSelectedPost(null);
      setGeneratedReply(null);
    } catch (err: any) {
      console.error(err);
      setToast({ message: err.message, type: 'error' });
    } finally {
      setIsPosting(false);
    }
  };

  const handleRedditAuth = async () => {
    try {
      const response = await fetch('/api/auth/reddit/url');
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      setToast({ message: 'Failed to start Reddit authentication', type: 'error' });
    }
  };

  const fetchPosts = async () => {
    if (!user?.id) return;

    setIsFetching(true);
    try {
      const response = await fetch(`/api/reddit/posts?subreddit=${targetSubreddit}&keywords=${searchKeywords}&userId=${user.id}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch posts');
      }
      const data = await response.json();
      setPosts(data);
      if (data.length > 0) setSelectedPost(data[0]);
      setToast({ message: `Found ${data.length} fresh opportunities!`, type: 'success' });
    } catch (err: any) {
      console.warn('[Reddit] API call failed, falling back to mock data:', err.message);
      setPosts(MOCK_POSTS);
      if (MOCK_POSTS.length > 0) setSelectedPost(MOCK_POSTS[0]);
      setToast({ message: 'Using simulated data (Link Reddit for live feed)', type: 'error' });
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchPosts();
      // Load brand profile for wizard
      fetchBrandProfile(user.id).then(p => {
        if (p?.brandName) setBrandProfile(p);
      });
    }

    // Check for callback status
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'reddit_connected') {
      setToast({ message: 'Reddit account linked successfully!', type: 'success' });
      window.history.replaceState({}, document.title, "/comment-agent");
    } else if (params.get('error') === 'reddit_auth_failed') {
      setToast({ message: 'Reddit account linking failed.', type: 'error' });
      window.history.replaceState({}, document.title, "/comment-agent");
    }
  }, [user]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  return (
    <>
      {/* Toast — outside wrapper so space-y-10 doesn't create a top gap */}
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
      {/* Generating Overlay */}
      {isGenerating && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center">
          <div className="bg-white rounded-[3rem] p-14 max-w-md w-full mx-6 shadow-2xl text-center space-y-8">
            <div className="relative w-24 h-24 mx-auto">
              <div className="absolute inset-0 rounded-full bg-orange-100 animate-ping opacity-60" />
              <div className="relative w-24 h-24 bg-orange-600 rounded-full flex items-center justify-center text-4xl shadow-2xl shadow-orange-300">
                {PROGRESS_STEPS[progressStep]?.icon}
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-2xl font-extrabold text-slate-900">
                {PROGRESS_STEPS[progressStep]?.message}
              </p>
              <p className="text-slate-400 font-medium text-sm">Powered by AI · Please wait</p>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-orange-600 rounded-full transition-all duration-1000"
                style={{ width: `${((progressStep + 1) / PROGRESS_STEPS.length) * 100}%` }}
              />
            </div>
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
              Step {progressStep + 1} of {PROGRESS_STEPS.length}
            </p>
          </div>
        </div>
      )}
      {/* Reply Wizard Modal */}
      {isWizardOpen && selectedPost && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200">
            <div className="bg-slate-50 p-8 border-b border-slate-100 flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <Wand2 className="text-orange-600" size={24} />
                  Reply Wizard
                </h3>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Step {wizardStep} of 2</p>
              </div>
              <button onClick={() => setIsWizardOpen(false)} className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors shadow-sm border border-slate-100">
                <X size={20} />
              </button>
            </div>

            <div className="p-8">
              {wizardStep === 1 ? (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <label className="text-sm font-black text-slate-900 px-1">Choose your tone</label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { id: 'helpful_peer', label: 'Helpful Peer', desc: 'Casual & Personal', icon: Smile },
                        { id: 'thought_leader', label: 'Thought Leader', desc: 'Structured & Deep', icon: Crown },
                        { id: 'skeptic', label: 'The Skeptic', desc: 'Contrarian & Smart', icon: Zap },
                        { id: 'storyteller', label: 'Storyteller', desc: 'Personal Journey', icon: Quote }
                      ].map(t => (
                        <button
                          key={t.id}
                          onClick={() => setWizardData({ ...wizardData, tone: t.id })}
                          className={`p-4 rounded-2xl border-2 text-left transition-all ${wizardData.tone === t.id ? 'border-orange-500 bg-orange-50/30' : 'border-slate-100 hover:border-slate-200'}`}
                        >
                          <t.icon size={18} className={wizardData.tone === t.id ? 'text-orange-600' : 'text-slate-400'} />
                          <p className="font-bold text-slate-900 mt-2 text-sm">{t.label}</p>
                          <p className="text-[10px] text-slate-400 font-medium">{t.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => setWizardStep(2)}
                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-orange-600 transition-all flex items-center justify-center gap-2"
                  >
                    NEXT STEP <ChevronRight size={18} />
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <label className="text-sm font-black text-slate-900 px-1">Response Goal</label>
                    <div className="flex gap-2">
                      {['help', 'question', 'feedback', 'pitch'].map(g => (
                        <button
                          key={g}
                          onClick={() => setWizardData({ ...wizardData, goal: g })}
                          className={`flex-1 py-2 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all ${wizardData.goal === g ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-100 hover:border-slate-200'}`}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Brand Override — Smart */}
                  {brandProfile.brandName ? (
                    <div className="rounded-2xl border-2 border-green-100 overflow-hidden">
                      {/* Active Badge */}
                      <div className="flex items-center justify-between px-4 py-3 bg-green-50">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 bg-green-600 rounded-xl flex items-center justify-center">
                            <Building2 size={13} className="text-white" />
                          </div>
                          <div>
                            <p className="text-[9px] font-black text-green-700 uppercase tracking-widest">Brand Profile Active</p>
                            <p className="font-extrabold text-slate-900 text-xs">{brandProfile.brandName}</p>
                          </div>
                          <span className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-0.5 rounded-lg text-[9px] font-black">
                            <Check size={9} /> Auto-applied
                          </span>
                        </div>
                        <button
                          onClick={() => setShowBrandOverride(v => !v)}
                          className="flex items-center gap-1 text-[10px] font-black text-slate-400 hover:text-orange-600 transition-colors"
                        >
                          <ChevronDown size={12} className={`transition-transform ${showBrandOverride ? 'rotate-180' : ''}`} />
                          {showBrandOverride ? 'Hide' : 'Override'}
                        </button>
                      </div>
                      {/* Collapsible Override — all 4 fields */}
                      {showBrandOverride && (
                        <div className="p-4 bg-white border-t border-green-100 space-y-3">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Override for this comment only — leave blank to use Profile defaults</p>
                          <input
                            type="text"
                            value={wizardData.productMention}
                            onChange={(e) => setWizardData({ ...wizardData, productMention: e.target.value })}
                            className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:border-orange-500 font-bold text-sm"
                            placeholder={`Brand Name (default: ${brandProfile.brandName})`}
                          />
                          <textarea
                            rows={2}
                            value={wizardData.description}
                            onChange={(e) => setWizardData({ ...wizardData, description: e.target.value })}
                            className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:border-orange-500 font-medium text-sm resize-none"
                            placeholder={`What does it do? (default: ${brandProfile.description || 'From your Brand Profile'})`}
                          />
                          <input
                            type="text"
                            value={wizardData.targetAudience}
                            onChange={(e) => setWizardData({ ...wizardData, targetAudience: e.target.value })}
                            className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:border-orange-500 font-bold text-sm"
                            placeholder={`Target Audience (default: ${brandProfile.targetAudience || 'From your Brand Profile'})`}
                          />
                          <input
                            type="url"
                            value={wizardData.productLink}
                            onChange={(e) => setWizardData({ ...wizardData, productLink: e.target.value })}
                            className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:border-orange-500 font-bold text-sm"
                            placeholder={`URL (default: ${brandProfile.website || 'Not set'})`}
                          />
                        </div>
                      )}

                    </div>
                  ) : (
                    /* No Brand Profile — show Quick Override with full fields */
                    <div className="rounded-2xl border-2 border-orange-100 overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-3 bg-orange-50">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 bg-orange-500 rounded-xl flex items-center justify-center">
                            <Building2 size={13} className="text-white" />
                          </div>
                          <div>
                            <p className="text-[9px] font-black text-orange-600 uppercase tracking-widest">Quick Brand Override</p>
                            <p className="text-[10px] text-slate-500 font-medium">Fill in for richer AI output</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Link to="/settings" className="text-[9px] font-black text-slate-400 hover:text-orange-600">Save permanently →</Link>
                          <button
                            onClick={() => setShowBrandOverride(v => !v)}
                            className="flex items-center gap-1 text-[10px] font-black text-slate-400 hover:text-orange-600 transition-colors"
                          >
                            <ChevronDown size={12} className={`transition-transform ${showBrandOverride ? 'rotate-180' : ''}`} />
                            {showBrandOverride ? 'Hide' : 'Fill in'}
                          </button>
                        </div>
                      </div>
                      {showBrandOverride && (
                        <div className="p-4 bg-white border-t border-orange-100 space-y-3">
                          <input
                            type="text"
                            value={wizardData.productMention}
                            onChange={(e) => setWizardData({ ...wizardData, productMention: e.target.value })}
                            className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:border-orange-500 font-bold text-sm"
                            placeholder="Brand / Product Name (e.g. Redigo)"
                          />
                          <textarea
                            rows={2}
                            value={wizardData.description}
                            onChange={(e) => setWizardData({ ...wizardData, description: e.target.value })}
                            className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:border-orange-500 font-medium text-sm resize-none"
                            placeholder="What does it do? (e.g. AI-powered Reddit outreach tool for SaaS founders)"
                          />
                          <input
                            type="text"
                            value={wizardData.targetAudience}
                            onChange={(e) => setWizardData({ ...wizardData, targetAudience: e.target.value })}
                            className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:border-orange-500 font-bold text-sm"
                            placeholder="Target Audience (e.g. SaaS founders, indie hackers)"
                          />
                          <input
                            type="url"
                            value={wizardData.productLink}
                            onChange={(e) => setWizardData({ ...wizardData, productLink: e.target.value })}
                            className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:border-orange-500 font-bold text-sm"
                            placeholder="Website URL (optional)"
                          />
                        </div>
                      )}
                    </div>
                  )}


                  {/* Language Selector */}
                  <div className="space-y-2">
                    <label className="text-sm font-black text-slate-900 px-1 flex items-center gap-2">
                      <Globe size={14} className="text-orange-600" />
                      Output Language
                    </label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full p-3 bg-white border border-slate-200 rounded-2xl font-bold text-sm text-slate-700 focus:outline-none focus:border-orange-500 cursor-pointer"
                    >
                      <option value="English">🇺🇸 English</option>
                      <option value="Arabic">🇸🇦 Arabic (العربية)</option>
                      <option value="French">🇫🇷 French (Français)</option>
                      <option value="Spanish">🇪🇸 Spanish (Español)</option>
                      <option value="German">🇩🇪 German (Deutsch)</option>
                      <option value="Portuguese">🇧🇷 Portuguese (Português)</option>
                      <option value="Italian">🇮🇹 Italian (Italiano)</option>
                      <option value="Dutch">🇳🇱 Dutch (Nederlands)</option>
                      <option value="Turkish">🇹🇷 Turkish (Türkçe)</option>
                      <option value="Japanese">🇯🇵 Japanese (日本語)</option>
                      <option value="Korean">🇰🇷 Korean (한국어)</option>
                      <option value="Chinese">🇨🇳 Chinese (中文)</option>
                    </select>
                  </div>

                  <div className="flex gap-3">
                    <button onClick={() => setWizardStep(1)} className="px-6 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black hover:bg-slate-200 transition-all">BACK</button>
                    <button
                      onClick={() => handleGenerate(selectedPost)}
                      className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-orange-600 transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-2"
                    >
                      GENERATE REPLY ({costs.comment} POINTS) <Check size={18} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-10 animate-fade-in font-['Outfit'] pt-4">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-slate-100">
          <div className="space-y-1">
            <p className="text-slate-400 font-semibold text-sm">Welcome back, {user?.name?.split(' ')[0] || 'there'}</p>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-7 bg-orange-600 rounded-full" />
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Comment Agent</h1>
            </div>
            <p className="text-slate-400 font-medium text-sm pl-4">Opportunities matching your <span className="text-orange-600">marketing signals</span>.</p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
            {/* Inputs row */}
            <div className="flex items-center gap-0 bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden flex-1 sm:flex-none">
              <div className="relative flex items-center flex-1 sm:flex-none">
                <Target className="absolute left-3 text-slate-400 shrink-0" size={14} />
                <input
                  type="text"
                  value={targetSubreddit}
                  onChange={(e) => setTargetSubreddit(e.target.value)}
                  placeholder="Subreddit..."
                  className="pl-8 pr-3 py-2.5 bg-transparent focus:outline-none font-bold text-xs w-full sm:w-28 text-slate-700"
                />
              </div>
              <div className="w-[1px] h-6 bg-slate-100 shrink-0" />
              <div className="relative flex items-center flex-1 sm:flex-none">
                <Hash className="absolute left-3 text-slate-400 shrink-0" size={14} />
                <input
                  type="text"
                  value={searchKeywords}
                  onChange={(e) => setSearchKeywords(e.target.value)}
                  placeholder="Keywords..."
                  className="pl-8 pr-3 py-2.5 bg-transparent focus:outline-none font-bold text-xs w-full sm:w-40 text-slate-700"
                />
              </div>
            </div>
            {/* Buttons row */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleRedditAuth}
                className="flex-1 sm:flex-none p-2 px-3 bg-orange-50 text-orange-600 border border-orange-100 rounded-xl text-[10px] font-black hover:bg-orange-100 transition-all flex items-center justify-center gap-1.5"
                title="Link your Reddit account for 100% reliable data"
              >
                <Globe size={12} />
                <span>Link Account</span>
              </button>
              <button
                onClick={fetchPosts}
                disabled={isFetching}
                className="flex-1 sm:flex-none bg-slate-900 text-white p-2 px-4 rounded-xl text-[10px] font-black hover:bg-orange-600 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <RefreshCw size={12} className={isFetching ? 'animate-spin' : ''} />
                <span>Reload Feed</span>
              </button>
            </div>
          </div>
        </div>

        {/* Reply Wizard Modal */}

        {/* Credits Status Banner */}
        <CreditsBanner
          plan={user?.plan || 'Free'}
          credits={user?.credits || 0}
        />

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
          {/* Posts List */}
          <div className="xl:col-span-8 space-y-5">
            {posts.map(post => (
              <div
                key={post.id}
                className={`p-6 rounded-[2rem] transition-all duration-500 border-2 relative group overflow-hidden ${selectedPost?.id === post.id
                  ? 'border-orange-500 bg-orange-50/10 shadow-2xl shadow-orange-100/40 translate-x-1'
                  : 'border-slate-100 bg-white hover:border-slate-200 hover:shadow-xl hover:shadow-slate-100'
                  }`}
                onClick={() => setSelectedPost(post)}
              >
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                  {/* Score Circular Meter */}
                  <div className="hidden md:flex flex-col items-center gap-1 shrink-0">
                    <div className="relative w-14 h-14 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-100" />
                        <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="4" fill="transparent"
                          strokeDasharray={2 * Math.PI * 24}
                          strokeDashoffset={2 * Math.PI * 24 * (1 - (post as any).opportunityScore / 100)}
                          className={`${(post as any).opportunityScore > 70 ? 'text-orange-500' : (post as any).opportunityScore > 40 ? 'text-blue-500' : 'text-slate-400'} transition-all duration-1000`}
                        />
                      </svg>
                      <span className="absolute text-[11px] font-black text-slate-900">{(post as any).opportunityScore}%</span>
                    </div>
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Opportunity</span>
                  </div>

                  <div className="flex-1 space-y-4">
                    <div className="flex items-center flex-wrap gap-2">
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-orange-100/50 rounded-full border border-orange-200">
                        <Flame size={12} className="text-orange-600" />
                        <span className="text-[10px] font-extrabold text-orange-600 uppercase tracking-widest">r/{post.subreddit}</span>
                      </div>

                      {/* Intent Tag */}
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 rounded-full border border-blue-100">
                        <Target size={12} className="text-blue-600" />
                        <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-widest">{(post as any).intent || 'General'}</span>
                      </div>

                      {/* Competitor Alert */}
                      {(post as any).competitors?.length > 0 && (
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-red-50 rounded-full border border-red-100 animate-pulse">
                          <AlertCircle size={12} className="text-red-600" />
                          <span className="text-[10px] font-extrabold text-red-600 uppercase tracking-widest">Competitor Mention</span>
                        </div>
                      )}
                    </div>

                    <h3 className="text-xl font-bold text-slate-900 leading-snug group-hover:text-orange-600 transition-colors">{post.title}</h3>
                    <p className="text-slate-500 text-sm line-clamp-2 leading-relaxed font-medium">{post.selftext}</p>

                    <div className="flex items-center gap-5 pt-1">
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl">
                        <ThumbsUp size={14} className="text-slate-400" />
                        <span className="text-xs font-bold text-slate-700">{post.ups.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl">
                        <MessageSquarePlus size={14} className="text-slate-400" />
                        <span className="text-xs font-bold text-slate-700">{post.num_comments}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-row md:flex-col gap-3 w-full md:w-auto shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedPost(post); setWizardStep(1); setIsWizardOpen(true); }}
                      className="flex-1 md:flex-none bg-slate-900 text-white px-6 py-3.5 rounded-[1.25rem] text-sm font-bold hover:bg-orange-600 transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95"
                    >
                      <Wand2 size={16} />
                      Wizard Reply
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Action Panel / AI View */}
          <div className="xl:col-span-4">
            <div className="sticky top-6 bg-white rounded-3xl border border-slate-200/60 shadow-xl shadow-slate-200/20 overflow-hidden flex flex-col min-h-[500px]">
              <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                <h2 className="font-bold text-base flex items-center gap-2">
                  <div className="w-8 h-8 bg-slate-900 rounded-xl flex items-center justify-center text-white">
                    <Sparkles size={16} />
                  </div>
                  Assistant
                </h2>
                <span className="text-[9px] font-extrabold text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-100 uppercase tracking-widest">v2.0</span>
              </div>

              <div className="p-5 flex-1 flex flex-col">
                {!selectedPost ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 opacity-60">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 border border-slate-100">
                      <MessageSquarePlus size={32} />
                    </div>
                    <div className="space-y-1 px-4">
                      <p className="text-slate-900 text-base font-bold">No selection</p>
                      <p className="text-slate-400 text-xs font-medium">Click a post to begin crafting.</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Current Post</p>
                      <p className="text-sm font-bold text-slate-900 leading-tight line-clamp-2">{selectedPost.title}</p>
                    </div>

                    {!generatedReply && !isGenerating && (
                      <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 py-6 border-2 border-dashed border-slate-100 rounded-[2rem] bg-slate-50/30">
                        <div className="w-16 h-16 bg-white rounded-[2rem] flex items-center justify-center text-orange-600 shadow-xl shadow-orange-100/50 border border-orange-50">
                          <Wand2 size={32} />
                        </div>
                        <div className="space-y-1">
                          <p className="text-lg font-black text-slate-900">Engage Smarter</p>
                          <p className="text-slate-400 text-xs font-semibold px-6 leading-relaxed">Customize your reply strategy with our advanced Wizard.</p>
                        </div>
                        <button
                          onClick={() => { setWizardStep(1); setIsWizardOpen(true); }}
                          className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black hover:bg-orange-600 transition-all shadow-xl shadow-slate-200 active:scale-95 text-xs flex items-center gap-2 group"
                        >
                          LAUNCH REPLY WIZARD
                          <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                      </div>
                    )}


                    {generatedReply && !isGenerating && (
                      <div ref={replyCardRef} className="flex-1 flex flex-col space-y-6 animate-in fade-in duration-500">
                        {/* Live Reddit Preview */}
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Thread Preview</label>
                          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 relative">
                            <div className="flex gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-200 shrink-0 overflow-hidden flex items-center justify-center">
                                <Smile size={18} className="text-slate-400" />
                              </div>
                              <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-black text-slate-900">u/{user?.name || 'User'}</span>
                                  <span className="text-[10px] text-slate-400">just now</span>
                                </div>
                                <div className="text-xs text-slate-600 leading-relaxed italic border-l-2 border-slate-200 pl-3">
                                  {editedComment}
                                </div>
                                <div className="flex items-center gap-4 pt-1">
                                  <div className="flex items-center gap-1.5 text-slate-400">
                                    <ThumbsUp size={10} />
                                    <span className="text-[10px] font-bold">Vote</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 text-slate-400">
                                    <MessageSquarePlus size={10} />
                                    <span className="text-[10px] font-bold">Reply</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2 group relative">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Edit Response</label>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(editedComment);
                                setToast({ message: 'Copied to clipboard!', type: 'success' });
                              }}
                              className="p-1 px-2 hover:bg-slate-100 rounded text-[10px] font-bold text-slate-500 flex items-center gap-1 transition-colors"
                            >
                              <Copy size={12} /> Copy
                            </button>
                          </div>
                          <textarea
                            className="w-full min-h-[140px] p-4 bg-white border border-slate-200 rounded-2xl text-slate-700 text-sm font-medium focus:ring-2 focus:ring-orange-50 focus:border-orange-500 focus:outline-none transition-all custom-scrollbar leading-relaxed"
                            value={editedComment}
                            onChange={(e) => setEditedComment(e.target.value)}
                          />
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleGenerate(selectedPost, activeTone)}
                            className="flex-1 flex items-center justify-center gap-1.5 p-2 bg-white border border-slate-100 rounded-xl text-[11px] font-bold text-slate-600 hover:border-orange-200 transition-all"
                          >
                            <RefreshCw size={12} /> Regenerate
                          </button>
                          <button
                            onClick={() => handleRefine("Make it much shorter and concise")}
                            className="flex-1 flex items-center justify-center gap-1.5 p-2 bg-white border border-slate-100 rounded-xl text-[11px] font-bold text-slate-600 hover:border-orange-200 transition-all"
                          >
                            <Type size={12} /> Make Shorter
                          </button>
                        </div>

                        <div className="pt-2 mt-auto">
                          <button
                            onClick={handlePost}
                            disabled={isPosting}
                            className="w-full bg-slate-900 text-white py-3.5 rounded-2xl font-bold hover:bg-orange-600 transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95 disabled:opacity-50 text-sm"
                          >
                            {isPosting ? <RefreshCw className="animate-spin" size={16} /> : <Send size={16} />}
                            Deploy to Reddit
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
