'use client';

import type { ShowcaseExample } from '@/data/showcaseExamples';

interface ShowcaseCardProps {
  example: ShowcaseExample;
  onClick?: () => void;
}

function createGradient(color: string): string {
  // Parse hex color and create a lighter/darker gradient
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Create lighter version
  const lighterR = Math.min(255, r + 40);
  const lighterG = Math.min(255, g + 40);
  const lighterB = Math.min(255, b + 40);

  // Create darker version
  const darkerR = Math.max(0, r - 30);
  const darkerG = Math.max(0, g - 30);
  const darkerB = Math.max(0, b - 30);

  return `linear-gradient(135deg, rgb(${lighterR},${lighterG},${lighterB}) 0%, rgb(${r},${g},${b}) 50%, rgb(${darkerR},${darkerG},${darkerB}) 100%)`;
}

export default function ShowcaseCard({ example, onClick }: ShowcaseCardProps) {
  const { identity, research } = example;

  return (
    <div
      onClick={onClick}
      className="flex-shrink-0 w-72 sm:w-80 h-96 rounded-3xl overflow-hidden shadow-lg hover-scale cursor-pointer group"
      style={{ background: createGradient(identity.colors.primary) }}
    >
      {/* Logo */}
      <div className="flex items-center justify-center h-56 p-8">
        <div
          className="w-32 h-32 bg-white/20 backdrop-blur-sm rounded-2xl p-4 flex items-center justify-center group-hover:scale-105 transition-transform duration-300"
          dangerouslySetInnerHTML={{ __html: identity.logoSvg }}
        />
      </div>

      {/* Content */}
      <div className="p-6 bg-gradient-to-t from-black/40 to-transparent">
        <h3 className="text-xl font-bold text-white mb-1">
          {identity.name}
        </h3>
        <p className="text-white/90 text-sm mb-3">
          {identity.tagline}
        </p>

        {/* Color dots */}
        <div className="flex items-center gap-2 mb-3">
          <div
            className="w-4 h-4 rounded-full border-2 border-white/50"
            style={{ backgroundColor: identity.colors.primary }}
          />
          <div
            className="w-4 h-4 rounded-full border-2 border-white/50"
            style={{ backgroundColor: identity.colors.secondary }}
          />
          <div
            className="w-4 h-4 rounded-full border-2 border-white/50"
            style={{ backgroundColor: identity.colors.accent }}
          />
        </div>

        {/* Market info */}
        <div className="flex items-center justify-between text-xs text-white/70">
          <span>{research.competitors.length} competitors</span>
          <span>{research.marketSize} market</span>
        </div>
      </div>
    </div>
  );
}
