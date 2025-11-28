'use client';

import { Globe } from 'lucide-react';

interface WebsiteThumbnailProps {
  websiteUrl: string | null;
  businessName?: string;
  isLoading: boolean;
  onClick?: () => void;
}

export default function WebsiteThumbnail({
  websiteUrl,
  businessName,
  isLoading,
  onClick,
}: WebsiteThumbnailProps) {
  return (
    <div
      className={`h-full rounded-2xl border border-zinc-200 dark:border-slate-700 overflow-hidden cursor-pointer hover:shadow-lg transition-shadow ${
        isLoading ? 'animate-pulse' : ''
      }`}
      onClick={() => websiteUrl && onClick?.()}
    >
      {websiteUrl ? (
        <div className="h-full flex flex-col bg-white dark:bg-slate-800/50">
          {/* Mini browser chrome */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 dark:bg-slate-800 border-b border-zinc-200 dark:border-slate-700">
            <div className="flex gap-1">
              <div className="w-2 h-2 rounded-full bg-red-400" />
              <div className="w-2 h-2 rounded-full bg-yellow-400" />
              <div className="w-2 h-2 rounded-full bg-green-400" />
            </div>
            <div className="flex-1 mx-2">
              <div className="bg-white dark:bg-slate-700 rounded px-2 py-0.5 text-[10px] text-zinc-400 dark:text-slate-500 truncate">
                {businessName?.toLowerCase().replace(/\s+/g, '') || 'your-business'}.com
              </div>
            </div>
          </div>

          {/* Website preview - scaled down more */}
          <div className="flex-1 relative overflow-hidden">
            <iframe
              src={websiteUrl}
              className="w-full h-full border-0 scale-[0.15] origin-top-left pointer-events-none"
              style={{ width: '666%', height: '666%' }}
              sandbox="allow-same-origin"
              title="Website Preview"
            />
          </div>

          {/* Footer */}
          <div className="px-3 py-1.5 bg-zinc-50 dark:bg-slate-800/80 border-t border-zinc-200 dark:border-slate-700 text-center">
            <span className="text-[10px] text-zinc-400 dark:text-slate-500 font-medium">
              Click to edit
            </span>
          </div>
        </div>
      ) : (
        <div className="h-full flex flex-col items-center justify-center bg-zinc-50 dark:bg-slate-800/30 p-4">
          {isLoading ? (
            <>
              <Globe size={24} className="text-zinc-300 dark:text-slate-600 mb-2 animate-pulse" />
              <span className="text-xs text-zinc-400">Building...</span>
            </>
          ) : (
            <>
              <div className="w-full max-w-[80px] space-y-1 mb-2">
                <div className="h-0.5 bg-zinc-300 dark:bg-slate-700 rounded-full" style={{ width: '80%' }} />
                <div className="h-0.5 bg-zinc-300 dark:bg-slate-700 rounded-full" style={{ width: '60%' }} />
                <div className="h-0.5 bg-zinc-300 dark:bg-slate-700 rounded-full" style={{ width: '90%' }} />
              </div>
              <Globe size={20} className="text-zinc-300 dark:text-slate-700 mb-1" />
              <span className="text-[10px] uppercase tracking-widest font-medium text-zinc-400">Website</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
