/**
 * Multi-Page Website Preview Route
 *
 * Handles navigation to specific pages within a website preview.
 * Routes like /preview/abc123/about serve /about/index.html from the artifact.
 */

import { createAdminClient } from '@/utils/supabase/admin';
import { notFound, redirect } from 'next/navigation';
import PreviewIframeContainer from '@/components/preview/PreviewIframeContainer';
import type { LeadWebsiteArtifact } from '@/types/database';

interface PreviewPageProps {
  params: Promise<{ token: string; path: string[] }>;
}

export default async function PreviewPathPage({ params }: PreviewPageProps) {
  const supabase = createAdminClient();
  const { token, path } = await params;

  // Construct the file path from segments
  // /preview/token/about → /about/index.html
  // /preview/token/services/web-design → /services/web-design/index.html
  const pathSegments = path || [];
  let filePath: string;

  if (pathSegments.length === 0) {
    // Root path - redirect to main preview
    redirect(`/preview/${token}`);
  }

  // Build the file path
  const joinedPath = '/' + pathSegments.join('/');

  // Check if it ends with .html already
  if (joinedPath.endsWith('.html')) {
    filePath = joinedPath;
  } else {
    // Add /index.html
    filePath = joinedPath + '/index.html';
  }

  // Scan all lead_website artifacts for the token
  const { data: artifacts } = await supabase
    .from('artifacts')
    .select('*')
    .eq('type', 'lead_website');

  let websiteData: LeadWebsiteArtifact | null = null;
  if (artifacts) {
    for (const artifact of artifacts) {
      const website = artifact.data.websites?.find((w: any) => w.previewToken === token);
      if (website) {
        websiteData = website;
        break;
      }
    }
  }

  if (!websiteData) {
    notFound();
  }

  // Check if expired
  if (websiteData.expiresAt && new Date(websiteData.expiresAt) < new Date()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Preview Expired</h1>
          <p className="text-gray-600 mb-6">
            This website preview has expired. Please contact us to generate a new preview.
          </p>
          <div className="text-sm text-gray-400">Expired on: {new Date(websiteData.expiresAt).toLocaleDateString()}</div>
        </div>
      </div>
    );
  }

  // Find the requested page
  const websiteArtifact = websiteData;
  const requestedFile = websiteArtifact.files?.find(
    (f) => f.path === filePath || f.path === filePath.replace('/index.html', '.html')
  );

  if (!requestedFile) {
    // Page not found - show 404 or redirect to home
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Page Not Found</h1>
          <p className="text-gray-600 mb-6">
            The page &ldquo;{joinedPath}&rdquo; doesn&apos;t exist in this website preview.
          </p>
          <a
            href={`/preview/${token}`}
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Home Page
          </a>
        </div>
      </div>
    );
  }

  // Construct complete HTML document for iframe
  const completeHtml = constructCompleteHtml(requestedFile.content, websiteArtifact.files, token);

  // Return iframe container for style isolation
  return (
    <PreviewIframeContainer
      html={completeHtml}
      leadName={websiteArtifact.leadName}
      expiresAt={websiteArtifact.expiresAt}
    />
  );
}

/**
 * Construct complete HTML document with inline CSS, JS, and navigation handling
 */
function constructCompleteHtml(
  pageHtml: string,
  files?: Array<{ path: string; content: string; type: string }>,
  token?: string
): string {
  let html = pageHtml;

  // Inline CSS file if it exists
  if (files) {
    const cssFile = files.find(f => f.path === '/styles.css');
    if (cssFile) {
      html = html.replace(
        '</head>',
        `<style>${cssFile.content}</style></head>`
      );
    }

    // Inline JS file if it exists
    const jsFile = files.find(f => f.path === '/script.js');
    if (jsFile) {
      html = html.replace(
        '</body>',
        `<script>${jsFile.content}</script></body>`
      );
    }
  }

  // Inject navigation handler script for internal link handling
  // This rewrites internal hrefs to include the token prefix
  const navScript = `
<script data-preview-nav="true">
(function() {
  var token = "${token || ''}";

  document.addEventListener('click', function(e) {
    var link = e.target.closest('a');
    if (!link || !link.href) return;

    var href = link.getAttribute('href');

    // Skip external links, anchors, and special protocols
    if (!href || href.startsWith('#') || href.startsWith('mailto:') ||
        href.startsWith('tel:') || href.startsWith('http://') || href.startsWith('https://')) {
      return;
    }

    // Internal link - rewrite to include token prefix
    e.preventDefault();

    // Normalize path
    var path = href;
    if (path === '/') {
      // Go to main preview page
      window.location.href = '/preview/' + token;
    } else {
      // Remove leading slash for path segment
      if (path.startsWith('/')) {
        path = path.substring(1);
      }
      // Remove .html or /index.html suffix
      path = path.replace(/\\/index\\.html$/, '').replace(/\\.html$/, '');
      window.location.href = '/preview/' + token + '/' + path;
    }
  }, true);
})();
</script>`;

  html = html.replace('</body>', `${navScript}</body>`);

  return html;
}

/**
 * Generate metadata for the page
 */
export async function generateMetadata({ params }: PreviewPageProps) {
  const supabase = createAdminClient();
  const { token, path } = await params;

  const { data: artifacts } = await supabase
    .from('artifacts')
    .select('*')
    .eq('type', 'lead_website');

  let websiteData: LeadWebsiteArtifact | undefined;
  if (artifacts) {
    for (const artifact of artifacts) {
      const website = artifact.data.websites?.find((w: any) => w.previewToken === token);
      if (website) {
        websiteData = website;
        break;
      }
    }
  }

  const pageName = path?.join('/') || 'Home';

  return {
    title: websiteData?.leadName
      ? `${pageName} - ${websiteData.leadName} Preview`
      : `${pageName} - Website Preview`,
    robots: 'noindex, nofollow',
  };
}
