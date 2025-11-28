/**
 * Intent Detection Utility
 * Detects user intent from their message to show context-aware loading messages
 */

export type UserIntent =
  | 'build_business'      // New business creation
  | 'update_colors'       // Color scheme changes
  | 'update_brand'        // Logo, name, tagline changes
  | 'update_website'      // Website refinements
  | 'update_pricing'      // Pricing/package changes
  | 'research_more'       // Additional market research
  | 'find_leads'          // Lead generation
  | 'update_outreach'     // Script/email refinements
  | 'general_question'    // Questions, clarifications
  | 'general_refinement'; // Generic tweaks

export interface IntentResult {
  intent: UserIntent;
  confidence: number;
  loadingMessage: string;
  emoji: string;
}

interface IntentConfig {
  patterns: RegExp[];
  message: string;
  emoji: string;
}

const INTENT_PATTERNS: Record<UserIntent, IntentConfig> = {
  build_business: {
    patterns: [
      /^(build|create|start|launch|make)\s+(me\s+)?(a\s+)?/i,
      /business|agency|company|startup/i,
    ],
    message: 'Building your business...',
    emoji: '🚀',
  },
  update_colors: {
    patterns: [
      /color|palette|scheme|shade|hue/i,
      /brighter|darker|vibrant|muted|saturated/i,
      /blue|red|green|purple|orange|pink|teal/i,
    ],
    message: 'Updating your color scheme...',
    emoji: '🎨',
  },
  update_brand: {
    patterns: [
      /logo|brand|name|tagline|identity|rebrand/i,
      /slogan|motto|branding/i,
    ],
    message: 'Refining your brand identity...',
    emoji: '✨',
  },
  update_website: {
    patterns: [
      /website|landing|page|layout|section/i,
      /hero|footer|nav|header|about|contact/i,
      /testimonial|feature|cta|button/i,
    ],
    message: 'Updating your website...',
    emoji: '🌐',
  },
  update_pricing: {
    patterns: [
      /price|pricing|tier|package|cost/i,
      /rate|fee|subscription|plan/i,
      /cheaper|expensive|affordable/i,
    ],
    message: 'Adjusting your pricing...',
    emoji: '💰',
  },
  research_more: {
    patterns: [
      /research|competitor|market|analyze/i,
      /find out|discover|explore|investigate/i,
    ],
    message: 'Researching...',
    emoji: '🔍',
  },
  find_leads: {
    patterns: [
      /lead|prospect|customer|client/i,
      /find.*(people|companies|businesses)/i,
      /potential|target|audience/i,
    ],
    message: 'Finding leads...',
    emoji: '🎯',
  },
  update_outreach: {
    patterns: [
      /script|email|call|outreach/i,
      /pitch|message|template|sequence/i,
      /follow.?up|cold|warm/i,
    ],
    message: 'Refining your outreach...',
    emoji: '📧',
  },
  general_question: {
    patterns: [
      /^(what|how|why|when|where|who|which)/i,
      /^(can you|could you|would you|will you)/i,
      /^(explain|tell me|describe|show me)/i,
      /\?$/,
    ],
    message: 'Thinking...',
    emoji: '💭',
  },
  general_refinement: {
    patterns: [
      /change|update|modify|adjust|tweak/i,
      /fix|improve|enhance|make it/i,
      /different|another|alternative/i,
    ],
    message: 'Making changes...',
    emoji: '⚙️',
  },
};

// Priority order for intent detection (first match wins)
const INTENT_PRIORITY: UserIntent[] = [
  'update_colors',      // Specific: colors
  'update_brand',       // Specific: brand/logo
  'update_website',     // Specific: website
  'update_pricing',     // Specific: pricing
  'find_leads',         // Specific: leads
  'update_outreach',    // Specific: outreach
  'research_more',      // Specific: research
  'build_business',     // General: new business
  'general_question',   // Meta: questions
  'general_refinement', // Fallback: changes
];

/**
 * Detects user intent from their message
 * Returns the most specific matching intent with a context-aware loading message
 */
export function detectIntent(message: string): IntentResult {
  const normalizedMessage = message.trim();

  // Check each intent in priority order
  for (const intent of INTENT_PRIORITY) {
    const config = INTENT_PATTERNS[intent];
    const matches = config.patterns.filter((p) => p.test(normalizedMessage));

    if (matches.length > 0) {
      return {
        intent,
        confidence: matches.length / config.patterns.length,
        loadingMessage: config.message,
        emoji: config.emoji,
      };
    }
  }

  // Default fallback
  return {
    intent: 'general_refinement',
    confidence: 0.5,
    loadingMessage: 'Working on it...',
    emoji: '⏳',
  };
}

/**
 * Gets just the loading message for a given user input
 * Convenience function for quick access
 */
export function getLoadingMessage(message: string): string {
  const { emoji, loadingMessage } = detectIntent(message);
  return `${emoji} ${loadingMessage}`;
}
