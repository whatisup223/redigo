
import React, { useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Zap,
  Crown,
  PenTool,
  MessageSquare,
  CreditCard,
  User,
  LifeBuoy,
  ChevronRight,
  Plus,
  Shield,
  Search,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { OnboardingWizard } from './OnboardingWizard';
import { AlertCircle, Download, Smartphone, RefreshCw, Copy, ExternalLink, Trash2, CheckCircle, LayoutList } from 'lucide-react'; // Added icons

interface SidebarItemProps {
  icon: any;
  label: string;
  path: string;
  active: boolean;
  onClick?: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon: Icon, label, path, active, onClick }) => (
  <Link
    to={path}
    onClick={onClick}
    className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 group ${active
      ? 'bg-orange-600 text-white shadow-lg shadow-orange-200 font-semibold translate-x-1'
      : 'text-slate-500 hover:bg-white hover:text-slate-900 hover:shadow-sm'
      }`}
  >
    <Icon
      size={20}
      className={`${active ? 'text-white' : 'group-hover:text-orange-500 transition-colors'}`}
    />
    <span className="text-sm">{label}</span>
  </Link>
);

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isProfileOpen, setIsProfileOpen] = React.useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = React.useState(false);
  const [loadingItems, setLoadingItems] = React.useState(false);
  const [pendingItems, setPendingItems] = React.useState<any[]>([]);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const [toast, setToast] = React.useState<{ message: string, type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchAssistantItems = async () => {
    if (!user?.id) return;
    setLoadingItems(true);
    const activeToken = token || localStorage.getItem('token');
    if (!activeToken || activeToken === 'null' || activeToken === 'undefined') return;
    const authHeaders: HeadersInit = { 'Authorization': `Bearer ${activeToken}` };

    try {
      const [postsRes, repliesRes] = await Promise.all([
        fetch(`/api/user/posts?userId=${user.id}`, { headers: authHeaders }),
        fetch(`/api/user/replies?userId=${user.id}`, { headers: authHeaders })
      ]);
      const posts = postsRes.ok ? await postsRes.json() : [];
      const replies = repliesRes.ok ? await repliesRes.json() : [];

      const combined = [
        ...(Array.isArray(posts) ? posts : [])
          .filter((p: any) => p.status?.toLowerCase() === 'draft' || p.status?.toLowerCase() === 'pending')
          .map((p: any) => ({ ...p, type: 'post' })),
        ...(Array.isArray(replies) ? replies : [])
          .filter((r: any) => r.status?.toLowerCase() === 'draft' || r.status?.toLowerCase() === 'pending')
          .map((r: any) => ({ ...r, type: 'reply' }))
      ];

      combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setPendingItems(combined);
      setPendingCount(combined.length);
    } catch (err) { }
    finally { setLoadingItems(false); }
  };

  const handleDismiss = async (id: string, type: 'post' | 'reply') => {
    const activeToken = token || localStorage.getItem('token');
    if (!activeToken || activeToken === 'null' || activeToken === 'undefined') return;

    try {
      await fetch('/api/reddit/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeToken}`
        },
        body: JSON.stringify({ userId: user?.id, id, type, redditId: 'deleted' })
      });
      setPendingItems(pendingItems.filter(i => (i.id || i._id) !== id));
      setPendingCount(prev => prev - 1);
    } catch (e) { }
  };

  const [isSyncing, setIsSyncing] = React.useState(false);

  const handleSyncItems = async () => {
    const userId = user?.id || (user as any)?._id;
    if (!userId || isSyncing) return;
    setIsSyncing(true);
    const activeToken = token || localStorage.getItem('token');
    if (!activeToken || activeToken === 'null' || activeToken === 'undefined') return;
    const authHeaders: HeadersInit = { 'Authorization': `Bearer ${activeToken}` };

    try {
      const ts = Date.now();
      // Force fresh Reddit fetch — invalidates cache
      await Promise.all([
        fetch(`/api/user/posts/sync?userId=${userId}&_=${ts}&forceRefresh=1`, { headers: authHeaders }),
        fetch(`/api/user/replies/sync?userId=${userId}&_=${ts}&forceRefresh=1`, { headers: authHeaders })
      ]);

      // Snapshot count before refresh
      const prevCount = pendingItems.length;
      // Snapshot which items were Pending before
      const pendingBeforeSync = pendingItems
        .filter(i => i.status?.toLowerCase() === 'pending')
        .map(i => i.id || i._id);

      // Reload assistant items from DB — items now Live won't pass Draft/Pending filter
      await fetchAssistantItems();

      // After fetchAssistantItems updates state, compute diff via a short delay
      setTimeout(() => {
        setPendingItems(current => {
          const newCount = current.length;
          const confirmed = prevCount - newCount;
          const HOURS_48 = 48 * 60 * 60 * 1000;

          // Items that were Pending before sync and are STILL Pending after sync
          // → sync didn't find them on Reddit → reset to Draft so user can re-publish
          const stillStuckPending = current.filter(i =>
            pendingBeforeSync.includes(i.id || i._id) &&
            i.status?.toLowerCase() === 'pending'
          );

          if (stillStuckPending.length > 0) {
            // Reset to Draft in DB so user can try again
            stillStuckPending.forEach(item => {
              fetch('/api/item/status', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${activeToken}`
                },
                body: JSON.stringify({ id: item.id || item._id, status: 'Draft' })
              }).catch(() => { });
            });
            // Update UI immediately
            return current.map(i =>
              pendingBeforeSync.includes(i.id || i._id) && i.status?.toLowerCase() === 'pending'
                ? { ...i, status: 'Draft' }
                : i
            );
          }

          const possiblyDeletedCount = current.filter(i =>
            ['pending', 'sent'].includes((i.status || '').toLowerCase()) &&
            i.deployedAt && (Date.now() - new Date(i.deployedAt).getTime()) > HOURS_48
          ).length;

          if (confirmed > 0) {
            showToast(`✅ ${confirmed} item(s) confirmed published!`, 'success');
          } else if (possiblyDeletedCount > 0) {
            showToast(`⚠️ ${possiblyDeletedCount} item(s) not found — may have been deleted by Reddit.`, 'error');
          } else {
            showToast('✅ Sync complete. Publish your content then sync again to confirm.', 'success');
          }
          return current;
        });
      }, 800);

    } catch (e) {
      showToast('Sync failed. Check your connection.', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const location = useLocation();
  const navigate = useNavigate();
  const { user, token, logout, updateUser } = useAuth(); // Added token
  const sidebarRef = useRef<HTMLElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const [isExtensionMissing, setIsExtensionMissing] = React.useState(false);

  // Helper for downloading images in Assistant
  const handleDownloadImage = async (imageUrl: string, title?: string) => {
    if (!imageUrl) return;
    try {
      const filename = `redigo-${title?.replace(/\s+/g, '-').toLowerCase() || 'image'}-${Date.now()}.png`;
      const proxyUrl = `/api/proxy-download?url=${encodeURIComponent(imageUrl)}&filename=${encodeURIComponent(filename)}`;
      const a = document.createElement('a');
      a.href = proxyUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  const [pendingCount, setPendingCount] = React.useState(0);

  // Effect 1: Listen for messages from the extension
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      const { source, type, payload } = event.data || {};
      if (source !== 'REDIGO_EXT') return;

      // (A) Extension opened Reddit tab for deployment
      if (type === 'DEPLOY_RESPONSE') {
        const response = payload;
        if (response?.status === 'DEPLOYING') {
          showToast('Success! Thread opened in Reddit.', 'success');
          if (response.itemId) {
            fetch('/api/item/status', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: response.itemId, status: 'Pending' })
            }).catch(console.error);
            setPendingItems(prev => prev.map(i => (i.id || i._id) === response.itemId ? { ...i, status: 'Pending' } : i));
          }
        }
      }

      // (B) Extension detected successful Reddit publish → remove item immediately
      if (type === 'REDIGO_POST_CONFIRMED') {
        const { itemId } = event.data;
        if (itemId) {
          setPendingItems(prev => prev.filter(i => (i.id || i._id) !== itemId));
          setPendingCount(prev => Math.max(0, prev - 1));
          showToast('✅ تم التأكيد! تم كشف نشرك على Reddit تلقائياً.', 'success');
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Effect 2: Auto Polling — fallback for mobile/browser without extension
  // Stabilized counter to avoid re-triggering the effect on every render
  const pendingPollCountRef = React.useRef(0);
  const pendingPollCount = pendingItems.filter(i =>
    ['pending', 'sent'].includes((i.status || '').toLowerCase())
  ).length;
  // Only update ref when value actually changes (prevents infinite re-renders)
  if (pendingPollCountRef.current !== pendingPollCount) {
    pendingPollCountRef.current = pendingPollCount;
  }

  useEffect(() => {
    const userId = user?.id || (user as any)?._id;
    const hasPending = pendingItems.some(i =>
      ['pending', 'sent', 'draft'].includes((i.status || '').toLowerCase())
    );
    if (!hasPending || !userId) return;

    const delays = [30_000, 60_000, 120_000, 240_000, 480_000]; // 30s, 1m, 2m, 4m, 8m
    let attempt = 0;
    let timeoutId: ReturnType<typeof setTimeout>;
    let cancelled = false;

    const poll = async () => {
      if (cancelled) return;

      const activeToken = token || localStorage.getItem('token');
      if (!activeToken || activeToken === 'null' || activeToken === 'undefined') return;
      const authHeaders: HeadersInit = { 'Authorization': `Bearer ${activeToken}` };

      try {
        const ts = Date.now();
        const [postsRes, repliesRes] = await Promise.all([
          fetch(`/api/user/posts/sync?userId=${userId}&_=${ts}`, { headers: authHeaders }),
          fetch(`/api/user/replies/sync?userId=${userId}&_=${ts}`, { headers: authHeaders })
        ]);

        const posts = postsRes.ok ? await postsRes.json() : [];
        const replies = repliesRes.ok ? await repliesRes.json() : [];
        const all: any[] = [...(Array.isArray(posts) ? posts : []), ...(Array.isArray(replies) ? replies : [])];

        // Build a normalized live-map with String() comparison — fixes ObjectId vs string mismatch
        const liveMap = new Map<string, true>();
        for (const r of all) {
          if (['live', 'sent', 'active'].includes((r.status || '').toLowerCase())) {
            if (r.id) liveMap.set(String(r.id), true);
            if (r._id) liveMap.set(String(r._id), true);
          }
        }

        if (liveMap.size > 0) {
          setPendingItems(prev => {
            const confirmedIds = new Set<string>();
            for (const item of prev) {
              const idStr = String(item.id || item._id || '');
              const mongoStr = String(item._id || '');
              if (liveMap.has(idStr) || (mongoStr && liveMap.has(mongoStr))) {
                confirmedIds.add(item.id || item._id);
              }
            }

            if (confirmedIds.size > 0) {
              showToast(`✅ تم التأكيد! تم كشف نشرك على Reddit.`, 'success');
              setPendingCount(prev2 => Math.max(0, prev2 - confirmedIds.size));
              return prev.filter(i => !confirmedIds.has(i.id || i._id));
            }
            return prev;
          });
        }

      } catch (_) { /* Network error — continue polling */ }

      attempt++;
      if (cancelled) return;

      if (attempt >= delays.length) {
        // All attempts exhausted — just warn, don't forcefully revert to Draft
        showToast('⚠️ لم نتأكد من النشر تلقائياً. اضغط Sync للتحقق يدوياً.', 'error');
        return;
      }

      timeoutId = setTimeout(poll, delays[attempt]);
    };

    timeoutId = setTimeout(poll, delays[0]);
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingPollCountRef.current, user?.id]);



  useEffect(() => {
    const checkExtension = () => {
      const isMobile = window.innerWidth <= 768 || /Mobi|Android/i.test(navigator.userAgent);
      const isInstalled = document.documentElement.getAttribute('data-redigo-extension') === 'installed';
      setIsExtensionMissing(!isInstalled && !isMobile);

      if (isInstalled && user?.id) {
        window.postMessage({
          source: 'REDIGO_WEB_APP',
          type: 'EXTENSION_PING',
          userId: user.id
        }, '*');
      }
    };
    checkExtension();
    const interval = setInterval(checkExtension, 10000);
    return () => clearInterval(interval);
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    const fetchPendingCount = async () => {
      const activeToken = token || localStorage.getItem('token');
      if (!activeToken || activeToken === 'null' || activeToken === 'undefined') return;
      const authHeaders: HeadersInit = { 'Authorization': `Bearer ${activeToken}` };

      try {
        const [postsRes, repliesRes] = await Promise.all([
          fetch(`/api/user/posts?userId=${user.id}`, { headers: authHeaders }),
          fetch(`/api/user/replies?userId=${user.id}`, { headers: authHeaders })
        ]);
        const posts = postsRes.ok ? await postsRes.json() : [];
        const replies = repliesRes.ok ? await repliesRes.json() : [];
        const pendingPosts = (Array.isArray(posts) ? posts : []).filter((p: any) => p.status?.toLowerCase() === 'pending' || p.status?.toLowerCase() === 'draft').length;
        const pendingReplies = (Array.isArray(replies) ? replies : []).filter((r: any) => r.status?.toLowerCase() === 'pending' || r.status?.toLowerCase() === 'draft').length;
        setPendingCount(pendingPosts + pendingReplies);
      } catch (err) { }
    };
    fetchPendingCount();
    const interval = setInterval(fetchPendingCount, 60000); // Check every 60s locally to save rate limits
    return () => clearInterval(interval);
  }, [user?.id]);

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Zap, label: 'AI Writing Agent', path: '/ai-agent' },
    { icon: Search, label: 'Lead Finder', path: '/lead-finder' },
    { icon: LayoutList, label: 'Content Library', path: '/library' }, // New Library link
    { icon: BarChart3, label: 'Analytics', path: '/analytics' },
    { icon: CreditCard, label: 'Pricing', path: '/pricing' },
    { icon: LifeBuoy, label: 'Help & Support', path: '/support' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  const isAdmin = user?.role?.toLowerCase() === 'admin';
  if (isAdmin) {
    menuItems.push({ icon: Shield, label: 'Admin Panel', path: '/admin' } as any);
  }

  // Close sidebar when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Close sidebar or profile when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('click', handleClick);
    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, [isOpen, isProfileOpen]);

  // Prevent body scroll when sidebar open on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return (
    <div className="min-h-screen bg-[#fcfcfd] flex font-['Outfit']">
      {!user?.hasCompletedOnboarding && <OnboardingWizard />}

      {/* ── Mobile top bar ── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-sm">
        <Link to="/dashboard" className="flex items-center gap-2 active:scale-95 transition-all group">
          <div className="w-8 h-8 bg-orange-600 rounded-xl flex items-center justify-center text-white shadow-md group-hover:rotate-12 transition-transform">
            <Zap fill="currentColor" size={16} />
          </div>
          <span className="text-lg font-extrabold tracking-tight text-slate-900">RedditGo</span>
        </Link>

        <div className="flex items-center gap-3">
          {/* Mobile Credits Badge - Clickable */}
          <Link
            to="/pricing"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-600/10 border border-orange-600/20 rounded-xl text-orange-600 active:scale-95 transition-all"
          >
            <Zap size={14} fill="currentColor" />
            <span className="text-xs font-black">{user?.credits || 0}</span>
          </Link>

          <div className="relative" ref={profileRef}>
            <button
              onClick={(e) => { e.stopPropagation(); setIsProfileOpen(!isProfileOpen); }}
              className="w-9 h-9 rounded-xl bg-gradient-to-tr from-orange-600 to-orange-400 p-0.5 shadow-sm text-white flex items-center justify-center font-black text-[10px] uppercase active:scale-95 transition-all"
            >
              {user?.avatar ? (
                <img src={user.avatar} alt="Profile" className="w-full h-full object-cover rounded-[0.55rem]" />
              ) : (
                <div className="w-full h-full bg-white rounded-[0.55rem] flex items-center justify-center text-orange-600">
                  {user?.name ? user.name.substring(0, 2).toUpperCase() : 'JD'}
                </div>
              )}
            </button>

            {isProfileOpen && (
              <div className="absolute top-full right-0 mt-3 w-64 bg-white rounded-[2rem] shadow-2xl border border-slate-100 p-2 z-[60] animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                <Link
                  to="/settings"
                  onClick={() => setIsProfileOpen(false)}
                  className="block px-4 py-3 border-b border-slate-50 mb-1 hover:bg-slate-50 transition-colors group/mobile-info"
                >
                  <p className="text-xs font-black text-slate-900 truncate group-hover/mobile-info:text-orange-600 transition-colors">{user?.name}</p>
                  <p className="text-[10px] font-bold text-slate-400 truncate">{user?.email}</p>
                </Link>
                <div className="space-y-0.5">
                  <Link to="/pricing" onClick={() => setIsProfileOpen(false)} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 rounded-xl text-slate-600 transition-colors">
                    <CreditCard size={16} /> <span className="text-xs font-bold">Manage Plan</span>
                  </Link>
                  <Link to="/settings" onClick={() => setIsProfileOpen(false)} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 rounded-xl text-slate-600 transition-colors">
                    <Settings size={16} /> <span className="text-xs font-bold">Settings</span>
                  </Link>
                  <Link to="/support" onClick={() => setIsProfileOpen(false)} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 rounded-xl text-slate-600 transition-colors">
                    <LifeBuoy size={16} /> <span className="text-xs font-bold">Help & Support</span>
                  </Link>
                </div>
                <div className="h-px bg-slate-50 my-2 mx-2" />
                <button
                  onClick={() => { logout(); setIsProfileOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-2xl transition-all group/logout"
                >
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm group-hover/logout:scale-110 transition-transform">
                    <LogOut size={16} />
                  </div>
                  <span className="text-sm font-black">Sign Out Account</span>
                </button>
              </div>
            )}
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(!isOpen);
            }}
            className="p-2.5 bg-slate-100 hover:bg-orange-50 hover:text-orange-600 text-slate-600 rounded-xl transition-all active:scale-95"
            aria-label="Open menu"
          >
            {isOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200"
          aria-hidden="true"
        />
      )}

      <aside
        ref={sidebarRef}
        className={`fixed lg:sticky top-0 h-screen w-72 bg-[#f8fafc] backdrop-blur-xl border-r border-slate-200/60 transition-transform duration-300 z-[100] flex flex-col ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-orange-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-orange-100 ring-4 ring-orange-50">
              <Zap fill="currentColor" size={24} />
            </div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900">RedditGo</h1>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1 custom-scrollbar">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3 px-4">Main Menu</p>
          {menuItems.map((item) => (
            <SidebarItem
              key={item.path}
              icon={item.icon}
              label={item.label}
              path={item.path}
              active={location.pathname === item.path}
            />
          ))}
        </div>

        <div className="shrink-0 px-4 pb-20 pt-3 border-t border-slate-200/60 space-y-3">
          {isAdmin && (
            <Link
              to="/admin"
              onClick={() => setIsOpen(false)}
              className="block bg-slate-900 p-4 rounded-3xl shadow-lg shadow-slate-200 text-white relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-2xl -mr-6 -mt-6 group-hover:scale-150 transition-transform duration-500" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-1">
                  <Shield size={16} className="text-orange-500 fill-orange-500 animate-pulse" />
                  <span className="font-bold text-sm tracking-wide">Back to Admin</span>
                </div>
                <p className="text-slate-400 text-[10px] leading-relaxed font-medium">Access system controls and management.</p>
              </div>
            </Link>
          )}

          {user?.plan === 'Starter' && !isAdmin && (
            <Link
              to="/pricing"
              onClick={() => setIsOpen(false)}
              className="block bg-gradient-to-br from-orange-500 to-red-500 p-4 rounded-3xl shadow-lg shadow-orange-200 text-white relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -mr-6 -mt-6 group-hover:scale-150 transition-transform duration-500" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-1">
                  <Crown size={16} className="text-yellow-300 fill-yellow-300 animate-pulse" />
                  <span className="font-bold text-sm tracking-wide">Upgrade to Pro</span>
                </div>
                <p className="text-orange-100 text-[10px] leading-relaxed font-medium">Unlock unlimited AI replies and advanced analytics.</p>
              </div>
            </Link>
          )}

          <Link
            to="/settings"
            onClick={() => setIsOpen(false)}
            className="block bg-white/80 border border-slate-200/60 p-3 rounded-2xl shadow-sm hover:border-orange-300 hover:shadow-md transition-all group bg-gradient-to-br from-white to-slate-50/50"
          >
            <div className="flex items-center gap-3">
              {user?.avatar ? (
                <img src={user.avatar} alt="Profile" className="w-9 h-9 rounded-xl object-cover shadow-inner shrink-0 group-hover:scale-105 transition-transform border border-white" />
              ) : (
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-slate-200 to-slate-100 flex items-center justify-center text-slate-600 font-bold shadow-inner uppercase text-sm shrink-0 group-hover:scale-105 transition-transform border border-white">
                  {user?.name ? user.name.substring(0, 2) : 'JD'}
                </div>
              )}
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-bold text-slate-900 truncate group-hover:text-orange-600 transition-colors">{user?.name || 'Guest User'}</p>
                <div className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${user?.plan === 'Starter' ? 'bg-slate-400' : 'bg-green-500 animate-pulse'}`} />
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider group-hover:text-slate-600 transition-colors">{user?.plan || 'Guest'} Plan</p>
                </div>
              </div>
            </div>
          </Link>

          <div className="pt-2">
            <button
              onClick={() => { logout(); setIsOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-2xl transition-all group/sidebar-logout"
            >
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm group-hover/sidebar-logout:scale-110 transition-transform">
                <LogOut size={16} />
              </div>
              <span className="text-sm font-black">Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="hidden lg:flex shrink-0 h-20 items-center justify-end px-10 bg-white/40 backdrop-blur-xl border-b border-slate-200/60 z-30">
          <div className="flex items-center gap-6">
            {/* Credits System Indicator - Clickable */}
            <Link
              to="/pricing"
              className="flex items-center gap-3 px-5 py-2.5 bg-white border border-slate-200/60 rounded-2xl shadow-sm group cursor-pointer hover:border-orange-200 hover:shadow-md transition-all active:scale-[0.98]"
            >
              <div className="w-8 h-8 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Zap size={16} fill="currentColor" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">Available Credits</p>
                <p className="text-sm font-black text-slate-900 leading-none">{user?.credits || 0} <span className="text-[10px] text-slate-400 font-bold tracking-normal">points</span></p>
              </div>
              <div className="ml-2 w-5 h-5 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 group-hover:bg-orange-600 group-hover:text-white transition-all">
                <Plus size={12} />
              </div>
            </Link>

            {/* Profile Section with Dropdown */}
            <div className="flex items-center gap-4 pl-2 relative" ref={profileRef}>
              <Link to="/settings"
                onClick={(e) => e.stopPropagation()}
                className="text-right hidden xl:block group/name"
              >
                <p className="text-sm font-black text-slate-900 leading-none mb-1 group-hover/name:text-orange-600 transition-colors">{user?.name || 'Guest User'}</p>
                <p className="text-[10px] font-bold text-orange-600 uppercase tracking-widest leading-none">
                  {user?.plan || 'Starter'} Plan
                </p>
              </Link>
              <button
                onClick={(e) => { e.stopPropagation(); setIsProfileOpen(!isProfileOpen); }}
                className="relative group focus:outline-none"
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-600 to-orange-400 p-0.5 shadow-lg shadow-orange-100 group-hover:scale-105 transition-all cursor-pointer">
                  {user?.avatar ? (
                    <img src={user.avatar} alt="Profile" className="w-full h-full object-cover rounded-[0.85rem]" />
                  ) : (
                    <div className="w-full h-full bg-white rounded-[0.85rem] flex items-center justify-center text-orange-600 font-black text-lg">
                      {user?.name ? user.name.substring(0, 2).toUpperCase() : 'JD'}
                    </div>
                  )}
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full shadow-sm" title="Online" />
              </button>

              {/* Desktop Profile Dropdown */}
              {isProfileOpen && (
                <div className="absolute top-full right-0 mt-4 w-72 bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 p-3 z-50 animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-[1.8rem] mb-2">
                    {user?.avatar ? (
                      <img src={user.avatar} alt="Profile" className="w-10 h-10 rounded-xl object-cover bg-orange-600" />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center text-white font-black">
                        {user?.name ? user.name.substring(0, 1).toUpperCase() : 'U'}
                      </div>
                    )}
                    <div className="overflow-hidden">
                      <p className="text-sm font-black text-slate-900 truncate">{user?.name}</p>
                      <p className="text-[10px] font-bold text-slate-400 truncate">{user?.email}</p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Link to="/pricing" onClick={() => setIsProfileOpen(false)} className="w-full flex items-center justify-between px-5 py-3 hover:bg-slate-50 rounded-2xl text-slate-600 transition-all group">
                      <div className="flex items-center gap-3">
                        <CreditCard size={18} className="group-hover:text-orange-600" />
                        <span className="text-sm font-bold">Manage Plan</span>
                      </div>
                      <ChevronRight size={14} className="text-slate-300" />
                    </Link>
                    <Link to="/settings" onClick={() => setIsProfileOpen(false)} className="w-full flex items-center justify-between px-5 py-3 hover:bg-slate-50 rounded-2xl text-slate-600 transition-all group">
                      <div className="flex items-center gap-3">
                        <Settings size={18} className="group-hover:text-orange-600" />
                        <span className="text-sm font-bold">Settings</span>
                      </div>
                      <ChevronRight size={14} className="text-slate-300" />
                    </Link>
                    <Link to="/support" onClick={() => setIsProfileOpen(false)} className="w-full flex items-center justify-between px-5 py-3 hover:bg-slate-50 rounded-2xl text-slate-600 transition-all group">
                      <div className="flex items-center gap-3">
                        <LifeBuoy size={18} className="group-hover:text-orange-600" />
                        <span className="text-sm font-bold">Help & Support</span>
                      </div>
                      <ChevronRight size={14} className="text-slate-300" />
                    </Link>
                  </div>

                  <div className="h-px bg-slate-100 my-2 mx-4" />

                  <button
                    onClick={() => logout()}
                    className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-red-50 text-red-500 rounded-2xl transition-all group"
                  >
                    <LogOut size={18} />
                    <span className="text-sm font-black">Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto custom-scrollbar pt-24 lg:pt-8 px-6 pb-6 lg:px-12 lg:pb-12">
          {isExtensionMissing && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-[2rem] p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm animate-in slide-in-from-top-4 duration-500">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center text-red-600 shrink-0 shadow-inner">
                  <AlertCircle size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 leading-tight">Security Engine Missing!</h3>
                  <p className="text-sm font-medium text-slate-600">Please install the Redigo Chrome Extension to enable safe posting and avoid Reddit bans.</p>
                </div>
              </div>
              <a
                href="/api/download-extension"
                download="redigo-extension.zip"
                onClick={() => {
                  // Optional: alert to guide the user after they click download
                  setTimeout(() => alert("Extension downloaded! Extract the ZIP and load it as an Unpacked Extension in Chrome or via about:debugging in Firefox."), 500);
                }}
                className="w-full md:w-auto px-8 py-4 bg-red-600 text-white rounded-2xl font-black text-sm hover:bg-red-700 transition-all shadow-lg flex items-center justify-center gap-2 uppercase tracking-widest shrink-0"
              >
                <Download size={18} /> Install Extension
              </a>
            </div>
          )}
          {children}

          {/* Mobile & Desktop Assistant/Extension Floating Button */}
          <button
            onClick={() => {
              setIsAssistantOpen(true);
              fetchAssistantItems();
            }}
            id="redigo-assistant-button"
            className={`fixed bottom-8 right-8 w-14 h-14 rounded-2xl shadow-2xl flex items-center justify-center z-[100] transition-all hover:scale-110 active:scale-95 animate-in zoom-in-50 duration-500 ${isExtensionMissing ? 'bg-red-600 shadow-red-200' : 'bg-orange-600 shadow-orange-200'
              }`}
            title={isExtensionMissing ? "Extension Missing!" : "Redigo Assistant"}
          >
            <div className="relative">
              <Zap size={28} fill="currentColor" className="text-white" />
              {(pendingCount > 0) && (
                <span className="absolute -top-3 -right-3 min-w-[24px] h-6 bg-slate-900 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-lg border-2 border-white px-1">
                  {pendingCount > 9 ? '9+' : pendingCount}
                </span>
              )}
              {isExtensionMissing && (
                <span className="absolute -bottom-1 -left-1 w-5 h-5 bg-white text-red-600 rounded-full flex items-center justify-center shadow border-2 border-red-600">
                  <X size={10} strokeWidth={4} />
                </span>
              )}
            </div>
          </button>

          {/* Global Assistant Drawer */}
          {isAssistantOpen && (
            <div className="fixed inset-0 z-[1000] bg-slate-900/40 backdrop-blur-sm flex justify-end animate-in fade-in duration-300" onClick={() => setIsAssistantOpen(false)}>
              <div
                className="bg-white w-full max-w-lg h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 relative"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-orange-600 opacity-20"></div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-orange-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-orange-100 rotate-3 animate-pulse-soft">
                      <Zap size={24} fill="currentColor" />
                    </div>
                    <div>
                      <h2 className="font-black text-slate-900 text-lg">Assistant</h2>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{pendingCount} Items Ready</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSyncItems}
                      disabled={isSyncing}
                      title="Sync & check publish status"
                      className="w-10 h-10 bg-orange-50 hover:bg-orange-100 disabled:opacity-50 rounded-2xl text-orange-500 hover:text-orange-700 transition-all flex items-center justify-center border border-orange-100"
                    >
                      <RefreshCw size={18} className={isSyncing ? 'animate-spin' : ''} />
                    </button>
                    <button onClick={() => setIsAssistantOpen(false)} className="w-10 h-10 bg-slate-50 hover:bg-slate-100 rounded-2xl text-slate-400 hover:text-red-500 transition-all flex items-center justify-center border border-slate-100">
                      <X size={20} />
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar bg-[#f8fafc]">
                  {loadingItems ? (
                    <div className="flex flex-col items-center justify-center py-20">
                      <div className="w-16 h-16 bg-white rounded-3xl shadow-xl flex items-center justify-center mb-4 animate-bounce">
                        <RefreshCw size={28} className="animate-spin text-orange-600" />
                      </div>
                      <p className="font-black text-slate-900 uppercase tracking-[0.2em] text-[11px]">Syncing Database...</p>
                    </div>
                  ) : pendingItems.length === 0 ? (
                    <div className="text-center py-24 px-8">
                      <div className="w-24 h-24 bg-white shadow-xl rounded-[2rem] flex items-center justify-center mx-auto mb-6 transform -rotate-6">
                        <CheckCircle size={40} className="text-emerald-500" />
                      </div>
                      <h3 className="text-xl font-black text-slate-900 mb-2">Workspace Clear</h3>
                      <p className="text-sm text-slate-500 font-medium">All generated items have been successfully published. Head to the Post Agent to create more!</p>
                    </div>
                  ) : (
                    pendingItems.map((rawItem) => {
                      const item = { ...rawItem };
                      const isMobile = window.innerWidth <= 768 || /Mobi|Android/i.test(navigator.userAgent);

                      // Handle JSON in postContent
                      if (item.type === 'post' && item.postContent?.startsWith('{')) {
                        try {
                          const parsed = JSON.parse(item.postContent);
                          item.postTitle = parsed.title || item.postTitle;
                          item.postContent = parsed.content || item.postContent;
                        } catch (e) { }
                      }

                      return (
                        <div key={item.id || item._id} className="bg-white rounded-[2rem] border border-slate-100 p-6 space-y-5 shadow-sm hover:shadow-xl hover:border-orange-100 transition-all group overflow-hidden relative">
                          {/* Decorative Background Icon */}
                          <div className="absolute -top-4 -right-4 opacity-[0.03] transform rotate-12 transition-all group-hover:scale-150 duration-700">
                            <Zap size={120} fill="currentColor" className="text-orange-600" />
                          </div>

                          <div className="flex items-center justify-between relative z-10">
                            <div className="flex items-center gap-2">
                              <span className={`px-4 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-xl shadow-sm ${item.type === 'post' ? 'bg-indigo-600 text-white' : 'bg-emerald-600 text-white'
                                }`}>
                                {item.type}
                              </span>
                              <div className={`px-2 py-0.5 text-[8px] font-black uppercase rounded-md tracking-widest flex items-center gap-1 ${item.status?.toLowerCase() === 'draft' || !item.status ? 'bg-orange-50 text-orange-600 border border-orange-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                }`}>
                                <span className={`w-1 h-1 rounded-full ${item.status?.toLowerCase() === 'draft' || !item.status ? 'bg-orange-400' : 'bg-emerald-400'}`} />
                                {item.status || 'Draft'}
                              </div>
                              <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 ml-auto">
                                <ExternalLink size={10} /> r/{item.subreddit || 'reddit'}
                              </span>
                            </div>
                            <button onClick={() => handleDismiss(item.id || item._id, item.type)} className="w-8 h-8 bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all flex items-center justify-center border border-slate-100">
                              <Trash2 size={14} />
                            </button>
                          </div>

                          {/* Item Content Section */}
                          <div className="space-y-4 relative z-10">
                            {(item.postTitle || item.title) && (
                              <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Title</label>
                                <div className="bg-slate-50/50 p-3 rounded-2xl border border-dotted border-slate-200 text-xs font-black text-slate-900 leading-snug flex justify-between items-start gap-3">
                                  <span className="flex-1">{item.postTitle || item.title}</span>
                                  <button
                                    onClick={() => handleCopy(`${item.id}_title`, item.postTitle || item.title)}
                                    className={`shrink-0 p-1.5 rounded-lg transition-all ${copiedId === `${item.id}_title` ? 'bg-emerald-500 text-white' : 'hover:bg-slate-200 text-slate-400 hover:text-slate-900'}`}
                                  >
                                    {copiedId === `${item.id}_title` ? <CheckCircle size={14} /> : <Copy size={14} />}
                                  </button>
                                </div>
                              </div>
                            )}

                            <div className="space-y-1.5">
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Content Preview</label>
                              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-[11px] text-slate-600 leading-relaxed font-medium relative group/text">
                                <div className="max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                                  {item.postContent || item.comment || item.content}
                                </div>
                                <button
                                  onClick={() => handleCopy(item.id || item._id, item.postContent || item.comment || item.content)}
                                  className={`absolute top-2 right-2 p-2 rounded-xl border shadow-sm transition-all ${copiedId === (item.id || item._id) ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-100 text-slate-400 hover:text-orange-600 hover:border-orange-200'}`}
                                >
                                  {copiedId === (item.id || item._id) ? <CheckCircle size={14} /> : <Copy size={14} />}
                                </button>
                              </div>
                            </div>

                            {/* Image Display & Download */}
                            {item.imageUrl && (
                              <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Generated Image</label>
                                <div className="relative group/img rounded-2xl overflow-hidden shadow-md border-2 border-white">
                                  <img src={item.imageUrl} alt="AI Visual" className="w-full aspect-video object-cover group-hover/img:scale-105 transition-transform duration-700" />
                                  <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                    <button
                                      onClick={() => handleDownloadImage(item.imageUrl, `redigo_${item.id}.jpg`)}
                                      className="p-3 bg-white text-slate-900 rounded-2xl shadow-2xl hover:bg-orange-600 hover:text-white transition-all transform hover:-translate-y-1"
                                    >
                                      <Download size={18} />
                                    </button>
                                    <a
                                      href={item.imageUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="p-3 bg-white text-slate-900 rounded-2xl shadow-2xl hover:bg-blue-600 hover:text-white transition-all transform hover:-translate-y-1"
                                    >
                                      <ExternalLink size={18} />
                                    </a>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={async () => {
                                const isMobile = window.innerWidth <= 768 || /Mobi|Android/i.test(navigator.userAgent);

                                // Build correct target URL:
                                // - Post  → submit page
                                // - Reply → thread page (postUrl, or built from subreddit+postId)
                                const isPost = item.type === 'post';
                                let targetUrl: string = '';
                                let missingUrl = false;

                                if (isPost) {
                                  targetUrl = `https://www.reddit.com/r/${item.subreddit || 'saas'}/submit`;
                                } else {
                                  if (item.postUrl && !item.postUrl.includes('/submit')) {
                                    targetUrl = item.postUrl.replace('://reddit.com', '://www.reddit.com').replace('://new.reddit.com', '://www.reddit.com');
                                  } else if (item.subreddit && item.postId) {
                                    targetUrl = `https://www.reddit.com/r/${item.subreddit}/comments/${item.postId}/`;
                                  } else {
                                    // No usable URL — warn the user instead of opening wrong page
                                    missingUrl = true;
                                  }
                                }

                                if (missingUrl) {
                                  showToast('⚠️ لم يتم ربط هذا الرد بـ thread بعد. اذهب لـ Analytics للمزامنة.', 'error');
                                  return;
                                }

                                if (isMobile) {
                                  window.open(targetUrl, '_blank');
                                  showToast('فُتح Reddit! الصق الرد وانشر.', 'success');
                                  // Mark as Pending so background sync tracks it
                                  if (item.status?.toLowerCase() === 'draft' || !item.status) {
                                    fetch('/api/item/status', {
                                      method: 'POST',
                                      headers: {
                                        'Content-Type': 'application/json',
                                        'Authorization': `Bearer ${token || localStorage.getItem('token')}`
                                      },
                                      body: JSON.stringify({ id: item.id || item._id, status: 'Pending' })
                                    }).catch(() => { });
                                    setPendingItems(prev => prev.map(i => (i.id || i._id) === (item.id || item._id) ? { ...i, status: 'Pending' } : i));
                                  }
                                  return;
                                }

                                if (!isExtensionMissing) {
                                  window.postMessage({
                                    source: 'REDIGO_WEB_APP',
                                    type: 'REDIGO_DEPLOY',
                                    text: item.postContent || item.comment || item.content,
                                    title: item.postTitle || item.title,
                                    subreddit: item.subreddit,
                                    imageUrl: item.imageUrl ? new URL(item.imageUrl, window.location.origin).href : undefined,
                                    itemId: item.id || item._id,
                                    isPost: isPost,
                                    parentId: !isPost ? (item.redditCommentId || item.postId || undefined) : undefined,
                                    targetUrl: targetUrl
                                  }, '*');
                                  showToast('Sending to Extension...', 'success');
                                } else {
                                  window.open(targetUrl, '_blank');
                                  if (item.status?.toLowerCase() === 'draft' || !item.status) {
                                    fetch('/api/item/status', {
                                      method: 'POST',
                                      headers: {
                                        'Content-Type': 'application/json',
                                        'Authorization': `Bearer ${token || localStorage.getItem('token')}`
                                      },
                                      body: JSON.stringify({ id: item.id || item._id, status: 'Pending' })
                                    }).catch(console.error);
                                    setPendingItems(prev => prev.map(i => (i.id || i._id) === (item.id || item._id) ? { ...i, status: 'Pending' } : i));
                                  }
                                  showToast('Opened Reddit! Auto-sync is tracking this item.', 'success');
                                }
                              }}
                              className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.1em] flex items-center justify-center gap-2 hover:bg-orange-600 shadow-xl transition-all hover:scale-[1.02] active:scale-95 group-hover:shadow-orange-100"
                            >
                              {!isMobile && !isExtensionMissing ? <><Zap size={14} fill="currentColor" /> Deploy</> : <><ExternalLink size={14} /> Open Reddit</>}
                            </button>

                          </div>
                        </div>
                      );
                    }))}
                </div>

                <div className="p-6 bg-slate-50 border-t border-slate-100">
                  <button
                    onClick={fetchAssistantItems}
                    className="w-full py-4 border-2 border-dashed border-slate-200 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:border-indigo-300 hover:text-indigo-600 transition-all"
                  >
                    <RefreshCw size={14} /> Refresh List
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Global Toast */}
      {toast && (
        <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-[2000] px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-4 duration-300 ${toast.type === 'success' ? 'bg-slate-900 text-white' : 'bg-red-600 text-white'
          }`}>
          {toast.type === 'success' ? <CheckCircle size={18} className="text-emerald-400" /> : <AlertCircle size={18} />}
          <span className="text-sm font-bold">{toast.message}</span>
        </div>
      )}
    </div>
  );
};
