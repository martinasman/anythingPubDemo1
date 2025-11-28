'use client';

import { useProjectStore } from '@/store/projectStore';
import { Sparkles, Target, DollarSign, Palette, Type } from 'lucide-react';

export default function BrandFocusView() {
  const { artifacts, runningTools } = useProjectStore();

  const isIdentityLoading = runningTools.has('identity');
  const identity = artifacts.identity;
  const businessPlan = artifacts.businessPlan;

  // Loading state
  if (isIdentityLoading && !identity) {
    return (
      <div className="h-full bg-white dark:bg-slate-800/50 p-8 animate-pulse">
        <div className="flex items-center gap-6 mb-8">
          <div className="w-24 h-24 rounded-2xl bg-zinc-200 dark:bg-slate-700" />
          <div className="flex-1">
            <div className="w-48 h-8 bg-zinc-200 dark:bg-slate-700 rounded mb-3" />
            <div className="w-64 h-5 bg-zinc-200 dark:bg-slate-700 rounded" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div className="h-32 bg-zinc-200 dark:bg-slate-700 rounded-xl" />
          <div className="h-32 bg-zinc-200 dark:bg-slate-700 rounded-xl" />
        </div>
      </div>
    );
  }

  // Empty state
  if (!identity) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-zinc-50/50 dark:bg-slate-800/30">
        <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-zinc-300 dark:border-slate-600 flex items-center justify-center mb-4">
          <Sparkles size={32} className="text-zinc-300 dark:text-slate-600" />
        </div>
        <h3 className="text-lg font-semibold text-zinc-500 dark:text-slate-400 mb-2">
          No Brand Yet
        </h3>
        <p className="text-sm text-zinc-400 dark:text-slate-500 text-center max-w-xs">
          Start a conversation to generate your brand identity, including logo, colors, and messaging.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full bg-white dark:bg-slate-800/50 overflow-auto">
      <div className="p-6 space-y-6">
        {/* Header: Logo + Name + Tagline */}
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border border-zinc-100 dark:border-slate-700 flex items-center justify-center shadow-lg flex-shrink-0">
            <img
              src={identity.logoUrl}
              alt={identity.name}
              className="w-full h-full object-contain p-2"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-1">
              {identity.name}
            </h1>
            <p className="text-base text-zinc-500 dark:text-slate-400">
              {identity.tagline}
            </p>
          </div>
        </div>

        {/* Two column layout for details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Color Palette */}
          <div className="p-4 rounded-xl bg-zinc-50 dark:bg-slate-800 border border-zinc-100 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-3">
              <Palette size={16} className="text-blue-500" />
              <h3 className="text-sm font-semibold text-zinc-700 dark:text-slate-300 uppercase tracking-wide">
                Color Palette
              </h3>
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <div
                  className="h-16 rounded-lg shadow-sm border border-white/20 mb-2"
                  style={{ backgroundColor: identity.colors.primary }}
                />
                <p className="text-xs text-zinc-500 dark:text-slate-400 text-center">Primary</p>
                <p className="text-xs font-mono text-zinc-400 text-center">{identity.colors.primary}</p>
              </div>
              <div className="flex-1">
                <div
                  className="h-16 rounded-lg shadow-sm border border-white/20 mb-2"
                  style={{ backgroundColor: identity.colors.secondary }}
                />
                <p className="text-xs text-zinc-500 dark:text-slate-400 text-center">Secondary</p>
                <p className="text-xs font-mono text-zinc-400 text-center">{identity.colors.secondary}</p>
              </div>
              <div className="flex-1">
                <div
                  className="h-16 rounded-lg shadow-sm border border-white/20 mb-2"
                  style={{ backgroundColor: identity.colors.accent }}
                />
                <p className="text-xs text-zinc-500 dark:text-slate-400 text-center">Accent</p>
                <p className="text-xs font-mono text-zinc-400 text-center">{identity.colors.accent}</p>
              </div>
            </div>
          </div>

          {/* Typography */}
          <div className="p-4 rounded-xl bg-zinc-50 dark:bg-slate-800 border border-zinc-100 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-3">
              <Type size={16} className="text-blue-500" />
              <h3 className="text-sm font-semibold text-zinc-700 dark:text-slate-300 uppercase tracking-wide">
                Typography
              </h3>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-zinc-500 dark:text-slate-400 mb-1">Font Family</p>
                <p className="text-lg font-medium text-zinc-900 dark:text-white" style={{ fontFamily: identity.font }}>
                  {identity.font}
                </p>
              </div>
              <div className="text-2xl font-bold text-zinc-900 dark:text-white" style={{ fontFamily: identity.font }}>
                The quick brown fox jumps over the lazy dog
              </div>
            </div>
          </div>
        </div>

        {/* Value Proposition */}
        {businessPlan?.valueProposition && (
          <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-3">
              <Target size={16} className="text-blue-500" />
              <h3 className="text-sm font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wide">
                Value Proposition
              </h3>
            </div>
            <p className="text-base text-zinc-700 dark:text-slate-300 leading-relaxed">
              {businessPlan.valueProposition}
            </p>
          </div>
        )}

        {/* Pricing Tiers */}
        {businessPlan?.pricingTiers && businessPlan.pricingTiers.length > 0 && (
          <div className="p-4 rounded-xl bg-zinc-50 dark:bg-slate-800 border border-zinc-100 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign size={16} className="text-blue-500" />
              <h3 className="text-sm font-semibold text-zinc-700 dark:text-slate-300 uppercase tracking-wide">
                Pricing Tiers
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {businessPlan.pricingTiers.map((tier, index) => (
                <div
                  key={index}
                  className="p-4 rounded-lg bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-700"
                >
                  <div className="flex items-baseline justify-between mb-2">
                    <h4 className="text-sm font-semibold text-zinc-900 dark:text-white">
                      {tier.name}
                    </h4>
                    <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      {tier.price}
                    </span>
                  </div>
                  {tier.features && tier.features.length > 0 && (
                    <ul className="space-y-1">
                      {tier.features.slice(0, 3).map((feature, fIndex) => (
                        <li key={fIndex} className="text-xs text-zinc-500 dark:text-slate-400">
                          {feature}
                        </li>
                      ))}
                      {tier.features.length > 3 && (
                        <li className="text-xs text-blue-500">
                          +{tier.features.length - 3} more features
                        </li>
                      )}
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
