'use client';

import { useState, useEffect } from 'react';
import {
  X,
  Copy,
  Check,
  Globe,
  Loader2,
  Users,
  ChevronDown,
  Shield,
  ExternalLink,
  Edit3,
  Plus,
} from 'lucide-react';
import { useProjectStore } from '@/store/projectStore';
import { sanitizeSubdomain } from '@/utils/vercel';
import PublishSuccessOverlay from './PublishSuccessOverlay';

interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceType: 'project' | 'lead';
  leadId?: string;
  leadName?: string;
}

type PublishStep = 'configure' | 'publishing' | 'success';
type AccessLevel = 'public' | 'password' | 'private';

export default function PublishModal({
  isOpen,
  onClose,
  sourceType,
  leadId,
  leadName,
}: PublishModalProps) {
  const { project } = useProjectStore();

  const [step, setStep] = useState<PublishStep>('configure');
  const [subdomain, setSubdomain] = useState('');
  const [isEditingSubdomain, setIsEditingSubdomain] = useState(false);
  const [accessLevel, setAccessLevel] = useState<AccessLevel>('public');
  const [showAccessDropdown, setShowAccessDropdown] = useState(false);
  const [customDomain, setCustomDomain] = useState('');
  const [showCustomDomain, setShowCustomDomain] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deploymentUrl, setDeploymentUrl] = useState('');
  const [copied, setCopied] = useState(false);

  const baseDomain = process.env.NEXT_PUBLIC_PUBLISH_BASE_DOMAIN || 'vercel.app';

  // Generate default subdomain from project/lead name
  useEffect(() => {
    if (isOpen) {
      const name = sourceType === 'lead' && leadName
        ? leadName
        : project?.name || 'website';
      setSubdomain(sanitizeSubdomain(name));
      setStep('configure');
      setError(null);
    }
  }, [isOpen, project?.name, sourceType, leadName]);

  if (!isOpen) return null;

  const fullUrl = `https://${subdomain}.${baseDomain}`;

  const handlePublish = async () => {
    if (!project?.id || !subdomain) {
      setError('Missing required information');
      return;
    }

    setStep('publishing');
    setError(null);

    try {
      const response = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          sourceType,
          leadId: sourceType === 'lead' ? leadId : undefined,
          subdomain: sanitizeSubdomain(subdomain),
          accessLevel,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to publish');
      }

      setDeploymentUrl(data.publishedWebsite.deploymentUrl || fullUrl);
      setStep('success');
    } catch (err) {
      console.error('Publish failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to publish. Please try again.');
      setStep('configure');
    }
  };

  const handleCopyUrl = async () => {
    await navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const accessLevelOptions = [
    { value: 'public', label: 'Anyone', icon: Globe, description: 'Anyone with the link can view' },
    { value: 'password', label: 'Password protected', icon: Shield, description: 'Requires password to view' },
    { value: 'private', label: 'Private', icon: Users, description: 'Only invited users can view' },
  ];

  // Show success overlay
  if (step === 'success') {
    return (
      <PublishSuccessOverlay
        isOpen={true}
        onClose={onClose}
        deploymentUrl={deploymentUrl}
        subdomain={subdomain}
        projectName={sourceType === 'lead' && leadName ? leadName : project?.name || 'Website'}
      />
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md mx-4 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
              Publish
            </h3>
            <span className="px-2 py-0.5 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
              Live
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              0 Visitors
            </span>
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Subdomain Input */}
          <div>
            <div className="flex items-center gap-2 p-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
              {isEditingSubdomain ? (
                <input
                  type="text"
                  value={subdomain}
                  onChange={e => setSubdomain(sanitizeSubdomain(e.target.value))}
                  onBlur={() => setIsEditingSubdomain(false)}
                  autoFocus
                  className="flex-1 bg-transparent text-zinc-900 dark:text-white text-sm focus:outline-none"
                />
              ) : (
                <span className="flex-1 text-sm text-zinc-900 dark:text-white truncate">
                  {subdomain}
                </span>
              )}
              <span className="text-sm text-zinc-500 dark:text-zinc-400">
                .{baseDomain}
              </span>
              <button
                onClick={handleCopyUrl}
                className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>
            <div className="flex items-center gap-3 mt-2">
              <button
                onClick={() => setIsEditingSubdomain(true)}
                className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 flex items-center gap-1"
              >
                <Edit3 size={12} />
                Edit domain
              </button>
              <button
                onClick={() => setShowCustomDomain(!showCustomDomain)}
                className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 flex items-center gap-1"
              >
                <Plus size={12} />
                Add custom domain
              </button>
            </div>
          </div>

          {/* Custom Domain Input (collapsed by default) */}
          {showCustomDomain && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Custom Domain
              </label>
              <input
                type="text"
                value={customDomain}
                onChange={e => setCustomDomain(e.target.value)}
                placeholder="example.com"
                className="w-full px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                You&apos;ll need to add a CNAME record pointing to {baseDomain}
              </p>
            </div>
          )}

          {/* Website Info */}
          <div className="py-3 border-t border-b border-zinc-200 dark:border-zinc-700">
            <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
              Website info
            </h4>
            <div className="relative">
              <button
                onClick={() => setShowAccessDropdown(!showAccessDropdown)}
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Users size={16} className="text-zinc-400" />
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">
                    Who can access?
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-zinc-900 dark:text-white">
                    {accessLevelOptions.find(o => o.value === accessLevel)?.label}
                  </span>
                  <ChevronDown size={16} className={`text-zinc-400 transition-transform ${showAccessDropdown ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {/* Dropdown */}
              {showAccessDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-lg z-10 overflow-hidden">
                  {accessLevelOptions.map(option => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setAccessLevel(option.value as AccessLevel);
                        setShowAccessDropdown(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors ${
                        accessLevel === option.value ? 'bg-zinc-50 dark:bg-zinc-700/50' : ''
                      }`}
                    >
                      <option.icon size={16} className="text-zinc-400" />
                      <div className="text-left">
                        <div className="text-sm font-medium text-zinc-900 dark:text-white">
                          {option.label}
                        </div>
                        <div className="text-xs text-zinc-500 dark:text-zinc-400">
                          {option.description}
                        </div>
                      </div>
                      {accessLevel === option.value && (
                        <Check size={16} className="ml-auto text-green-500" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
          <button
            className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 flex items-center gap-2"
          >
            <Shield size={14} />
            Review security
          </button>
          <button
            onClick={handlePublish}
            disabled={step === 'publishing' || !subdomain}
            className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {step === 'publishing' ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Publishing...
              </>
            ) : (
              <>
                <ExternalLink size={16} />
                Publish
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
