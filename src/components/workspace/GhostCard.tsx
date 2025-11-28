'use client';

import { ReactNode } from 'react';

export type CardState = 'idle' | 'ghost' | 'building' | 'materialized';

interface GhostCardProps {
  children: ReactNode;
  state: CardState;
  className?: string;
  style?: React.CSSProperties;
  placeholder?: ReactNode;
  onClick?: () => void;
}

/**
 * GhostCard - A card component that transitions through idle → ghost → building → materialized states
 *
 * States:
 * - idle: Hidden, generation hasn't started yet
 * - ghost: Subtle gray shimmer, indicates slot exists but no data yet
 * - building: Pulsing animation, tool is actively generating content
 * - materialized: Full visibility with entrance animation
 */
export default function GhostCard({
  children,
  state,
  className = '',
  style,
  placeholder,
  onClick,
}: GhostCardProps) {
  // Don't render anything in idle state
  if (state === 'idle') {
    return null;
  }

  // Determine CSS class based on state
  const stateClass = {
    idle: '',
    ghost: 'ghost-state',
    building: 'building-state',
    materialized: 'materialized-state',
  }[state];

  // Only apply ghost background when in ghost state
  const ghostBackground = state === 'ghost' ? {} : style;

  // Use CSS variable shadows - no borders (Givingli style)
  const shadowStyle = {
    boxShadow: state === 'ghost'
      ? 'var(--shadow-sm)'
      : 'var(--shadow-lg)',
  };

  return (
    <div
      className={`rounded-3xl overflow-hidden transition-all duration-500 ${stateClass} ${className}`}
      style={{
        ...shadowStyle,
        ...(state === 'ghost' ? undefined : style),
      }}
      onClick={onClick}
    >
      {state === 'ghost' && placeholder ? (
        // Show placeholder content in ghost state
        <div className="w-full h-full flex flex-col items-center justify-center p-6 text-zinc-400 dark:text-slate-600">
          {placeholder}
        </div>
      ) : (
        // Show actual content in building/materialized states
        children
      )}
    </div>
  );
}

/**
 * Helper hook to derive card state from artifact and tool status
 */
export function useCardState(
  hasArtifact: boolean,
  isToolRunning: boolean,
  hasStartedGeneration: boolean = true
): CardState {
  if (hasArtifact) return 'materialized';
  if (isToolRunning) return 'building';
  if (hasStartedGeneration) return 'ghost';
  return 'idle';
}
