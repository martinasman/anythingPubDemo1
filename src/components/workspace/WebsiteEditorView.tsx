'use client';

import { useMemo, useState } from 'react';
import { ArrowLeft, Download, ExternalLink, Smartphone, Monitor, Tablet, Files, Database } from 'lucide-react';
import { useProjectStore } from '@/store/projectStore';
import { FileTreeEditor } from '@/components/workspace/FileTreeEditor';
import { CodeViewer } from '@/components/editor/CodeMirror';
import { SchemaManager, SchemaSummary } from '@/components/workspace/SchemaManager';
import { downloadProjectZip } from '@/utils/nextjsExport';

interface WebsiteEditorViewProps {
  onBack: () => void;
}

export default function WebsiteEditorView({ onBack }: WebsiteEditorViewProps) {
  const { artifacts } = useProjectStore();
  const [activeTab, setActiveTab] = useState<'preview' | 'files' | 'schema'>('preview');
  const [selectedFile, setSelectedFile] = useState<string | undefined>();

  const isNextJs = artifacts.website?.appType === 'nextjs';
  const artifact = artifacts.website;

  // Create iframe content from website HTML with injected CSS and JS
  const websitePreviewUrl = useMemo(() => {
    if (!artifact?.files) return null;

    const htmlFile = artifact.files.find(f => f.path === '/index.html');
    if (!htmlFile) return null;

    const cssFile = artifact.files.find(f => f.path === '/styles.css');
    const jsFile = artifact.files.find(f => f.path === '/script.js');

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
  }, [artifact?.files]);

  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!artifact?.files) return;

    try {
      setIsExporting(true);

      if (isNextJs) {
        // Export as ZIP for Next.js projects
        const projectName = 'nextjs-app';
        await downloadProjectZip(artifact, projectName);
      } else {
        // Create HTML download for landing pages
        const htmlFile = artifact.files.find(f => f.path === '/index.html');
        const cssFile = artifact.files.find(f => f.path === '/styles.css');
        const jsFile = artifact.files.find(f => f.path === '/script.js');

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
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export project');
    } finally {
      setIsExporting(false);
    }
  };

  const handleOpenInNewTab = () => {
    if (websitePreviewUrl) {
      window.open(websitePreviewUrl, '_blank');
    }
  };

  const selectedFileContent = artifact?.files.find(f => f.path === selectedFile);

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
          {/* Tab buttons for Next.js projects */}
          {isNextJs && (
            <div className="flex items-center gap-1 bg-zinc-100 dark:bg-slate-800 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                  activeTab === 'preview'
                    ? 'bg-white dark:bg-slate-700 text-zinc-900 dark:text-white'
                    : 'text-zinc-600 dark:text-slate-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                <Monitor size={14} className="inline mr-1" />
                Preview
              </button>
              <button
                onClick={() => setActiveTab('files')}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                  activeTab === 'files'
                    ? 'bg-white dark:bg-slate-700 text-zinc-900 dark:text-white'
                    : 'text-zinc-600 dark:text-slate-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                <Files size={14} className="inline mr-1" />
                Files
              </button>
              {artifact?.files.some(f => f.path.includes('migrations') && f.type === 'sql') && (
                <button
                  onClick={() => setActiveTab('schema')}
                  className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                    activeTab === 'schema'
                      ? 'bg-white dark:bg-slate-700 text-zinc-900 dark:text-white'
                      : 'text-zinc-600 dark:text-slate-400 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  <Database size={14} className="inline mr-1" />
                  Schema
                </button>
              )}
            </div>
          )}

          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-zinc-100 dark:bg-slate-800 text-zinc-700 dark:text-slate-300 rounded-lg hover:bg-zinc-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={14} />
            {isExporting ? 'Exporting...' : 'Export'}
          </button>
          {!isNextJs && (
            <button
              onClick={handleOpenInNewTab}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-zinc-100 dark:bg-slate-800 text-zinc-700 dark:text-slate-300 rounded-lg hover:bg-zinc-200 dark:hover:bg-slate-700 transition-colors"
            >
              <ExternalLink size={14} />
              Open
            </button>
          )}
        </div>
      </div>

      {/* Content - switches based on tab */}
      <div className="flex-1 rounded-xl overflow-hidden flex" style={{ background: 'var(--surface-2)', boxShadow: 'var(--shadow-lg)' }}>
        {isNextJs && activeTab === 'files' ? (
          // Next.js Files View
          <>
            <FileTreeEditor
              files={artifact?.files || []}
              selectedPath={selectedFile}
              onFileSelect={setSelectedFile}
            />
            <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-slate-900">
              {selectedFile && selectedFileContent ? (
                <CodeViewer
                  filePath={selectedFile}
                  value={selectedFileContent.content}
                  showHeader={true}
                  height="100%"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-zinc-400 gap-3">
                  <Files size={48} className="text-zinc-300 dark:text-slate-600" />
                  <p className="text-sm">Select a file to view</p>
                </div>
              )}
            </div>
          </>
        ) : isNextJs && activeTab === 'schema' ? (
          // Schema Manager View
          <div className="w-full overflow-y-auto">
            {artifact && <SchemaManager artifact={artifact} />}
          </div>
        ) : (
          // Preview (HTML or Next.js static)
          <>
            {websitePreviewUrl ? (
              <iframe
                src={websitePreviewUrl}
                className="w-full h-full border-0"
                sandbox="allow-same-origin allow-scripts"
                title="Website Editor Preview"
              />
            ) : (
              <div className="flex flex-col items-center justify-center w-full h-full text-zinc-400 gap-3">
                <Monitor size={48} className="text-zinc-300 dark:text-slate-600" />
                <p className="text-sm">No website generated yet</p>
                <p className="text-xs text-zinc-400 dark:text-slate-500">
                  Use the chat to generate or update your website
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer hint */}
      <div className="mt-3 text-center">
        <p className="text-xs text-zinc-400 dark:text-slate-500">
          {isNextJs
            ? 'Browse files, view database schema, or download your Next.js project'
            : 'Use the chat on the left to edit your website. Try: "Make the hero section taller" or "Change the button color to blue"'}
        </p>
      </div>
    </div>
  );
}
