'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ArrowRight, Check } from 'lucide-react';
import { BUSINESS_MODES, type BusinessMode } from '@/config/businessModes';

export function ModeSelection() {
  const router = useRouter();

  return (
    <section className="py-16 sm:py-20">
      <div className="max-w-5xl mx-auto px-4">
        {/* Section header */}
        <div className="text-center mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-2xl sm:text-3xl font-bold mb-3"
            style={{ color: 'var(--text-primary)' }}
          >
            What do you want to build?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            style={{ color: 'var(--text-secondary)' }}
          >
            Choose your path. We&apos;ll handle the rest.
          </motion.p>
        </div>

        {/* Mode cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {Object.values(BUSINESS_MODES).map((mode, index) => (
            <motion.div
              key={mode.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <ModeCard
                mode={mode}
                onClick={() => router.push(`/${mode.id}`)}
              />
            </motion.div>
          ))}
        </div>

        {/* Advanced option */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center"
        >
          <button
            onClick={() => router.push('/playground')}
            className="text-sm transition-colors hover:underline"
            style={{ color: 'var(--text-tertiary)' }}
          >
            or start from scratch →
          </button>
        </motion.div>
      </div>
    </section>
  );
}

interface ModeCardProps {
  mode: BusinessMode;
  onClick: () => void;
}

function ModeCard({ mode, onClick }: ModeCardProps) {
  const Icon = mode.icon;

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="relative w-full p-6 sm:p-8 rounded-2xl text-left overflow-hidden group"
      style={{
        background: 'var(--surface-2)',
        border: '1px solid var(--border-subtle)',
      }}
    >
      {/* Gradient background on hover */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${mode.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
      />

      {/* Content */}
      <div className="relative">
        {/* Icon and title */}
        <div className="flex items-center gap-4 mb-4">
          <div
            className={`p-3 rounded-xl bg-gradient-to-br ${mode.gradient}`}
          >
            <Icon className="w-6 h-6 text-white" />
          </div>
          <span
            className="text-xs font-medium px-2 py-1 rounded-full"
            style={{
              background: 'var(--surface-3)',
              color: 'var(--text-tertiary)',
            }}
          >
            {mode.tagline}
          </span>
        </div>

        {/* Title and tagline */}
        <h3
          className="text-xl sm:text-2xl font-bold mb-2"
          style={{ color: 'var(--text-primary)' }}
        >
          {mode.name}
        </h3>
        <p
          className="text-sm mb-6"
          style={{ color: 'var(--text-secondary)' }}
        >
          {mode.description}
        </p>

        {/* Features list */}
        <ul className="space-y-2 mb-6">
          {mode.features.slice(0, 4).map((feature, i) => (
            <li
              key={i}
              className="flex items-center gap-2 text-sm"
              style={{ color: 'var(--text-secondary)' }}
            >
              <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              {feature}
            </li>
          ))}
        </ul>

        {/* CTA */}
        <div
          className={`inline-flex items-center gap-2 font-medium bg-gradient-to-r ${mode.gradient} bg-clip-text text-transparent`}
        >
          Get Started
          <ArrowRight className="w-4 h-4 text-blue-400 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </motion.button>
  );
}
