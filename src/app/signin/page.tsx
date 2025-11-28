'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { Loader2 } from 'lucide-react';

function SignInContent() {
  const { user, isLoading, signInWithGoogle } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { resolvedTheme } = useTheme();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [mounted, setMounted] = useState(false);

  const redirect = searchParams.get('redirect') ?? '/';
  const error = searchParams.get('error');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isLoading && user) {
      router.push(redirect);
    }
  }, [user, isLoading, router, redirect]);

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setIsSigningIn(false);
    }
  };

  if (isLoading || !mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-0">
        <Loader2 className="w-8 h-8 animate-spin text-text-tertiary" />
      </div>
    );
  }

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-0">
        <Loader2 className="w-8 h-8 animate-spin text-text-tertiary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface-0 px-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="flex justify-center">
          <Image
            src={resolvedTheme === 'dark' ? '/logo-dark.svg' : '/logo-light.svg'}
            alt="Anything"
            width={140}
            height={40}
            priority
          />
        </div>

        {/* Heading */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-semibold text-text-primary">
            Welcome back
          </h1>
          <p className="text-text-secondary">
            Sign in to continue to Anything
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg p-3 text-center">
            <p className="text-sm text-red-600 dark:text-red-400">
              {error === 'auth_failed'
                ? 'Authentication failed. Please try again.'
                : 'An error occurred. Please try again.'}
            </p>
          </div>
        )}

        {/* Google Sign-In Button */}
        <button
          onClick={handleGoogleSignIn}
          disabled={isSigningIn}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-surface-2 hover:bg-surface-3 border border-zinc-200 dark:border-slate-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSigningIn ? (
            <Loader2 className="w-5 h-5 animate-spin text-text-tertiary" />
          ) : (
            <>
              {/* Google Logo */}
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span className="text-text-primary font-medium">
                Continue with Google
              </span>
            </>
          )}
        </button>

        {/* Footer */}
        <p className="text-center text-xs text-text-tertiary">
          By continuing, you agree to our{' '}
          <a href="/terms" className="underline hover:text-text-secondary">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="/privacy" className="underline hover:text-text-secondary">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-surface-0">
          <Loader2 className="w-8 h-8 animate-spin text-text-tertiary" />
        </div>
      }
    >
      <SignInContent />
    </Suspense>
  );
}
