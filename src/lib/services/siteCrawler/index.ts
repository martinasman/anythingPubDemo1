/**
 * Site Crawler Service
 *
 * Multi-page website crawler that extracts content, forms, images,
 * brand elements, and navigation structure from entire websites.
 */

import type {
  CrawlConfig,
  CrawledPage,
  CrawledSiteData,
  CrawlProgress,
  ProgressCallback,
  PageMeta,
  PageContent,
  PageImage,
  PageLinks,
  BrandData,
  NavigationData,
  GlobalElements,
  NavItem,
} from './types';
import { DEFAULT_CRAWL_CONFIG } from './types';
import { extractForms } from './formExtractor';

// ============================================
// MAIN CRAWL FUNCTION
// ============================================

/**
 * Crawl an entire website starting from a URL
 */
export async function crawlSite(
  startUrl: string,
  config: Partial<CrawlConfig> = {},
  onProgress?: ProgressCallback
): Promise<CrawledSiteData> {
  const finalConfig: CrawlConfig = { ...DEFAULT_CRAWL_CONFIG, ...config };
  const startTime = Date.now();

  // Normalize start URL
  let normalizedUrl = startUrl;
  if (!startUrl.startsWith('http://') && !startUrl.startsWith('https://')) {
    normalizedUrl = `https://${startUrl}`;
  }

  const urlObj = new URL(normalizedUrl);
  const domain = urlObj.hostname;
  const baseUrl = `${urlObj.protocol}//${urlObj.hostname}`;

  // Crawl state
  const visited = new Set<string>();
  const queue: Array<{ url: string; depth: number }> = [{ url: normalizedUrl, depth: 0 }];
  const pages: CrawledPage[] = [];
  const rawHtmlPages: string[] = []; // Store raw HTML for color extraction
  const errors: Array<{ url: string; error: string }> = [];
  let lastRequestTime = 0;

  // Progress tracking
  const progress: CrawlProgress = {
    phase: 'initializing',
    pagesDiscovered: 1,
    pagesCrawled: 0,
    totalPages: 1,
    currentUrl: normalizedUrl,
    message: 'Starting crawl...',
    extracted: {
      logoFound: false,
      colorsFound: 0,
      formsFound: 0,
      imagesFound: 0,
    },
    errors: [],
  };

  const emitProgress = async (updates: Partial<CrawlProgress>) => {
    Object.assign(progress, updates);
    if (onProgress) {
      await onProgress(progress);
    }
  };

  await emitProgress({ phase: 'discovering', message: `Discovering pages on ${domain}...` });

  // BFS crawl
  while (queue.length > 0 && pages.length < finalConfig.maxPages) {
    const { url, depth } = queue.shift()!;

    // Skip if already visited or too deep
    const normalizedPath = normalizeUrl(url, baseUrl);
    if (visited.has(normalizedPath) || depth > finalConfig.maxDepth) {
      continue;
    }
    visited.add(normalizedPath);

    // Rate limiting
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    if (timeSinceLastRequest < finalConfig.rateLimit) {
      await sleep(finalConfig.rateLimit - timeSinceLastRequest);
    }
    lastRequestTime = Date.now();

    await emitProgress({
      phase: 'crawling',
      currentUrl: url,
      pagesCrawled: pages.length,
      message: `Crawling page ${pages.length + 1}/${Math.min(queue.length + pages.length + 1, finalConfig.maxPages)}: ${getPathFromUrl(url)}`,
    });

    try {
      // Fetch the page
      const result = await fetchAndParsePage(url, depth, finalConfig, baseUrl);

      if (result) {
        const { page: pageData, html } = result;
        pages.push(pageData);
        rawHtmlPages.push(html); // Store HTML for color extraction

        // Update extracted counts
        await emitProgress({
          pagesCrawled: pages.length,
          currentPageTitle: pageData.title,
          extracted: {
            logoFound: progress.extracted.logoFound || pageData.images.some((img) => img.isLogo),
            colorsFound: progress.extracted.colorsFound, // Updated during aggregation
            formsFound: progress.extracted.formsFound + pageData.forms.length,
            imagesFound: progress.extracted.imagesFound + pageData.images.length,
          },
        });

        // Add internal links to queue
        for (const link of pageData.links.internal) {
          if (!visited.has(normalizeUrl(link, baseUrl))) {
            queue.push({ url: link, depth: depth + 1 });
          }
        }

        await emitProgress({
          pagesDiscovered: visited.size + queue.length,
          totalPages: Math.min(visited.size + queue.length, finalConfig.maxPages),
        });
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      errors.push({ url, error: errorMsg });
      await emitProgress({ errors });
    }
  }

  // Aggregation phase
  await emitProgress({
    phase: 'aggregating',
    message: 'Extracting brand and navigation...',
  });

  const brand = extractBrandFromPages(pages, baseUrl, rawHtmlPages);
  const navigation = buildNavigation(pages);
  const globalElements = extractGlobalElements(pages);
  const stats = computeStats(pages);

  await emitProgress({
    phase: 'complete',
    message: `Crawl complete! Found ${pages.length} pages.`,
    extracted: {
      logoFound: !!brand.logo,
      colorsFound: brand.colors.allColors.length,
      formsFound: pages.reduce((sum, p) => sum + p.forms.length, 0),
      imagesFound: pages.reduce((sum, p) => sum + p.images.length, 0),
    },
  });

  return {
    domain,
    sourceUrl: normalizedUrl,
    crawledAt: new Date().toISOString(),
    crawlDuration: Date.now() - startTime,
    pages,
    brand,
    navigation,
    globalElements,
    stats,
  };
}

// ============================================
// PAGE FETCHING & PARSING
// ============================================

async function fetchAndParsePage(
  url: string,
  depth: number,
  config: CrawlConfig,
  baseUrl: string
): Promise<{ page: CrawledPage; html: string } | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.timeout);

  const startTime = Date.now();

  try {
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'User-Agent': config.userAgent,
        Accept: 'text/html,application/xhtml+xml',
      },
      redirect: 'follow',
    });

    clearTimeout(timeoutId);
    const loadTime = Date.now() - startTime;

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) {
      return null; // Skip non-HTML pages
    }

    const html = await response.text();
    const page = extractPageData(html, url, depth, baseUrl, loadTime);
    return { page, html };
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Extract all data from a page's HTML
 */
export function extractPageData(
  html: string,
  url: string,
  depth: number,
  baseUrl: string,
  loadTime: number
): CrawledPage {
  // Use linkedom for parsing (already a dependency)
  const { parseHTML } = require('linkedom');
  const { document } = parseHTML(html);

  const urlObj = new URL(url);
  const path = urlObj.pathname || '/';

  return {
    url,
    path,
    title: extractTitle(document),
    meta: extractMeta(document),
    content: extractContent(document),
    images: extractImages(document, baseUrl),
    forms: extractForms(document),
    links: extractLinks(document, baseUrl),
    pageType: detectPageType(path, document),
    depth,
    crawledAt: new Date().toISOString(),
    loadTime,
  };
}

// ============================================
// CONTENT EXTRACTION
// ============================================

function extractTitle(document: Document): string {
  const titleEl = document.querySelector('title');
  if (titleEl?.textContent) {
    return titleEl.textContent.trim();
  }

  const h1 = document.querySelector('h1');
  if (h1?.textContent) {
    return h1.textContent.trim();
  }

  return 'Untitled';
}

function extractMeta(document: Document): PageMeta {
  const getMeta = (name: string): string | undefined => {
    const el =
      document.querySelector(`meta[name="${name}"]`) || document.querySelector(`meta[property="${name}"]`);
    return el?.getAttribute('content') || undefined;
  };

  const keywords = getMeta('keywords');

  return {
    description: getMeta('description'),
    keywords: keywords ? keywords.split(',').map((k: string) => k.trim()) : undefined,
    ogTitle: getMeta('og:title'),
    ogDescription: getMeta('og:description'),
    ogImage: getMeta('og:image'),
    favicon: document.querySelector('link[rel="icon"]')?.getAttribute('href') || undefined,
  };
}

function extractContent(document: Document): PageContent {
  const headings: PageContent['headings'] = [];
  const paragraphs: string[] = [];
  const lists: PageContent['lists'] = [];

  // Extract headings
  for (let level = 1; level <= 6; level++) {
    document.querySelectorAll(`h${level}`).forEach((el: Element) => {
      const text = el.textContent?.trim();
      if (text && text.length > 0) {
        headings.push({ level: level as 1 | 2 | 3 | 4 | 5 | 6, text });
      }
    });
  }

  // Extract paragraphs (skip navigation, footer, header)
  document.querySelectorAll('p').forEach((el: Element) => {
    // Skip if inside nav, header, or footer
    if (el.closest('nav, header, footer')) return;

    const text = el.textContent?.trim();
    if (text && text.length > 20) {
      // Only meaningful paragraphs
      paragraphs.push(text);
    }
  });

  // Extract lists
  document.querySelectorAll('ul, ol').forEach((el: Element) => {
    if (el.closest('nav, header, footer')) return;

    const items: string[] = [];
    el.querySelectorAll('li').forEach((li: Element) => {
      const text = li.textContent?.trim();
      if (text) items.push(text);
    });

    if (items.length > 0) {
      lists.push({
        type: el.tagName.toLowerCase() as 'ul' | 'ol',
        items,
      });
    }
  });

  return { headings, paragraphs, lists };
}

function extractImages(document: Document, baseUrl: string): PageImage[] {
  const images: PageImage[] = [];
  const seen = new Set<string>();

  document.querySelectorAll('img').forEach((img: Element) => {
    let src = img.getAttribute('src') || img.getAttribute('data-src');
    if (!src) return;

    // Convert relative to absolute
    src = resolveUrl(src, baseUrl);

    // Skip duplicates and data URIs (unless they're logos)
    if (seen.has(src)) return;
    if (src.startsWith('data:') && !isLikelyLogo(img)) return;
    seen.add(src);

    const alt = img.getAttribute('alt') || '';
    const isLogo = isLikelyLogo(img);
    const isHero = isLikelyHero(img);

    images.push({
      src,
      alt: alt || undefined,
      title: img.getAttribute('title') || undefined,
      isLogo,
      isHero,
      width: parseInt(img.getAttribute('width') || '0') || undefined,
      height: parseInt(img.getAttribute('height') || '0') || undefined,
    });
  });

  return images;
}

function isLikelyLogo(img: Element): boolean {
  const src = (img.getAttribute('src') || '').toLowerCase();
  const alt = (img.getAttribute('alt') || '').toLowerCase();
  const className = (img.getAttribute('class') || '').toLowerCase();
  const id = (img.getAttribute('id') || '').toLowerCase();

  // Check for logo indicators
  const logoIndicators = ['logo', 'brand', 'site-logo', 'header-logo'];
  for (const indicator of logoIndicators) {
    if (src.includes(indicator) || alt.includes(indicator) || className.includes(indicator) || id.includes(indicator)) {
      return true;
    }
  }

  // Check if in header
  if (img.closest('header') && !img.closest('nav')) {
    return true;
  }

  return false;
}

function isLikelyHero(img: Element): boolean {
  const className = (img.getAttribute('class') || '').toLowerCase();
  const parentClass = (img.parentElement?.getAttribute('class') || '').toLowerCase();

  const heroIndicators = ['hero', 'banner', 'jumbotron', 'cover', 'featured'];
  for (const indicator of heroIndicators) {
    if (className.includes(indicator) || parentClass.includes(indicator)) {
      return true;
    }
  }

  // Check if it's a large image near the top
  const width = parseInt(img.getAttribute('width') || '0');
  if (width > 800) {
    return true;
  }

  return false;
}

function extractLinks(document: Document, baseUrl: string): PageLinks {
  const internal: string[] = [];
  const external: string[] = [];
  const emails: string[] = [];
  const phones: string[] = [];

  const baseUrlObj = new URL(baseUrl);

  document.querySelectorAll('a[href]').forEach((a: Element) => {
    const href = a.getAttribute('href');
    if (!href) return;

    // Handle mailto and tel
    if (href.startsWith('mailto:')) {
      const email = href.replace('mailto:', '').split('?')[0];
      if (email && !emails.includes(email)) {
        emails.push(email);
      }
      return;
    }

    if (href.startsWith('tel:')) {
      const phone = href.replace('tel:', '');
      if (phone && !phones.includes(phone)) {
        phones.push(phone);
      }
      return;
    }

    // Skip anchors and javascript
    if (href.startsWith('#') || href.startsWith('javascript:')) {
      return;
    }

    // Resolve URL
    const resolvedUrl = resolveUrl(href, baseUrl);
    if (!resolvedUrl) return;

    try {
      const urlObj = new URL(resolvedUrl);

      if (urlObj.hostname === baseUrlObj.hostname) {
        // Internal link
        if (!internal.includes(resolvedUrl)) {
          internal.push(resolvedUrl);
        }
      } else {
        // External link
        if (!external.includes(resolvedUrl)) {
          external.push(resolvedUrl);
        }
      }
    } catch {
      // Invalid URL, skip
    }
  });

  return { internal, external, emails, phones };
}

// ============================================
// BRAND EXTRACTION
// ============================================

export function extractBrandFromPages(pages: CrawledPage[], baseUrl: string, rawHtmlPages: string[] = []): BrandData {
  // Find logo (appears on most pages, usually in header)
  const logoCandidates = new Map<string, number>();

  for (const page of pages) {
    for (const img of page.images) {
      if (img.isLogo) {
        const count = logoCandidates.get(img.src) || 0;
        logoCandidates.set(img.src, count + 1);
      }
    }
  }

  // Logo that appears on most pages
  let logo: string | undefined;
  let logoAlt: string | undefined;
  let maxCount = 0;

  for (const [src, count] of logoCandidates) {
    if (count > maxCount) {
      maxCount = count;
      logo = src;
      // Find alt text
      for (const page of pages) {
        const img = page.images.find((i) => i.src === src);
        if (img?.alt) {
          logoAlt = img.alt;
          break;
        }
      }
    }
  }

  // Extract company name from title or logo alt
  let companyName: string | undefined;
  if (logoAlt) {
    companyName = logoAlt;
  } else if (pages.length > 0) {
    // Try to extract from homepage title
    const homePage = pages.find((p) => p.path === '/') || pages[0];
    const title = homePage.title;
    // Common patterns: "Company Name | Tagline" or "Company Name - Tagline"
    const parts = title.split(/[|\-–—]/);
    if (parts.length > 0) {
      companyName = parts[0].trim();
    }
  }

  // Extract colors from raw HTML (the real extraction!)
  const colors = rawHtmlPages.length > 0
    ? extractColorsFromHtml(rawHtmlPages)
    : extractColorsFromPages(pages);

  // Extract fonts (would need CSS parsing)
  const fonts = {
    heading: undefined as string | undefined,
    body: undefined as string | undefined,
    allFonts: [] as string[],
  };

  return {
    logo,
    logoAlt,
    companyName,
    tagline: extractTagline(pages),
    colors,
    fonts,
  };
}

function extractColorsFromPages(pages: CrawledPage[]): BrandData['colors'] {
  const colorCounts = new Map<string, number>();

  // We need HTML to extract colors - check if pages have rawHtml stored
  // If not, we'll return empty (caller should pass HTML separately)
  return {
    primary: undefined,
    secondary: undefined,
    accent: undefined,
    background: undefined,
    text: undefined,
    allColors: [],
  };
}

/**
 * Extract colors from raw HTML content
 * This is the real color extraction function
 */
export function extractColorsFromHtml(htmlContent: string[]): BrandData['colors'] {
  const colorCounts = new Map<string, number>();

  // Regex patterns for different color formats
  const hexColorRegex = /#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})\b/g;
  const rgbColorRegex = /rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)/gi;
  const rgbaColorRegex = /rgba\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*[\d.]+\s*\)/gi;

  for (const html of htmlContent) {
    // Extract theme-color meta tag (highest priority)
    const themeColorMatch = html.match(/<meta[^>]*name=["']theme-color["'][^>]*content=["']([^"']+)["']/i);
    if (themeColorMatch) {
      const color = normalizeColor(themeColorMatch[1]);
      if (color) {
        colorCounts.set(color, (colorCounts.get(color) || 0) + 100); // High weight
      }
    }

    // Extract colors from <style> tags
    const styleMatches = html.match(/<style[^>]*>([\s\S]*?)<\/style>/gi) || [];
    for (const styleBlock of styleMatches) {
      extractColorsFromText(styleBlock, colorCounts);
    }

    // Extract colors from inline style attributes
    const inlineStyleMatches = html.match(/style=["'][^"']*["']/gi) || [];
    for (const style of inlineStyleMatches) {
      extractColorsFromText(style, colorCounts);
    }

    // Look for CSS custom properties with color values
    const cssVarMatches = html.match(/--[\w-]+:\s*#[0-9A-Fa-f]{3,6}/gi) || [];
    for (const cssVar of cssVarMatches) {
      const hexMatch = cssVar.match(/#[0-9A-Fa-f]{3,6}/i);
      if (hexMatch) {
        const color = normalizeColor(hexMatch[0]);
        if (color) {
          colorCounts.set(color, (colorCounts.get(color) || 0) + 5); // CSS vars are intentional
        }
      }
    }
  }

  // Filter out neutral colors and sort by frequency
  const sortedColors = [...colorCounts.entries()]
    .filter(([color]) => !isNeutralColor(color))
    .sort((a, b) => b[1] - a[1]);

  // Also get background colors (might be neutral but important)
  const backgroundColors = [...colorCounts.entries()]
    .filter(([color]) => isLightColor(color))
    .sort((a, b) => b[1] - a[1]);

  // Get text colors (dark colors)
  const textColors = [...colorCounts.entries()]
    .filter(([color]) => isDarkColor(color) && !isNeutralColor(color))
    .sort((a, b) => b[1] - a[1]);

  return {
    primary: sortedColors[0]?.[0],
    secondary: sortedColors[1]?.[0],
    accent: sortedColors[2]?.[0],
    background: backgroundColors[0]?.[0],
    text: textColors[0]?.[0],
    allColors: sortedColors.slice(0, 10).map(([color, count]) => ({ color, count })),
  };
}

function extractColorsFromText(text: string, colorCounts: Map<string, number>): void {
  // Extract hex colors
  const hexMatches = text.match(/#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})\b/g) || [];
  for (const hex of hexMatches) {
    const normalized = normalizeColor(hex);
    if (normalized) {
      colorCounts.set(normalized, (colorCounts.get(normalized) || 0) + 1);
    }
  }

  // Extract rgb colors
  const rgbRegex = /rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)/gi;
  let rgbMatch;
  while ((rgbMatch = rgbRegex.exec(text)) !== null) {
    const hex = rgbToHex(parseInt(rgbMatch[1]), parseInt(rgbMatch[2]), parseInt(rgbMatch[3]));
    colorCounts.set(hex, (colorCounts.get(hex) || 0) + 1);
  }

  // Extract rgba colors (ignore alpha)
  const rgbaRegex = /rgba\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*[\d.]+\s*\)/gi;
  let rgbaMatch;
  while ((rgbaMatch = rgbaRegex.exec(text)) !== null) {
    const hex = rgbToHex(parseInt(rgbaMatch[1]), parseInt(rgbaMatch[2]), parseInt(rgbaMatch[3]));
    colorCounts.set(hex, (colorCounts.get(hex) || 0) + 1);
  }
}

function normalizeColor(color: string): string | null {
  color = color.trim().toLowerCase();

  // Handle 3-digit hex
  if (color.match(/^#[0-9a-f]{3}$/)) {
    return `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`;
  }

  // Handle 6-digit hex
  if (color.match(/^#[0-9a-f]{6}$/)) {
    return color;
  }

  return null;
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function isNeutralColor(hex: string): boolean {
  // Parse hex to RGB
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  // Calculate saturation
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 2 / 255;
  const saturation = max === min ? 0 : (max - min) / (lightness > 0.5 ? 510 - max - min : max + min);

  // Colors with very low saturation are neutral (black, white, grays)
  return saturation < 0.1;
}

function isLightColor(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.7;
}

function isDarkColor(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.3;
}

function extractTagline(pages: CrawledPage[]): string | undefined {
  const homePage = pages.find((p) => p.path === '/') || pages[0];
  if (!homePage) return undefined;

  // Look for tagline in meta description or first heading after H1
  if (homePage.meta.description) {
    const desc = homePage.meta.description;
    if (desc.length < 100) {
      return desc;
    }
  }

  // Look for short text near the top
  const h2 = homePage.content.headings.find((h) => h.level === 2);
  if (h2 && h2.text.length < 80) {
    return h2.text;
  }

  return undefined;
}

// ============================================
// NAVIGATION EXTRACTION
// ============================================

export function buildNavigation(pages: CrawledPage[]): NavigationData {
  // Find links that appear on most pages (likely navigation)
  const linkCounts = new Map<string, { count: number; text: string }>();

  for (const page of pages) {
    const seenOnPage = new Set<string>();
    for (const link of page.links.internal) {
      if (seenOnPage.has(link)) continue;
      seenOnPage.add(link);

      const existing = linkCounts.get(link);
      if (existing) {
        existing.count++;
      } else {
        // We'd need to track the link text during extraction
        linkCounts.set(link, { count: 1, text: getPathFromUrl(link) });
      }
    }
  }

  const threshold = Math.max(1, Math.floor(pages.length * 0.5));
  const navLinks: NavItem[] = [];

  for (const [url, data] of linkCounts) {
    if (data.count >= threshold) {
      navLinks.push({
        label: formatNavLabel(data.text),
        path: getPathFromUrl(url),
        isExternal: false,
      });
    }
  }

  // Sort by common page order
  const pageOrder = ['/', '/about', '/services', '/products', '/portfolio', '/blog', '/contact'];
  navLinks.sort((a, b) => {
    const aIndex = pageOrder.findIndex((p) => a.path.startsWith(p));
    const bIndex = pageOrder.findIndex((p) => b.path.startsWith(p));
    return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
  });

  return {
    primary: navLinks.slice(0, 8), // Limit to reasonable nav size
    footer: navLinks,
  };
}

function formatNavLabel(path: string): string {
  // Convert /about-us to "About Us"
  const name = path.replace(/^\//, '').replace(/-/g, ' ');
  if (!name) return 'Home';
  return name
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// ============================================
// GLOBAL ELEMENTS EXTRACTION
// ============================================

function extractGlobalElements(pages: CrawledPage[]): GlobalElements {
  const socialLinks: GlobalElements['socialLinks'] = [];
  const seenSocial = new Set<string>();

  // Common social media domains
  const socialPatterns: Record<string, GlobalElements['socialLinks'][0]['platform']> = {
    'facebook.com': 'facebook',
    'fb.com': 'facebook',
    'twitter.com': 'twitter',
    'x.com': 'twitter',
    'instagram.com': 'instagram',
    'linkedin.com': 'linkedin',
    'youtube.com': 'youtube',
    'tiktok.com': 'tiktok',
    'pinterest.com': 'pinterest',
    'github.com': 'github',
  };

  for (const page of pages) {
    for (const link of page.links.external) {
      if (seenSocial.has(link)) continue;

      for (const [domain, platform] of Object.entries(socialPatterns)) {
        if (link.includes(domain)) {
          seenSocial.add(link);
          socialLinks.push({ platform, url: link });
          break;
        }
      }
    }
  }

  // Extract contact info (use first found)
  let phone: string | undefined;
  let email: string | undefined;

  for (const page of pages) {
    if (!phone && page.links.phones.length > 0) {
      phone = page.links.phones[0];
    }
    if (!email && page.links.emails.length > 0) {
      email = page.links.emails[0];
    }
    if (phone && email) break;
  }

  return {
    socialLinks,
    contactInfo: {
      phone,
      email,
      address: undefined, // Would need more sophisticated extraction
    },
    copyright: undefined, // Would need footer text extraction
  };
}

// ============================================
// PAGE TYPE DETECTION
// ============================================

function detectPageType(path: string, document: Document): CrawledPage['pageType'] {
  const lowerPath = path.toLowerCase();

  if (lowerPath === '/' || lowerPath === '/index.html' || lowerPath === '/home') {
    return 'home';
  }

  const patterns: Record<string, CrawledPage['pageType']> = {
    '/about': 'about',
    '/contact': 'contact',
    '/services': 'services',
    '/products': 'products',
    '/blog': 'blog',
    '/news': 'blog',
    '/portfolio': 'portfolio',
    '/work': 'portfolio',
    '/projects': 'portfolio',
    '/pricing': 'pricing',
    '/faq': 'faq',
    '/team': 'team',
    '/privacy': 'legal',
    '/terms': 'legal',
    '/legal': 'legal',
  };

  for (const [pattern, type] of Object.entries(patterns)) {
    if (lowerPath.startsWith(pattern)) {
      return type;
    }
  }

  // Check for blog post pattern (usually has date or ID in URL)
  if (lowerPath.match(/\/blog\/[^/]+$/) || lowerPath.match(/\/\d{4}\/\d{2}\//)) {
    return 'blog-post';
  }

  return 'other';
}

// ============================================
// STATISTICS
// ============================================

function computeStats(pages: CrawledPage[]): CrawledSiteData['stats'] {
  let totalImages = 0;
  let totalForms = 0;
  let totalLinks = 0;
  let hasEcommerce = false;
  let hasBlog = false;
  const technologies = new Set<string>();

  for (const page of pages) {
    totalImages += page.images.length;
    totalForms += page.forms.length;
    totalLinks += page.links.internal.length + page.links.external.length;

    if (page.pageType === 'blog' || page.pageType === 'blog-post') {
      hasBlog = true;
    }

    // Detect e-commerce indicators
    if (
      page.path.includes('/cart') ||
      page.path.includes('/checkout') ||
      page.path.includes('/product') ||
      page.path.includes('/shop')
    ) {
      hasEcommerce = true;
    }
  }

  return {
    totalPages: pages.length,
    totalImages,
    totalForms,
    totalLinks,
    hasEcommerce,
    hasBlog,
    technologies: Array.from(technologies),
  };
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeUrl(url: string, baseUrl: string): string {
  try {
    const resolved = resolveUrl(url, baseUrl);
    const urlObj = new URL(resolved);
    // Remove trailing slash, query params, and hash
    return `${urlObj.origin}${urlObj.pathname.replace(/\/$/, '')}`;
  } catch {
    return url;
  }
}

function resolveUrl(url: string, baseUrl: string): string {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  if (url.startsWith('//')) {
    return `https:${url}`;
  }

  if (url.startsWith('/')) {
    const base = new URL(baseUrl);
    return `${base.origin}${url}`;
  }

  return new URL(url, baseUrl).href;
}

function getPathFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.pathname || '/';
  } catch {
    return url;
  }
}

// Re-export types
export * from './types';
