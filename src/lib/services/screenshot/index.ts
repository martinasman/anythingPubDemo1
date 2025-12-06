/**
 * Screenshot Service
 *
 * Captures screenshots of websites using Firecrawl API.
 * Firecrawl renders JavaScript and captures high-quality screenshots.
 */

export interface ScreenshotResult {
  success: boolean;
  /** Base64-encoded screenshot image */
  base64?: string;
  /** Image format (png/jpeg) */
  format?: 'png' | 'jpeg';
  /** URL the screenshot was taken from */
  url: string;
  /** Width of the screenshot */
  width?: number;
  /** Height of the screenshot */
  height?: number;
  /** Error message if failed */
  error?: string;
}

export interface ScreenshotOptions {
  /** Width of the viewport (default: 1440) */
  width?: number;
  /** Height of the viewport (default: 900) */
  height?: number;
  /** Whether to capture full page (default: false - viewport only) */
  fullPage?: boolean;
  /** Delay in ms before taking screenshot (default: 2000) */
  delay?: number;
}

const DEFAULT_OPTIONS: ScreenshotOptions = {
  width: 1440,
  height: 900,
  fullPage: false,
  delay: 2000,
};

/**
 * Capture a screenshot of a URL using Firecrawl
 */
export async function captureScreenshot(
  url: string,
  options: ScreenshotOptions = {}
): Promise<ScreenshotResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Normalize URL
  let normalizedUrl = url;
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    normalizedUrl = `https://${url}`;
  }

  console.log('[Screenshot] Capturing with Firecrawl:', normalizedUrl);

  // Use Firecrawl (primary and only method - it's the best)
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    console.error('[Screenshot] FIRECRAWL_API_KEY not configured');
    return {
      success: false,
      url: normalizedUrl,
      error: 'Firecrawl API key not configured',
    };
  }

  try {
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        url: normalizedUrl,
        formats: ['screenshot'],
        waitFor: opts.delay,
        screenshot: {
          fullPage: opts.fullPage,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Screenshot] Firecrawl API error:', response.status, errorText);
      return {
        success: false,
        url: normalizedUrl,
        error: `Firecrawl API error: ${response.status}`,
      };
    }

    const data = await response.json();
    console.log('[Screenshot] Firecrawl response:', data.success ? 'success' : 'failed');

    if (data.success && data.data?.screenshot) {
      // Firecrawl returns screenshot as base64 or URL
      let base64 = data.data.screenshot;

      // If it's a URL, fetch and convert to base64
      if (base64.startsWith('http')) {
        console.log('[Screenshot] Fetching screenshot from URL...');
        const imgResponse = await fetch(base64);
        const buffer = await imgResponse.arrayBuffer();
        base64 = Buffer.from(buffer).toString('base64');
      }

      // Remove data URL prefix if present
      if (base64.startsWith('data:')) {
        base64 = base64.split(',')[1];
      }

      console.log('[Screenshot] Success! Screenshot size:', Math.round(base64.length / 1024), 'KB');

      return {
        success: true,
        base64,
        format: 'png',
        url: normalizedUrl,
        width: opts.width,
        height: opts.height,
      };
    }

    return {
      success: false,
      url: normalizedUrl,
      error: 'No screenshot in Firecrawl response',
    };
  } catch (error) {
    console.error('[Screenshot] Firecrawl failed:', error);
    return {
      success: false,
      url: normalizedUrl,
      error: error instanceof Error ? error.message : 'Firecrawl screenshot failed',
    };
  }
}
