/**
 * Website Quality Analyzer Service
 *
 * Analyzes websites to determine quality and identify opportunities
 * for businesses that need website services.
 */

import type { WebsiteAnalysis } from '@/types/database';

// ============================================
// TYPES
// ============================================

export interface AnalysisResult extends WebsiteAnalysis {
  analyzedAt: string;
  url?: string;
}

// ============================================
// MAIN ANALYSIS FUNCTION
// ============================================

/**
 * Analyze a website's quality and determine opportunity score
 *
 * Status levels:
 * - none: No website = HIGHEST priority (score: 100)
 * - broken: Website returns errors = HIGH priority (score: 85-95)
 * - poor: Multiple issues = HIGH priority (score: 60-80)
 * - outdated: Some issues = MEDIUM priority (score: 30-50)
 * - good: Few/no issues = LOW priority (score: 5-25)
 */
export async function analyzeWebsite(url: string | undefined): Promise<AnalysisResult> {
  const now = new Date().toISOString();

  // No website = highest priority lead
  if (!url) {
    return {
      status: 'none',
      score: 100,
      issues: ['No website detected - highest priority for web services'],
      hasSSL: false,
      analyzedAt: now,
    };
  }

  // Normalize URL
  let normalizedUrl = url;
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    normalizedUrl = `https://${url}`;
  }

  try {
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const startTime = Date.now();

    const response = await fetch(normalizedUrl, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; BusinessAnalyzer/1.0; +http://example.com/bot)',
        'Accept': 'text/html,application/xhtml+xml',
      },
      redirect: 'follow',
    });

    clearTimeout(timeoutId);

    const loadTime = Date.now() - startTime;

    // Check for error responses
    if (!response.ok) {
      return {
        status: 'broken',
        score: 90,
        issues: [`Website returns ${response.status} error - needs replacement`],
        hasSSL: normalizedUrl.startsWith('https'),
        loadTime,
        analyzedAt: now,
        url: normalizedUrl,
      };
    }

    // Get HTML content
    const html = await response.text();

    // Analyze the HTML
    const analysis = analyzeHTMLContent(html, normalizedUrl, loadTime);
    return {
      ...analysis,
      analyzedAt: now,
      url: normalizedUrl,
    };
  } catch (error) {
    // Handle specific error types
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return {
          status: 'broken',
          score: 85,
          issues: ['Website takes too long to load (>10 seconds)'],
          hasSSL: normalizedUrl.startsWith('https'),
          analyzedAt: now,
          url: normalizedUrl,
        };
      }

      // DNS/Network errors
      if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
        return {
          status: 'broken',
          score: 95,
          issues: ['Domain not found or DNS error - website does not exist'],
          hasSSL: false,
          analyzedAt: now,
          url: normalizedUrl,
        };
      }

      // SSL/Certificate errors
      if (error.message.includes('certificate') || error.message.includes('SSL')) {
        return {
          status: 'broken',
          score: 85,
          issues: ['SSL certificate error - security issue'],
          hasSSL: false,
          analyzedAt: now,
          url: normalizedUrl,
        };
      }
    }

    // Generic connection error
    return {
      status: 'broken',
      score: 85,
      issues: ['Website unreachable or connection error'],
      hasSSL: normalizedUrl.startsWith('https'),
      analyzedAt: now,
      url: normalizedUrl,
    };
  }
}

// ============================================
// HTML ANALYSIS
// ============================================

/**
 * Analyze HTML content for quality indicators
 */
function analyzeHTMLContent(
  html: string,
  url: string,
  loadTime: number
): WebsiteAnalysis {
  const issues: string[] = [];
  let score = 0;

  // 1. Check SSL
  const hasSSL = url.startsWith('https');
  if (!hasSSL) {
    issues.push('No SSL certificate (HTTP only) - security risk');
    score += 20;
  }

  // 2. Check for outdated copyright
  const copyrightMatch = html.match(/copyright\s*(?:&copy;|©|&#169;)?\s*(\d{4})/i);
  const copyrightYear = copyrightMatch ? parseInt(copyrightMatch[1]) : null;
  const currentYear = new Date().getFullYear();

  if (copyrightYear && copyrightYear < currentYear - 2) {
    issues.push(`Copyright shows ${copyrightYear} - website likely outdated`);
    score += 30;
  }

  // 3. Check for mobile responsiveness
  const hasViewport = html.includes('viewport');
  const hasMediaQueries = html.includes('@media') || html.includes('responsive');
  const mobileResponsive = hasViewport || hasMediaQueries;

  if (!mobileResponsive) {
    issues.push('Not mobile responsive - poor mobile experience');
    score += 25;
  }

  // 4. Check for outdated HTML patterns
  const usesTableLayout = (html.match(/<table/gi) || []).length > 5;
  const usesFontTags = /<font\s/i.test(html);
  const usesFrames = /<frame|<frameset/i.test(html);
  const usesMarquee = /<marquee/i.test(html);

  if (usesFontTags || usesFrames || usesMarquee) {
    issues.push('Uses very outdated HTML (font tags/frames/marquee)');
    score += 30;
  } else if (usesTableLayout) {
    issues.push('Uses table-based layout - outdated design approach');
    score += 15;
  }

  // 5. Check load time
  if (loadTime > 8000) {
    issues.push(`Very slow load time: ${(loadTime / 1000).toFixed(1)}s`);
    score += 20;
  } else if (loadTime > 5000) {
    issues.push(`Slow load time: ${(loadTime / 1000).toFixed(1)}s`);
    score += 10;
  }

  // 6. Check for basic SEO
  const hasTitle = /<title[^>]*>[^<]+<\/title>/i.test(html);
  const hasMetaDesc = /meta.*name=["']description["']/i.test(html);
  const hasH1 = /<h1[^>]*>/i.test(html);

  if (!hasTitle) {
    issues.push('Missing page title - poor SEO');
    score += 10;
  }
  if (!hasMetaDesc) {
    issues.push('Missing meta description - poor SEO');
    score += 5;
  }
  if (!hasH1) {
    issues.push('Missing H1 heading - poor SEO structure');
    score += 5;
  }

  // 7. Check for contact methods
  const hasContactForm = /type=["']email["']|<form.*contact|contact.*form/i.test(html);
  const hasPhone = /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(html);

  // 8. Check for social links
  const socialPatterns = [
    /facebook\.com/i,
    /twitter\.com|x\.com/i,
    /instagram\.com/i,
    /linkedin\.com/i,
    /youtube\.com/i,
  ];
  const socialLinks = socialPatterns
    .filter(pattern => pattern.test(html))
    .map(pattern => {
      const match = pattern.toString();
      if (match.includes('facebook')) return 'Facebook';
      if (match.includes('twitter') || match.includes('x.com')) return 'Twitter/X';
      if (match.includes('instagram')) return 'Instagram';
      if (match.includes('linkedin')) return 'LinkedIn';
      if (match.includes('youtube')) return 'YouTube';
      return 'Social';
    });

  // 9. Detect technologies
  const technologies: string[] = [];
  if (/wordpress|wp-content/i.test(html)) technologies.push('WordPress');
  if (/wix\.com/i.test(html)) technologies.push('Wix');
  if (/squarespace/i.test(html)) technologies.push('Squarespace');
  if (/shopify/i.test(html)) technologies.push('Shopify');
  if (/react|__NEXT_DATA__|next\.js/i.test(html)) technologies.push('React/Next.js');
  if (/vue\.js|nuxt/i.test(html)) technologies.push('Vue/Nuxt');
  if (/bootstrap/i.test(html)) technologies.push('Bootstrap');
  if (/tailwind/i.test(html)) technologies.push('Tailwind CSS');
  if (/jquery/i.test(html)) technologies.push('jQuery');

  // 10. Check for Flash (very outdated)
  if (/\.swf|<embed.*flash|<object.*flash/i.test(html)) {
    issues.push('Uses Flash content - completely obsolete');
    score += 25;
  }

  // 11. Check for modern framework indicators (reduces score if modern)
  const isModern =
    technologies.includes('React/Next.js') ||
    technologies.includes('Vue/Nuxt') ||
    technologies.includes('Tailwind CSS');

  if (isModern) {
    // Modern site, reduce score
    score = Math.max(0, score - 15);
  }

  // Cap score at 80 for existing websites (save 100 for no website)
  score = Math.min(score, 80);

  // Determine status based on score
  let status: WebsiteAnalysis['status'];
  if (score >= 50) {
    status = 'poor';
  } else if (score >= 25) {
    status = 'outdated';
  } else {
    status = 'good';
  }

  return {
    status,
    score,
    issues: issues.length > 0 ? issues : ['Website appears to be in good condition'],
    lastUpdated: copyrightYear ? String(copyrightYear) : undefined,
    technologies: technologies.length > 0 ? technologies : undefined,
    hasSSL,
    loadTime,
    mobileResponsive,
    hasContactForm,
    socialLinks: socialLinks.length > 0 ? socialLinks : undefined,
  };
}

// ============================================
// CONTENT EXTRACTION FOR WEBSITE IMPROVEMENT
// ============================================

/**
 * Interface for extracted website content
 */
export interface ExtractedContent {
  url: string;
  colors: {
    primary?: string;
    secondary?: string;
    accent?: string;
  };
  content: {
    headline?: string;
    tagline?: string;
    headings: string[];
    paragraphs: string[];
  };
  structure: {
    layout: 'hero-centric' | 'grid-based' | 'single-column' | 'sidebar' | 'unknown';
    hasCTA: boolean;
    hasGallery: boolean;
  };
  images: string[];
  // NEW: All extracted colors with usage context
  allColors?: Array<{
    hex: string;
    usage: 'background' | 'text' | 'button' | 'accent' | 'border' | 'unknown';
    frequency: number;
  }>;
  // NEW: Page structure for mimicking
  pageStructure?: {
    navigation: {
      items: string[];
      style: 'horizontal' | 'hamburger' | 'sidebar' | 'none';
    };
    sections: Array<{
      type: 'hero' | 'features' | 'testimonials' | 'pricing' | 'cta' | 'about' | 'services' | 'gallery' | 'contact' | 'faq' | 'stats' | 'team' | 'partners' | 'unknown';
      heading?: string;
      hasImage: boolean;
      layout: 'centered' | 'split-left' | 'split-right' | 'grid' | 'cards' | 'unknown';
    }>;
    footer: {
      hasContact: boolean;
      hasSocial: boolean;
      columns: number;
    };
  };
}

/**
 * Extract content from a website URL
 * Uses linkedom for DOM parsing (lighter weight than jsdom)
 */
export async function extractWebsiteContent(url: string): Promise<ExtractedContent> {
  try {
    // Normalize URL
    let normalizedUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      normalizedUrl = `https://${url}`;
    }

    // Fetch HTML
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(normalizedUrl, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; WebsiteImprover/1.0; +http://example.com/bot)',
        'Accept': 'text/html,application/xhtml+xml',
      },
      redirect: 'follow',
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }

    const html = await response.text();

    // Parse HTML using linkedom
    const { parseHTML } = await import('linkedom');
    const dom = parseHTML(html);
    const document = dom.document;

    // Extract colors
    const colors = extractColors(html, document);

    // Extract all colors with usage context
    const allColors = extractAllColors(html, document);

    // Extract text content
    const content = extractTextContent(document);

    // Analyze structure
    const structure = analyzeStructure(document);

    // Extract page structure for mimicking
    const pageStructure = extractPageStructure(document);

    // Extract images
    const images = extractImages(document, normalizedUrl);

    return {
      url: normalizedUrl,
      colors,
      content,
      structure,
      images,
      allColors,
      pageStructure,
    };
  } catch (error) {
    // Return minimal content on error
    return {
      url: url,
      colors: {},
      content: {
        headings: [],
        paragraphs: [],
      },
      structure: {
        layout: 'unknown',
        hasCTA: false,
        hasGallery: false,
      },
      images: [],
    };
  }
}

/**
 * Extract color information from HTML
 */
function extractColors(
  html: string,
  document: any
): ExtractedContent['colors'] {
  const colors: ExtractedContent['colors'] = {};

  // Try to extract from inline styles first
  const colorPatterns = [
    /#[0-9A-Fa-f]{6}\b/g, // Hex colors
    /rgb\([0-9, ]+\)/g, // RGB colors
  ];

  const allMatches = new Set<string>();
  colorPatterns.forEach(pattern => {
    const matches = html.match(pattern);
    if (matches) {
      matches.forEach(m => allMatches.add(m));
    }
  });

  const colorArray = Array.from(allMatches).slice(0, 10); // Get top 10

  // Assign to color roles
  if (colorArray.length > 0) colors.primary = colorArray[0];
  if (colorArray.length > 1) colors.secondary = colorArray[1];
  if (colorArray.length > 2) colors.accent = colorArray[2];

  // Fallback: Look for theme-color meta tag
  const themeColor = document.querySelector('meta[name="theme-color"]');
  if (themeColor && !colors.primary) {
    colors.primary = themeColor.getAttribute('content');
  }

  return colors;
}

/**
 * Extract text content from HTML
 */
function extractTextContent(document: any): ExtractedContent['content'] {
  const content: ExtractedContent['content'] = {
    headings: [],
    paragraphs: [],
  };

  // Extract headline (usually h1 or page title)
  const h1 = document.querySelector('h1');
  if (h1) {
    content.headline = h1.textContent?.trim().substring(0, 100);
  }

  // Extract tagline (often in subtitle or meta description)
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) {
    content.tagline = metaDesc.getAttribute('content')?.substring(0, 160);
  }

  // Extract all headings
  const headings = document.querySelectorAll('h2, h3, h4');
  headings.forEach((h: any) => {
    const text = h.textContent?.trim();
    if (text && text.length < 200) {
      content.headings.push(text);
    }
  });

  // Extract paragraphs (get first few substantial ones)
  const paragraphs = document.querySelectorAll('p');
  let paraCount = 0;
  paragraphs.forEach((p: any) => {
    if (paraCount < 5) {
      const text = p.textContent?.trim();
      if (text && text.length > 20 && text.length < 500) {
        content.paragraphs.push(text);
        paraCount++;
      }
    }
  });

  return content;
}

/**
 * Analyze website structure/layout
 */
function analyzeStructure(document: any): ExtractedContent['structure'] {
  const structure: ExtractedContent['structure'] = {
    layout: 'unknown',
    hasCTA: false,
    hasGallery: false,
  };

  const html = document.documentElement.outerHTML;

  // Detect layout patterns
  const hasHeroSection = !!document.querySelector('[class*="hero"], [class*="banner"], header');
  const hasGridLayout = !!document.querySelector('[class*="grid"], [class*="flex"], [class*="col"]');
  const hasSidebar = !!document.querySelector('aside');
  const isLongScrolling = html.length > 50000; // Longer content often indicates single-column

  if (hasHeroSection && !hasGridLayout) {
    structure.layout = 'hero-centric';
  } else if (hasGridLayout && !hasSidebar) {
    structure.layout = 'grid-based';
  } else if (hasSidebar) {
    structure.layout = 'sidebar';
  } else if (isLongScrolling) {
    structure.layout = 'single-column';
  }

  // Check for CTA buttons
  const buttons = document.querySelectorAll('button, a[class*="btn"], a[class*="cta"]');
  structure.hasCTA = buttons.length > 0;

  // Check for gallery/portfolio
  const gallery = !!document.querySelector('[class*="gallery"], [class*="portfolio"], [class*="carousel"]');
  structure.hasGallery = gallery;

  return structure;
}

/**
 * Extract image URLs
 */
function extractImages(document: any, baseUrl: string): string[] {
  const images: string[] = [];
  const imgElements = document.querySelectorAll('img');

  imgElements.forEach((img: any, index: number) => {
    if (index < 10) { // Limit to first 10
      let src = img.getAttribute('src') || img.getAttribute('data-src');
      if (src) {
        // Convert relative URLs to absolute
        if (src.startsWith('/')) {
          const baseUrlObj = new URL(baseUrl);
          src = `${baseUrlObj.origin}${src}`;
        } else if (!src.startsWith('http')) {
          src = `${baseUrl}/${src}`;
        }
        images.push(src);
      }
    }
  });

  return images;
}

/**
 * Extract all colors with usage context
 */
type ColorUsage = 'background' | 'text' | 'button' | 'accent' | 'border' | 'unknown';

function extractAllColors(
  html: string,
  document: any
): ExtractedContent['allColors'] {
  const colorMap = new Map<string, { usage: ColorUsage; count: number }>();

  // Helper to normalize hex colors
  const normalizeHex = (color: string): string | null => {
    // Convert RGB to hex
    const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (rgbMatch) {
      const r = parseInt(rgbMatch[1]);
      const g = parseInt(rgbMatch[2]);
      const b = parseInt(rgbMatch[3]);
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`.toUpperCase();
    }

    // Already hex
    if (color.match(/^#[0-9A-Fa-f]{6}$/)) {
      return color.toUpperCase();
    }
    if (color.match(/^#[0-9A-Fa-f]{3}$/)) {
      // Expand 3-digit hex
      return `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`.toUpperCase();
    }

    return null;
  };

  // Helper to add color with usage
  const addColor = (hex: string | null, usage: ColorUsage) => {
    if (!hex) return;

    // Skip very light (near white) or very dark (near black) colors
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    if (brightness < 20 || brightness > 235) return; // Skip near black/white

    const existing = colorMap.get(hex);
    if (existing) {
      existing.count++;
      // Keep more specific usage
      if (usage !== 'unknown' && existing.usage === 'unknown') {
        existing.usage = usage;
      }
    } else {
      colorMap.set(hex, { usage, count: 1 });
    }
  };

  // Extract from style attributes
  const allElements = document.querySelectorAll('[style]');
  allElements.forEach((el: any) => {
    const style = el.getAttribute('style') || '';

    // Background colors
    const bgMatch = style.match(/background(?:-color)?:\s*([^;]+)/);
    if (bgMatch) {
      addColor(normalizeHex(bgMatch[1].trim()), 'background');
    }

    // Text colors
    const colorMatch = style.match(/(?:^|;)\s*color:\s*([^;]+)/);
    if (colorMatch) {
      addColor(normalizeHex(colorMatch[1].trim()), 'text');
    }

    // Border colors
    const borderMatch = style.match(/border(?:-color)?:\s*([^;]+)/);
    if (borderMatch) {
      addColor(normalizeHex(borderMatch[1].trim()), 'border');
    }
  });

  // Extract from buttons
  const buttons = document.querySelectorAll('button, a[class*="btn"], [class*="button"]');
  buttons.forEach((btn: any) => {
    const style = btn.getAttribute('style') || '';
    const bgMatch = style.match(/background(?:-color)?:\s*([^;]+)/);
    if (bgMatch) {
      addColor(normalizeHex(bgMatch[1].trim()), 'button');
    }
  });

  // Extract from CSS in <style> tags
  const styleTags = document.querySelectorAll('style');
  styleTags.forEach((styleTag: any) => {
    const css = styleTag.textContent || '';
    const hexColors = css.match(/#[0-9A-Fa-f]{3,6}/g) || [];
    hexColors.forEach((hex: string) => addColor(normalizeHex(hex), 'unknown'));

    const rgbColors = css.match(/rgb\(\d+,\s*\d+,\s*\d+\)/g) || [];
    rgbColors.forEach((rgb: string) => addColor(normalizeHex(rgb), 'unknown'));
  });

  // Extract from inline hex colors in HTML
  const htmlHexColors = html.match(/#[0-9A-Fa-f]{6}/g) || [];
  htmlHexColors.forEach(hex => addColor(normalizeHex(hex), 'unknown'));

  // Theme color meta tag
  const themeColor = document.querySelector('meta[name="theme-color"]');
  if (themeColor) {
    addColor(normalizeHex(themeColor.getAttribute('content')), 'accent');
  }

  // Convert to array and sort by frequency
  const colors = Array.from(colorMap.entries())
    .map(([hex, data]) => ({
      hex,
      usage: data.usage,
      frequency: data.count,
    }))
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 10); // Top 10 colors

  return colors.length > 0 ? colors : undefined;
}

/**
 * Extract page structure for mimicking
 */
type NavStyle = 'horizontal' | 'hamburger' | 'sidebar' | 'none';
type SectionType = 'hero' | 'features' | 'testimonials' | 'pricing' | 'cta' | 'about' | 'services' | 'gallery' | 'contact' | 'faq' | 'stats' | 'team' | 'partners' | 'unknown';
type SectionLayout = 'centered' | 'split-left' | 'split-right' | 'grid' | 'cards' | 'unknown';

function extractPageStructure(document: any): ExtractedContent['pageStructure'] {
  // Extract navigation
  const navItems: string[] = [];
  let navStyle: NavStyle = 'none';

  const nav = document.querySelector('nav, header nav, [class*="nav"], [class*="menu"]');
  if (nav) {
    const links = nav.querySelectorAll('a');
    links.forEach((link: any) => {
      const text = link.textContent?.trim();
      if (text && text.length < 30 && !text.match(/^(logo|icon|img)$/i)) {
        navItems.push(text);
      }
    });

    // Detect nav style
    const navClass = nav.className || '';
    if (navClass.match(/hamburger|mobile|toggle/i) || nav.querySelector('[class*="hamburger"], [class*="toggle"]')) {
      navStyle = 'hamburger';
    } else if (navClass.match(/sidebar|vertical/i)) {
      navStyle = 'sidebar';
    } else {
      navStyle = 'horizontal';
    }
  }

  // Extract sections
  const sections: Array<{
    type: SectionType;
    heading?: string;
    hasImage: boolean;
    layout: SectionLayout;
  }> = [];
  const sectionElements = document.querySelectorAll('section, [class*="section"], main > div, article');

  sectionElements.forEach((section: any) => {
    const className = (section.className || '').toLowerCase();
    const id = (section.id || '').toLowerCase();
    const innerText = section.textContent?.toLowerCase() || '';

    // Determine section type
    let type: SectionType = 'unknown';

    if (className.match(/hero|banner|jumbotron/) || id.match(/hero|banner/)) {
      type = 'hero';
    } else if (className.match(/feature|benefit/) || id.match(/feature/)) {
      type = 'features';
    } else if (className.match(/testimonial|review|quote/) || innerText.includes('testimonial')) {
      type = 'testimonials';
    } else if (className.match(/pricing|plan/) || id.match(/pricing/)) {
      type = 'pricing';
    } else if (className.match(/cta|call-to-action/) || id.match(/cta/)) {
      type = 'cta';
    } else if (className.match(/about/) || id.match(/about/) || innerText.includes('about us')) {
      type = 'about';
    } else if (className.match(/service|offering/) || id.match(/service/)) {
      type = 'services';
    } else if (className.match(/gallery|portfolio|work/) || id.match(/gallery|portfolio/)) {
      type = 'gallery';
    } else if (className.match(/contact|form/) || id.match(/contact/) || section.querySelector('form')) {
      type = 'contact';
    } else if (className.match(/faq|question/) || id.match(/faq/)) {
      type = 'faq';
    } else if (className.match(/stat|number|counter/) || id.match(/stat/)) {
      type = 'stats';
    } else if (className.match(/team|staff/) || id.match(/team/)) {
      type = 'team';
    } else if (className.match(/partner|client|logo/) || id.match(/partner/)) {
      type = 'partners';
    }

    // Get heading
    const heading = section.querySelector('h1, h2, h3');
    const headingText = heading?.textContent?.trim().substring(0, 100);

    // Check for images
    const hasImage = !!section.querySelector('img, [class*="image"], [style*="background-image"]');

    // Determine layout
    let layout: SectionLayout = 'unknown';
    if (className.match(/center|centered/) || section.style?.textAlign === 'center') {
      layout = 'centered';
    } else if (className.match(/grid|col/) || section.querySelector('[class*="grid"], [class*="col-"]')) {
      layout = 'grid';
    } else if (className.match(/card/) || section.querySelector('[class*="card"]')) {
      layout = 'cards';
    } else if (section.querySelector('img') && section.querySelector('p, h2, h3')) {
      // Image + text combo
      const img = section.querySelector('img');
      const imgRect = img?.getBoundingClientRect?.();
      // Approximate: if image is on left side
      if (imgRect && imgRect.left < 400) {
        layout = 'split-left';
      } else {
        layout = 'split-right';
      }
    }

    sections.push({
      type,
      heading: headingText,
      hasImage,
      layout,
    });
  });

  // Extract footer info
  const footer = document.querySelector('footer');
  let footerInfo = {
    hasContact: false,
    hasSocial: false,
    columns: 1,
  };

  if (footer) {
    footerInfo.hasContact = !!(footer.querySelector('a[href^="mailto:"], a[href^="tel:"], [class*="contact"]') ||
      footer.textContent?.match(/\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/));

    footerInfo.hasSocial = !!(footer.querySelector('[class*="social"], a[href*="facebook"], a[href*="twitter"], a[href*="instagram"], a[href*="linkedin"]'));

    // Count columns (divs or flex/grid children)
    const footerChildren = footer.querySelectorAll(':scope > div, :scope > nav, :scope > section');
    footerInfo.columns = Math.min(footerChildren.length, 5) || 1;
  }

  return {
    navigation: {
      items: navItems.slice(0, 10), // Max 10 nav items
      style: navStyle,
    },
    sections: sections.filter((s: { type: SectionType }) => s.type !== 'unknown').slice(0, 15), // Max 15 sections, exclude unknown
    footer: footerInfo,
  };
}

// ============================================
// BATCH ANALYSIS
// ============================================

/**
 * Analyze multiple websites in parallel
 * Returns Map of URL -> AnalysisResult
 */
export async function analyzeMultipleWebsites(
  urls: (string | undefined)[],
  concurrency: number = 5
): Promise<Map<string | undefined, AnalysisResult>> {
  const results = new Map<string | undefined, AnalysisResult>();

  // Process in batches to avoid overwhelming servers
  for (let i = 0; i < urls.length; i += concurrency) {
    const batch = urls.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map(async (url) => {
        const analysis = await analyzeWebsite(url);
        return { url, analysis };
      })
    );

    batchResults.forEach(({ url, analysis }) => {
      results.set(url, analysis);
    });
  }

  return results;
}

// ============================================
// SCORING UTILITIES
// ============================================

/**
 * Get priority level based on website analysis
 */
export function getWebsitePriority(analysis: WebsiteAnalysis): 'high' | 'medium' | 'low' {
  if (analysis.status === 'none' || analysis.status === 'broken' || analysis.status === 'poor') {
    return 'high';
  }
  if (analysis.status === 'outdated') {
    return 'medium';
  }
  return 'low';
}

/**
 * Format analysis for display in chat
 */
export function formatAnalysisForChat(analysis: AnalysisResult, businessName?: string): string {
  const name = businessName || 'Business';
  const priority = getWebsitePriority(analysis);

  let output = `**${name}**\n`;
  output += `Status: ${analysis.status.toUpperCase()} | Score: ${analysis.score}/100 | Priority: ${priority.toUpperCase()}\n`;

  if (analysis.issues.length > 0) {
    output += `Issues:\n`;
    analysis.issues.forEach(issue => {
      output += `  - ${issue}\n`;
    });
  }

  if (analysis.technologies && analysis.technologies.length > 0) {
    output += `Tech: ${analysis.technologies.join(', ')}\n`;
  }

  return output;
}

/**
 * Group businesses by website status for summary
 */
export function groupByWebsiteStatus(
  analyses: Map<string, AnalysisResult>
): {
  none: string[];
  broken: string[];
  poor: string[];
  outdated: string[];
  good: string[];
} {
  const groups = {
    none: [] as string[],
    broken: [] as string[],
    poor: [] as string[],
    outdated: [] as string[],
    good: [] as string[],
  };

  analyses.forEach((analysis, key) => {
    groups[analysis.status].push(key);
  });

  return groups;
}
