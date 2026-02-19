
import React, { useState, useEffect } from 'react';
import { generateRedditPost, fetchBrandProfile, BrandProfile } from '../services/geminiService';
import {
    PenTool,
    Sparkles,
    Image as ImageIcon,
    Send,
    ArrowRight,
    Check,
    Target,
    Zap,
    RefreshCw,
    Link as LinkIcon,
    Tag,
    Users,
    Lightbulb,
    MessageSquare,
    BookOpen,
    ChevronDown,
    ChevronUp,
    Building2,
    Settings,
    Trash2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import CreditsBanner from '../components/CreditsBanner';

const PROGRESS_STEPS = [
    { message: 'Analyzing your target community...', icon: '🔍', duration: 1200 },
    { message: 'Crafting your viral headline...', icon: '✍️', duration: 1500 },
    { message: 'Writing the thread body...', icon: '📝', duration: 2400 },
    { message: 'Polishing for maximum engagement...', icon: '✨', duration: 1200 },
];

const TONES = [
    {
        id: 'helpful_peer',
        label: 'Helpful Peer',
        desc: 'Friendly & relatable, like sharing a discovery with a friend',
        icon: Users,
        color: 'blue'
    },
    {
        id: 'thought_leader',
        label: 'Thought Leader',
        desc: 'Structured insights with bullet points & deep expertise',
        icon: Lightbulb,
        color: 'purple'
    },
    {
        id: 'storyteller',
        label: 'Storyteller',
        desc: 'Opens with a personal anecdote to build emotional connection',
        icon: BookOpen,
        color: 'green'
    },
    {
        id: 'skeptic',
        label: 'Skeptic',
        desc: 'Challenges common assumptions, then offers your solution',
        icon: MessageSquare,
        color: 'orange'
    },
];

const toneColorMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200 group-hover:border-blue-400',
    purple: 'bg-purple-50 text-purple-600 border-purple-200 group-hover:border-purple-400',
    green: 'bg-green-50 text-green-600 border-green-200 group-hover:border-green-400',
    orange: 'bg-orange-50 text-orange-600 border-orange-200 group-hover:border-orange-400',
};

const toneActiveMap: Record<string, string> = {
    blue: 'border-blue-500 bg-blue-50 shadow-lg shadow-blue-100',
    purple: 'border-purple-500 bg-purple-50 shadow-lg shadow-purple-100',
    green: 'border-green-500 bg-green-50 shadow-lg shadow-green-100',
    orange: 'border-orange-500 bg-orange-50 shadow-lg shadow-orange-100',
};

export const ContentArchitect: React.FC = () => {
    const { user, updateUser } = useAuth();
    const [step, setStep] = useState(1);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);
    const [isPosting, setIsPosting] = useState(false);
    const [progressStep, setProgressStep] = useState(0);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [brandProfile, setBrandProfile] = useState<BrandProfile>({});
    const [showBrandOverride, setShowBrandOverride] = useState(false);
    const [language, setLanguage] = useState('English');

    const [postData, setPostData] = useState({
        subreddit: '',
        goal: 'Engagement',
        tone: 'helpful_peer',
        title: '',
        content: '',
        imagePrompt: '',
        imageUrl: '',
        productMention: '',
        productUrl: '',
        description: '',
        targetAudience: ''
    });
    const [redditStatus, setRedditStatus] = useState<{ connected: boolean; accounts: any[] }>({ connected: false, accounts: [] });
    const [selectedAccount, setSelectedAccount] = useState<string>('');

    const [includeImage, setIncludeImage] = useState(true);
    const [costs, setCosts] = useState({ comment: 1, post: 2, image: 5 });
    const [showRegenConfirm, setShowRegenConfirm] = useState(false);
    const [regenMode, setRegenMode] = useState<'text' | 'image' | 'both'>('text');
    const [showDraftBanner, setShowDraftBanner] = useState(false);
    const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

    useEffect(() => {
        fetch('/api/config')
            .then(res => res.json())
            .then(data => {
                console.log('Fetched Config:', data);
                if (data.creditCosts) {
                    const mergedCosts = {
                        comment: Number(data.creditCosts.comment) || 1,
                        post: Number(data.creditCosts.post) || 2,
                        image: Number(data.creditCosts.image) || 5
                    };
                    console.log('Applied Costs:', mergedCosts);
                    setCosts(mergedCosts);
                }
            })
            .catch(err => console.error('Config fetch failed:', err));
    }, []);

    // Load brand profile on mount
    useEffect(() => {
        if (user?.id) {
            fetchBrandProfile(user.id).then(p => {
                if (p?.brandName) setBrandProfile(p);
            });
            fetch(`/api/user/reddit/status?userId=${user.id}`)
                .then(res => res.json())
                .then(status => {
                    setRedditStatus(status);
                    if (status.accounts?.length > 0) {
                        setSelectedAccount(status.accounts[0].username);
                    }
                });
        }
    }, [user]);

    // Check for draft on mount
    useEffect(() => {
        const savedDraft = localStorage.getItem('redigo_post_draft');
        if (savedDraft) {
            try {
                const draft = JSON.parse(savedDraft);
                if (draft.title || draft.content) {
                    setShowDraftBanner(true);
                }
            } catch (e) {
                localStorage.removeItem('redigo_post_draft');
            }
        }
    }, []);

    // Auto-save effect
    useEffect(() => {
        if (postData.title || postData.content) {
            localStorage.setItem('redigo_post_draft', JSON.stringify({
                ...postData,
                step: step
            }));
        }
    }, [postData, step]);

    const handleResumeDraft = () => {
        const savedDraft = localStorage.getItem('redigo_post_draft');
        if (savedDraft) {
            const draft = JSON.parse(savedDraft);
            setPostData(draft);
            setStep(draft.step || 2);
            setShowDraftBanner(false);
            showToast('Draft restored! Continuing from where you left off.', 'success');
        }
    };

    const handleDiscardDraft = () => {
        localStorage.removeItem('redigo_post_draft');
        setPostData({
            subreddit: '',
            goal: 'Engagement',
            tone: 'helpful_peer',
            title: '',
            content: '',
            imagePrompt: '',
            imageUrl: '',
            productMention: '',
            productUrl: '',
            description: '',
            targetAudience: ''
        });
        setStep(1);
        setShowDraftBanner(false);
        setShowDiscardConfirm(false);
        showToast('Draft discarded successfully.', 'success');
    };

    const goals = ['Engagement', 'Lead Gen', 'Problem Solving', 'Product Launch', 'Storytelling'];

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    // Cycle through progress messages while generating
    useEffect(() => {
        if (!isGenerating) {
            setProgressStep(0);
            return;
        }
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

    const triggerImageGeneration = async (prompt: string) => {
        if (!prompt || !user?.id) return;
        setIsGeneratingImage(true);
        setImageLoaded(false);
        // Reset image URL so the skeleton shows up immediately
        setPostData(prev => ({ ...prev, imageUrl: '' }));
        try {
            const response = await fetch('/api/generate-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt, userId: user.id })
            });
            if (!response.ok) throw new Error('Failed to generate image');
            const data = await response.json();
            setPostData(prev => ({ ...prev, imageUrl: data.url }));

            // Sync credits for image too
            if (data.credits !== undefined) {
                updateUser({ credits: data.credits });
            }
        } catch {
            // Image generation is optional
        } finally {
            setIsGeneratingImage(false);
        }
    };

    const handleGenerateContent = async (mode: 'text' | 'image' | 'both' = 'both') => {
        if (!postData.subreddit) return;

        const postCost = Number(costs.post) ?? 2;
        const imageCost = Number(costs.image) ?? 5;

        let totalCost = 0;
        if (mode === 'text') totalCost = postCost;
        else if (mode === 'image') totalCost = imageCost;
        else totalCost = includeImage ? (postCost + imageCost) : postCost;

        // Frontend pre-check
        if ((user?.credits || 0) < totalCost && user?.role !== 'admin') {
            showToast(`Insufficient credits. You need ${totalCost} credits for this action.`, 'error');
            return;
        }

        if (mode === 'image') {
            triggerImageGeneration(postData.imagePrompt);
            showToast('Regenerating image...', 'success');
            return;
        }

        setIsGenerating(true);
        setProgressStep(0);
        try {
            // Build override profile from any filled-in fields
            const overrideProfile: Partial<BrandProfile> = {
                brandName: postData.productMention || undefined,
                website: postData.productUrl || undefined,
                description: postData.description || undefined,
                targetAudience: postData.targetAudience || undefined,
            };

            const generated = await generateRedditPost(
                postData.subreddit,
                postData.goal,
                postData.tone,
                postData.productMention,
                postData.productUrl,
                user?.id,
                overrideProfile,
                language
            );

            setPostData(prev => ({
                ...prev,
                title: generated.title,
                content: generated.content,
                imagePrompt: generated.imagePrompt,
                imageUrl: mode === 'both' ? '' : prev.imageUrl
            }));

            // Synchronize credits
            if (generated.credits !== undefined) {
                updateUser({ credits: generated.credits });
            }

            setStep(2);
            // Non-blocking call: trigger image generation but don't AWAIT it
            if (mode === 'both' && includeImage) {
                triggerImageGeneration(generated.imagePrompt);
            }

            showToast('Content updated!', 'success');

        } catch (err: any) {
            console.error(err);
            if (err.message === 'OUT_OF_CREDITS') {
                showToast('Credits exhausted. Please upgrade your plan.', 'error');
            } else {
                showToast('AI generation failed. Please check your settings.', 'error');
            }
        } finally {
            setIsGenerating(false);
        }
    };

    const handlePost = async () => {
        if (!user?.id) return;
        setIsPosting(true);
        try {
            const response = await fetch('/api/reddit/post', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    subreddit: postData.subreddit,
                    title: postData.title,
                    text: postData.content,
                    kind: 'self',
                    redditUsername: selectedAccount
                })
            });
            if (!response.ok) throw new Error('Failed to post to Reddit');
            localStorage.removeItem('redigo_post_draft');
            showToast('Post successfully published to Reddit! 🎉', 'success');
        } catch (err: any) {
            showToast(err.message, 'error');
        } finally {
            setIsPosting(false);
        }
    };

    const currentTone = TONES.find(t => t.id === postData.tone);

    return (
        <>
            {/* Toast */}
            {toast && (
                <div className={`fixed top-10 right-10 z-[100] p-5 rounded-[2rem] shadow-2xl flex items-center gap-3 border ${toast.type === 'success' ? 'bg-green-600 text-white border-green-500' : 'bg-red-600 text-white border-red-500'
                    }`}>
                    {toast.type === 'success' ? <Check size={20} /> : <Zap size={20} />}
                    <span className="font-extrabold uppercase text-xs tracking-widest">{toast.message}</span>
                    <button onClick={() => setToast(null)} className="ml-4 opacity-70 hover:opacity-100 font-bold">✕</button>
                </div>
            )}

            {/* Generating Overlay */}
            {isGenerating && (
                <div className="fixed inset-0 z-[200] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] md:rounded-[3rem] p-8 md:p-14 max-w-md w-full shadow-2xl text-center space-y-8 animate-in zoom-in-95 duration-300">
                        <div className="relative w-20 h-20 md:w-24 md:h-24 mx-auto">
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
                        {/* Progress bar */}
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

            {/* Re-generate Confirmation Modal */}
            {showRegenConfirm && (
                <div className="fixed inset-0 z-[999] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] p-8 md:p-10 max-w-md w-full shadow-2xl space-y-8 animate-in zoom-in-95 duration-300">
                        <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center">
                                    <RefreshCw size={24} />
                                </div>
                                <h3 className="text-xl font-black text-slate-900">Regenerate Options</h3>
                            </div>
                            <button onClick={() => setShowRegenConfirm(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                        </div>

                        <div className="space-y-3">
                            {/* Option: Text Only */}
                            <button
                                onClick={() => setRegenMode('text')}
                                className={`w-full p-4 rounded-2xl border-2 transition-all text-left flex items-center justify-between ${regenMode === 'text' ? 'border-orange-500 bg-orange-50/50 shadow-md' : 'border-slate-100 bg-slate-50 hover:border-slate-200'}`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${regenMode === 'text' ? 'bg-orange-600 text-white' : 'bg-white text-slate-400 border border-slate-200'}`}>
                                        <PenTool size={18} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900">Text Only</p>
                                        <p className="text-xs text-slate-500 font-medium leading-relaxed">Refresh headline & body</p>
                                    </div>
                                </div>
                                <span className={`font-black text-xs ${regenMode === 'text' ? 'text-orange-600' : 'text-slate-400'}`}>{costs.post} PTS</span>
                            </button>

                            {/* Option: Image Only */}
                            <button
                                onClick={() => setRegenMode('image')}
                                className={`w-full p-4 rounded-2xl border-2 transition-all text-left flex items-center justify-between ${regenMode === 'image' ? 'border-orange-500 bg-orange-50/50 shadow-md' : 'border-slate-100 bg-slate-50 hover:border-slate-200'}`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${regenMode === 'image' ? 'bg-orange-600 text-white' : 'bg-white text-slate-400 border border-slate-200'}`}>
                                        <ImageIcon size={18} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900">Image Only</p>
                                        <p className="text-xs text-slate-500 font-medium leading-relaxed">New AI visual context</p>
                                    </div>
                                </div>
                                <span className={`font-black text-xs ${regenMode === 'image' ? 'text-orange-600' : 'text-slate-400'}`}>{costs.image} PTS</span>
                            </button>

                            {/* Option: Both */}
                            <button
                                onClick={() => setRegenMode('both')}
                                className={`w-full p-4 rounded-2xl border-2 transition-all text-left flex items-center justify-between ${regenMode === 'both' ? 'border-orange-500 bg-orange-50/50 shadow-md' : 'border-slate-100 bg-slate-50 hover:border-slate-200'}`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${regenMode === 'both' ? 'bg-orange-600 text-white' : 'bg-white text-slate-400 border border-slate-200'}`}>
                                        <Sparkles size={18} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900">Full Refresh</p>
                                        <p className="text-xs text-slate-500 font-medium leading-relaxed">New post + New image</p>
                                    </div>
                                </div>
                                <span className={`font-black text-xs ${regenMode === 'both' ? 'text-orange-600' : 'text-slate-400'}`}>{Number(costs.post) + Number(costs.image)} PTS</span>
                            </button>
                        </div>

                        <div className="flex gap-3 pt-4 border-t border-slate-50">
                            <button
                                onClick={() => setShowRegenConfirm(false)}
                                className="flex-1 py-4 bg-slate-50 text-slate-600 rounded-2xl font-bold hover:bg-slate-100 transition-all uppercase text-[10px] tracking-widest"
                            >
                                Nevermind
                            </button>
                            <button
                                onClick={() => {
                                    setShowRegenConfirm(false);
                                    handleGenerateContent(regenMode);
                                }}
                                className="flex-1 py-4 bg-orange-600 text-white rounded-2xl font-black shadow-lg shadow-orange-100 hover:bg-orange-700 transition-all uppercase text-[10px] tracking-widest flex items-center justify-center gap-2"
                            >
                                <Check size={14} /> Confirm & Pay
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Discard Draft Confirmation Modal */}
            {showDiscardConfirm && (
                <div className="fixed inset-0 z-[1000] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] p-8 md:p-10 max-w-sm w-full shadow-2xl text-center space-y-6 animate-in zoom-in-95 duration-300">
                        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
                            <Trash2 size={32} />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-black text-slate-900">Discard Current Draft?</h3>
                            <p className="text-slate-500 text-sm font-medium leading-relaxed">
                                If you discard this, you will need to <span className="text-orange-600 font-bold">regenerate</span> which will cost more points. This action cannot be undone.
                            </p>
                        </div>
                        <div className="flex flex-col gap-3 pt-2">
                            <button
                                onClick={handleDiscardDraft}
                                className="w-full py-4 bg-red-600 text-white rounded-2xl font-black shadow-lg shadow-red-100 hover:bg-red-700 transition-all"
                            >
                                YES, DISCARD DRAFT
                            </button>
                            <button
                                onClick={() => setShowDiscardConfirm(false)}
                                className="w-full py-4 bg-slate-50 text-slate-600 rounded-2xl font-bold hover:bg-slate-100 transition-all"
                            >
                                Keep it
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-6xl mx-auto space-y-10 font-['Outfit'] pb-20 pt-4">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-8">
                    <div className="space-y-1">
                        <p className="text-slate-400 font-semibold text-sm">Welcome back, {user?.name?.split(' ')[0] || 'there'}</p>
                        <div className="flex items-center gap-2">
                            <span className="w-1.5 h-7 bg-orange-600 rounded-full" />
                            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Post Agent</h1>
                        </div>
                        <p className="text-slate-400 font-medium text-sm pl-4">Design, generate &amp; publish viral Reddit threads in seconds.</p>
                    </div>

                    {/* Draft Banner */}
                    {showDraftBanner && (
                        <div className="flex-1 bg-gradient-to-r from-orange-50 to-white border-2 border-orange-100 rounded-[2rem] p-4 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in slide-in-from-top-4 duration-500">
                            <div className="flex items-center gap-4 pl-2">
                                <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <PenTool size={20} />
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-extrabold text-slate-900">Unfinished post found</p>
                                    <p className="text-[11px] text-slate-500 font-medium">Continue working to save your credits.</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setShowDiscardConfirm(true)}
                                    className="px-5 py-2.5 text-slate-400 hover:text-red-500 text-xs font-black uppercase tracking-widest transition-colors"
                                >
                                    Discard
                                </button>
                                <button
                                    onClick={handleResumeDraft}
                                    className="px-6 py-2.5 bg-orange-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-orange-100 hover:bg-orange-700 transition-all flex items-center gap-2"
                                >
                                    Resume Draft <ArrowRight size={14} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step Indicator */}
                    <div className="flex items-center gap-3">
                        {[{ n: 1, label: 'Setup' }, { n: 2, label: 'Edit' }, { n: 3, label: 'Publish' }].map((s, i) => (
                            <React.Fragment key={s.n}>
                                <div className="flex flex-col items-center gap-1">
                                    <div className={`w-10 h-10 rounded-full border-4 border-white flex items-center justify-center text-[11px] font-black shadow-sm transition-all ${step > s.n ? 'bg-green-500 text-white' :
                                        step === s.n ? 'bg-orange-600 text-white shadow-lg shadow-orange-200' :
                                            'bg-slate-100 text-slate-400'
                                        }`}>
                                        {step > s.n ? <Check size={14} /> : s.n}
                                    </div>
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{s.label}</span>
                                </div>
                                {i < 2 && <div className={`h-0.5 w-10 rounded-full transition-all duration-500 ${step > s.n ? 'bg-green-400' : 'bg-slate-100'}`} />}
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                <CreditsBanner
                    plan={user?.plan || 'Free'}
                    credits={user?.credits || 0}
                />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

                    {/* Left: Workspace */}
                    <div className="lg:col-span-7 space-y-8">

                        {/* STEP 1 */}
                        {step === 1 && (
                            <div className="bg-white p-10 rounded-[3rem] border border-slate-200/60 shadow-xl space-y-10">
                                <div className="space-y-8">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                                            <Target size={20} />
                                        </div>
                                        <h2 className="text-xl font-extrabold text-slate-900">Campaign Foundation</h2>
                                    </div>

                                    {/* Subreddit + Goal */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Target Community</label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black">r/</span>
                                                <input
                                                    type="text"
                                                    placeholder="saas, marketing, tech..."
                                                    className="w-full pl-9 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:border-orange-500 font-bold transition-all"
                                                    value={postData.subreddit}
                                                    onChange={(e) => setPostData({ ...postData, subreddit: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Content Goal</label>
                                            <select
                                                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:border-orange-500 font-bold appearance-none"
                                                value={postData.goal}
                                                onChange={(e) => setPostData({ ...postData, goal: e.target.value })}
                                            >
                                                {goals.map(g => <option key={g} value={g}>{g}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Brand Integration — Smart Override */}
                                    {brandProfile.brandName ? (
                                        <div className="rounded-3xl border-2 border-green-100 overflow-hidden">
                                            {/* Active Brand Badge */}
                                            <div className="flex items-center justify-between px-5 py-4 bg-green-50">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-green-600 rounded-xl flex items-center justify-center">
                                                        <Building2 size={14} className="text-white" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-green-700 uppercase tracking-widest">Brand Profile Active</p>
                                                        <p className="font-extrabold text-slate-900 text-sm">{brandProfile.brandName}</p>
                                                    </div>
                                                    <span className="flex items-center gap-1 bg-green-100 text-green-700 px-2.5 py-1 rounded-lg text-[10px] font-black">
                                                        <Check size={10} /> Auto-applied
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={() => setShowBrandOverride(v => !v)}
                                                    className="flex items-center gap-1.5 text-[11px] font-black text-slate-400 hover:text-orange-600 transition-colors"
                                                >
                                                    {showBrandOverride ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                                    {showBrandOverride ? 'Hide override' : 'Override for this post'}
                                                </button>
                                            </div>

                                            {/* Collapsible Override Panel */}
                                            {showBrandOverride && (
                                                <div className="p-5 bg-white border-t border-green-100 space-y-4">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                                        <Tag size={10} /> Override for this post only — leave blank to use Profile defaults
                                                    </p>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div className="space-y-1.5">
                                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Brand Name</label>
                                                            <input
                                                                type="text"
                                                                placeholder={`Default: ${brandProfile.brandName}`}
                                                                className="w-full p-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:border-orange-500 font-bold transition-all text-sm"
                                                                value={postData.productMention}
                                                                onChange={(e) => setPostData({ ...postData, productMention: e.target.value })}
                                                            />
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                                                <LinkIcon size={10} /> Website URL
                                                            </label>
                                                            <input
                                                                type="text"
                                                                placeholder={`Default: ${brandProfile.website || 'Not set'}`}
                                                                className="w-full p-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:border-orange-500 font-bold transition-all text-sm"
                                                                value={postData.productUrl}
                                                                onChange={(e) => setPostData({ ...postData, productUrl: e.target.value })}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">What does it do? (override)</label>
                                                        <textarea
                                                            rows={2}
                                                            placeholder={`Default: ${brandProfile.description || 'From your Brand Profile'}`}
                                                            className="w-full p-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:border-orange-500 font-medium text-sm resize-none transition-all"
                                                            value={postData.description}
                                                            onChange={(e) => setPostData({ ...postData, description: e.target.value })}
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Audience (override)</label>
                                                        <input
                                                            type="text"
                                                            placeholder={`Default: ${brandProfile.targetAudience || 'From your Brand Profile'}`}
                                                            className="w-full p-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:border-orange-500 font-bold transition-all text-sm"
                                                            value={postData.targetAudience}
                                                            onChange={(e) => setPostData({ ...postData, targetAudience: e.target.value })}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        /* No Brand Profile — Quick Override with full fields */
                                        <div className="rounded-3xl border-2 border-orange-100 overflow-hidden">
                                            <div className="flex items-center justify-between px-5 py-4 bg-orange-50">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-orange-500 rounded-xl flex items-center justify-center">
                                                        <Building2 size={14} className="text-white" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest">Quick Brand Override</p>
                                                        <p className="text-[11px] text-slate-500 font-medium">Fill in for richer, more personalized AI output</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <Link to="/settings" className="text-[10px] font-black text-slate-400 hover:text-orange-600 transition-colors">Save permanently →</Link>
                                                    <button
                                                        onClick={() => setShowBrandOverride(v => !v)}
                                                        className="flex items-center gap-1.5 text-[11px] font-black text-slate-400 hover:text-orange-600 transition-colors"
                                                    >
                                                        {showBrandOverride ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                                        {showBrandOverride ? 'Hide' : 'Fill in'}
                                                    </button>
                                                </div>
                                            </div>
                                            {showBrandOverride && (
                                                <div className="p-5 bg-white border-t border-orange-100 space-y-4">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div className="space-y-1.5">
                                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Brand / Product Name</label>
                                                            <input
                                                                type="text"
                                                                placeholder="e.g. Redigo"
                                                                className="w-full p-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:border-orange-500 font-bold transition-all text-sm"
                                                                value={postData.productMention}
                                                                onChange={(e) => setPostData({ ...postData, productMention: e.target.value })}
                                                            />
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                                                <LinkIcon size={10} /> Website URL
                                                            </label>
                                                            <input
                                                                type="text"
                                                                placeholder="https://yoursite.com"
                                                                className="w-full p-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:border-orange-500 font-bold transition-all text-sm"
                                                                value={postData.productUrl}
                                                                onChange={(e) => setPostData({ ...postData, productUrl: e.target.value })}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">What does it do?</label>
                                                        <textarea
                                                            rows={2}
                                                            placeholder="e.g. AI-powered Reddit outreach tool that helps SaaS founders find and engage their audience authentically."
                                                            className="w-full p-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:border-orange-500 font-medium text-sm resize-none transition-all"
                                                            value={postData.description}
                                                            onChange={(e) => setPostData({ ...postData, description: e.target.value })}
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Audience</label>
                                                        <input
                                                            type="text"
                                                            placeholder="e.g. SaaS founders, indie hackers, B2B marketers"
                                                            className="w-full p-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:border-orange-500 font-bold transition-all text-sm"
                                                            value={postData.targetAudience}
                                                            onChange={(e) => setPostData({ ...postData, targetAudience: e.target.value })}
                                                        />
                                                    </div>
                                                    <p className="text-[10px] text-slate-400 font-medium">The more detail you provide, the more personalized the AI output will be.</p>
                                                </div>
                                            )}
                                        </div>
                                    )}


                                    {/* Tone of Voice - Cards */}
                                    <div className="space-y-4">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Tone of Voice</label>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {TONES.map(tone => {
                                                const Icon = tone.icon;
                                                const isActive = postData.tone === tone.id;
                                                return (
                                                    <button
                                                        key={tone.id}
                                                        onClick={() => setPostData({ ...postData, tone: tone.id })}
                                                        className={`group p-5 rounded-2xl border-2 text-left transition-all duration-200 ${isActive
                                                            ? toneActiveMap[tone.color]
                                                            : 'border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm'
                                                            }`}
                                                    >
                                                        <div className="flex items-start gap-3">
                                                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${toneColorMap[tone.color]}`}>
                                                                <Icon size={16} />
                                                            </div>
                                                            <div className="space-y-0.5">
                                                                <p className="font-extrabold text-slate-900 text-sm">{tone.label}</p>
                                                                <p className="text-[11px] text-slate-400 font-medium leading-snug">{tone.desc}</p>
                                                            </div>
                                                            {isActive && (
                                                                <div className="ml-auto">
                                                                    <Check size={16} className="text-green-500" />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                {/* Language Selector */}
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        🌐 Output Language
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

                                {/* Action Buttons */}
                                <div className="flex flex-col gap-4 mt-8">
                                    <div className="flex items-center justify-between p-4 bg-orange-50/50 rounded-2xl border border-orange-100">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-orange-600 shadow-sm">
                                                <ImageIcon size={20} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900">Include Base Image</p>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-[10px] text-slate-500 font-medium">Generate visual (+{Number(costs.image)} pts)</p>
                                                    <div className="flex gap-1" title="Applying your brand colors">
                                                        <div className="w-2.5 h-2.5 rounded-full border border-white shadow-sm" style={{ backgroundColor: brandProfile.primaryColor || '#EA580C' }} />
                                                        <div className="w-2.5 h-2.5 rounded-full border border-white shadow-sm" style={{ backgroundColor: brandProfile.secondaryColor || '#1E293B' }} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setIncludeImage(!includeImage)}
                                            className={`w-12 h-7 rounded-full transition-all relative ${includeImage ? 'bg-orange-600' : 'bg-slate-300'}`}
                                        >
                                            <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${includeImage ? 'translate-x-5' : 'translate-x-0'}`} />
                                        </button>
                                    </div>

                                    <div className="flex gap-3">
                                        {postData.title && postData.content && (
                                            <button
                                                onClick={() => setStep(2)}
                                                className="flex-1 py-5 bg-white border-2 border-slate-900 text-slate-900 rounded-[2rem] font-black hover:bg-slate-50 transition-all flex items-center justify-center gap-2 group"
                                            >
                                                RESUME PROGRESS
                                                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                            </button>
                                        )}
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                if (postData.title || postData.content) {
                                                    setShowRegenConfirm(true);
                                                    return; // STOP HERE
                                                }
                                                handleGenerateContent();
                                            }}
                                            disabled={!postData.subreddit || isGenerating}
                                            className={`py-5 bg-slate-900 text-white rounded-[2rem] font-black hover:bg-orange-600 transition-all shadow-2xl flex items-center justify-center gap-2 group disabled:opacity-50 ${postData.title && postData.content ? 'px-8' : 'w-full'}`}
                                        >
                                            <Sparkles size={20} />
                                            {isGenerating ? 'ORCHESTRATING...' : postData.title ? `RE-GENERATE (${includeImage ? (Number(costs.post) + Number(costs.image)) : Number(costs.post)} pts)` : `GENERATE POST (${includeImage ? (Number(costs.post) + Number(costs.image)) : Number(costs.post)} PTS)`}
                                            {!postData.title && <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* STEP 2: Content Editor */}
                        {step === 2 && (
                            <div className="bg-white p-10 rounded-[3rem] border border-slate-200/60 shadow-xl space-y-8">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center">
                                            <PenTool size={20} />
                                        </div>
                                        <h2 className="text-xl font-extrabold text-slate-900">Content Editor</h2>
                                    </div>
                                    <button onClick={() => setStep(1)} className="text-xs font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest">← Back</button>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Headline</label>
                                        <input
                                            type="text"
                                            value={postData.title}
                                            onChange={(e) => setPostData({ ...postData, title: e.target.value })}
                                            className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-lg text-slate-900 focus:outline-none focus:border-orange-500"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Thread Body</label>
                                        <textarea
                                            rows={9}
                                            value={postData.content}
                                            onChange={(e) => setPostData({ ...postData, content: e.target.value })}
                                            className="w-full p-6 bg-slate-50 border border-slate-100 rounded-3xl font-medium text-slate-700 focus:outline-none focus:border-orange-500 resize-none leading-relaxed"
                                        />
                                    </div>

                                    {/* Image with skeleton */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                <ImageIcon size={12} />
                                                AI Brand Visual
                                                {isGeneratingImage && (
                                                    <span className="text-orange-500 flex items-center gap-1">
                                                        <RefreshCw size={10} className="animate-spin" />
                                                        Generating...
                                                    </span>
                                                )}
                                            </label>
                                            {!isGeneratingImage && postData.imageUrl && (
                                                <button
                                                    onClick={() => triggerImageGeneration(postData.imagePrompt)}
                                                    className="text-[10px] font-black text-slate-400 hover:text-orange-600 flex items-center gap-1 transition-colors"
                                                >
                                                    <RefreshCw size={10} /> Regenerate
                                                </button>
                                            )}
                                        </div>

                                        <div className="relative rounded-3xl overflow-hidden bg-slate-100 min-h-[200px]">
                                            {/* Skeleton shimmer while loading */}
                                            {(isGeneratingImage || !imageLoaded) && postData.imageUrl === '' && (
                                                <div className="absolute inset-0 bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100 animate-pulse flex items-center justify-center">
                                                    <div className="flex flex-col items-center gap-3">
                                                        <Sparkles size={28} className="text-orange-300 animate-pulse" />
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                            {isGeneratingImage ? 'Crafting your brand visual...' : 'Visual will appear here'}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Image with blur-up effect */}
                                            {postData.imageUrl && (
                                                <>
                                                    {!imageLoaded && (
                                                        <div className="absolute inset-0 bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100 animate-pulse" />
                                                    )}
                                                    <img
                                                        src={postData.imageUrl}
                                                        alt="AI Generated Brand Visual"
                                                        onLoad={() => setImageLoaded(true)}
                                                        className={`w-full object-cover rounded-3xl transition-all duration-700 ${imageLoaded ? 'opacity-100 blur-0 scale-100' : 'opacity-0 blur-sm scale-105'
                                                            }`}
                                                    />
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <button
                                        onClick={() => setStep(3)}
                                        className="flex-1 py-5 bg-slate-900 text-white rounded-[2rem] font-black hover:bg-orange-600 transition-all flex items-center justify-center gap-2 group"
                                    >
                                        REVIEW & PUBLISH <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setShowRegenConfirm(true);
                                        }}
                                        disabled={isGenerating}
                                        className="p-5 bg-slate-50 text-slate-400 rounded-[2rem] hover:text-orange-600 hover:bg-orange-50 transition-all"
                                        title="Regenerate all content"
                                    >
                                        <RefreshCw size={24} className={isGenerating ? 'animate-spin' : ''} />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* STEP 3: Publish */}
                        {step === 3 && (
                            <div className="bg-white p-10 rounded-[3rem] border border-slate-200/60 shadow-xl space-y-8">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center">
                                            <Send size={20} />
                                        </div>
                                        <h2 className="text-xl font-extrabold text-slate-900">Final Review</h2>
                                    </div>
                                    <button onClick={() => setStep(2)} className="text-xs font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest">← Edit</button>
                                </div>

                                <div className="space-y-4">
                                    <div className="p-5 bg-slate-50 rounded-2xl space-y-3">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Publishing Identity</p>
                                        <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-100">
                                            <div className="w-10 h-10 rounded-xl overflow-hidden border border-slate-200">
                                                {(redditStatus.accounts || []).find(a => a.username === selectedAccount)?.icon ? (
                                                    <img src={(redditStatus.accounts || []).find(a => a.username === selectedAccount)?.icon} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full bg-orange-600 flex items-center justify-center text-white font-black">R</div>
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <select
                                                    value={selectedAccount}
                                                    onChange={(e) => setSelectedAccount(e.target.value)}
                                                    className="w-full bg-transparent border-none text-sm font-bold text-slate-900 focus:outline-none"
                                                >
                                                    {(redditStatus.accounts || []).length > 0 ? (
                                                        (redditStatus.accounts || []).map(acc => (
                                                            <option key={acc.username} value={acc.username}>u/{acc.username}</option>
                                                        ))
                                                    ) : (
                                                        <option value="">No accounts connected</option>
                                                    )}
                                                </select>
                                                {(redditStatus.accounts || []).length === 0 && <p className="text-[10px] text-red-500 font-bold mt-1">Please link an account in settings</p>}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-5 bg-slate-50 rounded-2xl space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Posting to</p>
                                        <p className="font-extrabold text-slate-900 text-lg">r/{postData.subreddit}</p>
                                    </div>
                                    <div className="p-5 bg-slate-50 rounded-2xl space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Headline</p>
                                        <p className="font-bold text-slate-900">{postData.title}</p>
                                    </div>
                                    {postData.imageUrl && (
                                        <img src={postData.imageUrl} alt="Post visual" className="w-full rounded-2xl" />
                                    )}
                                    <div className="p-5 bg-slate-50 rounded-2xl space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Content Preview</p>
                                        <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap line-clamp-6">{postData.content}</p>
                                    </div>
                                </div>

                                <button
                                    onClick={handlePost}
                                    disabled={isPosting}
                                    className="w-full py-6 bg-orange-600 text-white rounded-[2.5rem] font-black hover:bg-orange-500 transition-all shadow-2xl shadow-orange-200 flex items-center justify-center gap-3 text-lg group"
                                >
                                    {isPosting
                                        ? <><RefreshCw className="animate-spin" size={24} /> Publishing...</>
                                        : <><Send size={24} className="group-hover:translate-x-1 transition-transform" /> PUBLISH TO REDDIT</>
                                    }
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Right: Live Preview */}
                    <div className="lg:col-span-5">
                        <div className="sticky top-10 space-y-6">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reddit Live Preview</p>

                            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden hover:shadow-xl transition-shadow">
                                <div className="p-8 space-y-5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-orange-600 rounded-full flex items-center justify-center text-white font-black text-sm">
                                            {postData.subreddit ? postData.subreddit[0].toUpperCase() : 'R'}
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-slate-900">r/{postData.subreddit || 'subreddit'}</p>
                                            <p className="text-[10px] text-slate-400 font-medium">Posted by u/you • just now</p>
                                        </div>
                                    </div>

                                    <h3 className="text-lg font-extrabold text-slate-900 leading-tight">
                                        {postData.title || 'Your viral headline will appear here...'}
                                    </h3>

                                    {/* Image in preview with skeleton */}
                                    {isGeneratingImage && (
                                        <div className="w-full h-36 bg-gradient-to-br from-orange-50 via-slate-50 to-orange-50 rounded-2xl animate-pulse flex items-center justify-center">
                                            <Sparkles size={20} className="text-orange-300 animate-pulse" />
                                        </div>
                                    )}

                                    {postData.imageUrl && !isGeneratingImage && (
                                        <div className="relative rounded-2xl overflow-hidden">
                                            {!imageLoaded && (
                                                <div className="absolute inset-0 bg-slate-100 animate-pulse rounded-2xl" />
                                            )}
                                            <img
                                                src={postData.imageUrl}
                                                alt="Post"
                                                onLoad={() => setImageLoaded(true)}
                                                className={`w-full rounded-2xl transition-all duration-700 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                                            />
                                        </div>
                                    )}

                                    <p className="text-slate-600 text-sm leading-relaxed line-clamp-5 font-medium">
                                        {postData.content || 'Your thread body will appear here once generated...'}
                                    </p>

                                    <div className="flex items-center gap-5 border-t border-slate-100 pt-4">
                                        <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold">
                                            <span>👍</span> 1.2k
                                        </div>
                                        <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold">
                                            <span>💬</span> 84 comments
                                        </div>
                                        <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold">
                                            <span>📩</span> Share
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Tone Badge */}
                            {currentTone && (
                                <div className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm space-y-3">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Tone Strategy</p>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${toneColorMap[currentTone.color]}`}>
                                            <currentTone.icon size={18} />
                                        </div>
                                        <div>
                                            <p className="font-extrabold text-slate-900">{currentTone.label}</p>
                                            <p className="text-xs text-slate-400 font-medium">{currentTone.desc}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
