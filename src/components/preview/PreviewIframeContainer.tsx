'use client';

import { useEffect, useState } from 'react';

interface PreviewIframeContainerProps {
  html: string;
  leadName: string;
  expiresAt: string | null;
}

export default function PreviewIframeContainer({
  html,
  leadName,
  expiresAt,
}: PreviewIframeContainerProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  // Create blob URL from HTML (using same pattern as WebsiteFocusView)
  useEffect(() => {
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    setBlobUrl(url);

    // Cleanup on unmount
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [html]);

  if (!blobUrl) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-100">
        <div className="text-gray-600">Loading preview...</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col">
      {/* Iframe takes full viewport - this provides complete style isolation */}
      <iframe
        src={blobUrl}
        className="w-full h-full border-0"
        sandbox="allow-same-origin allow-scripts allow-forms"
        title={`Website Preview: ${leadName}`}
      />

      {/* Preview banner - positioned in parent context (outside iframe) */}
      <PreviewBanner leadName={leadName} expiresAt={expiresAt} />
    </div>
  );
}

/**
 * Preview banner component
 * Uses inline styles to ensure consistent appearance regardless of theme
 */
function PreviewBanner({
  leadName,
  expiresAt,
}: {
  leadName: string;
  expiresAt: string | null;
}) {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: '#1f2937',
        color: 'white',
        padding: '12px 24px',
        borderRadius: '9999px',
        fontSize: '14px',
        fontFamily: 'system-ui, sans-serif',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}
    >
      <span style={{ color: '#10b981' }}>●</span>
      Preview for {leadName}
      <span style={{ color: '#9ca3af', marginLeft: '8px' }}>
        Expires: {expiresAt ? new Date(expiresAt).toLocaleDateString() : 'N/A'}
      </span>
    </div>
  );
}
