'use client';

import { useEffect, useState, useMemo } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { Globe, Monitor, Smartphone, Tablet, ExternalLink, ArrowLeft, Code, AlertCircle, ChevronDown, RotateCw, Check, Plus, MousePointer2, X } from 'lucide-react';
import { useCanvasBackground } from '@/hooks/useCanvasBackground';
import WebsiteCodeModal from './WebsiteCodeModal';

type Viewport = 'desktop' | 'tablet' | 'mobile';

const VIEWPORT_WIDTHS: Record<Viewport, string> = {
  desktop: '100%',
  tablet: '768px',
  mobile: '375px',
};

export default function WebsiteFocusView() {
  const {
    artifacts,
    runningTools,
    setCanvasState,
    toolStatuses,
    retryGeneration,
    isSelectMode,
    setIsSelectMode,
    setSelectedElementSelector,
    setSelectedElementInfo: setStoreElementInfo
  } = useProjectStore();
  const { bgStyle, isDark } = useCanvasBackground();
  const [viewport, setViewport] = useState<Viewport>('desktop');
  const [websitePreviewUrl, setWebsitePreviewUrl] = useState<string | null>(null);
  const [codeModalOpen, setCodeModalOpen] = useState(false);
  const [selectedFilePath, setSelectedFilePath] = useState<string>('/index.html');
  const [pageDropdownOpen, setPageDropdownOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Local state for element info display (also synced to store for ChatPanel)
  const [selectedElementInfo, setSelectedElementInfo] = useState<{
    selector: string;
    tagName: string;
    text?: string;
  } | null>(null);

  const isWebsiteLoading = runningTools.has('website');

  // Dynamic styling based on background
  const chromeBg = isDark ? 'bg-zinc-800/90 backdrop-blur-sm' : 'bg-zinc-100/90 backdrop-blur-sm';
  const borderColor = isDark ? 'border-zinc-700' : 'border-zinc-200';
  const textPrimary = isDark ? 'text-white' : 'text-zinc-900';
  const textSecondary = isDark ? 'text-zinc-400' : 'text-zinc-600';

  // Memoize file contents to prevent unnecessary recalculations
  const fileContents = useMemo(() => {
    if (!artifacts.website?.files?.length) {
      return { htmlContent: null, cssContent: null, jsContent: null };
    }

    const files = artifacts.website.files;

    // Find the selected HTML file (or default to index.html)
    const currentPath = selectedFilePath || '/index.html';
    const htmlFile = files.find(f => f.path === currentPath && f.path.endsWith('.html'))
      || files.find(f => f.path === '/index.html');

    // CSS and JS are global (shared across all pages)
    const cssFile = files.find(f => f.path === '/styles.css');
    const jsFile = files.find(f => f.path === '/script.js');

    return {
      htmlContent: htmlFile?.content || null,
      cssContent: cssFile?.content || null,
      jsContent: jsFile?.content || null,
    };
  }, [artifacts.website?.files, selectedFilePath]);

  // Get list of HTML pages for the dropdown
  const htmlPages = useMemo(() => {
    if (!artifacts.website?.files?.length) return [];
    return artifacts.website.files
      .filter(f => f.path.endsWith('.html'))
      .map(f => {
        // Convert path to display name
        // /index.html -> /
        // /about/index.html -> /about
        // /contact.html -> /contact
        let displayPath = f.path;
        if (displayPath === '/index.html') {
          displayPath = '/';
        } else if (displayPath.endsWith('/index.html')) {
          displayPath = displayPath.replace('/index.html', '');
        } else {
          displayPath = displayPath.replace('.html', '');
        }
        return {
          path: f.path,
          displayPath,
        };
      })
      .sort((a, b) => {
        // Sort "/" first, then alphabetically
        if (a.displayPath === '/') return -1;
        if (b.displayPath === '/') return 1;
        return a.displayPath.localeCompare(b.displayPath);
      });
  }, [artifacts.website?.files]);

  // Get current page display name
  const currentPageDisplay = useMemo(() => {
    const page = htmlPages.find(p => p.path === selectedFilePath);
    return page?.displayPath || '/';
  }, [htmlPages, selectedFilePath]);

  // Selection script to inject when in select mode
  // Supports selecting semantic sections (header, footer, section, nav) and individual elements
  const selectionScript = `
<script data-select-mode="true">
(function() {
  let highlightEl = null;
  const originalOutlines = new WeakMap();

  // Semantic section tags we want to make easily selectable
  var sectionTags = ['SECTION', 'HEADER', 'FOOTER', 'NAV', 'MAIN', 'ASIDE', 'ARTICLE'];

  // Find the nearest section container or use the element itself
  function findSelectableElement(el) {
    // If clicking on a semantic section, use it
    if (sectionTags.includes(el.tagName)) return el;

    // Check if element has section-like classes
    var className = el.className || '';
    if (typeof className === 'string') {
      var lowerClass = className.toLowerCase();
      if (lowerClass.includes('hero') || lowerClass.includes('section') ||
          lowerClass.includes('header') || lowerClass.includes('footer') ||
          lowerClass.includes('container') || lowerClass.includes('wrapper')) {
        return el;
      }
    }

    // For very small elements (like icons, spans), find a more meaningful parent
    var rect = el.getBoundingClientRect();
    if (rect.width < 50 && rect.height < 50) {
      var parent = el.parentElement;
      while (parent && parent.tagName !== 'BODY') {
        var parentRect = parent.getBoundingClientRect();
        // Use parent if it's substantially larger
        if (parentRect.width > rect.width * 2 || parentRect.height > rect.height * 2) {
          return parent;
        }
        parent = parent.parentElement;
      }
    }

    return el;
  }

  // Generate a friendly name for the element
  function getFriendlyName(el) {
    var tag = el.tagName.toLowerCase();
    var className = el.className || '';

    // Check for semantic meaning in classes
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
      if (lowerClass.includes('about')) return 'about section';
      if (lowerClass.includes('service')) return 'services';
    }

    // Semantic tags
    if (tag === 'header') return 'header';
    if (tag === 'footer') return 'footer';
    if (tag === 'nav') return 'navigation';
    if (tag === 'section') return 'section';
    if (tag === 'main') return 'main content';

    return tag;
  }

  document.addEventListener('mouseover', function(e) {
    var target = findSelectableElement(e.target);
    if (highlightEl && highlightEl !== target) {
      highlightEl.style.outline = originalOutlines.get(highlightEl) || '';
    }
    highlightEl = target;
    originalOutlines.set(highlightEl, highlightEl.style.outline);
    highlightEl.style.outline = '2px solid #71717a';
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
    window.parent.postMessage({
      type: 'element-selected',
      selector: selector,
      tagName: friendlyName,
      text: (target.textContent || '').trim().slice(0, 50)
    }, '*');
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

  // Create iframe content from website HTML with proper cleanup
  useEffect(() => {
    if (!fileContents.htmlContent) {
      setWebsitePreviewUrl(null);
      return;
    }

    let modifiedHtml = fileContents.htmlContent;

    if (fileContents.cssContent) {
      modifiedHtml = modifiedHtml.replace(
        '</head>',
        `<style>${fileContents.cssContent}</style></head>`
      );
    }

    if (fileContents.jsContent) {
      modifiedHtml = modifiedHtml.replace(
        '</body>',
        `<script>${fileContents.jsContent}</script></body>`
      );
    }

    // Inject selection script when in select mode
    if (isSelectMode) {
      modifiedHtml = modifiedHtml.replace('</body>', `${selectionScript}</body>`);
    }

    const blob = new Blob([modifiedHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    setWebsitePreviewUrl(url);

    // CLEANUP: Revoke blob URL when file content changes or component unmounts
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [fileContents.htmlContent, fileContents.cssContent, fileContents.jsContent, isSelectMode]);

  // Listen for postMessage from iframe when element is selected
  useEffect(() => {
    if (!isSelectMode) return;

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'element-selected') {
        const info = {
          selector: event.data.selector,
          tagName: event.data.tagName,
          text: event.data.text
        };
        setSelectedElementInfo(info);
        // Update store so ChatPanel can use it
        setSelectedElementSelector(event.data.selector);
        setStoreElementInfo(info);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [isSelectMode, setSelectedElementSelector, setStoreElementInfo]);

  // Escape key to exit selection mode
  useEffect(() => {
    if (!isSelectMode) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsSelectMode(false);
        setSelectedElementInfo(null);
        setSelectedElementSelector(null);
        setStoreElementInfo(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSelectMode, setSelectedElementSelector, setStoreElementInfo]);

  // Empty/Loading state
  if (!websitePreviewUrl) {
    const websiteStatus = toolStatuses.get('generate_website_files');
    const hasError = websiteStatus?.status === 'error';
    const errorMessage = websiteStatus?.errorMessage;

    if (hasError) {
      return (
        <div className="h-full flex flex-col items-center justify-center p-6" style={bgStyle}>
          <AlertCircle size={48} className="text-red-500 mb-2" />
          <h3 className="text-lg font-semibold text-red-600 mb-2">
            Generation Failed
          </h3>
          {errorMessage && (
            <p className={`text-sm ${isDark ? 'text-zinc-400' : 'text-zinc-600'} text-center max-w-sm mb-4`}>
              {errorMessage}
            </p>
          )}
          <button
            onClick={() => retryGeneration('website')}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Retry Generation
          </button>
        </div>
      );
    }

    return (
      <div className={`h-full flex flex-col items-center justify-center ${isWebsiteLoading ? 'animate-pulse' : ''}`} style={bgStyle}>
        <Globe size={48} className={isDark ? 'text-zinc-600' : 'text-zinc-300'} />
        <h3 className={`text-lg font-semibold ${textSecondary} mb-2`}>
          {isWebsiteLoading ? 'Building Your Website...' : 'No Website Yet'}
        </h3>
        <p className={`text-sm ${isDark ? 'text-zinc-500' : 'text-zinc-400'} text-center max-w-xs`}>
          {isWebsiteLoading
            ? 'Your website is being generated. This may take a moment.'
            : 'Start a conversation to generate your business website.'}
        </p>
      </div>
    );
  }

  // Handle refresh
  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="h-full overflow-hidden flex flex-col rounded-tl-2xl" style={bgStyle}>
      {/* Browser Chrome - z-index ensures dropdown appears above iframe */}
      <div className={`flex items-center gap-2 px-3 py-2 ${chromeBg} border-b ${borderColor} relative z-20`}>
        {/* Back button */}
        <button
          onClick={() => setCanvasState({ type: 'overview' })}
          className={`p-1.5 ${textSecondary} hover:${textPrimary} ${isDark ? 'hover:bg-zinc-700' : 'hover:bg-zinc-200'} rounded transition-colors`}
          title="Back to overview"
        >
          <ArrowLeft size={16} />
        </button>

        {/* Traffic lights */}
        <div className="flex gap-1.5 mr-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <div className="w-3 h-3 rounded-full bg-green-500" />
        </div>

        {/* URL bar with page dropdown */}
        <div className="flex-1 relative">
          <div className={`${isDark ? 'bg-zinc-700' : 'bg-white'} rounded-lg flex items-center overflow-hidden`}>
            {/* Domain part */}
            <div className={`px-3 py-2 text-sm ${textSecondary} flex items-center gap-2 border-r ${borderColor}`}>
              <Globe size={14} />
              <span className="font-medium">
                {artifacts.identity?.name?.toLowerCase().replace(/\s+/g, '') || 'your-business'}.com
              </span>
            </div>

            {/* Page selector dropdown - always visible */}
            <button
              onClick={() => setPageDropdownOpen(!pageDropdownOpen)}
              className={`flex-1 px-3 py-2 text-sm font-mono flex items-center justify-between gap-2 ${isDark ? 'hover:bg-zinc-600' : 'hover:bg-zinc-50'} transition-colors`}
            >
              <span className={textPrimary}>{currentPageDisplay}</span>
              <div className="flex items-center gap-1">
                <span className={`text-xs ${textSecondary}`}>
                  {htmlPages.length} page{htmlPages.length !== 1 ? 's' : ''}
                </span>
                <ChevronDown size={14} className={`${textSecondary} transition-transform ${pageDropdownOpen ? 'rotate-180' : ''}`} />
              </div>
            </button>
          </div>

          {/* Dropdown menu */}
          {pageDropdownOpen && (
            <>
              {/* Backdrop to close dropdown */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setPageDropdownOpen(false)}
              />
              {/* Dropdown */}
              <div className={`absolute top-full left-0 right-0 mt-1 ${isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-zinc-200'} border rounded-lg shadow-xl z-50 max-h-64 overflow-y-auto`}>
                {/* Page list */}
                {htmlPages.map((page) => (
                  <button
                    key={page.path}
                    onClick={() => {
                      setSelectedFilePath(page.path);
                      setPageDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-sm font-mono flex items-center justify-between gap-2 ${
                      page.path === selectedFilePath
                        ? isDark ? 'bg-zinc-700 text-white' : 'bg-zinc-100 text-zinc-900'
                        : `${textSecondary} ${isDark ? 'hover:bg-zinc-700 hover:text-white' : 'hover:bg-zinc-50 hover:text-zinc-900'}`
                    } transition-colors`}
                  >
                    <span>{page.displayPath}</span>
                    {page.path === selectedFilePath && (
                      <Check size={14} className="text-green-500" />
                    )}
                  </button>
                ))}

                {/* Divider */}
                <div className={`border-t ${borderColor} my-1`} />

                {/* Add page hint */}
                <div className={`px-3 py-2 text-xs ${textSecondary}`}>
                  <Plus size={12} className="inline mr-1" />
                  Ask AI to add a new page
                </div>
              </div>
            </>
          )}
        </div>

        {/* Viewport Toggle */}
        <div className={`flex items-center gap-0.5 ${isDark ? 'bg-zinc-700' : 'bg-white'} rounded-lg p-1`}>
          <button
            onClick={() => setViewport('desktop')}
            className={`p-1.5 rounded transition-colors ${
              viewport === 'desktop'
                ? isDark ? 'bg-zinc-600 text-white' : 'bg-zinc-200 text-zinc-900'
                : `${textSecondary} ${isDark ? 'hover:text-zinc-200' : 'hover:text-zinc-700'}`
            }`}
            title="Desktop"
          >
            <Monitor size={16} />
          </button>
          <button
            onClick={() => setViewport('tablet')}
            className={`p-1.5 rounded transition-colors ${
              viewport === 'tablet'
                ? isDark ? 'bg-zinc-600 text-white' : 'bg-zinc-200 text-zinc-900'
                : `${textSecondary} ${isDark ? 'hover:text-zinc-200' : 'hover:text-zinc-700'}`
            }`}
            title="Tablet"
          >
            <Tablet size={16} />
          </button>
          <button
            onClick={() => setViewport('mobile')}
            className={`p-1.5 rounded transition-colors ${
              viewport === 'mobile'
                ? isDark ? 'bg-zinc-600 text-white' : 'bg-zinc-200 text-zinc-900'
                : `${textSecondary} ${isDark ? 'hover:text-zinc-200' : 'hover:text-zinc-700'}`
            }`}
            title="Mobile"
          >
            <Smartphone size={16} />
          </button>
        </div>

        {/* Selection Mode Toggle */}
        <button
          onClick={() => {
            setIsSelectMode(!isSelectMode);
            if (isSelectMode) {
              setSelectedElementInfo(null);
              setSelectedElementSelector(null);
              setStoreElementInfo(null);
            }
          }}
          className={`p-1.5 rounded-lg transition-colors ${
            isSelectMode
              ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
              : `${textSecondary} ${isDark ? 'hover:text-white hover:bg-zinc-700' : 'hover:text-zinc-900 hover:bg-zinc-200'}`
          }`}
          title={isSelectMode ? 'Exit selection mode (ESC)' : 'Click to select elements'}
        >
          <MousePointer2 size={16} />
        </button>

        {/* Refresh button */}
        <button
          onClick={handleRefresh}
          className={`p-1.5 ${textSecondary} ${isDark ? 'hover:text-white hover:bg-zinc-700' : 'hover:text-zinc-900 hover:bg-zinc-200'} rounded-lg transition-colors`}
          title="Refresh"
        >
          <RotateCw size={16} />
        </button>

        {/* Code Editor Button */}
        <button
          onClick={() => setCodeModalOpen(true)}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium ${isDark ? 'text-zinc-300 hover:text-white hover:bg-zinc-700' : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200'} rounded-lg transition-colors`}
          title="Edit code"
        >
          <Code size={16} />
        </button>

        {/* Open in new tab */}
        <button
          onClick={() => window.open(websitePreviewUrl, '_blank')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium ${isDark ? 'text-zinc-300 hover:text-white hover:bg-zinc-700' : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200'} rounded-lg transition-colors`}
          title="Open in new tab"
        >
          <ExternalLink size={16} />
        </button>
      </div>

      {/* Website Preview */}
      <div className={`flex-1 relative overflow-auto ${isDark ? 'bg-zinc-900/50' : 'bg-zinc-200'}`}>
        <div
          className="mx-auto min-h-full transition-all duration-300 bg-white"
          style={{
            width: VIEWPORT_WIDTHS[viewport],
            maxWidth: '100%',
            boxShadow: viewport !== 'desktop' ? '0 0 0 1px rgba(0,0,0,0.1), 0 4px 16px rgba(0,0,0,0.1)' : 'none',
          }}
        >
          <iframe
            key={refreshKey}
            src={websitePreviewUrl}
            className="w-full border-0"
            style={{ height: '100vh', minHeight: '800px' }}
            sandbox="allow-same-origin allow-scripts"
            title="Website Preview"
          />
        </div>

        {/* Selection Mode Indicator - only show when actively selecting */}
        {isSelectMode && !selectedElementInfo && (
          <div className={`absolute bottom-4 left-4 right-4 ${isDark ? 'bg-zinc-800/90 border-zinc-700' : 'bg-white/90 border-zinc-200'} backdrop-blur-sm rounded-lg border p-3 z-10 text-center`}>
            <p className={`text-sm ${isDark ? 'text-zinc-300' : 'text-zinc-600'}`}>
              <MousePointer2 size={14} className="inline mr-2 text-zinc-500" />
              Click on any element in the preview to select it
            </p>
          </div>
        )}
      </div>

      {/* Code Editor Modal */}
      <WebsiteCodeModal
        isOpen={codeModalOpen}
        onClose={() => setCodeModalOpen(false)}
        isDark={isDark}
      />
    </div>
  );
}
