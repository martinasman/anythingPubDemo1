/**
 * Extract Website Content API Route
 *
 * Server-side endpoint to extract content from external websites.
 * This bypasses CORS restrictions that block client-side requests.
 */

import { NextResponse } from 'next/server';
import { extractWebsiteContent } from '@/lib/services/websiteAnalyzer';

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    console.log('[ExtractContent] Extracting from:', url);
    const content = await extractWebsiteContent(url);
    console.log('[ExtractContent] Success - extracted', content.images?.length || 0, 'images');

    return NextResponse.json(content);
  } catch (error) {
    console.error('[ExtractContent] Error:', error);
    return NextResponse.json(
      { error: 'Failed to extract content' },
      { status: 500 }
    );
  }
}
