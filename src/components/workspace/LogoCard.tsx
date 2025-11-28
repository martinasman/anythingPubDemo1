'use client';

import { Sparkles } from 'lucide-react';

interface LogoCardProps {
  identity: {
    logoUrl: string;
    name: string;
    colors: {
      primary: string;
      secondary: string;
      accent: string;
    };
  } | null;
  isLoading: boolean;
  onClick?: () => void;
}

export default function LogoCard({ identity, isLoading, onClick }: LogoCardProps) {
  if (!identity) {
    return (
      <div className="w-[120px] h-[120px] rounded-2xl border-2 border-dashed border-zinc-200 dark:border-slate-700 flex flex-col items-center justify-center bg-zinc-50/50 dark:bg-slate-800/30">
        {isLoading ? (
          <>
            <div className="w-12 h-12 rounded-xl bg-zinc-200 dark:bg-slate-700 animate-pulse mb-2" />
            <div className="w-16 h-3 bg-zinc-200 dark:bg-slate-700 rounded animate-pulse" />
          </>
        ) : (
          <>
            <div className="w-12 h-12 rounded-xl border-2 border-dashed border-zinc-300 dark:border-slate-600 flex items-center justify-center mb-2">
              <Sparkles size={20} className="text-zinc-300 dark:text-slate-600" />
            </div>
            <span className="text-[10px] uppercase tracking-widest font-medium text-zinc-400">Brand</span>
          </>
        )}
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className="w-[120px] h-[120px] rounded-2xl bg-white dark:bg-slate-800/50 border border-zinc-200 dark:border-slate-700 flex flex-col items-center justify-center p-3 cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all"
    >
      {/* Logo */}
      <div className="w-12 h-12 rounded-xl overflow-hidden bg-white dark:bg-slate-900 border border-zinc-100 dark:border-slate-700 flex items-center justify-center mb-2 shadow-sm">
        <img
          src={identity.logoUrl}
          alt={identity.name}
          className="w-full h-full object-contain p-1"
        />
      </div>

      {/* Name */}
      <h3 className="text-xs font-bold text-zinc-900 dark:text-white text-center truncate w-full mb-1">
        {identity.name}
      </h3>

      {/* Color dots */}
      <div className="flex gap-1">
        <div
          className="w-3 h-3 rounded-full border border-white dark:border-slate-700 shadow-sm"
          style={{ backgroundColor: identity.colors.primary }}
        />
        <div
          className="w-3 h-3 rounded-full border border-white dark:border-slate-700 shadow-sm"
          style={{ backgroundColor: identity.colors.secondary }}
        />
        <div
          className="w-3 h-3 rounded-full border border-white dark:border-slate-700 shadow-sm"
          style={{ backgroundColor: identity.colors.accent }}
        />
      </div>
    </div>
  );
}
