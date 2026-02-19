
import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  MessageSquare,
  Users,
  ArrowRight,
  BarChart3,
  Globe,
  Crown,
  RefreshCw,
  Sparkles,
  Target,
  Activity,
  Clock,
  ThumbsUp,
  PenTool,
  MessageSquarePlus,
  ExternalLink,
  TrendingDown,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import CreditsBanner from '../components/CreditsBanner';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { useAuth } from '../context/AuthContext';

// ── helpers ──────────────────────────────────────────────────────────────────

/** Returns the short weekday label (Mon, Tue …) for a given ISO date string */
const dayLabel = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { weekday: 'short' });

/** Returns "YYYY-MM-DD" for a Date object */
const toDateKey = (d: Date) => d.toISOString().slice(0, 10);

/** Builds the last N days as date keys (oldest → newest) */
const lastNDays = (n: number): string[] => {
  const days: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(toDateKey(d));
  }
  return days;
};

/** Formats a trend percentage with sign */
const fmtTrend = (pct: number): string => {
  if (!isFinite(pct)) return 'New';
  return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`;
};

/** Calculates % change between two numbers */
const pctChange = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

// ── sub-components ────────────────────────────────────────────────────────────

const StatCard = ({
  label,
  value,
  sub,
  icon: Icon,
  accent,
  trend,
  isLoading,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: any;
  accent: string;
  trend?: string;
  isLoading?: boolean;
}) => {
  const positive = trend && (trend.startsWith('+') || trend === 'New');
  return (
    <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-sm hover:shadow-xl transition-all duration-500 p-7 group relative overflow-hidden">
      <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10 -mr-8 -mt-8 ${accent}`} />
      <div className="flex items-start justify-between mb-5 relative z-10">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg ${accent} group-hover:scale-110 transition-transform duration-300`}>
          <Icon size={22} />
        </div>
        {trend && (
          <span className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${positive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
            {positive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {trend}
          </span>
        )}
      </div>
      <div className="relative z-10">
        <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-[0.2em] mb-1">{label}</p>
        {isLoading ? (
          <div className="h-9 w-20 bg-slate-100 rounded-xl animate-pulse mt-1" />
        ) : (
          <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{value}</p>
        )}
        {sub && <p className="text-xs text-slate-400 font-medium mt-1">{sub}</p>}
      </div>
    </div>
  );
};

const QuickAction = ({
  icon: Icon,
  title,
  desc,
  to,
  accent,
}: {
  icon: any;
  title: string;
  desc: string;
  to: string;
  accent: string;
}) => (
  <Link
    to={to}
    className="group flex items-center gap-5 p-5 bg-white rounded-[1.75rem] border border-slate-200/60 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
  >
    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg ${accent} group-hover:scale-110 transition-transform`}>
      <Icon size={20} />
    </div>
    <div className="flex-1">
      <p className="font-bold text-slate-900 text-sm">{title}</p>
      <p className="text-slate-400 text-xs font-medium mt-0.5">{desc}</p>
    </div>
    <ArrowRight size={18} className="text-slate-300 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
  </Link>
);

// ── main component ────────────────────────────────────────────────────────────

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [redditConnected, setRedditConnected] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);


  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const [histRes, profileRes, redditRes] = await Promise.allSettled([
        fetch(`/api/user/replies/sync?userId=${user.id}`),
        fetch(`/api/user/reddit/profile?userId=${user.id}`),
        fetch(`/api/user/reddit/status?userId=${user.id}`),
      ]);

      if (histRes.status === 'fulfilled' && histRes.value.ok) {
        const d = await histRes.value.json();
        setHistory(Array.isArray(d) ? d : []);
      }
      if (profileRes.status === 'fulfilled' && profileRes.value.ok) {
        const d = await profileRes.value.json();
        if (!d.error) setProfile(d);
      }
      if (redditRes.status === 'fulfilled' && redditRes.value.ok) {
        const d = await redditRes.value.json();
        setRedditConnected(d.connected);
      }
      setLastRefreshed(new Date());
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── derived stats ────────────────────────────────────────────────────────

  const now = new Date();
  const thisWeekStart = new Date(now);
  thisWeekStart.setDate(now.getDate() - 6);
  thisWeekStart.setHours(0, 0, 0, 0);

  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  const lastWeekEnd = new Date(thisWeekStart);
  lastWeekEnd.setMilliseconds(-1);

  const thisWeek = history.filter(r => new Date(r.deployedAt) >= thisWeekStart);
  const lastWeek = history.filter(r => {
    const d = new Date(r.deployedAt);
    return d >= lastWeekStart && d <= lastWeekEnd;
  });

  const totalComments = history.length;
  const totalUpvotes = history.reduce((a, b) => a + (b.ups || 0), 0);
  const activeSubreddits = new Set(history.map(r => r.subreddit)).size;

  // Reddit karma as "reach" if connected, otherwise upvotes-based estimate
  const totalReach = profile?.totalKarma ?? (totalUpvotes > 0 ? totalUpvotes * 18 : 0);

  // Week-over-week trends
  const commentsTrend = fmtTrend(pctChange(thisWeek.length, lastWeek.length));
  const upvotesTrend = fmtTrend(
    pctChange(
      thisWeek.reduce((a, b) => a + (b.ups || 0), 0),
      lastWeek.reduce((a, b) => a + (b.ups || 0), 0),
    ),
  );
  const subsTrend = fmtTrend(
    pctChange(
      new Set(thisWeek.map(r => r.subreddit)).size,
      new Set(lastWeek.map(r => r.subreddit)).size,
    ),
  );

  // ── chart data: last 7 days from real history ────────────────────────────

  const days7 = lastNDays(7);

  // Group history by date key
  const byDate: Record<string, { comments: number; upvotes: number }> = {};
  history.forEach(r => {
    const key = toDateKey(new Date(r.deployedAt));
    if (!byDate[key]) byDate[key] = { comments: 0, upvotes: 0 };
    byDate[key].comments += 1;
    byDate[key].upvotes += r.ups || 0;
  });

  const chartData = days7.map(dateKey => {
    const d = new Date(dateKey);
    const label = d.toLocaleDateString('en-US', { weekday: 'short' });
    const entry = byDate[dateKey] || { comments: 0, upvotes: 0 };
    return {
      day: label,
      date: dateKey,
      comments: entry.comments,
      upvotes: entry.upvotes,
      reach: entry.upvotes * 18,
    };
  });

  // ── recent activity ──────────────────────────────────────────────────────

  const recent = [...history].slice(0, 5);

  // ── greeting ─────────────────────────────────────────────────────────────

  const greeting = 'Welcome back';

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-fade-in font-['Outfit'] pt-4">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <p className="text-slate-400 font-semibold text-sm">
            {greeting}, {user?.name?.split(' ')[0] || 'there'}
          </p>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-7 bg-orange-600 rounded-full" />
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Overview</h1>
          </div>
          <p className="text-slate-400 font-medium text-sm pl-4">Your Reddit growth at a glance.</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Refresh button */}
          <button
            onClick={fetchData}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-500 hover:text-orange-600 hover:border-orange-200 transition-all disabled:opacity-50"
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
            {lastRefreshed
              ? `Updated ${lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
              : 'Refresh'}
          </button>

          {/* Reddit connection badge */}
          <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl border text-xs font-bold ${redditConnected ? 'bg-green-50 border-green-200 text-green-700' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
            <span className={`w-2 h-2 rounded-full ${redditConnected ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`} />
            {redditConnected ? `Reddit: u/${profile?.name || 'Connected'}` : 'Reddit: Not linked'}
          </div>

          {user?.plan === 'Free' && (
            <Link
              to="/pricing"
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl text-xs font-bold shadow-lg shadow-orange-200 hover:scale-105 transition-transform"
            >
              <Crown size={14} className="fill-yellow-300 text-yellow-300" />
              Upgrade
            </Link>
          )}
        </div>
      </div>

      <CreditsBanner
        plan={user?.plan || 'Free'}
        credits={user?.credits || 0}
      />

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          label="Total Comments"
          value={totalComments}
          sub={`${thisWeek.length} this week`}
          icon={MessageSquare}
          accent="bg-orange-600"
          trend={commentsTrend}
          isLoading={isLoading}
        />
        <StatCard
          label="Total Upvotes"
          value={totalUpvotes.toLocaleString()}
          sub={`${thisWeek.reduce((a, b) => a + (b.ups || 0), 0)} this week`}
          icon={ThumbsUp}
          accent="bg-blue-600"
          trend={upvotesTrend}
          isLoading={isLoading}
        />
        <StatCard
          label={profile?.totalKarma != null ? 'Reddit Karma' : 'Est. Reach'}
          value={
            profile?.totalKarma != null
              ? profile.totalKarma.toLocaleString()
              : totalReach > 1000
                ? `${(totalReach / 1000).toFixed(1)}k`
                : totalReach
          }
          sub={profile?.totalKarma != null ? 'Total karma (live)' : 'Based on upvotes'}
          icon={Users}
          accent="bg-purple-600"
          trend={profile?.totalKarma != null ? 'Live' : undefined}
          isLoading={isLoading}
        />
        <StatCard
          label="Communities"
          value={activeSubreddits}
          sub={`${new Set(thisWeek.map(r => r.subreddit)).size} active this week`}
          icon={Globe}
          accent="bg-emerald-600"
          trend={subsTrend}
          isLoading={isLoading}
        />
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Area Chart — Engagement Trend (real data) */}
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-200/60 shadow-sm p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">Engagement Trend</h2>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Real upvotes &amp; comments — last 7 days
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-orange-500 inline-block" />Upvotes
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" />Comments
              </span>
            </div>
          </div>

          {isLoading ? (
            <div className="h-[260px] flex items-center justify-center">
              <RefreshCw className="animate-spin text-orange-400" size={28} />
            </div>
          ) : (
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="gUp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gCom" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#94a3b8' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#94a3b8' }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.12)', padding: '16px' }}
                    itemStyle={{ fontWeight: 700, fontSize: 12 }}
                    labelStyle={{ fontWeight: 800, fontSize: 12, marginBottom: 8 }}
                  />
                  <Area type="monotone" dataKey="upvotes" name="Upvotes" stroke="#f97316" strokeWidth={3} fill="url(#gUp)" />
                  <Area type="monotone" dataKey="comments" name="Comments" stroke="#3b82f6" strokeWidth={3} fill="url(#gCom)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Bar Chart — Daily Reach (real data) */}
        <div className="bg-white rounded-[2.5rem] border border-slate-200/60 shadow-sm p-8">
          <div className="mb-8">
            <h2 className="text-xl font-extrabold text-slate-900">Daily Reach</h2>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Upvotes × 18 per day (real data)
            </p>
          </div>

          {isLoading ? (
            <div className="h-[260px] flex items-center justify-center">
              <RefreshCw className="animate-spin text-orange-400" size={28} />
            </div>
          ) : (
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barSize={14}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#94a3b8' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#94a3b8' }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.12)', padding: '16px' }}
                    itemStyle={{ fontWeight: 700, fontSize: 12 }}
                    labelStyle={{ fontWeight: 800, fontSize: 12, marginBottom: 8 }}
                    formatter={(v: any) => [v.toLocaleString(), 'Reach']}
                  />
                  <Bar dataKey="reach" name="Reach" fill="#f97316" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom Row: Recent Activity + Quick Actions ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-200/60 shadow-sm overflow-hidden">
          <div className="p-7 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center text-white">
                <Activity size={18} />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">Recent Activity</h2>
                {!isLoading && history.length > 0 && (
                  <p className="text-[10px] text-slate-400 font-medium">{history.length} total replies deployed</p>
                )}
              </div>
            </div>
            <Link to="/analytics" className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1">
              View All <ArrowRight size={14} />
            </Link>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center p-16">
              <RefreshCw className="animate-spin text-orange-600" size={28} />
            </div>
          ) : recent.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 gap-4 text-center">
              <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200">
                <MessageSquarePlus size={28} />
              </div>
              <p className="text-slate-900 font-bold text-sm">No activity yet</p>
              <p className="text-slate-400 text-xs">
                Go to{' '}
                <Link to="/comment-agent" className="text-orange-600 font-bold hover:underline">Comments</Link>
                {' '}to deploy your first AI reply.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {recent.map((row) => (
                <div key={row.id} className="flex items-center gap-4 px-7 py-5 hover:bg-slate-50/60 transition-colors group">
                  <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600 shrink-0">
                    <MessageSquare size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 text-sm truncate group-hover:text-orange-600 transition-colors">
                      {row.postTitle}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-lg">
                        r/{row.subreddit}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                        <Clock size={10} />
                        {new Date(row.deployedAt).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500 shrink-0">
                    <ThumbsUp size={13} className={row.ups > 0 ? 'text-green-500' : 'text-slate-300'} />
                    <span className="text-xs font-bold">{row.ups ?? 0}</span>
                  </div>
                  <a href={row.postUrl} target="_blank" rel="noreferrer" className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <ExternalLink size={14} className="text-slate-400 hover:text-orange-600" />
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions + Reddit Karma */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Sparkles size={16} className="text-orange-600" />
            <h2 className="text-lg font-extrabold text-slate-900">Quick Actions</h2>
          </div>

          <QuickAction
            icon={MessageSquarePlus}
            title="Deploy AI Comment"
            desc="Find posts & generate replies"
            to="/comment-agent"
            accent="bg-orange-600"
          />
          <QuickAction
            icon={PenTool}
            title="Post Architect"
            desc="Create full Reddit posts with AI"
            to="/post-agent"
            accent="bg-blue-600"
          />
          <QuickAction
            icon={BarChart3}
            title="Analytics"
            desc="Deep-dive into performance"
            to="/analytics"
            accent="bg-purple-600"
          />
          <QuickAction
            icon={Target}
            title="Settings"
            desc="Brand profile & integrations"
            to="/settings"
            accent="bg-emerald-600"
          />

          {/* Reddit karma card — only shown when connected */}
          {profile && (
            <div className="bg-slate-900 rounded-[1.75rem] p-6 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-orange-600/20 rounded-full blur-2xl -mr-6 -mt-6" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Reddit Account</p>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center font-black text-sm">
                  {profile.name?.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-sm">u/{profile.name}</p>
                  <p className="text-slate-400 text-[10px]">Live data</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/10 rounded-xl p-3 text-center">
                  <p className="text-lg font-black">{(profile.commentKarma ?? 0).toLocaleString()}</p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Comment Karma</p>
                </div>
                <div className="bg-white/10 rounded-xl p-3 text-center">
                  <p className="text-lg font-black">{(profile.linkKarma ?? 0).toLocaleString()}</p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Link Karma</p>
                </div>
              </div>
              {profile.totalKarma != null && (
                <div className="mt-3 bg-orange-600/20 rounded-xl p-3 text-center border border-orange-600/30">
                  <p className="text-xl font-black">{profile.totalKarma.toLocaleString()}</p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Total Karma</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
