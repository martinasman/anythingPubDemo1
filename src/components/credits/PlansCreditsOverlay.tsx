'use client';

import { X, Check, CreditCard } from 'lucide-react';
import { useState } from 'react';
import { useCredits } from '@/hooks/useCredits';

interface PlansCreditsOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

const plans = [
  {
    id: 'lite',
    name: 'Lite',
    description: 'Keep your projects running with essential features',
    monthlyPrice: 5,
    yearlyPrice: 50,
    credits: 150,
    features: [
      '5 daily credits (up to 150/month)',
      'User roles & permissions',
      'Custom domains',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Designed for fast-moving teams building together in real time.',
    monthlyPrice: 29,
    yearlyPrice: 290,
    credits: 1200,
    popular: true,
    features: [
      '1200 monthly credits',
      'All features in Lite, plus:',
      'Priority support',
      'Advanced analytics',
    ],
  },
  {
    id: 'business',
    name: 'Business',
    description: 'Advanced controls and power features for growing departments.',
    monthlyPrice: 49,
    yearlyPrice: 490,
    credits: 3000,
    features: [
      '3000 monthly credits',
      'All features in Pro, plus:',
      'Dedicated support',
      'Custom integrations',
    ],
  },
];

export function PlansCreditsOverlay({ isOpen, onClose }: PlansCreditsOverlayProps) {
  const { credits, isLoading } = useCredits();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  // For now, assume free plan with initial credits
  const currentPlan = 'free';
  const totalCredits = 50; // Free tier allocation
  const usedCredits = totalCredits - (credits ?? 0);
  const percentUsed = Math.min(100, (usedCredits / totalCredits) * 100);

  const handleUpgrade = async (planId: string) => {
    setIsProcessing(planId);
    try {
      const plan = plans.find(p => p.id === planId);
      if (!plan) return;

      const price = billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;

      const response = await fetch('/api/stripe/credits/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId: planId,
          price: price * 100, // Convert to cents
          credits: plan.credits,
          isSubscription: true,
          interval: billingCycle === 'monthly' ? 'month' : 'year',
        }),
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
    } finally {
      setIsProcessing(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-5xl mx-4 my-8 bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <h2 className="text-lg font-semibold text-white">Plans & credits</h2>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Current Plan & Credits Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Current Plan Card */}
            <div className="bg-zinc-800/50 rounded-xl p-5 border border-zinc-700/50">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center">
                  <CreditCard size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-sm text-zinc-400">You&apos;re on</p>
                  <p className="text-lg font-semibold text-white capitalize">{currentPlan} Plan</p>
                </div>
              </div>
              <button className="px-4 py-2 text-sm font-medium text-zinc-300 bg-zinc-700/50 hover:bg-zinc-700 rounded-lg transition-colors">
                Manage
              </button>
            </div>

            {/* Credits Remaining Card */}
            <div className="bg-zinc-800/50 rounded-xl p-5 border border-zinc-700/50">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-white">Credits remaining</p>
                <p className="text-sm text-zinc-400">
                  {isLoading ? '...' : credits ?? 0} of {totalCredits}
                </p>
              </div>

              {/* Progress bar */}
              <div className="h-2 bg-zinc-700 rounded-full overflow-hidden mb-3">
                <div
                  className="h-full bg-gradient-to-r from-orange-500 via-orange-400 to-blue-500 transition-all duration-300"
                  style={{ width: `${100 - percentUsed}%` }}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-xs text-zinc-400">Daily credits used first</span>
                </div>
                <button
                  onClick={() => {/* Could open a top-up modal */}}
                  className="text-sm font-medium text-orange-400 hover:text-orange-300 transition-colors"
                >
                  Top up credits
                </button>
              </div>
            </div>
          </div>

          {/* Plan Tiers */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`relative bg-zinc-800/30 rounded-xl p-5 border transition-colors ${
                  plan.popular
                    ? 'border-orange-500/50 ring-1 ring-orange-500/20'
                    : 'border-zinc-700/50 hover:border-zinc-600'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-orange-500 text-white text-xs font-medium rounded-full">
                    Popular
                  </div>
                )}

                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
                  <p className="text-sm text-zinc-400 mt-1">{plan.description}</p>
                </div>

                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-3xl font-bold text-white">
                    ${billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice}
                  </span>
                  <span className="text-sm text-zinc-400">
                    per {billingCycle === 'monthly' ? 'month' : 'year'}
                  </span>
                </div>

                {/* Billing toggle for Pro/Business */}
                {plan.id !== 'lite' && (
                  <div className="flex items-center gap-3 mb-4">
                    <button
                      onClick={() => setBillingCycle('monthly')}
                      className={`text-xs px-2 py-1 rounded ${
                        billingCycle === 'monthly'
                          ? 'bg-zinc-700 text-white'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      Monthly
                    </button>
                    <button
                      onClick={() => setBillingCycle('annual')}
                      className={`text-xs px-2 py-1 rounded ${
                        billingCycle === 'annual'
                          ? 'bg-zinc-700 text-white'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      Annual
                    </button>
                  </div>
                )}

                <button
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={isProcessing !== null}
                  className={`w-full py-2.5 px-4 rounded-lg font-medium text-sm transition-colors ${
                    plan.popular
                      ? 'bg-orange-500 hover:bg-orange-600 text-white'
                      : 'bg-zinc-700 hover:bg-zinc-600 text-white'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isProcessing === plan.id ? 'Processing...' : 'Upgrade'}
                </button>

                <div className="mt-4 space-y-2">
                  <p className="text-xs text-zinc-500 font-medium">
                    {plan.credits.toLocaleString()} credits / month
                  </p>
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <Check size={14} className="text-green-500 mt-0.5 shrink-0" />
                      <span className="text-xs text-zinc-400">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
