'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import {
  COMMERCE_ENTRY_POINTS,
  COMMERCE_STEPS,
  COMMERCE_NICHES,
  type CommerceEntryPoint,
} from '@/config/businessModes';
import { useAuth } from '@/contexts/AuthContext';

type WizardStep = 'entry' | 'product';

interface WizardData {
  entryPoint: CommerceEntryPoint | null;
  productUrl: string;
  productDescription: string;
  niche: string;
}

export function CommerceWizard() {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState<WizardStep>('entry');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<WizardData>({
    entryPoint: null,
    productUrl: '',
    productDescription: '',
    niche: '',
  });

  async function handleLaunch() {
    if (!user) {
      sessionStorage.setItem('pendingCommerceProject', JSON.stringify(data));
      router.push('/signin?redirect=/commerce');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'commerce',
          entryPoint: data.entryPoint,
          productUrl: data.productUrl,
          productDescription: data.productDescription,
          niche: data.niche,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create project');
      }

      const { projectId } = await response.json();

      // Build prompt based on entry point
      let prompt = 'Build my e-commerce store';
      if (data.entryPoint === 'product-url' && data.productUrl) {
        prompt = `Build a one-product store for this product: ${data.productUrl}`;
      } else if (data.entryPoint === 'discover' && data.niche) {
        prompt = `Find winning products in the ${data.niche} niche and build a store`;
      } else if (data.entryPoint === 'manual' && data.productDescription) {
        prompt = `Build a store for this product: ${data.productDescription}`;
      }

      router.push(`/p/${projectId}?prompt=${encodeURIComponent(prompt)}`);
    } catch (err) {
      console.error('Failed to create commerce project:', err);
      setError(err instanceof Error ? err.message : 'Failed to create store');
      setLoading(false);
    }
  }

  const canLaunch = () => {
    if (!data.entryPoint) return false;
    if (data.entryPoint === 'product-url') return !!data.productUrl;
    if (data.entryPoint === 'discover') return !!data.niche;
    if (data.entryPoint === 'manual') return !!data.productDescription;
    return false;
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'var(--surface-1)' }}
    >
      {/* Header */}
      <header
        className="sticky top-0 z-10 px-4 py-4 flex items-center justify-between border-b"
        style={{
          background: 'var(--surface-1)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        <button
          onClick={() => (step === 'entry' ? router.push('/') : setStep('entry'))}
          className="flex items-center gap-2 text-sm transition-colors"
          style={{ color: 'var(--text-secondary)' }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* Progress */}
        <div className="flex items-center gap-2">
          {COMMERCE_STEPS.slice(0, 2).map((s, i) => (
            <div
              key={s.id}
              className="w-2 h-2 rounded-full transition-colors"
              style={{
                background:
                  (step === 'entry' && i === 0) || (step === 'product' && i <= 1)
                    ? 'rgb(16, 185, 129)'
                    : 'var(--surface-3)',
              }}
            />
          ))}
        </div>

        <div className="w-16" />
      </header>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <AnimatePresence mode="wait">
          {step === 'entry' && (
            <motion.div
              key="entry"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-lg"
            >
              <div className="text-center mb-8">
                <h1
                  className="text-2xl sm:text-3xl font-bold mb-2"
                  style={{ color: 'var(--text-primary)' }}
                >
                  How do you want to start?
                </h1>
                <p style={{ color: 'var(--text-secondary)' }}>
                  Pick a product, or let AI find one for you.
                </p>
              </div>

              <div className="space-y-4">
                {COMMERCE_ENTRY_POINTS.map((entry) => (
                  <EntryPointCard
                    key={entry.id}
                    entry={entry}
                    selected={data.entryPoint === entry.id}
                    onSelect={() => {
                      setData({ ...data, entryPoint: entry.id });
                      setStep('product');
                    }}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {step === 'product' && (
            <motion.div
              key="product"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-lg"
            >
              {data.entryPoint === 'product-url' && (
                <ProductUrlStep
                  value={data.productUrl}
                  onChange={(url) => setData({ ...data, productUrl: url })}
                  onLaunch={handleLaunch}
                  loading={loading}
                  error={error}
                  canLaunch={canLaunch()}
                />
              )}

              {data.entryPoint === 'discover' && (
                <DiscoverStep
                  niche={data.niche}
                  onChange={(niche) => setData({ ...data, niche })}
                  onLaunch={handleLaunch}
                  loading={loading}
                  error={error}
                  canLaunch={canLaunch()}
                />
              )}

              {data.entryPoint === 'manual' && (
                <ManualStep
                  description={data.productDescription}
                  onChange={(desc) =>
                    setData({ ...data, productDescription: desc })
                  }
                  onLaunch={handleLaunch}
                  loading={loading}
                  error={error}
                  canLaunch={canLaunch()}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

interface EntryPointCardProps {
  entry: (typeof COMMERCE_ENTRY_POINTS)[0];
  selected: boolean;
  onSelect: () => void;
}

function EntryPointCard({ entry, selected, onSelect }: EntryPointCardProps) {
  const Icon = entry.icon;

  return (
    <motion.button
      onClick={onSelect}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className="w-full p-6 rounded-xl text-left flex items-center gap-4 transition-all"
      style={{
        background: selected ? 'rgba(16, 185, 129, 0.1)' : 'var(--surface-2)',
        border: selected
          ? '2px solid rgb(16, 185, 129)'
          : '1px solid var(--border-subtle)',
      }}
    >
      <div
        className="p-3 rounded-xl"
        style={{
          background: selected ? 'rgba(16, 185, 129, 0.2)' : 'var(--surface-3)',
        }}
      >
        <Icon
          className="w-6 h-6"
          style={{
            color: selected ? 'rgb(16, 185, 129)' : 'var(--text-secondary)',
          }}
        />
      </div>
      <div className="flex-1">
        <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>
          {entry.name}
        </div>
        <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {entry.description}
        </div>
      </div>
      <ArrowRight
        className="w-5 h-5"
        style={{ color: 'var(--text-tertiary)' }}
      />
    </motion.button>
  );
}

// Product URL Step
function ProductUrlStep({
  value,
  onChange,
  onLaunch,
  loading,
  error,
  canLaunch,
}: {
  value: string;
  onChange: (v: string) => void;
  onLaunch: () => void;
  loading: boolean;
  error: string | null;
  canLaunch: boolean;
}) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h1
          className="text-2xl sm:text-3xl font-bold mb-2"
          style={{ color: 'var(--text-primary)' }}
        >
          Paste your product link
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Works with AliExpress, Amazon, CJDropshipping, and more
        </p>
      </div>

      <input
        type="url"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="https://aliexpress.com/item/..."
        className="w-full px-4 py-4 rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
        style={{
          background: 'var(--surface-2)',
          border: '1px solid var(--border-subtle)',
          color: 'var(--text-primary)',
        }}
      />

      {error && <p className="text-sm text-red-500 text-center">{error}</p>}

      <button
        onClick={onLaunch}
        disabled={loading || !canLaunch}
        className="w-full py-4 rounded-xl font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Analyzing product...
          </>
        ) : (
          <>
            Build My Store
            <ArrowRight className="w-5 h-5" />
          </>
        )}
      </button>
    </div>
  );
}

// Discover Step
function DiscoverStep({
  niche,
  onChange,
  onLaunch,
  loading,
  error,
  canLaunch,
}: {
  niche: string;
  onChange: (v: string) => void;
  onLaunch: () => void;
  loading: boolean;
  error: string | null;
  canLaunch: boolean;
}) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h1
          className="text-2xl sm:text-3xl font-bold mb-2"
          style={{ color: 'var(--text-primary)' }}
        >
          What niche interests you?
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          AI will find trending products in your chosen niche
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {COMMERCE_NICHES.map((n) => (
          <button
            key={n}
            onClick={() => onChange(n)}
            className="p-4 rounded-xl text-sm font-medium transition-all"
            style={{
              background: niche === n ? 'rgba(16, 185, 129, 0.1)' : 'var(--surface-2)',
              border:
                niche === n
                  ? '2px solid rgb(16, 185, 129)'
                  : '1px solid var(--border-subtle)',
              color: niche === n ? 'rgb(52, 211, 153)' : 'var(--text-secondary)',
            }}
          >
            {n}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-red-500 text-center">{error}</p>}

      <button
        onClick={onLaunch}
        disabled={loading || !canLaunch}
        className="w-full py-4 rounded-xl font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Finding winning products...
          </>
        ) : (
          <>
            Find Products
            <ArrowRight className="w-5 h-5" />
          </>
        )}
      </button>
    </div>
  );
}

// Manual Step
function ManualStep({
  description,
  onChange,
  onLaunch,
  loading,
  error,
  canLaunch,
}: {
  description: string;
  onChange: (v: string) => void;
  onLaunch: () => void;
  loading: boolean;
  error: string | null;
  canLaunch: boolean;
}) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h1
          className="text-2xl sm:text-3xl font-bold mb-2"
          style={{ color: 'var(--text-primary)' }}
        >
          Describe your product
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Tell us about the product you want to sell
        </p>
      </div>

      <textarea
        value={description}
        onChange={(e) => onChange(e.target.value)}
        placeholder="e.g., A portable LED projector that turns any room into a galaxy night sky. Perfect for kids' bedrooms..."
        rows={5}
        className="w-full px-4 py-3 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
        style={{
          background: 'var(--surface-2)',
          border: '1px solid var(--border-subtle)',
          color: 'var(--text-primary)',
        }}
      />

      {error && <p className="text-sm text-red-500 text-center">{error}</p>}

      <button
        onClick={onLaunch}
        disabled={loading || !canLaunch}
        className="w-full py-4 rounded-xl font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Building your store...
          </>
        ) : (
          <>
            Build My Store
            <ArrowRight className="w-5 h-5" />
          </>
        )}
      </button>
    </div>
  );
}
