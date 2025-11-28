import { z } from 'zod';
import { tavily } from '@tavily/core';
import { createClient } from '@/utils/supabase/server';
import type { LeadsArtifact, Lead } from '@/types/database';

// ============================================
// SCHEMA DEFINITION
// ============================================

export const leadsSchema = z.object({
  businessType: z.string().describe('The type of business offering services'),
  targetIndustries: z.array(z.string()).describe('Industries to target for leads'),
  targetCompanySize: z.string().optional().describe('Target company size (e.g., "small", "medium", "enterprise")'),
  location: z.string().optional().describe('Geographic location to focus on'),
  numberOfLeads: z.number().min(1).max(15).default(10).describe('Number of leads to generate'),
});

// ============================================
// IDEAL CUSTOMER PROFILE TEMPLATES
// ============================================

const ICP_TEMPLATES: Record<string, {
  industries: string[];
  companySize: string;
  painPoints: string[];
  budget: string;
}> = {
  'ai automation': {
    industries: ['SaaS', 'E-commerce', 'Real Estate', 'Financial Services', 'Healthcare'],
    companySize: '10-100 employees',
    painPoints: ['Manual repetitive tasks', 'Slow customer response times', 'Data entry errors', 'Scaling operations'],
    budget: '$1,000-5,000/month',
  },
  'web design': {
    industries: ['Local Services', 'Professional Services', 'Retail', 'Restaurants', 'Healthcare'],
    companySize: '1-50 employees',
    painPoints: ['Outdated website', 'Poor mobile experience', 'Low conversion rates', 'No online presence'],
    budget: '$2,000-10,000 project',
  },
  'lead gen': {
    industries: ['B2B Services', 'Software', 'Consulting', 'Real Estate', 'Financial Services'],
    companySize: '5-200 employees',
    painPoints: ['Inconsistent lead flow', 'High customer acquisition cost', 'Sales team underutilized', 'Poor lead quality'],
    budget: '$500-3,000/month',
  },
  'seo': {
    industries: ['E-commerce', 'Local Services', 'Professional Services', 'Healthcare', 'Real Estate'],
    companySize: '5-100 employees',
    painPoints: ['Low search rankings', 'Competitors outranking them', 'Low organic traffic', 'Wasted ad spend'],
    budget: '$500-2,500/month',
  },
  'default': {
    industries: ['Professional Services', 'Technology', 'Healthcare', 'Finance', 'Retail'],
    companySize: '10-100 employees',
    painPoints: ['Growth challenges', 'Operational inefficiency', 'Competition', 'Customer acquisition'],
    budget: '$1,000-5,000/month',
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

  return 'default';
}

function extractCompanyInfo(result: any): Partial<Lead> {
  const content = result.content || '';
  const title = result.title || '';
  const url = result.url || '';

  // Extract domain for company name fallback
  const domain = url.match(/https?:\/\/(?:www\.)?([^\/]+)/)?.[1] || '';
  const companyFromDomain = domain.split('.')[0]?.replace(/-/g, ' ');

  // Try to extract company name from title
  const companyName = title.split(/[-|–—]/)[0]?.trim() || companyFromDomain || 'Unknown Company';

  // Extract potential contact info (simplified - would need enrichment API for real contacts)
  const emailMatch = content.match(/[\w.-]+@[\w.-]+\.\w+/);
  const linkedInMatch = content.match(/linkedin\.com\/(?:in|company)\/[\w-]+/);

  return {
    companyName: companyName.slice(0, 50),
    website: url,
    contactEmail: emailMatch?.[0],
    contactLinkedIn: linkedInMatch ? `https://${linkedInMatch[0]}` : undefined,
  };
}

function scoreLead(content: string, painPoints: string[]): number {
  let score = 5; // Base score

  // Check for pain point matches
  painPoints.forEach(painPoint => {
    const keywords = painPoint.toLowerCase().split(' ');
    keywords.forEach(keyword => {
      if (keyword.length > 3 && content.toLowerCase().includes(keyword)) {
        score += 0.5;
      }
    });
  });

  // Check for buying intent signals
  const buyingSignals = ['looking for', 'need help', 'seeking', 'hiring', 'budget', 'invest'];
  buyingSignals.forEach(signal => {
    if (content.toLowerCase().includes(signal)) {
      score += 1;
    }
  });

  return Math.min(10, Math.round(score));
}

function generatePainPoints(content: string, defaultPainPoints: string[]): string[] {
  const detected: string[] = [];

  // Check for common pain point indicators in content
  const painIndicators: Record<string, string> = {
    'struggling': 'Currently facing operational challenges',
    'outdated': 'Using outdated systems or processes',
    'manual': 'Heavy reliance on manual processes',
    'growth': 'Looking to scale operations',
    'competition': 'Facing increased competition',
    'customer': 'Customer experience improvements needed',
    'efficiency': 'Seeking operational efficiency',
    'cost': 'Looking to reduce costs',
  };

  const lowerContent = content.toLowerCase();
  Object.entries(painIndicators).forEach(([keyword, painPoint]) => {
    if (lowerContent.includes(keyword) && detected.length < 3) {
      detected.push(painPoint);
    }
  });

  // Fill with defaults if not enough detected
  while (detected.length < 2 && defaultPainPoints.length > detected.length) {
    const randomPain = defaultPainPoints[Math.floor(Math.random() * defaultPainPoints.length)];
    if (!detected.includes(randomPain)) {
      detected.push(randomPain);
    }
  }

  return detected.slice(0, 3);
}

// ============================================
// TOOL IMPLEMENTATION
// ============================================

export async function generateLeads(params: z.infer<typeof leadsSchema> & { projectId: string }) {
  const { businessType, targetIndustries, targetCompanySize, location, numberOfLeads, projectId } = params;

  try {
    // Initialize Tavily client
    const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY! });

    // Detect business type and get ICP template
    const detectedType = detectBusinessType(businessType);
    const icpTemplate = ICP_TEMPLATES[detectedType] || ICP_TEMPLATES['default'];

    // Use provided industries or defaults
    const industries = targetIndustries.length > 0 ? targetIndustries : icpTemplate.industries;
    const companySize = targetCompanySize || icpTemplate.companySize;

    // Build search queries for different industries
    const locationSuffix = location ? ` in ${location}` : '';
    const queries = industries.slice(0, 3).map(industry =>
      `${industry} companies ${companySize} looking for ${businessType}${locationSuffix}`
    );

    // Execute searches in parallel
    const searchPromises = queries.map(query =>
      tvly.search(query, {
        searchDepth: 'advanced',
        maxResults: Math.ceil(numberOfLeads / queries.length) + 2,
        includeAnswer: false,
      })
    );

    const searchResults = await Promise.all(searchPromises);

    // Combine and deduplicate results
    const allResults: any[] = [];
    const seenUrls = new Set<string>();

    searchResults.forEach((result, queryIndex) => {
      result.results.forEach(item => {
        if (!seenUrls.has(item.url)) {
          seenUrls.add(item.url);
          allResults.push({
            ...item,
            industry: industries[queryIndex],
          });
        }
      });
    });

    // Generate leads from search results
    const leads: Lead[] = allResults.slice(0, numberOfLeads).map((result, index) => {
      const companyInfo = extractCompanyInfo(result);
      const score = scoreLead(result.content || '', icpTemplate.painPoints);
      const painPoints = generatePainPoints(result.content || '', icpTemplate.painPoints);

      return {
        id: crypto.randomUUID(),
        companyName: companyInfo.companyName || `Lead ${index + 1}`,
        industry: result.industry || industries[0],
        website: companyInfo.website,
        contactEmail: companyInfo.contactEmail,
        contactLinkedIn: companyInfo.contactLinkedIn,
        painPoints,
        score,
        status: 'new' as const,
      };
    });

    // Sort leads by score (highest first)
    leads.sort((a, b) => b.score - a.score);

    // Build ICP based on search results and template
    const idealCustomerProfile = {
      industries: industries.slice(0, 5),
      companySize,
      painPoints: icpTemplate.painPoints,
      budget: icpTemplate.budget,
    };

    const leadsData: LeadsArtifact = {
      leads,
      idealCustomerProfile,
      searchCriteria: `${businessType} targeting ${industries.join(', ')}${locationSuffix}`,
    };

    // Save to Supabase
    const supabase = await createClient();
    const { data: artifact, error } = await (supabase
      .from('artifacts') as any)
      .upsert(
        {
          project_id: projectId,
          type: 'leads',
          data: leadsData,
          version: 1,
        },
        {
          onConflict: 'project_id,type',
        }
      )
      .select()
      .single();

    if (error) {
      console.error('Failed to save leads artifact:', error);
      throw new Error('Failed to save leads');
    }

    // Calculate stats for summary
    const avgScore = leads.length > 0
      ? (leads.reduce((sum, l) => sum + l.score, 0) / leads.length).toFixed(1)
      : '0';
    const highScoreLeads = leads.filter(l => l.score >= 7).length;

    return {
      success: true,
      artifact,
      summary: `🎯 Generated ${leads.length} leads across ${industries.length} industries. ${highScoreLeads} high-score prospects identified (avg score: ${avgScore}/10).`,
    };
  } catch (error) {
    console.error('Lead generation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
