/**
 * Business Personality Analyzer
 *
 * Analyzes business description to determine personality traits that influence design.
 * Uses keyword matching for deterministic, consistent results.
 */

export type BusinessTone = 'professional' | 'casual' | 'edgy' | 'premium' | 'friendly';
export type Sophistication = 'simple' | 'moderate' | 'advanced';
export type TargetAudience = 'b2b' | 'b2c' | 'mixed';
export type PricePosition = 'budget' | 'mid-market' | 'premium';

export interface BusinessPersonality {
  tone: BusinessTone;
  sophistication: Sophistication;
  targetAudience: TargetAudience;
  pricePosition: PricePosition;
}

/**
 * Analyze business description to determine personality profile
 */
export function analyzeBusinessPersonality(
  businessDescription: string
): BusinessPersonality {
  const description = businessDescription.toLowerCase();

  return {
    tone: detectTone(description),
    sophistication: detectSophistication(description),
    targetAudience: detectTargetAudience(description),
    pricePosition: detectPricePosition(description),
  };
}

/**
 * Detect tone from business description
 */
function detectTone(description: string): BusinessTone {
  // Premium tone indicators
  if (
    description.includes('luxury') ||
    description.includes('high-end') ||
    description.includes('exclusive') ||
    description.includes('boutique') ||
    description.includes('premium') ||
    description.includes('curated') ||
    description.includes('designer') ||
    description.includes('elite')
  ) {
    return 'premium';
  }

  // Edgy tone indicators
  if (
    description.includes('bold') ||
    description.includes('creative') ||
    description.includes('cutting-edge') ||
    description.includes('innovative') ||
    description.includes('disruptive') ||
    description.includes('young') ||
    description.includes('trendy') ||
    description.includes('modern art')
  ) {
    return 'edgy';
  }

  // Friendly/casual indicators
  if (
    description.includes('fun') ||
    description.includes('friendly') ||
    description.includes('community') ||
    description.includes('local') ||
    description.includes('casual') ||
    description.includes('approachable') ||
    description.includes('welcoming') ||
    description.includes('warm')
  ) {
    return 'friendly';
  }

  // Professional indicators (default)
  if (
    description.includes('professional') ||
    description.includes('corporate') ||
    description.includes('enterprise') ||
    description.includes('business') ||
    description.includes('b2b') ||
    description.includes('consulting') ||
    description.includes('expertise') ||
    description.includes('serious')
  ) {
    return 'professional';
  }

  // Default to professional
  return 'professional';
}

/**
 * Detect sophistication level from business description
 */
function detectSophistication(description: string): Sophistication {
  // Advanced sophistication indicators
  const advancedIndicators = [
    'machine learning',
    'artificial intelligence',
    'blockchain',
    'quantum',
    'cloud infrastructure',
    'api',
    'enterprise',
    'algorithm',
    'neural',
    'advanced',
    'sophisticated',
  ];

  if (advancedIndicators.some(indicator => description.includes(indicator))) {
    return 'advanced';
  }

  // Moderate sophistication indicators
  const moderateIndicators = [
    'platform',
    'software',
    'integration',
    'automation',
    'analytics',
    'dashboard',
    'system',
    'tool',
    'saas',
    'strategy',
  ];

  if (moderateIndicators.some(indicator => description.includes(indicator))) {
    return 'moderate';
  }

  // Simple sophistication (default)
  return 'simple';
}

/**
 * Detect target audience from business description
 */
function detectTargetAudience(description: string): TargetAudience {
  const hasB2B =
    description.includes('b2b') ||
    description.includes('business to business') ||
    description.includes('enterprise') ||
    description.includes('corporate') ||
    description.includes('companies') ||
    description.includes('businesses') ||
    description.includes('organizational');

  const hasB2C =
    description.includes('b2c') ||
    description.includes('business to consumer') ||
    description.includes('consumer') ||
    description.includes('customers') ||
    description.includes('retail') ||
    description.includes('personal') ||
    description.includes('individual');

  if (hasB2B && hasB2C) {
    return 'mixed';
  } else if (hasB2B) {
    return 'b2b';
  } else if (hasB2C) {
    return 'b2c';
  }

  // Default based on business type
  if (
    description.includes('restaurant') ||
    description.includes('gym') ||
    description.includes('salon') ||
    description.includes('shop') ||
    description.includes('store') ||
    description.includes('service')
  ) {
    return 'b2c';
  }

  if (
    description.includes('consulting') ||
    description.includes('agency') ||
    description.includes('platform') ||
    description.includes('software')
  ) {
    return 'b2b';
  }

  return 'mixed';
}

/**
 * Detect price positioning from business description
 */
function detectPricePosition(description: string): PricePosition {
  // Premium pricing indicators
  if (
    description.includes('premium') ||
    description.includes('luxury') ||
    description.includes('high-end') ||
    description.includes('exclusive') ||
    description.includes('premium pricing') ||
    description.includes('upmarket') ||
    description.includes('5-star') ||
    description.includes('michelin')
  ) {
    return 'premium';
  }

  // Budget pricing indicators
  if (
    description.includes('affordable') ||
    description.includes('budget') ||
    description.includes('cheap') ||
    description.includes('discount') ||
    description.includes('value') ||
    description.includes('low-cost') ||
    description.includes('economical') ||
    description.includes('budget-friendly')
  ) {
    return 'budget';
  }

  // Default to mid-market
  return 'mid-market';
}

/**
 * Get design adaptation recommendations based on personality
 */
export function getDesignAdaptations(personality: BusinessPersonality): {
  colorScheme: string;
  typography: string;
  spacing: string;
  imagery: string;
} {
  const { tone, sophistication, pricePosition } = personality;

  // Color scheme based on tone
  let colorScheme = 'Modern blue and gray (professional default)';
  if (tone === 'premium') {
    colorScheme = 'Gold, navy, and white (luxury aesthetic)';
  } else if (tone === 'edgy') {
    colorScheme = 'Bold black, bright accent colors, high contrast';
  } else if (tone === 'friendly') {
    colorScheme = 'Warm earth tones, soft pastels, approachable colors';
  }

  // Typography based on sophistication
  let typography = 'Clean sans-serif for body, modern serif for headers';
  if (sophistication === 'advanced') {
    typography = 'Modern sans-serif (Inter, Poppins), geometric precision';
  } else if (sophistication === 'simple') {
    typography = 'Friendly, readable sans-serif, larger font sizes';
  }

  // Spacing based on price position
  let spacing = 'Balanced spacing (1.5rem gaps)';
  if (pricePosition === 'premium') {
    spacing = 'Generous whitespace, luxurious breathing room (2-3rem gaps)';
  } else if (pricePosition === 'budget') {
    spacing = 'Compact spacing, efficient layout (1rem gaps)';
  }

  // Imagery style
  let imagery = 'Professional stock photos or lifestyle imagery';
  if (tone === 'premium') {
    imagery = 'High-end professional photography, aspirational lifestyle';
  } else if (tone === 'edgy') {
    imagery = 'Bold, unconventional photography, graphic illustrations';
  } else if (tone === 'friendly') {
    imagery = 'Warm, people-focused photography, approachable visuals';
  }

  return { colorScheme, typography, spacing, imagery };
}
