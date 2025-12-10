'use client';

import { Moon, Sun, Menu, X, LogOut, ChevronDown, Coins, Home, Settings, Palette, HelpCircle, Gift } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCredits } from '@/hooks/useCredits';
import { PlansCreditsOverlay } from '@/components/credits/PlansCreditsOverlay';

export default function Header() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const { user, isLoading: authLoading, signOut } = useAuth();
  const { credits, isLoading: creditsLoading } = useCredits();
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logoMenuOpen, setLogoMenuOpen] = useState(false);
  const [creditsOverlayOpen, setCreditsOverlayOpen] = useState(false);
  const logoMenuRef = useRef<HTMLDivElement>(null);

  const totalCredits = 50; // Free tier allocation
  const currentCredits = credits ?? 0;
  const percentRemaining = Math.min(100, (currentCredits / totalCredits) * 100);

  useEffect(() => {
    setMounted(true);

    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (logoMenuRef.current && !logoMenuRef.current.contains(event.target as Node)) {
        setLogoMenuOpen(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const headerClasses = `fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
    scrolled
      ? 'py-2 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-xl border-b border-zinc-200/50 dark:border-neutral-800/50'
      : 'py-3 bg-transparent'
  }`;

  // Hydration-safe render
  if (!mounted) {
    return (
      <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="w-24 h-8" />
          <div className="flex items-center gap-4">
            <div className="w-8 h-8" />
          </div>
        </div>
      </header>
    );
  }

  return (
    <>
      <header className={headerClasses}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* Logo with dropdown */}
          <div className="relative" ref={logoMenuRef}>
            <button
              onClick={() => setLogoMenuOpen(!logoMenuOpen)}
              className="flex items-center gap-2 p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <Image
                src={resolvedTheme === 'dark' ? '/logolight.png' : '/logodark.png'}
                alt="Anything"
                width={100}
                height={28}
                priority
              />
              <ChevronDown size={14} className={`text-zinc-500 transition-transform ${logoMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Logo dropdown menu */}
            {logoMenuOpen && (
              <div className="absolute left-0 mt-2 w-72 bg-white dark:bg-neutral-900 rounded-xl shadow-xl border border-zinc-200 dark:border-neutral-800 overflow-hidden z-50">
                {/* User info section (if logged in) */}
                {user && (
                  <div className="px-4 py-3 border-b border-zinc-100 dark:border-neutral-800">
                    <div className="flex items-center gap-3">
                      {user.user_metadata?.avatar_url ? (
                        <Image
                          src={user.user_metadata.avatar_url}
                          alt="Avatar"
                          width={36}
                          height={36}
                          className="rounded-full"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-zinc-300 dark:bg-neutral-600 flex items-center justify-center text-sm font-medium text-zinc-700 dark:text-neutral-300">
                          {user.email?.[0]?.toUpperCase() || 'U'}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">
                          {user.user_metadata?.full_name || 'User'}
                        </p>
                        <p className="text-xs text-zinc-500 truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Menu items */}
                <div className="py-1">
                  <Link
                    href="/"
                    onClick={() => setLogoMenuOpen(false)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 dark:text-neutral-300 hover:bg-zinc-100 dark:hover:bg-neutral-800 transition-colors"
                  >
                    <Home size={16} className="text-zinc-500 dark:text-neutral-500" />
                    Go to Dashboard
                  </Link>

                  {/* Credits item with balance */}
                  {user && (
                    <button
                      onClick={() => {
                        setLogoMenuOpen(false);
                        setCreditsOverlayOpen(true);
                      }}
                      className="w-full px-4 py-3 hover:bg-zinc-100 dark:hover:bg-neutral-800 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <Coins size={16} className="text-zinc-500 dark:text-neutral-500" />
                          <span className="text-sm text-zinc-700 dark:text-neutral-300">Credits</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-medium text-zinc-900 dark:text-white">
                            {creditsLoading ? '...' : currentCredits}
                          </span>
                          <span className="text-xs text-zinc-500">left</span>
                          <ChevronDown size={14} className="text-zinc-400 -rotate-90" />
                        </div>
                      </div>
                      {/* Progress bar */}
                      <div className="h-1.5 bg-zinc-200 dark:bg-neutral-700 rounded-full overflow-hidden mb-1.5">
                        <div
                          className="h-full bg-gradient-to-r from-orange-500 to-blue-500 transition-all duration-300"
                          style={{ width: `${percentRemaining}%` }}
                        />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        <span className="text-[10px] text-zinc-500">Daily credits used first</span>
                      </div>
                    </button>
                  )}

                  <div className="my-1 border-t border-zinc-100 dark:border-neutral-800" />

                  {user && (
                    <button
                      onClick={() => setLogoMenuOpen(false)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 dark:text-neutral-300 hover:bg-zinc-100 dark:hover:bg-neutral-800 transition-colors"
                    >
                      <Gift size={16} className="text-zinc-500 dark:text-neutral-500" />
                      Get free credits
                    </button>
                  )}

                  <button
                    onClick={() => setLogoMenuOpen(false)}
                    className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-zinc-700 dark:text-neutral-300 hover:bg-zinc-100 dark:hover:bg-neutral-800 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Settings size={16} className="text-zinc-500 dark:text-neutral-500" />
                      Settings
                    </div>
                    <span className="text-xs text-zinc-400">Ctrl</span>
                  </button>

                  <button
                    onClick={() => {
                      toggleTheme();
                      setLogoMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 dark:text-neutral-300 hover:bg-zinc-100 dark:hover:bg-neutral-800 transition-colors"
                  >
                    <Palette size={16} className="text-zinc-500 dark:text-neutral-500" />
                    Appearance
                  </button>

                  <button
                    onClick={() => setLogoMenuOpen(false)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 dark:text-neutral-300 hover:bg-zinc-100 dark:hover:bg-neutral-800 transition-colors"
                  >
                    <HelpCircle size={16} className="text-zinc-500 dark:text-neutral-500" />
                    Help
                  </button>

                  {user && (
                    <>
                      <div className="my-1 border-t border-zinc-100 dark:border-neutral-800" />
                      <button
                        onClick={() => {
                          signOut();
                          setLogoMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 dark:text-neutral-300 hover:bg-zinc-100 dark:hover:bg-neutral-800 transition-colors"
                      >
                        <LogOut size={16} className="text-zinc-500 dark:text-neutral-500" />
                        Sign out
                      </button>
                    </>
                  )}

                  {!user && !authLoading && (
                    <>
                      <div className="my-1 border-t border-zinc-100 dark:border-neutral-800" />
                      <Link
                        href="/signin"
                        onClick={() => setLogoMenuOpen(false)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 dark:text-neutral-300 hover:bg-zinc-100 dark:hover:bg-neutral-800 transition-colors"
                      >
                        Sign in
                      </Link>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-4">
            {/* Theme toggle (standalone for quick access) */}
            <button
              onClick={toggleTheme}
              className="hidden md:flex w-9 h-9 items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-800 transition-colors"
              aria-label="Toggle theme"
            >
              {resolvedTheme === 'dark' ? (
                <Sun size={18} strokeWidth={1.5} />
              ) : (
                <Moon size={18} strokeWidth={1.5} />
              )}
            </button>

            {/* Auth buttons (desktop) - simplified */}
            <div className="hidden md:flex items-center gap-3">
              {authLoading ? (
                <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-neutral-700 animate-pulse" />
              ) : !user ? (
                <>
                  <Link
                    href="/signin"
                    className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-neutral-400 dark:hover:text-white transition-colors"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/signin"
                    className="text-sm font-medium bg-zinc-900 text-white px-4 py-2 rounded-lg hover:bg-zinc-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 transition-colors"
                  >
                    Get started
                  </Link>
                </>
              ) : (
                /* Small avatar indicator when logged in */
                <div className="relative">
                  {user.user_metadata?.avatar_url ? (
                    <Image
                      src={user.user_metadata.avatar_url}
                      alt="Avatar"
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-zinc-300 dark:bg-neutral-600 flex items-center justify-center text-sm font-medium text-zinc-700 dark:text-neutral-300">
                      {user.email?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                  {/* Credit badge overlay */}
                  {!creditsLoading && credits !== null && (
                    <div
                      className={`absolute -bottom-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-white dark:border-neutral-950 ${
                        credits > 20
                          ? 'bg-green-500'
                          : credits > 5
                          ? 'bg-amber-500'
                          : 'bg-red-500'
                      }`}
                    >
                      {credits > 99 ? '99+' : credits}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-800 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X size={20} strokeWidth={1.5} />
              ) : (
                <Menu size={20} strokeWidth={1.5} />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-neutral-900/20 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="absolute top-16 left-4 right-4 bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-neutral-800 p-6">
            <div className="flex flex-col gap-3">
              {user ? (
                <>
                  {/* User info */}
                  <div className="flex items-center gap-3 px-2 py-2">
                    <div className="relative">
                      {user.user_metadata?.avatar_url ? (
                        <Image
                          src={user.user_metadata.avatar_url}
                          alt="Avatar"
                          width={40}
                          height={40}
                          className="rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-zinc-300 dark:bg-neutral-600 flex items-center justify-center text-sm font-medium text-zinc-700 dark:text-neutral-300">
                          {user.email?.[0]?.toUpperCase() || 'U'}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">
                        {user.user_metadata?.full_name || 'User'}
                      </p>
                      <p className="text-xs text-zinc-500 truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>

                  {/* Credits section */}
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setCreditsOverlayOpen(true);
                    }}
                    className="px-2 py-3 bg-zinc-50 dark:bg-neutral-800 rounded-lg text-left"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Coins size={18} className="text-amber-500" />
                        <span className="text-sm font-medium text-zinc-900 dark:text-white">
                          Credits
                        </span>
                      </div>
                      <span className="text-sm text-zinc-600 dark:text-zinc-400">
                        {creditsLoading ? '...' : credits ?? 0} left
                      </span>
                    </div>
                    <div className="h-1.5 bg-zinc-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-orange-500 to-blue-500"
                        style={{ width: `${percentRemaining}%` }}
                      />
                    </div>
                  </button>

                  <button
                    onClick={toggleTheme}
                    className="flex items-center gap-2 px-2 py-2.5 text-sm text-zinc-700 dark:text-neutral-300"
                  >
                    <Palette size={16} />
                    Appearance
                  </button>

                  <button
                    onClick={() => {
                      signOut();
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center justify-center gap-2 text-sm font-medium text-zinc-600 dark:text-neutral-400 py-3 hover:bg-zinc-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                  >
                    <LogOut size={16} />
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/signin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-center text-sm font-medium text-zinc-600 dark:text-neutral-400 py-2"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/signin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-center text-sm font-medium bg-zinc-900 text-white dark:bg-white dark:text-neutral-900 px-4 py-3 rounded-lg"
                  >
                    Get started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Credits Overlay */}
      <PlansCreditsOverlay
        isOpen={creditsOverlayOpen}
        onClose={() => setCreditsOverlayOpen(false)}
      />
    </>
  );
}
