
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
  AlertTriangle,
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
  Building2,
  Trash2,
  Link as LinkIcon,
  Filter,
  MessageSquare,
  ArrowUpCircle,
  Download,
  Image as ImageIcon,
  PenTool,
  ExternalLink,
  Users
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
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

const SEARCH_PROGRESS_STEPS = [
  { message: 'Searching Reddit...', icon: '🔍', duration: 1500 },
  { message: 'Analyzing post intent...', icon: '🧠', duration: 2000 },
  { message: 'Scoring lead quality...', icon: '📊', duration: 1800 },
  { message: 'Ranking top opportunities...', icon: '🎯', duration: 1200 },
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
  }
];

export const LeadFinder: React.FC = () => {
  const { user, updateUser, syncUser } = useAuth();
  const getAuthHeaders = (): Record<string, string> => {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  };
  const replyCardRef = useRef<HTMLDivElement>(null);
  const isForcedRef = useRef(false);
  type SafeguardError = { type: 'manual_kill_switch' | 'global_auto' | 'user_jail' | 'generic'; message: string; lockedUntil: number | null; };
  const [searchError, setSearchErrorRaw] = useState<SafeguardError | null>(null);
  const [safeguardCountdown, setSafeguardCountdown] = useState<number>(0);

  // Persist safeguard state across refreshes
  const setSearchError = (errData: SafeguardError | null) => {
    setSearchErrorRaw(errData);
    if (errData?.lockedUntil) {
      localStorage.setItem('safeguard_locked_until', errData.lockedUntil.toString());
      localStorage.setItem('safeguard_type', errData.type);
      localStorage.setItem('safeguard_message', errData.message);
    } else if (!errData) {
      localStorage.removeItem('safeguard_locked_until');
      localStorage.removeItem('safeguard_type');
      localStorage.removeItem('safeguard_message');
    }
  };

  // Restore safeguard block from localStorage on page refresh
  useEffect(() => {
    const lockedUntil = localStorage.getItem('safeguard_locked_until');
    const type = localStorage.getItem('safeguard_type') as any;
    const message = localStorage.getItem('safeguard_message');
    if (lockedUntil && type && message) {
      const until = parseInt(lockedUntil);
      if (until > Date.now()) {
        setSearchErrorRaw({ type, message, lockedUntil: until });
      } else {
        localStorage.removeItem('safeguard_locked_until');
        localStorage.removeItem('safeguard_type');
        localStorage.removeItem('safeguard_message');
      }
    }
  }, []);

  // Live countdown interval — ticks every second
  useEffect(() => {
    if (!searchError?.lockedUntil) return;
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((searchError.lockedUntil! - Date.now()) / 1000));
      setSafeguardCountdown(remaining);
      if (remaining <= 0) {
        setSearchError(null);
        setSafeguardCountdown(0);
      }
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [searchError]);

  const [posts, setPosts] = useState<any[]>([]);
  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [targetSubreddit, setTargetSubreddit] = useState('saas');
  const [searchKeywords, setSearchKeywords] = useState('');
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [reloadCooldown, setReloadCooldown] = useState(0);

  const [progressStep, setProgressStep] = useState(0);
  const [searchProgressStep, setSearchProgressStep] = useState(0);
  const navigate = useNavigate();

  // Lead Finder Extended State
  const [activeTab, setActiveTab] = useState<'hunter' | 'discovery'>('hunter');
  const [nicheQuery, setNicheQuery] = useState('');
  const [nicheResults, setNicheResults] = useState<any[]>([]);
  const [isSearchingNiches, setIsSearchingNiches] = useState(false);
  const [costs, setCosts] = useState({ comment: 1, post: 2, image: 5, fetch: 1, deepScan: 0.5, nicheExplore: 0 });
  const [isInitialCheckDone, setIsInitialCheckDone] = useState(false);
  const [showNoCreditsModal, setShowNoCreditsModal] = useState(false);
  const [showDailyLimitModal, setShowDailyLimitModal] = useState(false);
  const [plans, setPlans] = useState<any[]>([]);
  const [targetCooldown, setTargetCooldown] = useState(30);
  const [sortBy, setSortBy] = useState('new');
  const [activeIntentFilter, setActiveIntentFilter] = useState<string>('All');
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const [showExtensionWarning, setShowExtensionWarning] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [extensionDetected, setExtensionDetected] = useState<boolean | null>(null);
  const [isScanning, setIsScanning] = useState<string | null>(null);
  const pingTimeoutRef = useRef<any>(null);

  const isExtensionActive = () => {
    const isMobile = window.innerWidth <= 768 || /Mobi|Android/i.test(navigator.userAgent);
    if (user?.role === 'admin' || isMobile) return true;

    if (extensionDetected === true) return true;
    const isInstalledInDOM = document.documentElement.getAttribute('data-redigo-extension') === 'installed';
    if (isInstalledInDOM) return true;

    return false;
  };

  const currentPlan = plans.find(p => (p.name || '').toLowerCase() === (user?.plan || '').toLowerCase() || (p.id || '').toLowerCase() === (user?.plan || '').toLowerCase());
  const canTrack = user?.role === 'admin' || (currentPlan && Boolean(currentPlan.allowTracking));
  const canGenerateImages = user?.role === 'admin' || (currentPlan && Boolean(currentPlan.allowImages));


  const [redditSettings, setRedditSettings] = useState<any>({
    useExtensionFetching: true,
    useServerFallback: true,
    mobileServerFetching: true
  });
  const [collapsedPosts, setCollapsedPosts] = useState<Record<string, boolean>>({});

  useEffect(() => {
    syncUser(); // Refresh user data (credits, daily limits) on mount

    fetch('/api/config')
      .then(res => res.json())
      .then(data => {
        if (data.redditFetchCooldown) setTargetCooldown(data.redditFetchCooldown);
        if (data.creditCosts) setCosts(prev => ({ ...prev, ...data.creditCosts, fetch: Number(data.creditCosts.fetch) ?? 1 }));
        if (data.redditSettings) setRedditSettings(data.redditSettings);
      })
      .catch(console.error);

    if (user?.id) {
      // Check current cooldown status from server
      fetch(`/api/reddit/cooldown-status?userId=${user?.id}`, { headers: getAuthHeaders() })
        .then(res => res.json())
        .then(data => {
          if (data.remainingFetch > 0) {
            setReloadCooldown(data.remainingFetch);
            // Re-start the timer if there's a cooldown
            const cooldownTimer = setInterval(() => {
              setReloadCooldown(prev => {
                if (prev <= 1) { clearInterval(cooldownTimer); return 0; }
                return prev - 1;
              });
            }, 1000);
          }
        })
        .catch(console.error);

      // Load saved leads on mount
      fetch(`/api/user/saved-leads?userId=${user?.id}`, { headers: getAuthHeaders() })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {
            setPosts(data);
            showToast('Search results restored! 📂', 'success');
          }
        })
        .catch(console.error);

      // Load saved niches on mount
      fetch(`/api/user/saved-niches?userId=${user?.id}`, { headers: getAuthHeaders() })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {
            setNicheResults(data);
            showToast('Niche results restored! 📂', 'success');
          }
        })
        .catch(console.error);
    }

    fetch('/api/plans')
      .then(res => res.json())
      .then(data => setPlans(data))
      .catch(console.error);
  }, [user?.id]);






  const handleNicheSearch = async () => {
    if (!nicheQuery.trim()) return;
    if (reloadCooldown > 0) return;

    const nicheCost = costs.nicheExplore || 0;
    if (nicheCost > 0 && (user?.credits || 0) < nicheCost && user?.role !== 'admin') {
      setShowNoCreditsModal(true);
      return;
    }

    // --- Extension Check ---
    const needsExtCheck = !isExtensionActive();
    if (needsExtCheck && !isForcedRef.current) {
      setPendingAction(() => () => handleNicheSearch());
      setShowExtensionWarning(true);
      return;
    }
    isForcedRef.current = false;

    setIsSearchingNiches(true);
    setNicheResults([]);
    setSearchError(null);

    // Start dynamic cooldown logic
    setReloadCooldown(targetCooldown);
    const cooldownTimer = setInterval(() => {
      setReloadCooldown(prev => {
        if (prev <= 1) { clearInterval(cooldownTimer); return 0; }
        return prev - 1;
      });
    }, 1000);

    try {
      const isMobile = /Mobile|Android|iPhone/i.test(navigator.userAgent);
      const isExtActive = isExtensionActive();
      const canUseExtension = redditSettings.useExtensionFetching && isExtActive && !isMobile;

      let results: any[] = [];
      let finalCredits = user?.credits || 0;

      if (canUseExtension) {
        try {
          const rawData = await fetchNicheWithExtension(nicheQuery);
          results = (rawData.data?.children || []).map((child: any) => {
            let icon = child.data.icon_img || child.data.community_icon || "";
            if (icon) icon = icon.replace(/&amp;/g, '&');
            return {
              name: child.data.display_name,
              title: child.data.title,
              subscribers: child.data.subscribers,
              description: child.data.public_description,
              icon: icon,
              over18: child.data.over18,
              type: child.data.subreddit_type,
              activeUsers: child.data.accounts_active
            };
          });

          // Sync with server for history/credits
          const syncRes = await fetch('/api/subreddit/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
            body: JSON.stringify({ results, q: nicheQuery, userId: user?.id })
          });
          const syncData = await syncRes.json();
          if (syncData.credits !== undefined) finalCredits = syncData.credits;

        } catch (extErr) {
          if (redditSettings.useServerFallback) {
            const res = await fetch(`/api/subreddit/search?q=${encodeURIComponent(nicheQuery)}&userId=${user?.id}`, { headers: getAuthHeaders() });
            if (!res.ok) throw new Error('Search failed');
            const data = await res.json();
            results = data.results || [];
            finalCredits = data.credits;
          } else {
            throw extErr;
          }
        }
      } else {
        // Direct Server Fetch
        const res = await fetch(`/api/subreddit/search?q=${encodeURIComponent(nicheQuery)}&userId=${user?.id}`, { headers: getAuthHeaders() });

        if (res.status === 423) {
          const errData = await res.json();
          setSearchError({ type: errData.restrictionType || 'generic', message: errData.error || 'Request blocked by safeguards.', lockedUntil: errData.lockedUntil || null });
          showToast(errData.error || 'Request blocked by safeguards.', 'error');
          setIsSearchingNiches(false);
          return;
        }

        if (res.status === 429) {
          const errData = await res.json();
          if (errData.error === 'RATELIMIT_COOLDOWN' || errData.cooldown) {
            showToast(errData.message || `Please wait ${errData.cooldown}s`, 'error');
            if (errData.cooldown) setReloadCooldown(errData.cooldown);
          } else {
            setShowDailyLimitModal(true);
          }
          setIsSearchingNiches(false);
          return;
        }

        if (res.status === 403) {
          const errData = await res.json();
          setSearchError({
            type: 'generic', // Use generic for policy messages unless we add a new icon
            message: errData.message || 'Server-side fetching is disabled here.',
            lockedUntil: null
          });
          setIsSearchingNiches(false);
          return;
        }

        if (res.status === 402) {
          setShowNoCreditsModal(true);
          setIsSearchingNiches(false);
          return;
        }
        if (!res.ok) throw new Error('Search failed');
        const data = await res.json();
        results = data.results || [];
        finalCredits = data.credits;
      }

      setNicheResults(results);
      if (finalCredits !== undefined) updateUser({ credits: finalCredits });

      if (results.length === 0) showToast('No matching subreddits found.', 'error');
      else showToast(`Found ${results.length} communities!`, 'success');

    } catch (e: any) {
      showToast(e.message || 'Niche search failed', 'error');
    } finally {
      setIsSearchingNiches(false);
    }
  };

  const handleSendToAI = (post: any, replyMode: 'reply-post' | 'reply-comment' = 'reply-post') => {
    // Save post to local storage for the AI agent to pick up
    localStorage.setItem('redditgo_current_lead', JSON.stringify({
      postId: post.id,
      redditId: post.redditId || post.id,
      title: post.title,
      content: post.selftext || post.body || '',
      subreddit: post.subreddit,
      url: post.url,
      author: post.author,
      isComment: post.isComment || false,
      replyMode,
      timestamp: Date.now()
    }));
    navigate(`/ai-agent?mode=${replyMode}`);
  };



  // ── Extension Real-time Detection ─────────────────────────────────────
  useEffect(() => {
    const handleExtMessage = (event: MessageEvent) => {
      if (event.data?.source === 'REDIGO_EXT' && event.data?.type === 'EXTENSION_PONG') {
        if (pingTimeoutRef.current) clearTimeout(pingTimeoutRef.current);
        setExtensionDetected(true);
      }
    };

    window.addEventListener('message', handleExtMessage);

    setExtensionDetected(null);
    if (document.documentElement.getAttribute('data-redigo-extension') === 'installed') {
      setExtensionDetected(true);
    } else {
      window.postMessage({ source: 'REDIGO_WEB_APP', type: 'EXTENSION_PING', userId: user?.id }, '*');
      pingTimeoutRef.current = setTimeout(() => {
        if (!document.documentElement.getAttribute('data-redigo-extension')) {
          setExtensionDetected(false);
        } else {
          setExtensionDetected(true);
        }
      }, 2500);
    }

    return () => {
      window.removeEventListener('message', handleExtMessage);
      if (pingTimeoutRef.current) clearTimeout(pingTimeoutRef.current);
    };
  }, [user?.id]);



  ;

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleClearLeads = async () => {
    try {
      const response = await fetch('/api/user/clear-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ userId: user?.id })
      });
      if (response.ok) {
        setPosts([]);
        setSelectedPost(null);
        showToast('All leads cleared.', 'success');
      }
    } catch (err) {
      showToast('Failed to clear leads.', 'error');
    }
  };

  const handleDeepScan = async (post: any) => {
    if (!user?.id) return;
    const scanCost = costs.deepScan || 0.5;

    if (user.role !== 'admin' && (user.credits || 0) < scanCost) {
      setShowNoCreditsModal(true);
      return;
    }

    setIsScanning(post.id);
    try {
      const response = await fetch('/api/reddit/deep-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          userId: user.id,
          postUrl: post.url,
          postId: post.id,
          subreddit: post.subreddit
        })
      });

      if (response.status === 402) { setShowNoCreditsModal(true); return; }
      const data = await response.json();
      if (response.status === 423) {
        showToast(data.error || 'Blocked by safeguards.', 'error');
        return;
      }
      if (!response.ok) throw new Error(data.error || 'Deep Scan failed');

      // Update local posts state to include the new comments
      setPosts(prev => prev.map(p =>
        p.id === post.id ? { ...p, scannedComments: data.comments } : p
      ));

      if (data.credits !== undefined) {
        updateUser({ credits: data.credits });
      }

      showToast(`Scan complete! Found ${data.comments?.length || 0} high-intent leads. 🔍`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Deep Scan failed. Please try again.', 'error');
    } finally {
      setIsScanning(null);
    }
  };

  // Cycle progress steps while fetching/analyzing
  useEffect(() => {
    if (!isFetching) { setSearchProgressStep(0); return; }
    let current = 0;
    const cycle = () => {
      if (!isFetching) return;
      if (current < SEARCH_PROGRESS_STEPS.length - 1) {
        current++;
        setSearchProgressStep(current);
        setTimeout(cycle, SEARCH_PROGRESS_STEPS[current].duration);
      }
    };
    setTimeout(cycle, SEARCH_PROGRESS_STEPS[0].duration);
  }, [isFetching]);


  const handleRedditAuth = async () => {
    try {
      const response = await fetch('/api/auth/reddit/url');
      const data = await response.json();
      if (data.url) window.location.href = data.url;
    } catch (err) {
      showToast('Auth failed', 'error');
    }
  };

  const fetchNicheWithExtension = (query: string): Promise<any> => {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        window.removeEventListener('message', handleResponse);
        reject(new Error('Extension timeout'));
      }, 15000);

      const handleResponse = (event: MessageEvent) => {
        if (event.data.source === 'REDIGO_EXT' && event.data.type === 'NICHE_RESPONSE') {
          clearTimeout(timeoutId);
          window.removeEventListener('message', handleResponse);
          if (event.data.payload && event.data.payload.success) {
            resolve(event.data.payload.data);
          } else {
            reject(new Error(event.data.payload?.error || 'Niche fetch failed'));
          }
        }
      };
      window.addEventListener('message', handleResponse);

      window.postMessage({
        source: 'REDIGO_WEB_APP',
        type: 'REDDIT_NICHE_SEARCH',
        query
      }, '*');
    });
  };

  const fetchWithExtension = (): Promise<any> => {
    return new Promise((resolve, reject) => {
      console.log('[Extension Bridge] Setting up listener');

      const timeoutId = setTimeout(() => {
        window.removeEventListener('message', handleResponse);
        console.warn('[Extension Bridge] Timeout reaching extension');
        reject(new Error('Extension timeout'));
      }, 15000);

      const handleResponse = (event: MessageEvent) => {
        if (event.data.source === 'REDIGO_EXT' && event.data.type === 'SEARCH_RESPONSE') {
          console.log('[Extension Bridge] Received Data from Extension');
          clearTimeout(timeoutId); // Stop the timer!
          window.removeEventListener('message', handleResponse);
          if (event.data.payload && event.data.payload.success) {
            resolve(event.data.payload.data);
          } else {
            reject(new Error(event.data.payload?.error || 'Extension fetch failed'));
          }
        }
      };
      window.addEventListener('message', handleResponse);

      window.postMessage({
        source: 'REDIGO_WEB_APP',
        type: 'REDDIT_SEARCH',
        subreddit: targetSubreddit,
        keywords: searchKeywords,
        sortBy: sortBy
      }, '*');
    });
  };

  const fetchPosts = async () => {
    if (!user?.id) return;

    // --- Validation ---
    if (!targetSubreddit.trim() || !searchKeywords.trim()) {
      showToast('Subreddit and Keywords are required to search.', 'error');
      return;
    }

    if (reloadCooldown > 0) return;

    // --- Extension Check ---
    const needsCheck = !isExtensionActive();
    if (needsCheck && !isForcedRef.current) {
      setPendingAction(() => () => fetchPosts());
      setShowExtensionWarning(true);
      return;
    }
    isForcedRef.current = false; // Reset for next time
    setPendingAction(null); // Clear after check passes or forced continue

    // ── Credit Pre-check ────────────────────────────────────────────────
    const cost = costs.fetch || 1;
    if (user && user.role !== 'admin') {
      // Daily limit check
      const plan = plans.find(p => (p.name || '').toLowerCase() === (user.plan || '').toLowerCase() || (p.id || '').toLowerCase() === (user.plan || '').toLowerCase());
      const planLimit = user.billingCycle === 'yearly' ? plan?.dailyLimitYearly : plan?.dailyLimitMonthly;
      const dailyLimit = (Number(user.customDailyLimit) > 0) ? Number(user.customDailyLimit) : (Number(planLimit) || 0);
      if (dailyLimit > 0 && ((user.dailyUsagePoints || 0) + cost) > dailyLimit) {
        setShowDailyLimitModal(true);
        return;
      }
      // Credits check
      if ((user.credits || 0) < cost) {
        setShowNoCreditsModal(true);
        return;
      }
    }
    // ────────────────────────────────────────────────────────────────────

    setIsFetching(true);
    setSearchError(null); // Reset error state
    setPosts([]); // Clear previous results instantly
    setSelectedPost(null); // Clear selected post to avoid old post mixing
    setActiveIntentFilter('All'); // Reset AI filter to default

    // Start dynamic cooldown to prevent rapid re-fetching
    setReloadCooldown(targetCooldown);
    const cooldownTimer = setInterval(() => {
      setReloadCooldown(prev => {
        if (prev <= 1) { clearInterval(cooldownTimer); return 0; }
        return prev - 1;
      });
    }, 1000);

    try {
      const isMobile = /Mobile|Android|iPhone/i.test(navigator.userAgent);
      const isExtActive = isExtensionActive();
      const canUseExtension = redditSettings.useExtensionFetching && isExtActive && !isMobile;

      console.log('[Hybrid Debug]', {
        useExtensionFetching: redditSettings.useExtensionFetching,
        isExtensionActive: isExtActive,
        isMobile,
        userRole: user?.role,
        useServerFallback: redditSettings.useServerFallback
      });

      // --- Subreddit Universal Pre-flight Check ---
      const subRes = await fetch(`/api/subreddit/about?name=${encodeURIComponent(targetSubreddit)}&userId=${user?.id}`);

      if (!subRes.ok) {
        if (!canUseExtension) {
          if (subRes.status === 423) {
            const errData = await subRes.json();
            setSearchError({ type: errData.restrictionType || 'generic', message: errData.error || 'Reddit access restricted by safeguards.', lockedUntil: errData.lockedUntil || null });
            showToast(errData.error || 'Reddit access restricted by safeguards.', 'error');
            setIsFetching(false);
            setReloadCooldown(0);
            return;
          }

          const errData = await subRes.json();
          const errMsg = `${errData.message || 'Subreddit not found or inaccessible.'} [${subRes.status}]`;
          setSearchError({ type: 'generic', message: errMsg, lockedUntil: null });
          showToast(errMsg, 'error');
          setIsFetching(false);
          setReloadCooldown(0);
          return;
        } else {
          console.log(`[Hybrid] Server pre-flight failed (Status ${subRes.status}), but extension is active so we bravely proceed...`);
        }
      }

      let data: any;

      if (canUseExtension) {
        console.log('[Hybrid] Attempting Extension Fetch...');
        try {
          let rawJson = await fetchWithExtension();

          // --- PAYLOAD SIZE REDUCTION ---
          // Reddit API returns a massive amount of unnecessary data (flair, HTML, etc)
          // We only need specific fields. Trimming this prevents "Payload Too Large" (413) Node.js errors.
          if (rawJson && rawJson.data && Array.isArray(rawJson.data.children)) {
            rawJson = {
              data: {
                children: rawJson.data.children.map((child: any) => ({
                  data: {
                    id: child.data?.id,
                    name: child.data?.name,
                    title: child.data?.title,
                    selftext: child.data?.selftext,
                    subreddit: child.data?.subreddit,
                    ups: child.data?.ups,
                    num_comments: child.data?.num_comments,
                    url: child.data?.permalink ? `https://www.reddit.com${child.data.permalink}` : (child.data?.url || '#'),
                    permalink: child.data?.permalink,
                    author: child.data?.author,
                    created_utc: child.data?.created_utc
                  }
                }))
              }
            };
          }

          const response = await fetch('/api/reddit/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
            body: JSON.stringify({ rawJson, keywords: searchKeywords, userId: user.id, sortBy: sortBy })
          });
          if (response.status === 423) {
            const errData = await response.json();
            setSearchError(errData.error || 'Blocked by safeguards.');
            showToast(errData.error || 'Blocked by safeguards.', 'error');
            setIsFetching(false);
            setReloadCooldown(0);
            return;
          }
          if (response.status === 402) {
            setIsFetching(false);
            setShowNoCreditsModal(true);
            return;
          }
          if (response.status === 429) {
            setShowDailyLimitModal(true);
            setIsFetching(false);
            return;
          }
          if (!response.ok) throw new Error('Analysis failed');
          data = await response.json();
          console.log('[Hybrid] Analysis Successful:', data.posts?.length, 'posts processed');
        } catch (extErr: any) {
          console.warn('[Hybrid] Extension fetch failed, checking fallback...', extErr);
          if (redditSettings.useServerFallback) {
            console.log('[Hybrid] Falling back to Server Fetching');
            const response = await fetch(`/api/reddit/posts?subreddit=${targetSubreddit}&keywords=${searchKeywords}&userId=${user.id}&sort=${sortBy}&t=all`, { headers: getAuthHeaders() });

            if (response.status === 423) {
              const errData = await response.json();
              setSearchError(errData.error || 'Blocked by safeguards.');
              showToast(errData.error || 'Blocked by safeguards.', 'error');
              setIsFetching(false);
              setReloadCooldown(0);
              return;
            }

            if (response.status === 404 || response.status === 403) {
              const errData = await response.json();
              setSearchError({ type: 'generic', message: `${errData.message || 'Subreddit not found or inaccessible.'} [${response.status}]`, lockedUntil: null });
              showToast(`${errData.message || 'Subreddit not found or inaccessible.'} [${response.status}]`, 'error');
              setIsFetching(false);
              setReloadCooldown(0);
              return;
            }

            if (!response.ok) throw new Error('Server fallback failed');
            data = await response.json();
          } else {
            setSearchError({ type: 'generic', message: `${extErr.message || 'Extension fetch failed'} [EXT]`, lockedUntil: null });
            throw extErr;
          }
        }
      } else {
        console.log('[Hybrid] Using Server Fetching (Fallback, Mobile, or Extension Disabled)');
        const response = await fetch(`/api/reddit/posts?subreddit=${targetSubreddit}&keywords=${searchKeywords}&userId=${user.id}&sort=${sortBy}&t=all`, { headers: getAuthHeaders() });

        if (response.status === 423) {
          const errData = await response.json();
          setSearchError({ type: errData.restrictionType || 'generic', message: errData.error || 'Request blocked by safeguards.', lockedUntil: errData.lockedUntil || null });
          showToast(errData.error || 'Request blocked by safeguards.', 'error');
          setIsFetching(false);
          setReloadCooldown(0);
          return;
        }
        if (response.status === 402) {
          setIsFetching(false);
          setShowNoCreditsModal(true);
          return;
        }
        if (response.status === 404 || response.status === 403) {
          const errData = await response.json();
          setSearchError({ type: 'generic', message: `${errData.message || 'Subreddit not found or inaccessible.'} [${response.status}]`, lockedUntil: null });
          showToast(`${errData.message || 'Subreddit not found or inaccessible.'} [${response.status}]`, 'error');
          setIsFetching(false);
          setReloadCooldown(0);
          return;
        }
        if (response.status === 429) {
          const errData = await response.json();
          setIsFetching(false);
          if (errData.error === 'DAILY_LIMIT_REACHED') { setShowDailyLimitModal(true); return; }
          if (errData.cooldown) setReloadCooldown(errData.cooldown);
          showToast(errData.message || errData.error || 'Too many requests. Please wait.', 'error');
          return;
        }
        if (!response.ok) throw new Error('Fetch failed');
        data = await response.json();
      }

      const postsArray = Array.isArray(data) ? data : (data.posts || []);

      // Immediately sync credits if returned
      if (data.credits !== undefined && data.credits !== null) {
        updateUser({
          credits: data.credits,
          dailyUsagePoints: data.dailyUsagePoints,
          dailyUsage: data.dailyUsage
        });
      }

      setPosts(postsArray);

      const hasDraft = localStorage.getItem('redditgo_comment_draft');
      if (postsArray.length > 0 && !hasDraft) {
        setSelectedPost(postsArray[0]);
      }
    } catch (err: any) {
      console.error('[Hybrid Search Error]:', err);
      showToast(err.message || 'Failed to load posts. Please try again.', 'error');
    } finally {
      setIsFetching(false);
    }
  };


  // Pre-compute safeguard card display values (must be outside JSX)
  const sgIsManual = searchError?.type === 'manual_kill_switch';
  const sgIsJail = searchError?.type === 'user_jail';
  const sgMins = Math.floor(safeguardCountdown / 60);
  const sgSecs = safeguardCountdown % 60;
  const sgCountdownStr = safeguardCountdown > 0 ? `${sgMins}:${sgSecs.toString().padStart(2, '0')}` : null;
  const sgBg = sgIsManual ? 'bg-amber-50 border-amber-200' : sgIsJail ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200';
  const sgIconBg = sgIsManual ? 'bg-amber-100 text-amber-600' : sgIsJail ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600';
  const sgLabelColor = sgIsManual ? 'text-amber-500' : sgIsJail ? 'text-red-500' : 'text-orange-500';
  const sgTitleColor = sgIsManual ? 'text-amber-900' : sgIsJail ? 'text-red-900' : 'text-orange-900';
  const sgMsgColor = sgIsManual ? 'text-amber-700' : sgIsJail ? 'text-red-700' : 'text-orange-700';
  const sgCdBg = sgIsManual ? 'bg-amber-100' : sgIsJail ? 'bg-red-100' : 'bg-orange-100';
  const sgCdLabelColor = sgIsManual ? 'text-amber-400' : sgIsJail ? 'text-red-400' : 'text-orange-400';
  const sgCdNumColor = sgIsManual ? 'text-amber-700' : sgIsJail ? 'text-red-700' : 'text-orange-700';

  return (
    <>
      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 md:bottom-10 md:right-10 z-[99999] p-5 rounded-2xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-right-10 duration-500 border border-white/20 backdrop-blur-md ${toast.type === 'success' ? 'bg-emerald-600/90 shadow-emerald-900/20' : 'bg-red-600/90 shadow-red-900/20'}`}>
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
            {toast.type === 'success' ? <Sparkles size={20} className="text-white" /> : <AlertCircle size={20} className="text-white" />}
          </div>
          <div className="text-left">
            <p className="font-extrabold text-sm text-white leading-tight font-['Outfit']">{toast.message}</p>
            {toast.type === 'success' && <p className="text-white/80 text-[10px] font-medium mt-0.5">Operation successful</p>}
          </div>
          <button onClick={() => setToast(null)} className="ml-2 text-white/50 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>
      )}



      {/* No Credits Modal */}
      {showNoCreditsModal && (
        <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 font-['Outfit']">
          <div className="bg-white rounded-[2.5rem] p-8 md:p-10 max-w-sm w-full shadow-2xl text-center space-y-6 animate-in zoom-in-95 duration-300 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-orange-50 to-white -z-10" />

            <div className="w-20 h-20 bg-orange-100 text-orange-600 rounded-[1.5rem] flex items-center justify-center mx-auto shadow-inner border border-orange-200">
              <Zap size={40} className="fill-current" />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-900 leading-tight">Out of Fuel! ⛽</h3>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">
                You've used all your AI credits. <br />Top up to keep the momentum going!
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-3">
              <div className="flex justify-between items-center pb-3 border-b border-slate-200/60">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Required</span>
                <span className="text-sm font-black text-slate-900">{costs.comment} PTS</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Your Balance</span>
                <span className="text-sm font-black text-red-500">{user?.credits || 0} PTS</span>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <Link
                to="/pricing"
                className="w-full py-4 bg-orange-600 text-white rounded-2xl font-black shadow-xl shadow-orange-200 hover:bg-orange-700 hover:scale-[1.02] transition-all flex items-center justify-center gap-2 uppercase tracking-wide text-xs"
              >
                Top Up Credits <ArrowRight size={16} />
              </Link>
              <button
                onClick={() => setShowNoCreditsModal(false)}
                className="w-full py-3 text-slate-400 font-bold hover:text-slate-600 transition-colors text-xs uppercase tracking-widest"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fetching & Analysis Overlay */}
      {isFetching && (
        <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-8 md:p-14 max-w-md w-full shadow-2xl text-center space-y-8 animate-in zoom-in-95 duration-300">
            <div className="relative w-24 h-24 mx-auto">
              <div className="absolute inset-0 rounded-full bg-orange-100 animate-ping opacity-60" />
              <div className="relative w-24 h-24 bg-orange-600 rounded-full flex items-center justify-center text-4xl shadow-2xl shadow-orange-300">
                {SEARCH_PROGRESS_STEPS[searchProgressStep]?.icon}
              </div>
            </div>
            <div className="space-y-3 font-['Outfit']">
              <p className="text-2xl font-extrabold text-slate-900">{SEARCH_PROGRESS_STEPS[searchProgressStep]?.message}</p>
              <p className="text-slate-400 font-medium text-sm">Powered by Redigo AI</p>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-orange-600 rounded-full transition-all duration-1000"
                style={{ width: `${((searchProgressStep + 1) / SEARCH_PROGRESS_STEPS.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}


      <div className="max-w-7xl mx-auto space-y-10 animate-fade-in font-['Outfit'] pt-4 px-4 pb-20">
        {/* Header */}
        <div className="flex flex-col gap-8 pb-2 border-b border-slate-100">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-7 bg-orange-600 rounded-full" />
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Lead Finder</h1>
              </div>
              <p className="text-slate-400 font-medium text-sm pl-4">Discover subreddits and identify high-quality leads.</p>
            </div>

            {/* Tabs Switcher */}
            <div className="bg-slate-100/80 p-1.5 rounded-2xl flex gap-1 self-start sm:self-auto backdrop-blur-sm border border-slate-200/50 shadow-inner">
              <button
                onClick={() => setActiveTab('hunter')}
                className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'hunter' ? 'bg-white text-orange-600 shadow-md ring-1 ring-black/5' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <Target size={14} /> Post Hunter
              </button>
              <button
                onClick={() => setActiveTab('discovery')}
                className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'discovery' ? 'bg-white text-orange-600 shadow-md ring-1 ring-black/5' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <Users size={14} /> Niche Discovery
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3">
            {activeTab === 'hunter' ? (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="flex items-center bg-white border border-slate-200 rounded-2xl shadow-sm px-3 flex-1 sm:flex-none focus-within:ring-2 focus-within:ring-orange-100 transition-all">
                  <Target size={14} className="text-slate-400" />
                  <input
                    type="text"
                    value={targetSubreddit}
                    onChange={(e) => setTargetSubreddit(e.target.value)}
                    placeholder="subreddit"
                    className="p-2.5 bg-transparent focus:outline-none font-bold text-[11px] w-20 md:w-24"
                  />
                  <div className="w-[1px] h-4 bg-slate-200 mx-1" />
                  <Hash size={14} className="text-slate-400" />
                  <input
                    type="text"
                    value={searchKeywords}
                    onChange={(e) => setSearchKeywords(e.target.value)}
                    placeholder="keywords"
                    className="p-2.5 bg-transparent focus:outline-none font-bold text-[11px] w-28 md:w-32"
                  />
                </div>
                <div className="flex items-center gap-2">
                  {/* Sort Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setIsSortMenuOpen(!isSortMenuOpen)}
                      className="flex items-center gap-2 bg-white border border-slate-200 rounded-2xl shadow-sm px-4 py-2.5 text-xs font-bold text-slate-700 hover:border-orange-200 transition-all"
                    >
                      {sortBy === 'new' && <Clock size={14} className="text-orange-600" />}
                      {sortBy === 'hot' && <Flame size={14} className="text-orange-600" />}
                      {sortBy === 'rising' && <Zap size={14} className="text-orange-600" />}
                      {sortBy === 'top' && <ArrowUpCircle size={14} className="text-orange-600" />}
                      {sortBy === 'controversial' && <AlertCircle size={14} className="text-orange-600" />}
                      <span className="capitalize">{sortBy}</span>
                      <ChevronDown size={14} className={`transition-transform duration-300 ${isSortMenuOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isSortMenuOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsSortMenuOpen(false)} />
                        <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-48 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 p-2 animate-in fade-in zoom-in duration-200 origin-top-left sm:origin-top-right">
                          <p className="text-[10px] font-black text-slate-400 px-3 py-2 uppercase tracking-widest">Sort by</p>
                          {[
                            { id: 'new', icon: Clock, label: 'Newest' },
                            { id: 'hot', icon: Flame, label: 'Hot' },
                            { id: 'rising', icon: Zap, label: 'Rising' },
                            { id: 'top', icon: ArrowUpCircle, label: 'Top' },
                            { id: 'controversial', icon: AlertCircle, label: 'Controversial' }
                          ].map((item) => (
                            <button
                              key={item.id}
                              onClick={() => {
                                setSortBy(item.id);
                                setIsSortMenuOpen(false);
                              }}
                              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${sortBy === item.id ? 'bg-orange-50 text-orange-600' : 'text-slate-600 hover:bg-slate-50'}`}
                            >
                              <item.icon size={14} />
                              {item.label}
                              {sortBy === item.id && <Check size={12} className="ml-auto" />}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  <button
                    onClick={fetchPosts}
                    disabled={isFetching || reloadCooldown > 0 || !targetSubreddit.trim() || !searchKeywords.trim()}
                    className="bg-slate-900 text-white px-4 md:px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-orange-600 transition-all flex flex-col items-center justify-center gap-0.5 disabled:opacity-30 disabled:cursor-not-allowed group whitespace-nowrap min-w-[100px]"
                  >
                    <div className="flex items-center gap-2">
                      <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
                      <span>{reloadCooldown > 0 ? `${reloadCooldown}s` : 'Hunter Search'}</span>
                    </div>
                    {reloadCooldown === 0 && !isFetching && (
                      <span className="text-[9px] text-orange-400 font-black tracking-[0.15em]">{costs.fetch} PT</span>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="flex items-center bg-white border border-slate-200 rounded-2xl shadow-sm px-4 flex-1 sm:w-80 focus-within:ring-2 focus-within:ring-orange-100 transition-all">
                  <Search size={14} className="text-slate-400" />
                  <input
                    type="text"
                    value={nicheQuery}
                    onChange={(e) => setNicheQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleNicheSearch()}
                    placeholder="search niches (e.g. 'saas', 'fitness')"
                    className="p-3 bg-transparent focus:outline-none font-bold text-xs w-full"
                  />
                </div>
                <button
                  onClick={handleNicheSearch}
                  disabled={isSearchingNiches || !nicheQuery.trim() || reloadCooldown > 0}
                  className="bg-orange-600 text-white px-8 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-orange-700 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-orange-200"
                >
                  {reloadCooldown > 0 ? (
                    <Clock size={16} className="animate-pulse" />
                  ) : (
                    <Search size={16} className={isSearchingNiches ? 'animate-pulse' : ''} />
                  )}
                  <span className="flex flex-col items-center leading-tight">
                    <span>{reloadCooldown > 0 ? `Wait ${reloadCooldown}s` : 'Explore Niches'}</span>
                    {(costs.nicheExplore || 0) > 0 && reloadCooldown === 0 && (
                      <span className="text-[9px] text-orange-200 font-black tracking-[0.15em]">{costs.nicheExplore} PT</span>
                    )}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Credits */}
        <CreditsBanner plan={user?.plan || 'Starter'} credits={user?.credits || 0} />

        <div className="flex justify-center w-full max-w-5xl mx-auto">
          {/* Main Content Area */}
          <div className="space-y-6 w-full">
            {/* Shared Safeguard/Error Display */}
            {searchError && !isFetching && !isSearchingNiches && (
              <div className={`flex flex-col items-center justify-center py-16 rounded-[3rem] border shadow-sm space-y-5 px-8 text-center ${sgBg}`}>
                <div className={`w-20 h-20 rounded-3xl flex items-center justify-center text-3xl ${sgIconBg}`}>
                  {sgIsManual ? '🔐' : sgIsJail ? '⛔' : searchError.type === 'generic' ? '🚫' : '🛡️'}
                </div>
                <div>
                  <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${sgLabelColor}`}>
                    {sgIsManual ? 'System Protected by Admin' : sgIsJail ? 'Account Temporarily Restricted' : 'Access Restricted'}
                  </p>
                  <h3 className={`text-lg font-black mb-2 ${sgTitleColor}`}>
                    {sgIsManual ? 'Reddit Access Paused' : sgIsJail ? 'Cooling Down...' : 'Action Required'}
                  </h3>
                  <p className={`text-sm font-medium max-w-xs leading-relaxed ${sgMsgColor}`}>
                    {searchError.message}
                  </p>
                </div>
                {sgCountdownStr ? (
                  <div className={`flex flex-col items-center px-8 py-4 rounded-2xl ${sgCdBg}`}>
                    <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${sgCdLabelColor}`}>Resuming in</p>
                    <p className={`text-4xl font-black tabular-nums ${sgCdNumColor}`}>{sgCountdownStr}</p>
                  </div>
                ) : sgIsManual ? (
                  <div className="px-6 py-3 bg-amber-100 rounded-2xl">
                    <p className="text-amber-600 text-xs font-black uppercase tracking-widest">Indefinite — Admin Control</p>
                  </div>
                ) : (
                  <button
                    onClick={() => setSearchError(null)}
                    className="px-6 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
                  >
                    Dismiss Message
                  </button>
                )}
              </div>
            )}
            {activeTab === 'discovery' ? (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Niche Discovery Tools and Actions */}
                {nicheResults.length > 0 && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                        <Globe size={20} />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-900 leading-tight">Explore Markets</h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Found {nicheResults.length} high-potential niches</p>
                      </div>
                    </div>
                    <button
                      onClick={async () => {
                        if (!user?.id) return;
                        setNicheResults([]);
                        try {
                          await fetch('/api/user/clear-niches', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                            body: JSON.stringify({ userId: user.id })
                          });
                        } catch (err) {
                          console.error('Failed to clear saved niches:', err);
                        }
                      }}
                      className="flex items-center justify-center gap-2 px-6 py-3 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all text-xs font-black uppercase tracking-widest border border-red-100 shadow-sm"
                    >
                      <Trash2 size={16} />
                      <span>Clear Niche Results</span>
                    </button>
                  </div>
                )}

                {/* Niche Results Summary */}
                {nicheResults.length > 0 && (
                  <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                      <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                        <Globe size={32} />
                      </div>
                      <div className="space-y-1 text-center md:text-left">
                        <h2 className="text-2xl font-black text-slate-900">{isSearchingNiches ? 'Searching...' : `Found ${nicheResults.length} Communities`}</h2>
                        <p className="text-sm font-medium text-slate-400">Discover active Reddit communities for your industry or product.</p>
                      </div>
                    </div>
                  </div>
                )}

                {isSearchingNiches ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-50">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="h-64 bg-slate-100/50 rounded-[2.5rem] animate-pulse border border-slate-100" />
                    ))}
                  </div>
                ) : nicheResults.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {nicheResults.map(niche => (
                      <div key={niche.name} className="bg-white border border-slate-100 rounded-[2.5rem] p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col h-full">
                        <div className="flex items-start justify-between gap-4 mb-4">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center border border-orange-100/50 shadow-inner group-hover:scale-110 transition-transform overflow-hidden shrink-0">
                              {niche.icon ? <img src={niche.icon} className="w-full h-full object-cover" /> : <Users className="text-orange-600" size={24} />}
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-extrabold text-slate-900 group-hover:text-orange-600 transition-colors truncate">r/{niche.name}</h3>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{niche.subscribers?.toLocaleString() || '0'} Members</p>
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed mb-6 min-h-[3rem]">{niche.description || 'No description provided.'}</p>

                        <div className="mt-auto flex flex-col gap-4">
                          <div className="flex items-center gap-2">
                            <div className="px-3 py-1.5 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-lg border border-emerald-100 flex items-center gap-1.5 whitespace-nowrap">
                              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                              {niche.activeUsers?.toLocaleString() || '0'} ACTIVE
                            </div>
                            {niche.over18 && (
                              <div className="px-3 py-1.5 bg-red-50 text-red-600 text-[10px] font-black rounded-lg border border-red-100">NSFW</div>
                            )}
                          </div>

                          <button
                            onClick={() => {
                              setTargetSubreddit(niche.name);
                              setActiveTab('hunter');
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="w-full py-4 bg-orange-600 text-white rounded-2xl shadow-lg shadow-orange-100 hover:bg-orange-700 transition-all flex items-center justify-center gap-2 group/btn font-black text-[10px] uppercase tracking-widest"
                          >
                            <Target size={16} className="group-hover/btn:scale-110 transition-transform" />
                            <span>Hunt Leads in r/{niche.name}</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20 bg-slate-50 rounded-[3.5rem] border-2 border-dashed border-slate-200">
                    <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-slate-100">
                      <Search size={32} className="text-slate-200" />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 mb-2">Unlock Your Ideal Communities 🌐</h3>
                    <p className="text-slate-400 text-sm font-medium max-w-xs mx-auto">Type a keyword like 'SaaS' or 'Fitness' above to reveal high-potential niches where your perfect leads live and breathe.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {/* AI Intent Filters and Actions */}
                {posts.length > 0 && (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center">
                          <Filter size={20} />
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-slate-900 leading-tight">Filter Results</h4>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Categorized by AI Intent</p>
                        </div>
                      </div>
                      <button
                        onClick={async () => {
                          if (!user?.id) return;
                          setPosts([]);
                          setSelectedPost(null);
                          try {
                            await fetch('/api/user/clear-leads', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                              body: JSON.stringify({ userId: user.id })
                            });
                          } catch (err) {
                            console.error('Failed to clear saved leads:', err);
                          }
                        }}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all text-xs font-black uppercase tracking-widest border border-red-100 shadow-sm"
                      >
                        <Trash2 size={16} />
                        <span>Clear All Results</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar no-scrollbar">
                      {['All', 'Problem Solving', 'Seeking Alternative', 'Request Advice', 'Product Launch', 'General'].map(intent => {
                        const count = intent === 'All' ? posts.length : posts.filter(p => p.intent === intent).length;
                        if (intent !== 'All' && count === 0) return null; // Hide empty intents
                        return (
                          <button
                            key={intent}
                            onClick={() => setActiveIntentFilter(intent)}
                            className={`flex-shrink-0 px-5 py-2.5 rounded-2xl text-[11px] font-black transition-all border-2 ${activeIntentFilter === intent ? 'bg-orange-600 text-white border-orange-600 shadow-lg shadow-orange-100' : 'bg-white text-slate-600 border-slate-100 hover:border-orange-200 hover:text-orange-600'}`}
                          >
                            {intent} <span className={`ml-1 px-1.5 py-0.5 rounded-md text-[9px] ${activeIntentFilter === intent ? 'bg-orange-500/50 text-white' : 'bg-slate-50 text-slate-400'}`}>({count})</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}



                {posts.filter(p => activeIntentFilter === 'All' || p.intent === activeIntentFilter).length === 0 && posts.length > 0 && (
                  <div className="text-center py-10 bg-slate-50 rounded-3xl border border-slate-100">
                    <Filter size={32} className="text-slate-300 mx-auto mb-3" />
                    <p className="font-bold text-slate-500">No posts match this intent filter.</p>
                  </div>
                )}





                {posts.length === 0 && !isFetching && !searchError && (
                  <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[3rem] border border-slate-100 shadow-sm space-y-4">
                    <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-200">
                      <Search size={40} />
                    </div>
                    <div className="text-center">
                      <h3 className="text-xl font-bold text-slate-900">No posts found</h3>
                      <p className="text-slate-500 text-sm">Try different keywords or a different subreddit.</p>
                    </div>
                  </div>
                )}

                {posts.filter(p => activeIntentFilter === 'All' || p.intent === activeIntentFilter).map(post => (
                  <div
                    key={post.id}
                    onClick={() => setSelectedPost(post)}
                    className={`p-5 md:p-7 rounded-[2.5rem] transition-all duration-500 border-2 relative group cursor-pointer overflow-hidden ${selectedPost?.id === post.id ? 'border-orange-500 bg-orange-50/10 shadow-xl' : 'border-slate-100 bg-white hover:border-slate-200'}`}
                  >
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-5 pb-4 border-b border-slate-50">
                      <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto no-scrollbar pb-2 md:pb-0">
                        <span className="shrink-0 px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-[10px] font-black uppercase tracking-widest">r/{post.subreddit}</span>
                        <span className="shrink-0 text-[10px] font-bold text-slate-400">u/{post.author}</span>
                      </div>

                      {/* AI Intel Badge (Now relative and better positioned) */}
                      {(post.opportunityScore > 0 || post.intent) && (
                        <div className="flex flex-col items-end gap-2 w-full md:w-auto">
                          <div className="flex flex-wrap items-center gap-2 justify-start md:justify-end">
                            {post.opportunityScore > 50 && (
                              <div className="flex items-center gap-1 px-3 py-1.5 bg-red-50 border border-red-100 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest flex-shrink-0 shadow-sm shadow-red-50">
                                <Flame size={12} className="fill-current" /> Hot Lead
                              </div>
                            )}
                            <div className="flex items-center gap-1.5 bg-white border border-slate-100 px-3 py-1.5 rounded-xl shadow-sm flex-shrink-0">
                              <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest">AI Score</div>
                              <div className={`text-sm font-black ${post.opportunityScore > 70 ? 'text-emerald-600' : post.opportunityScore > 40 ? 'text-orange-500' : 'text-slate-500'}`}>
                                {post.opportunityScore}
                              </div>
                              <div className="w-px h-4 bg-slate-100 mx-1"></div>
                              <div className="text-[10px] font-bold text-slate-600 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                                {post.intent || 'General'}
                              </div>
                            </div>
                          </div>
                          {post.analysisReason && (
                            <p className="text-[10px] text-slate-400 font-medium italic text-right max-w-[200px]">
                              "{post.analysisReason}"
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col md:flex-row items-start justify-between gap-8">
                      <div className="flex-1 min-w-0 space-y-4">
                        <h3 className="text-base md:text-xl font-bold text-slate-900 leading-snug group-hover:text-orange-600 transition-colors break-words">{post.title}</h3>
                        <p className="text-slate-500 text-sm max-h-[150px] overflow-y-auto custom-scrollbar leading-relaxed break-words pr-2">{post.selftext}</p>
                        <div className="flex items-center gap-5 pt-4">
                          {/* Footer Meta Data */}
                          <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold"><ThumbsUp size={14} /> {post.ups}</div>
                          <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold"><MessageSquarePlus size={14} /> {post.num_comments}</div>
                          <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold">
                            <Clock size={14} />
                            {post.created_utc ? new Date(post.created_utc * 1000).toLocaleDateString() : 'Recent'}
                          </div>
                          {post.scannedComments && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setCollapsedPosts(prev => ({ ...prev, [post.id]: !prev[post.id] }));
                              }}
                              className="flex items-center gap-1.5 text-orange-600 text-[10px] font-black uppercase tracking-wider bg-orange-50 px-3 py-1.5 rounded-lg hover:bg-orange-100 transition-colors ml-auto"
                            >
                              <ChevronDown size={14} className={`transition-transform duration-300 ${collapsedPosts[post.id] ? '' : 'rotate-180'}`} />
                              {collapsedPosts[post.id] ? 'Show Scanned' : 'Hide Scanned'}
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 w-full md:w-auto mt-4 md:mt-0 md:shrink-0">
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedPost(post); handleSendToAI(post, 'reply-post'); }}
                          className="w-full md:w-48 bg-slate-900 text-white px-6 py-4 rounded-2xl text-sm font-black hover:bg-orange-600 transition-all flex flex-col items-center justify-center shadow-lg active:scale-95 group shrink-0"
                        >
                          <div className="flex items-center gap-2">
                            <Wand2 size={18} />
                            <span>Draft with AI Agent</span>
                          </div>
                          <span className="text-[9px] text-orange-400 font-black uppercase tracking-[0.2em] mt-0.5 group-hover:text-white transition-colors">{costs.comment} PTS</span>
                        </button>

                        {!post.scannedComments && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeepScan(post); }}
                            disabled={isScanning === post.id || post.num_comments === 0}
                            title={post.num_comments === 0 ? "No comments to scan" : ""}
                            className="w-full md:w-48 bg-orange-50 text-orange-600 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-600 hover:text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm border border-orange-100"
                          >
                            {isScanning === post.id ? <RefreshCw size={12} className="animate-spin" /> : <Search size={12} />}
                            <div className="flex flex-col items-center">
                              <span>{isScanning === post.id ? 'Scanning...' : (post.num_comments === 0 ? 'No Comments' : 'Deep Scan')}</span>
                              <span className="text-[8px] opacity-70">{post.num_comments === 0 ? '0' : (costs.deepScan || 0.5)} PTS</span>
                            </div>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Scanned Comments Results */}
                    {post.scannedComments && post.scannedComments.length > 0 && !collapsedPosts[post.id] && (
                      <div className="mt-8 pt-6 border-t border-slate-50 space-y-4 animate-in slide-in-from-top-4 duration-500">
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                            <Sparkles size={12} className="text-orange-500" />
                            {post.scannedComments.length} High-Intent Comments Found In Thread
                          </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {post.scannedComments.map((comment: any) => (
                            <div
                              key={comment.id}
                              className="bg-slate-50/50 hover:bg-white border border-slate-100 hover:border-orange-200 p-5 rounded-3xl transition-all shadow-sm group/comment relative"
                            >
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center text-[10px] font-bold text-slate-400 border border-slate-100 shadow-sm">u/</div>
                                  <span className="text-[11px] font-black text-slate-900">{comment.author}</span>
                                </div>
                                <div className="flex items-center gap-1.5 bg-orange-100 text-orange-700 px-2 py-1 rounded-lg text-[9px] font-black">
                                  SCORE: {comment.opportunityScore}
                                </div>
                              </div>
                              <p className="text-xs text-slate-600 leading-relaxed mb-4 max-h-[100px] overflow-y-auto custom-scrollbar italic break-words pr-2">"{comment.body}"</p>
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-auto gap-3">
                                <p className="text-[9px] text-orange-600 font-bold bg-orange-50 px-2.5 py-1.5 rounded-md border border-orange-100 flex-1 break-words">💡 {comment.reason}</p>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const commentUrl = post.url.split('?')[0].replace(/\/$/, '') + '/' + comment.id;
                                    const pseudoPost = {
                                      ...post,
                                      id: comment.id,
                                      url: commentUrl,
                                      title: `Replying to comment by u/${comment.author}`,
                                      selftext: comment.body,
                                      author: comment.author,
                                      isComment: true,
                                      redditId: `t1_${comment.id}`
                                    };
                                    setSelectedPost(pseudoPost);
                                    handleSendToAI(pseudoPost, 'reply-comment');
                                  }}
                                  className="bg-orange-600 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-orange-700 transition-all shadow-md"
                                >
                                  Draft with AI Agent
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {post.scannedComments && post.scannedComments.length === 0 && (
                      <div className="mt-6 pt-6 border-t border-slate-50 text-center">
                        <p className="text-[10px] font-bold text-slate-400 italic">No direct opportunities identified in this thread's comments.</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Daily Limit Modal */}
      {
        showDailyLimitModal && (
          <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 font-['Outfit']">
            <div className="bg-white rounded-[2.5rem] p-8 md:p-10 max-w-sm w-full shadow-2xl text-center space-y-6 animate-in zoom-in-95 duration-300 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-blue-50 to-white -z-10" />

              <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-[1.5rem] flex items-center justify-center mx-auto shadow-inner border border-blue-200">
                <Clock size={40} className="fill-current" />
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-900 leading-tight">Daily Limit Reached! 🕒</h3>
                <p className="text-slate-500 text-sm font-medium leading-relaxed">
                  You've reached your allowed quota of <span className="text-orange-600 font-bold">
                    {(() => {
                      const plan = plans.find(p => (p.name || '').toLowerCase() === (user?.plan || '').toLowerCase() || (p.id || '').toLowerCase() === (user?.plan || '').toLowerCase());
                      const planLimit = user?.billingCycle === 'yearly' ? plan?.dailyLimitYearly : plan?.dailyLimitMonthly;
                      return (Number(user?.customDailyLimit) > 0) ? user?.customDailyLimit : (planLimit || 0);
                    })()} PTS
                  </span> for today. Your limit resets every 24 hours.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <Link
                  to="/support"
                  className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black shadow-xl shadow-blue-100 hover:bg-blue-700 hover:scale-[1.02] transition-all flex items-center justify-center gap-2 uppercase tracking-wide text-xs"
                >
                  Contact Support <MessageSquare size={16} />
                </Link>
                <Link
                  to="/pricing"
                  className="w-full py-4 bg-orange-600 text-white rounded-2xl font-black shadow-xl shadow-orange-100 hover:bg-orange-700 hover:scale-[1.02] transition-all flex items-center justify-center gap-2 uppercase tracking-wide text-xs"
                >
                  Upgrade Plan <Crown size={18} />
                </Link>
                <button
                  onClick={() => setShowDailyLimitModal(false)}
                  className="w-full py-3 text-slate-400 font-bold hover:text-slate-600 transition-colors text-xs uppercase tracking-widest"
                >
                  Got it
                </button>
              </div>
            </div>
          </div>
        )}

      {/* Extension Missing Modal */}
      {showExtensionWarning && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl space-y-6 text-center animate-in zoom-in-95 duration-300 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-orange-50 to-white -z-10" />

            <div className="w-20 h-20 bg-orange-100 text-orange-600 rounded-[1.5rem] flex items-center justify-center mx-auto shadow-inner border border-orange-200">
              <AlertTriangle size={40} />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-900 leading-tight">Extension Inactive! ⚠️</h3>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">
                We couldn't detect the <span className="text-orange-600 font-bold">Redigo Extension</span>. Without it, AI generation runs on our servers and will consume <span className="font-bold text-slate-600">Credits</span>.
              </p>
              <p className="text-xs text-slate-400 italic">
                The extension is only required for AI generation — not for posting.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <a
                href="/api/download-extension"
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black shadow-xl shadow-slate-100 hover:bg-emerald-600 hover:scale-[1.02] transition-all flex items-center justify-center gap-2 uppercase tracking-wide text-xs"
              >
                Download Extension <Download size={16} />
              </a>
              <button
                onClick={() => {
                  setShowExtensionWarning(false);
                  isForcedRef.current = true;
                  if (pendingAction) pendingAction();
                }}
                className="w-full py-4 bg-orange-600 text-white rounded-2xl font-black hover:bg-orange-700 transition-all text-xs uppercase tracking-widest shadow-lg shadow-orange-100"
              >
                Continue anyway (Use Credits)
              </button>
              <button
                onClick={() => {
                  setShowExtensionWarning(false);
                  setPendingAction(null);
                }}
                className="w-full py-2 text-slate-400 font-bold hover:text-red-500 transition-colors text-[10px] uppercase tracking-widest"
              >
                Cancel Action
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  );
};
