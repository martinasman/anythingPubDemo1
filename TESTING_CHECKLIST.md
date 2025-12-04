# Full-Stack Code Generation - Testing Checklist

Comprehensive testing plan for the complete full-stack generation system.

## Pre-Testing Setup

- [ ] Environment variables configured in `.env.local`
- [ ] Supabase project created and accessible
- [ ] OpenRouter API key configured
- [ ] Gemini 3 Pro model accessible via OpenRouter
- [ ] Database migrations table exists in Supabase
- [ ] Development server running: `npm run dev`

## Phase 1: Mode Detection

### Test Case 1.1: HTML Mode Detection

**Request:** "Create a landing page for a coffee shop"

**Expected Result:**
- [ ] Mode detected as 'html'
- [ ] Single file generated (index.html)
- [ ] `appType` is 'html'
- [ ] No metadata object required
- [ ] Preview works in iframe

**Verification Steps:**
1. Send request in chat
2. Check browser console for mode detection
3. Verify artifact in WebsiteEditorView
4. Try preview tab

---

### Test Case 1.2: Next.js Mode Detection

**Request:** "Build a SaaS app for task management with user authentication"

**Expected Result:**
- [ ] Mode detected as 'nextjs'
- [ ] Multiple files generated (20+)
- [ ] `appType` is 'nextjs'
- [ ] Metadata includes patterns list
- [ ] Files tab appears in UI

**Verification Steps:**
1. Send request in chat
2. Check browser console for mode detection
3. Verify artifact has 20+ files
4. Click Files tab to see tree
5. Check metadata in console

---

### Test Case 1.3: Ambiguous Request (Default HTML)

**Request:** "Create a cool website"

**Expected Result:**
- [ ] Mode defaults to 'html' (ambiguous case)
- [ ] Single file generated
- [ ] No NextJS components shown

**Verification Steps:**
1. Send ambiguous request
2. Verify HTML mode is chosen
3. Check that only preview tab shown

---

## Phase 2: File Generation

### Test Case 2.1: HTML File Generation

**Request:** "Create a landing page for a fitness studio"

**Expected Files:**
- [ ] `/index.html` exists and has proper structure
- [ ] CSS is embedded in HTML
- [ ] JavaScript is embedded in HTML
- [ ] HTML has proper meta tags
- [ ] Mobile responsive design

**Verification Steps:**
1. Generate HTML project
2. View in preview
3. Check source in code viewer
4. Resize browser to test responsiveness

---

### Test Case 2.2: Next.js File Structure

**Request:** "Build a SaaS project management app with teams"

**Expected Files:**
- [ ] `package.json` exists with correct dependencies
- [ ] `tsconfig.json` configured for strict mode
- [ ] `next.config.ts` properly configured
- [ ] `app/` directory with proper structure
- [ ] `app/layout.tsx` exists
- [ ] `app/page.tsx` exists (home page)
- [ ] `.gitignore` file present
- [ ] `.env.example` file present
- [ ] `README.md` with setup instructions

**File Count:** 25-40 files

**Verification Steps:**
1. Generate Next.js project
2. Open Files tab
3. Expand all folders
4. Verify key files exist
5. Check file count in console

---

### Test Case 2.3: Authentication Files

**Request:** "Build a SaaS app where users can create notes and share them"

**Expected Auth Files:**
- [ ] `app/(auth)/login/page.tsx`
- [ ] `app/(auth)/signup/page.tsx`
- [ ] `app/(auth)/layout.tsx`
- [ ] `lib/supabase/client.ts`
- [ ] `lib/supabase/server.ts`
- [ ] `hooks/useAuth.ts`
- [ ] `contexts/AuthContext.tsx` or similar
- [ ] Database migration for profiles

**Verification Steps:**
1. Generate project with auth keywords
2. Check Files tab for auth-related files
3. View auth code in CodeViewer
4. Verify TypeScript syntax is correct

---

### Test Case 2.4: Database Migration Files

**Request:** "Build a SaaS app for task management with teams and permissions"

**Expected Migrations:**
- [ ] Files in `supabase/migrations/` directory
- [ ] Numbered file names: `001_*.sql`, `002_*.sql`, etc.
- [ ] Valid SQL syntax
- [ ] Tables defined with CREATE TABLE
- [ ] RLS policies included
- [ ] Foreign key constraints

**Verification Steps:**
1. Generate project with database keywords
2. Check Files tab for migrations folder
3. Click on migration files
4. Verify SQL syntax
5. Switch to Schema tab

---

### Test Case 2.5: Dashboard Layout Files

**Request:** "Create a dashboard for managing projects and tasks"

**Expected Files:**
- [ ] `app/(dashboard)/layout.tsx` or similar
- [ ] `components/layouts/Sidebar.tsx`
- [ ] `components/layouts/Header.tsx`
- [ ] Dashboard page files
- [ ] Proper route grouping with parentheses

**Verification Steps:**
1. Generate dashboard project
2. Check file structure
3. View layout code
4. Verify route organization

---

## Phase 3: UI Components

### Test Case 3.1: File Tree Navigation

**Action:** Generate Next.js project, view Files tab

**Expected Behavior:**
- [ ] Tree structure renders correctly
- [ ] Folders and files displayed hierarchically
- [ ] Folder chevrons work (expand/collapse)
- [ ] Files have appropriate icons
- [ ] First 2 levels auto-expanded
- [ ] Folders sort before files alphabetically
- [ ] Clicking file selects it (highlight changes)

**Verification Steps:**
1. Generate project
2. Click Files tab
3. Expand/collapse folders
4. Verify icons match file types
5. Click different files
6. Check selection highlight

---

### Test Case 3.2: Code Viewer Syntax Highlighting

**Action:** Generate project, select various files in tree

**Expected Behavior:**

**For TypeScript files:**
- [ ] Keywords colored correctly (function, const, etc.)
- [ ] Type annotations visible
- [ ] Comments distinguished
- [ ] Strings properly highlighted

**For SQL files:**
- [ ] SQL keywords colored (CREATE, SELECT, etc.)
- [ ] Identifiers visible
- [ ] Comments distinguished
- [ ] String literals highlighted

**For CSS files:**
- [ ] Properties colored
- [ ] Values highlighted
- [ ] Selectors visible
- [ ] Comments distinguished

**For JSON files:**
- [ ] Keys and values distinguished
- [ ] Strings and numbers colored
- [ ] Braces visible

**Verification Steps:**
1. Generate project
2. Click each file type
3. Observe syntax highlighting
4. Verify readability
5. Test dark mode

---

### Test Case 3.3: Code Viewer File Header

**Action:** View CodeViewer component in Files tab

**Expected Behavior:**
- [ ] File path displayed at top
- [ ] Header has border separating from code
- [ ] Header styled appropriately
- [ ] File path is readable

**Verification Steps:**
1. Generate project
2. Select file in tree
3. Verify header shows correct path
4. Check styling

---

### Test Case 3.4: Schema Manager Display

**Action:** Generate project with database migrations, view Schema tab

**Expected Behavior:**
- [ ] Migration files listed
- [ ] File names displayed clearly
- [ ] Copy SQL button present for each
- [ ] Migration preview shown (first 10 lines)
- [ ] Required env vars listed
- [ ] Setup instructions displayed
- [ ] Supabase links functional
- [ ] "Show all SQL" collapsible section works

**Verification Steps:**
1. Generate project with migrations
2. Click Schema tab
3. Review migration display
4. Test Copy SQL button
5. Test collapsible section
6. Check env vars list

---

### Test Case 3.5: Tab Switching

**Action:** Generate Next.js project, click tabs

**Expected Behavior:**
- [ ] Preview tab shows HTML render
- [ ] Files tab shows tree + editor
- [ ] Schema tab shows migrations
- [ ] Tab state persists file selection
- [ ] No lag between tab switches
- [ ] Proper tab highlighting

**Verification Steps:**
1. Generate project
2. Click Preview tab
3. Click Files tab
4. Select a file
5. Click Schema tab
6. Click Files tab again
7. Verify file still selected

---

### Test Case 3.6: Export Button

**Action:** Generate project, click Export button

**Expected Behavior:**

**For HTML projects:**
- [ ] Download triggered
- [ ] File named `website.html`
- [ ] File contains HTML + CSS + JS
- [ ] Can open in browser directly

**For Next.js projects:**
- [ ] Download triggered
- [ ] File named `nextjs-app.zip` or similar
- [ ] ZIP contains all project files
- [ ] ZIP is valid (can extract)
- [ ] Loading state shows "Exporting..."
- [ ] Button disabled during export

**Verification Steps:**
1. Generate HTML project
2. Click Export
3. Check downloaded file
4. Generate Next.js project
5. Click Export
6. Verify ZIP integrity
7. Extract and check contents

---

## Phase 4: Data Integrity

### Test Case 4.1: File Path Consistency

**Action:** Generate project, view all files

**Expected Behavior:**
- [ ] All file paths start with `/`
- [ ] No duplicate paths
- [ ] Paths are properly organized
- [ ] Special characters escaped in names
- [ ] File extensions correct

**Verification Steps:**
1. Generate project
2. Log artifact.files to console
3. Check all paths
4. Verify no duplicates
5. Check file types match extensions

---

### Test Case 4.2: TypeScript Compilation

**Action:** Extract generated Next.js project, compile TypeScript

**Expected Behavior:**
- [ ] No TypeScript errors
- [ ] Strict mode enabled
- [ ] All types properly defined
- [ ] No implicit `any` types
- [ ] Paths resolve correctly

**Verification Steps:**
1. Download Next.js project
2. Extract ZIP
3. Run `npm install`
4. Run `npm run type-check` or `tsc --noEmit`
5. Verify no errors

---

### Test Case 4.3: Database Schema Validity

**Action:** Extract project, review SQL migrations

**Expected Behavior:**
- [ ] SQL is valid PostgreSQL
- [ ] Tables created properly
- [ ] RLS policies defined
- [ ] Foreign keys correct
- [ ] Timestamps with timezone

**Verification Steps:**
1. Download project with migrations
2. Extract
3. Review SQL files
4. Test in Supabase SQL editor (don't run)
5. Verify syntax

---

### Test Case 4.4: Environment Variables

**Action:** Check generated .env.example file

**Expected Behavior:**
- [ ] NEXT_PUBLIC_SUPABASE_URL present
- [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY present
- [ ] Comments explain each variable
- [ ] Required vs optional clearly marked
- [ ] Example values provided

**Verification Steps:**
1. Download project
2. Extract
3. View .env.example
4. Verify all vars documented
5. Check example values

---

### Test Case 4.5: Package.json Dependencies

**Action:** View generated package.json

**Expected Behavior:**
- [ ] next and react present
- [ ] @supabase/supabase-js present (if auth/database used)
- [ ] Versions pinned appropriately
- [ ] No conflicting versions
- [ ] Dev dependencies included

**Verification Steps:**
1. Download project
2. Extract
3. Review package.json
4. Check dependency versions
5. Run `npm install` successfully

---

## Phase 5: End-to-End Workflows

### Test Case 5.1: HTML Workflow

**Step 1: Generate**
- [ ] Request: "Create a landing page for a bookstore"
- [ ] Verify: HTML mode detected, single file generated

**Step 2: Preview**
- [ ] Click Preview tab
- [ ] Verify: Page renders in iframe
- [ ] Verify: Layout looks good
- [ ] Verify: Responsive on mobile

**Step 3: Export**
- [ ] Click Export button
- [ ] Verify: HTML file downloads
- [ ] Verify: Can open in browser
- [ ] Verify: All styling works

**Verification Checklist:**
- [ ] Complete from generation to browser viewing

---

### Test Case 5.2: Next.js with Auth Workflow

**Step 1: Generate**
- [ ] Request: "Build a note-taking SaaS app with user accounts"
- [ ] Verify: Next.js mode detected, 25+ files generated

**Step 2: Explore Files**
- [ ] Click Files tab
- [ ] Expand folder structure
- [ ] Find authentication files
- [ ] Find database migrations
- [ ] Verify file count

**Step 3: View Code**
- [ ] Click auth/login page
- [ ] Verify: TypeScript syntax correct
- [ ] Click migration file
- [ ] Verify: SQL is valid
- [ ] Check multiple file types

**Step 4: View Schema**
- [ ] Click Schema tab
- [ ] Verify: Migrations listed
- [ ] Verify: Tables detected
- [ ] Test Copy SQL button
- [ ] Read setup instructions

**Step 5: Export & Setup**
- [ ] Click Export
- [ ] Verify: ZIP downloads
- [ ] Extract on local machine
- [ ] Run `npm install`
- [ ] Create `.env.local` from `.env.example`
- [ ] Add Supabase credentials

**Step 6: Database Setup**
- [ ] Create Supabase project
- [ ] Go to SQL Editor
- [ ] Copy first migration from project
- [ ] Execute in Supabase
- [ ] Verify tables appear in Schema tab

**Step 7: Run Locally**
- [ ] Run `npm run dev`
- [ ] Open localhost:3000
- [ ] Verify: App renders
- [ ] Test signup flow
- [ ] Test login flow
- [ ] Check authentication works

**Verification Checklist:**
- [ ] Complete end-to-end functional test

---

### Test Case 5.3: Dashboard Workflow

**Step 1: Generate**
- [ ] Request: "Build a project management dashboard for teams"
- [ ] Verify: Next.js mode, includes dashboard files

**Step 2: Check Structure**
- [ ] Verify Files tab shows dashboard layout
- [ ] Find Sidebar component
- [ ] Find Header component
- [ ] Find dashboard pages

**Step 3: Code Quality**
- [ ] Verify TypeScript strict mode
- [ ] Check for 'use client' directives where needed
- [ ] Verify imports are correct
- [ ] Check for proper error handling

**Step 4: Build**
- [ ] Extract project
- [ ] Run `npm install`
- [ ] Run `npm run build`
- [ ] Verify: No build errors
- [ ] Verify: No TypeScript errors

**Verification Checklist:**
- [ ] Project builds successfully

---

## Phase 6: Regression Testing

### Test Case 6.1: Existing HTML Projects Still Work

**Action:** Create a project with existing HTML generation logic

**Expected Behavior:**
- [ ] HTML projects still generate correctly
- [ ] No breaking changes
- [ ] Preview still works
- [ ] Export still works

**Verification Steps:**
1. Generate simple HTML landing page
2. Verify it displays in preview
3. Export and verify it works
4. Compare with previous version

---

### Test Case 6.2: No Regressions in Mode Detection

**Action:** Test various request types

**Expected Behavior:**
- [ ] HTML requests → HTML mode
- [ ] SaaS requests → Next.js mode
- [ ] Ambiguous → HTML (default)
- [ ] No false positives/negatives

**Verification Steps:**
1. Test 10+ different request types
2. Document results
3. Verify consistency

---

## Phase 7: Performance Testing

### Test Case 7.1: HTML Generation Speed

**Action:** Generate HTML project, measure time

**Expected:** 10-15 seconds from request to display

**Verification Steps:**
1. Clear browser cache
2. Start timer when sending request
3. Stop timer when project appears
4. Record time
5. Repeat 3 times, average results

---

### Test Case 7.2: Next.js Generation Speed

**Action:** Generate Next.js project, measure time

**Expected:** 30-60 seconds from request to display

**Verification Steps:**
1. Clear browser cache
2. Start timer when sending request
3. Stop timer when project appears
4. Record time
5. Repeat 3 times, average results

---

### Test Case 7.3: File Tree Rendering

**Action:** Generate large Next.js project (40+ files), open Files tab

**Expected:** <100ms to render tree

**Verification Steps:**
1. Generate project
2. Open DevTools Performance tab
3. Click Files tab
4. Check render time
5. Measure tree rendering

---

### Test Case 7.4: Code Highlighting

**Action:** Open large file (500+ lines) in CodeViewer

**Expected:** <100ms to highlight code

**Verification Steps:**
1. Generate project
2. Open DevTools Performance
3. Click on large file
4. Measure syntax highlighting time

---

## Phase 8: Error Handling

### Test Case 8.1: Network Error During Generation

**Action:** Disconnect internet during generation, then reconnect

**Expected Behavior:**
- [ ] Error displayed to user
- [ ] Graceful error message
- [ ] Can retry
- [ ] No crash

**Verification Steps:**
1. Start generation request
2. Kill network mid-request
3. See error handling
4. Reconnect and retry

---

### Test Case 8.2: Invalid Supabase Credentials

**Action:** Extract project, try to run with invalid env vars

**Expected Behavior:**
- [ ] Clear error in browser console
- [ ] Error mentions missing env vars
- [ ] Instructions to set up env

**Verification Steps:**
1. Extract project
2. Try to run without .env.local
3. Check console errors
4. Verify error message is helpful

---

### Test Case 8.3: LLM Generation Failure

**Action:** (Simulate by providing invalid API key)

**Expected Behavior:**
- [ ] Error message displayed
- [ ] No partial/broken project created
- [ ] User informed of failure
- [ ] Can retry

**Verification Steps:**
1. Check error handling in generateFullStackApp()
2. Verify Supabase transaction rolls back
3. Check user sees error

---

## Phase 9: Browser Compatibility

### Test Case 9.1: Chrome

- [ ] Mode detection works
- [ ] Files generated correctly
- [ ] UI renders properly
- [ ] Export downloads file
- [ ] Code highlighting displays

**Verification:** Test in Chrome latest

---

### Test Case 9.2: Firefox

- [ ] Mode detection works
- [ ] Files generated correctly
- [ ] UI renders properly
- [ ] Export downloads file
- [ ] Code highlighting displays

**Verification:** Test in Firefox latest

---

### Test Case 9.3: Safari

- [ ] Mode detection works
- [ ] Files generated correctly
- [ ] UI renders properly
- [ ] Export downloads file
- [ ] Code highlighting displays

**Verification:** Test in Safari latest

---

### Test Case 9.4: Mobile Browser

- [ ] UI is responsive
- [ ] File tree scrollable
- [ ] Code viewer scrollable
- [ ] Tabs accessible
- [ ] Export works

**Verification:** Test on iOS Safari and Android Chrome

---

## Test Results Summary

| Test Case | Status | Notes | Date |
|-----------|--------|-------|------|
| 1.1 HTML Detection | ⬜ | | |
| 1.2 Next.js Detection | ⬜ | | |
| 1.3 Ambiguous Default | ⬜ | | |
| 2.1 HTML Files | ⬜ | | |
| 2.2 Next.js Structure | ⬜ | | |
| 2.3 Auth Files | ⬜ | | |
| 2.4 Migrations | ⬜ | | |
| 2.5 Dashboard | ⬜ | | |
| 3.1 File Tree | ⬜ | | |
| 3.2 Syntax Highlighting | ⬜ | | |
| 3.3 File Header | ⬜ | | |
| 3.4 Schema Manager | ⬜ | | |
| 3.5 Tab Switching | ⬜ | | |
| 3.6 Export Button | ⬜ | | |
| 4.1 File Paths | ⬜ | | |
| 4.2 TypeScript | ⬜ | | |
| 4.3 SQL Validity | ⬜ | | |
| 4.4 Env Vars | ⬜ | | |
| 4.5 Dependencies | ⬜ | | |
| 5.1 HTML E2E | ⬜ | | |
| 5.2 Next.js E2E | ⬜ | | |
| 5.3 Dashboard E2E | ⬜ | | |
| 6.1 HTML Regression | ⬜ | | |
| 6.2 Mode Detection Regression | ⬜ | | |
| 7.1 HTML Speed | ⬜ | | |
| 7.2 Next.js Speed | ⬜ | | |
| 7.3 File Tree Performance | ⬜ | | |
| 7.4 Code Highlighting Performance | ⬜ | | |
| 8.1 Network Error | ⬜ | | |
| 8.2 Invalid Credentials | ⬜ | | |
| 8.3 LLM Failure | ⬜ | | |
| 9.1 Chrome | ⬜ | | |
| 9.2 Firefox | ⬜ | | |
| 9.3 Safari | ⬜ | | |
| 9.4 Mobile | ⬜ | | |

**Legend:**
- ⬜ Not Started
- 🟨 In Progress
- ✅ Passed
- ❌ Failed
- ⚠️ Known Issue

---

**Test Plan Version:** 1.0
**Last Updated:** December 2025
**Tested By:** [Your Name]
**Test Environment:** [Node version, browsers, OS]
