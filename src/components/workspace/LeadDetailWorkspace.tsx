'use client';

import { useState, useEffect, useMemo } from 'react';
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
  Trash2,
  Rocket,
  FileText,
  Image,
  Palette,
  Wand2,
  RefreshCw,
  CreditCard,
  DollarSign,
  Code,
  MousePointer2,
  RotateCw,
  FolderTree,
  File,
  ChevronRight,
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { useProjectStore } from '@/store/projectStore';
import type { Lead } from '@/types/database';
import { useCanvasBackground } from '@/hooks/useCanvasBackground';
import PublishModal from '@/components/publish/PublishModal';
import GetPaidModal from '@/components/workspace/GetPaidModal';
import type { ExtractedContent } from '@/lib/services/websiteAnalyzer';

interface LeadDetailWorkspaceProps {
  leadId: string;
}

export default function LeadDetailWorkspace({ leadId }: LeadDetailWorkspaceProps) {
  const {
    artifacts,
    setCanvasState,
    updateLeadStatus,
    project,
    refreshArtifact,
  } = useProjectStore();
  const { isDark } = useCanvasBackground();

  // Find the lead
  const lead = artifacts.leads?.leads.find(l => l.id === leadId);

  // UI state
  const [copied, setCopied] = useState<string | null>(null);
  const [showInfoPanel, setShowInfoPanel] = useState(true);
  const [sendDropdownOpen, setSendDropdownOpen] = useState<false | 'send' | 'pages'>(false);
  const [iframeLoading, setIframeLoading] = useState(true);
  const [iframeError, setIframeError] = useState(false);

  // Extracted content state
  const [extractedContent, setExtractedContent] = useState<ExtractedContent | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);

  // Editable colors state - starts from extracted, user can modify before generation
  const [editableColors, setEditableColors] = useState<Array<{ hex: string; usage: string }>>([]);

  // Publish modal state
  const [showPublishModal, setShowPublishModal] = useState(false);

  // Get Paid modal state
  const [showGetPaidModal, setShowGetPaidModal] = useState(false);

  // Website generation state
  const [isGeneratingWebsite, setIsGeneratingWebsite] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<{
    message: string;
    step: number;
  } | null>(null);

  // Lead website files state (for srcDoc pattern)
  const [leadWebsiteData, setLeadWebsiteData] = useState<{
    files: Array<{ path: string; content: string; type: string }>;
    version: number;
  } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Code viewer state
  const [showCodePanel, setShowCodePanel] = useState(false);
  const [selectedFilePath, setSelectedFilePath] = useState<string>('/index.html');

  // Cursor mode state
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedElementInfo, setSelectedElementInfo] = useState<{
    selector: string;
    tagName: string;
    text?: string;
  } | null>(null);

  // Styling - use zinc-900 for dark mode (gray, not black)
  const bgPrimary = isDark ? 'bg-zinc-900' : 'bg-white';
  const bgSecondary = isDark ? 'bg-zinc-800' : 'bg-zinc-50';
  const textPrimary = isDark ? 'text-white' : 'text-zinc-900';
  const textSecondary = isDark ? 'text-zinc-400' : 'text-zinc-600';
  const borderColor = isDark ? 'border-neutral-800' : 'border-zinc-200';

  // Fetch lead website files when lead has a preview token
  useEffect(() => {
    const fetchLeadWebsiteFiles = async () => {
      if (!lead?.previewToken || !project?.id) return;

      try {
        const supabase = createClient();
        const { data: artifact } = await (supabase
          .from('artifacts') as any)
          .select('*')
          .eq('project_id', project.id)
          .eq('type', 'lead_website')
          .single();

        if (artifact?.data?.websites) {
          const website = artifact.data.websites.find(
            (w: any) => w.previewToken === lead.previewToken
          );
          if (website?.files) {
            setLeadWebsiteData({
              files: website.files,
              version: artifact.version || 1,
            });
          }
        }
      } catch (error) {
        console.error('[LeadDetail] Failed to fetch website files:', error);
      }
    };

    fetchLeadWebsiteFiles();
  }, [lead?.previewToken, project?.id, refreshKey]);

  // Build preview HTML using srcDoc pattern (like agency website)
  const previewHtml = useMemo(() => {
    if (!leadWebsiteData?.files?.length) return null;

    const files = leadWebsiteData.files;
    const currentPath = selectedFilePath || '/index.html';

    // Find the selected HTML file
    const htmlFile = files.find(f => f.path === currentPath && f.path.endsWith('.html'))
      || files.find(f => f.path === '/index.html');

    if (!htmlFile) return null;

    let html = htmlFile.content;

    // Inline CSS
    const cssFile = files.find(f => f.path === '/styles.css');
    if (cssFile) {
      html = html.replace('</head>', `<style>${cssFile.content}</style></head>`);
    }

    // Inline JS
    const jsFile = files.find(f => f.path === '/script.js');
    if (jsFile) {
      html = html.replace('</body>', `<script>${jsFile.content}</script></body>`);
    }

    // Navigation script for multi-page support
    const navScript = `<script data-nav-handler="true">
(function() {
  document.addEventListener('click', function(e) {
    var link = e.target.closest('a');
    if (!link || !link.href) return;
    var href = link.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('http://') || href.startsWith('https://')) {
      if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
        e.preventDefault();
        window.open(href, '_blank');
      }
      return;
    }
    e.preventDefault();
    var path = href;
    if (path === '/') path = '/index.html';
    else if (!path.endsWith('.html')) path = path.replace(/\\/$/, '') + '/index.html';
    if (!path.startsWith('/')) path = '/' + path;
    window.parent.postMessage({ type: 'navigate-page', path: path }, '*');
  }, true);
})();
</script>`;
    html = html.replace('</body>', `${navScript}</body>`);

    // Selection script when in cursor mode
    if (isSelectMode) {
      const selectionScript = `<script data-select-mode="true">
(function() {
  let highlightEl = null;
  const originalOutlines = new WeakMap();
  var sectionTags = ['SECTION', 'HEADER', 'FOOTER', 'NAV', 'MAIN', 'ASIDE', 'ARTICLE'];
  function findSelectableElement(el) {
    if (sectionTags.includes(el.tagName)) return el;
    var className = el.className || '';
    if (typeof className === 'string') {
      var lowerClass = className.toLowerCase();
      if (lowerClass.includes('hero') || lowerClass.includes('section') || lowerClass.includes('header') || lowerClass.includes('footer') || lowerClass.includes('container')) return el;
    }
    var rect = el.getBoundingClientRect();
    if (rect.width < 50 && rect.height < 50) {
      var parent = el.parentElement;
      while (parent && parent.tagName !== 'BODY') {
        var parentRect = parent.getBoundingClientRect();
        if (parentRect.width > rect.width * 2 || parentRect.height > rect.height * 2) return parent;
        parent = parent.parentElement;
      }
    }
    return el;
  }
  function getFriendlyName(el) {
    var tag = el.tagName.toLowerCase();
    var className = el.className || '';
    if (typeof className === 'string') {
      var lowerClass = className.toLowerCase();
      if (lowerClass.includes('hero')) return 'hero section';
      if (lowerClass.includes('header') && tag !== 'header') return 'header area';
      if (lowerClass.includes('footer') && tag !== 'footer') return 'footer area';
      if (lowerClass.includes('nav')) return 'navigation';
      if (lowerClass.includes('cta')) return 'call-to-action';
      if (lowerClass.includes('testimonial')) return 'testimonials';
      if (lowerClass.includes('feature')) return 'features';
      if (lowerClass.includes('pricing')) return 'pricing';
      if (lowerClass.includes('contact')) return 'contact section';
    }
    if (tag === 'header') return 'header';
    if (tag === 'footer') return 'footer';
    if (tag === 'nav') return 'navigation';
    if (tag === 'section') return 'section';
    return tag;
  }
  document.addEventListener('mouseover', function(e) {
    var target = findSelectableElement(e.target);
    if (highlightEl && highlightEl !== target) {
      highlightEl.style.outline = originalOutlines.get(highlightEl) || '';
    }
    highlightEl = target;
    originalOutlines.set(highlightEl, highlightEl.style.outline);
    highlightEl.style.outline = '2px solid #3b82f6';
    highlightEl.style.outlineOffset = '2px';
  }, true);
  document.addEventListener('mouseout', function(e) {
    if (e.target && originalOutlines.has(e.target)) {
      e.target.style.outline = originalOutlines.get(e.target) || '';
    }
  }, true);
  document.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    var target = findSelectableElement(e.target);
    var selector = getSelector(target);
    var friendlyName = getFriendlyName(target);
    window.parent.postMessage({ type: 'element-selected', selector: selector, tagName: friendlyName, text: (target.textContent || '').trim().slice(0, 50) }, '*');
  }, true);
  function getSelector(el) {
    if (el.id) return '#' + el.id;
    if (el.className && typeof el.className === 'string') {
      var classes = el.className.trim().split(/\\s+/).filter(function(c) { return c; });
      if (classes.length) {
        var classSelector = el.tagName.toLowerCase() + '.' + classes.join('.');
        try { if (document.querySelectorAll(classSelector).length === 1) return classSelector; } catch(e) {}
      }
    }
    var path = [];
    while (el && el.nodeType === 1 && el.tagName !== 'HTML') {
      var sel = el.tagName.toLowerCase();
      if (el.id) { path.unshift('#' + el.id); break; }
      if (el.className && typeof el.className === 'string') {
        var fc = el.className.trim().split(/\\s+/)[0];
        if (fc) sel += '.' + fc;
      }
      path.unshift(sel);
      el = el.parentElement;
    }
    return path.join(' > ');
  }
})();
</script>`;
      html = html.replace('</body>', `${selectionScript}</body>`);
    }

    return html;
  }, [leadWebsiteData, selectedFilePath, isSelectMode]);

  // Get list of HTML pages for navigation
  const htmlPages = useMemo(() => {
    if (!leadWebsiteData?.files?.length) return [];
    return leadWebsiteData.files
      .filter(f => f.path.endsWith('.html'))
      .map(f => {
        let displayPath = f.path;
        if (displayPath === '/index.html') displayPath = '/';
        else if (displayPath.endsWith('/index.html')) displayPath = displayPath.replace('/index.html', '');
        else displayPath = displayPath.replace('.html', '');
        return { path: f.path, displayPath };
      })
      .sort((a, b) => {
        if (a.displayPath === '/') return -1;
        if (b.displayPath === '/') return 1;
        return a.displayPath.localeCompare(b.displayPath);
      });
  }, [leadWebsiteData?.files]);

  // Get current page display name
  const currentPageDisplay = useMemo(() => {
    const page = htmlPages.find(p => p.path === selectedFilePath);
    return page?.displayPath || '/';
  }, [htmlPages, selectedFilePath]);

  // Get file content for code viewer
  const selectedFileContent = useMemo(() => {
    if (!leadWebsiteData?.files) return '';
    const file = leadWebsiteData.files.find(f => f.path === selectedFilePath);
    return file?.content || '';
  }, [leadWebsiteData?.files, selectedFilePath]);

  // Listen for page navigation from iframe
  useEffect(() => {
    const handleNavigate = (event: MessageEvent) => {
      if (event.data?.type === 'navigate-page') {
        const path = event.data.path;
        const pageExists = htmlPages.some(p => p.path === path);
        if (pageExists) setSelectedFilePath(path);
      }
    };
    window.addEventListener('message', handleNavigate);
    return () => window.removeEventListener('message', handleNavigate);
  }, [htmlPages]);

  // Listen for element selection from iframe - update GLOBAL store so ChatPanel can display it
  useEffect(() => {
    if (!isSelectMode) return;
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'element-selected') {
        const elementInfo = {
          selector: event.data.selector,
          tagName: event.data.tagName,
          text: event.data.text,
        };
        // Update local state for UI display in this component
        setSelectedElementInfo(elementInfo);
        // Update global store so ChatPanel shows the "Targeting" badge
        const { setSelectedElementSelector, setSelectedElementInfo: setStoreElementInfo } = useProjectStore.getState();
        setStoreElementInfo(elementInfo);
        setSelectedElementSelector(event.data.selector);
        setIsSelectMode(false);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [isSelectMode]);

  // Keyboard shortcut: Escape to go back or exit select mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isSelectMode) {
          setIsSelectMode(false);
          setSelectedElementInfo(null);
          // Also clear global store
          const { setSelectedElementSelector, setSelectedElementInfo: setStoreElementInfo } = useProjectStore.getState();
          setStoreElementInfo(null);
          setSelectedElementSelector(null);
        } else if (!sendDropdownOpen) {
          handleBack();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sendDropdownOpen, isSelectMode]);

  // Reset state when lead changes
  useEffect(() => {
    setIframeLoading(true);
    setIframeError(false);
    setExtractedContent(null);
    setExtractError(null);
    setLeadWebsiteData(null);
    setSelectedFilePath('/index.html');
  }, [leadId]);

  // Extract content from lead's website on mount (if they have a website URL)
  useEffect(() => {
    if (lead?.website && !extractedContent && !extracting && !extractError) {
      extractContentFromSite();
    }
  }, [lead?.website]);

  // Populate editable colors when extracted content loads
  useEffect(() => {
    if (extractedContent?.allColors?.length) {
      setEditableColors(extractedContent.allColors.map(c => ({ hex: c.hex, usage: c.usage })));
    } else if (extractedContent?.colors) {
      // Fallback to basic colors
      const colors: Array<{ hex: string; usage: string }> = [];
      if (extractedContent.colors.primary) colors.push({ hex: extractedContent.colors.primary, usage: 'primary' });
      if (extractedContent.colors.secondary) colors.push({ hex: extractedContent.colors.secondary, usage: 'secondary' });
      if (extractedContent.colors.accent) colors.push({ hex: extractedContent.colors.accent, usage: 'accent' });
      setEditableColors(colors);
    }
  }, [extractedContent]);

  // Listen for website generation progress
  useEffect(() => {
    const handleProgress = (event: Event) => {
      const customEvent = event as CustomEvent<{ leadId: string; stage: string; message: string }>;
      if (customEvent.detail.leadId === lead?.id) {
        const { message } = customEvent.detail;
        // Map progress messages to step numbers (4 total steps)
        let step = 1;
        if (message.includes('Creating design')) step = 2;
        else if (message.includes('Building website')) step = 3;
        else if (message.includes('Saving') || message.includes('Processing')) step = 4;

        setGenerationProgress({ message, step });
      }
    };

    window.addEventListener('leadWebsiteProgress', handleProgress);
    return () => window.removeEventListener('leadWebsiteProgress', handleProgress);
  }, [lead?.id]);

  // Listen for website generation completion
  useEffect(() => {
    const handleGenerationComplete = async (event: Event) => {
      const customEvent = event as CustomEvent<{ leadId: string; success: boolean }>;
      if (customEvent.detail.leadId === lead?.id && customEvent.detail.success) {
        // Refresh lead_website artifact to get the new previewToken
        await refreshArtifact('lead_website');
        // Also refresh leads to update the previewToken on the lead itself
        await refreshArtifact('leads');

        // Trigger local refetch of website files for instant preview update
        setRefreshKey(prev => prev + 1);

        setIsGeneratingWebsite(false);
        setGenerationProgress(null);
      }
    };

    window.addEventListener('leadWebsiteGenerated', handleGenerationComplete);
    return () => window.removeEventListener('leadWebsiteGenerated', handleGenerationComplete);
  }, [lead?.id, refreshArtifact]);

  // Listen for website edit completion (triggered by ChatPanel after edit_website tool completes)
  useEffect(() => {
    const handleEditComplete = (event: Event) => {
      const customEvent = event as CustomEvent<{ leadId: string }>;
      if (customEvent.detail.leadId === lead?.id) {
        console.log('[LeadDetailWorkspace] Website edited, refreshing preview');
        // Trigger refetch of website files for instant preview update
        setRefreshKey(prev => prev + 1);
      }
    };

    window.addEventListener('leadWebsiteEdited', handleEditComplete);
    return () => window.removeEventListener('leadWebsiteEdited', handleEditComplete);
  }, [lead?.id]);

  // Extract content from the lead's website (via server-side API to bypass CORS)
  const extractContentFromSite = async () => {
    if (!lead?.website) return;

    setExtracting(true);
    setExtractError(null);

    try {
      // Call server-side API to extract content (bypasses CORS)
      const response = await fetch('/api/extract-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: lead.website }),
      });

      if (!response.ok) {
        throw new Error('Failed to extract content');
      }

      const content = await response.json();
      setExtractedContent(content);
    } catch (error) {
      console.error('[LeadDetail] Failed to extract content:', error);
      setExtractError('Could not extract content from website');
    } finally {
      setExtracting(false);
    }
  };

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

  // Handle create new site - dispatches to sidechat with rich contextual prompt including extracted content
  const handleCreateNewSite = () => {
    // Build a rich prompt with extracted content
    let prompt = `Create a modern, professional website for ${lead?.companyName || 'this business'} (${lead?.industry || 'business'}).`;

    if (extractedContent) {
      prompt += `\n\nHere is content from their current website to use:`;

      if (extractedContent.content.headline) {
        prompt += `\n- Headline: "${extractedContent.content.headline}"`;
      }
      if (extractedContent.content.tagline) {
        prompt += `\n- Tagline: "${extractedContent.content.tagline}"`;
      }
      if (extractedContent.content.headings.length > 0) {
        prompt += `\n- Key sections: ${extractedContent.content.headings.slice(0, 5).join(', ')}`;
      }
      if (extractedContent.content.paragraphs.length > 0) {
        prompt += `\n- Content: ${extractedContent.content.paragraphs.join(' ')}`;
      }
      if (extractedContent.images.length > 0) {
        prompt += `\n- Images available: ${extractedContent.images.length} images from their site`;
      }

      // Include page structure for mimicking
      if (extractedContent.pageStructure?.sections?.length) {
        prompt += `\n\nPAGE STRUCTURE TO MIMIC:`;
        extractedContent.pageStructure.sections.forEach((section, i) => {
          prompt += `\n${i + 1}. ${section.type} section (${section.layout})${section.heading ? ` - "${section.heading}"` : ''}`;
        });
        if (extractedContent.pageStructure.navigation.items.length > 0) {
          prompt += `\nNavigation items: ${extractedContent.pageStructure.navigation.items.join(', ')}`;
        }
      }
    }

    // Include editable colors if set
    if (editableColors.length > 0) {
      prompt += `\n\nBRAND COLORS (use these exact colors):`;
      editableColors.forEach((color, i) => {
        prompt += `\n- ${color.usage}: ${color.hex}`;
      });
    }

    prompt += `\n\nMake it look modern and impressive with a coherent color scheme and contact form.`;

    // Show loading state - DON'T navigate away, stay on lead detail
    setIsGeneratingWebsite(true);

    // Dispatch to sidechat with leadId for proper targeting
    window.dispatchEvent(new CustomEvent('autoSubmitPrompt', {
      detail: {
        prompt,
        leadId: lead?.id,
        leadName: lead?.companyName,
      }
    }));
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
    <div className={`h-full flex flex-col ${bgPrimary} relative`}>
      {/* Website Generation Loading Overlay */}
      {isGeneratingWebsite && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`${isDark ? 'bg-zinc-900' : 'bg-white'} rounded-xl p-8 text-center shadow-xl max-w-sm w-80`}>
            <Loader2 className="animate-spin mx-auto mb-4 text-blue-500" size={40} />
            <h3 className={`text-lg font-semibold ${textPrimary} mb-2`}>Building Website</h3>
            <p className={`text-sm ${textSecondary} mb-3`}>{lead.companyName}</p>

            {generationProgress ? (
              <>
                <p className={`text-sm ${isDark ? 'text-blue-400' : 'text-blue-600'} mb-4 font-medium`}>
                  {generationProgress.message}
                </p>
                {/* Progress bar */}
                <div className={`w-full ${isDark ? 'bg-zinc-700' : 'bg-zinc-200'} rounded-full h-2 overflow-hidden`}>
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${(generationProgress.step / 4) * 100}%` }}
                  />
                </div>
                <p className={`text-xs ${textSecondary} mt-2`}>Step {generationProgress.step} of 4</p>
              </>
            ) : (
              <>
                <p className={`text-sm ${isDark ? 'text-blue-400' : 'text-blue-600'} mb-4 font-medium`}>
                  Starting generation...
                </p>
                {/* Empty progress bar */}
                <div className={`w-full ${isDark ? 'bg-zinc-700' : 'bg-zinc-200'} rounded-full h-2 overflow-hidden`}>
                  <div className="bg-blue-500 h-2 rounded-full w-0 transition-all duration-500 ease-out" />
                </div>
              </>
            )}
          </div>
        </div>
      )}

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
            <div className="h-full flex">
              {/* Left Panel: File Structure + Code (collapsible) */}
              {showCodePanel && leadWebsiteData?.files && (
                <div className={`w-80 border-r ${borderColor} flex flex-col shrink-0`}>
                  {/* File Tree Header */}
                  <div className={`px-3 py-2 border-b ${borderColor} ${bgSecondary} flex items-center justify-between`}>
                    <div className="flex items-center gap-2">
                      <FolderTree size={14} className={textSecondary} />
                      <span className={`text-xs font-medium ${textPrimary}`}>Files</span>
                    </div>
                    <button
                      onClick={() => setShowCodePanel(false)}
                      className={`p-1 rounded ${isDark ? 'hover:bg-zinc-700' : 'hover:bg-zinc-200'}`}
                    >
                      <ChevronRight size={14} className={textSecondary} />
                    </button>
                  </div>

                  {/* File List */}
                  <div className={`px-2 py-2 border-b ${borderColor} space-y-0.5`}>
                    {leadWebsiteData.files.map((file) => (
                      <button
                        key={file.path}
                        onClick={() => setSelectedFilePath(file.path)}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded transition-colors ${
                          selectedFilePath === file.path
                            ? isDark ? 'bg-zinc-700 text-white' : 'bg-zinc-200 text-zinc-900'
                            : `${textSecondary} ${isDark ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100'}`
                        }`}
                      >
                        <File size={12} />
                        <span className="truncate font-mono">{file.path}</span>
                      </button>
                    ))}
                  </div>

                  {/* Code Preview */}
                  <div className="flex-1 overflow-hidden flex flex-col">
                    <div className={`px-3 py-2 border-b ${borderColor} flex items-center gap-2`}>
                      <Code size={12} className={textSecondary} />
                      <span className={`text-xs font-mono ${textSecondary}`}>{selectedFilePath}</span>
                    </div>
                    <pre className={`flex-1 overflow-auto p-3 text-xs font-mono ${isDark ? 'bg-zinc-900 text-zinc-300' : 'bg-zinc-50 text-zinc-700'}`}>
                      <code>{selectedFileContent}</code>
                    </pre>
                  </div>
                </div>
              )}

              {/* Right Panel: Preview */}
              <div className="flex-1 flex flex-col min-w-0">
                {/* Browser Chrome with Actions */}
                <div className={`flex items-center gap-2 px-3 py-2 border-b ${borderColor} ${bgSecondary} relative z-20`}>
                  {/* Traffic lights */}
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                  </div>

                  {/* URL bar with page selector */}
                  <div className={`flex-1 flex items-center ${isDark ? 'bg-zinc-800' : 'bg-white'} rounded overflow-hidden`}>
                    <div className={`px-2 py-1 text-xs ${textSecondary} flex items-center gap-1.5 border-r ${borderColor}`}>
                      <Globe size={12} />
                      <span className="font-medium truncate max-w-[120px]">{lead.companyName.toLowerCase().replace(/\s+/g, '')}.com</span>
                    </div>
                    {/* Page dropdown */}
                    {htmlPages.length > 1 && (
                      <div className="relative">
                        <button
                          onClick={() => setSendDropdownOpen(sendDropdownOpen === 'pages' ? false : 'pages' as any)}
                          className={`px-2 py-1 text-xs font-mono flex items-center gap-1 ${isDark ? 'hover:bg-zinc-700' : 'hover:bg-zinc-50'}`}
                        >
                          <span className={textPrimary}>{currentPageDisplay}</span>
                          <ChevronDown size={12} className={textSecondary} />
                        </button>
                        {sendDropdownOpen === 'pages' && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setSendDropdownOpen(false)} />
                            <div className={`absolute top-full left-0 mt-1 ${isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-zinc-200'} border rounded-lg shadow-xl z-50 min-w-[120px]`}>
                              {htmlPages.map((page) => (
                                <button
                                  key={page.path}
                                  onClick={() => { setSelectedFilePath(page.path); setSendDropdownOpen(false); }}
                                  className={`w-full px-3 py-1.5 text-xs font-mono text-left ${
                                    page.path === selectedFilePath
                                      ? isDark ? 'bg-zinc-700 text-white' : 'bg-zinc-100 text-zinc-900'
                                      : `${textSecondary} ${isDark ? 'hover:bg-zinc-700' : 'hover:bg-zinc-50'}`
                                  }`}
                                >
                                  {page.displayPath}
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Refresh button */}
                  <button
                    onClick={() => setRefreshKey(k => k + 1)}
                    className={`p-1.5 rounded ${isDark ? 'hover:bg-zinc-700' : 'hover:bg-zinc-200'} transition-colors`}
                    title="Refresh preview"
                  >
                    <RotateCw size={14} className={textSecondary} />
                  </button>

                  {/* Cursor mode button */}
                  <button
                    onClick={() => {
                      setIsSelectMode(!isSelectMode);
                      setSelectedElementInfo(null);
                      // Also clear global store
                      const { setSelectedElementSelector, setSelectedElementInfo: setStoreElementInfo } = useProjectStore.getState();
                      setStoreElementInfo(null);
                      setSelectedElementSelector(null);
                    }}
                    className={`p-1.5 rounded transition-colors ${
                      isSelectMode
                        ? 'bg-blue-500/20 text-blue-400'
                        : `${isDark ? 'hover:bg-zinc-700' : 'hover:bg-zinc-200'} ${textSecondary}`
                    }`}
                    title="Select element for editing"
                  >
                    <MousePointer2 size={14} />
                  </button>

                  {/* Code panel toggle */}
                  <button
                    onClick={() => setShowCodePanel(!showCodePanel)}
                    className={`p-1.5 rounded transition-colors ${
                      showCodePanel
                        ? 'bg-blue-500/20 text-blue-400'
                        : `${isDark ? 'hover:bg-zinc-700' : 'hover:bg-zinc-200'} ${textSecondary}`
                    }`}
                    title="Toggle code panel"
                  >
                    <Code size={14} />
                  </button>

                  {/* Divider */}
                  <div className={`w-px h-4 ${isDark ? 'bg-zinc-700' : 'bg-zinc-300'}`} />

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

                  {/* Get Paid Button */}
                  {!lead.stripePaymentStatus || lead.stripePaymentStatus !== 'paid' ? (
                    <button
                      onClick={() => setShowGetPaidModal(true)}
                      className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded transition-colors bg-green-500 hover:bg-green-600 text-white"
                    >
                      <CreditCard size={12} />
                      Get Paid!
                    </button>
                  ) : (
                    <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded bg-green-500/20 text-green-400">
                      <DollarSign size={12} />
                      ${lead.paidAmount?.toLocaleString()}
                    </span>
                  )}

                  {/* Divider */}
                  <div className={`w-px h-4 ${isDark ? 'bg-zinc-700' : 'bg-zinc-300'}`} />

                  {/* Send dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setSendDropdownOpen(sendDropdownOpen === 'send' ? false : 'send' as any)}
                      className={`flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded transition-colors ${
                        isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-white' : 'bg-white hover:bg-zinc-100 text-zinc-900 border border-zinc-200'
                      }`}
                    >
                      <Send size={12} />
                      Send
                    </button>

                    {sendDropdownOpen === 'send' && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setSendDropdownOpen(false)} />
                        <div className={`absolute right-0 top-full mt-2 z-50 w-56 rounded-lg border ${borderColor} ${isDark ? 'bg-zinc-900' : 'bg-white'} shadow-lg py-1`}>
                          <button
                            onClick={handleCopyPreviewLink}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm ${isDark ? 'hover:bg-zinc-800' : 'hover:bg-zinc-50'} transition-colors`}
                          >
                            {copied === 'preview-link' ? <Check size={16} className="text-green-500" /> : <Link2 size={16} className={textSecondary} />}
                            <span className={textPrimary}>{copied === 'preview-link' ? 'Copied!' : 'Copy Preview Link'}</span>
                          </button>
                          <button
                            onClick={handleOpenEmailComposer}
                            disabled={!lead.contactEmail}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm ${isDark ? 'hover:bg-zinc-800' : 'hover:bg-zinc-50'} transition-colors disabled:opacity-50`}
                          >
                            <Mail size={16} className={textSecondary} />
                            <span className={textPrimary}>Open Email Composer</span>
                          </button>
                          <a href={previewUrl} target="_blank" rel="noopener noreferrer" className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm ${isDark ? 'hover:bg-zinc-800' : 'hover:bg-zinc-50'} transition-colors`}>
                            <ExternalLink size={16} className={textSecondary} />
                            <span className={textPrimary}>Open in New Tab</span>
                          </a>
                          <div className={`my-1 border-t ${borderColor}`} />
                          <button
                            onClick={() => { setSendDropdownOpen(false); setShowPublishModal(true); }}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm ${isDark ? 'hover:bg-zinc-800' : 'hover:bg-zinc-50'} transition-colors`}
                          >
                            <Rocket size={16} className={textSecondary} />
                            <span className={textPrimary}>Publish to Custom Domain</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  {/* External link */}
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

                {/* Preview iframe using srcDoc */}
                <div className={`flex-1 relative overflow-auto ${isDark ? 'bg-zinc-900/50' : 'bg-zinc-200'}`}>
                  {previewHtml ? (
                    <div className="h-full bg-white">
                      <iframe
                        key={`lead-preview-${refreshKey}-${leadWebsiteData?.version || 0}`}
                        srcDoc={previewHtml}
                        className="w-full border-0"
                        style={{ height: '100%', minHeight: '800px' }}
                        sandbox="allow-same-origin allow-scripts"
                        title={`Preview for ${lead.companyName}`}
                      />
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center">
                        <Loader2 size={32} className="animate-spin text-blue-500 mx-auto mb-2" />
                        <p className={`text-sm ${textSecondary}`}>Loading preview...</p>
                      </div>
                    </div>
                  )}

                  {/* Selection Mode Indicator */}
                  {isSelectMode && !selectedElementInfo && (
                    <div className={`absolute bottom-4 left-4 right-4 ${isDark ? 'bg-zinc-800/90 border-zinc-700' : 'bg-white/90 border-zinc-200'} backdrop-blur-sm rounded-lg border p-3 z-10 text-center`}>
                      <p className={`text-sm ${isDark ? 'text-zinc-300' : 'text-zinc-600'}`}>
                        <MousePointer2 size={14} className="inline mr-2 text-blue-500" />
                        Click on any element in the preview to select it for editing
                      </p>
                    </div>
                  )}

                  {/* Selected Element Indicator */}
                  {selectedElementInfo && (
                    <div className={`absolute bottom-4 left-4 right-4 ${isDark ? 'bg-zinc-800/90 border-zinc-700' : 'bg-white/90 border-zinc-200'} backdrop-blur-sm rounded-lg border p-3 z-10`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Check size={14} className="text-green-500" />
                          <span className={`text-sm font-medium ${textPrimary}`}>Selected: {selectedElementInfo.tagName}</span>
                          {selectedElementInfo.text && (
                            <span className={`text-xs ${textSecondary} truncate max-w-[200px]`}>"{selectedElementInfo.text}"</span>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            setSelectedElementInfo(null);
                            // Also clear global store
                            const { setSelectedElementSelector, setSelectedElementInfo: setStoreElementInfo } = useProjectStore.getState();
                            setStoreElementInfo(null);
                            setSelectedElementSelector(null);
                          }}
                          className={`text-xs ${textSecondary} hover:${textPrimary}`}
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* No preview yet - show extracted content from their site */
            <div className="h-full flex flex-col overflow-hidden">
              {/* Header */}
              <div className={`px-4 py-3 border-b ${borderColor} flex items-center justify-between`}>
                <h3 className={`text-sm font-medium ${textPrimary}`}>
                  {lead.website ? 'Content from their website' : 'No website available'}
                </h3>
                {lead.website && (
                  <button
                    onClick={extractContentFromSite}
                    disabled={extracting}
                    className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md transition-colors ${
                      isDark
                        ? 'bg-zinc-700 hover:bg-zinc-600 text-zinc-300'
                        : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-600'
                    } disabled:opacity-50`}
                  >
                    <RefreshCw size={12} className={extracting ? 'animate-spin' : ''} />
                    {extracting ? 'Extracting...' : 'Refresh'}
                  </button>
                )}
              </div>

              <div className="flex-1 flex overflow-hidden">
                {/* Left: Extracted content display */}
                <div className="flex-1 overflow-y-auto p-4">
                  {extracting ? (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center">
                        <Loader2 size={32} className="animate-spin text-blue-500 mx-auto mb-3" />
                        <p className={`text-sm ${textSecondary}`}>Extracting content from their website...</p>
                      </div>
                    </div>
                  ) : extractError ? (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center p-6">
                        <Globe size={48} className={`${textSecondary} mx-auto mb-3 opacity-50`} />
                        <p className={`text-sm ${textSecondary} mb-2`}>{extractError}</p>
                        {lead.website && (
                          <a
                            href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-500 hover:underline flex items-center justify-center gap-1"
                          >
                            View site directly <ExternalLink size={12} />
                          </a>
                        )}
                      </div>
                    </div>
                  ) : !lead.website ? (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center p-6">
                        <Globe size={48} className={`${textSecondary} mx-auto mb-3 opacity-50`} />
                        <p className={`text-sm ${textSecondary}`}>No website URL available for this lead</p>
                        <p className={`text-xs ${textSecondary} mt-2`}>You can still create a new website from scratch</p>
                      </div>
                    </div>
                  ) : extractedContent ? (
                    <div className="space-y-4">
                      {/* Headline & Tagline */}
                      {(extractedContent.content.headline || extractedContent.content.tagline) && (
                        <div className={`p-4 rounded-lg ${bgSecondary}`}>
                          <div className="flex items-center gap-2 mb-2">
                            <FileText size={14} className={textSecondary} />
                            <span className={`text-xs font-medium uppercase tracking-wide ${textSecondary}`}>Headline</span>
                          </div>
                          {extractedContent.content.headline && (
                            <p className={`text-base font-semibold ${textPrimary} mb-1`}>{extractedContent.content.headline}</p>
                          )}
                          {extractedContent.content.tagline && (
                            <p className={`text-sm ${textSecondary}`}>{extractedContent.content.tagline}</p>
                          )}
                        </div>
                      )}

                      {/* Key Sections */}
                      {extractedContent.content.headings.length > 0 && (
                        <div className={`p-4 rounded-lg ${bgSecondary}`}>
                          <div className="flex items-center gap-2 mb-2">
                            <FileText size={14} className={textSecondary} />
                            <span className={`text-xs font-medium uppercase tracking-wide ${textSecondary}`}>Sections</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {extractedContent.content.headings.slice(0, 8).map((heading, i) => (
                              <span key={i} className={`px-2 py-1 text-xs rounded-md ${isDark ? 'bg-zinc-700 text-zinc-300' : 'bg-zinc-200 text-zinc-700'}`}>
                                {heading}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Content Preview */}
                      {extractedContent.content.paragraphs.length > 0 && (
                        <div className={`p-4 rounded-lg ${bgSecondary}`}>
                          <div className="flex items-center gap-2 mb-2">
                            <FileText size={14} className={textSecondary} />
                            <span className={`text-xs font-medium uppercase tracking-wide ${textSecondary}`}>Content</span>
                          </div>
                          <div className="space-y-2">
                            {extractedContent.content.paragraphs.slice(0, 3).map((para, i) => (
                              <p key={i} className={`text-sm ${textSecondary} line-clamp-2`}>{para}</p>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Editable Colors */}
                      {editableColors.length > 0 && (
                        <div className={`p-4 rounded-lg ${bgSecondary}`}>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Palette size={14} className={textSecondary} />
                              <span className={`text-xs font-medium uppercase tracking-wide ${textSecondary}`}>Brand Colors</span>
                            </div>
                            <span className={`text-[10px] ${textSecondary}`}>Click to edit</span>
                          </div>
                          <div className="flex flex-wrap gap-3">
                            {editableColors.map((color, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <input
                                  type="color"
                                  value={color.hex}
                                  onChange={(e) => {
                                    const newColors = [...editableColors];
                                    newColors[i] = { ...newColors[i], hex: e.target.value.toUpperCase() };
                                    setEditableColors(newColors);
                                  }}
                                  className="w-8 h-8 rounded-md cursor-pointer border-0 p-0"
                                  title={`${color.usage}: ${color.hex}`}
                                />
                                <div>
                                  <span className={`text-xs font-medium ${textPrimary} block`}>{color.hex}</span>
                                  <span className={`text-[10px] ${textSecondary} capitalize`}>{color.usage}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Page Structure */}
                      {extractedContent.pageStructure?.sections && extractedContent.pageStructure.sections.length > 0 && (
                        <div className={`p-4 rounded-lg ${bgSecondary}`}>
                          <div className="flex items-center gap-2 mb-3">
                            <FolderTree size={14} className={textSecondary} />
                            <span className={`text-xs font-medium uppercase tracking-wide ${textSecondary}`}>Page Structure</span>
                          </div>
                          <div className="space-y-2">
                            {/* Navigation */}
                            {extractedContent.pageStructure.navigation.items.length > 0 && (
                              <div className={`text-xs ${textSecondary} flex items-start gap-2`}>
                                <span className={`${isDark ? 'bg-zinc-700' : 'bg-zinc-200'} px-1.5 py-0.5 rounded text-[10px] font-medium shrink-0`}>NAV</span>
                                <span className="text-xs">{extractedContent.pageStructure.navigation.items.join(' · ')}</span>
                              </div>
                            )}
                            {/* Sections */}
                            {extractedContent.pageStructure.sections.map((section, i) => (
                              <div key={i} className={`flex items-center gap-2 text-xs ${textSecondary}`}>
                                <span className={`w-5 h-5 flex items-center justify-center ${isDark ? 'bg-zinc-700' : 'bg-zinc-200'} rounded text-[10px] font-medium shrink-0`}>{i + 1}</span>
                                <span className={`capitalize ${textPrimary}`}>{section.type}</span>
                                <span className={`text-[10px] ${textSecondary}`}>({section.layout})</span>
                                {section.heading && (
                                  <span className={`text-xs ${textSecondary} truncate max-w-[150px]`}>"{section.heading}"</span>
                                )}
                              </div>
                            ))}
                            {/* Footer */}
                            {extractedContent.pageStructure.footer && (
                              <div className={`text-xs ${textSecondary} flex items-center gap-2 pt-1 border-t ${borderColor}`}>
                                <span className={`${isDark ? 'bg-zinc-700' : 'bg-zinc-200'} px-1.5 py-0.5 rounded text-[10px] font-medium`}>FOOTER</span>
                                <span>{extractedContent.pageStructure.footer.columns} column{extractedContent.pageStructure.footer.columns > 1 ? 's' : ''}</span>
                                {extractedContent.pageStructure.footer.hasContact && <span>· Contact</span>}
                                {extractedContent.pageStructure.footer.hasSocial && <span>· Social</span>}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Images */}
                      {extractedContent.images.length > 0 && (
                        <div className={`p-4 rounded-lg ${bgSecondary}`}>
                          <div className="flex items-center gap-2 mb-2">
                            <Image size={14} className={textSecondary} />
                            <span className={`text-xs font-medium uppercase tracking-wide ${textSecondary}`}>Images ({extractedContent.images.length})</span>
                          </div>
                          <div className="flex gap-2 overflow-x-auto pb-2">
                            {extractedContent.images.slice(0, 6).map((img, i) => (
                              <img
                                key={i}
                                src={img}
                                alt={`Site image ${i + 1}`}
                                className="w-16 h-16 object-cover rounded-md border border-zinc-300 dark:border-zinc-600 flex-shrink-0"
                                onError={(e) => (e.currentTarget.style.display = 'none')}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center">
                        <Loader2 size={32} className="animate-spin text-blue-500 mx-auto mb-3" />
                        <p className={`text-sm ${textSecondary}`}>Loading...</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right: Create action panel */}
                <div className={`w-72 p-6 border-l ${borderColor} flex flex-col`}>
                  <div className="flex-1 flex flex-col items-center justify-center text-center">
                    <div className={`w-14 h-14 mb-4 rounded-xl ${isDark ? 'bg-blue-600' : 'bg-blue-500'} flex items-center justify-center`}>
                      <Wand2 size={24} className="text-white" />
                    </div>
                    <h3 className={`text-base font-semibold ${textPrimary} mb-2`}>Create New Website</h3>
                    <p className={`text-sm ${textSecondary} mb-6`}>
                      {extractedContent
                        ? 'Use the extracted content to create a modern website'
                        : 'Generate a professional website for this business'}
                    </p>
                    <button
                      onClick={handleCreateNewSite}
                      disabled={extracting}
                      className={`w-full px-4 py-2.5 text-sm font-medium flex items-center justify-center gap-2 rounded-lg transition-all ${
                        isDark
                          ? 'bg-blue-600 hover:bg-blue-500 text-white'
                          : 'bg-blue-500 hover:bg-blue-600 text-white'
                      } disabled:opacity-50`}
                    >
                      <Wand2 size={16} />
                      {extractedContent ? 'Use Info to Create Website' : 'Create Website'}
                    </button>
                  </div>

                  {/* Link to their site */}
                  {lead.website && (
                    <div className={`pt-4 mt-4 border-t ${borderColor}`}>
                      <a
                        href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center justify-center gap-2 text-xs ${textSecondary} hover:text-blue-500 transition-colors`}
                      >
                        <ExternalLink size={12} />
                        View current website
                      </a>
                    </div>
                  )}
                </div>
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

      {/* Get Paid Modal */}
      {project?.id && (
        <GetPaidModal
          isOpen={showGetPaidModal}
          onClose={() => setShowGetPaidModal(false)}
          lead={lead}
          projectId={project.id}
          onSuccess={() => {
            // Refresh leads to update payment status
            refreshArtifact('leads');
          }}
        />
      )}
    </div>
  );
}
