'use client';

interface WaveTextProps {
  text: string;
  className?: string;
}

/**
 * Animated text component that creates a wave/shimmer color effect
 * Each character animates with a staggered delay creating a flowing wave
 */
export function WaveText({ text, className = '' }: WaveTextProps) {
  return (
    <span className={`inline-flex flex-wrap ${className}`}>
      {text.split('').map((char, i) => (
        <span
          key={i}
          className="animate-wave-color"
          style={{
            animationDelay: `${i * 40}ms`,
          }}
        >
          {char === ' ' ? '\u00A0' : char}
        </span>
      ))}
    </span>
  );
}
