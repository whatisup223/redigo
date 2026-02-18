
import React from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { TrendingUp, Users, MousePointer2, ExternalLink, Calendar, ChevronRight } from 'lucide-react';

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
  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-fade-in font-['Outfit']">
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
        <StatCard label="Total Upvotes" value="4,290" trend="+12.5%" icon={TrendingUp} color="bg-orange-600 text-white shadow-orange-100" />
        <StatCard label="Direct Replies" value="246" trend="+8.2%" icon={Users} color="bg-blue-600 text-white shadow-blue-100" />
        <StatCard label="Click Reach" value="1,102" trend="+15.0%" icon={MousePointer2} color="bg-purple-600 text-white shadow-purple-100" />
        <StatCard label="Live Streams" value="12" trend="0%" icon={ExternalLink} color="bg-emerald-600 text-white shadow-emerald-100" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200/60 shadow-sm">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-xl font-extrabold text-slate-900">Karma Growth Velocity</h2>
            <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-orange-600"></span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Upvotes</span>
            </div>
          </div>
          <div className="h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={DATA}>
                <defs>
                  <linearGradient id="colorUp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 12, fontWeight: 700, fill: '#94a3b8'}} 
                    dy={15} 
                />
                <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 12, fontWeight: 700, fill: '#94a3b8'}} 
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

        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200/60 shadow-sm">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-xl font-extrabold text-slate-900">Conversion Efficiency</h2>
            <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-600"></span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Replies</span>
            </div>
          </div>
          <div className="h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={DATA}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 12, fontWeight: 700, fill: '#94a3b8'}} 
                    dy={15} 
                />
                <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 12, fontWeight: 700, fill: '#94a3b8'}} 
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', padding: '20px' }}
                />
                <Line 
                    type="monotone" 
                    dataKey="replies" 
                    stroke="#2563eb" 
                    strokeWidth={4} 
                    dot={{ r: 6, fill: '#2563eb', strokeWidth: 3, stroke: '#fff' }} 
                    activeDot={{ r: 8, strokeWidth: 0 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-slate-900">Campaign History</h2>
          <button className="text-sm font-bold text-orange-600 hover:text-orange-700 transition-colors uppercase tracking-widest">Download Report</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-slate-400 text-[11px] font-extrabold uppercase tracking-[0.2em]">
                <th className="px-10 py-5">Origin</th>
                <th className="px-10 py-5">Conversation</th>
                <th className="px-10 py-5">Impact</th>
                <th className="px-10 py-5">Follow-ups</th>
                <th className="px-10 py-5">Sentiment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm font-medium">
              {[
                { sub: 'saas', title: 'Need landing page advice...', ups: 45, rep: 3, status: 'Neutral' },
                { sub: 'reactjs', title: 'Why use Next over Vite?', ups: 12, rep: 1, status: 'Positive' },
                { sub: 'indiehackers', title: 'Launch day results!', ups: 156, rep: 12, status: 'Hot' },
                { sub: 'startups', title: 'Funding in 2025: What changed?', ups: 89, rep: 5, status: 'Positive' },
              ].map((row, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-all group">
                  <td className="px-10 py-6 font-bold text-orange-600">r/{row.sub}</td>
                  <td className="px-10 py-6 font-bold text-slate-900 group-hover:text-orange-600 transition-colors">{row.title}</td>
                  <td className="px-10 py-6">
                    <div className="flex items-center gap-1.5 font-extrabold">
                        <TrendingUp size={14} className="text-green-500" />
                        {row.ups}
                    </div>
                  </td>
                  <td className="px-10 py-6 text-slate-500 font-bold">{row.rep}</td>
                  <td className="px-10 py-6">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
                        row.status === 'Hot' ? 'bg-orange-50 text-orange-600 border-orange-100' : 
                        row.status === 'Positive' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                        'bg-slate-50 text-slate-500 border-slate-100'
                    }`}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
