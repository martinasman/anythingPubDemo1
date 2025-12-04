'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { AGENCY_SUBTYPES, AGENCY_STEPS, type AgencySubType } from '@/config/businessModes';
import { useAuth } from '@/contexts/AuthContext';

type WizardStep = 'type' | 'details';

interface WizardData {
  agencyType: AgencySubType | null;
  description: string;
  targetMarket: string;
}

export function AgencyWizard() {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState<WizardStep>('type');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<WizardData>({
    agencyType: null,
    description: '',
    targetMarket: '',
  });

  const selectedType = AGENCY_SUBTYPES.find((t) => t.id === data.agencyType);

  async function handleLaunch() {
    if (!user) {
      // Store pending data and redirect to sign in
      sessionStorage.setItem(
        'pendingAgencyProject',
        JSON.stringify(data)
      );
      router.push('/signin?redirect=/agency');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'agency',
          agencyType: data.agencyType,
          description: data.description,
          targetMarket: data.targetMarket,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create project');
      }

      const { projectId } = await response.json();

      // Navigate to the workspace with prompt to auto-submit
      const prompt = data.description || selectedType?.examplePrompt || 'Build my agency';
      router.push(`/p/${projectId}?prompt=${encodeURIComponent(prompt)}`);
    } catch (err) {
      console.error('Failed to create agency:', err);
      setError(err instanceof Error ? err.message : 'Failed to create agency');
      setLoading(false);
    }
  }

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
          onClick={() => (step === 'type' ? router.push('/') : setStep('type'))}
          className="flex items-center gap-2 text-sm transition-colors"
          style={{ color: 'var(--text-secondary)' }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* Progress */}
        <div className="flex items-center gap-2">
          {AGENCY_STEPS.slice(0, 2).map((s, i) => (
            <div
              key={s.id}
              className="w-2 h-2 rounded-full transition-colors"
              style={{
                background:
                  (step === 'type' && i === 0) || (step === 'details' && i <= 1)
                    ? 'var(--accent)'
                    : 'var(--surface-3)',
              }}
            />
          ))}
        </div>

        {/* Spacer */}
        <div className="w-16" />
      </header>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <AnimatePresence mode="wait">
          {step === 'type' && (
            <motion.div
              key="type"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-2xl"
            >
              <div className="text-center mb-8">
                <h1
                  className="text-2xl sm:text-3xl font-bold mb-2"
                  style={{ color: 'var(--text-primary)' }}
                >
                  What type of agency?
                </h1>
                <p style={{ color: 'var(--text-secondary)' }}>
                  Pick a direction. You can always adjust later.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {AGENCY_SUBTYPES.map((type) => (
                  <AgencyTypeCard
                    key={type.id}
                    type={type}
                    selected={data.agencyType === type.id}
                    onSelect={() => {
                      setData({ ...data, agencyType: type.id });
                      // Auto-advance for non-custom
                      if (type.id !== 'custom') {
                        setTimeout(() => setStep('details'), 150);
                      }
                    }}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {step === 'details' && (
            <motion.div
              key="details"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-lg"
            >
              <div className="text-center mb-8">
                <h1
                  className="text-2xl sm:text-3xl font-bold mb-2"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Tell us more
                </h1>
                <p style={{ color: 'var(--text-secondary)' }}>
                  The more detail, the better we can build your business.
                </p>
              </div>

              <div className="space-y-6">
                {/* Description */}
                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Describe your agency vision
                  </label>
                  <textarea
                    value={data.description}
                    onChange={(e) =>
                      setData({ ...data, description: e.target.value })
                    }
                    placeholder={
                      selectedType?.examplePrompt || 'I want to help...'
                    }
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{
                      background: 'var(--surface-2)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>

                {/* Target market */}
                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Who are your ideal clients?
                  </label>
                  <input
                    type="text"
                    value={data.targetMarket}
                    onChange={(e) =>
                      setData({ ...data, targetMarket: e.target.value })
                    }
                    placeholder="e.g., Local restaurants, fitness coaches, real estate agents..."
                    className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{
                      background: 'var(--surface-2)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>

                {/* Error message */}
                {error && (
                  <p className="text-sm text-red-500 text-center">{error}</p>
                )}

                {/* Launch button */}
                <button
                  onClick={handleLaunch}
                  disabled={loading || (!data.description && !data.targetMarket)}
                  className="w-full py-4 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Building your agency...
                    </>
                  ) : (
                    <>
                      Build My Agency
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

interface AgencyTypeCardProps {
  type: (typeof AGENCY_SUBTYPES)[0];
  selected: boolean;
  onSelect: () => void;
}

function AgencyTypeCard({ type, selected, onSelect }: AgencyTypeCardProps) {
  const Icon = type.icon;

  return (
    <motion.button
      onClick={onSelect}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="p-6 rounded-xl text-left transition-all"
      style={{
        background: selected ? 'rgba(59, 130, 246, 0.1)' : 'var(--surface-2)',
        border: selected
          ? '2px solid rgb(59, 130, 246)'
          : '1px solid var(--border-subtle)',
      }}
    >
      <Icon
        className="w-8 h-8 mb-3"
        style={{ color: selected ? 'rgb(59, 130, 246)' : 'var(--text-secondary)' }}
      />
      <div
        className="font-semibold mb-1"
        style={{ color: 'var(--text-primary)' }}
      >
        {type.name}
      </div>
      <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
        {type.description}
      </div>
    </motion.button>
  );
}
