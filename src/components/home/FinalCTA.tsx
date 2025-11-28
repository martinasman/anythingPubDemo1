'use client';

import Link from 'next/link';
import Container from '../ui/Container';

export default function FinalCTA() {
  return (
    <section className="py-20 sm:py-28 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 dark:from-zinc-100 dark:via-white dark:to-zinc-100">
      <Container size="md" className="text-center">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white dark:text-slate-900 mb-6">
          Ready to Build Something{' '}
          <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
            Amazing
          </span>
          ?
        </h2>

        <p className="text-lg text-zinc-300 dark:text-slate-600 mb-8 max-w-xl mx-auto">
          Join thousands of entrepreneurs who've launched their business ideas with AI.
          Start with 50 free credits today.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-zinc-900 dark:text-white bg-white dark:bg-slate-900 rounded-xl hover:bg-zinc-100 dark:hover:bg-slate-800 transition-colors"
          >
            Get Started Free
          </Link>
          <Link
            href="#how-it-works"
            className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white dark:text-slate-900 border-2 border-white/30 dark:border-slate-300 rounded-xl hover:bg-white/10 dark:hover:bg-slate-200/50 transition-colors"
          >
            See How It Works
          </Link>
        </div>

        <p className="mt-6 text-sm text-zinc-400 dark:text-slate-500">
          No credit card required • Cancel anytime
        </p>
      </Container>
    </section>
  );
}
