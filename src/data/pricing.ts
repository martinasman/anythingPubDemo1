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
};
