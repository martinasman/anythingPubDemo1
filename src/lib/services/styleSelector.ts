/**
 * Style Selector Service
 *
 * Intelligently selects design styles for website generation based on:
 * 1. Source website structure (layout patterns)
 * 2. Business industry/type
 * 3. Anti-repetition (avoid recent styles)
 * 4. Deterministic seeding (consistent results)
 */

export type DesignStyle =
  | 'MINIMALIST_CLEAN'
  | 'BOLD_VIBRANT'
  | 'DARK_MODE_ELEGANT'
  | 'WARM_FRIENDLY'
  | 'CORPORATE_PROFESSIONAL'
  | 'CREATIVE_ARTISTIC'
  | 'ASYMMETRIC_EDITORIAL'
  | 'SPLIT_SCREEN_MODERN'
  | 'SINGLE_PAGE_STORYTELLING'
  | 'CARD_BASED_MODULAR'
  | 'VIDEO_FIRST_IMMERSIVE'
  | 'BRUTALIST_BOLD'
  | 'GRADIENT_MODERN'
  | 'TEXT_FIRST_MINIMAL'
  | 'INTERACTIVE_SHOWCASE'
  | 'RETRO_MODERN';

const ALL_STYLES: DesignStyle[] = [
  'MINIMALIST_CLEAN',
  'BOLD_VIBRANT',
  'DARK_MODE_ELEGANT',
  'WARM_FRIENDLY',
  'CORPORATE_PROFESSIONAL',
  'CREATIVE_ARTISTIC',
  'ASYMMETRIC_EDITORIAL',
  'SPLIT_SCREEN_MODERN',
  'SINGLE_PAGE_STORYTELLING',
  'CARD_BASED_MODULAR',
  'VIDEO_FIRST_IMMERSIVE',
  'BRUTALIST_BOLD',
  'GRADIENT_MODERN',
  'TEXT_FIRST_MINIMAL',
  'INTERACTIVE_SHOWCASE',
  'RETRO_MODERN',
];

/**
 * Maps source layout patterns to compatible modern styles
 */
const LAYOUT_COMPATIBILITY: Record<string, DesignStyle[]> = {
  'hero-centric': [
    'MINIMALIST_CLEAN',
    'BOLD_VIBRANT',
    'DARK_MODE_ELEGANT',
    'VIDEO_FIRST_IMMERSIVE',
    'GRADIENT_MODERN',
  ],
  'grid-based': [
    'CARD_BASED_MODULAR',
    'CORPORATE_PROFESSIONAL',
    'ASYMMETRIC_EDITORIAL',
    'INTERACTIVE_SHOWCASE',
  ],
  'single-column': [
    'SINGLE_PAGE_STORYTELLING',
    'TEXT_FIRST_MINIMAL',
    'ASYMMETRIC_EDITORIAL',
    'BRUTALIST_BOLD',
  ],
  'sidebar': [
    'CORPORATE_PROFESSIONAL',
    'CREATIVE_ARTISTIC',
    'TEXT_FIRST_MINIMAL',
  ],
  'unknown': ALL_STYLES,
};

/**
 * Maps industries to preferred design styles
 */
const INDUSTRY_PREFERENCES: Record<string, DesignStyle[]> = {
  // Food & Beverage
  restaurant: ['WARM_FRIENDLY', 'BOLD_VIBRANT', 'ASYMMETRIC_EDITORIAL'],
  food: ['WARM_FRIENDLY', 'BOLD_VIBRANT', 'ASYMMETRIC_EDITORIAL'],
  cafe: ['WARM_FRIENDLY', 'RETRO_MODERN', 'ASYMMETRIC_EDITORIAL'],
  bar: ['DARK_MODE_ELEGANT', 'BOLD_VIBRANT', 'VIDEO_FIRST_IMMERSIVE'],

  // Fitness & Wellness
  gym: ['BOLD_VIBRANT', 'DARK_MODE_ELEGANT', 'INTERACTIVE_SHOWCASE'],
  fitness: ['BOLD_VIBRANT', 'GRADIENT_MODERN', 'INTERACTIVE_SHOWCASE'],
  yoga: ['WARM_FRIENDLY', 'MINIMALIST_CLEAN', 'SINGLE_PAGE_STORYTELLING'],

  // Professional Services
  dental: ['MINIMALIST_CLEAN', 'CORPORATE_PROFESSIONAL', 'WARM_FRIENDLY'],
  medical: ['MINIMALIST_CLEAN', 'CORPORATE_PROFESSIONAL', 'GRADIENT_MODERN'],
  legal: ['CORPORATE_PROFESSIONAL', 'MINIMALIST_CLEAN', 'TEXT_FIRST_MINIMAL'],
  consulting: ['CORPORATE_PROFESSIONAL', 'MINIMALIST_CLEAN', 'GRADIENT_MODERN'],

  // Real Estate
  realestate: ['MINIMALIST_CLEAN', 'CORPORATE_PROFESSIONAL', 'CARD_BASED_MODULAR'],

  // Automotive
  auto: ['BOLD_VIBRANT', 'DARK_MODE_ELEGANT', 'BRUTALIST_BOLD'],
  mechanic: ['BOLD_VIBRANT', 'CORPORATE_PROFESSIONAL', 'BRUTALIST_BOLD'],

  // Beauty & Personal Care
  salon: ['CREATIVE_ARTISTIC', 'BOLD_VIBRANT', 'ASYMMETRIC_EDITORIAL'],
  hair: ['CREATIVE_ARTISTIC', 'BOLD_VIBRANT', 'RETRO_MODERN'],
  beauty: ['CREATIVE_ARTISTIC', 'WARM_FRIENDLY', 'ASYMMETRIC_EDITORIAL'],

  // Construction & Trades
  construction: ['CORPORATE_PROFESSIONAL', 'BRUTALIST_BOLD', 'BOLD_VIBRANT'],
  contractor: ['CORPORATE_PROFESSIONAL', 'BRUTALIST_BOLD', 'CARD_BASED_MODULAR'],

  // Cleaning
  cleaning: ['WARM_FRIENDLY', 'MINIMALIST_CLEAN', 'BOLD_VIBRANT'],

  // Tech & Software
  tech: ['GRADIENT_MODERN', 'DARK_MODE_ELEGANT', 'MINIMALIST_CLEAN'],
  software: ['GRADIENT_MODERN', 'DARK_MODE_ELEGANT', 'INTERACTIVE_SHOWCASE'],
  saas: ['GRADIENT_MODERN', 'MINIMALIST_CLEAN', 'DARK_MODE_ELEGANT'],
  app: ['BOLD_VIBRANT', 'GRADIENT_MODERN', 'INTERACTIVE_SHOWCASE'],

  // Creative & Design
  agency: ['CREATIVE_ARTISTIC', 'ASYMMETRIC_EDITORIAL', 'BOLD_VIBRANT'],
  design: ['CREATIVE_ARTISTIC', 'ASYMMETRIC_EDITORIAL', 'BRUTALIST_BOLD'],
  creative: ['CREATIVE_ARTISTIC', 'ASYMMETRIC_EDITORIAL', 'INTERACTIVE_SHOWCASE'],

  // Entertainment & Lifestyle
  entertainment: ['VIDEO_FIRST_IMMERSIVE', 'BOLD_VIBRANT', 'DARK_MODE_ELEGANT'],
  lifestyle: ['BOLD_VIBRANT', 'ASYMMETRIC_EDITORIAL', 'RETRO_MODERN'],

  // E-commerce & Retail
  retail: ['CARD_BASED_MODULAR', 'BOLD_VIBRANT', 'MINIMALIST_CLEAN'],
  ecommerce: ['CARD_BASED_MODULAR', 'GRADIENT_MODERN', 'BOLD_VIBRANT'],
  shop: ['CARD_BASED_MODULAR', 'BOLD_VIBRANT', 'WARM_FRIENDLY'],

  // Default fallback
  default: ALL_STYLES,
};

interface StyleSelectorInput {
  leadId: string;
  industry?: string;
  sourceStructure?: 'hero-centric' | 'grid-based' | 'single-column' | 'sidebar' | 'unknown';
  recentStyles?: string[];
}

/**
 * Select a design style based on multiple factors
 * Uses deterministic seeding for consistency
 */
export function selectStyle(input: StyleSelectorInput): DesignStyle {
  const {
    leadId,
    industry = 'default',
    sourceStructure = 'unknown',
    recentStyles = [],
  } = input;

  // Step 1: Get compatible styles based on source structure
  const compatibleWithLayout = LAYOUT_COMPATIBILITY[sourceStructure] || ALL_STYLES;

  // Step 2: Get preferred styles for industry
  const normalizedIndustry = industry.toLowerCase().replace(/[^a-z0-9]/g, '');
  let industryPrefs = INDUSTRY_PREFERENCES['default'];

  for (const [key, styles] of Object.entries(INDUSTRY_PREFERENCES)) {
    if (key === 'default') continue;
    if (normalizedIndustry.includes(key) || key.includes(normalizedIndustry)) {
      industryPrefs = styles;
      break;
    }
  }

  // Step 3: Combine constraints (layout + industry)
  // Prioritize styles that satisfy both constraints
  const layoutSet = new Set(compatibleWithLayout);
  const preferredInLayout = industryPrefs.filter(s => layoutSet.has(s));

  // If no overlap, use layout-compatible styles
  const candidateStyles = preferredInLayout.length > 0 ? preferredInLayout : compatibleWithLayout;

  // Step 4: Filter out recent styles (anti-repetition)
  const recentSet = new Set(recentStyles);
  const availableStyles = candidateStyles.filter(s => !recentSet.has(s));

  // If all candidates were recent, use candidates anyway (fallback)
  const finalCandidates = availableStyles.length > 0 ? availableStyles : candidateStyles;

  // Step 5: Deterministic selection using lead ID as seed
  // Convert leadId to number for consistent hashing
  let seed = 0;
  for (let i = 0; i < leadId.length; i++) {
    seed = (seed << 5) - seed + leadId.charCodeAt(i);
    seed = seed & seed; // Convert to 32-bit integer
  }

  // Use modulo to pick from candidates
  const index = Math.abs(seed) % finalCandidates.length;
  return finalCandidates[index];
}

/**
 * Get all available styles
 */
export function getAllStyles(): DesignStyle[] {
  return [...ALL_STYLES];
}

/**
 * Format style name for display (e.g., MINIMALIST_CLEAN -> Minimalist Clean)
 */
export function formatStyleName(style: DesignStyle): string {
  return style
    .split('_')
    .map(word => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
}
