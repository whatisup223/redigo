
import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Zap, Shield, BarChart3, ArrowRight, Lock, CheckCircle2 } from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#fcfcfd] selection:bg-orange-100 font-['Outfit']">
      {/* Navigation */}
      <nav className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between sticky top-0 bg-white/70 backdrop-blur-xl z-50 border-b border-slate-100/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-orange-100">
            <Zap fill="currentColor" size={22} />
          </div>
          <span className="text-2xl font-bold tracking-tight text-slate-900">RedditGrowth</span>
        </div>
        <div className="hidden md:flex items-center gap-10">
          <a href="#features" className="text-sm font-semibold text-slate-500 hover:text-orange-600 transition-colors">Features</a>
          <a href="#pricing" className="text-sm font-semibold text-slate-500 hover:text-orange-600 transition-colors">Pricing</a>
          <Link to="/dashboard" className="bg-slate-900 text-white px-7 py-3.5 rounded-2xl text-sm font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 active:scale-95">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 py-24 lg:py-40 text-center relative overflow-hidden">
        {/* Animated Orbs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none -z-10">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-200/30 blur-[120px] rounded-full animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-100/30 blur-[120px] rounded-full animate-pulse delay-1000"></div>
        </div>

        <div className="inline-flex items-center gap-2 bg-white/80 border border-slate-200/60 px-5 py-2.5 rounded-full shadow-sm mb-10 animate-fade-in-up">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
          </span>
          <span className="text-[11px] font-extrabold text-slate-600 uppercase tracking-[0.15em]">Now in Public Beta</span>
        </div>
        
        <h1 className="text-6xl lg:text-[5.5rem] font-extrabold text-slate-900 tracking-tight leading-[1] mb-10 max-w-5xl mx-auto">
          Automate your growth on <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500">Reddit with AI agents.</span>
        </h1>
        
        <p className="text-xl lg:text-2xl text-slate-500 max-w-3xl mx-auto leading-relaxed mb-12 font-medium">
          The intelligence layer for Reddit marketing. Track trends, generate high-impact replies, and build authority without the manual grind.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-4">
          <Link to="/dashboard" className="w-full sm:w-auto bg-orange-600 text-white px-10 py-5 rounded-[2rem] font-bold hover:bg-orange-700 transition-all flex items-center justify-center gap-2 shadow-2xl shadow-orange-200 group active:scale-95 text-lg">
            Launch Free Account
            <ArrowRight className="group-hover:translate-x-1.5 transition-transform" size={22} />
          </Link>
          <button className="w-full sm:w-auto bg-white border border-slate-200/80 px-10 py-5 rounded-[2rem] font-bold hover:bg-slate-50 hover:border-slate-300 transition-all text-lg shadow-sm">
            Book Demo
          </button>
        </div>

        <div className="pt-24 flex flex-wrap justify-center gap-12 lg:gap-24 opacity-30 grayscale saturate-0 pointer-events-none">
          {/* Logo Placeholders */}
          <div className="text-3xl font-black tracking-tighter italic">REDDIT</div>
          <div className="text-3xl font-black tracking-tighter italic">PRODUCT HUNT</div>
          <div className="text-3xl font-black tracking-tighter italic">INDIE HACKERS</div>
          <div className="text-3xl font-black tracking-tighter italic">Y COMBINATOR</div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-32 space-y-24">
        <div className="text-center space-y-6 max-w-3xl mx-auto">
            <span className="text-orange-600 font-bold uppercase tracking-widest text-sm">Capabilities</span>
          <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900">Engineered for high-scale marketing.</h2>
          <p className="text-slate-500 text-xl font-medium">Professional infrastructure built for founders and serious community managers.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            { 
              icon: Sparkles, 
              title: 'Context-Aware AI', 
              desc: 'Our models analyze the deep context of Reddit threads to generate comments that add genuine value while naturally positioning your solution.',
              color: 'bg-orange-50 text-orange-600 ring-orange-100'
            },
            { 
              icon: Zap, 
              title: 'Sentinel Keyword Tracking', 
              desc: 'Monitor thousands of subreddits simultaneously. Get instant push notifications the second a relevant conversation starts.',
              color: 'bg-blue-50 text-blue-600 ring-blue-100'
            },
            { 
              icon: BarChart3, 
              title: 'Voter Analytics', 
              desc: 'Visualize karma growth, conversion trends, and audience sentiment through our enterprise-grade reporting engine.',
              color: 'bg-purple-50 text-purple-600 ring-purple-100'
            },
            { 
              icon: Shield, 
              title: 'Bot Protection Suite', 
              desc: 'Proprietary human-behavior simulation ensuring your accounts stay safe, healthy, and highly authoritative.',
              color: 'bg-green-50 text-green-600 ring-green-100'
            },
            { 
              icon: Lock, 
              title: 'Enterprise Security', 
              desc: 'Official Reddit OAuth2 integration. Your data is encrypted at rest and in transit. No manual password sharing ever.',
              color: 'bg-red-50 text-red-600 ring-red-100'
            },
            { 
              icon: CheckCircle2, 
              title: 'Smart Scheduler', 
              desc: 'AI-optimized posting times based on subreddit-specific activity heatmaps for maximum visibility.',
              color: 'bg-indigo-50 text-indigo-600 ring-indigo-100'
            },
          ].map((f, i) => (
            <div key={i} className="p-10 bg-white rounded-[2.5rem] border border-slate-200/60 hover:border-orange-200/60 hover:shadow-2xl hover:shadow-orange-100/30 transition-all duration-500 group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                <f.icon size={120} />
              </div>
              <div className={`w-14 h-14 rounded-2xl ${f.color} flex items-center justify-center mb-8 ring-8 group-hover:scale-110 transition-transform duration-500`}>
                <f.icon size={28} />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-slate-900">{f.title}</h3>
              <p className="text-slate-500 leading-relaxed font-medium text-lg">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-16 bg-white/50">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="flex items-center gap-3">
            <Zap className="text-orange-600" fill="currentColor" size={24} />
            <span className="font-extrabold text-2xl tracking-tight">RedditGrowth</span>
          </div>
          <div className="flex gap-10 text-sm font-semibold text-slate-400 uppercase tracking-widest">
            <a href="#" className="hover:text-slate-900 transition-colors">Privacy</a>
            <a href="#" className="hover:text-slate-900 transition-colors">Terms</a>
            <a href="#" className="hover:text-slate-900 transition-colors">Support</a>
          </div>
          <div className="text-sm font-bold text-slate-300">
            © 2025 RedditGrowth AI.
          </div>
        </div>
      </footer>
    </div>
  );
};
