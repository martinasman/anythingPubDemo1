/**
 * Site Crawler Types
 *
 * Types for multi-page website crawling and data extraction
 */

// ============================================
// CONFIGURATION
// ============================================

export interface CrawlConfig {
  /** Maximum number of pages to crawl (default: 20) */
  maxPages: number;
  /** Maximum depth from start URL (default: 3) */
  maxDepth: number;
  /** Milliseconds between requests (default: 1000) */
  rateLimit: number;
  /** Per-page timeout in ms (default: 15000) */
  timeout: number;
  /** Whether to download images as base64 (default: false) */
  downloadImages: boolean;
  /** User agent string */
  userAgent: string;
}

export const DEFAULT_CRAWL_CONFIG: CrawlConfig = {
  maxPages: 20,
  maxDepth: 3,
  rateLimit: 1000,
  timeout: 15000,
  downloadImages: false,
  userAgent: 'Mozilla/5.0 (compatible; SiteRemixer/1.0; +https://anythingv10.com)',
};

// ============================================
// PAGE DATA
// ============================================

export interface PageMeta {
  description?: string;
  keywords?: string[];
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  favicon?: string;
}

export interface PageHeading {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  text: string;
}

export interface PageList {
  type: 'ul' | 'ol';
  items: string[];
}

export interface PageContent {
  headings: PageHeading[];
  paragraphs: string[];
  lists: PageList[];
}

export interface PageImage {
  src: string;
  alt?: string;
  title?: string;
  isLogo: boolean;
  isHero: boolean;
  width?: number;
  height?: number;
}

export interface FormField {
  type: 'text' | 'email' | 'tel' | 'number' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'file' | 'date' | 'password' | 'hidden' | 'url' | 'search' | 'other';
  name: string;
  label?: string;
  placeholder?: string;
  required: boolean;
  options?: string[]; // For select, radio, checkbox groups
  defaultValue?: string;
}

export interface PageForm {
  id?: string;
  action?: string;
  method: 'GET' | 'POST';
  formType: 'contact' | 'newsletter' | 'login' | 'signup' | 'search' | 'quote' | 'booking' | 'other';
  fields: FormField[];
  submitText: string;
}

export interface PageLinks {
  internal: string[];
  external: string[];
  emails: string[];
  phones: string[];
}

export interface CrawledPage {
  /** Full URL of the page */
  url: string;
  /** Path portion e.g., "/about" */
  path: string;
  /** Page title from <title> tag */
  title: string;
  /** Meta information */
  meta: PageMeta;
  /** Extracted text content */
  content: PageContent;
  /** Images found on page */
  images: PageImage[];
  /** Forms found on page */
  forms: PageForm[];
  /** Links found on page */
  links: PageLinks;
  /** Detected page type */
  pageType: 'home' | 'about' | 'contact' | 'services' | 'products' | 'blog' | 'blog-post' | 'portfolio' | 'pricing' | 'faq' | 'team' | 'legal' | 'other';
  /** Crawl depth from start URL */
  depth: number;
  /** When this page was crawled */
  crawledAt: string;
  /** Load time in ms */
  loadTime: number;
}

// ============================================
// BRAND & NAVIGATION
// ============================================

export interface BrandColors {
  primary?: string;
  secondary?: string;
  accent?: string;
  background?: string;
  text?: string;
  /** All detected colors with usage count */
  allColors: Array<{ color: string; count: number }>;
}

export interface BrandFonts {
  heading?: string;
  body?: string;
  allFonts: string[];
}

export interface BrandData {
  /** Logo URL or base64 */
  logo?: string;
  logoAlt?: string;
  /** Detected company name */
  companyName?: string;
  /** Detected tagline */
  tagline?: string;
  /** Brand colors */
  colors: BrandColors;
  /** Typography */
  fonts: BrandFonts;
}

export interface NavItem {
  label: string;
  path: string;
  children?: NavItem[];
  isExternal: boolean;
}

export interface NavigationData {
  /** Primary/main navigation */
  primary: NavItem[];
  /** Secondary navigation (if detected) */
  secondary?: NavItem[];
  /** Footer navigation */
  footer: NavItem[];
}

export interface ContactInfo {
  phone?: string;
  email?: string;
  address?: string;
  hours?: string;
}

export interface GlobalElements {
  /** Social media links */
  socialLinks: Array<{
    platform: 'facebook' | 'twitter' | 'instagram' | 'linkedin' | 'youtube' | 'tiktok' | 'pinterest' | 'github' | 'other';
    url: string;
  }>;
  /** Contact information */
  contactInfo: ContactInfo;
  /** Copyright text */
  copyright?: string;
}

// ============================================
// CRAWLED SITE DATA
// ============================================

export interface CrawledSiteData {
  /** Domain without protocol */
  domain: string;
  /** Original start URL */
  sourceUrl: string;
  /** When crawl started */
  crawledAt: string;
  /** Total crawl duration in ms */
  crawlDuration: number;
  /** All crawled pages */
  pages: CrawledPage[];
  /** Extracted brand information */
  brand: BrandData;
  /** Site navigation structure */
  navigation: NavigationData;
  /** Global elements (footer, social, etc.) */
  globalElements: GlobalElements;
  /** Site statistics */
  stats: {
    totalPages: number;
    totalImages: number;
    totalForms: number;
    totalLinks: number;
    hasEcommerce: boolean;
    hasBlog: boolean;
    technologies: string[];
  };
}

// ============================================
// PROGRESS & CALLBACKS
// ============================================

export type CrawlPhase = 'initializing' | 'discovering' | 'crawling' | 'extracting' | 'aggregating' | 'complete' | 'error';

export interface CrawlProgress {
  phase: CrawlPhase;
  pagesDiscovered: number;
  pagesCrawled: number;
  totalPages: number;
  currentUrl: string;
  currentPageTitle?: string;
  message: string;
  /** Extracted elements so far */
  extracted: {
    logoFound: boolean;
    colorsFound: number;
    formsFound: number;
    imagesFound: number;
  };
  /** Any errors encountered */
  errors: Array<{ url: string; error: string }>;
}

export type ProgressCallback = (progress: CrawlProgress) => void | Promise<void>;

// ============================================
// ARTIFACT TYPE (for database storage)
// ============================================

export interface CrawledSiteArtifact {
  sourceUrl: string;
  crawledAt: string;
  site: CrawledSiteData;
  config: Partial<CrawlConfig>;
  status: 'completed' | 'failed';
  error?: string;
}
