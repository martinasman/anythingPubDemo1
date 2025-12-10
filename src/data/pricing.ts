export interface PricingTier {
  name: string;
  price: number;
  credits: number | 'Unlimited';
  period: 'forever' | 'month';
  features: string[];
  cta: string;
  highlighted: boolean;
}

export const PRICING_TIERS: PricingTier[] = [
  {
    name: 'Free',
    price: 0,
    credits: 50,
    period: 'forever',
    features: [
      '50 credits to start',
      'Basic AI models',
      'Standard generation speed',
      'Export to HTML/CSS',
    ],
    cta: 'Get Started Free',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: 19,
    credits: 500,
    period: 'month',
    features: [
      '500 credits/month',
      'All AI models (GPT-4, Claude, Gemini)',
      'Priority generation',
      'Custom domains',
      'Remove branding',
    ],
    cta: 'Start Pro Trial',
    highlighted: true,
  },
  {
    name: 'Unlimited',
    price: 49,
    credits: 'Unlimited',
    period: 'month',
    features: [
      'Unlimited credits',
      'All AI models',
      'Fastest generation',
      'API access',
      'Team collaboration',
      'Priority support',
    ],
    cta: 'Go Unlimited',
    highlighted: false,
  },
];

export const CREDIT_COSTS = {
  market_research: 5,
  brand_identity: 10,
  website_generation: 15,
  full_business: 25, // Bundle discount
  publish_website: 5,
  // Editing costs (reduced from generation)
  edit_website: 1,
  edit_identity: 1,
  add_page: 2,
  // Other tools
  generate_leads: 5,
  generate_outreach: 3,
  remix_website: 15,
  generate_first_week_plan: 3,
  generate_image: 2,
};

// Tool name to credit cost mapping (for chat route)
export const TOOL_CREDIT_COSTS: Record<string, number> = {
  perform_market_research: CREDIT_COSTS.market_research,
  generate_brand_identity: CREDIT_COSTS.brand_identity,
  generate_website_files: CREDIT_COSTS.website_generation,
  edit_website: CREDIT_COSTS.edit_website,
  edit_identity: CREDIT_COSTS.edit_identity,
  add_page: CREDIT_COSTS.add_page,
  generate_leads: CREDIT_COSTS.generate_leads,
  generate_outreach_scripts: CREDIT_COSTS.generate_outreach,
  remix_website: CREDIT_COSTS.remix_website,
  generate_first_week_plan: CREDIT_COSTS.generate_first_week_plan,
  generate_image: CREDIT_COSTS.generate_image,
  // CRM operations are free
  manage_crm: 0,
};

// ============================================
// CREDIT PACKAGES (One-time purchases)
// ============================================

export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number; // USD
  pricePerCredit: number;
  savings?: string;
  highlighted: boolean;
}

export const CREDIT_PACKAGES: CreditPackage[] = [
  {
    id: 'starter',
    name: 'Starter',
    credits: 50,
    price: 9,
    pricePerCredit: 0.18,
    highlighted: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    credits: 150,
    price: 19,
    pricePerCredit: 0.127,
    savings: 'Save 30%',
    highlighted: true,
  },
  {
    id: 'agency',
    name: 'Agency',
    credits: 500,
    price: 49,
    pricePerCredit: 0.098,
    savings: 'Save 45%',
    highlighted: false,
  },
];

// Helper to get package by ID
export function getCreditPackage(id: string): CreditPackage | undefined {
  return CREDIT_PACKAGES.find((p) => p.id === id);
}
