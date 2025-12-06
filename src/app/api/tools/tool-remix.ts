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

    // Use Gemini 2.5 Flash for best vision + generation quality
    const selectedModel = 'google/gemini-2.5-flash-preview-05-20';
    console.log('[Remix Tool] Using model:', selectedModel);
    console.log('[Remix Tool] Screenshot available:', !!crawledData.screenshot);

    // Build explicit page generation instructions
    const pageCount = crawledData.pages.length;
    const pageList = crawledData.pages
      .map(p => `- ${p.path === '/' ? '/index.html' : `${p.path}/index.html`} (from "${p.title}")`)
      .join('\n');

    // Build the text prompt with STRONG multi-page enforcement
    const textPrompt = `${REMIX_ARCHITECT_PROMPT}

${siteDataPrompt}

═══════════════════════════════════════════════════════════════════
⚠️ CRITICAL: MULTI-PAGE GENERATION REQUIRED ⚠️
═══════════════════════════════════════════════════════════════════

You MUST generate EXACTLY ${pageCount + 2} files total:

HTML FILES (${pageCount} pages - GENERATE ALL OF THEM):
${pageList}

SHARED FILES (2 files):
- /styles.css (CSS variables: --primary: ${crawledData.brand.colors.primary || '#3B82F6'}, --secondary: ${crawledData.brand.colors.secondary || '#1F2937'})
- /script.js (mobile menu, smooth scroll, scroll animations)

═══════════════════════════════════════════════════════════════════
OUTPUT FORMAT - STRICT JSON STRUCTURE
═══════════════════════════════════════════════════════════════════

{
  "files": [
    { "path": "/index.html", "content": "<!DOCTYPE html>...", "type": "html" },
${crawledData.pages.filter(p => p.path !== '/').map(p => `    { "path": "${p.path}/index.html", "content": "<!DOCTYPE html>...", "type": "html" },`).join('\n')}
    { "path": "/styles.css", "content": ":root { --primary: ...; }", "type": "css" },
    { "path": "/script.js", "content": "// Mobile menu...", "type": "js" }
  ]
}

VALIDATION CHECKLIST (YOU MUST SATISFY ALL):
✓ Exactly ${pageCount} HTML files in output
✓ Each HTML file has path, content, type fields
✓ Content is COMPLETE HTML (not truncated)
✓ Navigation links point to other generated pages
✓ Brand colors used: primary=${crawledData.brand.colors.primary || '#3B82F6'}

⚠️ FAILURE CONDITION: If you generate only 1 HTML file (index.html only), you have FAILED the task.
⚠️ SUCCESS CONDITION: Generate ALL ${pageCount} pages listed above.

Return ONLY valid JSON. No markdown. No explanation.`;

    // Build message content with image if screenshot is available
    type MessageContent = { type: 'text'; text: string } | { type: 'image'; image: string; mimeType: string };
    const messageContent: MessageContent[] = [];

    // Add screenshot as image if available
    if (crawledData.screenshot?.base64) {
      console.log('[Remix Tool] Including screenshot in prompt for visual analysis');
      messageContent.push({
        type: 'image',
        image: crawledData.screenshot.base64,
        mimeType: crawledData.screenshot.format === 'png' ? 'image/png' : 'image/jpeg',
      });
    }

    // Add text prompt
    messageContent.push({
      type: 'text',
      text: crawledData.screenshot?.base64
        ? `SCREENSHOT OF ORIGINAL WEBSITE ABOVE - Use this to:
1. Match the EXACT color scheme (extract colors from what you see)
2. Match the EXACT layout structure (section order, spacing, proportions)
3. Match the visual hierarchy (what's prominent, what's subtle)
4. Match the overall design style (modern, corporate, playful, etc.)

${textPrompt}`
        : textPrompt,
    });

    const { text: generatedJson } = await generateText({
      model: openrouter(selectedModel),
      messages: [
        {
          role: 'user',
          content: messageContent,
        },
      ],
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

    // Check if we got the expected number of HTML pages
    const htmlFilesGenerated = parsed.files.filter(f => f.type === 'html').length;
    const expectedHtmlPages = crawledData.pages.length;

    if (htmlFilesGenerated < expectedHtmlPages) {
      console.warn(`[Remix Tool] ⚠️ Expected ${expectedHtmlPages} HTML pages but only got ${htmlFilesGenerated}`);
      console.warn(`[Remix Tool] Missing pages may need to be added manually`);
    } else {
      console.log(`[Remix Tool] ✓ Generated all ${htmlFilesGenerated} HTML pages`);
    }

    // Emit progress for each file being processed
    const totalFiles = parsed.files.length;
    for (let i = 0; i < parsed.files.length; i++) {
      const file = parsed.files[i];
      const progressPercent = 85 + Math.round((i / totalFiles) * 10); // 85-95%

      await emitProgress({
        phase: 'generating',
        step: `file_${file.path.replace(/\//g, '_')}`,
        progress: progressPercent,
        message: `Generated ${file.path}`,
        detail: file.type,
      });
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
 * Detect industry from site data for image selection
 */
function detectIndustry(siteData: CrawledSiteData): string {
  const allText = [
    siteData.brand.companyName || '',
    siteData.brand.tagline || '',
    ...siteData.pages.flatMap(p => [
      p.title,
      ...p.content.headings.map(h => h.text),
      ...p.content.paragraphs.slice(0, 5),
    ]),
  ].join(' ').toLowerCase();

  // Industry detection patterns
  const patterns: Record<string, string[]> = {
    roofing: ['roof', 'roofing', 'shingle', 'gutter'],
    construction: ['construction', 'build', 'remodel', 'renovation'],
    contractor: ['contractor', 'plumb', 'electric', 'hvac', 'handyman', 'home service'],
    restaurant: ['restaurant', 'dining', 'menu', 'cuisine', 'chef', 'food'],
    cafe: ['cafe', 'coffee', 'bakery', 'pastry', 'espresso'],
    gym: ['gym', 'fitness', 'crossfit', 'workout', 'training', 'muscle'],
    dental: ['dental', 'dentist', 'teeth', 'orthodont', 'smile'],
    medical: ['medical', 'doctor', 'clinic', 'health', 'patient', 'care'],
    realestate: ['real estate', 'realtor', 'property', 'home', 'listing', 'buy', 'sell'],
    salon: ['salon', 'hair', 'beauty', 'stylist', 'barber', 'cut'],
    spa: ['spa', 'massage', 'wellness', 'relax', 'treatment'],
    auto: ['auto', 'car', 'vehicle', 'mechanic', 'repair', 'detailing'],
    legal: ['law', 'legal', 'attorney', 'lawyer', 'case', 'court'],
    tech: ['tech', 'software', 'app', 'saas', 'platform', 'digital'],
    agency: ['agency', 'marketing', 'design', 'creative', 'brand'],
  };

  for (const [industry, keywords] of Object.entries(patterns)) {
    if (keywords.some(kw => allText.includes(kw))) {
      return industry;
    }
  }

  return 'default';
}

/**
 * Build a detailed prompt with all site data for the AI
 * Now uses SECTION-BY-SECTION structure for better remix quality
 */
function buildSiteDataPrompt(siteData: CrawledSiteData): string {
  const sections: string[] = [];
  const detectedIndustry = detectIndustry(siteData);

  // Brand section
  sections.push(`
═══════════════════════════════════════════════════════════════════
EXTRACTED BRAND DATA
═══════════════════════════════════════════════════════════════════

Company Name: ${siteData.brand.companyName || 'Unknown'}
Tagline: ${siteData.brand.tagline || 'None detected'}
Logo URL: ${siteData.brand.logo || 'Not found'}
Detected Industry: ${detectedIndustry.toUpperCase()}

EXTRACTED COLORS (use these for the remix):
- Primary: ${siteData.brand.colors.primary || '#3B82F6'}
- Secondary: ${siteData.brand.colors.secondary || '#1F2937'}
- Accent: ${siteData.brand.colors.accent || '#10B981'}
${siteData.brand.colors.allColors.length > 0 ? `
All extracted colors:
${siteData.brand.colors.allColors.slice(0, 5).map(c => `- ${c.color} (found ${c.count} times)`).join('\n')}
` : ''}

Fonts:
- Headings: ${siteData.brand.fonts.heading || 'Use a modern font that matches the industry'}
- Body: ${siteData.brand.fonts.body || 'Use a readable sans-serif'}
`);

  // Navigation section
  sections.push(`
═══════════════════════════════════════════════════════════════════
NAVIGATION STRUCTURE
═══════════════════════════════════════════════════════════════════

Primary Navigation (keep this exact order and labels):
${siteData.navigation.primary.map(nav => `- "${nav.label}" → ${nav.path}`).join('\n')}

Footer Navigation:
${siteData.navigation.footer.map(nav => `- "${nav.label}" → ${nav.path}`).join('\n')}
`);

  // Contact info section
  sections.push(`
═══════════════════════════════════════════════════════════════════
CONTACT INFORMATION (preserve exactly)
═══════════════════════════════════════════════════════════════════

Phone: ${siteData.globalElements.contactInfo.phone || 'Not found'}
Email: ${siteData.globalElements.contactInfo.email || 'Not found'}
Address: ${siteData.globalElements.contactInfo.address || 'Not found'}

Social Links:
${siteData.globalElements.socialLinks.map(s => `- ${s.platform}: ${s.url}`).join('\n') || 'None found'}
`);

  // Pages section - NOW WITH SECTION-BY-SECTION DATA
  sections.push(`
═══════════════════════════════════════════════════════════════════
PAGES TO GENERATE (${siteData.pages.length} total)
═══════════════════════════════════════════════════════════════════

CRITICAL: Generate each page with the SAME section order as the original.
Each section below shows the type and content - preserve this structure!
`);

  for (const page of siteData.pages) {
    sections.push(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PAGE: ${page.path === '/' ? '/index.html' : `${page.path}/index.html`}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Title: ${page.title}
Type: ${page.pageType}
`);

    // Output section-by-section data
    if (page.sections && page.sections.length > 0) {
      sections.push(`
SECTIONS IN ORDER (preserve this exact order):
`);
      for (const section of page.sections.sort((a, b) => a.order - b.order)) {
        const sectionImages = section.images || [];
        const heroImage = sectionImages.find(img => img.isHero);
        const otherImages = sectionImages.filter(img => !img.isHero && !img.isLogo);

        sections.push(`
[SECTION ${section.order + 1}: ${section.type.toUpperCase()}]
${section.heading ? `Heading: "${section.heading}"` : ''}
${section.subheading ? `Subheading: "${section.subheading}"` : ''}
${section.content.length > 0 ? `Content:
${section.content.map(p => `  "${p}"`).join('\n')}` : ''}
${section.ctaText ? `CTA Button: "${section.ctaText}"` : ''}
${heroImage ? `Hero Image: ${heroImage.src} (${heroImage.alt || 'no alt'}) - KEEP or replace with industry-appropriate Unsplash` : section.type === 'hero' ? `Hero Image: NONE FOUND - USE INDUSTRY IMAGE for ${detectedIndustry}` : ''}
${otherImages.length > 0 ? `Other Images:
${otherImages.slice(0, 3).map(img => `  - ${img.src}${img.alt ? ` (${img.alt})` : ''}`).join('\n')}` : ''}
`);
      }
    } else {
      // Fallback to old format if no sections detected
      sections.push(`
CONTENT (no sections detected - use headings as section markers):

Headings:
${page.content.headings.map(h => `${'#'.repeat(h.level)} ${h.text}`).join('\n')}

Paragraphs:
${page.content.paragraphs.map(p => `"${p}"`).join('\n\n')}
`);
    }

    // Forms
    if (page.forms.length > 0) {
      sections.push(`
FORMS (preserve all fields exactly):
${page.forms.map(form => `
  Form Type: ${form.formType}
  Fields (keep these exact names for backend compatibility):
${form.fields.map(f => `    - name="${f.name}" type="${f.type}"${f.required ? ' required' : ''}${f.label ? ` label="${f.label}"` : ''}${f.placeholder ? ` placeholder="${f.placeholder}"` : ''}`).join('\n')}
  Submit Button: "${form.submitText}"
`).join('\n')}
`);
    }

    // Images summary
    const logoImg = page.images.find(i => i.isLogo);
    sections.push(`
IMAGES SUMMARY:
- Total: ${page.images.length}
- Logo: ${logoImg ? logoImg.src : 'Not found on this page'}
- Hero images: ${page.images.filter(i => i.isHero).length}
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
