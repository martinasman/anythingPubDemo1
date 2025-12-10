'use client';

import { Moon, Sun, Rocket, LayoutGrid, ChevronRight, ChevronDown, Home, Coins, Gift, Settings, Palette, HelpCircle, LogOut } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { useEffect, useState, useRef } from 'react';
import { useProjectStore } from '@/store/projectStore';
import PublishModal from '@/components/publish/PublishModal';
import { useAuth } from '@/contexts/AuthContext';
import { useCredits } from '@/hooks/useCredits';
import { PlansCreditsOverlay } from '@/components/credits/PlansCreditsOverlay';


interface ToolbarProps {
  projectName?: string;
}

export default function Toolbar({ projectName = 'New Project' }: ToolbarProps) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [logoMenuOpen, setLogoMenuOpen] = useState(false);
  const [creditsOverlayOpen, setCreditsOverlayOpen] = useState(false);
  const logoMenuRef = useRef<HTMLDivElement>(null);
  const { canvasState, setCanvasState } = useProjectStore();
  const { user, signOut } = useAuth();
  const { credits, isLoading: creditsLoading } = useCredits();

  const totalCredits = 50;
  const currentCredits = credits ?? 0;
  const percentRemaining = Math.min(100, (currentCredits / totalCredits) * 100);

  useEffect(() => {
    setMounted(true);

    const handleClickOutside = (event: MouseEvent) => {
      if (logoMenuRef.current && !logoMenuRef.current.contains(event.target as Node)) {
        setLogoMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const handleBackToOverview = () => {
    setCanvasState({ type: 'overview' });
  };

  const getViewLabel = (state: typeof canvasState) => {
    if (state.type === 'detail') {
      switch (state.view) {
        case 'website':
          return 'Website';
        case 'brand':
          return 'Brand Identity';
        case 'plan':
          return 'First Week Plan';
        case 'leads':
          return 'Prospects';
        case 'clients':
          return 'Clients';
        default:
          return 'Detail';
      }
    }
    if (state.type === 'lead-detail') {
      return 'Lead Details';
    }
    return '';
  };

  return (
    <div className="z-50 h-10" style={{ background: 'var(--surface-1)' }}>
      <div className="flex items-center justify-between h-full px-4">
        {/* Left Section - Logo & Project */}
        <div className="flex items-center gap-3">
          {/* Logo with dropdown */}
          <div className="relative" ref={logoMenuRef}>
            <button
              onClick={() => setLogoMenuOpen(!logoMenuOpen)}
              className="flex items-center gap-1 p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              {mounted && (
                <Image
                  src={resolvedTheme === 'dark' ? '/anythingiconlight.png' : '/anythingicondark.png'}
                  alt="Anything"
                  width={20}
                  height={20}
                  className="transition-opacity duration-300"
                />
              )}
              {!mounted && <div className="w-5 h-5" />}
              <ChevronDown size={12} className={`text-zinc-500 transition-transform ${logoMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Logo dropdown menu */}
            {logoMenuOpen && (
              <div className="absolute left-0 mt-2 w-72 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden z-50">
                {/* User info section */}
                {user && (
                  <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
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
                        <div className="w-9 h-9 rounded-full bg-zinc-300 dark:bg-zinc-600 flex items-center justify-center text-sm font-medium text-zinc-700 dark:text-zinc-300">
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
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <Home size={16} className="text-zinc-500" />
                    Go to Dashboard
                  </Link>

                  {/* Credits item with balance */}
                  {user && (
                    <button
                      onClick={() => {
                        setLogoMenuOpen(false);
                        setCreditsOverlayOpen(true);
                      }}
                      className="w-full px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <Coins size={16} className="text-zinc-500" />
                          <span className="text-sm text-zinc-700 dark:text-zinc-300">Credits</span>
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
                      <div className="h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden mb-1.5">
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

                  <div className="my-1 border-t border-zinc-100 dark:border-zinc-800" />

                  {user && (
                    <button
                      onClick={() => setLogoMenuOpen(false)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <Gift size={16} className="text-zinc-500" />
                      Get free credits
                    </button>
                  )}

                  <button
                    onClick={() => setLogoMenuOpen(false)}
                    className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Settings size={16} className="text-zinc-500" />
                      Settings
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      toggleTheme();
                      setLogoMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <Palette size={16} className="text-zinc-500" />
                    Appearance
                  </button>

                  <button
                    onClick={() => setLogoMenuOpen(false)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <HelpCircle size={16} className="text-zinc-500" />
                    Help
                  </button>

                  {user && (
                    <>
                      <div className="my-1 border-t border-zinc-100 dark:border-zinc-800" />
                      <button
                        onClick={() => {
                          signOut();
                          setLogoMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                      >
                        <LogOut size={16} className="text-zinc-500" />
                        Sign out
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-700" />

          {/* Project Name */}
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {projectName}
          </span>

          {/* Divider */}
          <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-700" />

          {/* Permanent Overview Button with Breadcrumbs */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleBackToOverview}
              className={`flex items-center gap-1.5 px-3 h-7 text-xs font-medium rounded-md transition-colors ${
                canvasState.type === 'overview'
                  ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
              aria-label="Go to Overview"
            >
              <LayoutGrid size={14} strokeWidth={2} />
              <span>Overview</span>
            </button>

            {/* Breadcrumb separator + current view label */}
            {canvasState.type !== 'overview' && canvasState.type !== 'empty' && (
              <>
                <ChevronRight size={14} className="text-zinc-300 dark:text-zinc-600" />
                <span className="text-xs text-zinc-600 dark:text-zinc-400">
                  {getViewLabel(canvasState)}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Center Section - Empty (spacer) */}
        <div className="flex-1" />

        {/* Right Section - Integrations, Theme & Publish */}
        <div className="flex items-center gap-1.5">
          {/* Integration Status Icons */}
          <div className="flex items-center gap-0.5">
            {/* Supabase */}
            <div
              className="flex items-center justify-center w-7 h-7 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer opacity-60 hover:opacity-100"
              title="Supabase - Connected"
            >
              <svg width="14" height="14" viewBox="0 0 109 113" fill="none">
                <path d="M63.7076 110.284C60.8481 113.885 55.0502 111.912 54.9813 107.314L53.9738 40.0627L99.1935 40.0627C107.384 40.0627 111.952 49.5228 106.859 55.9374L63.7076 110.284Z" fill="url(#supabase_paint0)"/>
                <path d="M63.7076 110.284C60.8481 113.885 55.0502 111.912 54.9813 107.314L53.9738 40.0627L99.1935 40.0627C107.384 40.0627 111.952 49.5228 106.859 55.9374L63.7076 110.284Z" fill="url(#supabase_paint1)" fillOpacity="0.2"/>
                <path d="M45.317 2.07103C48.1765 -1.53037 53.9745 0.442937 54.0434 5.041L54.4849 72.2922H9.83113C1.64038 72.2922 -2.92775 62.8321 2.1655 56.4175L45.317 2.07103Z" fill="#3ECF8E"/>
                <defs>
                  <linearGradient id="supabase_paint0" x1="53.9738" y1="54.974" x2="94.1635" y2="71.8295" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#249361"/>
                    <stop offset="1" stopColor="#3ECF8E"/>
                  </linearGradient>
                  <linearGradient id="supabase_paint1" x1="36.1558" y1="30.578" x2="54.4844" y2="65.0806" gradientUnits="userSpaceOnUse">
                    <stop/>
                    <stop offset="1" stopOpacity="0"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* Stripe */}
            <div
              className="flex items-center justify-center w-7 h-7 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer opacity-60 hover:opacity-100"
              title="Stripe - Connected"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#635BFF">
                <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z"/>
              </svg>
            </div>
          </div>

          {/* Divider */}
          <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-700" />

          {/* Theme Toggle */}
          {mounted && (
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center w-7 h-7 text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun size={14} strokeWidth={1.5} />
              ) : (
                <Moon size={14} strokeWidth={1.5} />
              )}
            </button>
          )}

          {/* Publish Button */}
          <button
            onClick={() => setShowPublishModal(true)}
            className="flex items-center gap-1.5 px-3 h-7 text-xs font-medium text-white bg-zinc-900 dark:bg-white dark:text-zinc-900 rounded-md hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
            aria-label="Publish"
          >
            <Rocket size={12} />
            <span>Publish</span>
          </button>
        </div>
      </div>

      {/* Publish Modal */}
      <PublishModal
        isOpen={showPublishModal}
        onClose={() => setShowPublishModal(false)}
        sourceType="project"
      />

      {/* Credits Overlay */}
      <PlansCreditsOverlay
        isOpen={creditsOverlayOpen}
        onClose={() => setCreditsOverlayOpen(false)}
      />
    </div>
  );
}
