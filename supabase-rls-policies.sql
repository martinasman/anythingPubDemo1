-- ============================================
-- SUPABASE RLS POLICIES FOR USER AUTHENTICATION
-- Run this in Supabase SQL Editor after setting up Google OAuth
-- ============================================

-- First, drop existing public policies (if they exist)
DROP POLICY IF EXISTS "Allow public read access to projects" ON projects;
DROP POLICY IF EXISTS "Allow public insert access to projects" ON projects;
DROP POLICY IF EXISTS "Allow public update access to projects" ON projects;
DROP POLICY IF EXISTS "Allow public delete access to projects" ON projects;

-- ============================================
-- PROJECTS TABLE POLICIES
-- ============================================

-- Users can only read their own projects
CREATE POLICY "Users can read own projects" ON projects
  FOR SELECT USING (auth.uid()::text = user_id);

-- Users can only create projects with their own user_id
CREATE POLICY "Users can create own projects" ON projects
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Users can only update their own projects
CREATE POLICY "Users can update own projects" ON projects
  FOR UPDATE USING (auth.uid()::text = user_id);

-- Users can only delete their own projects
CREATE POLICY "Users can delete own projects" ON projects
  FOR DELETE USING (auth.uid()::text = user_id);

-- ============================================
-- MESSAGES TABLE POLICIES
-- ============================================

-- Users can read messages from their own projects
CREATE POLICY "Users can read messages from own projects" ON messages
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = messages.project_id
    AND projects.user_id = auth.uid()::text
  ));

-- Users can insert messages to their own projects
CREATE POLICY "Users can insert messages to own projects" ON messages
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = messages.project_id
    AND projects.user_id = auth.uid()::text
  ));

-- Users can update messages in their own projects
CREATE POLICY "Users can update messages in own projects" ON messages
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = messages.project_id
    AND projects.user_id = auth.uid()::text
  ));

-- Users can delete messages from their own projects
CREATE POLICY "Users can delete messages from own projects" ON messages
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = messages.project_id
    AND projects.user_id = auth.uid()::text
  ));

-- ============================================
-- ARTIFACTS TABLE POLICIES
-- ============================================

-- Users can read artifacts from their own projects
CREATE POLICY "Users can read artifacts from own projects" ON artifacts
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = artifacts.project_id
    AND projects.user_id = auth.uid()::text
  ));

-- Users can insert artifacts to their own projects
CREATE POLICY "Users can insert artifacts to own projects" ON artifacts
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = artifacts.project_id
    AND projects.user_id = auth.uid()::text
  ));

-- Users can update artifacts in their own projects
CREATE POLICY "Users can update artifacts in own projects" ON artifacts
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = artifacts.project_id
    AND projects.user_id = auth.uid()::text
  ));

-- Users can delete artifacts from their own projects
CREATE POLICY "Users can delete artifacts from own projects" ON artifacts
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = artifacts.project_id
    AND projects.user_id = auth.uid()::text
  ));

-- ============================================
-- VERIFY RLS IS ENABLED
-- ============================================

-- Make sure RLS is enabled on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE artifacts ENABLE ROW LEVEL SECURITY;
