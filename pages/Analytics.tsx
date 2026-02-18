
import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { TrendingUp, Users, MousePointer2, ExternalLink, Calendar, ChevronRight, LayoutList, RefreshCw, BarChart3, PieChart as PieIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const DATA = [
  { name: 'Mon', upvotes: 400, replies: 24, reach: 2400 },
  { name: 'Tue', upvotes: 300, replies: 13, reach: 2210 },
  { name: 'Wed', upvotes: 600, replies: 35, reach: 2290 },
  { name: 'Thu', upvotes: 800, replies: 48, reach: 3000 },
  { name: 'Fri', upvotes: 500, replies: 28, reach: 2181 },
  { name: 'Sat', upvotes: 700, replies: 42, reach: 2500 },
  { name: 'Sun', upvotes: 900, replies: 56, reach: 3100 },
];

const StatCard = ({ label, value, trend, icon: Icon, color }: any) => (
  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm hover:shadow-xl transition-all duration-500 group">
    <div className="flex items-start justify-between mb-6">
      <div className={`p-4 rounded-2xl ${color} shadow-lg transition-transform group-hover:scale-110`}>
        <Icon size={26} />
      </div>
      <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${trend.startsWith('+') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
        <TrendingUp size={12} className={trend.startsWith('-') ? 'rotate-180' : ''} />
        {trend}
      </div>
    </div>
    <div className="space-y-1">
      <h3 className="text-slate-400 text-[11px] font-extrabold uppercase tracking-[0.2em]">{label}</h3>
      <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{value}</p>
    </div>
  </div>
);

export const Analytics: React.FC = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;
      try {
        // Fetch history first as it's critical
        const historyRes = await fetch(`/api/user/replies/sync?userId=${user.id}`);
        if (historyRes.ok) {
          const historyData = await historyRes.json();
          setHistory(Array.isArray(historyData) ? historyData : []);
        }

        // Fetch profile separately
        const profileRes = await fetch(`/api/user/reddit/profile?userId=${user.id}`);
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setProfile(profileData);
        }
      } catch (err) {
        console.error('Failed to fetch data', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Process history for charts
  const chartData = [...history].reverse().reduce((acc: any[], current) => {
    const date = new Date(current.deployedAt).toLocaleDateString('en-US', { weekday: 'short' });
    const existing = acc.find(d => d.name === date);
    if (existing) {
      existing.upvotes += current.ups || 0;
      existing.replies += current.replies || 0;
    } else {
      acc.push({ name: date, upvotes: current.ups || 0, replies: current.replies || 0 });
    }
    return acc;
  }, []);

  // Ensure we have at least some data to show trends, even if zero
  const displayData = chartData.length > 0 ? chartData : [{ name: 'Today', upvotes: 0, replies: 0 }];

  const totalUpvotes = history.reduce((a, b) => a + (b.ups || 0), 0);
  const totalReplies = history.reduce((a, b) => a + (b.replies || 0), 0);
  const activeSubreddits = new Set(history.map(r => r.subreddit)).size;

  // Sentiment Logic (Calculated based on upvotes/replies ratio)
  const sentimentData = [
    { name: 'Supportive', value: history.filter(h => h.ups > 2).length, color: '#10b981' },
    { name: 'Neutral', value: history.filter(h => h.ups <= 2 && h.ups >= 0).length, color: '#94a3b8' },
    { name: 'Critical', value: history.filter(h => h.ups < 0).length, color: '#ef4444' },
  ];

  // Top Communities Logic
  const subPerformance = history.reduce((acc: any, curr) => {
    acc[curr.subreddit] = (acc[curr.subreddit] || 0) + (curr.ups || 0) + (curr.replies || 0);
    return acc;
  }, {});

  const topSubs = Object.entries(subPerformance)
    .map(([name, score]: any) => ({ name, score }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-fade-in font-['Outfit']">
      {/* Detail Modal */}
      {selectedEntry && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-600 rounded-2xl text-white">
                  <LayoutList size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900">Outreach Details</h2>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">r/{selectedEntry.subreddit} • {new Date(selectedEntry.deployedAt).toLocaleString()}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedEntry(null)}
                className="p-3 hover:bg-slate-100 rounded-2xl text-slate-400 transition-colors"
              >
                <RefreshCw size={24} className="rotate-45" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-10 space-y-10">
              {/* Original Post */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-blue-600 rounded-full"></span>
                    <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-widest">Original Post</h3>
                  </div>
                  <a href={selectedEntry.postUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors">
                    View on Reddit <ExternalLink size={12} />
                  </a>
                </div>
                <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100">
                  <h4 className="text-lg font-bold text-slate-900 mb-4">{selectedEntry.postTitle}</h4>
                  <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">{selectedEntry.postContent || "No body content available."}</p>
                </div>
              </div>

              {/* Our AI Reply */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-orange-600 rounded-full"></span>
                  <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-widest">Our AI Reply</h3>
                </div>
                <div className="bg-orange-50/30 rounded-3xl p-8 border border-orange-100 relative">
                  <div className="absolute top-0 right-10 -translate-y-1/2 bg-orange-600 text-white px-4 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest shadow-lg shadow-orange-200">
                    {selectedEntry.productMention} Mentioned
                  </div>
                  <p className="text-slate-800 text-base leading-relaxed whitespace-pre-wrap italic font-medium">"{selectedEntry.comment}"</p>
                </div>
              </div>
            </div>

            <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex justify-end gap-4 font-bold">
              <button
                onClick={() => setSelectedEntry(null)}
                className="px-8 py-4 bg-white border border-slate-200 rounded-[1.5rem] text-slate-600 hover:shadow-md transition-all active:scale-95"
              >
                Close
              </button>
              <a
                href={selectedEntry.postUrl}
                target="_blank"
                rel="noreferrer"
                className="px-8 py-4 bg-orange-600 text-white rounded-[1.5rem] shadow-lg shadow-orange-100 hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-95 flex items-center gap-2"
              >
                Verify on Live Reddit <ExternalLink size={18} />
              </a>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-8 bg-orange-600 rounded-full"></span>
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Performance</h1>
          </div>
          <p className="text-slate-400 font-medium text-lg">Real-time data for your Reddit ecosystem.</p>
        </div>
        <button className="flex items-center gap-3 px-6 py-4 bg-white border border-slate-200/60 rounded-[1.5rem] shadow-sm hover:shadow-md transition-all font-bold text-slate-600">
          <Calendar size={20} />
          <span>Past 7 Days</span>
          <ChevronRight size={18} className="rotate-90 text-slate-300" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="Total Upvotes"
          value={totalUpvotes.toLocaleString()}
          trend="+12.5%"
          icon={TrendingUp}
          color="bg-orange-600 text-white shadow-orange-100"
        />
        <StatCard
          label="Account Authority"
          value={profile ? profile.commentKarma.toLocaleString() : "---"}
          trend="Live"
          icon={Users}
          color="bg-blue-600 text-white shadow-blue-100"
        />
        <StatCard
          label="Engagement Impact"
          value={(totalUpvotes + totalReplies).toLocaleString()}
          trend="+15.0%"
          icon={MousePointer2}
          color="bg-purple-600 text-white shadow-purple-100"
        />
        <StatCard
          label="Target Communities"
          value={activeSubreddits}
          trend="Active"
          icon={ExternalLink}
          color="bg-emerald-600 text-white shadow-emerald-100"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Sentiment Distribution */}
        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200/60 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-extrabold text-slate-900">Sentiment Pulse</h2>
            <PieIcon className="text-slate-300" size={20} />
          </div>
          <div className="h-[280px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sentimentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {sentimentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)' }}
                  itemStyle={{ fontWeight: 800 }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-black text-slate-900">{Math.round((sentimentData[0].value / (history.length || 1)) * 100)}%</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Positive</span>
            </div>
          </div>
          <div className="mt-8 space-y-3">
            {sentimentData.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-sm font-bold text-slate-500">{item.name}</span>
                </div>
                <span className="text-sm font-black text-slate-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Communities */}
        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200/60 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-extrabold text-slate-900">Top Communities</h2>
            <BarChart3 className="text-slate-300" size={20} />
          </div>
          <div className="flex-1 space-y-6">
            {topSubs.length > 0 ? topSubs.map((sub: any, i) => (
              <div key={sub.name} className="group cursor-default">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-black text-slate-900 group-hover:text-orange-600 transition-colors">r/{sub.name}</span>
                  <span className="text-xs font-bold text-slate-400">{sub.score} pts</span>
                </div>
                <div className="h-3 w-full bg-slate-50 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${i === 0 ? 'bg-orange-600' : i === 1 ? 'bg-blue-600' : 'bg-purple-600'}`}
                    style={{ width: `${(sub.score / topSubs[0].score) * 100}%` }}
                  ></div>
                </div>
              </div>
            )) : (
              <div className="h-full flex flex-col items-center justify-center p-10 text-center space-y-4">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200">
                  <Users size={32} />
                </div>
                <p className="text-sm font-bold text-slate-400">Deploy replies to see performance ranking.</p>
              </div>
            )}
          </div>
          <button className="mt-8 w-full py-4 bg-slate-50 hover:bg-slate-100 rounded-2xl text-xs font-black text-slate-400 uppercase tracking-widest transition-all">
            Explore All Subreddits
          </button>
        </div>

        {/* Growth Velocity */}
        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200/60 shadow-sm">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-xl font-extrabold text-slate-900">Growth Velocity</h2>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-orange-600"></span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Dynamic</span>
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={displayData}>
                <defs>
                  <linearGradient id="colorUp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fontWeight: 800, fill: '#94a3b8' }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fontWeight: 800, fill: '#94a3b8' }}
                />
                <Tooltip
                  cursor={{ stroke: '#f97316', strokeWidth: 1, strokeDasharray: '5 5' }}
                  contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', padding: '20px' }}
                />
                <Area type="monotone" dataKey="upvotes" stroke="#f97316" strokeWidth={4} fillOpacity={1} fill="url(#colorUp)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200/60 shadow-sm overflow-hidden min-h-[400px]">
        <div className="p-8 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-extrabold text-slate-900">Outreach History</h2>
            {history.length > 0 && (
              <span className="px-2 py-0.5 bg-slate-900 text-white text-[10px] font-black rounded-lg">{history.length}</span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Live Sync Active</p>
            <button
              onClick={() => {
                setIsLoading(true);
                const refresh = async () => {
                  if (!user?.id) return;
                  const res = await fetch(`/api/user/replies/sync?userId=${user.id}`);
                  if (res.ok) setHistory(await res.json());
                  setIsLoading(false);
                };
                refresh();
              }}
              className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-orange-600 hover:border-orange-200 transition-all active:scale-95 shadow-sm"
            >
              <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-20 gap-4">
              <RefreshCw className="animate-spin text-orange-600" size={32} />
              <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Loading History...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-20 gap-4">
              <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200">
                <LayoutList size={32} />
              </div>
              <p className="text-slate-900 font-bold">No replies deployed yet</p>
              <p className="text-slate-400 text-sm">Start engaging on the Dashboard to see data here.</p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 text-[11px] font-extrabold uppercase tracking-[0.2em]">
                  <th className="px-10 py-5">Origin</th>
                  <th className="px-10 py-5">Conversation</th>
                  <th className="px-10 py-5">Impact</th>
                  <th className="px-10 py-5">Product</th>
                  <th className="px-10 py-5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm font-medium">
                {history.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50 transition-all group">
                    <td className="px-10 py-6 font-bold text-orange-600">r/{row.subreddit}</td>
                    <td className="px-10 py-6">
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-slate-900 group-hover:text-orange-600 transition-colors line-clamp-1">{row.postTitle}</span>
                        <span className="text-[10px] text-slate-400 font-medium">{new Date(row.deployedAt).toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-1.5 font-extrabold">
                        <TrendingUp size={14} className="text-green-500" />
                        {row.ups}
                      </div>
                    </td>
                    <td className="px-10 py-6 text-blue-600 font-bold">
                      {row.productMention}
                    </td>
                    <td className="px-10 py-6">
                      <button
                        onClick={() => setSelectedEntry(row)}
                        className="px-6 py-2 bg-slate-100 hover:bg-orange-600 hover:text-white rounded-xl font-bold transition-all active:scale-95"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

