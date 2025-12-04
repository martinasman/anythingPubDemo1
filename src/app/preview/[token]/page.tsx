/**
 * Website Preview Page
 *
 * Displays the generated website preview for a lead using iframe isolation.
 * This prevents the parent app theme from affecting the preview.
 * Previews expire after 30 days.
 */

import { createAdminClient } from '@/utils/supabase/admin';
import { notFound } from 'next/navigation';
import PreviewIframeContainer from '@/components/preview/PreviewIframeContainer';
import type { LeadWebsiteArtifact } from '@/types/database';

interface PreviewPageProps {
  params: Promise<{ token: string }>;
}

export default async function PreviewPage({ params }: PreviewPageProps) {
  const supabase = createAdminClient();
  const { token } = await params;

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

  const websiteArtifact = websiteData;
  const indexFile = websiteArtifact.files?.find(
    (f) => f.path === '/index.html' || f.path === 'index.html'
  );

  if (!indexFile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Preview Not Available</h1>
          <p className="text-gray-600">The website preview could not be loaded.</p>
        </div>
      </div>
    );
  }

  // Construct complete HTML document for iframe
  const completeHtml = constructCompleteHtml(indexFile.content, websiteArtifact.files);

  // Return iframe container for style isolation
  // This prevents the parent app theme (light/dark mode) from affecting the preview
  return (
    <PreviewIframeContainer
      html={completeHtml}
      leadName={websiteArtifact.leadName}
      expiresAt={websiteArtifact.expiresAt}
    />
  );
}

/**
 * Construct complete HTML document with inline CSS and JS
 * Used for iframe rendering to ensure all assets are self-contained
 */
function constructCompleteHtml(
  indexHtml: string,
  files?: Array<{ path: string; content: string; type: string }>
): string {
  let html = indexHtml;

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

  return html;
}

/**
 * Generate static params for pre-rendering (optional)
 */
export async function generateMetadata({ params }: PreviewPageProps) {
  const supabase = createAdminClient();
  const { token } = await params;

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

  return {
    title: websiteData?.leadName ? `${websiteData.leadName} - Website Preview` : 'Website Preview',
    robots: 'noindex, nofollow',
  };
}
