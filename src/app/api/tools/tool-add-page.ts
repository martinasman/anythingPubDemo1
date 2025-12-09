import { z } from 'zod';
import { generateText } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { createClient } from '@supabase/supabase-js';
import { parseHTML } from 'linkedom';
import type { WebsiteArtifact, IdentityArtifact, BusinessPlanArtifact } from '@/types/database';

// ============================================
// TYPES
// ============================================

export interface ProgressUpdate {
  type: 'stage' | 'change';
  stage?: string;
  message?: string;
}

type ProgressCallback = (update: ProgressUpdate) => Promise<void>;

interface PageStructure {
  header: string;
  nav: string;
  footer: string;
  headContent: string;
  bodyClasses: string;
  scripts: string[];
}

interface BusinessContext {
  businessName: string;
  tagline: string;
  colors: { primary: string; secondary: string; accent: string };
  services: Array<{ name: string; description: string; price?: string }>;
  contactInfo?: { email?: string; phone?: string; address?: string };
}

interface SectionPattern {
  classes: string;
  tag: string;
  childTags: string[];
  example: string;
}

interface ComponentPatterns {
  sections: SectionPattern[];
  buttons: string[];
  headings: { h1: string[]; h2: string[]; h3: string[] };
  containers: string[];
  links: string[];
}

interface ValidationResult {
  valid: boolean;
  invalidClasses: string[];
  suggestions: Map<string, string>;
}

// ============================================
// SCHEMA DEFINITION
// ============================================

export const addPageSchema = z.object({
  pagePath: z.string().describe('Path for new page, e.g., "/about" or "/services" or "/contact"'),
  pageTitle: z.string().describe('Title for the new page'),
  pageDescription: z.string().describe('Description of what content the page should have'),
  leadId: z.string().optional().describe('Optional lead ID - if provided, adds page to lead website instead of agency website'),
});

// ============================================
// HELPER: Extract CSS classes from stylesheet
// ============================================

function extractCSSClasses(css: string): string[] {
  // Match all class selectors like .hero-section, .btn-primary, etc.
  const classRegex = /\.([a-zA-Z_-][a-zA-Z0-9_-]*)/g;
  const classes = new Set<string>();
  let match;
  while ((match = classRegex.exec(css)) !== null) {
    // Skip pseudo-classes and common CSS patterns
    const className = match[1];
    if (!className.startsWith('-') && !['hover', 'focus', 'active', 'before', 'after', 'first', 'last'].includes(className)) {
      classes.add(className);
    }
  }
  return Array.from(classes);
}

// ============================================
// HELPER: Extract classes used in HTML
// ============================================

function extractClassesFromHTML(html: string): string[] {
  const classRegex = /class=["']([^"']+)["']/g;
  const classes = new Set<string>();
  let match;
  while ((match = classRegex.exec(html)) !== null) {
    // Split on whitespace to get individual classes
    match[1].split(/\s+/).forEach(c => {
      if (c.trim()) classes.add(c.trim());
    });
  }
  return Array.from(classes);
}

// ============================================
// HELPER: Extract component patterns from HTML
// ============================================

function extractComponentPatterns(html: string): ComponentPatterns {
  const { document } = parseHTML(html);

  // Extract section patterns
  const sections: SectionPattern[] = [];
  const sectionEls = document.querySelectorAll('section, [class*="section"], [class*="hero"], [class*="container"]');

  for (const section of Array.from(sectionEls).slice(0, 5)) { // Limit to 5 examples
    const childTags: string[] = [];
    for (const child of Array.from(section.children).slice(0, 5)) {
      const tagName = child.tagName.toLowerCase();
      const childClass = child.className ? `.${child.className.split(' ')[0]}` : '';
      childTags.push(`${tagName}${childClass}`);
    }

    // Create a simplified example (first 500 chars)
    let example = section.outerHTML;
    if (example.length > 500) {
      example = example.slice(0, 500) + '...';
    }

    sections.push({
      classes: section.className || '',
      tag: section.tagName.toLowerCase(),
      childTags,
      example,
    });
  }

  // Extract button class patterns
  const buttons: string[] = [];
  const buttonEls = document.querySelectorAll('button, a[class*="btn"], [class*="button"]');
  for (const btn of Array.from(buttonEls)) {
    if (btn.className) {
      buttons.push(btn.className);
    }
  }

  // Extract heading patterns
  const headings = { h1: [] as string[], h2: [] as string[], h3: [] as string[] };
  for (const level of ['h1', 'h2', 'h3'] as const) {
    const els = document.querySelectorAll(level);
    for (const el of Array.from(els)) {
      if (el.className) {
        headings[level].push(el.className);
      }
    }
  }

  // Extract container/wrapper patterns
  const containers: string[] = [];
  const containerEls = document.querySelectorAll('[class*="container"], [class*="wrapper"], [class*="content"]');
  for (const el of Array.from(containerEls)) {
    if (el.className) {
      containers.push(el.className);
    }
  }

  // Extract link patterns (navigation links)
  const links: string[] = [];
  const linkEls = document.querySelectorAll('nav a, a[class]');
  for (const el of Array.from(linkEls)) {
    if (el.className) {
      links.push(el.className);
    }
  }

  return {
    sections: [...new Map(sections.map(s => [s.classes, s])).values()], // Dedupe by classes
    buttons: [...new Set(buttons)],
    headings,
    containers: [...new Set(containers)],
    links: [...new Set(links)],
  };
}

// ============================================
// HELPER: Build style guide for AI
// ============================================

function buildStyleGuide(cssClasses: string[], patterns: ComponentPatterns, existingMainContent: string): string {
  let guide = `## AVAILABLE CSS CLASSES (use ONLY these - do NOT invent new classes)
${cssClasses.join(', ')}

`;

  // Add section patterns
  if (patterns.sections.length > 0) {
    guide += `## SECTION PATTERNS (copy these structures exactly)\n`;
    for (const section of patterns.sections.slice(0, 3)) {
      guide += `
<${section.tag} class="${section.classes}">
  <!-- Child structure: ${section.childTags.join(', ')} -->
</${section.tag}>
`;
    }
    guide += '\n';
  }

  // Add button patterns
  if (patterns.buttons.length > 0) {
    guide += `## BUTTON CLASSES (use exactly)\n`;
    patterns.buttons.slice(0, 3).forEach(b => {
      guide += `- class="${b}"\n`;
    });
    guide += '\n';
  }

  // Add heading patterns
  guide += `## HEADING CLASSES\n`;
  if (patterns.headings.h1.length > 0) guide += `- H1: class="${patterns.headings.h1[0]}"\n`;
  if (patterns.headings.h2.length > 0) guide += `- H2: class="${patterns.headings.h2[0]}"\n`;
  if (patterns.headings.h3.length > 0) guide += `- H3: class="${patterns.headings.h3[0]}"\n`;
  guide += '\n';

  // Add container patterns
  if (patterns.containers.length > 0) {
    guide += `## CONTAINER/WRAPPER CLASSES\n`;
    patterns.containers.slice(0, 3).forEach(c => {
      guide += `- class="${c}"\n`;
    });
    guide += '\n';
  }

  // Add actual example from existing site
  if (existingMainContent) {
    guide += `## EXAMPLE FROM EXISTING SITE (follow this structure)\n`;
    guide += '```html\n';
    guide += existingMainContent.slice(0, 2000); // Limit to 2000 chars
    guide += '\n```\n';
  }

  return guide;
}

// ============================================
// HELPER: Find similar class (Levenshtein distance)
// ============================================

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

function findSimilarClass(invalidClass: string, availableClasses: string[]): string | null {
  let bestMatch: string | null = null;
  let bestDistance = Infinity;

  for (const validClass of availableClasses) {
    const distance = levenshteinDistance(invalidClass.toLowerCase(), validClass.toLowerCase());
    // Only suggest if reasonably similar (distance < half the length)
    if (distance < bestDistance && distance < Math.max(invalidClass.length, validClass.length) / 2) {
      bestDistance = distance;
      bestMatch = validClass;
    }
  }

  return bestMatch;
}

// ============================================
// HELPER: Validate generated HTML
// ============================================

function validateGeneratedHTML(html: string, availableClasses: string[]): ValidationResult {
  const usedClasses = extractClassesFromHTML(html);
  const availableSet = new Set(availableClasses);
  const invalidClasses: string[] = [];
  const suggestions = new Map<string, string>();

  for (const usedClass of usedClasses) {
    if (!availableSet.has(usedClass)) {
      invalidClasses.push(usedClass);
      const suggestion = findSimilarClass(usedClass, availableClasses);
      if (suggestion) {
        suggestions.set(usedClass, suggestion);
      }
    }
  }

  return {
    valid: invalidClasses.length === 0,
    invalidClasses,
    suggestions,
  };
}

// ============================================
// HELPER: Fix invalid classes in HTML
// ============================================

function fixInvalidClasses(html: string, validation: ValidationResult): string {
  let fixedHtml = html;

  for (const [invalid, suggestion] of validation.suggestions) {
    // Replace invalid class with suggested one
    // Use word boundary to avoid partial replacements
    const regex = new RegExp(`\\b${invalid}\\b`, 'g');
    fixedHtml = fixedHtml.replace(regex, suggestion);
    console.log(`[Add Page] Fixed class: "${invalid}" → "${suggestion}"`);
  }

  // For invalid classes without suggestions, remove them
  for (const invalid of validation.invalidClasses) {
    if (!validation.suggestions.has(invalid)) {
      // Remove the invalid class but keep other classes
      const regex = new RegExp(`\\s*\\b${invalid}\\b\\s*`, 'g');
      fixedHtml = fixedHtml.replace(regex, ' ');
      console.log(`[Add Page] Removed invalid class: "${invalid}"`);
    }
  }

  return fixedHtml;
}

// ============================================
// HELPER: Extract main content from HTML
// ============================================

function extractMainContent(html: string): string {
  const { document } = parseHTML(html);
  const main = document.querySelector('main');
  if (main) {
    return main.innerHTML;
  }
  // Fallback: get body content minus header/footer
  const body = document.querySelector('body');
  if (body) {
    const clone = body.cloneNode(true) as Element;
    clone.querySelector('header')?.remove();
    clone.querySelector('footer')?.remove();
    clone.querySelector('nav')?.remove();
    return clone.innerHTML;
  }
  return '';
}

// ============================================
// HELPER: Extract page structure using DOM
// ============================================

function extractPageStructure(html: string): PageStructure {
  const { document } = parseHTML(html);

  // Extract header (includes nav if nested)
  const headerEl = document.querySelector('header');
  const header = headerEl ? headerEl.outerHTML : '';

  // Extract nav separately (might be outside header)
  const navEl = document.querySelector('nav');
  const nav = navEl ? navEl.outerHTML : '';

  // Extract footer
  const footerEl = document.querySelector('footer');
  const footer = footerEl ? footerEl.outerHTML : '';

  // Extract head content (excluding title which we'll customize)
  const headEl = document.querySelector('head');
  let headContent = '';
  if (headEl) {
    // Get all head children except title
    const headChildren = Array.from(headEl.children);
    headContent = headChildren
      .filter(child => child.tagName.toLowerCase() !== 'title')
      .map(child => child.outerHTML)
      .join('\n    ');
  }

  // Extract body classes
  const bodyEl = document.querySelector('body');
  const bodyClasses = bodyEl?.getAttribute('class') || '';

  // Extract script tags
  const scriptEls = document.querySelectorAll('script[src]');
  const scripts = Array.from(scriptEls).map(s => s.getAttribute('src') || '').filter(Boolean);

  return { header, nav, footer, headContent, bodyClasses, scripts };
}

// ============================================
// HELPER: Build business context from artifacts
// ============================================

function buildBusinessContext(
  identity: IdentityArtifact | null,
  businessPlan: BusinessPlanArtifact | null
): BusinessContext {
  const context: BusinessContext = {
    businessName: identity?.name || 'Our Company',
    tagline: identity?.tagline || '',
    colors: {
      primary: identity?.colors?.primary || '#3B82F6',
      secondary: identity?.colors?.secondary || '#1F2937',
      accent: identity?.colors?.accent || '#10B981',
    },
    services: [],
  };

  // Extract services from business plan pricing tiers
  if (businessPlan?.pricingTiers) {
    context.services = businessPlan.pricingTiers.map(tier => ({
      name: tier.name,
      description: tier.features?.join(', ') || '',
      price: tier.price,
    }));
  }

  // Also include service packages if available
  if (businessPlan?.servicePackages) {
    const packages = businessPlan.servicePackages.map(pkg => ({
      name: pkg.name,
      description: pkg.description || pkg.deliverables?.join(', ') || '',
      price: pkg.price,
    }));
    context.services = [...context.services, ...packages];
  }

  return context;
}

// ============================================
// HELPER: Add nav link using DOM parsing
// ============================================

function addNavLinkDOM(html: string, newPath: string, linkText: string): string {
  const { document } = parseHTML(html);

  // Normalize the path
  const hrefPath = newPath.startsWith('/') ? newPath : `/${newPath}`;

  // Check if link already exists
  const existingLinks = document.querySelectorAll('a[href]');
  for (const link of existingLinks) {
    const href = link.getAttribute('href') || '';
    if (href === hrefPath || href === `${hrefPath}/` || href === `${hrefPath}/index.html`) {
      // Link already exists
      return html;
    }
  }

  // Try to find navigation list (ul inside nav)
  const navUl = document.querySelector('nav ul');
  if (navUl) {
    // Clone the structure of an existing li > a
    const existingLi = navUl.querySelector('li');
    const existingA = navUl.querySelector('a');

    if (existingLi && existingA) {
      // Create new li with same classes
      const newLi = document.createElement('li');
      if (existingLi.className) newLi.className = existingLi.className;

      // Create new anchor with same classes
      const newA = document.createElement('a');
      newA.href = hrefPath;
      newA.textContent = linkText;
      if (existingA.className) newA.className = existingA.className;

      newLi.appendChild(newA);
      navUl.appendChild(newLi);

      return document.toString();
    }
  }

  // Fallback: Try nav with direct links
  const nav = document.querySelector('nav');
  if (nav) {
    const existingA = nav.querySelector('a');
    if (existingA) {
      const newA = document.createElement('a');
      newA.href = hrefPath;
      newA.textContent = linkText;
      if (existingA.className) newA.className = existingA.className;
      nav.appendChild(newA);
      return document.toString();
    }
  }

  // No nav found, return unchanged
  return html;
}

// ============================================
// HELPER: Assemble complete page HTML
// ============================================

function assemblePageHTML(
  structure: PageStructure,
  mainContent: string,
  pageTitle: string,
  businessName: string
): string {
  // Build script tags
  const scriptTags = structure.scripts
    .map(src => `  <script src="${src}"></script>`)
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
    ${structure.headContent}
    <title>${pageTitle} | ${businessName}</title>
</head>
<body${structure.bodyClasses ? ` class="${structure.bodyClasses}"` : ''}>
    ${structure.header}

    <main>
        ${mainContent}
    </main>

    ${structure.footer}
${scriptTags}
</body>
</html>`;
}

// ============================================
// TOOL IMPLEMENTATION
// ============================================

export async function addWebsitePage(params: z.infer<typeof addPageSchema> & { projectId: string; onProgress?: ProgressCallback }) {
  const { pagePath, pageTitle, pageDescription, projectId, leadId, onProgress } = params;

  try {
    console.log('[Add Page] Starting enhanced page creation...');
    console.log('[Add Page] Path:', pagePath, 'Title:', pageTitle, 'LeadId:', leadId || 'none');

    const isLeadWebsite = !!leadId;

    // Stage 1: Loading website and context
    await onProgress?.({ type: 'stage', stage: 'fetch', message: isLeadWebsite ? 'Loading lead website...' : 'Loading website...' });

    // Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Variables to hold website data
    let currentWebsite: WebsiteArtifact;
    let websiteArtifactVersion: number = 1;
    let leadWebsiteArtifact: any = null;
    let leadWebsiteIndex: number = -1;

    if (isLeadWebsite) {
      // Fetch lead_website artifact
      const { data: leadArtifact, error: leadError } = await (supabase
        .from('artifacts') as any)
        .select('*')
        .eq('project_id', projectId)
        .eq('type', 'lead_website')
        .single();

      if (leadError || !leadArtifact?.data?.websites) {
        console.error('[Add Page] No lead website artifact found:', leadError);
        throw new Error('No lead website found. Generate a website for this lead first.');
      }

      // Find the specific lead's website
      const leadWebsiteData = leadArtifact.data.websites.find((w: any, idx: number) => {
        if (w.leadId === leadId) {
          leadWebsiteIndex = idx;
          return true;
        }
        return false;
      });

      if (!leadWebsiteData || !leadWebsiteData.files) {
        throw new Error('No website found for this lead. Generate a website first.');
      }

      leadWebsiteArtifact = leadArtifact;
      websiteArtifactVersion = leadArtifact.version || 1;

      // Convert lead website files to WebsiteArtifact format
      currentWebsite = {
        files: leadWebsiteData.files,
        framework: 'html',
        primaryPage: '/index.html',
      } as WebsiteArtifact;

      console.log('[Add Page] Found lead website with', leadWebsiteData.files.length, 'files');
    } else {
      // Fetch agency website artifact
      const [websiteResult, brandResult, planResult] = await Promise.all([
        (supabase.from('artifacts') as any)
          .select('*')
          .eq('project_id', projectId)
          .eq('type', 'website_code')
          .single(),
        (supabase.from('artifacts') as any)
          .select('data')
          .eq('project_id', projectId)
          .eq('type', 'identity')
          .single(),
        (supabase.from('artifacts') as any)
          .select('data')
          .eq('project_id', projectId)
          .eq('type', 'business_plan')
          .single(),
      ]);

      if (websiteResult.error || !websiteResult.data) {
        console.error('[Add Page] No existing website found:', websiteResult.error);
        throw new Error('No website found. Generate a website first.');
      }

      currentWebsite = websiteResult.data.data as WebsiteArtifact;
      websiteArtifactVersion = websiteResult.data.version || 1;
    }

    const htmlFile = currentWebsite.files.find(f => f.path === '/index.html');
    const cssFile = currentWebsite.files.find(f => f.path === '/styles.css');

    if (!htmlFile) {
      throw new Error('Website has no HTML file');
    }

    // Build business context from available artifacts
    let businessContext: BusinessContext;

    if (isLeadWebsite) {
      // For lead websites, fetch leads artifact to get lead info
      const { data: leadsArtifact } = await (supabase
        .from('artifacts') as any)
        .select('data')
        .eq('project_id', projectId)
        .eq('type', 'leads')
        .single();

      const lead = leadsArtifact?.data?.leads?.find((l: any) => l.id === leadId);

      businessContext = {
        businessName: lead?.companyName || 'Business',
        tagline: lead?.industry || '',
        colors: { primary: '#3B82F6', secondary: '#1E40AF', accent: '#F59E0B' },
        services: [],
        contactInfo: {
          email: lead?.contactEmail,
          phone: lead?.contactPhone,
        },
      };
    } else {
      // For agency website, fetch brand and plan artifacts
      const [brandResult, planResult] = await Promise.all([
        (supabase.from('artifacts') as any)
          .select('data')
          .eq('project_id', projectId)
          .eq('type', 'identity')
          .single(),
        (supabase.from('artifacts') as any)
          .select('data')
          .eq('project_id', projectId)
          .eq('type', 'business_plan')
          .single(),
      ]);

      const brandIdentity = brandResult.data?.data as IdentityArtifact | null;
      const businessPlan = planResult.data?.data as BusinessPlanArtifact | null;
      businessContext = buildBusinessContext(brandIdentity, businessPlan);
    }

    console.log('[Add Page] Business context:', businessContext.businessName);

    // Normalize the page path
    let normalizedPath = pagePath.startsWith('/') ? pagePath : `/${pagePath}`;
    if (!normalizedPath.endsWith('.html')) {
      normalizedPath = normalizedPath.endsWith('/')
        ? `${normalizedPath}index.html`
        : `${normalizedPath}/index.html`;
    }

    // Check if page already exists
    if (currentWebsite.files.some(f => f.path === normalizedPath)) {
      throw new Error(`Page ${normalizedPath} already exists`);
    }

    console.log('[Add Page] Normalized path:', normalizedPath);

    // Stage 2: Analyzing structure and extracting style patterns
    await onProgress?.({ type: 'stage', stage: 'analyze', message: 'Analyzing website styling...' });

    // Extract page structure using DOM parsing
    const pageStructure = extractPageStructure(htmlFile.content);
    console.log('[Add Page] Extracted structure - Header:', pageStructure.header.length, 'chars, Footer:', pageStructure.footer.length, 'chars');

    // NEW: Extract CSS classes from stylesheet
    const cssContent = cssFile?.content || '';
    const cssClasses = extractCSSClasses(cssContent);
    // Also extract classes used in HTML (for Tailwind or inline class usage)
    const htmlClasses = extractClassesFromHTML(htmlFile.content);
    const allAvailableClasses = [...new Set([...cssClasses, ...htmlClasses])];
    console.log('[Add Page] Found', allAvailableClasses.length, 'available CSS classes');

    // NEW: Extract component patterns from existing HTML
    const patterns = extractComponentPatterns(htmlFile.content);
    console.log('[Add Page] Found patterns:', patterns.sections.length, 'sections,', patterns.buttons.length, 'buttons');

    // NEW: Extract main content from existing page as example
    const existingMainContent = extractMainContent(htmlFile.content);

    // NEW: Build structured style guide
    const styleGuide = buildStyleGuide(allAvailableClasses, patterns, existingMainContent);

    // Get list of existing pages for navigation context
    const existingPages = currentWebsite.files
      .filter(f => f.type === 'html')
      .map(f => f.path);

    // Stage 3: Generating content
    await onProgress?.({ type: 'stage', stage: 'generate', message: `Creating ${pageTitle}...` });

    // Initialize OpenRouter
    const openrouter = createOpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY!,
    });

    // Build the enhanced prompt with style guide
    const prompt = `Generate the MAIN CONTENT ONLY (what goes inside <main>...</main>) for a new page.

PAGE DETAILS:
- Title: "${pageTitle}"
- Purpose: ${pageDescription}

BUSINESS CONTEXT:
- Business Name: ${businessContext.businessName}
- Tagline: ${businessContext.tagline}
${businessContext.services.length > 0 ? `
SERVICES/OFFERINGS:
${businessContext.services.map((s, i) => `${i + 1}. ${s.name}${s.price ? ` - ${s.price}` : ''}: ${s.description}`).join('\n')}
` : ''}

CRITICAL STYLING RULES:
${styleGuide}

EXISTING PAGES: ${existingPages.join(', ')}

STRICT REQUIREMENTS:
1. Return ONLY the HTML that goes inside <main>...</main>
2. DO NOT include <!DOCTYPE>, <html>, <head>, <body>, <header>, <nav>, or <footer>
3. Use ONLY the CSS classes listed above - do NOT invent new class names
4. Copy the exact section/container/button patterns from the style guide
5. Match the same HTML structure hierarchy as the existing site
6. Create compelling content for: ${pageDescription}
7. Make content specific to: ${businessContext.businessName}

Return ONLY the main content HTML. No markdown, no explanation.`;

    const { text: generatedContent } = await generateText({
      model: openrouter('anthropic/claude-3.5-sonnet'),
      prompt,
      temperature: 0.6,
    });

    // Clean up the response
    let mainContent = generatedContent.trim();

    // Remove markdown code blocks if present
    if (mainContent.startsWith('```html')) {
      mainContent = mainContent.slice(7);
    } else if (mainContent.startsWith('```')) {
      mainContent = mainContent.slice(3);
    }
    if (mainContent.endsWith('```')) {
      mainContent = mainContent.slice(0, -3);
    }
    mainContent = mainContent.trim();

    console.log('[Add Page] Generated content length:', mainContent.length);

    // NEW: Validate and fix generated HTML classes
    await onProgress?.({ type: 'stage', stage: 'validate', message: 'Validating styling...' });

    const validation = validateGeneratedHTML(mainContent, allAvailableClasses);
    if (!validation.valid) {
      console.log('[Add Page] Found', validation.invalidClasses.length, 'invalid classes:', validation.invalidClasses.join(', '));
      mainContent = fixInvalidClasses(mainContent, validation);
      console.log('[Add Page] Fixed invalid classes');
    } else {
      console.log('[Add Page] All classes validated successfully');
    }

    // Stage 4: Assembling page
    await onProgress?.({ type: 'stage', stage: 'assemble', message: 'Building page...' });

    // Assemble the complete HTML using the template approach
    const newPageHtml = assemblePageHTML(
      pageStructure,
      mainContent,
      pageTitle,
      businessContext.businessName
    );

    console.log('[Add Page] Assembled page length:', newPageHtml.length);

    // Stage 5: Updating navigation
    await onProgress?.({ type: 'stage', stage: 'nav', message: 'Updating navigation...' });

    // Update navigation in existing pages using DOM parsing
    const linkText = pageTitle.split(' ').slice(0, 2).join(' '); // Use first 2 words as nav text
    const navPath = normalizedPath.replace('/index.html', '').replace('.html', '') || '/';

    const updatedFiles = currentWebsite.files.map(file => {
      if (file.type === 'html' && file.path !== normalizedPath) {
        const updatedHtml = addNavLinkDOM(
          file.content,
          navPath === '/' ? '/index.html' : normalizedPath,
          linkText
        );
        return {
          ...file,
          content: updatedHtml,
        };
      }
      return file;
    });

    // Add the new page
    updatedFiles.push({
      path: normalizedPath,
      content: newPageHtml,
      type: 'html' as const,
    });

    // Stage 6: Saving
    await onProgress?.({ type: 'stage', stage: 'save', message: 'Saving website...' });

    if (isLeadWebsite && leadWebsiteArtifact && leadWebsiteIndex >= 0) {
      // Save to lead_website artifact
      const updatedWebsites = [...leadWebsiteArtifact.data.websites];
      updatedWebsites[leadWebsiteIndex] = {
        ...updatedWebsites[leadWebsiteIndex],
        files: updatedFiles,
      };

      const { error: saveError } = await (supabase
        .from('artifacts') as any)
        .update({
          data: { websites: updatedWebsites },
          version: websiteArtifactVersion + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('project_id', projectId)
        .eq('type', 'lead_website');

      if (saveError) {
        console.error('[Add Page] Failed to save lead website:', saveError);
        throw new Error('Failed to save website updates');
      }

      console.log('[Add Page] Lead website page added successfully:', normalizedPath);
    } else {
      // Save to website_code artifact (agency website)
      const updatedWebsite: WebsiteArtifact = {
        ...currentWebsite,
        files: updatedFiles,
      };

      const { error: saveError } = await (supabase
        .from('artifacts') as any)
        .update({
          data: updatedWebsite,
          version: websiteArtifactVersion + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('project_id', projectId)
        .eq('type', 'website_code');

      if (saveError) {
        console.error('[Add Page] Failed to save:', saveError);
        throw new Error('Failed to save website updates');
      }

      console.log('[Add Page] Page added successfully:', normalizedPath);
    }

    return {
      success: true,
      pagePath: normalizedPath,
      summary: `Added new page: ${pageTitle} at ${normalizedPath}`,
    };
  } catch (error) {
    console.error('[Add Page] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
