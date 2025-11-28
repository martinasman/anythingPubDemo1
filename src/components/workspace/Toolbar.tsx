'use client';

import { Moon, Sun, Rocket, LayoutGrid, Sparkles, Users, Globe, DollarSign } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { useEffect, useState, useRef } from 'react';
import { useProjectStore, type WorkspaceView } from '@/store/projectStore';

const NAV_TABS = [
  { id: 'HOME' as const, label: 'Home', icon: LayoutGrid, shortcut: '1' },
  { id: 'BRAND' as const, label: 'Brand', icon: Sparkles, shortcut: '2' },
  { id: 'CRM' as const, label: 'Leads', icon: Users, shortcut: '3' },
  { id: 'SITE' as const, label: 'Site', icon: Globe, shortcut: '4' },
  { id: 'FINANCE' as const, label: 'Offer', icon: DollarSign, shortcut: '5' },
];

interface ToolbarProps {
  projectName?: string;
}

export default function Toolbar({ projectName = 'New Project' }: ToolbarProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { workspaceView, setWorkspaceView, hasStartedGeneration } = useProjectStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Map<WorkspaceView, HTMLButtonElement>>(new Map());
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Update sliding indicator position
  useEffect(() => {
    if (!hasStartedGeneration) return;
    const activeTab = tabRefs.current.get(workspaceView);
    if (activeTab && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const tabRect = activeTab.getBoundingClientRect();
      setIndicatorStyle({
        left: tabRect.left - containerRect.left,
        width: tabRect.width,
      });
    }
  }, [workspaceView, hasStartedGeneration, mounted]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!hasStartedGeneration) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const modifierKey = event.metaKey || event.ctrlKey;
      if (!modifierKey) return;

      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      const tab = NAV_TABS.find(t => t.shortcut === event.key);
      if (tab) {
        event.preventDefault();
        setWorkspaceView(tab.id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setWorkspaceView, hasStartedGeneration]);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
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
        </div>

        {/* Center Section - Navigation Tabs (only show after generation starts) */}
        {hasStartedGeneration && (
          <div
            ref={containerRef}
            className="relative flex items-center gap-0.5 p-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800"
          >
            {/* Sliding indicator */}
            <div
              className="absolute top-0.5 bottom-0.5 rounded-md bg-white dark:bg-zinc-700 shadow-sm transition-all duration-200 ease-out"
              style={{
                left: indicatorStyle.left,
                width: indicatorStyle.width,
              }}
            />

            {/* Tabs */}
            {NAV_TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = workspaceView === tab.id;

              return (
                <button
                  key={tab.id}
                  ref={el => {
                    if (el) tabRefs.current.set(tab.id, el);
                  }}
                  onClick={() => setWorkspaceView(tab.id)}
                  className={`relative z-10 flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-colors duration-150 ${
                    isActive
                      ? 'text-zinc-900 dark:text-zinc-100'
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
                  }`}
                  title={`${tab.label} (${navigator?.platform?.includes('Mac') ? '⌘' : 'Ctrl+'}${tab.shortcut})`}
                >
                  <Icon size={14} />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>
        )}

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
