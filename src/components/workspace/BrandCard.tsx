'use client';

import { Sparkles } from 'lucide-react';
import type { IdentityArtifact } from '@/types/database';

interface BrandCardProps {
  identity: IdentityArtifact | null;
  isLoading: boolean;
  onClick?: () => void;
}

export default function BrandCard({ identity, isLoading, onClick }: BrandCardProps) {
  // Loading state
  if (isLoading && !identity) {
    return (
      <div className="h-full rounded-2xl bg-white dark:bg-slate-800/50 border border-zinc-200 dark:border-slate-700 p-4 animate-pulse">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-xl bg-zinc-200 dark:bg-slate-700" />
          <div className="flex-1">
            <div className="w-24 h-4 bg-zinc-200 dark:bg-slate-700 rounded mb-1.5" />
            <div className="w-32 h-3 bg-zinc-200 dark:bg-slate-700 rounded" />
          </div>
        </div>
        <div className="flex gap-2 mb-3">
          <div className="w-8 h-8 bg-zinc-200 dark:bg-slate-700 rounded" />
          <div className="w-8 h-8 bg-zinc-200 dark:bg-slate-700 rounded" />
          <div className="w-8 h-8 bg-zinc-200 dark:bg-slate-700 rounded" />
        </div>
      </div>
    );
  }

  // Empty state
  if (!identity) {
    return (
      <div className="h-full rounded-2xl border-2 border-dashed border-zinc-200 dark:border-slate-700 flex flex-col items-center justify-center p-4 bg-zinc-50/50 dark:bg-slate-800/30">
        <div className="w-12 h-12 rounded-xl border-2 border-dashed border-zinc-300 dark:border-slate-600 flex items-center justify-center mb-2">
          <Sparkles size={20} className="text-zinc-300 dark:text-slate-600" />
        </div>
        <span className="text-xs uppercase tracking-widest font-medium text-zinc-400 mb-1">Brand</span>
        <p className="text-[10px] text-zinc-400 dark:text-slate-500 text-center">
          Your brand identity will appear here
        </p>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className="h-full rounded-2xl bg-white dark:bg-slate-800/50 border border-zinc-200 dark:border-slate-700 p-3 cursor-pointer hover:shadow-lg transition-shadow overflow-hidden flex flex-col"
    >
      {/* Header: Logo + Name + Colors in single row */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 rounded-xl overflow-hidden bg-white dark:bg-slate-900 border border-zinc-100 dark:border-slate-700 flex items-center justify-center shadow-sm flex-shrink-0">
          <img
            src={identity.logoUrl}
            alt={identity.name}
            className="w-full h-full object-contain p-1"
          />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-white truncate">
            {identity.name}
          </h3>
          <p className="text-[10px] text-zinc-500 dark:text-slate-400 line-clamp-1">
            {identity.tagline}
          </p>
        </div>
        {/* Color Palette - compact */}
        <div className="flex gap-1 flex-shrink-0">
          <div
            className="w-5 h-5 rounded shadow-sm border border-white/20"
            style={{ backgroundColor: identity.colors.primary }}
          />
          <div
            className="w-5 h-5 rounded shadow-sm border border-white/20"
            style={{ backgroundColor: identity.colors.secondary }}
          />
          <div
            className="w-5 h-5 rounded shadow-sm border border-white/20"
            style={{ backgroundColor: identity.colors.accent }}
          />
        </div>
      </div>

    </div>
  );
}
