import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import type { Lead, LeadsArtifact, WebsiteAnalysis, leadToLeadRow } from '@/types/database';
import { searchGoogleMapsBusinesses, searchBusinessesWithoutWebsites, GoogleMapsResult } from '@/lib/services/serpapi';
import { analyzeWebsite, getWebsitePriority } from '@/lib/services/websiteAnalyzer';

// ============================================
// SCHEMA DEFINITION
// ============================================

export const leadsSchema = z.object({
  location: z.string().describe('Location to search for businesses (e.g., "Austin, TX", "Miami, FL")'),
  searchTerms: z.string().optional().describe('Optional keywords to narrow search (e.g., "restaurants", "contractors")'),
  numberOfLeads: z.number().min(5).max(50).optional().describe('Number of leads to generate (default: 20)'),
  noWebsiteOnly: z.boolean().optional().describe('Only return businesses without websites - highest value targets'),
  categories: z.array(z.string()).optional().describe('Specific business categories to search (e.g., ["plumbers", "electricians"])'),
});

// ============================================
// ICP TYPES - Website Quality Focused
// ============================================

interface ICP {
  targetLocation: string;
  painPoints: string[];
  solutionType: string;
}

// ============================================
// SCORING ALGORITHM (1-100 SCALE)
// ============================================

interface ScoreFactors {
  websiteOpportunity: number;  // 0-40 points
  businessSignals: number;     // 0-25 points
  icpMatch: number;            // 0-20 points
  contactAvailability: number; // 0-15 points
}

function calculateLeadScore(
  business: GoogleMapsResult,
  websiteAnalysis: WebsiteAnalysis | null,
  icp: ICP
): { score: number; factors: ScoreFactors; breakdown: string[] } {
  const factors: ScoreFactors = {
    websiteOpportunity: 0,
    businessSignals: 0,
    icpMatch: 0,
    contactAvailability: 0,
  };
  const breakdown: string[] = [];

  // 1. WEBSITE OPPORTUNITY (0-40 points)
  if (websiteAnalysis) {
    switch (websiteAnalysis.status) {
      case 'none':
        factors.websiteOpportunity = 40;
        breakdown.push('No website (+40)');
        break;
      case 'broken':
        factors.websiteOpportunity = 35;
        breakdown.push('Broken website (+35)');
        break;
      case 'poor':
        factors.websiteOpportunity = 30;
        breakdown.push('Poor quality website (+30)');
        break;
      case 'outdated':
        factors.websiteOpportunity = 20;
        breakdown.push('Outdated website (+20)');
        break;
      case 'good':
        factors.websiteOpportunity = 5;
        breakdown.push('Website exists (+5)');
        break;
    }

    // Bonus for specific issues
    if (websiteAnalysis.issues.length > 3) {
      const bonus = Math.min((websiteAnalysis.issues.length - 3) * 2, 10);
      factors.websiteOpportunity = Math.min(factors.websiteOpportunity + bonus, 40);
      if (bonus > 0) breakdown.push(`Multiple issues (+${bonus})`);
    }
  } else {
    // If no analysis, assume needs investigation
    factors.websiteOpportunity = 15;
    breakdown.push('Website not analyzed (+15)');
  }

  // 2. BUSINESS SIGNALS (0-25 points)
  // Low rating = they need help
  if (business.rating !== undefined) {
    if (business.rating < 3.5) {
      factors.businessSignals += 15;
      breakdown.push(`Low rating ${business.rating} (+15)`);
    } else if (business.rating < 4.0) {
      factors.businessSignals += 8;
      breakdown.push(`Moderate rating ${business.rating} (+8)`);
    } else if (business.rating >= 4.5) {
      factors.businessSignals += 3;
      breakdown.push(`Good rating - established business (+3)`);
    }
  }

  // Few reviews = newer business, more receptive
  if (business.reviewCount !== undefined) {
    if (business.reviewCount < 10) {
      factors.businessSignals += 10;
      breakdown.push(`Few reviews (${business.reviewCount}) (+10)`);
    } else if (business.reviewCount < 50) {
      factors.businessSignals += 5;
      breakdown.push(`Growing business (${business.reviewCount} reviews) (+5)`);
    }
  }

  // 3. ICP MATCH (0-20 points) - Now purely location-based
  // Location match (the main ICP factor now)
  const locationMatch = business.address?.toLowerCase().includes(icp.targetLocation.toLowerCase().split(',')[0]);
  if (locationMatch) {
    factors.icpMatch += 15;
    breakdown.push('Location match (+15)');
  }

  // Bonus for having a business type identified
  if (business.type) {
    factors.icpMatch += 5;
    breakdown.push('Business type identified (+5)');
  }

  // 4. CONTACT AVAILABILITY (0-15 points)
  if (business.phone) {
    factors.contactAvailability += 8;
    breakdown.push('Phone available (+8)');
  }
  if (business.website) {
    factors.contactAvailability += 4;
    breakdown.push('Website exists (+4)');
  }
  // Reserve 3 points for email if we had it
  // factors.contactAvailability += business.email ? 3 : 0;

  // 5. EXTRA SIGNALS FOR NO-WEBSITE BUSINESSES (bonus points)
  // These businesses are highest value - add bonus for good signals
  if (!business.website) {
    // Has phone = contactable (critical for no-website businesses)
    if (business.phone) {
      factors.contactAvailability += 5;
      breakdown.push('Has phone but no website (+5)');
    }

    // Has reviews = active, legitimate business
    if (business.reviewCount && business.reviewCount > 5) {
      factors.businessSignals += 10;
      breakdown.push(`Active business without website (${business.reviewCount} reviews) (+10)`);
    }

    // High rating without website = good business, bad online presence = great target
    if (business.rating && business.rating >= 4.0) {
      factors.websiteOpportunity += 5;
      breakdown.push(`Good business (${business.rating}★) needs online presence (+5)`);
    }
  }

  const totalScore =
    factors.websiteOpportunity +
    factors.businessSignals +
    factors.icpMatch +
    factors.contactAvailability;

  return {
    score: Math.min(totalScore, 100),
    factors,
    breakdown,
  };
}

// ============================================
// LEAD ENRICHMENT
// ============================================

async function enrichLeadWithAnalysis(
  business: GoogleMapsResult,
  icp: ICP,
  analyzeWebsites: boolean
): Promise<Lead> {
  // Analyze website if requested
  let websiteAnalysis: WebsiteAnalysis | null = null;
  if (analyzeWebsites) {
    const analysis = await analyzeWebsite(business.website);
    websiteAnalysis = {
      status: analysis.status,
      score: analysis.score,
      issues: analysis.issues,
      lastUpdated: analysis.lastUpdated,
      technologies: analysis.technologies,
      hasSSL: analysis.hasSSL,
      loadTime: analysis.loadTime,
      mobileResponsive: analysis.mobileResponsive,
      hasContactForm: analysis.hasContactForm,
      socialLinks: analysis.socialLinks,
    };
  }

  // Calculate score
  const { score, breakdown } = calculateLeadScore(business, websiteAnalysis, icp);

  // Determine pain points based on website analysis
  const painPoints: string[] = [];
  if (websiteAnalysis) {
    if (websiteAnalysis.status === 'none') {
      painPoints.push('No website - missing online presence');
    } else if (websiteAnalysis.status === 'broken') {
      painPoints.push('Website is broken or inaccessible');
    } else {
      painPoints.push(...websiteAnalysis.issues.slice(0, 3));
    }
  }

  // Determine suggested outreach angle
  let suggestedAngle = '';
  if (websiteAnalysis?.status === 'none') {
    suggestedAngle = `"Hi, I noticed ${business.name} doesn't have a website yet. I built a concept for you..."`;
  } else if (websiteAnalysis?.status === 'broken') {
    suggestedAngle = `"I tried visiting your website and noticed it's not loading. I'd love to help fix that..."`;
  } else if (websiteAnalysis?.status === 'poor' || websiteAnalysis?.status === 'outdated') {
    const mainIssue = websiteAnalysis.issues[0] || 'could use an update';
    suggestedAngle = `"I noticed your website ${mainIssue.toLowerCase()}. I have some ideas to improve it..."`;
  } else {
    suggestedAngle = `"I was impressed by ${business.name}. I help businesses like yours grow online..."`;
  }

  // Determine priority
  const priority = websiteAnalysis ? getWebsitePriority(websiteAnalysis) : 'medium';

  // Build the lead
  const lead: Lead = {
    id: crypto.randomUUID(),
    companyName: business.name,
    industry: business.type || 'Local Business',

    // Contact info
    website: business.website,
    phone: business.phone,
    address: business.address,

    // Google Maps data
    placeId: business.placeId,
    rating: business.rating,
    reviewCount: business.reviewCount,
    coordinates: business.coordinates,

    // Website analysis
    websiteAnalysis: websiteAnalysis || undefined,

    // Scoring (1-100)
    score,
    scoreBreakdown: breakdown,

    // Legacy ICP fields (for backwards compat)
    icpScore: Math.round(score / 10), // Convert to 0-10 for legacy
    icpMatchReasons: breakdown.slice(0, 3),
    painPoints,
    suggestedAngle,

    // CRM fields
    status: 'new',
    priority,

    // Timestamps
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return lead;
}

// ============================================
// CHAT OUTPUT FORMATTING
// ============================================

function formatLeadsForChat(leads: Lead[], noWebsiteOnlyMode: boolean = false): string {
  // Group by website status
  const noWebsite = leads.filter(l => l.websiteAnalysis?.status === 'none' || !l.website);
  const broken = leads.filter(l => l.websiteAnalysis?.status === 'broken');
  const poor = leads.filter(l => l.websiteAnalysis?.status === 'poor');
  const outdated = leads.filter(l => l.websiteAnalysis?.status === 'outdated');
  const good = leads.filter(l => l.websiteAnalysis?.status === 'good');

  let output = noWebsiteOnlyMode
    ? '## 🎯 Businesses Needing Websites\n\n'
    : '## Website Analysis Results\n\n';

  if (noWebsite.length > 0) {
    output += noWebsiteOnlyMode
      ? `### 🔥 HIGHEST VALUE TARGETS - No Website (${noWebsite.length})\n`
      : `### 🔴 HIGH PRIORITY - No Website (${noWebsite.length})\n`;

    output += '*These businesses are on Google Maps but have NO website at all!*\n\n';

    noWebsite.forEach(lead => {
      output += `**${lead.companyName}** (${lead.industry || 'Local Business'})\n`;
      output += `- 📍 ${lead.address || 'Address unavailable'}\n`;
      output += `- 📞 ${lead.phone || 'No phone listed'}\n`;
      if (lead.rating) {
        output += `- ⭐ ${lead.rating} (${lead.reviewCount || 0} reviews)\n`;
      }
      output += `- 💯 Score: **${lead.score}/100**\n`;
      output += `- 💡 ${lead.suggestedAngle}\n\n`;
    });
  }

  // Only show other sections if not in noWebsiteOnly mode
  if (!noWebsiteOnlyMode) {
    if (broken.length > 0) {
      output += `### 🔴 HIGH PRIORITY - Broken Websites (${broken.length})\n`;
      broken.forEach(lead => {
        output += `- **${lead.companyName}** - ${lead.website}\n`;
        output += `  Issues: ${lead.websiteAnalysis?.issues.slice(0, 2).join(', ')}\n`;
        output += `  Score: ${lead.score}/100\n`;
      });
      output += '\n';
    }

    if (poor.length > 0) {
      output += `### 🔴 HIGH PRIORITY - Poor Quality (${poor.length})\n`;
      poor.forEach(lead => {
        output += `- **${lead.companyName}** - ${lead.website}\n`;
        output += `  Issues: ${lead.websiteAnalysis?.issues.slice(0, 2).join(', ')}\n`;
        output += `  Score: ${lead.score}/100\n`;
      });
      output += '\n';
    }

    if (outdated.length > 0) {
      output += `### 🟡 MEDIUM PRIORITY - Outdated (${outdated.length})\n`;
      outdated.forEach(lead => {
        const lastUpdate = lead.websiteAnalysis?.lastUpdated || 'Unknown';
        output += `- **${lead.companyName}** - Last updated: ${lastUpdate}\n`;
        output += `  Score: ${lead.score}/100\n`;
      });
      output += '\n';
    }

    if (good.length > 0) {
      output += `### 🟢 LOW PRIORITY - Good Websites (${good.length})\n`;
      good.forEach(lead => {
        output += `- **${lead.companyName}** - Website in good condition\n`;
        output += `  Score: ${lead.score}/100\n`;
      });
      output += '\n';
    }
  }

  // Summary
  output += '---\n';
  if (noWebsiteOnlyMode) {
    output += `**Found ${noWebsite.length} businesses without websites**\n`;
    output += `These are your highest-value prospects - they need a website!\n`;
  } else {
    output += `**Total leads analyzed:** ${leads.length}\n`;
    output += `**High priority (no site/broken/poor):** ${noWebsite.length + broken.length + poor.length}\n`;
    output += `**Medium priority (outdated):** ${outdated.length}\n`;
  }

  return output;
}

// ============================================
// TOOL IMPLEMENTATION
// ============================================

export async function generateLeads(params: z.infer<typeof leadsSchema> & { projectId: string }) {
  console.log('[Leads] ===== FUNCTION CALLED =====');
  console.log('[Leads] Params:', JSON.stringify(params, null, 2));
  console.log('[Leads] SERPAPI_KEY exists:', !!process.env.SERPAPI_KEY);

  // Apply defaults for optional params
  const {
    location,
    searchTerms,
    numberOfLeads = 20,
    noWebsiteOnly = false,
    categories,
    projectId
  } = params;

  try {
    // 1. Build ICP (website-quality focused)
    const icp: ICP = {
      targetLocation: location,
      painPoints: [
        'No website',
        'Broken/error website',
        'Poor quality website',
        'Outdated website',
        'Not mobile responsive'
      ],
      solutionType: 'web design',
    };

    let businesses: GoogleMapsResult[];

    // 2. Search based on mode
    if (noWebsiteOnly) {
      // Use specialized no-website search
      console.log(`[Leads] Searching for businesses WITHOUT websites in ${location}...`);
      const categoriesToSearch = categories || (searchTerms ? [searchTerms] : ['plumbers', 'electricians', 'restaurants', 'cleaning services']);
      businesses = await searchBusinessesWithoutWebsites(
        location,
        categoriesToSearch,
        numberOfLeads
      );
    } else {
      // Standard search
      const searchQuery = searchTerms
        ? `${searchTerms} near ${location}`
        : `small business near ${location}`;

      console.log(`[Leads] Searching: "${searchQuery}"...`);

      businesses = await searchGoogleMapsBusinesses(
        searchQuery,
        location,
        { limit: numberOfLeads * 2 } // Get extra to filter by quality
      );
    }

    if (businesses.length === 0) {
      return {
        success: false,
        error: noWebsiteOnly
          ? 'No businesses without websites found in this location. Try a different area or category.'
          : 'No businesses found in this location. Try a different area.',
      };
    }

    console.log(`[Leads] Found ${businesses.length} businesses${noWebsiteOnly ? ' without websites' : ''}, analyzing...`);

    // 3. Enrich leads with website analysis and scoring
    // Always analyze websites - that's the whole point now
    const enrichedLeads: Lead[] = [];
    const batchSize = 5;

    for (let i = 0; i < Math.min(businesses.length, numberOfLeads); i += batchSize) {
      const batch = businesses.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(biz => enrichLeadWithAnalysis(biz, icp, false)) // Skip slow website analysis for speed
      );
      enrichedLeads.push(...batchResults);
    }

    // 4. Sort by score (highest opportunity first)
    const sortedLeads = enrichedLeads.sort((a, b) => b.score - a.score);

    // 5. Save to dedicated leads table
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Insert leads into dedicated table
    const leadsToInsert = sortedLeads.map(lead => ({
      project_id: projectId,
      company_name: lead.companyName,
      industry: lead.industry,
      website: lead.website,
      phone: lead.phone,
      address: lead.address,
      place_id: lead.placeId,
      rating: lead.rating,
      review_count: lead.reviewCount,
      coordinates: lead.coordinates,
      website_analysis: lead.websiteAnalysis,
      score: lead.score,
      score_breakdown: lead.scoreBreakdown,
      pain_points: lead.painPoints,
      icp_score: lead.icpScore,
      icp_match_reasons: lead.icpMatchReasons,
      suggested_angle: lead.suggestedAngle,
      status: lead.status,
      priority: lead.priority,
    }));

    // Get existing leads to avoid duplicates (append, don't replace)
    const { data: existingLeads } = await supabase
      .from('leads')
      .select('company_name, address')
      .eq('project_id', projectId);

    const existingSet = new Set(
      existingLeads?.map(l => `${l.company_name?.toLowerCase()}|${l.address?.toLowerCase() || ''}`) || []
    );

    // Filter out duplicates - only insert truly new leads
    const newLeadsToInsert = leadsToInsert.filter(
      l => !existingSet.has(`${l.company_name?.toLowerCase()}|${l.address?.toLowerCase() || ''}`)
    );

    if (newLeadsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('leads')
        .insert(newLeadsToInsert);

      if (insertError) {
        console.error('[Leads] Failed to insert leads:', insertError);
        // Continue anyway - we'll still show results
      }
    }

    console.log(`[Leads] Added ${newLeadsToInsert.length} new leads (${leadsToInsert.length - newLeadsToInsert.length} duplicates skipped)`);

    // 6. Also save to artifacts for backwards compatibility
    const highPriorityCount = sortedLeads.filter(l => l.score >= 70).length;
    const leadsArtifact: LeadsArtifact = {
      leads: sortedLeads,
      idealCustomerProfile: {
        industries: [...new Set(sortedLeads.map(l => l.industry))].slice(0, 5), // Top industries found
        companySize: 'small-medium',
        painPoints: icp.painPoints,
        budget: 'Varies',
      },
      searchCriteria: searchTerms ? `${searchTerms} in ${location}` : `Businesses in ${location}`,
      searchSummary: {
        totalFound: businesses.length,
        qualified: sortedLeads.filter(l => l.score >= 50).length,
        returned: sortedLeads.length,
        topIndustries: [...new Set(sortedLeads.map(l => l.industry))].slice(0, 5),
        avgScore: sortedLeads.length > 0
          ? parseFloat((sortedLeads.reduce((sum, l) => sum + l.score, 0) / sortedLeads.length).toFixed(1))
          : 0,
      },
      icpInsights: {
        strongestVertical: [...new Set(sortedLeads.map(l => l.industry))][0] || 'Various',
        commonPainPoint: sortedLeads[0]?.painPoints[0] || 'Needs better online presence',
        recommendedFocus: `${highPriorityCount} businesses need immediate website help`,
      },
    };

    const { error: artifactError } = await supabase
      .from('artifacts')
      .upsert(
        {
          project_id: projectId,
          type: 'leads',
          data: leadsArtifact,
          version: 1,
        },
        { onConflict: 'project_id,type' }
      );

    if (artifactError) {
      console.error('[Leads] Failed to save leads artifact:', artifactError);
    } else {
      console.log('[Leads] Successfully saved leads artifact with', sortedLeads.length, 'leads');
    }

    // 7. Format output for chat
    const chatOutput = formatLeadsForChat(sortedLeads, noWebsiteOnly);

    // 8. Generate summary - website quality focused
    const noWebsiteCount = sortedLeads.filter(l => l.websiteAnalysis?.status === 'none' || !l.website).length;
    const brokenOrPoor = sortedLeads.filter(l =>
      l.websiteAnalysis?.status === 'broken' ||
      l.websiteAnalysis?.status === 'poor'
    ).length;
    const outdated = sortedLeads.filter(l => l.websiteAnalysis?.status === 'outdated').length;
    const avgScore = leadsArtifact.searchSummary?.avgScore || 0;

    // Different summary based on search mode
    const summary = noWebsiteOnly
      ? `🎯 Found **${noWebsiteCount} businesses without websites** in ${location}! These are your highest-value prospects. Average opportunity score: ${avgScore}/100.`
      : `Found ${sortedLeads.length} businesses with website opportunities in ${location}. **${noWebsiteCount} have no website**, **${brokenOrPoor} have broken/poor sites**, ${outdated} are outdated. Average opportunity score: ${avgScore}/100.`;

    return {
      success: true,
      leads: sortedLeads,
      chatOutput,
      summary,
      noWebsiteOnly, // Pass through so UI knows the mode
    };
  } catch (error) {
    console.error('[Leads] Generation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
