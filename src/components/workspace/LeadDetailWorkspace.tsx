'use client';

import { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  ChevronDown,
  Copy,
  Check,
  Mail,
  Phone,
  Globe,
  Star,
  ExternalLink,
  Loader2,
  ChevronUp,
  Link2,
  Send,
  AlertCircle,
  RefreshCw,
  Trash2,
  ImagePlus,
  X,
  Rocket,
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { useProjectStore } from '@/store/projectStore';
import type { Lead } from '@/types/database';
import { useCanvasBackground } from '@/hooks/useCanvasBackground';
import PublishModal from '@/components/publish/PublishModal';

interface LeadDetailWorkspaceProps {
  leadId: string;
}

export default function LeadDetailWorkspace({ leadId }: LeadDetailWorkspaceProps) {
  const {
    artifacts,
    setCanvasState,
    updateLeadStatus,
    project,
    startTool,
    updateToolStage,
    completeTool,
    failTool,
  } = useProjectStore();
  const { isDark } = useCanvasBackground();

  // Find the lead
  const lead = artifacts.leads?.leads.find(l => l.id === leadId);

  // UI state
  const [copied, setCopied] = useState<string | null>(null);
  const [showInfoPanel, setShowInfoPanel] = useState(true);
  const [sendDropdownOpen, setSendDropdownOpen] = useState(false);
  const [iframeLoading, setIframeLoading] = useState(true);
  const [iframeError, setIframeError] = useState(false);
  const [generatingWebsite, setGeneratingWebsite] = useState(false);
  const [websiteError, setWebsiteError] = useState<string | null>(null);
  const [websiteProgress, setWebsiteProgress] = useState<{
    stages: Array<{ id: string; message: string; status: 'pending' | 'active' | 'complete' }>;
  } | null>(null);

  // Design reference screenshot state
  const [designScreenshot, setDesignScreenshot] = useState<{
    file: File | null;
    preview: string | null;
    uploading: boolean;
  }>({ file: null, preview: null, uploading: false });
  const screenshotInputRef = useRef<HTMLInputElement>(null);

  // Publish modal state
  const [showPublishModal, setShowPublishModal] = useState(false);

  // Styling
  const bgPrimary = isDark ? 'bg-neutral-950' : 'bg-white';
  const bgSecondary = isDark ? 'bg-neutral-900' : 'bg-zinc-50';
  const textPrimary = isDark ? 'text-white' : 'text-zinc-900';
  const textSecondary = isDark ? 'text-zinc-400' : 'text-zinc-600';
  const borderColor = isDark ? 'border-neutral-800' : 'border-zinc-200';

  // Keyboard shortcut: Escape to go back
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !sendDropdownOpen) {
        handleBack();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sendDropdownOpen]);

  // Reset iframe state when lead changes
  useEffect(() => {
    setIframeLoading(true);
    setIframeError(false);
  }, [leadId]);

  // Handle copy
  const handleCopy = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  // Handle back navigation
  const handleBack = () => {
    setCanvasState({ type: 'detail', view: 'leads' });
  };

  // Handle send to customer actions
  const handleCopyPreviewLink = async () => {
    if (!lead?.previewToken) return;
    const url = `${window.location.origin}/preview/${lead.previewToken}`;
    await navigator.clipboard.writeText(url);
    setCopied('preview-link');
    setSendDropdownOpen(false);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleOpenEmailComposer = () => {
    if (!lead?.contactEmail || !lead?.previewToken) return;
    const previewUrl = `${window.location.origin}/preview/${lead.previewToken}`;
    const subject = encodeURIComponent(`Website Preview for ${lead.companyName}`);
    const body = encodeURIComponent(`Hi,\n\nI've created a website preview for ${lead.companyName}. You can view it here:\n\n${previewUrl}\n\nLet me know what you think!\n\nBest regards`);
    window.open(`mailto:${lead.contactEmail}?subject=${subject}&body=${body}`, '_blank');
    setSendDropdownOpen(false);
  };

  // Handle redo website (regenerate)
  const handleRedoWebsite = () => {
    handleGenerateImprovedWebsite();
  };

  // Handle delete website
  const handleDeleteWebsite = async () => {
    if (!lead?.id || !project?.id) return;
    if (!confirm(`Delete the website preview for ${lead.companyName}? This cannot be undone.`)) return;

    try {
      const supabase = createClient();

      // Delete website_code artifact
      await (supabase.from('artifacts') as any)
        .delete()
        .eq('project_id', project.id)
        .eq('type', 'website_code');

      // Clear the preview token from the lead
      const updatedLeads = artifacts.leads?.leads.map(l =>
        l.id === lead.id ? { ...l, previewToken: undefined } : l
      );

      if (updatedLeads && artifacts.leads) {
        // Update leads artifact in database
        await (supabase.from('artifacts') as any)
          .update({ data: { leads: updatedLeads } })
          .eq('project_id', project.id)
          .eq('type', 'leads');
      }

      // Reload to refresh state
      window.location.reload();
    } catch (error) {
      console.error('Failed to delete website:', error);
    }
  };

  // Initialize progress with optimistic stages
  const initializeProgress = () => {
    setWebsiteProgress({
      stages: [
        { id: 'validation', message: 'Validating inputs...', status: 'active' },
        { id: 'fetch', message: 'Fetching website content...', status: 'pending' },
        { id: 'analysis', message: 'Analyzing structure...', status: 'pending' },
        { id: 'generation', message: 'Generating website...', status: 'pending' },
        { id: 'database', message: 'Saving preview...', status: 'pending' },
      ],
    });
  };

  // Update stage status based on progress marker
  const updateStageStatus = (stage: string, message: string) => {
    setWebsiteProgress(prev => {
      if (!prev) return prev;

      const stageIndex = prev.stages.findIndex(s => s.id === stage);
      if (stageIndex === -1) return prev;

      // Update stages array
      const updatedStages = prev.stages.map((s, idx): typeof s => {
        if (s.id === stage) {
          return { ...s, status: 'active' as const, message };
        }
        // Mark previous stages as complete
        if (idx < stageIndex) {
          return { ...s, status: 'complete' as const };
        }
        return s;
      });

      return { ...prev, stages: updatedStages };
    });
  };

  // Handle generate improved website from existing URL
  const handleGenerateImprovedWebsite = async () => {
    if (!lead?.website || !lead.id || !project?.id) return;

    const startTime = Date.now();
    setGeneratingWebsite(true);
    setWebsiteError(null);
    initializeProgress();

    // Start tool in global store (shows in chat)
    startTool('generate_lead_website');

    try {
      // Upload design reference screenshot if provided
      let designReferenceUrl: string | undefined;
      if (designScreenshot.file) {
        setDesignScreenshot(prev => ({ ...prev, uploading: true }));
        updateToolStage('generate_lead_website', 'Uploading design reference...');

        try {
          const formData = new FormData();
          formData.append('file', designScreenshot.file);
          formData.append('projectId', project.id);

          const uploadRes = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });

          if (uploadRes.ok) {
            const { url } = await uploadRes.json();
            designReferenceUrl = url;
            console.log('[GenerateWebsite] Design reference uploaded:', url);
          } else {
            console.warn('[GenerateWebsite] Failed to upload design reference');
          }
        } catch (uploadError) {
          console.warn('[GenerateWebsite] Error uploading design reference:', uploadError);
          // Continue without design reference
        } finally {
          setDesignScreenshot(prev => ({ ...prev, uploading: false }));
        }
      }

      const response = await fetch(`/api/leads/${lead.id}/generate-website`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          industry: lead.industry,
          businessName: lead.companyName,
          projectId: project.id,
          websiteUrl: lead.website, // Pass source website URL
          designReferenceUrl, // Pass design reference if uploaded
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start website generation');
      }

      // Check if streaming is supported
      if (!response.body) {
        throw new Error('Streaming not supported');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      // Read stream
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;

          // Parse SSE message
          const eventMatch = line.match(/^event: (.+)$/m);
          const dataMatch = line.match(/^data: (.+)$/m);

          if (!eventMatch || !dataMatch) continue;

          const event = eventMatch[1];
          const data = JSON.parse(dataMatch[1]);

          if (event === 'progress') {
            updateStageStatus(data.stage, data.message);
            // Also update global store for chat display
            updateToolStage('generate_lead_website', data.message);
          } else if (event === 'success') {
            // Mark all stages complete
            setWebsiteProgress(prev => prev ? {
              ...prev,
              stages: prev.stages.map(s => ({ ...s, status: 'complete' })),
            } : null);

            // Mark complete in global store
            const duration = `${((Date.now() - startTime) / 1000).toFixed(1)}s`;
            completeTool('generate_lead_website', duration);

            // Reload to show new preview
            setTimeout(() => window.location.reload(), 500);
          } else if (event === 'error') {
            failTool('generate_lead_website', data.error || 'Generation failed');
            throw new Error(data.error || 'Generation failed');
          }
        }
      }
    } catch (error) {
      console.error('[GenerateWebsite] Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate improved website';
      failTool('generate_lead_website', errorMessage);
      setWebsiteError(errorMessage);
      setWebsiteProgress(null);
    } finally {
      setGeneratingWebsite(false);
    }
  };

  // If lead not found
  if (!lead) {
    return (
      <div className={`h-full flex items-center justify-center ${bgPrimary}`}>
        <div className="text-center">
          <p className={textSecondary}>Lead not found</p>
          <button
            onClick={handleBack}
            className={`mt-4 px-4 py-2 text-sm font-medium ${isDark ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-zinc-100 hover:bg-zinc-200'} rounded-lg transition-colors`}
          >
            Back to Pipeline
          </button>
        </div>
      </div>
    );
  }

  // Get preview URL
  const previewUrl = lead.previewToken ? `/preview/${lead.previewToken}` : null;
  const hasWebsite = !!previewUrl;

  return (
    <div className={`h-full flex flex-col ${bgPrimary}`}>
      {/* Header - Compact */}
      <div className={`flex items-center px-4 py-2 border-b ${borderColor} shrink-0`}>
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            className={`p-1.5 rounded-lg ${isDark ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100'} transition-colors group relative`}
            title="Press Escape to go back"
          >
            <ArrowLeft size={16} className={textSecondary} />
            <span className={`absolute left-full ml-1 px-1.5 py-0.5 text-[10px] font-mono ${isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-zinc-100 text-zinc-500'} rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap`}>
              Esc
            </span>
          </button>
          <div className="flex items-center gap-2">
            <h2 className={`text-sm font-medium ${textPrimary}`}>{lead.companyName}</h2>
            <span className={`text-xs ${textSecondary}`}>·</span>
            <span className={`text-xs ${textSecondary}`}>{lead.industry}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Website Preview */}
        <div className="flex-1 overflow-hidden">
          {hasWebsite ? (
            <div className="h-full flex flex-col">
              {/* Browser Chrome with Actions */}
              <div className={`flex items-center gap-2 px-4 py-2 border-b ${borderColor} ${bgSecondary}`}>
                {/* Traffic lights */}
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                </div>

                {/* URL bar */}
                <div className={`flex-1 px-3 py-1 rounded text-xs ${isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-white text-zinc-500'} truncate`}>
                  {window.location.origin}{previewUrl}
                </div>

                {/* Action Buttons */}
                {/* Redo Website */}
                <button
                  onClick={handleRedoWebsite}
                  disabled={generatingWebsite}
                  title="Regenerate website"
                  className={`p-1.5 rounded ${isDark ? 'hover:bg-zinc-700' : 'hover:bg-zinc-200'} transition-colors disabled:opacity-50`}
                >
                  <RefreshCw size={14} className={`${textSecondary} ${generatingWebsite ? 'animate-spin' : ''}`} />
                </button>

                {/* Delete Website */}
                <button
                  onClick={handleDeleteWebsite}
                  title="Delete website"
                  className={`p-1.5 rounded ${isDark ? 'hover:bg-zinc-700 hover:text-red-400' : 'hover:bg-zinc-200 hover:text-red-500'} transition-colors`}
                >
                  <Trash2 size={14} className={textSecondary} />
                </button>

                {/* Divider */}
                <div className={`w-px h-4 ${isDark ? 'bg-zinc-700' : 'bg-zinc-300'}`} />

                {/* Send to Customer Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setSendDropdownOpen(!sendDropdownOpen)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                      isDark
                        ? 'bg-zinc-800 hover:bg-zinc-700 text-white'
                        : 'bg-white hover:bg-zinc-100 text-zinc-900 border border-zinc-200'
                    }`}
                  >
                    <Send size={12} />
                    Send
                    <ChevronDown size={12} />
                  </button>

                  {sendDropdownOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setSendDropdownOpen(false)}
                      />
                      <div className={`absolute right-0 top-full mt-2 z-20 w-56 rounded-lg border ${borderColor} ${isDark ? 'bg-zinc-900' : 'bg-white'} shadow-lg py-1`}>
                        <button
                          onClick={handleCopyPreviewLink}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm ${isDark ? 'hover:bg-zinc-800' : 'hover:bg-zinc-50'} transition-colors`}
                        >
                          {copied === 'preview-link' ? (
                            <Check size={16} className="text-green-500" />
                          ) : (
                            <Link2 size={16} className={textSecondary} />
                          )}
                          <span className={textPrimary}>
                            {copied === 'preview-link' ? 'Copied!' : 'Copy Preview Link'}
                          </span>
                        </button>
                        <button
                          onClick={handleOpenEmailComposer}
                          disabled={!lead.contactEmail}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm ${isDark ? 'hover:bg-zinc-800' : 'hover:bg-zinc-50'} transition-colors disabled:opacity-50`}
                        >
                          <Mail size={16} className={textSecondary} />
                          <span className={textPrimary}>Open Email Composer</span>
                        </button>
                        <a
                          href={previewUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm ${isDark ? 'hover:bg-zinc-800' : 'hover:bg-zinc-50'} transition-colors`}
                        >
                          <ExternalLink size={16} className={textSecondary} />
                          <span className={textPrimary}>Open in New Tab</span>
                        </a>
                        <div className={`my-1 border-t ${borderColor}`} />
                        <button
                          onClick={() => {
                            setSendDropdownOpen(false);
                            setShowPublishModal(true);
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm ${isDark ? 'hover:bg-zinc-800' : 'hover:bg-zinc-50'} transition-colors`}
                        >
                          <Rocket size={16} className={textSecondary} />
                          <span className={textPrimary}>Publish to Custom Domain</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {/* External link (quick access) */}
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`p-1.5 rounded ${isDark ? 'hover:bg-zinc-700' : 'hover:bg-zinc-200'} transition-colors`}
                  title="Open in new tab"
                >
                  <ExternalLink size={14} className={textSecondary} />
                </a>
              </div>

              {/* iFrame */}
              <div className="flex-1 relative">
                {iframeLoading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <Loader2 size={32} className="animate-spin text-blue-500 mx-auto mb-2" />
                      <p className={`text-sm ${textSecondary}`}>Loading preview...</p>
                    </div>
                  </div>
                )}
                {iframeError ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center max-w-sm">
                      <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl ${isDark ? 'bg-red-500/10' : 'bg-red-50'} flex items-center justify-center`}>
                        <Globe size={32} className="text-red-400" />
                      </div>
                      <h3 className={`text-lg font-semibold ${textPrimary} mb-2`}>Preview Unavailable</h3>
                      <p className={`text-sm ${textSecondary} mb-4`}>
                        The preview could not be loaded. It may have expired or been removed.
                      </p>
                      <a
                        href={previewUrl!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium ${isDark ? 'bg-blue-600 hover:bg-blue-500' : 'bg-blue-500 hover:bg-blue-600'} text-white rounded-lg transition-colors`}
                      >
                        <ExternalLink size={16} />
                        Try Opening Directly
                      </a>
                    </div>
                  </div>
                ) : (
                  <iframe
                    src={previewUrl!}
                    className={`w-full h-full border-0 ${iframeLoading ? 'opacity-0' : 'opacity-100'} transition-opacity`}
                    title={`Preview for ${lead.companyName}`}
                    onLoad={() => setIframeLoading(false)}
                    onError={() => {
                      setIframeLoading(false);
                      setIframeError(true);
                    }}
                  />
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center max-w-sm">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl ${isDark ? 'bg-zinc-800' : 'bg-zinc-100'} flex items-center justify-center`}>
                  <Globe size={32} className={textSecondary} />
                </div>
                <h3 className={`text-lg font-semibold ${textPrimary} mb-2`}>No Website Preview Yet</h3>
                <p className={`text-sm ${textSecondary} mb-4`}>
                  {lead.website
                    ? 'Generate an improved version of their website to send them a personalized demo.'
                    : 'Generate a website preview for this lead to send them a personalized demo.'}
                </p>

                {websiteProgress && (
                  <div className={`mb-4 p-4 rounded-lg ${isDark ? 'bg-zinc-800 border border-zinc-700' : 'bg-zinc-100 border border-zinc-200'}`}>
                    <div className="space-y-3">
                      {websiteProgress.stages.map(stage => (
                        <div key={stage.id} className="flex items-center gap-2">
                          {stage.status === 'complete' && (
                            <Loader2 size={14} className="text-green-500 flex-shrink-0" />
                          )}
                          {stage.status === 'active' && (
                            <Loader2 size={14} className="animate-spin text-blue-500 flex-shrink-0" />
                          )}
                          {stage.status === 'pending' && (
                            <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-300 flex-shrink-0" />
                          )}
                          <span className={`text-sm ${
                            stage.status === 'complete' ? `${isDark ? 'text-zinc-300' : 'text-zinc-600'}` :
                            stage.status === 'active' ? `${isDark ? 'text-blue-300 font-medium' : 'text-blue-600 font-medium'}` :
                            `${isDark ? 'text-zinc-500' : 'text-zinc-400'}`
                          }`}>
                            {stage.message}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {websiteError && (
                  <div className={`mb-4 p-4 rounded-lg ${isDark ? 'bg-red-900/20 border border-red-800' : 'bg-red-50 border border-red-200'}`}>
                    <div className="flex items-start gap-3">
                      <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h4 className={`text-sm font-semibold mb-1 ${isDark ? 'text-red-400' : 'text-red-700'}`}>
                          Website Generation Failed
                        </h4>
                        <p className={`text-sm mb-3 ${isDark ? 'text-red-300' : 'text-red-600'}`}>
                          {websiteError}
                        </p>

                        {/* Recovery tips based on error type */}
                        {websiteError.includes('timeout') && (
                          <p className={`text-xs mb-3 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                            💡 Try generating without the URL to skip website analysis
                          </p>
                        )}
                        {websiteError.includes('rate limit') && (
                          <p className={`text-xs mb-3 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                            💡 The AI service is busy. Wait 1-2 minutes before retrying
                          </p>
                        )}
                        {websiteError.includes('not found') && (
                          <p className={`text-xs mb-3 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                            💡 Double-check the website URL in the lead details
                          </p>
                        )}
                        {websiteError.includes('SSL') && (
                          <p className={`text-xs mb-3 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                            💡 This website may have security certificate issues
                          </p>
                        )}

                        <button
                          onClick={() => {
                            setWebsiteError(null);
                            handleGenerateImprovedWebsite();
                          }}
                          className={`px-4 py-2 text-sm font-medium rounded-lg ${isDark ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}
                        >
                          Try Again
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {lead.website && (
                  <div className="flex flex-col items-center gap-3">
                    {/* Screenshot upload for design reference */}
                    <input
                      ref={screenshotInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setDesignScreenshot({
                            file,
                            preview: URL.createObjectURL(file),
                            uploading: false,
                          });
                        }
                      }}
                    />

                    <div className="flex items-center gap-2">
                      {designScreenshot.preview ? (
                        <div className="relative group">
                          <img
                            src={designScreenshot.preview}
                            alt="Design reference"
                            className={`w-24 h-16 object-cover rounded-lg border-2 ${isDark ? 'border-zinc-700' : 'border-zinc-300'}`}
                          />
                          <button
                            onClick={() => {
                              if (designScreenshot.preview) {
                                URL.revokeObjectURL(designScreenshot.preview);
                              }
                              setDesignScreenshot({ file: null, preview: null, uploading: false });
                            }}
                            className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shadow-sm transition-colors"
                          >
                            <X size={12} />
                          </button>
                          <span className={`text-xs ${textSecondary} mt-1 block text-center`}>Design ref</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => screenshotInputRef.current?.click()}
                          disabled={generatingWebsite}
                          className={`px-3 py-2 text-sm border-2 border-dashed rounded-lg transition-colors flex items-center gap-2 ${
                            isDark
                              ? 'border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300'
                              : 'border-zinc-300 text-zinc-500 hover:border-zinc-400 hover:text-zinc-600'
                          } ${generatingWebsite ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <ImagePlus size={16} />
                          <span>Add design reference</span>
                        </button>
                      )}
                    </div>

                    {/* Generate button */}
                    <button
                      onClick={handleGenerateImprovedWebsite}
                      disabled={generatingWebsite || designScreenshot.uploading}
                      className={`px-4 py-2 text-sm font-medium flex items-center justify-center gap-2 rounded-lg transition-colors ${
                        generatingWebsite || designScreenshot.uploading
                          ? isDark
                            ? 'bg-zinc-700 text-zinc-400 cursor-not-allowed'
                            : 'bg-zinc-300 text-zinc-500 cursor-not-allowed'
                          : isDark
                            ? 'bg-blue-600 hover:bg-blue-500 text-white'
                            : 'bg-blue-500 hover:bg-blue-600 text-white'
                      }`}
                    >
                      {(generatingWebsite || designScreenshot.uploading) && <Loader2 size={16} className="animate-spin" />}
                      {designScreenshot.uploading
                        ? 'Uploading design...'
                        : generatingWebsite
                          ? 'Generating...'
                          : designScreenshot.file
                            ? 'Generate with Design Reference'
                            : 'Generate Improved Website'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Collapsible Lead Info Bar */}
        <div className={`border-t ${borderColor}`}>
          <button
            onClick={() => setShowInfoPanel(!showInfoPanel)}
            className={`w-full flex items-center justify-between px-4 py-2 ${bgSecondary} ${isDark ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100'} transition-colors`}
          >
            <span className={`text-sm font-medium ${textPrimary}`}>Lead Details</span>
            {showInfoPanel ? (
              <ChevronDown size={16} className={textSecondary} />
            ) : (
              <ChevronUp size={16} className={textSecondary} />
            )}
          </button>

          {showInfoPanel && (
            <div className={`p-4 ${bgSecondary} space-y-3`}>
              <div className="flex flex-wrap gap-4">
                {/* Contact Info */}
                {lead.contactEmail && (
                  <div className="flex items-center gap-2">
                    <Mail size={14} className={textSecondary} />
                    <span className={`text-sm ${textPrimary}`}>{lead.contactEmail}</span>
                    <button
                      onClick={() => handleCopy(lead.contactEmail!, 'email')}
                      className={`p-1 rounded ${isDark ? 'hover:bg-zinc-700' : 'hover:bg-zinc-200'}`}
                    >
                      {copied === 'email' ? (
                        <Check size={12} className="text-green-500" />
                      ) : (
                        <Copy size={12} className={textSecondary} />
                      )}
                    </button>
                  </div>
                )}

                {lead.phone && (
                  <div className="flex items-center gap-2">
                    <Phone size={14} className={textSecondary} />
                    <span className={`text-sm ${textPrimary}`}>{lead.phone}</span>
                    <button
                      onClick={() => handleCopy(lead.phone!, 'phone')}
                      className={`p-1 rounded ${isDark ? 'hover:bg-zinc-700' : 'hover:bg-zinc-200'}`}
                    >
                      {copied === 'phone' ? (
                        <Check size={12} className="text-green-500" />
                      ) : (
                        <Copy size={12} className={textSecondary} />
                      )}
                    </button>
                  </div>
                )}

                {lead.website && (
                  <a
                    href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 hover:text-blue-500 transition-colors"
                  >
                    <Globe size={14} className={textSecondary} />
                    <span className={`text-sm ${textPrimary}`}>{lead.website}</span>
                    <ExternalLink size={12} className={textSecondary} />
                  </a>
                )}
              </div>

              {/* Score & Status */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className={`text-xs ${textSecondary}`}>Score:</span>
                  <span className={`text-sm font-medium ${textPrimary}`}>{lead.score}/100</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-xs ${textSecondary}`}>ICP:</span>
                  <span className={`text-sm font-medium ${textPrimary}`}>{lead.icpScore}/10</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-xs ${textSecondary}`}>Status:</span>
                  <select
                    value={lead.status}
                    onChange={(e) => updateLeadStatus(lead.id, e.target.value as Lead['status'])}
                    className={`text-sm px-2 py-1 rounded ${isDark ? 'bg-zinc-800 text-white border-zinc-700' : 'bg-white text-zinc-900 border-zinc-200'} border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  >
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="responded">Responded</option>
                    <option value="closed">Closed</option>
                    <option value="lost">Lost</option>
                  </select>
                </div>

                {lead.rating && (
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={14}
                        className={star <= lead.rating! ? 'text-yellow-400 fill-yellow-400' : textSecondary}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Publish Modal */}
      <PublishModal
        isOpen={showPublishModal}
        onClose={() => setShowPublishModal(false)}
        sourceType="lead"
        leadId={lead.id}
        leadName={lead.companyName}
      />
    </div>
  );
}
