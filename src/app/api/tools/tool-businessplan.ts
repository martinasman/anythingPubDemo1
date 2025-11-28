import { z } from 'zod';
import { createClient } from '@/utils/supabase/server';
import type { BusinessPlanArtifact, ResearchArtifact, IdentityArtifact } from '@/types/database';

// ============================================
// SCHEMA DEFINITION
// ============================================

export const businessPlanSchema = z.object({
  businessType: z.string().describe('The type of business (e.g., "AI Automation Agency", "Web Design Agency")'),
  targetMarket: z.string().describe('The target market or customer segment'),
  competitors: z.array(z.object({
    name: z.string(),
    price: z.string(),
  })).optional().describe('Competitor data from market research'),
  brandName: z.string().optional().describe('The brand name from identity generation'),
});

// ============================================
// PRICING TEMPLATES BY BUSINESS TYPE
// ============================================

const PRICING_TEMPLATES: Record<string, {
  tiers: Array<{ name: string; basePrice: number; features: string[] }>;
  packages: Array<{ name: string; description: string; deliverables: string[]; basePrice: number }>;
}> = {
  'ai automation': {
    tiers: [
      { name: 'Starter', basePrice: 997, features: ['1 automation workflow', 'Basic integrations', 'Email support', '30-day setup'] },
      { name: 'Growth', basePrice: 2497, features: ['3 automation workflows', 'Advanced integrations', 'Priority support', 'Weekly check-ins', 'Custom training'] },
      { name: 'Enterprise', basePrice: 4997, features: ['Unlimited workflows', 'Custom AI solutions', 'Dedicated account manager', '24/7 support', 'White-label options'] },
    ],
    packages: [
      { name: 'Lead Automation', description: 'Automate your lead capture and nurturing process', deliverables: ['Lead capture forms', 'Email sequences', 'CRM integration', 'Lead scoring'], basePrice: 1497 },
      { name: 'Content Automation', description: 'AI-powered content creation and distribution', deliverables: ['AI content generation', 'Social scheduling', 'Blog automation', 'Analytics dashboard'], basePrice: 1997 },
      { name: 'Customer Service Bot', description: 'Intelligent chatbot for customer support', deliverables: ['Custom chatbot', 'FAQ automation', 'Ticket routing', 'Integration setup'], basePrice: 2497 },
    ],
  },
  'web design': {
    tiers: [
      { name: 'Basic', basePrice: 1500, features: ['5-page website', 'Mobile responsive', 'Contact form', 'Basic SEO'] },
      { name: 'Professional', basePrice: 3500, features: ['10-page website', 'Custom animations', 'CMS integration', 'Advanced SEO', 'E-commerce ready'] },
      { name: 'Premium', basePrice: 7500, features: ['Unlimited pages', 'Custom features', 'Ongoing maintenance', 'Priority support', 'Performance optimization'] },
    ],
    packages: [
      { name: 'Landing Page', description: 'High-converting single page design', deliverables: ['Custom design', 'Mobile optimization', 'Speed optimization', 'Analytics setup'], basePrice: 997 },
      { name: 'Business Website', description: 'Complete business website with all essentials', deliverables: ['5-page website', 'Contact forms', 'SEO optimization', 'Social integration'], basePrice: 2497 },
      { name: 'E-commerce Store', description: 'Full online store setup', deliverables: ['Product pages', 'Shopping cart', 'Payment integration', 'Inventory system'], basePrice: 4997 },
    ],
  },
  'lead gen': {
    tiers: [
      { name: 'Starter', basePrice: 500, features: ['50 qualified leads/month', 'Basic targeting', 'Email list', 'Monthly report'] },
      { name: 'Scale', basePrice: 1500, features: ['150 qualified leads/month', 'Multi-channel outreach', 'CRM integration', 'Weekly reports', 'A/B testing'] },
      { name: 'Enterprise', basePrice: 3500, features: ['Unlimited leads', 'Dedicated researcher', 'Custom qualification', 'Real-time dashboard', 'Appointment setting'] },
    ],
    packages: [
      { name: 'LinkedIn Outreach', description: 'B2B lead generation via LinkedIn', deliverables: ['Profile optimization', 'Connection campaigns', 'Message sequences', 'Lead export'], basePrice: 997 },
      { name: 'Email Campaigns', description: 'Cold email lead generation', deliverables: ['Email list building', 'Campaign setup', 'A/B testing', 'Performance tracking'], basePrice: 1497 },
      { name: 'Full-Funnel', description: 'Complete lead generation system', deliverables: ['Multi-channel outreach', 'Landing pages', 'Lead nurturing', 'Conversion tracking'], basePrice: 2997 },
    ],
  },
  'seo': {
    tiers: [
      { name: 'Local SEO', basePrice: 500, features: ['Google Business optimization', 'Local citations', '5 keywords', 'Monthly reporting'] },
      { name: 'Growth', basePrice: 1500, features: ['On-page optimization', 'Content strategy', '15 keywords', 'Link building', 'Bi-weekly reports'] },
      { name: 'Domination', basePrice: 3500, features: ['Full SEO audit', 'Technical SEO', 'Content creation', 'Authority building', 'Competitor analysis'] },
    ],
    packages: [
      { name: 'SEO Audit', description: 'Comprehensive website SEO analysis', deliverables: ['Technical audit', 'Content analysis', 'Competitor research', 'Action plan'], basePrice: 497 },
      { name: 'Local SEO Setup', description: 'Get found in local searches', deliverables: ['Google Business setup', 'Citation building', 'Review strategy', 'Local content'], basePrice: 997 },
      { name: 'Content + SEO', description: 'Content-driven SEO strategy', deliverables: ['Keyword research', 'Content calendar', '4 blog posts/month', 'Optimization'], basePrice: 1997 },
    ],
  },
  'default': {
    tiers: [
      { name: 'Starter', basePrice: 500, features: ['Basic service', 'Email support', 'Monthly check-in'] },
      { name: 'Professional', basePrice: 1500, features: ['Full service', 'Priority support', 'Weekly check-ins', 'Custom solutions'] },
      { name: 'Enterprise', basePrice: 3500, features: ['Unlimited service', 'Dedicated manager', '24/7 support', 'White-label options'] },
    ],
    packages: [
      { name: 'Quick Start', description: 'Get started quickly with essential services', deliverables: ['Initial setup', 'Basic training', 'Support documentation'], basePrice: 497 },
      { name: 'Full Service', description: 'Complete service package', deliverables: ['Full implementation', 'Training', 'Ongoing support', 'Optimization'], basePrice: 1497 },
      { name: 'Premium', description: 'Premium all-inclusive package', deliverables: ['Everything included', 'Priority handling', 'Custom features', 'Dedicated support'], basePrice: 2997 },
    ],
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

function detectBusinessType(businessType: string): string {
  const type = businessType.toLowerCase();

  if (type.includes('ai') || type.includes('automation')) return 'ai automation';
  if (type.includes('web') || type.includes('design')) return 'web design';
  if (type.includes('lead') || type.includes('gen')) return 'lead gen';
  if (type.includes('seo')) return 'seo';
  if (type.includes('ugc') || type.includes('content')) return 'default';
  if (type.includes('email') || type.includes('marketing')) return 'default';
  if (type.includes('ads') || type.includes('paid')) return 'default';

  return 'default';
}

function adjustPricingToMarket(
  basePricing: typeof PRICING_TEMPLATES['default'],
  competitors: Array<{ name: string; price: string }> | undefined
): typeof PRICING_TEMPLATES['default'] {
  if (!competitors || competitors.length === 0) return basePricing;

  // Extract average competitor price
  const prices = competitors
    .map(c => {
      const match = c.price.match(/\$?([\d,]+)/);
      return match ? parseFloat(match[1].replace(/,/g, '')) : null;
    })
    .filter((p): p is number => p !== null);

  if (prices.length === 0) return basePricing;

  const avgCompetitorPrice = prices.reduce((a, b) => a + b, 0) / prices.length;

  // Adjust pricing based on market (aim for slightly below average for competitive positioning)
  const multiplier = avgCompetitorPrice > 2000 ? 0.9 : avgCompetitorPrice > 1000 ? 1.0 : 1.1;

  return {
    tiers: basePricing.tiers.map(tier => ({
      ...tier,
      basePrice: Math.round(tier.basePrice * multiplier / 100) * 100,
    })),
    packages: basePricing.packages.map(pkg => ({
      ...pkg,
      basePrice: Math.round(pkg.basePrice * multiplier / 100) * 100,
    })),
  };
}

function generateExecutiveSummary(businessType: string, targetMarket: string, brandName?: string): string {
  const name = brandName || 'Your Agency';
  return `${name} is a ${businessType.toLowerCase()} positioned to serve ${targetMarket}. Our competitive advantage lies in combining cutting-edge technology with personalized service delivery, enabling clients to achieve measurable results quickly. We operate on a value-based pricing model that ensures sustainable growth while delivering exceptional ROI for our clients.`;
}

function generateRevenueModel(businessType: string): string {
  const type = detectBusinessType(businessType);

  const models: Record<string, string> = {
    'ai automation': 'Hybrid model combining one-time setup fees with monthly retainer subscriptions. Initial projects generate $1,500-5,000 in setup revenue, followed by $500-2,000/month in recurring maintenance and optimization fees. Target: 60% recurring revenue within 6 months.',
    'web design': 'Project-based pricing with optional maintenance retainers. Average project value of $2,500-7,500 with 30% of clients converting to $200-500/month maintenance plans. Upsell opportunities through hosting, SEO, and content services.',
    'lead gen': 'Performance-based pricing combined with monthly retainers. Base retainer of $500-1,500/month plus $50-150 per qualified lead. Target 70% recurring revenue with performance bonuses tied to client ROI.',
    'seo': 'Monthly retainer model with 6-12 month minimum commitments. Entry point at $500/month scaling to $3,500/month for enterprise clients. Revenue compounds through referrals and expanded scope.',
    'default': 'Flexible pricing model combining project-based work with monthly retainers. Initial engagements establish value, followed by ongoing service agreements. Target 50% recurring revenue within the first year.',
  };

  return models[type] || models['default'];
}

function generateValueProposition(businessType: string, targetMarket: string): string {
  return `We help ${targetMarket} achieve their goals through expert ${businessType.toLowerCase()} services. Unlike competitors who offer generic solutions, we provide personalized strategies backed by data-driven insights and dedicated support. Our clients typically see measurable results within the first 30 days.`;
}

// ============================================
// TOOL IMPLEMENTATION
// ============================================

export async function generateBusinessPlan(params: z.infer<typeof businessPlanSchema> & { projectId: string }) {
  const { businessType, targetMarket, competitors, brandName, projectId } = params;

  try {
    // Detect business type and get appropriate pricing template
    const detectedType = detectBusinessType(businessType);
    const basePricing = PRICING_TEMPLATES[detectedType] || PRICING_TEMPLATES['default'];

    // Adjust pricing based on competitor data
    const adjustedPricing = adjustPricingToMarket(basePricing, competitors);

    // Generate business plan artifact
    const businessPlanData: BusinessPlanArtifact = {
      executiveSummary: generateExecutiveSummary(businessType, targetMarket, brandName),
      revenueModel: generateRevenueModel(businessType),
      pricingTiers: adjustedPricing.tiers.map(tier => ({
        name: tier.name,
        price: `$${tier.basePrice.toLocaleString()}/month`,
        features: tier.features,
      })),
      servicePackages: adjustedPricing.packages.map(pkg => ({
        name: pkg.name,
        description: pkg.description,
        deliverables: pkg.deliverables,
        price: `$${pkg.basePrice.toLocaleString()}`,
      })),
      targetMarket,
      valueProposition: generateValueProposition(businessType, targetMarket),
    };

    // Save to Supabase
    const supabase = await createClient();
    const { data: artifact, error } = await (supabase
      .from('artifacts') as any)
      .upsert(
        {
          project_id: projectId,
          type: 'business_plan',
          data: businessPlanData,
          version: 1,
        },
        {
          onConflict: 'project_id,type',
        }
      )
      .select()
      .single();

    if (error) {
      console.error('Failed to save business plan artifact:', error);
      throw new Error('Failed to save business plan');
    }

    return {
      success: true,
      artifact,
      summary: `📋 Created business plan with ${businessPlanData.pricingTiers.length} pricing tiers and ${businessPlanData.servicePackages.length} service packages.`,
    };
  } catch (error) {
    console.error('Business plan generation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
