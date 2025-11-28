'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useTheme } from 'next-themes';

const LOADING_MESSAGES = [
  'Analyzing your idea...',
  'Researching competitors...',
  'Generating brand identity...',
  'Building your website...',
  'Almost there...',
];

export default function LoadingScreen() {
  const { theme } = useTheme();
  const [progress, setProgress] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);
  const [mounted, setMounted] = useState(false);

  // Handle theme mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  // Animate progress bar
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev; // Cap at 90% until actual completion
        return prev + Math.random() * 10;
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  // Rotate loading messages
  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Prevent flash of wrong logo
  if (!mounted) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-white dark:bg-slate-950">
        <div className="w-8 h-8 border-4 border-zinc-200 dark:border-slate-800 border-t-zinc-900 dark:border-t-zinc-100 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-white dark:bg-slate-950 transition-colors">
      {/* Logo */}
      <div className="mb-12 animate-pulse">
        <Image
          src={theme === 'dark' ? '/logolight.png' : '/logodark.png'}
          alt="Anything Logo"
          width={180}
          height={54}
          priority
        />
      </div>

      {/* Loading Bar Container */}
      <div className="w-full max-w-md px-8">
        {/* Progress Bar */}
        <div className="relative h-2 bg-zinc-100 dark:bg-slate-900 rounded-full overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-black dark:bg-white transition-all duration-500 ease-out rounded-full"
            style={{ width: `${progress}%` }}
          >
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-black/20 to-transparent animate-shimmer" />
          </div>
        </div>

        {/* Loading Message */}
        <div className="mt-6 text-center">
          <p className="text-sm text-zinc-600 dark:text-slate-400 animate-fade-in">
            {LOADING_MESSAGES[messageIndex]}
          </p>
        </div>

        {/* Progress Percentage */}
        <div className="mt-2 text-center">
          <span className="text-xs text-zinc-400 dark:text-slate-600 font-mono">
            {Math.round(progress)}%
          </span>
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-shimmer {
          animation: shimmer 2s infinite;
        }

        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}
