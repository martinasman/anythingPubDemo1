'use client';

import { useState, useEffect } from 'react';
import { FileCode, Check, Loader2 } from 'lucide-react';

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface CodeChange {
  file: string;
  description: string;
  before?: string;
  after?: string;
  timestamp: number;
  status: 'pending' | 'complete';
}

interface CodeChangeViewerProps {
  changes: CodeChange[];
  isStreaming: boolean;
}

// ============================================
// HELPER: GROUP CHANGES BY FILE
// ============================================

function groupChangesByFile(changes: CodeChange[]): Record<string, CodeChange[]> {
  return changes.reduce((acc, change) => {
    if (!acc[change.file]) {
      acc[change.file] = [];
    }
    acc[change.file].push(change);
    return acc;
  }, {} as Record<string, CodeChange[]>);
}

// ============================================
// HELPER: GET FILE ICON COLOR
// ============================================

function getFileColor(filename: string): string {
  // Monochrome colors for all file types
  return 'text-zinc-500 dark:text-zinc-400';
}

// ============================================
// CODE CHANGE VIEWER COMPONENT
// ============================================

export function CodeChangeViewer({ changes, isStreaming }: CodeChangeViewerProps) {
  const [isOpen, setIsOpen] = useState(true);

  // Auto-collapse when all changes complete and streaming stops
  useEffect(() => {
    const allComplete = changes.length > 0 && changes.every(c => c.status === 'complete');
    if (allComplete && !isStreaming) {
      const timer = setTimeout(() => {
        setIsOpen(false);
      }, 3000); // Stay open 3 seconds after completion
      return () => clearTimeout(timer);
    }
  }, [changes, isStreaming]);

  // Keep open while streaming
  useEffect(() => {
    if (isStreaming) {
      setIsOpen(true);
    }
  }, [isStreaming]);

  if (changes.length === 0) return null;

  const groupedChanges = groupChangesByFile(changes);
  const fileCount = Object.keys(groupedChanges).length;
  const totalChanges = changes.length;
  const completedChanges = changes.filter(c => c.status === 'complete').length;

  return (
    <div className="mb-4 rounded-xl bg-zinc-50 dark:bg-[#1a1a1a] overflow-hidden border border-zinc-200 dark:border-zinc-700 shadow-sm">
      {/* Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
      >
        <span className="flex items-center gap-2.5">
          <FileCode className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
          <span>
            Code Changes: {completedChanges}/{totalChanges} • {fileCount} file{fileCount > 1 ? 's' : ''}
          </span>
        </span>
      </button>

      {/* Content - collapsible */}
      {isOpen && (
        <div className="px-4 pb-4 pt-2 space-y-3">
          {Object.entries(groupedChanges).map(([file, fileChanges]) => (
            <div key={file} className="space-y-1.5">
              {/* File header */}
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                <FileCode className={`h-3.5 w-3.5 ${getFileColor(file)}`} />
                <span>{file}</span>
              </div>

              {/* Changes for this file */}
              <div className="pl-5 space-y-1.5">
                {fileChanges.map((change, idx) => (
                  <div
                    key={`${change.file}-${idx}`}
                    className={`flex items-start gap-2.5 text-xs py-1.5 px-2.5 rounded-lg transition-all ${
                      change.status === 'complete'
                        ? 'bg-zinc-100 dark:bg-zinc-800 border-l-2 border-zinc-400 dark:border-zinc-500'
                        : 'bg-zinc-100 dark:bg-zinc-800 border-l-2 border-zinc-300 dark:border-zinc-600 animate-pulse'
                    }`}
                  >
                    {change.status === 'complete' ? (
                      <Check className="h-3 w-3 text-zinc-600 dark:text-zinc-300 flex-shrink-0 mt-0.5" />
                    ) : (
                      <Loader2 className="h-3 w-3 animate-spin text-zinc-500 dark:text-zinc-400 flex-shrink-0 mt-0.5" />
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="text-zinc-700 dark:text-zinc-200 font-medium leading-relaxed">
                        {change.description}
                      </div>

                      {/* Show before/after if available */}
                      {change.before && change.after && (
                        <div className="mt-1 flex items-center gap-2 text-[10px] font-mono">
                          <span className="text-zinc-500 dark:text-zinc-400 bg-zinc-200 dark:bg-zinc-700 px-1.5 py-0.5 rounded truncate max-w-[120px] line-through">
                            {change.before}
                          </span>
                          <span className="text-zinc-400">→</span>
                          <span className="text-zinc-700 dark:text-zinc-200 bg-zinc-200 dark:bg-zinc-700 px-1.5 py-0.5 rounded truncate max-w-[120px]">
                            {change.after}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
