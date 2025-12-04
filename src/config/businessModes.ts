import {
  Palette, Globe, Instagram, Bot, Sparkles,
  ShoppingBag, Link, TrendingUp, Package,
  Users, type LucideIcon
} from 'lucide-react';

export type BusinessModeId = 'agency' | 'commerce' | 'playground';
export type AgencySubType = 'web-design' | 'smma' | 'ai-automation' | 'consulting' | 'custom';
export type CommerceEntryPoint = 'product-url' | 'discover' | 'manual';

export interface AgencySubTypeConfig {
  id: AgencySubType;
  name: string;
  description: string;
  icon: LucideIcon;
  examplePrompt: string;
  suggestedServices: string[];
}

export interface CommerceEntryConfig {
  id: CommerceEntryPoint;
  name: string;
  description: string;
  icon: LucideIcon;
  placeholder?: string;
}

export interface BusinessMode {
  id: BusinessModeId;
  name: string;
  tagline: string;
  description: string;
  icon: LucideIcon;
  gradient: string;
  features: string[];
  tools: string[];
}

export const AGENCY_SUBTYPES: AgencySubTypeConfig[] = [
  {
    id: 'web-design',
    name: 'Web Design Agency',
    description: 'Build websites for local businesses and startups',
    icon: Globe,
    examplePrompt: 'I want to start a web design agency helping restaurants and cafes get online',
    suggestedServices: ['Landing Pages', 'Full Websites', 'E-commerce Sites', 'Website Maintenance'],
  },
  {
    id: 'smma',
    name: 'Social Media Agency',
    description: 'Manage social media for brands and creators',
    icon: Instagram,
    examplePrompt: 'I want to run social media for fitness coaches and gyms',
    suggestedServices: ['Content Creation', 'Account Management', 'Paid Ads', 'Analytics'],
  },
  {
    id: 'ai-automation',
    name: 'AI Automation Agency',
    description: 'Help businesses automate with AI tools',
    icon: Bot,
    examplePrompt: 'I want to help real estate agents automate their lead follow-up with AI',
    suggestedServices: ['Chatbots', 'Workflow Automation', 'AI Integration', 'Custom AI Tools'],
  },
  {
    id: 'consulting',
    name: 'Consulting Business',
    description: 'Offer expertise and advisory services',
    icon: Users,
    examplePrompt: 'I want to offer business consulting for e-commerce brands',
    suggestedServices: ['Strategy Sessions', 'Audits', 'Implementation', 'Ongoing Advisory'],
  },
  {
    id: 'custom',
    name: 'Something Else',
    description: 'Build any service-based business',
    icon: Sparkles,
    examplePrompt: '',
    suggestedServices: [],
  },
];

export const COMMERCE_ENTRY_POINTS: CommerceEntryConfig[] = [
  {
    id: 'product-url',
    name: 'I have a product',
    description: 'Paste a link from AliExpress, Amazon, or any supplier',
    icon: Link,
    placeholder: 'https://aliexpress.com/item/...',
  },
  {
    id: 'discover',
    name: 'Find me a winner',
    description: 'AI discovers trending products in your niche',
    icon: TrendingUp,
  },
  {
    id: 'manual',
    name: 'Describe a product',
    description: 'Tell us about a product idea you have',
    icon: Package,
  },
];

export const BUSINESS_MODES: Record<Exclude<BusinessModeId, 'playground'>, BusinessMode> = {
  agency: {
    id: 'agency',
    name: 'Anything Agency',
    tagline: 'Start a service business',
    description: 'Build a complete agency with brand, website, pricing, and lead generation tools.',
    icon: Palette,
    gradient: 'from-blue-500 to-indigo-600',
    features: [
      'Professional brand identity',
      'High-converting website',
      'Smart pricing strategy',
      'Lead generation tools',
      'Client proposals',
      'CRM dashboard',
    ],
    tools: ['brand', 'website', 'pricing', 'market-research', 'leads', 'proposals', 'crm'],
  },
  commerce: {
    id: 'commerce',
    name: 'Anything Commerce',
    tagline: 'Launch a product store',
    description: 'From product to profit. Find products, build your store, create ads, start selling.',
    icon: ShoppingBag,
    gradient: 'from-emerald-500 to-teal-600',
    features: [
      'Product research & validation',
      'One-product store generator',
      'Ad creative generator',
      'Stripe checkout integration',
      'Revenue dashboard',
      'Supplier connection',
    ],
    tools: ['product-research', 'store', 'ads', 'checkout', 'analytics', 'supplier'],
  },
};

// Steps shown in the progress indicator for each mode
export const AGENCY_STEPS = [
  { id: 'type', label: 'Agency Type' },
  { id: 'details', label: 'Your Vision' },
  { id: 'brand', label: 'Brand' },
  { id: 'website', label: 'Website' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'launch', label: 'Launch' },
];

export const COMMERCE_STEPS = [
  { id: 'product', label: 'Product' },
  { id: 'store', label: 'Store' },
  { id: 'ads', label: 'Ads' },
  { id: 'checkout', label: 'Checkout' },
  { id: 'launch', label: 'Launch' },
];

// Niche options for commerce discover flow
export const COMMERCE_NICHES = [
  'Home & Kitchen',
  'Beauty & Health',
  'Electronics',
  'Fashion',
  'Fitness',
  'Pets',
  'Baby & Kids',
  'Car Accessories',
];
