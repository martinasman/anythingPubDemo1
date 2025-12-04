'use client';

import { Check } from 'lucide-react';
import Container from '../ui/Container';
import SectionHeading from '../ui/SectionHeading';
import { PRICING_TIERS, CREDIT_COSTS } from '@/data/pricing';

export default function PricingSection() {
  return (
    <section id="pricing" className="py-12 sm:py-16 bg-zinc-50 dark:bg-slate-900/50 transition-colors">
      <Container>
        <SectionHeading
          title="Simple, Credit-Based Pricing"
          subtitle="Pay only for what you use. Start free, scale as you grow."
        />

        {/* Pricing cards */}
        <div className="grid md:grid-cols-3 gap-4 lg:gap-6 mb-16">
          {PRICING_TIERS.map((tier, index) => (
            <div
              key={tier.name}
              className={`relative rounded-2xl p-8 animate-fade-in-up stagger-${index + 1} ${
                tier.highlighted
                  ? 'bg-zinc-900 dark:bg-white text-white dark:text-slate-900 shadow-2xl scale-[1.02]'
                  : 'bg-white dark:bg-slate-800 border border-zinc-200 dark:border-slate-700'
              }`}
            >
              {/* Popular badge */}
              {tier.highlighted && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 text-xs font-semibold bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full">
                  Most Popular
                </span>
              )}

              {/* Tier name */}
              <h3 className={`text-lg font-semibold mb-2 ${
                tier.highlighted ? '' : 'text-zinc-900 dark:text-slate-100'
              }`}>
                {tier.name}
              </h3>

              {/* Price */}
              <div className="mb-6">
                <span className={`text-3xl font-bold ${
                  tier.highlighted ? '' : 'text-zinc-900 dark:text-slate-100'
                }`}>
                  {tier.price === 0 ? 'Free' : `$${tier.price}`}
                </span>
                {tier.price > 0 && (
                  <span className={`text-sm ${
                    tier.highlighted ? 'text-white/70 dark:text-slate-600' : 'text-zinc-500'
                  }`}>
                    /month
                  </span>
                )}
              </div>

              {/* Credits */}
              <p className={`text-sm mb-6 ${
                tier.highlighted ? 'text-white/80 dark:text-slate-600' : 'text-zinc-600 dark:text-slate-400'
              }`}>
                {typeof tier.credits === 'number' ? `${tier.credits} credits` : tier.credits}{' '}
                {tier.period === 'forever' ? 'to start' : 'per month'}
              </p>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check
                      size={18}
                      className={`flex-shrink-0 mt-0.5 ${
                        tier.highlighted ? 'text-green-400 dark:text-green-600' : 'text-green-500'
                      }`}
                    />
                    <span className={`text-sm ${
                      tier.highlighted ? 'text-white/90 dark:text-slate-700' : 'text-zinc-600 dark:text-slate-400'
                    }`}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <button
                className={`w-full py-2 px-4 text-sm rounded-lg font-medium transition-all ${
                  tier.highlighted
                    ? 'bg-white dark:bg-slate-900 text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-slate-800'
                    : 'bg-zinc-900 dark:bg-white text-white dark:text-slate-900 hover:bg-zinc-800 dark:hover:bg-slate-100'
                }`}
              >
                {tier.cta}
              </button>
            </div>
          ))}
        </div>

        {/* Credit costs */}
        <div className="text-center">
          <h4 className="text-sm font-semibold text-zinc-900 dark:text-slate-100 mb-4">
            Credit Usage
          </h4>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-zinc-600 dark:text-slate-400">
            <span className="px-3 py-1 rounded-full bg-white dark:bg-slate-800 border border-zinc-200 dark:border-slate-700">
              Market Research: {CREDIT_COSTS.market_research} credits
            </span>
            <span className="px-3 py-1 rounded-full bg-white dark:bg-slate-800 border border-zinc-200 dark:border-slate-700">
              Brand Identity: {CREDIT_COSTS.brand_identity} credits
            </span>
            <span className="px-3 py-1 rounded-full bg-white dark:bg-slate-800 border border-zinc-200 dark:border-slate-700">
              Website: {CREDIT_COSTS.website_generation} credits
            </span>
            <span className="px-3 py-1 rounded-full bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30">
              Full Business: {CREDIT_COSTS.full_business} credits
            </span>
          </div>
        </div>
      </Container>
    </section>
  );
}
