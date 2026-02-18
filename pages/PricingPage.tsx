import React, { useState } from 'react';
import { Check, Shield, Crown, Zap, ArrowRight, Loader2 } from 'lucide-react';

import { useAuth } from '../context/AuthContext';

export const PricingPage: React.FC = () => {
    const { user } = useAuth();
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
    const [isLoading, setIsLoading] = useState<string | null>(null);

    const handleSubscribe = async (planName: string) => {
        setIsLoading(planName);
        try {
            const response = await fetch('/api/create-checkout-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    plan: planName,
                    cycle: billingCycle,
                    userEmail: user?.email, // Send user email for identification
                }),
            });

            const data = await response.json();

            if (response.ok && data.url) {
                window.location.href = data.url;
            } else {
                alert('Failed to initiate checkout: ' + (data.error || 'Unknown error'));
                setIsLoading(null);
            }
        } catch (error) {
            console.error('Checkout error:', error);
            alert('An error occurred. Please try again.');
            setIsLoading(null);
        }
    };

    const plans = [
        {
            name: 'Free',
            displayName: 'Starter',
            monthlyPrice: 0,
            yearlyPrice: 0,
            desc: 'For individuals exploring AI replies.',
            features: [
                '10 AI Replies / Day',
                'Basic Analytics',
                '1 Connected Account',
                'Community Support',
                'Standard AI Persona'
            ],
            popular: false,
            color: 'slate'
        },
        {
            name: 'Growth',
            displayName: 'Growth',
            monthlyPrice: 29,
            yearlyPrice: 290,
            desc: 'Perfect for indie hackers and solo founders.',
            features: [
                'Unlimited AI Replies',
                'Advanced Analytics',
                '3 Connected Accounts',
                'Priority Support',
                'Custom AI Persona'
            ],
            popular: true,
            color: 'orange'
        },
        {
            name: 'Agency',
            displayName: 'Agency',
            monthlyPrice: 79,
            yearlyPrice: 790,
            desc: 'For serious growth and small teams.',
            features: [
                'Everything in Growth',
                '10 Connected Accounts',
                'Team Collaboration',
                'API Access',
                'Dedicated Account Manager'
            ],
            popular: false,
            color: 'blue'
        }
    ];


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
                    const isCurrentPlan = user?.plan === plan.name || (plan.name === 'Free' && user?.plan === 'Free');

                    return (
                        <div key={plan.name} className={`relative bg-white rounded-[2.5rem] p-8 border ${plan.popular ? 'border-orange-200 shadow-xl shadow-orange-100/50 scale-105 z-10' : 'border-slate-100 shadow-lg'} hover:-translate-y-2 transition-transform duration-300 flex flex-col`}>
                            {plan.popular && (
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-orange-600 to-red-600 text-white px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wide shadow-lg shadow-orange-200">
                                    Most Popular
                                </div>
                            )}

                            <div className="mb-8">
                                <h3 className={`text-2xl font-bold ${plan.popular ? 'text-orange-600' : 'text-slate-900'}`}>{plan.displayName}</h3>
                                <p className="text-slate-500 text-sm mt-2 font-medium">{plan.desc}</p>
                            </div>

                            <div className="mb-8 flex items-baseline gap-1">
                                <span className="text-5xl font-extrabold text-slate-900">
                                    ${billingCycle === 'monthly' ? plan.monthlyPrice : Math.round(plan.yearlyPrice / 12)}
                                </span>
                                <span className="text-slate-400 font-medium">/mo</span>
                                {billingCycle === 'yearly' && plan.yearlyPrice > 0 && (
                                    <span className="text-xs text-green-600 font-bold ml-2 bg-green-50 px-2 py-1 rounded-full">Billed ${plan.yearlyPrice}/yr</span>
                                )}
                            </div>

                            <ul className="space-y-4 mb-8 flex-1">
                                {plan.features.map((feature, i) => (
                                    <li key={i} className="flex items-center gap-3 text-slate-700 font-medium text-sm">
                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${plan.popular ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-600'}`}>
                                            <Check size={12} strokeWidth={4} />
                                        </div>
                                        {feature}
                                    </li>
                                ))}
                            </ul>

                            <button
                                onClick={() => !isCurrentPlan && handleSubscribe(plan.name)}
                                disabled={!!isLoading || isCurrentPlan}
                                className={`w-full py-4 rounded-xl font-bold text-center transition-all shadow-lg hover:shadow-xl active:scale-95 flex items-center justify-center gap-2 ${isCurrentPlan
                                    ? 'bg-slate-100 text-slate-400 cursor-default shadow-none border border-slate-200'
                                    : plan.popular
                                        ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-orange-200'
                                        : 'bg-white text-slate-900 border-2 border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                                    }`}
                            >
                                {isLoading === plan.name ? (
                                    <Loader2 className="animate-spin" size={20} />
                                ) : isCurrentPlan ? (
                                    <>Current Plan</>
                                ) : (
                                    <>Choose {plan.displayName} <ArrowRight size={18} /></>
                                )}
                            </button>

                            {plan.name === 'Free' && (
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
        </div>
    );
};
