'use client';

import { Moon, Sun, Rocket, LayoutGrid, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { useProjectStore } from '@/store/projectStore';


interface ToolbarProps {
  projectName?: string;
}

export default function Toolbar({ projectName = 'New Project' }: ToolbarProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
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
        case 'offer':
          return 'Pricing';
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

        {/* Right Section - Theme & Publish */}
        <div className="flex items-center gap-1.5">
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
            className="flex items-center gap-1.5 px-3 h-7 text-xs font-medium text-white bg-zinc-900 dark:bg-white dark:text-zinc-900 rounded-md hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
            aria-label="Publish"
          >
            <Rocket size={12} />
            <span>Publish</span>
          </button>
        </div>
      </div>
    </div>
  );
}
