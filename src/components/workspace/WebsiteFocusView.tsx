'use client';

import { useMemo, useState } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { Globe, Monitor, Smartphone, Tablet, ExternalLink } from 'lucide-react';

type Viewport = 'desktop' | 'tablet' | 'mobile';

const VIEWPORT_WIDTHS: Record<Viewport, string> = {
  desktop: '100%',
  tablet: '768px',
  mobile: '375px',
};

export default function WebsiteFocusView() {
  const { artifacts, runningTools } = useProjectStore();
  const [viewport, setViewport] = useState<Viewport>('desktop');

  const isWebsiteLoading = runningTools.has('website');

  // Create iframe content from website HTML
  const websitePreviewUrl = useMemo(() => {
    if (!artifacts.website?.files) return null;

    const htmlFile = artifacts.website.files.find(f => f.path === '/index.html');
    if (!htmlFile) return null;

    const cssFile = artifacts.website.files.find(f => f.path === '/styles.css');
    const jsFile = artifacts.website.files.find(f => f.path === '/script.js');

    let modifiedHtml = htmlFile.content;

    if (cssFile) {
      modifiedHtml = modifiedHtml.replace(
        '</head>',
        `<style>${cssFile.content}</style></head>`
      );
    }

    if (jsFile) {
      modifiedHtml = modifiedHtml.replace(
        '</body>',
        `<script>${jsFile.content}</script></body>`
      );
    }

    const blob = new Blob([modifiedHtml], { type: 'text/html' });
    return URL.createObjectURL(blob);
  }, [artifacts.website]);

  // Empty/Loading state
  if (!websitePreviewUrl) {
    return (
      <div className={`h-full flex flex-col items-center justify-center ${isWebsiteLoading ? 'animate-pulse' : ''}`}>
        <Globe size={48} className="text-zinc-300 dark:text-zinc-600 mb-4" />
        <h3 className="text-lg font-semibold text-zinc-500 dark:text-zinc-400 mb-2">
          {isWebsiteLoading ? 'Building Your Website...' : 'No Website Yet'}
        </h3>
        <p className="text-sm text-zinc-400 dark:text-zinc-500 text-center max-w-xs">
          {isWebsiteLoading
            ? 'Your website is being generated. This may take a moment.'
            : 'Start a conversation to generate your business website.'}
        </p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-hidden flex flex-col">
      {/* Browser Chrome */}
      <div className="flex items-center gap-3 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
        {/* Traffic lights */}
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
        </div>

        {/* URL bar */}
        <div className="flex-1 mx-3">
          <div className="bg-white dark:bg-zinc-700 rounded-lg px-3 py-1.5 text-xs text-zinc-500 dark:text-zinc-400 truncate flex items-center gap-2">
            <Globe size={12} />
            {artifacts.identity?.name?.toLowerCase().replace(/\s+/g, '') || 'your-business'}.com
          </div>
        </div>

        {/* Viewport Toggle */}
        <div className="flex items-center gap-1 bg-white dark:bg-zinc-700 rounded-lg p-1">
          <button
            onClick={() => setViewport('desktop')}
            className={`p-1.5 rounded transition-colors ${
              viewport === 'desktop'
                ? 'bg-zinc-100 dark:bg-zinc-600 text-zinc-900 dark:text-white'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
            }`}
            title="Desktop view"
          >
            <Monitor size={14} />
          </button>
          <button
            onClick={() => setViewport('tablet')}
            className={`p-1.5 rounded transition-colors ${
              viewport === 'tablet'
                ? 'bg-zinc-100 dark:bg-zinc-600 text-zinc-900 dark:text-white'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
            }`}
            title="Tablet view"
          >
            <Tablet size={14} />
          </button>
          <button
            onClick={() => setViewport('mobile')}
            className={`p-1.5 rounded transition-colors ${
              viewport === 'mobile'
                ? 'bg-zinc-100 dark:bg-zinc-600 text-zinc-900 dark:text-white'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
            }`}
            title="Mobile view"
          >
            <Smartphone size={14} />
          </button>
        </div>

        {/* Open in new tab */}
        <button
          onClick={() => window.open(websitePreviewUrl, '_blank')}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-white dark:hover:bg-zinc-700 rounded-lg transition-colors"
          title="Open in new tab"
        >
          <ExternalLink size={14} />
          Open
        </button>
      </div>

      {/* Website Preview */}
      <div className="flex-1 relative overflow-auto bg-zinc-200 dark:bg-zinc-900">
        <div
          className="mx-auto h-full transition-all duration-300 bg-white"
          style={{
            width: VIEWPORT_WIDTHS[viewport],
            maxWidth: '100%',
            boxShadow: viewport !== 'desktop' ? '0 0 0 1px rgba(0,0,0,0.1), 0 4px 16px rgba(0,0,0,0.1)' : 'none',
          }}
        >
          <iframe
            src={websitePreviewUrl}
            className="w-full h-full border-0"
            sandbox="allow-same-origin allow-scripts"
            title="Website Preview"
          />
        </div>
      </div>
    </div>
  );
}
