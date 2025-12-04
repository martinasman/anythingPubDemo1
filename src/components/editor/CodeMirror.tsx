'use client';

import React, { useEffect, useRef } from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { javascript } from '@codemirror/lang-javascript';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { json } from '@codemirror/lang-json';
import { sql } from '@codemirror/lang-sql';
import { markdown } from '@codemirror/lang-markdown';
import { oneDark } from '@codemirror/theme-one-dark';
import { cn } from '@/lib/utils';

interface CodeMirrorProps {
  value: string;
  language?: 'tsx' | 'ts' | 'jsx' | 'js' | 'html' | 'css' | 'json' | 'sql' | 'md' | 'env';
  readOnly?: boolean;
  height?: string;
  className?: string;
}

/**
 * Get language extension based on file type
 */
function getLanguageExtension(language?: string) {
  switch (language) {
    case 'tsx':
    case 'jsx':
      return javascript({ jsx: true, typescript: true });
    case 'ts':
      return javascript({ typescript: true });
    case 'js':
      return javascript({ jsx: false, typescript: false });
    case 'html':
      return html();
    case 'css':
      return css();
    case 'json':
      return json();
    case 'sql':
      return sql();
    case 'md':
      return markdown();
    case 'env':
      // Treat .env files as plain text with basic syntax highlighting
      return javascript({ typescript: false, jsx: false });
    default:
      return [];
  }
}

/**
 * Get theme based on system preference
 */
function getTheme() {
  if (typeof window !== 'undefined') {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return isDark ? oneDark : undefined;
  }
  return undefined;
}

/**
 * CodeMirror editor component
 * Provides syntax highlighting and code viewing with language detection
 */
export function CodeMirror({
  value,
  language,
  readOnly = true,
  height = '600px',
  className,
}: CodeMirrorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<EditorView | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear previous editor if it exists
    if (editorRef.current) {
      editorRef.current.destroy();
    }

    // Create state with language extension
    const extensions = [
      basicSetup,
      getLanguageExtension(language),
      EditorState.readOnly.of(readOnly),
    ];

    // Add theme if available
    const theme = getTheme();
    if (theme) {
      extensions.push(theme);
    }

    const state = EditorState.create({
      doc: value,
      extensions,
    });

    // Create editor view
    const view = new EditorView({
      state,
      parent: containerRef.current,
    });

    editorRef.current = view;

    return () => {
      if (editorRef.current) {
        editorRef.current.destroy();
      }
    };
  }, [value, language, readOnly]);

  // Detect dark mode changes
  useEffect(() => {
    if (!editorRef.current) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      // CodeMirror will auto-update theme based on CSS variables
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn(
        'border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-950',
        className
      )}
      style={{ height }}
    />
  );
}

/**
 * Get file language from extension
 */
export function detectLanguage(filePath: string): CodeMirrorProps['language'] {
  const ext = filePath.split('.').pop()?.toLowerCase();

  const extensionMap: Record<string, CodeMirrorProps['language']> = {
    tsx: 'tsx',
    ts: 'ts',
    jsx: 'jsx',
    js: 'js',
    html: 'html',
    css: 'css',
    json: 'json',
    sql: 'sql',
    md: 'md',
    env: 'env',
  };

  return extensionMap[ext || ''] || 'js';
}

/**
 * Code viewer with file info header
 */
interface CodeViewerProps extends Omit<CodeMirrorProps, 'language'> {
  filePath: string;
  showHeader?: boolean;
}

export function CodeViewer({
  filePath,
  value,
  showHeader = true,
  readOnly = true,
  height = '600px',
  className,
}: CodeViewerProps) {
  const language = detectLanguage(filePath);

  return (
    <div className="flex flex-col h-full">
      {showHeader && (
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
          <p className="text-sm font-mono text-slate-600 dark:text-slate-400">
            {filePath}
          </p>
        </div>
      )}
      <div className="flex-1 overflow-hidden">
        <CodeMirror
          value={value}
          language={language}
          readOnly={readOnly}
          height="100%"
          className={className}
        />
      </div>
    </div>
  );
}

/**
 * Get syntax highlighting theme class
 */
export function getSyntaxTheme(): string {
  if (typeof window !== 'undefined') {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return isDark ? 'dark' : 'light';
  }
  return 'light';
}
