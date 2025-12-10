-- ============================================
-- ANYTHING V10 - COMPLETE SUPABASE SCHEMA
-- ============================================
-- This schema supports the full Anything application
-- including projects, messages, artifacts, and model selection
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROJECTS TABLE
-- ============================================
-- Stores user projects with selected AI model
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL DEFAULT 'anonymous',
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'completed')),
  model_id TEXT DEFAULT 'google/gemini-3-pro-preview',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);

-- ============================================
-- MESSAGES TABLE
-- ============================================
-- Stores chat messages for each project
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_messages_project_id ON messages(project_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- ============================================
-- ARTIFACTS TABLE
-- ============================================
-- Stores generated artifacts (research, identity, website code, business plan, leads, outreach, crm, etc.)
CREATE TABLE IF NOT EXISTS artifacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('website_code', 'identity', 'ads', 'market_research', 'business_plan', 'leads', 'outreach', 'first_week_plan', 'long_term_plan', 'lead_website', 'crm', 'contracts', 'client_work', 'administration')),
  data JSONB NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, type)
);

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_artifacts_project_id ON artifacts(project_id);
CREATE INDEX IF NOT EXISTS idx_artifacts_type ON artifacts(type);

-- ============================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================
-- Automatically updates the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- APPLY TRIGGERS
-- ============================================
-- Trigger for projects table
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for artifacts table
DROP TRIGGER IF EXISTS update_artifacts_updated_at ON artifacts;
CREATE TRIGGER update_artifacts_updated_at
  BEFORE UPDATE ON artifacts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================
-- Enable RLS on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE artifacts ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES - PUBLIC ACCESS (FOR NOW)
-- ============================================
-- Note: These policies allow public access for development
-- Update these when you implement authentication

-- Projects policies
DROP POLICY IF EXISTS "Allow public read access to projects" ON projects;
CREATE POLICY "Allow public read access to projects"
  ON projects FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow public insert access to projects" ON projects;
CREATE POLICY "Allow public insert access to projects"
  ON projects FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update access to projects" ON projects;
CREATE POLICY "Allow public update access to projects"
  ON projects FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "Allow public delete access to projects" ON projects;
CREATE POLICY "Allow public delete access to projects"
  ON projects FOR DELETE
  USING (true);

-- Messages policies
DROP POLICY IF EXISTS "Allow public read access to messages" ON messages;
CREATE POLICY "Allow public read access to messages"
  ON messages FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow public insert access to messages" ON messages;
CREATE POLICY "Allow public insert access to messages"
  ON messages FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update access to messages" ON messages;
CREATE POLICY "Allow public update access to messages"
  ON messages FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "Allow public delete access to messages" ON messages;
CREATE POLICY "Allow public delete access to messages"
  ON messages FOR DELETE
  USING (true);

-- Artifacts policies
DROP POLICY IF EXISTS "Allow public read access to artifacts" ON artifacts;
CREATE POLICY "Allow public read access to artifacts"
  ON artifacts FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow public insert access to artifacts" ON artifacts;
CREATE POLICY "Allow public insert access to artifacts"
  ON artifacts FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update access to artifacts" ON artifacts;
CREATE POLICY "Allow public update access to artifacts"
  ON artifacts FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "Allow public delete access to artifacts" ON artifacts;
CREATE POLICY "Allow public delete access to artifacts"
  ON artifacts FOR DELETE
  USING (true);

-- ============================================
-- ENABLE REALTIME
-- ============================================
-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE artifacts;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these to verify your schema is set up correctly:

-- Check tables exist
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- Check projects table structure
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'projects' ORDER BY ordinal_position;

-- Check if RLS is enabled
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

-- ============================================
-- SAMPLE DATA (OPTIONAL - FOR TESTING)
-- ============================================
-- Uncomment to insert test data

-- INSERT INTO projects (name, description, status, model_id, user_id) VALUES
--   ('Coffee Shop Website', 'A modern coffee shop in downtown Seattle', 'active', 'google/gemini-3-pro-preview', 'test-user');

-- Get the project ID for testing
-- SELECT id FROM projects WHERE name = 'Coffee Shop Website';

-- ============================================
-- LEADS TABLE (CRM)
-- ============================================
-- Stores individual leads with full CRM functionality
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- Basic Info
  company_name TEXT NOT NULL,
  industry TEXT,

  -- Contact Information
  website TEXT,
  phone TEXT,
  address TEXT,
  contact_name TEXT,
  contact_email TEXT,
  contact_linkedin TEXT,
  contact_title TEXT,

  -- Google Maps Data
  place_id TEXT,
  rating DECIMAL(2,1),
  review_count INTEGER,
  coordinates JSONB,

  -- Website Analysis
  website_analysis JSONB,

  -- Scoring (1-100)
  score INTEGER CHECK (score >= 0 AND score <= 100),
  score_breakdown TEXT[],
  pain_points TEXT[],

  -- Legacy ICP fields (for backwards compatibility)
  icp_score INTEGER DEFAULT 0,
  icp_match_reasons TEXT[],
  buying_signals TEXT[],
  suggested_angle TEXT,

  -- CRM Fields
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'responded', 'closed', 'lost')),
  notes JSONB DEFAULT '[]',
  follow_up_date TIMESTAMPTZ,
  last_contacted_at TIMESTAMPTZ,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  tags TEXT[],

  -- Generated Content References
  preview_token TEXT,
  outreach_generated BOOLEAN DEFAULT FALSE,
  outreach_data JSONB,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_leads_project ON leads(project_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_score ON leads(score DESC);
CREATE INDEX IF NOT EXISTS idx_leads_follow_up ON leads(follow_up_date) WHERE follow_up_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_priority ON leads(priority);

-- Trigger for leads table
DROP TRIGGER IF EXISTS update_leads_updated_at ON leads;
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- LEAD WEBSITES - STORED IN ARTIFACTS TABLE
-- ============================================
-- Lead websites are now stored in the artifacts table with type='lead_website'
-- This follows the existing architecture pattern and eliminates foreign key constraints
-- GIN index for efficient JSONB queries on preview tokens
CREATE INDEX IF NOT EXISTS idx_artifacts_lead_websites_jsonb
ON artifacts USING GIN (data)
WHERE type = 'lead_website';

-- ============================================
-- LEAD ACTIVITIES TABLE
-- ============================================
-- Tracks all activities for leads (notes, status changes, emails, etc.)
CREATE TABLE IF NOT EXISTS lead_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('note_added', 'status_changed', 'email_generated', 'website_generated', 'outreach_sent', 'call_made', 'follow_up_set')),
  content TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_activities_lead ON lead_activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_activities_type ON lead_activities(type);
CREATE INDEX IF NOT EXISTS idx_activities_created ON lead_activities(created_at DESC);

-- ============================================
-- RLS POLICIES FOR NEW TABLES
-- ============================================

-- Enable RLS on new tables
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_activities ENABLE ROW LEVEL SECURITY;

-- Leads policies
DROP POLICY IF EXISTS "Allow public read access to leads" ON leads;
CREATE POLICY "Allow public read access to leads"
  ON leads FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow public insert access to leads" ON leads;
CREATE POLICY "Allow public insert access to leads"
  ON leads FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update access to leads" ON leads;
CREATE POLICY "Allow public update access to leads"
  ON leads FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "Allow public delete access to leads" ON leads;
CREATE POLICY "Allow public delete access to leads"
  ON leads FOR DELETE
  USING (true);

-- Lead activities policies
DROP POLICY IF EXISTS "Allow public read access to lead_activities" ON lead_activities;
CREATE POLICY "Allow public read access to lead_activities"
  ON lead_activities FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow public insert access to lead_activities" ON lead_activities;
CREATE POLICY "Allow public insert access to lead_activities"
  ON lead_activities FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public delete access to lead_activities" ON lead_activities;
CREATE POLICY "Allow public delete access to lead_activities"
  ON lead_activities FOR DELETE
  USING (true);

-- ============================================
-- ENABLE REALTIME FOR NEW TABLES
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE leads;
ALTER PUBLICATION supabase_realtime ADD TABLE lead_activities;

-- ============================================
-- CLEANUP FUNCTION FOR EXPIRED LEAD WEBSITES
-- ============================================
-- Run this periodically via cron or Supabase Edge Function
-- DELETE FROM lead_websites WHERE expires_at < NOW();

-- ============================================
-- CLIENTS TABLE (BUSINESS OS - CRM NODE)
-- ============================================
-- Stores client relationships converted from leads or added manually
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- Basic Information
  company_name TEXT NOT NULL,
  industry TEXT,

  -- Contact Information
  primary_contact_name TEXT,
  primary_contact_email TEXT,
  primary_contact_phone TEXT,
  primary_contact_title TEXT,

  -- Address
  billing_address TEXT,
  shipping_address TEXT,

  -- Business Details
  website TEXT,
  tax_id TEXT,
  payment_terms INTEGER DEFAULT 30,
  currency TEXT DEFAULT 'USD',

  -- Relationship Status
  status TEXT DEFAULT 'prospect' CHECK (status IN (
    'prospect',
    'active',
    'onboarding',
    'paused',
    'churned',
    'archived'
  )),

  -- Financial Metrics (cached for performance)
  lifetime_value DECIMAL(10,2) DEFAULT 0,
  total_invoiced DECIMAL(10,2) DEFAULT 0,
  total_paid DECIMAL(10,2) DEFAULT 0,
  outstanding_balance DECIMAL(10,2) DEFAULT 0,

  -- Relationship Tracking
  source TEXT,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  acquisition_date TIMESTAMPTZ,
  first_project_date TIMESTAMPTZ,
  last_invoice_date TIMESTAMPTZ,

  -- Notes & Tags
  notes TEXT,
  tags TEXT[],

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT,

  CONSTRAINT unique_client_per_project UNIQUE(project_id, company_name)
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_clients_project ON clients(project_id);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_lead_id ON clients(lead_id) WHERE lead_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_clients_acquisition_date ON clients(acquisition_date DESC);
CREATE INDEX IF NOT EXISTS idx_clients_lifetime_value ON clients(lifetime_value DESC);

-- Trigger for clients table
DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- CLIENT ACTIVITIES TABLE (CRM AUDIT TRAIL)
-- ============================================
-- Tracks all activities for clients (notes, status changes, emails, contracts, etc.)
CREATE TABLE IF NOT EXISTS client_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,

  -- Activity Details
  type TEXT NOT NULL CHECK (type IN (
    'note_added',
    'status_changed',
    'email_sent',
    'call_made',
    'meeting_held',
    'contract_signed',
    'invoice_sent',
    'payment_received',
    'project_started',
    'deliverable_sent',
    'feedback_received'
  )),
  content TEXT,

  -- Metadata
  metadata JSONB,

  -- Related Entities
  related_contract_id UUID,
  related_invoice_id UUID,
  related_project_id UUID,

  -- User
  user_name TEXT,

  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_client_activities_project ON client_activities(project_id);
CREATE INDEX IF NOT EXISTS idx_client_activities_client ON client_activities(client_id);
CREATE INDEX IF NOT EXISTS idx_client_activities_type ON client_activities(type);
CREATE INDEX IF NOT EXISTS idx_client_activities_created ON client_activities(created_at DESC);

-- ============================================
-- RLS POLICIES FOR CLIENT TABLES
-- ============================================

-- Enable RLS on client tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_activities ENABLE ROW LEVEL SECURITY;

-- Clients policies
DROP POLICY IF EXISTS "Allow public read access to clients" ON clients;
CREATE POLICY "Allow public read access to clients"
  ON clients FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow public insert access to clients" ON clients;
CREATE POLICY "Allow public insert access to clients"
  ON clients FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update access to clients" ON clients;
CREATE POLICY "Allow public update access to clients"
  ON clients FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "Allow public delete access to clients" ON clients;
CREATE POLICY "Allow public delete access to clients"
  ON clients FOR DELETE
  USING (true);

-- Client activities policies
DROP POLICY IF EXISTS "Allow public read access to client_activities" ON client_activities;
CREATE POLICY "Allow public read access to client_activities"
  ON client_activities FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow public insert access to client_activities" ON client_activities;
CREATE POLICY "Allow public insert access to client_activities"
  ON client_activities FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public delete access to client_activities" ON client_activities;
CREATE POLICY "Allow public delete access to client_activities"
  ON client_activities FOR DELETE
  USING (true);

-- ============================================
-- ENABLE REALTIME FOR CLIENT TABLES
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE clients;
ALTER PUBLICATION supabase_realtime ADD TABLE client_activities;

-- ============================================
-- MODE SELECTION SUPPORT (Added 2024-12-03)
-- ============================================
-- Support for guided mode selection (agency, commerce, playground)

-- Add mode column to projects table
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS mode TEXT CHECK (mode IN ('agency', 'commerce', 'playground'));

-- Add mode_data column for mode-specific configuration
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS mode_data JSONB DEFAULT '{}'::jsonb;

-- Add index for mode queries
CREATE INDEX IF NOT EXISTS idx_projects_mode ON projects(mode);

-- Comment for documentation
COMMENT ON COLUMN projects.mode IS 'Business mode: agency, commerce, or playground';
COMMENT ON COLUMN projects.mode_data IS 'Mode-specific configuration data (agency type, commerce entry point, etc.)';

-- ============================================
-- PUBLISHED WEBSITES TABLE
-- ============================================
-- Stores deployed websites to Vercel with custom domain support
CREATE TABLE IF NOT EXISTS published_websites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- Deployment Info
  deployment_id TEXT,                    -- Vercel deployment ID
  deployment_url TEXT NOT NULL,          -- Current live URL
  subdomain TEXT NOT NULL,               -- e.g., 'my-project'
  base_domain TEXT DEFAULT 'anything.app', -- e.g., 'anything.app'
  custom_domain TEXT,                    -- e.g., 'mycompany.com'

  -- Website Source
  source_type TEXT NOT NULL CHECK (source_type IN ('project', 'lead')),
  source_artifact_id UUID,               -- Reference to artifacts table
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,

  -- Access Control
  access_level TEXT DEFAULT 'public' CHECK (access_level IN ('public', 'password', 'private')),
  password_hash TEXT,                    -- If password protected

  -- Status
  status TEXT DEFAULT 'deploying' CHECK (status IN ('deploying', 'published', 'failed', 'archived')),
  last_deployed_at TIMESTAMPTZ,

  -- Analytics
  view_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_subdomain UNIQUE(subdomain, base_domain)
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_published_websites_project ON published_websites(project_id);
CREATE INDEX IF NOT EXISTS idx_published_websites_subdomain ON published_websites(subdomain);
CREATE INDEX IF NOT EXISTS idx_published_websites_custom_domain ON published_websites(custom_domain) WHERE custom_domain IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_published_websites_lead ON published_websites(lead_id) WHERE lead_id IS NOT NULL;

-- Trigger for published_websites table
DROP TRIGGER IF EXISTS update_published_websites_updated_at ON published_websites;
CREATE TRIGGER update_published_websites_updated_at
  BEFORE UPDATE ON published_websites
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on published_websites table
ALTER TABLE published_websites ENABLE ROW LEVEL SECURITY;

-- Published websites policies
DROP POLICY IF EXISTS "Allow public read access to published_websites" ON published_websites;
CREATE POLICY "Allow public read access to published_websites"
  ON published_websites FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow public insert access to published_websites" ON published_websites;
CREATE POLICY "Allow public insert access to published_websites"
  ON published_websites FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update access to published_websites" ON published_websites;
CREATE POLICY "Allow public update access to published_websites"
  ON published_websites FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "Allow public delete access to published_websites" ON published_websites;
CREATE POLICY "Allow public delete access to published_websites"
  ON published_websites FOR DELETE
  USING (true);

-- Enable realtime for published_websites
ALTER PUBLICATION supabase_realtime ADD TABLE published_websites;

-- ============================================
-- USER PROFILES TABLE (Credit System)
-- ============================================
-- Stores user credit balance and Stripe customer info
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE,
  credits INTEGER NOT NULL DEFAULT 50,
  lifetime_credits_purchased INTEGER NOT NULL DEFAULT 0,
  stripe_customer_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

-- Trigger for user_profiles table
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- CREDIT TRANSACTIONS TABLE (Audit Trail)
-- ============================================
-- Tracks all credit additions and deductions
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('purchase', 'deduction', 'refund', 'bonus', 'free_tier')),
  description TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_type ON credit_transactions(type);

-- ============================================
-- RLS POLICIES FOR CREDIT TABLES
-- ============================================

-- Enable RLS on credit tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- User profiles policies (public access for now - tighten for production)
DROP POLICY IF EXISTS "Allow public read access to user_profiles" ON user_profiles;
CREATE POLICY "Allow public read access to user_profiles"
  ON user_profiles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow public insert access to user_profiles" ON user_profiles;
CREATE POLICY "Allow public insert access to user_profiles"
  ON user_profiles FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update access to user_profiles" ON user_profiles;
CREATE POLICY "Allow public update access to user_profiles"
  ON user_profiles FOR UPDATE
  USING (true);

-- Credit transactions policies
DROP POLICY IF EXISTS "Allow public read access to credit_transactions" ON credit_transactions;
CREATE POLICY "Allow public read access to credit_transactions"
  ON credit_transactions FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow public insert access to credit_transactions" ON credit_transactions;
CREATE POLICY "Allow public insert access to credit_transactions"
  ON credit_transactions FOR INSERT
  WITH CHECK (true);

-- ============================================
-- CLEANUP (IF NEEDED)
-- ============================================
-- Uncomment these ONLY if you want to completely reset the database

-- DROP TABLE IF EXISTS published_websites CASCADE;
-- DROP TABLE IF EXISTS client_activities CASCADE;
-- DROP TABLE IF EXISTS clients CASCADE;
-- DROP TABLE IF EXISTS lead_activities CASCADE;
-- DROP TABLE IF EXISTS lead_websites CASCADE;
-- DROP TABLE IF EXISTS leads CASCADE;
-- DROP TABLE IF EXISTS artifacts CASCADE;
-- DROP TABLE IF EXISTS messages CASCADE;
-- DROP TABLE IF EXISTS projects CASCADE;
-- DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;
