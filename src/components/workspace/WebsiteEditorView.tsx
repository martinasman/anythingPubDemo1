'use client';

import { useMemo } from 'react';
import { ArrowLeft, Download, ExternalLink, Smartphone, Monitor, Tablet } from 'lucide-react';
import { useProjectStore } from '@/store/projectStore';

interface WebsiteEditorViewProps {
  onBack: () => void;
}

export default function WebsiteEditorView({ onBack }: WebsiteEditorViewProps) {
  const { artifacts } = useProjectStore();

  // Create iframe content from website HTML with injected CSS and JS
  const websitePreviewUrl = useMemo(() => {
    if (!artifacts.website?.files) return null;

    const htmlFile = artifacts.website.files.find(f => f.path === '/index.html');
    if (!htmlFile) return null;

    const cssFile = artifacts.website.files.find(f => f.path === '/styles.css');
    const jsFile = artifacts.website.files.find(f => f.path === '/script.js');

    // Inject CSS and JS into HTML
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

  const handleExport = () => {
    if (!artifacts.website?.files) return;

    // Create a zip-like download (for now just download HTML)
    const htmlFile = artifacts.website.files.find(f => f.path === '/index.html');
    const cssFile = artifacts.website.files.find(f => f.path === '/styles.css');
    const jsFile = artifacts.website.files.find(f => f.path === '/script.js');

    if (htmlFile) {
      let fullHtml = htmlFile.content;
      if (cssFile) {
        fullHtml = fullHtml.replace('</head>', `<style>${cssFile.content}</style></head>`);
      }
      if (jsFile) {
        fullHtml = fullHtml.replace('</body>', `<script>${jsFile.content}</script></body>`);
      }

      const blob = new Blob([fullHtml], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'website.html';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleOpenInNewTab = () => {
    if (websitePreviewUrl) {
      window.open(websitePreviewUrl, '_blank');
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header with back button and actions */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-zinc-600 dark:text-slate-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Back to Dashboard</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Viewport toggles - future enhancement */}
          <div className="hidden md:flex items-center gap-1 mr-2 bg-zinc-100 dark:bg-slate-800 rounded-lg p-1">
            <button className="p-1.5 rounded bg-white dark:bg-slate-700 shadow-sm" title="Desktop">
              <Monitor size={14} className="text-zinc-700 dark:text-slate-300" />
            </button>
            <button className="p-1.5 rounded hover:bg-white/50 dark:hover:bg-slate-700/50" title="Tablet">
              <Tablet size={14} className="text-zinc-400" />
            </button>
            <button className="p-1.5 rounded hover:bg-white/50 dark:hover:bg-slate-700/50" title="Mobile">
              <Smartphone size={14} className="text-zinc-400" />
            </button>
          </div>

          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-zinc-100 dark:bg-slate-800 text-zinc-700 dark:text-slate-300 rounded-lg hover:bg-zinc-200 dark:hover:bg-slate-700 transition-colors"
          >
            <Download size={14} />
            Export
          </button>
          <button
            onClick={handleOpenInNewTab}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-zinc-100 dark:bg-slate-800 text-zinc-700 dark:text-slate-300 rounded-lg hover:bg-zinc-200 dark:hover:bg-slate-700 transition-colors"
          >
            <ExternalLink size={14} />
            Open
          </button>
        </div>
      </div>

      {/* Full-size website preview */}
      <div className="flex-1 rounded-xl overflow-hidden" style={{ background: 'var(--surface-2)', boxShadow: 'var(--shadow-lg)' }}>
        {websitePreviewUrl ? (
          <iframe
            src={websitePreviewUrl}
            className="w-full h-full border-0"
            sandbox="allow-same-origin allow-scripts"
            title="Website Editor Preview"
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-zinc-400 gap-3">
            <Monitor size={48} className="text-zinc-300 dark:text-slate-600" />
            <p className="text-sm">No website generated yet</p>
            <p className="text-xs text-zinc-400 dark:text-slate-500">
              Use the chat to generate or update your website
            </p>
          </div>
        )}
      </div>

      {/* Footer hint */}
      <div className="mt-3 text-center">
        <p className="text-xs text-zinc-400 dark:text-slate-500">
          Use the chat on the left to edit your website. Try: "Make the hero section taller" or "Change the button color to blue"
        </p>
      </div>
    </div>
  );
}
