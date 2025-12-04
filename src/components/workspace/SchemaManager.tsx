'use client';

import React, { useState } from 'react';
import { Copy, Check, AlertCircle, Database } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { WebsiteArtifact } from '@/types/database';

interface SchemaManagerProps {
  artifact: WebsiteArtifact;
}

/**
 * Schema Manager - Display and manage database migrations
 */
export function SchemaManager({ artifact }: SchemaManagerProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Find all SQL migration files
  const migrations = artifact.files.filter(f => f.path.includes('migrations') && f.type === 'sql');
  const envVars = artifact.metadata?.envVars;

  const copyToClipboard = async (content: string, index: number) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (!migrations || migrations.length === 0) {
    return (
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <Database className="w-6 h-6 text-slate-400" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Database Schema
          </h3>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          No database migrations found in this project.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-4">
          <Database className="w-6 h-6 text-blue-500" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Database Setup
          </h3>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Run these migrations in your Supabase project to set up the database.
        </p>
      </div>

      {/* Required Environment Variables */}
      {envVars && envVars.required.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h4 className="font-semibold text-sm text-blue-900 dark:text-blue-100 mb-3">
            Required Environment Variables
          </h4>
          <ul className="space-y-2">
            {envVars.required.map((varName, idx) => (
              <li key={idx} className="flex items-center gap-2 text-sm text-blue-800 dark:text-blue-200">
                <span className="font-mono text-xs bg-white dark:bg-slate-800 px-2 py-1 rounded">
                  {varName}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Migrations */}
      <div className="space-y-4">
        <h4 className="font-semibold text-slate-900 dark:text-white">
          Migrations ({migrations.length})
        </h4>

        {migrations.map((migration, index) => (
          <div
            key={index}
            className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900"
          >
            {/* Migration Header */}
            <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between gap-4">
                <span className="font-mono text-sm text-slate-700 dark:text-slate-300">
                  {migration.path.split('/').pop()}
                </span>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => copyToClipboard(migration.content, index)}
                  className="gap-2"
                >
                  {copiedIndex === index ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy SQL
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Migration Preview */}
            <div className="px-4 py-3 max-h-48 overflow-y-auto bg-slate-50 dark:bg-slate-950 font-mono text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-words">
              {migration.content.split('\n').slice(0, 10).join('\n')}
              {migration.content.split('\n').length > 10 && '\n... (truncated)'}
            </div>
          </div>
        ))}
      </div>

      {/* Setup Instructions */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 space-y-3">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
          <div className="space-y-2">
            <h4 className="font-semibold text-sm text-amber-900 dark:text-amber-100">
              How to Apply Migrations
            </h4>
            <ol className="text-sm text-amber-800 dark:text-amber-200 space-y-1.5">
              <li>
                <span className="font-semibold">1.</span> Go to your{' '}
                <a
                  href="https://supabase.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-amber-700 dark:hover:text-amber-300"
                >
                  Supabase
                </a>{' '}
                project
              </li>
              <li>
                <span className="font-semibold">2.</span> Navigate to SQL Editor
              </li>
              <li>
                <span className="font-semibold">3.</span> Create a new SQL script
              </li>
              <li>
                <span className="font-semibold">4.</span> Copy and paste each migration (in order)
              </li>
              <li>
                <span className="font-semibold">5.</span> Execute each migration
              </li>
              <li>
                <span className="font-semibold">6.</span> Verify tables appear in your schema
              </li>
            </ol>
          </div>
        </div>
      </div>

      {/* Advanced: Manual SQL */}
      <details className="cursor-pointer">
        <summary className="font-semibold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition">
          Show all SQL
        </summary>
        <div className="mt-3 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
          <pre className="font-mono text-xs text-slate-700 dark:text-slate-300 overflow-x-auto whitespace-pre-wrap break-words">
            {migrations.map((m, idx) => `-- Migration: ${m.path}\n${m.content}`).join('\n\n')}
          </pre>
        </div>
      </details>
    </div>
  );
}

/**
 * Quick Stats about schema
 */
interface SchemaSummaryProps {
  artifact: WebsiteArtifact;
}

export function SchemaSummary({ artifact }: SchemaSummaryProps) {
  const migrations = artifact.files.filter(f => f.path.includes('migrations') && f.type === 'sql');

  if (migrations.length === 0) {
    return null;
  }

  // Count tables mentioned in migrations
  const tables = new Set<string>();
  migrations.forEach(m => {
    const tableMatches = m.content.match(/CREATE TABLE\s+(?:IF NOT EXISTS\s+)?(\w+)/gi);
    if (tableMatches) {
      tableMatches.forEach(match => {
        const tableName = match.replace(/CREATE TABLE\s+(?:IF NOT EXISTS\s+)?/i, '').trim();
        tables.add(tableName);
      });
    }
  });

  return (
    <div className="flex items-center gap-4 text-sm">
      <div className="flex items-center gap-2">
        <Database className="w-4 h-4 text-blue-500" />
        <span className="text-slate-600 dark:text-slate-400">
          {migrations.length} migration{migrations.length !== 1 ? 's' : ''}
        </span>
      </div>
      {tables.size > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-slate-600 dark:text-slate-400">
            {tables.size} table{tables.size !== 1 ? 's' : ''}
          </span>
        </div>
      )}
    </div>
  );
}
