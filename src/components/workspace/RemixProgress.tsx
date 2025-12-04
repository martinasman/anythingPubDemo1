'use client';

import { useState, useEffect } from 'react';
import { Globe, FileText, Palette, Check, Loader2, Code, Layout } from 'lucide-react';
import Image from 'next/image';
import type { CanvasState } from '@/store/projectStore';

// Animated dots component
function AnimatedDots() {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
    }, 400);
    return () => clearInterval(interval);
  }, []);

  return <span className="inline-block w-4">{dots}</span>;
}

interface RemixProgressProps {
  canvasState: Extract<CanvasState, { type: 'remix-crawling' } | { type: 'remix-generating' }>;
}

export default function RemixProgress({ canvasState }: RemixProgressProps) {
  // Determine phase and progress
  const isCrawling = canvasState.type === 'remix-crawling';
  const isGenerating = canvasState.type === 'remix-generating';

  // Calculate overall progress
  let progress = 0;
  let message = '';
  let detail = '';

  if (isCrawling) {
    const { pagesDiscovered, pagesCrawled, currentPage, url } = canvasState;
    const crawlProgress = pagesDiscovered > 0 ? (pagesCrawled / pagesDiscovered) * 40 : 0;
    progress = Math.round(crawlProgress);
    message = `Crawling ${new URL(url).hostname}`;
    detail = `Page ${pagesCrawled}/${pagesDiscovered}: ${currentPage}`;
  } else if (isGenerating) {
    const { currentPage, totalPages, pageName } = canvasState;
    const genProgress = totalPages > 0 ? (currentPage / totalPages) * 55 + 40 : 40;
    progress = Math.round(genProgress);
    message = 'Generating modern site';
    detail = `Page ${currentPage}/${totalPages}: ${pageName}`;
  }

  return (
    <div className="flex flex-col items-center justify-center h-full bg-zinc-50 dark:bg-zinc-900 p-8">
      {/* Logo with pulse animation */}
      <div className="mb-8 animate-pulse">
        <Image
          src="/anythingicondark.png"
          alt="Anything"
          width={64}
          height={64}
          className="dark:hidden"
        />
        <Image
          src="/anythingiconlight.png"
          alt="Anything"
          width={64}
          height={64}
          className="hidden dark:block"
        />
      </div>

      {/* Main message */}
      <div className="mb-6 text-center max-w-md">
        <p className="text-xl font-semibold text-zinc-900 dark:text-white">
          {message}
          <AnimatedDots />
        </p>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">{detail}</p>
      </div>

      {/* Progress bar */}
      <div className="w-80 mb-8">
        <div className="h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          <span>Crawl</span>
          <span>Generate</span>
          <span>Complete</span>
        </div>
      </div>

      {/* Phase indicators */}
      <div className="flex items-center gap-6">
        {/* Crawl phase */}
        <div className="flex flex-col items-center gap-2">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              isCrawling
                ? 'bg-blue-100 dark:bg-blue-900/30 ring-2 ring-blue-500'
                : isGenerating
                  ? 'bg-green-100 dark:bg-green-900/30'
                  : 'bg-zinc-100 dark:bg-zinc-800'
            }`}
          >
            {isCrawling ? (
              <Globe className="w-6 h-6 text-blue-600 animate-pulse" />
            ) : isGenerating ? (
              <Check className="w-6 h-6 text-green-600" />
            ) : (
              <Globe className="w-6 h-6 text-zinc-400" />
            )}
          </div>
          <span className="text-xs text-zinc-600 dark:text-zinc-400">Crawl</span>
        </div>

        {/* Connector line */}
        <div
          className={`w-12 h-0.5 ${
            isGenerating ? 'bg-blue-500' : 'bg-zinc-200 dark:bg-zinc-700'
          }`}
        />

        {/* Generate phase */}
        <div className="flex flex-col items-center gap-2">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              isGenerating
                ? 'bg-blue-100 dark:bg-blue-900/30 ring-2 ring-blue-500'
                : 'bg-zinc-100 dark:bg-zinc-800'
            }`}
          >
            {isGenerating ? (
              <Code className="w-6 h-6 text-blue-600 animate-pulse" />
            ) : (
              <Code className="w-6 h-6 text-zinc-400" />
            )}
          </div>
          <span className="text-xs text-zinc-600 dark:text-zinc-400">Generate</span>
        </div>

        {/* Connector line */}
        <div className="w-12 h-0.5 bg-zinc-200 dark:bg-zinc-700" />

        {/* Complete phase */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-800">
            <Layout className="w-6 h-6 text-zinc-400" />
          </div>
          <span className="text-xs text-zinc-600 dark:text-zinc-400">Preview</span>
        </div>
      </div>

      {/* Extracted data indicators (during crawl) */}
      {isCrawling && (
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div className="p-3 bg-white dark:bg-zinc-800 rounded-lg shadow-sm">
            <FileText className="w-5 h-5 mx-auto mb-1 text-zinc-600 dark:text-zinc-400" />
            <div className="text-lg font-semibold text-zinc-900 dark:text-white">
              {canvasState.pagesCrawled}
            </div>
            <div className="text-xs text-zinc-500">Pages</div>
          </div>
          <div className="p-3 bg-white dark:bg-zinc-800 rounded-lg shadow-sm">
            <Palette className="w-5 h-5 mx-auto mb-1 text-zinc-600 dark:text-zinc-400" />
            <div className="text-lg font-semibold text-zinc-900 dark:text-white">--</div>
            <div className="text-xs text-zinc-500">Colors</div>
          </div>
          <div className="p-3 bg-white dark:bg-zinc-800 rounded-lg shadow-sm">
            <Layout className="w-5 h-5 mx-auto mb-1 text-zinc-600 dark:text-zinc-400" />
            <div className="text-lg font-semibold text-zinc-900 dark:text-white">--</div>
            <div className="text-xs text-zinc-500">Forms</div>
          </div>
        </div>
      )}

      {/* Generation progress (during generate) */}
      {isGenerating && (
        <div className="mt-8 text-center">
          <div className="text-sm text-zinc-600 dark:text-zinc-400">
            Building modern version with Tailwind CSS, animations, and responsive design
          </div>
        </div>
      )}
    </div>
  );
}
