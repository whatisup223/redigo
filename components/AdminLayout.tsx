
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    Settings,
    Activity,
    LogOut,
    Shield,
    AlertCircle,
    Menu,
    X,
    CreditCard,
    Globe,
    Sliders
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
        className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 group ${active
            ? 'bg-slate-900 text-white shadow-lg shadow-slate-200 font-semibold translate-x-1'
            : 'text-slate-500 hover:bg-white hover:text-slate-900 hover:shadow-sm'
            }`}
    >
        <Icon size={20} className={`${active ? 'text-white' : 'group-hover:text-slate-900 transition-colors'}`} />
        <span className="text-sm">{label}</span>
    </Link>
);

export const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const location = useLocation();

    const menuItems = [
        { icon: LayoutDashboard, label: 'Overview', path: '/admin' },
        { icon: Users, label: 'User Management', path: '/admin/users' },
        { icon: Sliders, label: 'Configuration', path: '/admin/settings' },
        { icon: AlertCircle, label: 'System Logs', path: '/admin/logs' },
    ];

    return (
        <div className="min-h-screen bg-[#f8fafc] flex font-['Outfit']">
            {/* Mobile Sidebar Toggle */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="lg:hidden fixed bottom-6 right-6 z-50 p-4 bg-slate-900 text-white rounded-full shadow-2xl hover:scale-110 transition-transform active:scale-95"
            >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Sidebar */}
            <aside className={`
        fixed lg:sticky top-0 h-screen w-72 bg-white/80 backdrop-blur-xl border-r border-slate-200/60 p-6 transition-all duration-300 z-40
        ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'}
      `}>
                <div className="flex items-center gap-3 mb-12 px-2">
                    <div className="w-11 h-11 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-slate-200">
                        <Shield fill="currentColor" size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-extrabold tracking-tight text-slate-900 leading-tight">Admin<br /><span className="text-slate-400">Panel</span></h1>
                    </div>
                </div>

                <nav className="space-y-2">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 px-4">System Controls</p>
                    {menuItems.map((item) => (
                        <SidebarItem
                            key={item.path}
                            icon={item.icon}
                            label={item.label}
                            path={item.path}
                            active={location.pathname === item.path || (location.pathname === '/admin' && item.path === '/admin')}
                        />
                    ))}
                </nav>

                <div className="mt-auto absolute bottom-8 left-6 right-6">
                    <Link to="/login" className="w-full flex items-center gap-3 px-5 py-3 text-slate-500 hover:text-red-500 hover:bg-red-50/50 rounded-2xl transition-all font-medium text-sm">
                        <LogOut size={18} />
                        <span>Log Out</span>
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 w-full p-4 lg:p-10 overflow-y-auto custom-scrollbar">
                {children}
            </main>
        </div>
    );
};
