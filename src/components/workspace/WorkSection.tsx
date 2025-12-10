'use client';

import { useState, useEffect } from 'react';
import { Loader2, Check, ChevronDown, FileText } from 'lucide-react';

// ============================================
// TYPES
// ============================================

export interface ProgressStage {
  id: string;
  message: string;
  status: 'pending' | 'active' | 'complete';
  timestamp: number;
}

export interface FileEvent {
  action: 'create' | 'modify';
  path: string;
  timestamp: number;
}

export interface ActivityEvent {
  action: 'read' | 'search' | 'thought' | 'analyze' | 'generate' | 'write';
  target: string;
  duration?: string;
  timestamp: number;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  cost: number;
}

export interface WorkItem {
  toolName: string;
  description: string;
  status: 'running' | 'complete' | 'error';
  duration?: string;
  errorMessage?: string;
  stages?: ProgressStage[];
  currentStage?: string;
  files?: FileEvent[];
  activities?: ActivityEvent[];
}

// ============================================
// ACTIVITY ICONS
// ============================================

const ACTIVITY_ICONS: Record<string, string> = {
  read: '→',
  search: '→',
  thought: '→',
  analyze: '→',
  generate: '→',
  write: '→',
};

function formatActivity(activity: ActivityEvent): string {
  const actionLabels: Record<string, string> = {
    read: 'Read',
    search: 'Searched for',
    thought: 'Thought for',
    analyze: 'Analyzing',
    generate: 'Generating',
    write: 'Writing',
  };
  const label = actionLabels[activity.action] || activity.action;
  if (activity.action === 'thought' && activity.duration) {
    return `${label} ${activity.duration}`;
  }
  return `${label} ${activity.target}`;
}

// ============================================
// ANIMATED ELLIPSIS COMPONENT
// ============================================

function AnimatedEllipsis() {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => {
        if (prev === '...') return '';
        if (prev === '..') return '...';
        if (prev === '.') return '..';
        return '.';
      });
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return <span className="inline-block w-6 text-left">{dots}</span>;
}

// ============================================
// RUNNING TIME INDICATOR
// ============================================

function RunningTimeIndicator() {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (seconds < 1) return null; // Show elapsed time after 1 second

  return (
    <span className="text-zinc-400 dark:text-zinc-500 text-xs font-mono">
      {seconds}s
    </span>
  );
}

// ============================================
// WORK SECTION COMPONENT
// ============================================

interface WorkSectionProps {
  items: WorkItem[];
  thinkingMessages?: string[];
  tokenUsage?: TokenUsage;
}

export function WorkSection({ items, thinkingMessages = [], tokenUsage }: WorkSectionProps) {
  const [isOpen, setIsOpen] = useState(true);

  // Auto-collapse when all items complete (don't depend on isStreaming - it has timing issues)
  useEffect(() => {
    const allComplete = items.length > 0 && items.every(i => i.status === 'complete');
    if (allComplete) {
      // Delay collapse so user sees the final state
      const timer = setTimeout(() => {
        setIsOpen(false);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [items]);

  // Keep open while any tool is running (don't depend on isStreaming - it stays true too long)
  useEffect(() => {
    if (items.some(i => i.status === 'running')) {
      setIsOpen(true);
    }
  }, [items]);

  if (items.length === 0) return null;

  const runningCount = items.filter(i => i.status === 'running').length;
  const completeCount = items.filter(i => i.status === 'complete').length;
  const allComplete = items.every(i => i.status === 'complete');

  // Summary text for header
  const headerText = runningCount > 0
    ? `Working on ${runningCount} task${runningCount > 1 ? 's' : ''}...`
    : `Completed ${completeCount} task${completeCount > 1 ? 's' : ''}`;

  return (
    <div className="mb-4 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 overflow-hidden border border-zinc-200 dark:border-zinc-700/50 shadow-sm">
      {/* Header - clickable to toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-zinc-800 dark:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700/70 transition-colors"
      >
        <span className="flex items-center gap-2.5">
          {runningCount > 0 ? (
            <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
          ) : (
            <Check className="h-4 w-4 text-green-500" />
          )}
          {headerText}
        </span>
        <span className="flex items-center gap-2">
          {/* Token cost badge */}
          {tokenUsage && tokenUsage.cost > 0 && (
            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono bg-zinc-200 dark:bg-zinc-700 px-1.5 py-0.5 rounded">
              ${tokenUsage.cost.toFixed(3)}
            </span>
          )}
          <ChevronDown
            className={`h-4 w-4 text-zinc-500 dark:text-zinc-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </span>
      </button>

      {/* Content - collapsible */}
      <div
        className={`transition-all duration-300 ease-out ${
          isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
        } overflow-hidden overflow-y-auto`}
      >
        <div className="px-4 pb-4 pt-2 space-y-3">
          {/* Thinking messages section */}
          {thinkingMessages.length > 0 && (
            <div className="space-y-1.5 mb-3">
              {thinkingMessages.map((msg, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 text-xs text-zinc-500 dark:text-zinc-400 animate-slide-in"
                >
                  <span className="flex-shrink-0">→</span>
                  <span className="italic">{msg}</span>
                </div>
              ))}
            </div>
          )}

          {items.map((item) => (
            <div key={item.toolName} className="space-y-2">
              {/* Main tool item */}
              <div
                className={`flex items-center gap-3 text-sm border-l-3 pl-3 py-2 rounded-r-lg transition-all ${
                  item.status === 'running'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-sm'
                    : 'border-green-500 bg-green-50 dark:bg-green-900/20'
                }`}
              >
                {item.status === 'running' ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600 dark:text-blue-400 flex-shrink-0" />
                ) : (
                  <Check className="h-3.5 w-3.5 text-green-600 dark:text-green-400 flex-shrink-0" />
                )}
                <span className="text-zinc-700 dark:text-zinc-200 flex-1 font-medium">
                  {item.description}
                  {item.status === 'running' && !item.stages?.length && <AnimatedEllipsis />}
                </span>
                {item.status === 'running' ? (
                  <RunningTimeIndicator />
                ) : (
                  item.duration && parseFloat(item.duration) > 0.1 && (
                    <span className="text-zinc-500 dark:text-zinc-400 text-xs font-mono px-2 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded">
                      {item.duration}
                    </span>
                  )
                )}
              </div>

              {/* Progress stages (if any) */}
              {item.stages && item.stages.length > 0 && (
                <div className="ml-6 pl-3 border-l-2 border-zinc-300 dark:border-zinc-600 space-y-1.5">
                  {item.stages.map((stage, idx) => {
                    const isActive = stage.status === 'active';
                    const isComplete = stage.status === 'complete';
                    const isPending = stage.status === 'pending';

                    return (
                      <div
                        key={stage.id}
                        className={`flex items-center gap-2 text-xs py-1 px-2 rounded transition-all ${
                          isActive
                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                            : isComplete
                            ? 'text-green-700 dark:text-green-400'
                            : 'text-zinc-400 dark:text-zinc-500'
                        }`}
                      >
                        {isActive ? (
                          <Loader2 className="h-3 w-3 animate-spin flex-shrink-0" />
                        ) : isComplete ? (
                          <Check className="h-3 w-3 flex-shrink-0" />
                        ) : (
                          <span className="h-3 w-3 rounded-full border border-current flex-shrink-0" />
                        )}
                        <span className={isActive ? 'font-medium' : ''}>
                          {stage.message}
                          {isActive && <AnimatedEllipsis />}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Activity timeline (Lovable-style) */}
              {item.activities && item.activities.length > 0 && (
                <div className="ml-6 pl-3 border-l-2 border-blue-200 dark:border-blue-800 space-y-1">
                  {item.activities.slice(-8).map((activity, idx) => {
                    const isLatest = idx === item.activities!.slice(-8).length - 1 && item.status === 'running';
                    return (
                      <div
                        key={`${activity.action}-${activity.target}-${idx}`}
                        className={`flex items-center gap-2 text-xs py-0.5 animate-slide-in ${
                          isLatest ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-500 dark:text-zinc-400'
                        }`}
                      >
                        <span className="flex-shrink-0">{ACTIVITY_ICONS[activity.action] || '•'}</span>
                        <span className={isLatest ? 'font-medium' : ''}>
                          {formatActivity(activity)}
                        </span>
                        {isLatest && (
                          <span className="text-blue-400 dark:text-blue-500 text-[10px] ml-auto">← now</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* File events (if any) */}
              {item.files && item.files.length > 0 && (
                <div className="ml-6 pl-3 border-l-2 border-zinc-300 dark:border-zinc-600 space-y-1">
                  {item.files.map((file, idx) => (
                    <div
                      key={`${file.path}-${idx}`}
                      className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 py-0.5 animate-slide-in"
                    >
                      <FileText className="h-3 w-3 flex-shrink-0" />
                      <span className="font-mono">{file.path}</span>
                      {file.action === 'create' && (
                        <span className="text-green-500 text-[10px] font-medium">+new</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
