import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, ArrowLeft, LayoutDashboard, Home, AlertOctagon } from 'lucide-react';

interface ErrorPageProps {
    type?: '404' | '500' | '403';
    message?: string;
    error?: Error;
}

export const ErrorPage: React.FC<ErrorPageProps> = ({ type = '404', message, error }) => {
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth(); // Safe access to auth state

    // Context-Aware Button Logic
    const getPrimaryAction = () => {
        if (isAuthenticated && user) {
            return {
                label: 'Go to Dashboard',
                icon: <LayoutDashboard size={18} />,
                action: () => navigate('/dashboard', { replace: true })
            };
        }
        return {
            label: 'Back to Home',
            icon: <Home size={18} />,
            action: () => navigate('/', { replace: true })
        };
    };

    const primaryAction = getPrimaryAction();

    let title = 'Page Not Found';
    let desc = 'The page you are looking for doesn\'t exist or has been moved.';
    let Icon = ShieldAlert;
    let colorClass = 'text-orange-500';
    let bgClass = 'bg-orange-50';

    if (type === '500' || error) {
        title = 'Unexpected Error';
        desc = message || error?.message || 'Something went wrong on our end. Our team has been notified.';
        Icon = AlertOctagon;
        colorClass = 'text-red-500';
        bgClass = 'bg-red-50';
    } else if (type === '403') {
        title = 'Access Denied';
        desc = message || 'You do not have permission to view this page.';
        Icon = ShieldAlert;
        colorClass = 'text-red-500';
        bgClass = 'bg-red-50';
    } else if (message) {
        desc = message;
    }

    return (
        <div className="min-h-screen bg-[#fcfcfd] flex items-center justify-center p-4">
            <div className="relative w-full max-w-2xl bg-white p-10 md:p-16 rounded-[3rem] border border-slate-200/60 shadow-2xl flex flex-col items-center text-center overflow-hidden">

                {/* Background Decorative Element */}
                <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[300px] ${bgClass} rounded-full blur-[100px] opacity-70 pointer-events-none`} />

                <div className="relative z-10 w-24 h-24 mb-8">
                    <div className={`absolute inset-0 ${bgClass} rounded-[2rem] rotate-6 scale-110 opacity-50`} />
                    <div className="absolute inset-0 bg-white border border-slate-100 rounded-[2rem] shadow-xl flex items-center justify-center rotate-[-3deg] transition-transform hover:rotate-0 duration-500">
                        <Icon size={40} className={colorClass} strokeWidth={2.5} />
                    </div>
                </div>

                <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4 relative z-10">
                    {type === '404' && <span className={`block text-6xl md:text-8xl mb-2 ${colorClass} opacity-20`}>404</span>}
                    {title}
                </h1>

                <p className="text-slate-500 font-medium text-lg mb-12 max-w-md mx-auto leading-relaxed relative z-10">
                    {desc}
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto relative z-10">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-full sm:w-auto px-8 py-4 bg-white border border-slate-200 text-slate-600 rounded-[1.5rem] font-bold hover:bg-slate-50 hover:text-slate-900 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-sm"
                    >
                        <ArrowLeft size={18} />
                        Go Back
                    </button>

                    <button
                        onClick={primaryAction.action}
                        className={`w-full sm:w-auto px-8 py-4 bg-slate-900 text-white rounded-[1.5rem] font-black hover:-translate-y-0.5 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-xl shadow-slate-200`}
                    >
                        {primaryAction.icon}
                        {primaryAction.label}
                    </button>
                </div>
            </div>
        </div>
    );
};
