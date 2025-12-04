'use client';

import { useProjectStore } from '@/store/projectStore';
import { DollarSign, TrendingUp, Receipt, Target, Check } from 'lucide-react';

export default function FinanceView() {
  const { artifacts, runningTools } = useProjectStore();

  const isBusinessPlanLoading = runningTools.has('businessplan');
  const businessPlan = artifacts.businessPlan;
  const pricingTiers = businessPlan?.pricingTiers || [];

  // Loading state
  if (isBusinessPlanLoading && !businessPlan) {
    return (
      <div className="h-full overflow-auto p-6">
        <div className="max-w-5xl mx-auto animate-pulse">
          <div className="mb-8">
            <div className="w-32 h-8 bg-zinc-200 dark:bg-zinc-700 rounded mb-2" />
            <div className="w-64 h-5 bg-zinc-200 dark:bg-zinc-700 rounded" />
          </div>
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="h-24 bg-zinc-200 dark:bg-zinc-700 rounded-xl" />
            <div className="h-24 bg-zinc-200 dark:bg-zinc-700 rounded-xl" />
            <div className="h-24 bg-zinc-200 dark:bg-zinc-700 rounded-xl" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="h-64 bg-zinc-200 dark:bg-zinc-700 rounded-xl" />
            <div className="h-64 bg-zinc-200 dark:bg-zinc-700 rounded-xl" />
            <div className="h-64 bg-zinc-200 dark:bg-zinc-700 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (!businessPlan) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-zinc-300 dark:border-zinc-600 flex items-center justify-center mb-4">
          <DollarSign size={40} className="text-zinc-300 dark:text-zinc-600" />
        </div>
        <h3 className="text-xl font-semibold text-zinc-500 dark:text-zinc-400 mb-2">
          No Pricing Yet
        </h3>
        <p className="text-sm text-zinc-400 dark:text-zinc-500 text-center max-w-sm">
          Start a conversation to generate your pricing tiers and business plan.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">
            Offer & Pricing
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Your pricing tiers and service packages
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-white dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-700">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={16} className="text-emerald-500" />
              <span className="text-xs text-zinc-500 dark:text-zinc-400">Revenue Goal</span>
            </div>
            <div className="text-xl font-semibold text-zinc-900 dark:text-white">
              $10,000
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">per month</p>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-700">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign size={16} className="text-blue-500" />
              <span className="text-xs text-zinc-500 dark:text-zinc-400">Avg. Deal Size</span>
            </div>
            <div className="text-xl font-semibold text-zinc-900 dark:text-white">
              {pricingTiers[1]?.price || pricingTiers[0]?.price || '--'}
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">mid-tier package</p>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-700">
            <div className="flex items-center gap-2 mb-2">
              <Receipt size={16} className="text-amber-500" />
              <span className="text-xs text-zinc-500 dark:text-zinc-400">Pricing Tiers</span>
            </div>
            <div className="text-xl font-semibold text-zinc-900 dark:text-white">
              {pricingTiers.length}
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">available packages</p>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-700">
            <div className="flex items-center gap-2 mb-2">
              <Target size={16} className="text-violet-500" />
              <span className="text-xs text-zinc-500 dark:text-zinc-400">Target Market</span>
            </div>
            <div className="text-xl font-semibold text-zinc-900 dark:text-white">
              SMB
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">small business</p>
          </div>
        </div>

        {/* Value Proposition */}
        {businessPlan.valueProposition && (
          <div className="p-5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800">
            <div className="flex items-center gap-2 mb-3">
              <Target size={18} className="text-emerald-500" />
              <h3 className="text-sm font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wide">
                Value Proposition
              </h3>
            </div>
            <p className="text-base text-zinc-700 dark:text-zinc-300 leading-relaxed">
              {businessPlan.valueProposition}
            </p>
          </div>
        )}

        {/* Pricing Tiers */}
        {pricingTiers.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
              Your Pricing Tiers
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pricingTiers.map((tier, index) => {
                const isPopular = index === 1; // Middle tier is usually most popular
                return (
                  <div
                    key={index}
                    className={`p-5 rounded-xl border ${
                      isPopular
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 ring-2 ring-blue-500/20'
                        : 'bg-white dark:bg-zinc-800/50 border-zinc-100 dark:border-zinc-700'
                    }`}
                  >
                    {isPopular && (
                      <span className="inline-block px-2 py-0.5 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50 rounded-full mb-3">
                        Most Popular
                      </span>
                    )}
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                      {tier.name}
                    </h3>
                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2 mb-4">
                      {tier.price}
                    </p>
                    {tier.features && tier.features.length > 0 && (
                      <ul className="space-y-2">
                        {tier.features.map((feature, fIndex) => (
                          <li key={fIndex} className="flex items-start gap-2">
                            <Check size={16} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-zinc-600 dark:text-zinc-400">
                              {feature}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Service Packages */}
        {businessPlan.servicePackages && businessPlan.servicePackages.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
              Service Packages
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {businessPlan.servicePackages.map((pkg, index) => (
                <div
                  key={index}
                  className="p-5 rounded-xl bg-white dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-700"
                >
                  <div className="flex items-baseline justify-between mb-3">
                    <h3 className="text-base font-semibold text-zinc-900 dark:text-white">
                      {pkg.name}
                    </h3>
                    <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                      {pkg.price}
                    </span>
                  </div>
                  {pkg.description && (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-3">
                      {pkg.description}
                    </p>
                  )}
                  {pkg.deliverables && pkg.deliverables.length > 0 && (
                    <ul className="space-y-1">
                      {pkg.deliverables.map((item, dIndex) => (
                        <li key={dIndex} className="flex items-start gap-2">
                          <Check size={14} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                          <span className="text-xs text-zinc-600 dark:text-zinc-400">
                            {item}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
