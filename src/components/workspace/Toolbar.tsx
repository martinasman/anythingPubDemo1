'use client';

import { Moon, Sun, Rocket, LayoutGrid, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { useProjectStore } from '@/store/projectStore';
import PublishModal from '@/components/publish/PublishModal';


interface ToolbarProps {
  projectName?: string;
}

export default function Toolbar({ projectName = 'New Project' }: ToolbarProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const { canvasState, setCanvasState } = useProjectStore();

  useEffect(() => {
    setMounted(true);
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
          {/* Logo */}
          <Link href="/" className="flex items-center">
            {mounted && (
              <Image
                src={theme === 'dark' ? '/anythingiconlight.png' : '/anythingicondark.png'}
                alt="Anything"
                width={20}
                height={20}
                className="transition-opacity duration-300"
              />
            )}
            {!mounted && <div className="w-5 h-5" />}
          </Link>

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
    </div>
  );
}
