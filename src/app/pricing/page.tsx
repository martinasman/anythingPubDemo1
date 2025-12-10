'use client';

import { Check, Coins, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import Image from 'next/image';
import { CREDIT_PACKAGES, CREDIT_COSTS } from '@/data/pricing';
import { useAuth } from '@/contexts/AuthContext';
import { useCredits } from '@/hooks/useCredits';
import { useState, useEffect } from 'react';

export default function PricingPage() {
  const { resolvedTheme } = useTheme();
  const { user } = useAuth();
  const { credits } = useCredits();
  const [loading, setLoading] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handlePurchase = async (packageId: string) => {
    if (!user) {
      window.location.href = '/signin';
      return;
    }

    setLoading(packageId);
    try {
      const response = await fetch('/api/stripe/credits/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId }),
      });

      const { url, error } = await response.json();

      if (error) {
        console.error('Checkout error:', error);
        setLoading(null);
        return;
      }

      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Failed to create checkout:', error);
      setLoading(null);
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-xl border-b border-zinc-200/50 dark:border-neutral-800/50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <ArrowLeft size={18} className="text-zinc-500" />
            <Image
              src={resolvedTheme === 'dark' ? '/logolight.png' : '/logodark.png'}
              alt="Anything"
              width={100}
              height={28}
              priority
            />
          </Link>
          {user && credits !== null && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-neutral-800">
              <Coins size={15} className="text-amber-500" />
              <span className="text-sm font-medium text-zinc-700 dark:text-neutral-300">
                {credits}
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-28 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Hero */}
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-white mb-4">
              Buy Credits
            </h1>
            <p className="text-zinc-500 dark:text-neutral-400 max-w-xl mx-auto">
              Credits power all AI features in Anything. Buy once, use whenever you need.
              No subscriptions, no expiration.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {CREDIT_PACKAGES.map((pkg) => (
              <div
                key={pkg.id}
                className={`relative rounded-2xl p-6 transition-all ${
                  pkg.highlighted
                    ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-2xl md:scale-105'
                    : 'bg-white dark:bg-neutral-800 border border-zinc-200 dark:border-neutral-700'
                }`}
              >
                {pkg.savings && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-xs font-medium bg-green-500 text-white rounded-full whitespace-nowrap">
                    {pkg.savings}
                  </span>
                )}

                <h3 className="text-lg font-semibold mb-2">{pkg.name}</h3>

                <div className="mb-4">
                  <span className="text-3xl font-bold">${pkg.price}</span>
                </div>

                <p
                  className={`text-sm mb-6 ${
                    pkg.highlighted
                      ? 'text-white/70 dark:text-zinc-600'
                      : 'text-zinc-500 dark:text-neutral-400'
                  }`}
                >
                  {pkg.credits} credits
                  <br />
                  <span className="text-xs">
                    (${pkg.pricePerCredit.toFixed(2)}/credit)
                  </span>
                </p>

                <button
                  onClick={() => handlePurchase(pkg.id)}
                  disabled={loading !== null}
                  className={`w-full py-2.5 px-4 rounded-lg font-medium transition-all ${
                    pkg.highlighted
                      ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800'
                      : 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-neutral-100'
                  } ${loading === pkg.id ? 'opacity-70' : ''}`}
                >
                  {loading === pkg.id ? 'Loading...' : 'Buy Credits'}
                </button>
              </div>
            ))}
          </div>

          {/* Credit Usage Reference */}
          <div className="text-center mb-12">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4 uppercase tracking-wider">
              Credit Usage
            </h3>
            <div className="flex flex-wrap justify-center gap-3 text-sm">
              <CreditBadge name="Market Research" cost={CREDIT_COSTS.market_research} />
              <CreditBadge name="Brand Identity" cost={CREDIT_COSTS.brand_identity} />
              <CreditBadge name="Website" cost={CREDIT_COSTS.website_generation} />
              <CreditBadge name="Website Edit" cost={CREDIT_COSTS.edit_website} />
              <CreditBadge name="Add Page" cost={CREDIT_COSTS.add_page} />
              <CreditBadge name="Lead Generation" cost={CREDIT_COSTS.generate_leads} />
              <CreditBadge name="Publish" cost={CREDIT_COSTS.publish_website} />
            </div>
          </div>

          {/* Features */}
          <div className="max-w-xl mx-auto">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4 text-center uppercase tracking-wider">
              What You Get
            </h3>
            <div className="space-y-3">
              <Feature text="Credits never expire" />
              <Feature text="Use for any AI feature" />
              <Feature text="No subscriptions required" />
              <Feature text="Secure payment via Stripe" />
              <Feature text="Instant credit delivery" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function CreditBadge({ name, cost }: { name: string; cost: number }) {
  return (
    <span className="px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-neutral-800 text-zinc-600 dark:text-neutral-400">
      {name}: <span className="font-medium">{cost}</span>
    </span>
  );
}

function Feature({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 text-zinc-600 dark:text-neutral-400">
      <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
        <Check size={12} className="text-green-600 dark:text-green-400" />
      </div>
      <span>{text}</span>
    </div>
  );
}
