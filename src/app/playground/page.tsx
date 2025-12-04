'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/home/Header';
import HeroInput from '@/components/home/HeroInput';
import { Footer } from '@/components/landing/Footer';

export default function PlaygroundPage() {
  const router = useRouter();

  return (
    <div
      className="min-h-screen flex flex-col transition-colors"
      style={{ background: 'var(--surface-1)' }}
    >
      <Header />

      <main className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-8">
            <h1
              className="text-2xl sm:text-3xl font-bold mb-3"
              style={{ color: 'var(--text-primary)' }}
            >
              Build anything
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              Describe what you want to create and let AI build it for you.
            </p>
          </div>

          <HeroInput />

          <p
            className="text-center mt-6 text-sm"
            style={{ color: 'var(--text-tertiary)' }}
          >
            Or try a{' '}
            <button
              onClick={() => router.push('/')}
              className="underline hover:no-underline"
              style={{ color: 'var(--accent)' }}
            >
              guided path
            </button>{' '}
            for agencies or e-commerce.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
