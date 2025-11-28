// Database Schema Types for Supabase

// ============================================
// ARTIFACT TYPE DEFINITIONS
// ============================================

export type WebsiteArtifact = {
  files: Array<{
    path: string;
    content: string;
    type: 'html' | 'css' | 'js' | 'json';
  }>;
  primaryPage: string; // e.g., '/index.html'
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
};

export type BusinessPlanArtifact = {
  executiveSummary: string;
  revenueModel: string;
  pricingTiers: Array<{
    name: string;
    price: string;
    features: string[];
  }>;
  servicePackages: Array<{
    name: string;
    description: string;
    deliverables: string[];
    price: string;
  }>;
  targetMarket: string;
  valueProposition: string;
};

export type Lead = {
  id: string;
  companyName: string;
  industry: string;
  website?: string;
  contactName?: string;
  contactEmail?: string;
  contactLinkedIn?: string;
  painPoints: string[];
  score: number; // 1-10 fit score
  status: 'new' | 'contacted' | 'responded' | 'converted' | 'rejected';
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

// Activity tracking for leads
export type LeadActivity = {
  id: string;
  leadId: string;
  type: 'email_sent' | 'call_made' | 'note_added' | 'status_changed';
  content?: string; // Note text or email subject
  metadata?: {
    emailSubject?: string;
    emailTo?: string;
    callDuration?: string;
    callOutcome?: string;
    previousStatus?: string;
    newStatus?: string;
  };
  createdAt: string;
};

// Union type for all artifacts
export type ArtifactData =
  | WebsiteArtifact
  | IdentityArtifact
  | ResearchArtifact
  | BusinessPlanArtifact
  | LeadsArtifact
  | OutreachArtifact;

// ============================================
// DATABASE TABLE TYPES
// ============================================

export type Project = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  status: 'active' | 'archived' | 'completed';
  model_id?: string;
  created_at: string;
  updated_at: string;
};

export type ArtifactType =
  | 'website_code'
  | 'identity'
  | 'market_research'
  | 'business_plan'
  | 'leads'
  | 'outreach';

export type Artifact = {
  id: string;
  project_id: string;
  type: ArtifactType;
  data: ArtifactData;
  version: number;
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

export function isBusinessPlanArtifact(data: ArtifactData): data is BusinessPlanArtifact {
  return 'executiveSummary' in data && 'pricingTiers' in data;
}

export function isLeadsArtifact(data: ArtifactData): data is LeadsArtifact {
  return 'leads' in data && 'idealCustomerProfile' in data;
}

export function isOutreachArtifact(data: ArtifactData): data is OutreachArtifact {
  return 'scripts' in data && Array.isArray((data as OutreachArtifact).scripts);
}
