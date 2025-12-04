'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, Trash2, Copy, Share2 } from 'lucide-react';
import type { WebsiteArtifact, Project } from '@/types/database';
import type { ProjectWithWebsite } from './ProjectDashboard';
import { formatRelativeTime } from '@/utils/formatRelativeTime';

interface ProjectCardProps {
  project: ProjectWithWebsite;
  index: number;
  onDelete?: (projectId: string) => void;
}

// Generate a consistent gradient based on project name
function getGradient(name: string): string {
  const gradients = [
    'from-purple-500 to-pink-500',
    'from-green-500 to-emerald-500',
    'from-orange-500 to-red-500',
    'from-indigo-500 to-purple-500',
    'from-pink-500 to-rose-500',
    'from-amber-500 to-orange-500',
  ];

  // Simple hash based on name
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  return gradients[Math.abs(hash) % gradients.length];
}

// Get status badge color
function getStatusColor(status: Project['status']): string {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    case 'completed':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    case 'archived':
      return 'bg-zinc-100 text-zinc-600 dark:bg-slate-800 dark:text-slate-400';
    default:
      return 'bg-zinc-100 text-zinc-600 dark:bg-slate-800 dark:text-slate-400';
  }
}

export default function ProjectCard({ project, index, onDelete }: ProjectCardProps) {
  const router = useRouter();
  const gradient = getGradient(project.name);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Create blob URL for website preview
  useEffect(() => {
    if (!project.websiteData?.files) {
      setPreviewUrl(null);
      return;
    }

    const htmlFile = project.websiteData.files.find(f => f.path === '/index.html');
    const cssFile = project.websiteData.files.find(f => f.path === '/styles.css');
    const jsFile = project.websiteData.files.find(f => f.path === '/script.js');

    if (!htmlFile) {
      setPreviewUrl(null);
      return;
    }

    let html = htmlFile.content;
    if (cssFile) {
      html = html.replace('</head>', `<style>${cssFile.content}</style></head>`);
    }
    if (jsFile) {
      html = html.replace('</body>', `<script>${jsFile.content}</script></body>`);
    }

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    setPreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [project.websiteData]);

  const handleClick = () => {
    router.push(`/p/${project.id}`);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(project.id);
  };

  const handleRemix = (e: React.MouseEvent) => {
    e.stopPropagation();
    // TODO: Implement remix functionality
    console.log('Remix project:', project.id);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/p/${project.id}`;
    navigator.clipboard.writeText(url);
    // TODO: Add toast notification
    console.log('Copied to clipboard:', url);
  };

  return (
    <div
      onClick={handleClick}
      className={`group p-4 rounded-2xl bg-white dark:bg-neutral-800/50 border border-zinc-200 dark:border-neutral-700/50 hover-scale cursor-pointer transition-all animate-fade-in-up stagger-${Math.min(index + 1, 6)}`}
    >
      {/* 16:9 Preview */}
      <div className="aspect-video rounded-xl overflow-hidden mb-3 relative bg-white dark:bg-zinc-900">
        {previewUrl ? (
          <iframe
            src={previewUrl}
            className="absolute top-0 left-0 w-[500%] h-[500%] origin-top-left scale-[0.2] pointer-events-none"
            title="Website preview"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${gradient}`} />
        )}
      </div>

      {/* Project info */}
      <div className="space-y-2">
        <h3 className="font-medium text-zinc-900 dark:text-white truncate">
          {project.name}
        </h3>

        {project.description && (
          <p className="text-xs text-zinc-500 dark:text-slate-400 line-clamp-2">
            {project.description}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-1 text-xs text-zinc-400">
            <Clock size={12} />
            <span>{formatRelativeTime(project.updated_at)}</span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={handleShare}
              className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-slate-300 hover:bg-zinc-100 dark:hover:bg-slate-700 rounded transition-colors"
              aria-label="Share"
              title="Copy link"
            >
              <Share2 size={14} />
            </button>
            <button
              onClick={handleRemix}
              className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-slate-300 hover:bg-zinc-100 dark:hover:bg-slate-700 rounded transition-colors"
              aria-label="Remix"
              title="Remix"
            >
              <Copy size={14} />
            </button>
            <button
              onClick={handleDelete}
              className="p-1.5 text-zinc-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
              aria-label="Delete"
              title="Delete"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
