'use client';

import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="relative pt-32 pb-16 sm:pt-40 sm:pb-20 overflow-hidden">
      {/* Background gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute top-40 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-8"
        >
          <Sparkles className="w-4 h-4" />
          AI-Powered Business Builder
        </motion.div>

        {/* Main headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6"
          style={{ color: 'var(--text-primary)' }}
        >
          From Idea to{' '}
          <span className="bg-gradient-to-r from-blue-400 via-emerald-400 to-blue-500 bg-clip-text text-transparent">
            Income
          </span>
          {' '}in Minutes
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg sm:text-xl max-w-2xl mx-auto mb-12"
          style={{ color: 'var(--text-secondary)' }}
        >
          Stop dreaming, start building. Launch a complete business with AI —
          brand, website, pricing, and customers. All in one place.
        </motion.p>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-wrap justify-center gap-8 sm:gap-12"
        >
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
              2,847
            </div>
            <div className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
              Businesses Launched
            </div>
          </div>
          <div className="hidden sm:block w-px h-12 bg-gray-700" />
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
              $1.2M+
            </div>
            <div className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
              Revenue Generated
            </div>
          </div>
          <div className="hidden sm:block w-px h-12 bg-gray-700" />
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
              &lt;5 min
            </div>
            <div className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
              Average Setup
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
