'use client';

import React, { useState, useMemo } from 'react';
import { ChevronRight, ChevronDown, File, Folder, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileItem {
  path: string;
  content: string;
  type: string;
}

interface FileTreeNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileTreeNode[];
  icon?: React.ReactNode;
}

interface FileTreeEditorProps {
  files: FileItem[];
  selectedPath?: string;
  onFileSelect: (path: string) => void;
}

/**
 * Convert flat file array to tree structure
 */
function buildFileTree(files: FileItem[]): FileTreeNode {
  const root: FileTreeNode = {
    name: 'root',
    path: '/',
    type: 'folder',
    children: [],
  };

  // Sort files by path for consistent ordering
  const sortedFiles = [...files].sort((a, b) => a.path.localeCompare(b.path));

  sortedFiles.forEach(file => {
    const parts = file.path.split('/').filter(Boolean);
    let currentNode = root;

    // Navigate/create folder structure
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      let childNode = currentNode.children?.find(
        n => n.name === part && n.type === 'folder'
      );

      if (!childNode) {
        childNode = {
          name: part,
          path: '/' + parts.slice(0, i + 1).join('/'),
          type: 'folder',
          children: [],
        };
        if (!currentNode.children) currentNode.children = [];
        currentNode.children.push(childNode);
      }

      currentNode = childNode;
    }

    // Add file node
    const fileName = parts[parts.length - 1];
    const fileNode: FileTreeNode = {
      name: fileName,
      path: file.path,
      type: 'file',
    };

    if (!currentNode.children) currentNode.children = [];
    currentNode.children.push(fileNode);
  });

  // Sort children alphabetically (folders first)
  const sortChildren = (node: FileTreeNode) => {
    if (node.children) {
      node.children.sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === 'folder' ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });
      node.children.forEach(sortChildren);
    }
  };

  sortChildren(root);

  return root;
}

/**
 * Get icon for file type
 */
function getFileIcon(fileName: string, isFolder: boolean): React.ReactNode {
  if (isFolder) {
    return <Folder className="w-4 h-4 text-blue-500" />;
  }

  const ext = fileName.split('.').pop()?.toLowerCase();

  const iconMap: Record<string, React.ReactNode> = {
    tsx: <File className="w-4 h-4 text-blue-400" />,
    ts: <File className="w-4 h-4 text-blue-400" />,
    jsx: <File className="w-4 h-4 text-yellow-400" />,
    js: <File className="w-4 h-4 text-yellow-400" />,
    json: <File className="w-4 h-4 text-orange-400" />,
    css: <File className="w-4 h-4 text-pink-400" />,
    sql: <File className="w-4 h-4 text-green-400" />,
    md: <File className="w-4 h-4 text-gray-400" />,
    env: <File className="w-4 h-4 text-red-400" />,
  };

  return iconMap[ext || ''] || <File className="w-4 h-4 text-gray-400" />;
}

/**
 * Tree node component
 */
interface TreeNodeProps {
  node: FileTreeNode;
  level: number;
  selectedPath?: string;
  onFileSelect: (path: string) => void;
}

function TreeNode({ node, level, selectedPath, onFileSelect }: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(level < 2); // Expand first 2 levels by default
  const isFile = node.type === 'file';
  const isSelected = node.path === selectedPath;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const handleSelect = () => {
    if (isFile) {
      onFileSelect(node.path);
    }
  };

  return (
    <div className="select-none">
      <div
        onClick={handleSelect}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition',
          isSelected && 'bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-200'
        )}
        style={{ paddingLeft: `${level * 12 + 12}px` }}
      >
        {!isFile && node.children && node.children.length > 0 && (
          <button
            onClick={handleToggle}
            className="p-0 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-slate-500" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-500" />
            )}
          </button>
        )}
        {isFile && <div className="w-4" />}
        {getFileIcon(node.name, !isFile)}
        <span className="truncate font-medium text-slate-900 dark:text-slate-100">
          {node.name}
        </span>
      </div>

      {!isFile && isExpanded && node.children && node.children.length > 0 && (
        <div>
          {node.children.map(child => (
            <TreeNode
              key={child.path}
              node={child}
              level={level + 1}
              selectedPath={selectedPath}
              onFileSelect={onFileSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Main FileTreeEditor component
 */
export function FileTreeEditor({
  files,
  selectedPath,
  onFileSelect,
}: FileTreeEditorProps) {
  const tree = useMemo(() => buildFileTree(files), [files]);

  if (files.length === 0) {
    return (
      <div className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex items-center justify-center">
        <p className="text-sm text-slate-500 dark:text-slate-400">No files generated</p>
      </div>
    );
  }

  return (
    <div className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 overflow-y-auto">
      <div className="p-2">
        {/* Root folder view */}
        {tree.children && tree.children.length > 0 && (
          <div className="space-y-0">
            {tree.children.map(child => (
              <TreeNode
                key={child.path}
                node={child}
                level={0}
                selectedPath={selectedPath}
                onFileSelect={onFileSelect}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Utility: Get file count
 */
export function getFileCount(files: FileItem[]): {
  total: number;
  byType: Record<string, number>;
} {
  const byType: Record<string, number> = {};

  files.forEach(file => {
    const ext = file.type || 'unknown';
    byType[ext] = (byType[ext] || 0) + 1;
  });

  return {
    total: files.length,
    byType,
  };
}
