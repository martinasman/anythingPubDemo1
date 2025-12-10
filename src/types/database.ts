// Database Schema Types for Supabase

// ============================================
// ARTIFACT TYPE DEFINITIONS
// ============================================

export type WebsiteArtifact = {
  files: Array<{
    path: string;
    content: string;
    type: 'html' | 'css' | 'js' | 'json' | 'tsx' | 'ts' | 'jsx' | 'sql' | 'env' | 'md';
  }>;
  primaryPage: string; // e.g., '/index.html' or '/app/page.tsx'

  // NEW FIELDS FOR FULL-STACK APPS
  appType?: 'html' | 'nextjs';
  metadata?: {
    patterns?: string[];
    envVars?: {
      required: string[];
      optional: string[];
    };
    setupInstructions?: string;
    dependencies?: string[];
    // Remix metadata (when site was remixed from existing)
    remixedFrom?: string;
    crawledAt?: string;
    originalPageCount?: number;
  };

  // Version info (populated from database artifact record)
  version?: number;
  previous_data?: WebsiteArtifact;
};

export type IdentityArtifact = {
  name: string;
  logoUrl: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  font: string;
  tagline?: string;
};

export type ExtractedCompetitor = {
  name: string;
  url: string;
  description?: string;
  pricing: {
    starterPrice: number | null;
    midPrice: number | null;
    premiumPrice: number | null;
    pricingModel: 'monthly' | 'project' | 'hourly' | 'unknown';
    rawPriceStrings: string[];
  };
  strengths: string[];
  weaknesses: string[];
  marketPosition: 'budget' | 'mid-market' | 'premium' | 'unknown';
};

export type MarketIntelligence = {
  competitors: ExtractedCompetitor[];
  marketAnalysis: {
    saturationLevel: 'high' | 'medium' | 'low';
    priceRange: { min: number; max: number; median: number };
    dominantPricingModel: 'monthly' | 'project' | 'hourly' | 'mixed';
    commonFeatures: string[];
    differentiators: string[];
    gaps: string[];
  };
  customerPainPoints: Array<{
    complaint: string;
    frequency: number;
    severity: 'high' | 'medium' | 'low';
  }>;
  recommendedStrategy: 'undercut' | 'premium' | 'niche';
  strategyRationale: string;
};

export type ResearchArtifact = {
  competitors: Array<{
    name: string;
    price: string;
    url: string;
    description?: string;
  }>;
  marketSummary: string;
  targetAudience?: string;
  keyInsights?: string[];
  sources?: Array<{
    title: string;
    url: string;
  }>;
  nextSteps?: string[];
  // Enhanced research fields
  businessModelInsights?: {
    acquisitionStrategies: string[];
    pricingModels: string[];
    quickWins: string[];
    commonMistakes: string[];
  };
  recommendedFirstOffer?: {
    name: string;
    price: string;
    deliverables: string[];
    whyItWorks: string;
  };
  // NEW: Market intelligence data
  marketIntelligence?: MarketIntelligence;
};

// Website analysis result from websiteAnalyzer service
export type WebsiteAnalysis = {
  status: 'none' | 'broken' | 'poor' | 'outdated' | 'good';
  score: number; // 0-100 contribution to lead score (higher = more opportunity)
  issues: string[];
  lastUpdated?: string;
  technologies?: string[];
  hasSSL: boolean;
  loadTime?: number;
  mobileResponsive?: boolean;
  hasContactForm?: boolean;
  socialLinks?: string[];
};

// Lead note for CRM
export type LeadNote = {
  id: string;
  content: string;
  createdAt: string;
  createdBy?: string;
};

// Enhanced Lead type with full CRM functionality
export type Lead = {
  id: string;
  projectId?: string;
  companyName: string;
  industry: string;

  // Contact Information
  website?: string;
  phone?: string;
  address?: string;
  contactName?: string;
  contactEmail?: string;
  contactLinkedIn?: string;
  contactTitle?: string;

  // Google Maps Data
  placeId?: string;
  rating?: number;
  reviewCount?: number;
  coordinates?: {
    latitude: number;
    longitude: number;
  };

  // Website Analysis
  websiteAnalysis?: WebsiteAnalysis;

  // Scoring (1-100 scale)
  score: number; // Total opportunity score 1-100
  scoreBreakdown: string[]; // Readable breakdown

  // Legacy ICP fields (for backwards compatibility)
  icpScore: number; // 0-10 ICP fit score
  icpMatchReasons: string[];
  buyingSignals?: string[];
  suggestedAngle?: string;
  painPoints: string[];

  // CRM Status & Tracking
  status: 'new' | 'contacted' | 'responded' | 'closed' | 'lost';
  notes?: LeadNote[];
  followUpDate?: string;
  lastContactedAt?: string;
  priority?: 'high' | 'medium' | 'low';
  tags?: string[];

  // Deal Value Tracking
  dealValue?: number;
  dealCurrency?: string; // Default 'USD'

  // Website Generation Status
  websiteStatus?: 'none' | 'generating' | 'ready' | 'sent' | 'viewed' | 'approved';

  // Stripe Payment Integration
  stripeCustomerId?: string;
  stripePaymentLinkId?: string;
  stripePaymentLinkUrl?: string;
  stripePaymentStatus?: 'pending' | 'paid' | 'failed' | 'refunded';
  paidAt?: string;
  paidAmount?: number;

  // Generated Content References
  previewToken?: string;
  previewUrl?: string;
  outreachGenerated?: boolean;
  outreachData?: {
    emailSubject: string;
    emailBody: string;
    followUp1: string;
    followUp2: string;
    callScript?: string;
  };

  // Timestamps
  createdAt?: string;
  updatedAt?: string;
};

export type LeadsArtifact = {
  leads: Lead[];
  activities?: LeadActivity[]; // Activity log for all leads
  idealCustomerProfile: {
    industries: string[];
    companySize: string;
    painPoints: string[];
    budget: string;
  };
  searchCriteria: string;

  // ICP-based search insights
  searchSummary?: {
    totalFound: number;
    qualified: number;
    returned: number;
    topIndustries: string[];
    avgScore: number;
  };

  icpInsights?: {
    strongestVertical: string;
    commonPainPoint: string;
    recommendedFocus: string;
  };
};

export type OutreachScript = {
  leadId: string;
  leadName: string;
  callScript: {
    opener: string;
    valueProposition: string;
    questions: string[];
    objectionHandlers: Record<string, string>;
    closeAttempt: string;
  };
  emailScript: {
    subject: string;
    body: string;
    followUp1: string;
    followUp2: string;
  };
};

export type OutreachArtifact = {
  scripts: OutreachScript[];
};

export type FirstWeekPlanArtifact = {
  strategy: string;
  quickestPath: string;
  fallbackPlan: string;
  days: Array<{
    day: number;
    theme: string;
    tasks: Array<{
      task: string;
      duration: string;
      priority: 'critical' | 'high' | 'medium';
      details: string;
      script?: string;
    }>;
    goal: string;
    metrics: string[];
  }>;
  expectedMetrics: {
    totalOutreach: number;
    expectedResponses: string;
    expectedCalls: string;
    expectedCloses: string;
    expectedRevenue: string;
  };
  criticalSuccessFactors: string[];
  taskCompletion?: Record<string, boolean>; // { "1-0": true, "2-3": false, ... }

  // NEW: Enhanced fields for revenue projections
  quickWinPackage?: {
    name: string;
    price: number;
    deliverables: string[];
    deliveryTime: string;
    targetConversionRate: string;
    estimatedTimeToClose: string;
  };

  firstClientStrategy?: {
    primaryChannel: string;
    specificOffer: string;
    urgencyElement: string;
    targetOutreachVolume: number;
    expectedResponseRate: string;
  };

  revenueProjections?: {
    week1: { optimistic: number; realistic: number; conservative: number };
    week2: { optimistic: number; realistic: number; conservative: number };
    week4: { optimistic: number; realistic: number; conservative: number };
    assumptions: string[];
  };
};

// Long-term plan (6-12 months)
export type LongTermPlanArtifact = {
  monthlyMilestones: Array<{
    month: number;
    theme: string;
    revenueTarget: number;
    clientTarget: number;
    keyActivities: string[];
    hires: string[];
    investments: string[];
  }>;

  scalingStrategy: {
    phase1: { months: string; focus: string; revenue: string };
    phase2: { months: string; focus: string; revenue: string };
    phase3: { months: string; focus: string; revenue: string };
  };

  teamBuildingTimeline: Array<{
    month: number;
    role: string;
    reason: string;
    estimatedCost: number;
  }>;

  yearOneProjection: {
    totalRevenue: number;
    totalClients: number;
    averageClientValue: number;
    profitMargin: string;
    keyRisks: string[];
  };
};

// Lead website artifact (for preview generation)
export type LeadWebsiteArtifact = {
  leadId: string;
  leadName: string;
  previewToken: string;
  files: Array<{
    path: string;
    content: string;
    type: 'html' | 'css' | 'js' | 'json';
  }>;
  expiresAt: string;
  designStyle?: string; // Track selected style for anti-repetition
  sourceUrl?: string; // Track if improved from existing site
};

// Lead websites artifact (container for multiple websites per project)
export type LeadWebsitesArtifact = {
  websites: LeadWebsiteArtifact[];
};

// Crawled site data artifact (for website remix feature)
export type CrawledSiteArtifact = {
  sourceUrl: string;
  crawledAt: string;
  site: {
    domain: string;
    pages: Array<{
      url: string;
      path: string;
      title: string;
      content: {
        headings: Array<{ level: number; text: string }>;
        paragraphs: string[];
      };
      forms: Array<{
        formType: string;
        fields: Array<{
          type: string;
          name: string;
          label?: string;
          required: boolean;
        }>;
        submitText: string;
      }>;
      images: Array<{
        src: string;
        alt?: string;
        isLogo: boolean;
        isHero: boolean;
      }>;
    }>;
    brand: {
      logo?: string;
      companyName?: string;
      colors: {
        primary?: string;
        secondary?: string;
        accent?: string;
      };
    };
    navigation: Array<{
      label: string;
      path: string;
    }>;
    globalElements: {
      socialLinks: Array<{ platform: string; url: string }>;
      contactInfo: {
        phone?: string;
        email?: string;
        address?: string;
      };
    };
    stats: {
      totalPages: number;
      totalImages: number;
      totalForms: number;
    };
  };
  status: 'completed' | 'failed';
  error?: string;
};

// Activity tracking for leads
export type LeadActivity = {
  id: string;
  leadId: string;
  type: 'email_sent' | 'call_made' | 'note_added' | 'status_changed' | 'email_generated' | 'website_generated' | 'outreach_sent' | 'follow_up_set';
  content?: string; // Note text or email subject
  metadata?: {
    emailSubject?: string;
    emailTo?: string;
    callDuration?: string;
    callOutcome?: string;
    previousStatus?: string;
    newStatus?: string;
    followUpDate?: string;
    websitePreviewUrl?: string;
    previewToken?: string;
    previewUrl?: string;
  };
  createdAt: string;
};

// Union type for all artifacts
export type ArtifactData =
  | WebsiteArtifact
  | IdentityArtifact
  | ResearchArtifact
  | LeadsArtifact
  | OutreachArtifact
  | FirstWeekPlanArtifact
  | LongTermPlanArtifact
  | LeadWebsitesArtifact
  | CRMArtifact
  | CrawledSiteArtifact;

// ============================================
// DATABASE TABLE TYPES
// ============================================

export type BusinessModeId = 'agency' | 'commerce' | 'playground';

export type AgencyModeData = {
  agencyType: 'web-design' | 'smma' | 'ai-automation' | 'consulting' | 'custom';
  description: string;
  targetMarket: string;
};

export type CommerceModeData = {
  entryPoint: 'product-url' | 'discover' | 'manual';
  productUrl?: string;
  productDescription?: string;
  niche?: string;
};

export type ModeData = AgencyModeData | CommerceModeData | Record<string, unknown>;

export type Project = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  status: 'active' | 'archived' | 'completed';
  model_id?: string;
  mode?: BusinessModeId;
  mode_data?: ModeData;
  created_at: string;
  updated_at: string;
};

export type ArtifactType =
  | 'website_code'
  | 'identity'
  | 'market_research'
  | 'leads'
  | 'outreach'
  | 'first_week_plan'
  | 'long_term_plan'
  | 'lead_website'
  | 'crm'
  | 'contracts'
  | 'client_work'
  | 'administration'
  | 'crawled_site';

export type Artifact = {
  id: string;
  project_id: string;
  type: ArtifactType;
  data: ArtifactData;
  version: number;
  previous_data?: ArtifactData;
  created_at: string;
  updated_at: string;
};

export type Message = {
  id: string;
  project_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: Record<string, unknown>;
  created_at: string;
};

// ============================================
// DATABASE INTERFACE
// ============================================

// Database row type for leads table
export type LeadRow = {
  id: string;
  project_id: string;
  company_name: string;
  industry: string | null;
  website: string | null;
  phone: string | null;
  address: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_linkedin: string | null;
  contact_title: string | null;
  place_id: string | null;
  rating: number | null;
  review_count: number | null;
  coordinates: { latitude: number; longitude: number } | null;
  website_analysis: WebsiteAnalysis | null;
  score: number | null;
  score_breakdown: string[] | null;
  pain_points: string[] | null;
  icp_score: number | null;
  icp_match_reasons: string[] | null;
  buying_signals: string[] | null;
  suggested_angle: string | null;
  status: 'new' | 'contacted' | 'responded' | 'closed' | 'lost';
  notes: LeadNote[] | null;
  follow_up_date: string | null;
  last_contacted_at: string | null;
  priority: 'high' | 'medium' | 'low';
  tags: string[] | null;
  preview_token: string | null;
  outreach_generated: boolean;
  outreach_data: Lead['outreachData'] | null;
  // Deal Value Tracking
  deal_value: number | null;
  deal_currency: string | null;
  // Website Generation Status
  website_status: 'none' | 'generating' | 'ready' | 'sent' | 'viewed' | 'approved' | null;
  // Stripe Payment Integration
  stripe_customer_id: string | null;
  stripe_payment_link_id: string | null;
  stripe_payment_link_url: string | null;
  stripe_payment_status: 'pending' | 'paid' | 'failed' | 'refunded' | null;
  paid_at: string | null;
  paid_amount: number | null;
  created_at: string;
  updated_at: string;
};

// Database row type for lead_websites table
export type LeadWebsiteRow = {
  id: string;
  project_id: string;
  lead_id: string;
  preview_token: string;
  data: LeadWebsiteArtifact;
  created_at: string;
  expires_at: string;
};

// Database row type for lead_activities table
export type LeadActivityRow = {
  id: string;
  lead_id: string;
  type: LeadActivity['type'];
  content: string | null;
  metadata: LeadActivity['metadata'] | null;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      projects: {
        Row: Project;
        Insert: Omit<Project, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Project, 'id' | 'created_at' | 'updated_at'>>;
      };
      artifacts: {
        Row: Artifact;
        Insert: Omit<Artifact, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Artifact, 'id' | 'created_at' | 'updated_at'>>;
      };
      messages: {
        Row: Message;
        Insert: Omit<Message, 'id' | 'created_at'>;
        Update: Partial<Omit<Message, 'id' | 'created_at'>>;
      };
      leads: {
        Row: LeadRow;
        Insert: Omit<LeadRow, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<LeadRow, 'id' | 'created_at' | 'updated_at'>>;
      };
      lead_websites: {
        Row: LeadWebsiteRow;
        Insert: Omit<LeadWebsiteRow, 'id' | 'created_at'>;
        Update: Partial<Omit<LeadWebsiteRow, 'id' | 'created_at'>>;
      };
      lead_activities: {
        Row: LeadActivityRow;
        Insert: Omit<LeadActivityRow, 'id' | 'created_at'>;
        Update: Partial<Omit<LeadActivityRow, 'id' | 'created_at'>>;
      };
    };
  };
};

// ============================================
// HELPER TYPE GUARDS
// ============================================

export function isWebsiteArtifact(data: ArtifactData): data is WebsiteArtifact {
  return 'files' in data && 'primaryPage' in data;
}

export function isIdentityArtifact(data: ArtifactData): data is IdentityArtifact {
  return 'logoUrl' in data && 'colors' in data && 'font' in data;
}

export function isResearchArtifact(data: ArtifactData): data is ResearchArtifact {
  return 'competitors' in data && 'marketSummary' in data;
}

export function isLeadsArtifact(data: ArtifactData): data is LeadsArtifact {
  return 'leads' in data && 'idealCustomerProfile' in data;
}

export function isOutreachArtifact(data: ArtifactData): data is OutreachArtifact {
  return 'scripts' in data && Array.isArray((data as OutreachArtifact).scripts);
}

export function isFirstWeekPlanArtifact(data: ArtifactData): data is FirstWeekPlanArtifact {
  return 'strategy' in data && 'days' in data && 'expectedMetrics' in data;
}

export function isLongTermPlanArtifact(data: ArtifactData): data is LongTermPlanArtifact {
  return 'monthlyMilestones' in data && 'scalingStrategy' in data && 'yearOneProjection' in data;
}

export function isLeadWebsitesArtifact(data: ArtifactData): data is LeadWebsitesArtifact {
  return 'websites' in data && Array.isArray((data as LeadWebsitesArtifact).websites);
}

export function isCrawledSiteArtifact(data: ArtifactData): data is CrawledSiteArtifact {
  return 'site' in data && 'sourceUrl' in data && 'crawledAt' in data;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Convert database row to Lead type
export function leadRowToLead(row: LeadRow): Lead {
  return {
    id: row.id,
    projectId: row.project_id,
    companyName: row.company_name,
    industry: row.industry || '',
    website: row.website || undefined,
    phone: row.phone || undefined,
    address: row.address || undefined,
    contactName: row.contact_name || undefined,
    contactEmail: row.contact_email || undefined,
    contactLinkedIn: row.contact_linkedin || undefined,
    contactTitle: row.contact_title || undefined,
    placeId: row.place_id || undefined,
    rating: row.rating || undefined,
    reviewCount: row.review_count || undefined,
    coordinates: row.coordinates || undefined,
    websiteAnalysis: row.website_analysis || undefined,
    score: row.score || 0,
    scoreBreakdown: row.score_breakdown || [],
    icpScore: row.icp_score || 0,
    icpMatchReasons: row.icp_match_reasons || [],
    buyingSignals: row.buying_signals || undefined,
    suggestedAngle: row.suggested_angle || undefined,
    painPoints: row.pain_points || [],
    status: row.status,
    notes: row.notes || undefined,
    followUpDate: row.follow_up_date || undefined,
    lastContactedAt: row.last_contacted_at || undefined,
    priority: row.priority,
    tags: row.tags || undefined,
    previewToken: row.preview_token || undefined,
    outreachGenerated: row.outreach_generated,
    outreachData: row.outreach_data || undefined,
    // Deal Value Tracking
    dealValue: row.deal_value || undefined,
    dealCurrency: row.deal_currency || undefined,
    // Website Generation Status
    websiteStatus: row.website_status || undefined,
    // Stripe Payment Integration
    stripeCustomerId: row.stripe_customer_id || undefined,
    stripePaymentLinkId: row.stripe_payment_link_id || undefined,
    stripePaymentLinkUrl: row.stripe_payment_link_url || undefined,
    stripePaymentStatus: row.stripe_payment_status || undefined,
    paidAt: row.paid_at || undefined,
    paidAmount: row.paid_amount || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Convert Lead type to database row format
export function leadToLeadRow(lead: Lead, projectId: string): Omit<LeadRow, 'id' | 'created_at' | 'updated_at'> {
  return {
    project_id: projectId,
    company_name: lead.companyName,
    industry: lead.industry || null,
    website: lead.website || null,
    phone: lead.phone || null,
    address: lead.address || null,
    contact_name: lead.contactName || null,
    contact_email: lead.contactEmail || null,
    contact_linkedin: lead.contactLinkedIn || null,
    contact_title: lead.contactTitle || null,
    place_id: lead.placeId || null,
    rating: lead.rating || null,
    review_count: lead.reviewCount || null,
    coordinates: lead.coordinates || null,
    website_analysis: lead.websiteAnalysis || null,
    score: lead.score || null,
    score_breakdown: lead.scoreBreakdown || null,
    pain_points: lead.painPoints || null,
    icp_score: lead.icpScore || null,
    icp_match_reasons: lead.icpMatchReasons || null,
    buying_signals: lead.buyingSignals || null,
    suggested_angle: lead.suggestedAngle || null,
    status: lead.status,
    notes: lead.notes || null,
    follow_up_date: lead.followUpDate || null,
    last_contacted_at: lead.lastContactedAt || null,
    priority: lead.priority || 'medium',
    tags: lead.tags || null,
    preview_token: lead.previewToken || null,
    outreach_generated: lead.outreachGenerated || false,
    outreach_data: lead.outreachData || null,
    // Deal Value Tracking
    deal_value: lead.dealValue || null,
    deal_currency: lead.dealCurrency || null,
    // Website Generation Status
    website_status: lead.websiteStatus || null,
    // Stripe Payment Integration
    stripe_customer_id: lead.stripeCustomerId || null,
    stripe_payment_link_id: lead.stripePaymentLinkId || null,
    stripe_payment_link_url: lead.stripePaymentLinkUrl || null,
    stripe_payment_status: lead.stripePaymentStatus || null,
    paid_at: lead.paidAt || null,
    paid_amount: lead.paidAmount || null,
  };
}

// ============================================
// CRM TYPES (BUSINESS OS - CLIENT NODE)
// ============================================

export type ClientRow = {
  id: string;
  project_id: string;
  company_name: string;
  industry: string | null;
  primary_contact_name: string | null;
  primary_contact_email: string | null;
  primary_contact_phone: string | null;
  primary_contact_title: string | null;
  billing_address: string | null;
  shipping_address: string | null;
  website: string | null;
  tax_id: string | null;
  payment_terms: number;
  currency: string;
  status: 'prospect' | 'active' | 'onboarding' | 'paused' | 'churned' | 'archived';
  lifetime_value: number;
  total_invoiced: number;
  total_paid: number;
  outstanding_balance: number;
  source: string | null;
  lead_id: string | null;
  acquisition_date: string | null;
  first_project_date: string | null;
  last_invoice_date: string | null;
  notes: string | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
};

export type Client = {
  id: string;
  projectId: string;
  companyName: string;
  industry?: string;
  primaryContact: {
    name?: string;
    email?: string;
    phone?: string;
    title?: string;
  };
  billingAddress?: string;
  shippingAddress?: string;
  website?: string;
  taxId?: string;
  paymentTerms: number;
  currency: string;
  status: 'prospect' | 'active' | 'onboarding' | 'paused' | 'churned' | 'archived';
  financialMetrics: {
    lifetimeValue: number;
    totalInvoiced: number;
    totalPaid: number;
    outstandingBalance: number;
  };
  source?: string;
  convertedFromLeadId?: string;
  acquisitionDate?: string;
  firstProjectDate?: string;
  lastInvoiceDate?: string;
  notes?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
};

export type ClientActivity = {
  id: string;
  projectId: string;
  clientId: string;
  type: 'note_added' | 'status_changed' | 'email_sent' | 'call_made' | 'meeting_held' | 'contract_signed' | 'invoice_sent' | 'payment_received' | 'project_started' | 'deliverable_sent' | 'feedback_received';
  content?: string;
  metadata?: Record<string, any>;
  relatedContractId?: string;
  relatedInvoiceId?: string;
  relatedProjectId?: string;
  userName?: string;
  createdAt: string;
};

export type CRMArtifact = {
  clients: Array<{
    id: string;
    companyName: string;
    industry?: string;
    status: 'prospect' | 'active' | 'onboarding' | 'paused' | 'churned' | 'archived';
    primaryContact: {
      name?: string;
      email?: string;
      phone?: string;
      title?: string;
    };
    financialMetrics: {
      lifetimeValue: number;
      totalInvoiced: number;
      totalPaid: number;
      outstandingBalance: number;
    };
    activeProjects: number;
    lastActivityDate?: string;
    tags: string[];
  }>;
  metrics: {
    totalClients: number;
    activeClients: number;
    pipelineValue: number;
  };
  recentActivities: ClientActivity[];
};

// Convert ClientRow to Client type
export function clientRowToClient(row: ClientRow): Client {
  return {
    id: row.id,
    projectId: row.project_id,
    companyName: row.company_name,
    industry: row.industry || undefined,
    primaryContact: {
      name: row.primary_contact_name || undefined,
      email: row.primary_contact_email || undefined,
      phone: row.primary_contact_phone || undefined,
      title: row.primary_contact_title || undefined,
    },
    billingAddress: row.billing_address || undefined,
    shippingAddress: row.shipping_address || undefined,
    website: row.website || undefined,
    taxId: row.tax_id || undefined,
    paymentTerms: row.payment_terms,
    currency: row.currency,
    status: row.status,
    financialMetrics: {
      lifetimeValue: row.lifetime_value,
      totalInvoiced: row.total_invoiced,
      totalPaid: row.total_paid,
      outstandingBalance: row.outstanding_balance,
    },
    source: row.source || undefined,
    convertedFromLeadId: row.lead_id || undefined,
    acquisitionDate: row.acquisition_date || undefined,
    firstProjectDate: row.first_project_date || undefined,
    lastInvoiceDate: row.last_invoice_date || undefined,
    notes: row.notes || undefined,
    tags: row.tags || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by || undefined,
  };
}

// Convert Client type to database row format
export function clientToClientRow(client: Client, projectId: string): Omit<ClientRow, 'id' | 'created_at' | 'updated_at'> {
  return {
    project_id: projectId,
    company_name: client.companyName,
    industry: client.industry || null,
    primary_contact_name: client.primaryContact.name || null,
    primary_contact_email: client.primaryContact.email || null,
    primary_contact_phone: client.primaryContact.phone || null,
    primary_contact_title: client.primaryContact.title || null,
    billing_address: client.billingAddress || null,
    shipping_address: client.shippingAddress || null,
    website: client.website || null,
    tax_id: client.taxId || null,
    payment_terms: client.paymentTerms,
    currency: client.currency,
    status: client.status,
    lifetime_value: client.financialMetrics.lifetimeValue,
    total_invoiced: client.financialMetrics.totalInvoiced,
    total_paid: client.financialMetrics.totalPaid,
    outstanding_balance: client.financialMetrics.outstandingBalance,
    source: client.source || null,
    lead_id: client.convertedFromLeadId || null,
    acquisition_date: client.acquisitionDate || null,
    first_project_date: client.firstProjectDate || null,
    last_invoice_date: client.lastInvoiceDate || null,
    notes: client.notes || null,
    tags: client.tags || null,
    created_by: client.createdBy || null,
  };
}

// ============================================
// PUBLISHED WEBSITES TYPES
// ============================================

export type PublishedWebsiteRow = {
  id: string;
  project_id: string;
  deployment_id: string | null;
  deployment_url: string;
  subdomain: string;
  base_domain: string;
  custom_domain: string | null;
  source_type: 'project' | 'lead';
  source_artifact_id: string | null;
  lead_id: string | null;
  access_level: 'public' | 'password' | 'private';
  password_hash: string | null;
  status: 'deploying' | 'published' | 'failed' | 'archived';
  last_deployed_at: string | null;
  view_count: number;
  created_at: string;
  updated_at: string;
};

export type PublishedWebsite = {
  id: string;
  projectId: string;
  deploymentId?: string;
  deploymentUrl: string;
  subdomain: string;
  baseDomain: string;
  customDomain?: string;
  sourceType: 'project' | 'lead';
  sourceArtifactId?: string;
  leadId?: string;
  accessLevel: 'public' | 'password' | 'private';
  status: 'deploying' | 'published' | 'failed' | 'archived';
  lastDeployedAt?: string;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
};

// Convert PublishedWebsiteRow to PublishedWebsite type
export function publishedWebsiteRowToPublishedWebsite(row: PublishedWebsiteRow): PublishedWebsite {
  return {
    id: row.id,
    projectId: row.project_id,
    deploymentId: row.deployment_id || undefined,
    deploymentUrl: row.deployment_url,
    subdomain: row.subdomain,
    baseDomain: row.base_domain,
    customDomain: row.custom_domain || undefined,
    sourceType: row.source_type,
    sourceArtifactId: row.source_artifact_id || undefined,
    leadId: row.lead_id || undefined,
    accessLevel: row.access_level,
    status: row.status,
    lastDeployedAt: row.last_deployed_at || undefined,
    viewCount: row.view_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Convert PublishedWebsite type to database row format
export function publishedWebsiteToRow(
  website: Omit<PublishedWebsite, 'id' | 'createdAt' | 'updatedAt'>
): Omit<PublishedWebsiteRow, 'id' | 'created_at' | 'updated_at'> {
  return {
    project_id: website.projectId,
    deployment_id: website.deploymentId || null,
    deployment_url: website.deploymentUrl,
    subdomain: website.subdomain,
    base_domain: website.baseDomain,
    custom_domain: website.customDomain || null,
    source_type: website.sourceType,
    source_artifact_id: website.sourceArtifactId || null,
    lead_id: website.leadId || null,
    access_level: website.accessLevel,
    password_hash: null,
    status: website.status,
    last_deployed_at: website.lastDeployedAt || null,
    view_count: website.viewCount,
  };
}

// ============================================
// CREDIT SYSTEM TYPES
// ============================================

export type UserProfileRow = {
  id: string;
  user_id: string;
  credits: number;
  lifetime_credits_purchased: number;
  stripe_customer_id: string | null;
  created_at: string;
  updated_at: string;
};

export type CreditTransactionRow = {
  id: string;
  user_id: string;
  amount: number;
  balance_after: number;
  type: 'purchase' | 'deduction' | 'refund' | 'bonus' | 'free_tier';
  description: string;
  metadata: {
    stripe_session_id?: string;
    stripe_payment_intent?: string;
    project_id?: string;
    artifact_type?: string;
    tool_name?: string;
    credit_package?: string;
  } | null;
  created_at: string;
};

export type UserProfile = {
  id: string;
  userId: string;
  credits: number;
  lifetimeCreditsPurchased: number;
  stripeCustomerId?: string;
  createdAt: string;
  updatedAt: string;
};

export type CreditTransaction = {
  id: string;
  userId: string;
  amount: number;
  balanceAfter: number;
  type: 'purchase' | 'deduction' | 'refund' | 'bonus' | 'free_tier';
  description: string;
  metadata?: CreditTransactionRow['metadata'];
  createdAt: string;
};

// Convert UserProfileRow to UserProfile type
export function userProfileRowToUserProfile(row: UserProfileRow): UserProfile {
  return {
    id: row.id,
    userId: row.user_id,
    credits: row.credits,
    lifetimeCreditsPurchased: row.lifetime_credits_purchased,
    stripeCustomerId: row.stripe_customer_id || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Convert CreditTransactionRow to CreditTransaction type
export function creditTransactionRowToCreditTransaction(row: CreditTransactionRow): CreditTransaction {
  return {
    id: row.id,
    userId: row.user_id,
    amount: row.amount,
    balanceAfter: row.balance_after,
    type: row.type,
    description: row.description,
    metadata: row.metadata || undefined,
    createdAt: row.created_at,
  };
}
