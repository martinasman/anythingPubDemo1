'use client';

import { X, Coins } from 'lucide-react';
import { CREDIT_PACKAGES } from '@/data/pricing';
import { useState } from 'react';

interface InsufficientCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
  requiredCredits: number;
  currentCredits: number;
  actionName?: string;
}

export default function InsufficientCreditsModal({
  isOpen,
  onClose,
  requiredCredits,
  currentCredits,
  actionName = 'This action',
}: InsufficientCreditsModalProps) {
  const [loading, setLoading] = useState<string | null>(null);

  if (!isOpen) return null;

  const shortfall = requiredCredits - currentCredits;

  const handlePurchase = async (packageId: string) => {
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-neutral-900 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl border border-zinc-200 dark:border-neutral-800">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-neutral-300 transition-colors"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <Coins size={32} className="text-amber-500" />
          </div>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">
            Need More Credits
          </h2>
          <p className="text-zinc-500 dark:text-neutral-400 text-sm">
            {actionName} requires <span className="font-medium text-zinc-700 dark:text-neutral-300">{requiredCredits}</span> credits.
            <br />
            You have <span className="font-medium text-zinc-700 dark:text-neutral-300">{currentCredits}</span> credits ({shortfall} more needed).
          </p>
        </div>

        {/* Credit Packages */}
        <div className="space-y-3 mb-4">
          {CREDIT_PACKAGES.map((pkg) => (
            <button
              key={pkg.id}
              onClick={() => handlePurchase(pkg.id)}
              disabled={loading !== null}
              className={`w-full p-4 rounded-xl border transition-all text-left ${
                pkg.highlighted
                  ? 'border-amber-400 dark:border-amber-600 bg-amber-50 dark:bg-amber-900/20'
                  : 'border-zinc-200 dark:border-neutral-700 hover:border-zinc-300 dark:hover:border-neutral-600'
              } ${loading === pkg.id ? 'opacity-70' : ''}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-zinc-900 dark:text-white">
                      {pkg.name}
                    </span>
                    {pkg.savings && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        {pkg.savings}
                      </span>
                    )}
                    {pkg.highlighted && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                        Popular
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-zinc-500 dark:text-neutral-400">
                    {pkg.credits} credits
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-semibold text-zinc-900 dark:text-white">
                    ${pkg.price}
                  </span>
                  {loading === pkg.id && (
                    <div className="text-xs text-zinc-500">Loading...</div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Footer text */}
        <p className="text-xs text-center text-zinc-400 dark:text-neutral-500">
          Credits never expire. One-time purchase.
        </p>
      </div>
    </div>
  );
}
