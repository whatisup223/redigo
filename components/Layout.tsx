
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BarChart3, 
  Settings, 
  ShieldCheck, 
  LogOut,
  Menu,
  X,
  Zap
} from 'lucide-react';

interface SidebarItemProps {
  icon: any;
  label: string;
  path: string;
  active: boolean;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon: Icon, label, path, active }) => (
  <Link 
    to={path}
    className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 group ${
      active 
        ? 'bg-orange-600 text-white shadow-lg shadow-orange-200 font-semibold translate-x-1' 
        : 'text-slate-500 hover:bg-white hover:text-slate-900 hover:shadow-sm'
    }`}
  >
    <Icon size={20} className={`${active ? 'text-white' : 'group-hover:text-orange-500 transition-colors'}`} />
    <span className="text-sm">{label}</span>
  </Link>
);

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const location = useLocation();

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: BarChart3, label: 'Analytics', path: '/analytics' },
    { icon: Settings, label: 'Settings', path: '/settings' },
    { icon: ShieldCheck, label: 'Admin', path: '/admin' },
  ];

  return (
    <div className="min-h-screen bg-[#fcfcfd] flex font-['Outfit']">
      {/* Mobile Sidebar Toggle */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed bottom-6 right-6 z-50 p-4 bg-orange-600 text-white rounded-full shadow-2xl hover:scale-110 transition-transform active:scale-95"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside className={`
        fixed lg:sticky top-0 h-screen w-72 bg-[#f8fafc]/50 backdrop-blur-xl border-r border-slate-200/60 p-6 transition-all duration-300 z-40
        ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex items-center gap-3 mb-12 px-2">
          <div className="w-11 h-11 bg-orange-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-orange-100 ring-4 ring-orange-50">
            <Zap fill="currentColor" size={24} />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">RedditGrowth</h1>
        </div>

        <nav className="space-y-2">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 px-4">Main Menu</p>
          {menuItems.map((item) => (
            <SidebarItem 
              key={item.path} 
              icon={item.icon}
              label={item.label}
              path={item.path}
              active={location.pathname === item.path}
            />
          ))}
        </nav>

        <div className="mt-auto absolute bottom-8 left-6 right-6 space-y-4">
          <div className="bg-white/80 border border-slate-200/60 p-4 rounded-3xl shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-slate-200 to-slate-100 flex items-center justify-center text-slate-600 font-bold shadow-inner">
                JD
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-bold text-slate-900 truncate">Jane Doe</p>
                <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Pro Plan</p>
                </div>
              </div>
            </div>
          </div>
          <button className="w-full flex items-center gap-3 px-5 py-3 text-slate-500 hover:text-red-500 hover:bg-red-50/50 rounded-2xl transition-all font-medium text-sm">
            <LogOut size={18} />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 w-full p-4 lg:p-10 overflow-y-auto custom-scrollbar">
        {children}
      </main>
    </div>
  );
};
