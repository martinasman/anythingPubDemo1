/**
 * Website Remix Tool
 *
 * Crawls an existing website, extracts all content/brand/forms,
 * and generates a modern 2025 version while preserving the original identity.
 */

import { z } from 'zod';
import { generateText } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { createClient } from '@supabase/supabase-js';
import type { WebsiteArtifact } from '@/types/database';
import { REMIX_ARCHITECT_PROMPT } from '@/config/agentPrompts';
import { crawlSite, type CrawledSiteData, type CrawlProgress } from '@/lib/services/siteCrawler';

// ============================================
// SCHEMA DEFINITION
// ============================================

export const remixSchema = z.object({
  sourceUrl: z.string().url().describe('The URL of the website to remix'),
  maxPages: z.number().optional().default(20).describe('Maximum number of pages to crawl'),
  preserveContent: z.boolean().optional().default(true).describe('Whether to preserve original content exactly'),
});

// ============================================
// PROGRESS TYPES
// ============================================

export interface RemixProgress {
  phase: 'crawling' | 'analyzing' | 'generating' | 'complete';
  step: string;
  progress: number; // 0-100
  message: string;
  detail?: string;
}

export type ProgressCallback = (progress: RemixProgress) => void | Promise<void>;

// ============================================
// MAIN REMIX FUNCTION
// ============================================

export async function remixWebsite(params: z.infer<typeof remixSchema> & {
  projectId: string;
  onProgress?: ProgressCallback;
}): Promise<{
  success: boolean;
  summary: string;
  pageCount: number;
  fileCount: number;
  error?: string;
}> {
  const { sourceUrl, maxPages = 20, preserveContent = true, projectId, onProgress } = params;

  console.log('[Remix Tool] Starting remix for:', sourceUrl);

  const emitProgress = async (update: RemixProgress) => {
    if (onProgress) {
      await onProgress(update);
    }
  };

  try {
    // ============================================
    // PHASE 1: CRAWL THE WEBSITE
    // ============================================

    await emitProgress({
      phase: 'crawling',
      step: 'start',
      progress: 0,
      message: 'Starting website crawl...',
      detail: sourceUrl,
    });

    const crawledData = await crawlSite(
      sourceUrl,
      { maxPages },
      async (crawlProgress: CrawlProgress) => {
        // Convert crawler progress to remix progress
        const progressPercent = Math.round(
          (crawlProgress.pagesCrawled / Math.max(crawlProgress.totalPages, 1)) * 30
        );

        await emitProgress({
          phase: 'crawling',
          step: 'page',
          progress: progressPercent,
          message: crawlProgress.message,
          detail: crawlProgress.currentUrl,
        });
      }
    );

    console.log('[Remix Tool] Crawl complete:', crawledData.stats.totalPages, 'pages');

    // ============================================
    // PHASE 2: ANALYZE & PREPARE
    // ============================================

    await emitProgress({
      phase: 'analyzing',
      step: 'brand',
      progress: 35,
      message: 'Analyzing brand and structure...',
      detail: `Found: ${crawledData.brand.companyName || 'Unknown business'}`,
    });

    // Build the prompt with all crawled data
    const siteDataPrompt = buildSiteDataPrompt(crawledData);

    // ============================================
    // PHASE 3: GENERATE MODERN WEBSITE
    // ============================================

    await emitProgress({
      phase: 'generating',
      step: 'start',
      progress: 40,
      message: 'Generating modern website...',
      detail: `${crawledData.pages.length} pages to generate`,
    });

    const openrouter = createOpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY!,
    });

    // Use Gemini 3 Pro for best generation quality
    const selectedModel = 'google/gemini-3-pro-preview';
    console.log('[Remix Tool] Using model:', selectedModel);

    // Build explicit page generation instructions
    const pageCount = crawledData.pages.length;
    const pageList = crawledData.pages
      .map(p => `- ${p.path === '/' ? '/index.html' : `${p.path}/index.html`} (from "${p.title}")`)
      .join('\n');

    const { text: generatedJson } = await generateText({
      model: openrouter(selectedModel),
      prompt: `${REMIX_ARCHITECT_PROMPT}

${siteDataPrompt}

═══════════════════════════════════════════════════════════════════
REQUIRED OUTPUT - ${pageCount} SEPARATE HTML FILES
═══════════════════════════════════════════════════════════════════

You MUST generate these exact pages as SEPARATE HTML files:
${pageList}

Plus these shared files:
- /styles.css (with CSS variables for extracted brand colors)
- /script.js (mobile menu toggle, smooth scroll, scroll animations)

TOTAL FILES EXPECTED: ${pageCount + 2}

IMPORTANT:
- Each HTML page must be COMPLETE (not a template)
- Use the EXTRACTED brand colors (primary: ${crawledData.brand.colors.primary || 'use your best judgment'})
- Include ALL content from the original page
- Make sure navigation links work between pages

Return ONLY valid JSON. No markdown code blocks. No explanation.`,
      temperature: 0.7,
    });

    await emitProgress({
      phase: 'generating',
      step: 'parsing',
      progress: 85,
      message: 'Processing generated files...',
    });

    // Parse the generated JSON
    const parsed = parseGeneratedFiles(generatedJson);

    if (!parsed.files || parsed.files.length === 0) {
      throw new Error('No files were generated');
    }

    // Post-process: ensure internal links work
    const processedFiles = postProcessFiles(parsed.files, crawledData);

    console.log('[Remix Tool] Generated', processedFiles.length, 'files');

    // ============================================
    // PHASE 4: SAVE TO DATABASE
    // ============================================

    await emitProgress({
      phase: 'generating',
      step: 'saving',
      progress: 95,
      message: 'Saving website...',
    });

    // Save the website artifact
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const websiteArtifact: WebsiteArtifact = {
      files: processedFiles,
      primaryPage: '/index.html',
      appType: 'html',
      metadata: {
        remixedFrom: sourceUrl,
        crawledAt: crawledData.crawledAt,
        originalPageCount: crawledData.stats.totalPages,
      },
    };

    const { error: upsertError } = await supabase
      .from('artifacts')
      .upsert(
        {
          project_id: projectId,
          type: 'website_code',
          data: websiteArtifact,
          version: 1,
        },
        { onConflict: 'project_id,type' }
      );

    if (upsertError) {
      console.error('[Remix Tool] Database error:', upsertError);
      throw new Error('Failed to save website');
    }

    // Also save the crawled data for reference
    await supabase
      .from('artifacts')
      .upsert(
        {
          project_id: projectId,
          type: 'crawled_site',
          data: {
            sourceUrl,
            crawledAt: crawledData.crawledAt,
            site: crawledData,
            status: 'completed',
          },
          version: 1,
        },
        { onConflict: 'project_id,type' }
      );

    await emitProgress({
      phase: 'complete',
      step: 'done',
      progress: 100,
      message: 'Remix complete!',
      detail: `Generated ${processedFiles.length} files from ${crawledData.stats.totalPages} pages`,
    });

    return {
      success: true,
      summary: `Remixed ${crawledData.domain} - ${processedFiles.length} files generated from ${crawledData.stats.totalPages} original pages`,
      pageCount: crawledData.stats.totalPages,
      fileCount: processedFiles.length,
    };

  } catch (error) {
    console.error('[Remix Tool] Error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    await emitProgress({
      phase: 'complete',
      step: 'error',
      progress: 100,
      message: 'Remix failed',
      detail: errorMessage,
    });

    return {
      success: false,
      summary: `Failed to remix website: ${errorMessage}`,
      pageCount: 0,
      fileCount: 0,
      error: errorMessage,
    };
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Build a detailed prompt with all site data for the AI
 */
function buildSiteDataPrompt(siteData: CrawledSiteData): string {
  const sections: string[] = [];

  // Brand section
  sections.push(`
═══════════════════════════════════════════════════════════════════
EXTRACTED BRAND DATA
═══════════════════════════════════════════════════════════════════

Company Name: ${siteData.brand.companyName || 'Unknown'}
Tagline: ${siteData.brand.tagline || 'None detected'}
Logo URL: ${siteData.brand.logo || 'Not found'}

Colors:
- Primary: ${siteData.brand.colors.primary || '#3B82F6'}
- Secondary: ${siteData.brand.colors.secondary || '#1F2937'}
- Accent: ${siteData.brand.colors.accent || '#10B981'}

Fonts:
- Headings: ${siteData.brand.fonts.heading || 'System default'}
- Body: ${siteData.brand.fonts.body || 'System default'}
`);

  // Navigation section
  sections.push(`
═══════════════════════════════════════════════════════════════════
NAVIGATION STRUCTURE
═══════════════════════════════════════════════════════════════════

Primary Navigation:
${siteData.navigation.primary.map(nav => `- ${nav.label}: ${nav.path}`).join('\n')}

Footer Navigation:
${siteData.navigation.footer.map(nav => `- ${nav.label}: ${nav.path}`).join('\n')}
`);

  // Contact info section
  sections.push(`
═══════════════════════════════════════════════════════════════════
CONTACT INFORMATION
═══════════════════════════════════════════════════════════════════

Phone: ${siteData.globalElements.contactInfo.phone || 'Not found'}
Email: ${siteData.globalElements.contactInfo.email || 'Not found'}
Address: ${siteData.globalElements.contactInfo.address || 'Not found'}

Social Links:
${siteData.globalElements.socialLinks.map(s => `- ${s.platform}: ${s.url}`).join('\n') || 'None found'}
`);

  // Pages section
  sections.push(`
═══════════════════════════════════════════════════════════════════
PAGES TO GENERATE (${siteData.pages.length} total)
═══════════════════════════════════════════════════════════════════
`);

  for (const page of siteData.pages) {
    sections.push(`
--- PAGE: ${page.path} ---
Title: ${page.title}
Type: ${page.pageType}

Content:
${page.content.headings.map(h => `${'#'.repeat(h.level)} ${h.text}`).join('\n')}

${page.content.paragraphs.join('\n\n')}

Images: ${page.images.length} (${page.images.filter(i => i.isHero).length} hero, ${page.images.filter(i => i.isLogo).length} logo)
${page.images.slice(0, 5).map(img => `- ${img.src}${img.alt ? ` (${img.alt})` : ''}`).join('\n')}

Forms: ${page.forms.length}
${page.forms.map(form => `
  Form Type: ${form.formType}
  Fields:
  ${form.fields.map(f => `  - ${f.name} (${f.type})${f.required ? ' [required]' : ''}${f.label ? ` "${f.label}"` : ''}`).join('\n')}
  Submit: "${form.submitText}"
`).join('\n')}
`);
  }

  return sections.join('\n');
}

/**
 * Parse the generated JSON from the AI response
 */
function parseGeneratedFiles(jsonString: string): { files: WebsiteArtifact['files'] } {
  // Clean up the response - remove markdown code blocks if present
  let cleaned = jsonString.trim();

  // Remove markdown code blocks
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }

  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }

  cleaned = cleaned.trim();

  try {
    const parsed = JSON.parse(cleaned);

    // Handle both { files: [...] } and direct array formats
    if (Array.isArray(parsed)) {
      return { files: parsed };
    }

    if (parsed.files && Array.isArray(parsed.files)) {
      return { files: parsed.files };
    }

    throw new Error('Invalid response format');
  } catch (error) {
    console.error('[Remix Tool] JSON parse error:', error);
    console.error('[Remix Tool] Raw response (first 500 chars):', jsonString.slice(0, 500));

    // Try to extract JSON from the response
    const jsonMatch = jsonString.match(/\{[\s\S]*"files"[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch {
        // Fall through to error
      }
    }

    throw new Error('Failed to parse generated website');
  }
}

/**
 * Post-process files to ensure internal links work correctly
 */
function postProcessFiles(
  files: WebsiteArtifact['files'],
  siteData: CrawledSiteData
): WebsiteArtifact['files'] {
  // Build a map of paths to file paths
  const pathMap = new Map<string, string>();

  for (const file of files) {
    if (file.type === 'html') {
      // Extract the path from the file path
      // /about/index.html -> /about
      // /index.html -> /
      let pagePath = file.path.replace(/\/index\.html$/, '') || '/';
      pathMap.set(pagePath, file.path);
    }
  }

  // Process each HTML file
  return files.map(file => {
    if (file.type !== 'html') return file;

    let content = file.content;

    // Fix internal links
    // Replace href="/about" with href="/about/index.html" if that file exists
    content = content.replace(/href="(\/[^"#?]*)"/g, (match, path) => {
      // Check if this path has a corresponding file
      if (pathMap.has(path)) {
        return `href="${pathMap.get(path)}"`;
      }
      // Check if adding /index.html works
      const withIndex = path.endsWith('/') ? `${path}index.html` : `${path}/index.html`;
      if (files.some(f => f.path === withIndex)) {
        return `href="${withIndex}"`;
      }
      return match;
    });

    // Ensure CSS and JS links are correct
    content = content.replace(/href="styles\.css"/g, 'href="/styles.css"');
    content = content.replace(/src="script\.js"/g, 'src="/script.js"');

    return { ...file, content };
  });
}
