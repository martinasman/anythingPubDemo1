import { z } from 'zod';
import { tavily } from '@tavily/core';
import { createClient } from '@/utils/supabase/server';
import type { ResearchArtifact } from '@/types/database';
import { SCOUT_SYSTEM_PROMPT } from '@/config/agentPrompts';

// ============================================
// SCHEMA DEFINITION
// ============================================

export const researchSchema = z.object({
  query: z.string().describe('The business idea or market to research'),
});

// ============================================
// HELPER FUNCTIONS
// ============================================

function extractLocation(query: string): string | null {
  // Simple location extraction - could be enhanced with NLP
  const locationPattern =
    /in\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)|([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+area/i;
  const match = query.match(locationPattern);
  return match ? match[1] || match[2] : null;
}

function extractPricing(text: string): string {
  // Try to extract pricing from text
  const pricePatterns = [
    /\$(\d+(?:,\d{3})*(?:\.\d{2})?)/,
    /(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:USD|dollars?|€|euros?)/i,
    /price[sd]?\s*:?\s*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
  ];

  for (const pattern of pricePatterns) {
    const match = text.match(pattern);
    if (match) return `$${match[1]}`;
  }

  return 'Contact for pricing';
}

function calculateAveragePrice(competitors: Array<{ price: string }>): string {
  const prices = competitors
    .map((c) => {
      const match = c.price.match(/\$?([\d,]+(?:\.\d{2})?)/);
      return match ? parseFloat(match[1].replace(/,/g, '')) : null;
    })
    .filter((p): p is number => p !== null);

  if (prices.length === 0) return 'Varies';

  const avg = prices.reduce((sum, p) => sum + p, 0) / prices.length;
  return `$${avg.toFixed(2)}`;
}

// ============================================
// TOOL IMPLEMENTATION
// ============================================

export async function performMarketResearch(params: z.infer<typeof researchSchema> & { projectId: string }) {
  const { query, projectId } = params;

  try {
    // Initialize Tavily client
    const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY! });

    // Extract location for targeted search
    const location = extractLocation(query);
    const locationSuffix = location ? ` in ${location}` : '';

    // Smart Query Generation (following Scout system prompt)
    const queries = [
      `${query} competitor pricing${locationSuffix}`,
      `${query} customer complaints reviews${locationSuffix}`,
    ];

    // Execute searches in parallel
    const [pricingResults, complaintsResults] = await Promise.all([
      tvly.search(queries[0], {
        searchDepth: 'advanced',
        maxResults: 5,
        includeAnswer: true,
      }),
      tvly.search(queries[1], {
        searchDepth: 'advanced',
        maxResults: 3,
        includeAnswer: true,
      }),
    ]);

    // Parse competitors with smart pricing extraction
    const competitors = pricingResults.results.slice(0, 5).map((result) => ({
      name: result.title,
      url: result.url,
      description: result.content.slice(0, 200),
      price: extractPricing(result.content),
    }));

    // Calculate average market price
    const avgPrice = calculateAveragePrice(competitors);

    // Extract key insights from complaints
    const painPoints = complaintsResults.results
      .slice(0, 3)
      .map((r) => r.content.slice(0, 150))
      .filter(Boolean);

    // Extract all unique sources from results
    const allSources = [
      ...pricingResults.results.map(r => ({ title: r.title, url: r.url })),
      ...complaintsResults.results.map(r => ({ title: r.title, url: r.url })),
    ].filter((s, i, arr) => arr.findIndex(x => x.url === s.url) === i);

    // Generate actionable next steps based on findings
    const nextSteps = [
      `Research ${competitors[0]?.name || 'top competitor'}'s pricing model in detail`,
      `Create a positioning strategy to differentiate from competitors`,
      `Survey 10-15 potential customers to validate pain points`,
      avgPrice !== 'Varies' ? `Consider pricing between ${avgPrice} and ${parseFloat(avgPrice.replace('$', '')) * 1.2}` : 'Conduct pricing research with target customers',
      `Build a minimum viable offering based on competitor gaps`,
    ];

    const researchData: ResearchArtifact = {
      competitors,
      marketSummary:
        pricingResults.answer ||
        `Market analysis for ${query}. Average pricing: ${avgPrice}. ${competitors.length} competitors identified.`,
      targetAudience: location ? `Customers in ${location}` : 'Target market consumers',
      keyInsights: [
        `Average market price: ${avgPrice}`,
        `${competitors.length} direct competitors found`,
        ...painPoints.map((p) => `Customer feedback: ${p}...`),
      ],
      sources: allSources.slice(0, 8), // Keep top 8 sources
      nextSteps,
    };

    // Save to Supabase with UPSERT for updates
    const supabase = await createClient();
    const { data: artifact, error } = await (supabase
      .from('artifacts') as any)
      .upsert(
        {
          project_id: projectId,
          type: 'market_research',
          data: researchData,
          version: 1,
        },
        {
          onConflict: 'project_id,type',
        }
      )
      .select()
      .single();

    if (error) {
      console.error('Failed to save research artifact:', error);
      throw new Error('Failed to save research results');
    }

    return {
      success: true,
      artifact,
      summary: `🔍 Found ${competitors.length} competitors. Avg price: ${avgPrice}. ${researchData.marketSummary}`,
    };
  } catch (error) {
    console.error('Market research error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
