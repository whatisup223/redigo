
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Zap,
  CheckCircle2,
  ArrowRight,
  Star,
  ShieldCheck,
  BarChart,
  Bot,
  MessageSquare,
  Globe,
  Search,
  PenTool,
  TrendingUp,
  Menu,
  X,
  Check,
  Users,
  Users2,
  Image as LucideImage,
  MousePointer2
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [plans, setPlans] = useState<any[]>([]);

  const testimonials = [
    { name: 'Sarah Jenkins', role: 'CTO, TechFlow', text: "I was skeptical about Reddit marketing, but this tool made it feel authentic. We got our first 100 users in a week.", image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=60" },
    { name: 'Mike Ross', role: 'Indie Hacker', text: "The AI reply suggestions are actually good. They don't sound robotic — it's like having a co-writer who drafts, while I approve and post.", image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=60" },
    { name: 'David Chen', role: 'Founder, SaaSI', text: "Finally, a tool that respects Reddit's culture while helping businesses grow. Absolute game changer for us.", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=60" }
  ];

  useEffect(() => {
    fetch('/api/plans')
      .then(res => res.json())
      .then(data => setPlans(Array.isArray(data) ? data : []))
      .catch(err => {
        console.error('Failed to fetch plans', err);
        setPlans([]);
      });
  }, []);

  useEffect(() => {
    if (testimonials.length <= 1) return;
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [testimonials.length]);


  const dashboardFeatures = [
    {
      id: 'extraction',
      icon: Search,
      title: 'Lead Extraction',
      label: 'Extraction Engine',
      steps: [
        { title: 'Community Search', desc: 'Scan subreddits for high-intent keywords.' },
        { title: 'Context Indexing', desc: 'AI analyzes the history and mood of a thread.' },
        { title: 'Intent Filter', desc: 'Surface leads that actually need your product.' }
      ],
      color: 'orange'
    },
    {
      id: 'replies',
      icon: Bot,
      title: 'Comment Agent',
      label: 'AI Outreach',
      steps: [
        { title: 'Social Drafting', desc: 'Draft a value-first reply tailored to post context.' },
        { title: 'Subreddit Tone', desc: 'Auto-adjusts language and tone for specific subs.' },
        { title: 'Secure Posting', desc: 'Deploy safely via our browser extension bridge.' }
      ],
      color: 'slate'
    },
    {
      id: 'posts',
      icon: Zap,
      title: 'Post Architect',
      label: 'Content Engine',
      steps: [
        { title: 'Adaptive Drafting', desc: 'Create posts that mirror your brand persona.' },
        { title: 'Brand Imagery', desc: 'AI reads post intent to generate aligned visuals.' },
        { title: 'Native Presence', desc: 'Format content to thrive in Reddit communities.' }
      ],
      color: 'orange'
    },
    {
      id: 'analytics',
      icon: BarChart,
      title: 'ROI Analytics',
      label: 'Growth Tracking',
      steps: [
        { title: 'Link Tracking', desc: 'See which Reddit comments drive real clicks.' },
        { title: 'Engagement Stats', desc: 'Monitor your reach and interaction velocity.' },
        { title: 'Result Audit', desc: 'Quantify how many users are converting.' }
      ],
      color: 'slate'
    }
  ];

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  return (
    <div className="min-h-screen font-['Outfit'] scroll-smooth">
      {/* Navbar */}
      <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 backdrop-blur-xl border-b border-slate-200/50 py-4 shadow-sm' : 'bg-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-orange-200 ring-2 ring-orange-100">
              <Zap fill="currentColor" size={20} />
            </div>
            <span className="text-2xl font-extrabold text-slate-900 tracking-tight font-['Outfit']">Redigo</span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-500">
            <button onClick={() => document.getElementById('home')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-orange-600 transition-colors">Home</button>
            <button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-orange-600 transition-colors">Features</button>
            <button onClick={() => document.getElementById('extraction')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-orange-600 transition-colors">Extraction</button>
            <button onClick={() => document.getElementById('replies')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-orange-600 transition-colors">Outreach</button>
            <button onClick={() => document.getElementById('posts')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-orange-600 transition-colors">Content</button>
            <button onClick={() => document.getElementById('analytics')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-orange-600 transition-colors">ROI</button>
            <button onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-orange-600 transition-colors">Pricing</button>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/login" className="hidden sm:block px-6 py-3 text-slate-600 font-bold hover:text-slate-900 transition-colors">Log In</Link>
            <Link to="/signup" className="hidden sm:flex px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold border border-slate-800 hover:bg-orange-600 hover:border-orange-500 transition-all shadow-xl hover:shadow-orange-200 active:scale-95 items-center gap-2">
              Get Started <ArrowRight size={16} />
            </Link>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Sidebar Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-slate-200 p-6 space-y-4 animate-in slide-in-from-top-4 duration-300 shadow-xl">
            <div className="flex flex-col gap-4 text-base font-bold text-slate-600">
              <button onClick={() => { setIsMobileMenuOpen(false); document.getElementById('home')?.scrollIntoView({ behavior: 'smooth' }); }} className="text-left py-2 hover:text-orange-600 border-b border-slate-50 transition-colors">Home</button>
              <button onClick={() => { setIsMobileMenuOpen(false); document.getElementById('extraction')?.scrollIntoView({ behavior: 'smooth' }); }} className="text-left py-2 hover:text-orange-600 border-b border-slate-50 transition-colors">Extraction Engine</button>
              <button onClick={() => { setIsMobileMenuOpen(false); document.getElementById('replies')?.scrollIntoView({ behavior: 'smooth' }); }} className="text-left py-2 hover:text-orange-600 border-b border-slate-50 transition-colors">AI Outreach</button>
              <button onClick={() => { setIsMobileMenuOpen(false); document.getElementById('posts')?.scrollIntoView({ behavior: 'smooth' }); }} className="text-left py-2 hover:text-orange-600 border-b border-slate-50 transition-colors">Content Architect</button>
              <button onClick={() => { setIsMobileMenuOpen(false); document.getElementById('analytics')?.scrollIntoView({ behavior: 'smooth' }); }} className="text-left py-2 hover:text-orange-600 border-b border-slate-50 transition-colors">ROI Analytics</button>
              <button onClick={() => { setIsMobileMenuOpen(false); document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' }); }} className="text-left py-2 hover:text-orange-600 border-b border-slate-50 transition-colors">Pricing</button>
            </div>

            <div className="flex flex-col gap-3 pt-4">
              <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="w-full py-4 text-center text-slate-900 font-black border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all">
                Log In
              </Link>
              <Link to="/signup" onClick={() => setIsMobileMenuOpen(false)} className="w-full py-4 text-center bg-orange-600 text-white font-black rounded-2xl shadow-lg shadow-orange-200 active:scale-95 transition-all">
                Get Started Free
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section id="home" className="pt-32 pb-32 px-6 relative overflow-hidden">
        {/* Animated Background Gradients */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-orange-200/40 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 -z-10 animate-pulse-slow"></div>
        <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-slate-200/30 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2 -z-10 animate-pulse-slow delay-700"></div>
        <div className="absolute top-1/2 left-1/2 w-[1000px] h-[1000px] bg-white/40 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 -z-10"></div>

        <div className="max-w-7xl mx-auto text-center space-y-10 relative z-10">

          {/* Trust Badge / Version Pill */}
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-md border border-slate-200/60 rounded-full pl-2 pr-4 py-1.5 text-sm font-bold text-slate-600 shadow-sm shadow-slate-200 hover:scale-105 transition-transform cursor-default animate-fade-in-up">
            <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-extrabold">New</span>
            <span>v2.0: The Redigo AI Assistant</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-7xl md:text-9xl font-black text-slate-900 tracking-tighter leading-[0.85] max-w-5xl mx-auto animate-fade-in-up delay-100">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-600 relative inline-block">
              Reddit
              <svg className="absolute w-full h-3 -bottom-1 left-0 text-orange-200 -z-10" viewBox="0 0 100 10" preserveAspectRatio="none">
                <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="8" fill="none" />
              </svg>
            </span> Growth. <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-600 relative inline-block">
              Mastered.
              <svg className="absolute w-full h-3 -bottom-1 left-0 text-orange-200 -z-10" viewBox="0 0 100 10" preserveAspectRatio="none">
                <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="8" fill="none" />
              </svg>
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed animate-fade-in-up delay-200">
            Redigo is the professional assistant for founders and marketers. Extract high-intent leads, analyze sentiment, and generate authentic, value-first content while keeping your account 100% safe.
          </p>

          {/* Feature Highlights Row */}
          <div className="grid grid-cols-1 sm:flex sm:flex-wrap items-center justify-center gap-3 md:gap-8 text-slate-700 font-bold mt-4 animate-fade-in-up delay-200 px-6">
            <div className="flex items-center gap-3 bg-white/60 backdrop-blur-md px-6 py-3 rounded-2xl border border-slate-200 shadow-sm transition-all hover:scale-105 hover:bg-white">
              <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600"><Search size={18} /></div>
              <span className="text-sm md:text-base">Lead Extraction</span>
            </div>
            <div className="flex items-center gap-3 bg-white/60 backdrop-blur-md px-6 py-3 rounded-2xl border border-slate-200 shadow-sm transition-all hover:scale-105 hover:bg-white">
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-900"><Bot size={18} /></div>
              <span className="text-sm md:text-base">AI-Assisted Growth</span>
            </div>
            <div className="flex items-center gap-3 bg-white/60 backdrop-blur-md px-6 py-3 rounded-2xl border border-slate-200 shadow-sm transition-all hover:scale-105 hover:bg-white">
              <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center text-red-600"><ShieldCheck size={18} /></div>
              <span className="text-sm md:text-base">Security Engine</span>
            </div>
          </div>

          {/* Call to Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6 animate-fade-in-up delay-300">
            <Link to="/signup" className="w-full sm:w-auto px-10 py-5 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-[2rem] font-bold text-xl hover:shadow-2xl hover:shadow-orange-500/40 hover:-translate-y-1 transition-all flex items-center justify-center gap-3">
              <Zap size={24} className="text-white fill-white" />
              Start Growing on Reddit
            </Link>
            <button
              onClick={() => document.getElementById('approach')?.scrollIntoView({ behavior: 'smooth' })}
              className="w-full sm:w-auto px-10 py-5 bg-white text-slate-700 border border-slate-200 rounded-[2rem] font-bold text-xl hover:border-slate-300 hover:bg-slate-50 hover:-translate-y-1 transition-all shadow-sm flex items-center justify-center gap-3"
            >
              <Globe size={24} />
              See Live Demo
            </button>
          </div>



          {/* Dashboard Mockup - Floating Effect */}
          <div className="pt-24 relative animate-fade-in-up delay-500">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-b from-orange-100/20 to-transparent rounded-full blur-3xl -z-10 pointer-events-none"></div>

            <div className="relative mx-auto max-w-5xl">
              <div className="bg-slate-900 rounded-[2rem] overflow-hidden aspect-[16/9] relative shadow-2xl shadow-slate-300 transform hover:scale-[1.01] transition-transform duration-500">
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover"
                >
                  <source src="https://cdn.pixabay.com/video/2020/05/11/38477-418833987_large.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
                {/* Subtle overlay gradient for better text visibility if needed */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-slate-50/50 relative overflow-hidden">
        {/* Decorative Brand Glows */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-orange-200/30 rounded-full blur-[120px]" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-red-200/20 rounded-full blur-[120px]" />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
              Everything you need to <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-600">Scale.</span>
            </h2>
            <p className="text-slate-500 text-lg font-medium">
              Redigo is built for founders who value their time and reputation. Pro-grade tools to grow on Reddit safely.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Search,
                title: 'Brand Intelligence',
                desc: 'Teach Redigo your niche. Extract high-intent discussions and pinpoint exactly where your solution belongs.',
                iconClass: 'bg-orange-600',
                glowClass: 'group-hover:shadow-orange-200'
              },
              {
                icon: Zap,
                title: 'AI Lead Scoring',
                desc: 'Don\'t waste time. We score every thread for purchase intent and technical relevance using your specific profile.',
                iconClass: 'bg-red-600',
                glowClass: 'group-hover:shadow-red-200'
              },
              {
                icon: ShieldCheck,
                title: 'Security Engine',
                desc: 'The only safe way to scale. Post via your Home IP through a secure bridge. No API bans, no risk.',
                iconClass: 'bg-slate-900',
                glowClass: 'group-hover:shadow-slate-200'
              },
            ].map((f, i) => (
              <div
                key={i}
                className={`group relative bg-white p-8 md:p-10 rounded-[2rem] md:rounded-[2.5rem] border border-slate-200 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl ${f.glowClass} flex flex-col h-full overflow-hidden`}
              >
                {/* Brand Overlay on Hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-orange-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="relative z-10">
                  <div className={`w-14 h-14 md:w-16 md:h-16 ${f.iconClass} text-white rounded-2xl flex items-center justify-center mb-6 md:mb-8 shadow-lg transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
                    <f.icon size={26} strokeWidth={2.5} />
                  </div>

                  <h3 className="text-xl md:text-2xl font-black text-slate-900 mb-3 md:mb-4 transition-colors group-hover:text-orange-600">
                    {f.title}
                  </h3>

                  <p className="text-sm md:text-base text-slate-500 leading-relaxed font-semibold">
                    {f.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>




      {/* How it Works Section */}
      <section id="how-it-works" className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
              Built for <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-600">Performance.</span>
            </h2>
            <p className="text-slate-500 text-lg font-medium leading-relaxed">
              A systematic approach to Reddit marketing that scales without looking like marketing.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Setup Brand Profile',
                desc: 'Teach Redigo about your product, target audience, and unique value proposition. It becomes an expert in your niche instantly.',
                color: 'orange-600'
              },
              {
                step: '02',
                title: 'Extract & Score',
                desc: 'Run deep extractions across relevant subreddits. Our AI scores every thread for relevance and purchase intent, filtering out the noise.',
                color: 'red-600'
              },
              {
                step: '03',
                title: 'Engage & Analyze',
                desc: 'Draft authentic multi-modal content and engage safely via our extension bridge. Track every click and upvote in real-time.',
                color: 'slate-900'
              },
            ].map((s, i) => (
              <div key={i} className="group relative bg-slate-50 p-8 md:p-10 rounded-[2rem] md:rounded-[2.5rem] border border-slate-100 transition-all duration-500 hover:bg-white hover:shadow-2xl hover:shadow-orange-200/20 hover:-translate-y-2 flex flex-col h-full overflow-hidden">
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-8">
                    <span className={`text-5xl font-black transition-all duration-500 text-slate-900 group-hover:text-orange-600`}>
                      {s.step}
                    </span>
                    <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-900 group-hover:text-white group-hover:bg-orange-600 transition-all duration-500">
                      <Zap size={20} className="group-hover:fill-current" />
                    </div>
                  </div>

                  <h3 className="text-2xl font-black text-slate-900 mb-4 group-hover:text-orange-600 transition-colors">
                    {s.title}
                  </h3>

                  <p className="text-slate-500 leading-relaxed font-semibold">
                    {s.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      <section id="extraction" className="py-32 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="space-y-8 order-1">
            <div className="inline-flex items-center gap-2 bg-orange-50 text-orange-600 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest">
              <Search size={14} /> 01 Extraction Engine
            </div>
            <h2 className="text-4xl md:text-6xl font-black text-slate-900 leading-[1.1]">
              Find your <span className="text-orange-600">Perfect </span> leads.
            </h2>
            <p className="text-slate-500 text-lg md:text-xl font-medium leading-relaxed max-w-xl">
              Stop shouting into the void. Our engine scans Reddit for users who are actively asking for exactly what you're building.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {dashboardFeatures[0].steps.map((s, i) => (
                <div key={i} className="flex md:flex-col gap-4 p-5 rounded-3xl bg-slate-50 border border-slate-100 group hover:border-orange-200 hover:bg-white transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-orange-100">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white font-black text-sm group-hover:bg-orange-600 transition-all shrink-0">{i + 1}</div>
                  <div>
                    <h4 className="text-[13px] font-black text-slate-900 mb-1">{s.title}</h4>
                    <p className="text-[11px] text-slate-500 font-bold leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="order-2">
            <div className="bg-slate-900 rounded-[3rem] p-1 shadow-2xl relative group animate-float">
              <div className="bg-white rounded-[2.5rem] overflow-hidden">
                <div className="h-10 bg-slate-50 border-b border-slate-200 flex items-center px-6 gap-2">
                  <div className="flex gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-slate-300" /><div className="w-2.5 h-2.5 rounded-full bg-slate-300" /><div className="w-2.5 h-2.5 rounded-full bg-slate-200" /></div>
                </div>
                <div className="p-8 space-y-6 min-h-[440px] relative">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lead Finder V4</h4>
                      <span className="text-[10px] font-bold text-orange-500 flex items-center gap-1.5 animate-pulse-soft"><div className="w-1.5 h-1.5 bg-orange-500 rounded-full" /> ENGINE READY</span>
                    </div>

                    {/* Search Step */}
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Search size={14} /></div>
                      <div className="w-full h-12 bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 flex items-center gap-2">
                        <span className="text-[10px] font-black text-orange-600 bg-orange-50 px-2 py-1 rounded-lg">r/SaaS</span>
                        <div className="text-xs font-bold text-slate-900 border-r-2 border-orange-500 animate-typing-once whitespace-nowrap overflow-hidden" style={{ width: '100px' }}>marketing tool</div>
                      </div>
                    </div>
                  </div>

                  {/* Loading Section - Only visible between 2.2s and 4.2s */}
                  <div className="absolute inset-x-8 top-32 space-y-4 animate-reveal opacity-0" style={{ animationDelay: '2.2s', animationFillMode: 'forwards' }}>
                    <div className="animate-fade-out opacity-100" style={{ animationDelay: '4.2s' }}>
                      <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4 animate-pulse">
                        <div className="w-10 h-10 rounded-full bg-slate-200" />
                        <div className="flex-grow space-y-2">
                          <div className="h-3 w-20 bg-slate-200 rounded" />
                          <div className="h-2 w-32 bg-slate-100 rounded" />
                        </div>
                        <div className="w-12 h-6 bg-slate-200 rounded" />
                      </div>
                      <p className="text-[10px] font-black text-slate-300 text-center mt-4">ANALYZING R/SAAS INTENT...</p>
                    </div>
                  </div>

                  {/* Results Section - Appears after 4.5s */}
                  <div className="space-y-4 pt-2 animate-reveal opacity-0" style={{ animationDelay: '4.5s', animationFillMode: 'forwards' }}>
                    {[
                      { u: 'u/saas_dev', score: 98, t: "Which marketing tool works best for Reddit leads?" },
                      { u: 'u/growth_lead', score: 92, t: "Looking for marketing tool recommendations..." },
                      { u: 'u/indie_builder', score: 85, t: "Anyone here building a SaaS marketing tool?" }
                    ].map((lead, i) => (
                      <div key={i} className="p-5 bg-white rounded-2xl border border-slate-100 flex items-center gap-4 hover:border-orange-200 transition-all shadow-sm hover:shadow-md animate-slide-in-top" style={{ animationDelay: `${4.5 + (i * 0.2)}s` }}>
                        <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-600 font-black text-xs uppercase">{lead.u[2]}</div>
                        <div className="flex-grow">
                          <div className="flex items-center gap-2 mb-1"><span className="text-xs font-black text-slate-900">{lead.u}</span><span className="text-[8px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 font-bold uppercase shrink-0">r/SaaS</span></div>
                          <p className="text-[10px] text-slate-500 truncate w-40 font-medium">{lead.t}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-[9px] font-black text-orange-600 mb-1">{lead.score}% INTENT</div>
                          <button className="text-[8px] bg-slate-900 text-white px-2 py-1 rounded-lg font-black uppercase tracking-widest animate-shine">LOCKED</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-orange-600/20 blur-[60px] rounded-full pointer-events-none" />
            </div>
          </div>
        </div>
      </section>

      {/* Feature Section 02: Comment Agent */}
      <section id="replies" className="py-32 bg-slate-50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="space-y-8 order-1">
            <div className="inline-flex items-center gap-2 bg-slate-200 text-slate-900 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest">
              <Bot size={14} /> 02 AI Outreach
            </div>
            <h2 className="text-4xl md:text-6xl font-black text-slate-900 leading-[1.1]">
              Talk to <span className="text-orange-600">Reddit</span> like a local.
            </h2>
            <p className="text-slate-500 text-lg md:text-xl font-medium leading-relaxed max-w-xl">
              AI that doesn't sound like AI. Our agent creates value-first responses tailored to each subreddit's unique slang and culture.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {dashboardFeatures[1].steps.map((s, i) => (
                <div key={i} className="flex md:flex-col gap-4 p-5 rounded-3xl bg-white border border-slate-100 group hover:border-orange-200 hover:bg-white transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-orange-100">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white font-black text-sm group-hover:bg-orange-600 transition-all shrink-0">{i + 1}</div>
                  <div>
                    <h4 className="text-[13px] font-black text-slate-900 mb-1">{s.title}</h4>
                    <p className="text-[11px] text-slate-500 font-bold leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="order-2">
            <div className="bg-slate-900 rounded-[3rem] p-1 shadow-2xl relative group animate-float">
              <div className="bg-white rounded-[2.5rem] overflow-hidden flex flex-col min-h-[400px]">
                <div className="h-10 bg-slate-50 border-b border-slate-100 flex items-center px-6"><Bot size={14} className="text-orange-600" /></div>
                <div className="p-8 flex-grow space-y-6">
                  <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl animate-slide-in-top">
                    <div className="text-[10px] font-black text-orange-600 uppercase mb-2">Target Context</div>
                    <p className="text-sm italic text-slate-700 font-medium leading-relaxed">"Cold outreach is so noisy. I wish there was a way to find people actually asking for help..."</p>
                  </div>
                  <div className="bg-slate-900 rounded-2xl p-6 shadow-xl relative overflow-hidden h-32">
                    <div className="absolute top-3 left-3 flex items-center gap-1.5"><div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse-soft" /><span className="text-[8px] text-slate-400 font-black tracking-widest">REDIGO AI ENGINE V4.0</span></div>
                    <div className="absolute top-3 right-3 text-[8px] bg-orange-600 text-white px-1.5 py-0.5 rounded-full font-black uppercase">TONE: AUTHENTIC</div>
                    <div className="text-slate-200 text-sm leading-relaxed mt-4 italic animate-typing">
                      "I've been using a tool that specifically scans subreddits..."
                    </div>
                  </div>
                  <button className="w-full h-14 bg-orange-600 rounded-2xl text-white font-black text-sm shadow-xl shadow-orange-100 flex items-center justify-center gap-3 active:scale-95 transition-all animate-shine">
                    APPROVE & POST SECURELY <Zap size={18} fill="currentColor" />
                  </button>
                </div>
              </div>
              <div className="absolute -top-6 -left-6 w-32 h-32 bg-orange-600/20 blur-[60px] rounded-full pointer-events-none" />
            </div>
          </div>
        </div>
      </section>

      <section id="posts" className="py-32 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="space-y-8 order-1">
            <div className="inline-flex items-center gap-2 bg-orange-50 text-orange-600 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest">
              <PenTool size={14} /> 03 Post Architect
            </div>
            <h2 className="text-4xl md:text-6xl font-black text-slate-900 leading-[1.1]">
              Craft viral <span className="text-orange-600">content</span> with AI.
            </h2>
            <p className="text-slate-500 text-lg md:text-xl font-medium leading-relaxed max-w-xl">
              Dominate the feed with posts designed to trigger Reddit's algorithm and spark genuine discussions.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {dashboardFeatures[2].steps.map((s, i) => (
                <div key={i} className="flex md:flex-col gap-4 p-5 rounded-3xl bg-slate-50 border border-slate-100 group hover:border-orange-200 hover:bg-white transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-orange-100">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white font-black text-sm group-hover:bg-orange-600 transition-all shrink-0">{i + 1}</div>
                  <div>
                    <h4 className="text-[13px] font-black text-slate-900 mb-1">{s.title}</h4>
                    <p className="text-[11px] text-slate-500 font-bold leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="order-2">
            <div className="bg-slate-900 rounded-[3rem] p-1 shadow-2xl relative group animate-float">
              <div className="bg-white rounded-[2.5rem] overflow-hidden min-h-[400px] flex flex-col p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600 animate-pulse-soft"><PenTool size={20} /></div>
                    <div><div className="text-sm font-black text-slate-900">Viral Draft #42</div><div className="text-[10px] text-slate-400 font-black">r/ENTREPRENEUR</div></div>
                  </div>
                  <span className="text-[10px] bg-slate-100 px-2.5 py-1 rounded text-slate-400 font-black tracking-widest animate-pulse-soft">DRAFTING...</span>
                </div>
                <div className="flex-grow grid grid-cols-12 gap-6">
                  <div className="col-span-12 md:col-span-7 space-y-4 bg-slate-50 p-6 rounded-2xl border border-dashed border-slate-200 animate-pulse-soft">
                    <div className="h-4 w-full bg-slate-200 rounded animate-pulse" />
                    <div className="h-2 w-full bg-slate-100 rounded" />
                    <div className="h-2 w-full bg-slate-100 rounded" />
                    <div className="h-20 w-full bg-slate-200/50 rounded-xl flex items-center justify-center text-[10px] font-black text-slate-300">CONTENT ENGINE PROCESSING...</div>
                    <button className="w-full h-10 bg-orange-600 rounded-xl text-white font-black text-xs animate-shine">DRAFT BRAND POST</button>
                  </div>
                  <div className="col-span-12 md:col-span-5 space-y-4">
                    <div className="aspect-square bg-gradient-to-br from-orange-400 to-red-600 rounded-2xl shadow-xl flex items-center justify-center relative overflow-hidden group/img animate-pulse-soft">
                      <LucideImage size={40} className="text-white/40" />
                      <div className="absolute inset-0 bg-white/10 animate-pulse pointer-events-none" />
                    </div>
                    <button className="w-full h-10 bg-slate-900 rounded-xl text-white font-black text-[10px] uppercase tracking-widest border border-slate-800 animate-shine">GENERATE IMG</button>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-orange-600/20 blur-[60px] rounded-full pointer-events-none" />
            </div>
          </div>
        </div>
      </section>

      {/* Feature Section 04: ROI Analytics */}
      <section id="analytics" className="py-32 bg-slate-50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="space-y-8 order-1">
            <div className="inline-flex items-center gap-2 bg-orange-50 text-orange-600 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest">
              <BarChart size={14} /> 04 ROI Analytics
            </div>
            <h2 className="text-4xl md:text-6xl font-black text-slate-900 leading-[1.1]">
              Track every <span className="text-orange-600">click</span> & growth.
            </h2>
            <p className="text-slate-500 text-lg md:text-xl font-medium leading-relaxed max-w-xl">
              Know exactly which Reddit threads are driving results. Real-time feedback loops to optimize your strategy instantly.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {dashboardFeatures[3].steps.map((s, i) => (
                <div key={i} className="flex md:flex-col gap-4 p-5 rounded-3xl bg-white border border-slate-100 group hover:border-orange-200 hover:bg-white transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-orange-100">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white font-black text-sm group-hover:bg-orange-600 transition-all shrink-0">{i + 1}</div>
                  <div>
                    <h4 className="text-[13px] font-black text-slate-900 mb-1">{s.title}</h4>
                    <p className="text-[11px] text-slate-500 font-bold leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="order-2">
            <div className="bg-slate-900 rounded-[3rem] p-1 shadow-2xl relative group animate-float">
              <div className="bg-white rounded-[2.5rem] overflow-hidden p-8 min-h-[400px] flex flex-col">
                <div className="grid grid-cols-2 gap-6 mb-8">
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 shadow-sm animate-slide-in-top">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2"><MousePointer2 size={12} className="text-orange-500" /> Link Clicks</div>
                    <div className="text-3xl font-black text-slate-900">2,840</div>
                  </div>
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 shadow-sm animate-slide-in-top" style={{ animationDelay: '100ms' }}>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2"><Globe size={12} className="text-orange-600" /> Top Countries</div>
                    <div className="text-3xl font-black text-slate-900 flex items-center gap-2">US <span className="text-2xl">🇺🇸</span></div>
                  </div>
                </div>
                <div className="flex-grow bg-slate-900 rounded-3xl p-8 relative overflow-hidden">
                  <div className="flex items-center justify-between mb-8">
                    <span className="text-xs font-black text-white uppercase tracking-tighter">Engagement Velocity</span>
                    <span className="text-[10px] text-orange-400 font-bold uppercase tracking-widest flex items-center gap-2"><div className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-pulse-soft" /> Live</span>
                  </div>
                  <div className="h-32 flex items-end gap-2.5">
                    {[0.2, 0.4, 0.3, 0.6, 0.5, 0.8, 0.7, 0.9, 1.0, 0.85].map((h, i) => (
                      <div key={i} className="flex-1 bg-gradient-to-t from-orange-600 to-red-500 rounded-t-lg animate-grow-height shadow-[0_0_20px_rgba(234,88,12,0.3)]" style={{ height: `${h * 100}%`, animationDelay: `${i * 100}ms` }} />
                    ))}
                  </div>
                  <div className="absolute top-0 right-0 p-8 opacity-10"><BarChart size={120} className="text-white animate-pulse-soft" /></div>
                </div>
              </div>
              <div className="absolute -top-6 -left-6 w-32 h-32 bg-orange-600/20 blur-[60px] rounded-full pointer-events-none" />
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 relative overflow-hidden bg-slate-50/50">
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-4xl font-extrabold text-slate-900 mb-20 tracking-tight">Loved by Founders</h2>

          <div className="relative min-h-[450px] flex items-center justify-center">
            {testimonials.map((t, index) => (
              <div
                key={index}
                className={`absolute inset-0 transition-all duration-700 ease-out transform
                    ${index === activeTestimonial ? 'opacity-100 translate-x-0 scale-100 blur-0' : 'opacity-0 translate-x-12 scale-95 blur-sm pointer-events-none'}
                  `}
              >
                <div className="bg-white p-12 md:p-16 rounded-[3rem] shadow-2xl shadow-slate-200 border border-slate-100 max-w-3xl mx-auto relative overflow-hidden">
                  {/* Quote Icon */}
                  <div className="absolute -top-6 -left-6 text-orange-50">
                    <MessageSquare size={120} fill="currentColor" className="opacity-80" />
                  </div>

                  <div className="relative z-10">
                    <div className="flex gap-1 text-orange-400 mb-8 justify-center">
                      {[1, 2, 3, 4, 5].map(s => <Star key={s} size={24} fill="currentColor" />)}
                    </div>

                    <blockquote className="text-2xl md:text-3xl font-medium text-slate-800 leading-relaxed mb-10 font-heading">
                      "{t.text}"
                    </blockquote>

                    <div className="flex items-center justify-center gap-4">
                      <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-orange-100 shadow-md">
                        <img src={t.image} alt={t.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="text-left">
                        <div className="font-bold text-slate-900 text-lg">{t.name}</div>
                        <div className="text-orange-600 font-medium text-sm">{t.role}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center gap-3 mt-4">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveTestimonial(i)}
                className={`h-3 rounded-full transition-all duration-300 ${i === activeTestimonial ? 'bg-slate-900 w-12 shadow-lg shadow-slate-400/50' : 'bg-slate-300 w-3 hover:bg-slate-400'}`}
                aria-label={`Go to testimonial ${i + 1}`}
              />
            ))}
          </div>

        </div>
      </section >

      {/* Pricing Section */}
      < section id="pricing" className="py-24 bg-gradient-to-b from-slate-50 to-white relative overflow-hidden" >
        <div className="absolute top-0 w-full h-px bg-slate-200"></div>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16 space-y-6">
            <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest inline-flex items-center gap-2">
              <Star size={12} fill="currentColor" /> Simple Pricing
            </span>
            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
              Pay as you <span className="text-orange-600">grow.</span>
            </h2>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto">
              Start for free, upgrade when you see results. No hidden fees.
            </p>

            {/* Billing Toggle (Premium Design) */}
            <div className="flex items-center justify-center gap-4 mt-12 bg-white/50 backdrop-blur-sm border border-slate-200/50 p-2 rounded-3xl w-fit mx-auto shadow-sm">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-2 rounded-2xl text-sm font-bold transition-all ${billingCycle === 'monthly' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Monthly
              </button>
              <div className="relative">
                <button
                  onClick={() => setBillingCycle('yearly')}
                  className={`px-6 py-2 rounded-2xl text-sm font-bold transition-all flex items-center gap-2 ${billingCycle === 'yearly' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Yearly
                </button>
                {plans.length > 0 && (() => {
                  const discounts = plans
                    .filter((p: any) => p.monthlyPrice > 0 && p.yearlyPrice > 0)
                    .map((p: any) => Math.round(100 - (p.yearlyPrice / (p.monthlyPrice * 12) * 100)));
                  const maxDiscount = Math.max(...discounts, 0);

                  return maxDiscount > 0 ? (
                    <span className="absolute -top-6 -right-12 bg-orange-600 text-white text-[10px] font-black px-2 py-1 rounded-full shadow-md animate-bounce whitespace-nowrap">
                      SAVE UP TO {maxDiscount}%
                    </span>
                  ) : null;
                })()}
              </div>

            </div>


          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto items-stretch">
            {plans.filter((p: any) => p.isVisible !== false).map((plan: any) => {
              const theme = plan.isPopular ? 'orange' : (plan.name === 'Agency' ? 'slate' : 'slate');
              const isFree = plan.monthlyPrice === 0;

              // Only show yearly if selected, not free, and a yearly price exists
              const isYearlySelected = billingCycle === 'yearly' && !isFree && (plan.yearlyPrice || 0) > 0;
              const price = isYearlySelected ? Math.round(plan.yearlyPrice / 12) : plan.monthlyPrice;
              const credits = isYearlySelected ? plan.credits * 12 : plan.credits;
              const dailyLimit = isYearlySelected ? plan.dailyLimitYearly : plan.dailyLimitMonthly;

              // Calculate actual discount percentage to show on the badge if needed
              const actualDiscount = (plan.monthlyPrice > 0 && plan.yearlyPrice > 0)
                ? Math.round(100 - (plan.yearlyPrice / (plan.monthlyPrice * 12) * 100))
                : 0;



              return (
                <div key={plan.id} className={`bg-white rounded-[2.5rem] p-10 border ${plan.isPopular ? 'border-orange-200 shadow-2xl shadow-orange-100/50 scale-105 z-10' : 'border-slate-100 shadow-lg'} hover:-translate-y-2 transition-all duration-500 relative overflow-hidden flex flex-col ${plan.purchaseEnabled === false ? 'opacity-80 grayscale-[0.2]' : ''}`}>
                  {plan.isPopular && (
                    <div className="absolute top-0 right-0 w-48 h-48 bg-orange-50 rounded-bl-[160px] -mr-12 -mt-12 pointer-events-none transition-transform hover:scale-110"></div>
                  )}

                  {plan.isPopular && (
                    <div className="absolute top-6 right-6 bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm">
                      Most Popular
                    </div>
                  )}

                  <div className="relative z-10 flex flex-col h-full">
                    <div className="mb-8">
                      <div className="flex flex-col gap-2">
                        {!isFree && plan.purchaseEnabled === false && (
                          <span className="bg-orange-600 text-white px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest w-fit mb-1 shadow-sm shadow-orange-100">
                            Reached Capacity
                          </span>
                        )}
                        <span className={`font-black uppercase tracking-widest text-[10px] px-3 py-1 rounded-full w-fit ${plan.isPopular ? 'bg-orange-50 text-orange-600' : 'bg-slate-50 text-slate-500'}`}>{plan.name}</span>
                        {isYearlySelected && actualDiscount > 0 && (
                          <span className="bg-orange-100 text-orange-700 text-[10px] font-black px-2 py-1 rounded-lg w-fit">
                            SAVE {actualDiscount}%
                          </span>
                        )}
                      </div>


                      <div className="mt-6">
                        <div className="flex items-baseline gap-2">
                          {isFree ? (
                            <span className="text-6xl font-black text-slate-900 tracking-tight">Free</span>
                          ) : (
                            <div className="flex flex-col">
                              {isYearlySelected && (
                                <span className="text-xl font-bold text-slate-300 line-through mb-[-8px] ml-1">${plan.monthlyPrice}</span>
                              )}
                              <div className="flex items-baseline gap-1">
                                <span className="text-6xl font-black text-slate-900 tracking-tight">${price}</span>
                                <span className="text-slate-400 font-bold text-lg">/mo</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {billingCycle === 'yearly' && !isFree && plan.yearlyPrice > 0 && (
                        <p className="text-orange-600 text-xs font-black mt-2 bg-orange-50 px-2 py-1 rounded-lg w-fit">
                          Billed ${plan.yearlyPrice} annually
                        </p>
                      )}
                      <p className="text-slate-400 text-sm mt-4 font-medium leading-relaxed">
                        {plan.description || (
                          plan.name?.toLowerCase() === 'starter' ? 'Perfect for individuals exploring AI replies.' :
                            plan.name?.toLowerCase() === 'professional' ? 'Perfect for indie hackers and solo founders.' :
                              'For serious growth and small teams.'
                        )}
                      </p>
                    </div>

                    <ul className="space-y-4 mb-10 flex-1">
                      <li className="flex items-center gap-3.5 text-sm font-black text-slate-900 border-b border-slate-50 pb-2">
                        <div className={`w-6 h-6 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${plan.isPopular ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-600'}`}>
                          <Zap size={14} fill={plan.isPopular ? "currentColor" : "none"} strokeWidth={3} />
                        </div>
                        {credits.toLocaleString()} AI Actions {isYearlySelected ? 'Upfront' : '/mo'}
                      </li>

                      <li className="flex items-center gap-3.5 text-sm font-bold text-slate-700">
                        <div className={`w-6 h-6 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${plan.isPopular ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-600'}`}>
                          <Star size={14} fill={plan.isPopular ? "currentColor" : "none"} strokeWidth={3} />
                        </div>
                        {dailyLimit || 0} Actions / day
                      </li>

                      {/* Dynamic Feature Toggles */}
                      <li className="flex items-center gap-3.5 text-sm font-medium text-slate-700">
                        <div className={`w-6 h-6 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${plan.maxAccounts > 1 ? (plan.isPopular ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-600') : 'bg-slate-50 text-slate-300'}`}>
                          {plan.maxAccounts > 1 ? <Check size={14} strokeWidth={3} /> : <X size={14} strokeWidth={3} />}
                        </div>
                        <span className={plan.maxAccounts > 1 ? '' : 'text-slate-400'}>
                          {plan.maxAccounts >= 100 ? 'Unlimited Accounts' : plan.maxAccounts > 1 ? `Up to ${plan.maxAccounts} Accounts` : 'Multiple Accounts Support'}
                        </span>
                      </li>

                      <li className="flex items-center gap-3.5 text-sm font-medium text-slate-700">
                        <div className={`w-6 h-6 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${plan.allowImages ? (plan.isPopular ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-600') : 'bg-slate-50 text-slate-300'}`}>
                          {plan.allowImages ? <Check size={14} strokeWidth={3} /> : <X size={14} strokeWidth={3} />}
                        </div>
                        <span className={plan.allowImages ? '' : 'text-slate-400'}>
                          AI Image Generation
                        </span>
                      </li>

                      <li className="flex items-center gap-3.5 text-sm font-medium text-slate-700">
                        <div className={`w-6 h-6 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${plan.allowTracking ? (plan.isPopular ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-600') : 'bg-slate-50 text-slate-300'}`}>
                          {plan.allowTracking ? <Check size={14} strokeWidth={3} /> : <X size={14} strokeWidth={3} />}
                        </div>
                        <span className={plan.allowTracking ? '' : 'text-slate-400'}>
                          Advanced Link Tracking
                        </span>
                      </li>

                      {/* Custom Decorative Features */}
                      {plan.features.map((f: string, i: number) => (
                        <li key={i} className="flex items-center gap-3.5 text-sm font-medium text-slate-500">
                          <div className={`w-6 h-6 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${plan.isPopular ? 'bg-orange-100 text-orange-600' : 'bg-slate-50 text-slate-400'}`}>
                            <CheckCircle2 size={14} strokeWidth={3} />
                          </div>
                          {f}
                        </li>
                      ))}
                    </ul>

                    <Link
                      to={plan.purchaseEnabled !== false ? "/signup" : "#"}
                      onClick={(e) => plan.purchaseEnabled === false && e.preventDefault()}
                      className={`w-full py-5 rounded-[2rem] font-black text-lg transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 text-center block ${plan.purchaseEnabled === false
                        ? 'bg-slate-50 text-slate-400 cursor-not-allowed shadow-none border border-slate-200'
                        : plan.isPopular
                          ? 'bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-orange-200'
                          : 'bg-slate-900 text-white hover:bg-slate-800'
                        }`}
                    >
                      {plan.purchaseEnabled === false ? 'Capacity Reached' : plan.monthlyPrice === 0 ? 'Start Free' : 'Choose Plan'}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section >

      {/* CTA Section */}
      < section className="py-24 bg-white relative overflow-hidden" >
        <div className="max-w-6xl mx-auto px-6">
          <div className="bg-orange-600 rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden shadow-2xl shadow-orange-200">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>

            <div className="relative z-10 max-w-3xl mx-auto space-y-8">
              <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
                Work smarter on Reddit. <br />
                Let Redigo draft — you decide.
              </h2>
              <p className="text-orange-100 text-lg font-medium max-w-2xl mx-auto leading-relaxed">
                Set up your brand voice once. Your Redigo assistant helps you extract leads and drafts high-intent suggestions — you review and publish with a single click.
              </p>

              <div className="flex flex-col items-center pt-4">
                <Link to="/signup" className="px-10 py-5 bg-white text-orange-600 rounded-full font-bold text-lg hover:bg-orange-50 hover:scale-105 transition-all shadow-xl shadow-orange-900/10 mb-6">
                  Start Growing on Reddit
                </Link>
                <p className="text-orange-200 text-sm font-bold tracking-wide">
                  Free to start • No credit card required
                </p>
              </div>
            </div>
          </div>
        </div>
      </section >

      {/* You're Always in Control Section */}
      < section className="py-20 bg-white border-t border-slate-100" >
        <div className="max-w-5xl mx-auto px-6">
          <div className="bg-slate-50 rounded-[2.5rem] p-10 md:p-14 border border-slate-100">
            <div className="text-center mb-10">
              <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest inline-flex items-center gap-2 mb-4">
                <ShieldCheck size={12} /> Our Commitment
              </span>
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">You're Always in Control</h2>
              <p className="text-slate-500 mt-3 text-lg max-w-2xl mx-auto">RedditGo is a human-first assistant. We suggest, you decide. Nothing is ever posted without your explicit approval.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { icon: Users, title: 'Founders-First', desc: 'Designed for people who care about their reputation. Every reply is a suggestion that respects the nuance of Reddit culture.' },
                { icon: ShieldCheck, title: 'Safe Account Protection', desc: 'We never ask for your password. All actions happen on your computer via our extension, keeping your account 100% compliant.' },
                { icon: BarChart, title: 'Real Results Analytics', desc: 'No vanity metrics. Track actual visits and conversion sentiment to see exactly how your engagement turns into growth.' },
              ].map((item, i) => (
                <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-3">
                  <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600">
                    <item.icon size={20} />
                  </div>
                  <h4 className="font-bold text-slate-900">{item.title}</h4>
                  <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Minimal Footer */}
      <footer className="py-12 bg-white text-slate-500 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center justify-center gap-6">
          <div className="text-sm font-medium">
            © 2026 Redigo. All rights reserved.
          </div>
          <div className="flex items-center gap-8 text-sm font-medium">
            <Link to="/privacy" className="hover:text-slate-900 transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-slate-900 transition-colors">Terms of Service</Link>
          </div>
          <p className="text-xs text-slate-400 text-center max-w-lg">
            RedditGo operates in compliance with Reddit's <a href="https://support.reddithelp.com/hc/en-us/articles/42728983564564" target="_blank" rel="noopener noreferrer" className="underline hover:text-orange-600 transition-colors">Responsible Builder Policy</a> and Data API Terms. All content is user-initiated and human-approved.
          </p>
        </div>
      </footer>
    </div>
  );
};
