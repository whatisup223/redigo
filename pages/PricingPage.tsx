import React, { useState } from 'react';
import { Check, Shield, Crown, Zap, ArrowRight, Loader2 } from 'lucide-react';

import { useAuth } from '../context/AuthContext';

export const PricingPage: React.FC = () => {
    interface Plan {
        id: string;
        name: string;
        monthlyPrice: number;
        yearlyPrice: number;
        credits: number;
        dailyLimitMonthly: number;
        dailyLimitYearly: number;
        features: string[];
        isPopular: boolean;
        highlightText?: string;
        isCustom?: boolean;
    }

    const { user, updateUser } = useAuth();
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
    const [isLoading, setIsLoading] = useState<string | null>(null);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loadingPlans, setLoadingPlans] = useState(true);

    React.useEffect(() => {
        const fetchPlans = async () => {
            try {
                const res = await fetch('/api/plans');
                if (res.ok) {
                    const data = await res.json();
                    setPlans(data);
                }
            } catch (error) {
                console.error('Failed to fetch plans', error);
            } finally {
                setLoadingPlans(false);
            }
        };
        fetchPlans();
    }, []);

    const handleSubscribe = async (plan: Plan) => {
        if (!user) {
            window.location.href = '/signup';
            return;
        }

        setIsLoading(plan.id);
        try {
            const res = await fetch('/api/user/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, planId: plan.id, billingCycle })
            });

            if (res.ok) {
                const data = await res.json();

                if (data.checkoutUrl) {
                    // Redirect to Stripe Checkout
                    window.location.href = data.checkoutUrl;
                } else {
                    // Instant activation (Free plan or Dev mode fallback)
                    alert(`Successfully subscribed to ${plan.name}!`);
                    if (updateUser && data.user) {
                        updateUser(data.user);
                    }
                }
            } else {
                const err = await res.json();
                alert('Subscription failed: ' + err.error);
            }
        } catch (error) {
            console.error('Subscription error', error);
            alert('An error occurred');
        } finally {
            setIsLoading(null);
        }
    };


    return (
        <div className="max-w-6xl mx-auto py-10 px-4">
            <div className="text-center mb-16 space-y-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-bold uppercase tracking-wide">
                    <Crown size={14} className="fill-orange-700" />
                    Upgrade Your Plan
                </span>
                <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
                    Scale your growth with <span className="text-orange-600">Pro Power.</span>
                </h1>
                <p className="text-slate-500 text-lg max-w-2xl mx-auto">
                    Unlock the full potential of your AI agent. Cancel anytime.
                </p>

                {/* Billing Toggle */}
                <div className="flex items-center justify-center gap-4 mt-8">
                    <span className={`text-sm font-bold ${billingCycle === 'monthly' ? 'text-slate-900' : 'text-slate-500'}`}>Monthly</span>
                    <button
                        onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
                        className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 relative ${billingCycle === 'monthly' ? 'bg-slate-200' : 'bg-orange-600'}`}
                    >
                        <div className={`w-6 h-6 bg-white rounded-full shadow-sm transition-transform duration-300 ${billingCycle === 'monthly' ? 'translate-x-0' : 'translate-x-6'}`}></div>
                    </button>
                    <span className={`text-sm font-bold ${billingCycle === 'yearly' ? 'text-slate-900' : 'text-slate-500'}`}>
                        Yearly <span className="text-green-600 text-xs ml-1 font-extrabold uppercase bg-green-100 px-2 py-0.5 rounded-full">-20%</span>
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
                {plans.map((plan) => {
                    const isCurrentPlan = user?.plan === plan.name;
                    const isFree = plan.monthlyPrice === 0;

                    // Only show yearly if selected, not free, and a yearly price exists
                    const isYearlySelected = billingCycle === 'yearly' && !isFree && (plan.yearlyPrice || 0) > 0;
                    const price = isYearlySelected ? Math.round(plan.yearlyPrice / 12) : plan.monthlyPrice;
                    const credits = isYearlySelected ? plan.credits * 12 : plan.credits;
                    const dailyLimit = isYearlySelected ? plan.dailyLimitYearly : plan.dailyLimitMonthly;

                    return (
                        <div key={plan.id} className={`relative bg-white rounded-[2.5rem] p-8 border ${plan.isPopular ? 'border-orange-200 shadow-xl shadow-orange-100/50 scale-105 z-10' : 'border-slate-100 shadow-lg'} hover:-translate-y-2 transition-transform duration-300 flex flex-col`}>
                            {plan.isPopular && (
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-orange-600 to-red-600 text-white px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wide shadow-lg shadow-orange-200">
                                    Most Popular
                                </div>
                            )}

                            <div className="mb-8">
                                <h3 className={`text-2xl font-bold ${plan.isPopular ? 'text-orange-600' : 'text-slate-900'}`}>{plan.name}</h3>
                                <p className="text-slate-500 text-sm mt-2 font-medium">
                                    {plan.name === 'Starter' ? 'For individuals exploring AI replies.' :
                                        plan.name === 'Professional' ? 'Perfect for indie hackers and solo founders.' :
                                            plan.name === 'Agency' ? 'For serious growth and small teams.' : 'Custom plan for enterprise needs.'}
                                </p>
                            </div>


                            <div className="mb-8 flex items-baseline gap-1">
                                {isFree ? (
                                    <span className="text-5xl font-extrabold text-slate-900">Free</span>
                                ) : (
                                    <>
                                        <span className="text-5xl font-extrabold text-slate-900">${price}</span>
                                        <span className="text-slate-400 font-medium">/mo</span>
                                    </>
                                )}
                                {isYearlySelected && (
                                    <span className="text-xs text-green-600 font-bold ml-2 bg-green-50 px-2 py-1 rounded-full">Billed ${plan.yearlyPrice}/yr</span>
                                )}
                            </div>

                            <ul className="space-y-4 mb-8 flex-1">
                                <li className="flex items-center gap-3 text-slate-700 font-bold text-sm">
                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${plan.isPopular ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-600'}`}>
                                        <Zap size={12} strokeWidth={4} />
                                    </div>
                                    {credits} Credits {isYearlySelected ? 'Upfront' : '/ Month'}
                                </li>


                                <li className="flex items-center gap-3 text-slate-700 font-bold text-sm">
                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${plan.isPopular ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-600'}`}>
                                        <Zap size={12} strokeWidth={4} />
                                    </div>
                                    {dailyLimit || 0} Daily Actions
                                </li>

                                {plan.features.map((feature, i) => (
                                    <li key={i} className="flex items-center gap-3 text-slate-700 font-medium text-sm">
                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${plan.isPopular ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-600'}`}>
                                            <Check size={12} strokeWidth={4} />
                                        </div>
                                        {feature}
                                    </li>
                                ))}
                            </ul>

                            <button
                                onClick={() => !isCurrentPlan && handleSubscribe(plan)}
                                disabled={!!isLoading || isCurrentPlan}
                                className={`w-full py-4 rounded-xl font-bold text-center transition-all shadow-lg hover:shadow-xl active:scale-95 flex items-center justify-center gap-2 ${isCurrentPlan
                                    ? 'bg-slate-100 text-slate-400 cursor-default shadow-none border border-slate-200'
                                    : plan.isPopular
                                        ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-orange-200'
                                        : 'bg-white text-slate-900 border-2 border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                                    }`}
                            >
                                {isLoading === plan.id ? (
                                    <Loader2 className="animate-spin" size={20} />
                                ) : isCurrentPlan ? (
                                    <>Current Plan</>
                                ) : (
                                    <>Choose {plan.name} <ArrowRight size={18} /></>
                                )}
                            </button>

                            {plan.monthlyPrice === 0 && (
                                <p className="text-center text-xs text-slate-400 font-medium mt-4">
                                    Free forever. No credit card required.
                                </p>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="mt-16 text-center space-y-4">
                <p className="text-slate-400 text-sm font-medium">
                    Secure checkout powered by Stripe. All plans come with a 14-day money-back guarantee.
                </p>
                <div className="flex items-center justify-center gap-2 text-slate-300">
                    <Shield size={16} />
                    <span className="text-xs font-bold uppercase tracking-wider">Enterprise-Grade Security</span>
                </div>
            </div>
        </div >
    );
};
