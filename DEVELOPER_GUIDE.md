# Developer Guide - Full-Stack Code Generation

This guide documents the implementation of the full-stack code generation system for developers working on the Anything platform.

## Architecture Overview

The system is built on a modular architecture with clear separation of concerns:

```
User Request
    ↓
Chat Router (mode detection)
    ↓
Tool Dispatcher (HTML vs Next.js)
    ↓
┌─────────────────────────────────┐
│                                 │
├→ generateHTMLSite()        ├→ generateFullStackApp()
│  (existing logic)           (new logic)
│                                 │
│  ┌─────────────────────────────┘
│  │
│  ├→ Pattern Determination
│  ├→ Dependency Resolution
│  ├→ Pattern Merging
│  ├→ LLM Generation
│  ├→ File Finalization
│  └→ Supabase Storage
│
↓
WebsiteEditorView (adaptive UI)
  ├→ HTML projects: Preview tab only
  └→ Next.js projects: Preview, Files, Schema tabs
```

## Key Components

### 1. Mode Detection (`src/app/api/chat/route.ts`)

**Purpose:** Analyze user request and determine generation mode

**Logic:**
```
fullStackScore = count of [saas, app, dashboard, login, signup, database, ...]
htmlScore = count of [landing page, marketing site, portfolio, website, ...]

if fullStackScore > htmlScore:
  mode = 'nextjs'
else:
  mode = 'html' (default)
```

**Signals:**
- Full-stack: 13 keywords (e.g., "SaaS", "dashboard", "authentication")
- HTML: 8 keywords (e.g., "landing page", "portfolio")

**Default:** HTML (safer for ambiguous cases)

### 2. Code Patterns Library (`src/config/codePatterns.ts`)

**Purpose:** Reusable, composable code building blocks

**Structure:**
```typescript
interface CodePattern {
  id: string                        // Unique identifier
  name: string                      // Display name
  description: string               // What it does
  category: 'auth' | 'database' | 'api' | 'component' | 'layout'
  dependencies: {
    npm: string[]                   // npm packages required
    patterns: string[]              // Other patterns needed
  }
  envVars: {
    required: string[]              // Must be set
    optional: string[]              // Nice to have
  }
  files: Array<{
    path: string                    // File location
    template: string                // Content with {{placeholders}}
    description: string
  }>
  usage: string                     // When to use
  relatedPatterns: string[]         // Alternative/compatible patterns
}
```

**7 Core Patterns:**

1. **nextjs-base** - Next.js project foundation
   - Files: Configuration, app layout, CSS
   - No dependencies on other patterns

2. **shadcn-setup** - UI component library
   - Files: Component setup, Button, Input, Form, Table
   - Dependencies: None
   - Used by: All Next.js projects

3. **supabase-client** - Database client setup
   - Files: Client and server client factories
   - Dependencies: None
   - Used by: Projects needing data access

4. **supabase-auth** - Authentication system
   - Files: Login, signup pages, auth context, useAuth hook
   - Dependencies: supabase-client, user-profile-table
   - Used by: Projects with login/signup

5. **user-profile-table** - User data schema
   - Files: SQL migration, TypeScript types
   - Dependencies: None
   - Used by: Projects with auth or user data

6. **dashboard-layout** - UI shell for dashboards
   - Files: Layout component, sidebar, header
   - Dependencies: shadcn-setup, supabase-auth
   - Used by: Projects with dashboard/admin

7. **data-table** - Reusable data table
   - Files: DataTable component with sorting/filtering
   - Dependencies: shadcn-setup
   - Used by: Projects managing data lists

### 3. Pattern Dependency Resolution

**Function:** `resolvePatternDependencies(patternIds: string[]): CodePattern[]`

**Algorithm:**
```
function resolve(ids):
  resolved = empty set
  queue = ids to process

  while queue not empty:
    pattern = queue.pop()
    if pattern in resolved:
      continue

    for dep in pattern.dependencies.patterns:
      queue.push(dep)

    resolved.add(pattern)

  return resolved in dependency order
```

**Result:** Ordered list ensuring dependencies come before dependents

**Example:**
```
Request patterns: ['supabase-auth', 'dashboard-layout']

Resolution process:
1. supabase-auth
   → depends on: supabase-client, user-profile-table
2. supabase-client (no pattern deps)
3. user-profile-table (no pattern deps)
4. dashboard-layout
   → depends on: shadcn-setup, supabase-auth
5. shadcn-setup (no pattern deps)

Final order:
[supabase-client, user-profile-table, supabase-auth, shadcn-setup, dashboard-layout]
```

### 4. Pattern Merging (`mergePatternsIntoProject()`)

**Purpose:** Combine pattern files into a coherent project with variable substitution

**Process:**
1. **Variable Substitution:** Replace `{{PLACEHOLDER}}` with actual values
2. **Deduplication:** Keep last version if same file in multiple patterns
3. **Conflict Resolution:** Handle overlapping files (patterns first, LLM overrides)
4. **Organization:** Ensure correct directory structure

**Example Variables:**
```javascript
{
  projectName: 'My SaaS App',
  NEXT_PUBLIC_SUPABASE_URL: '{{SUPABASE_URL}}',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: '{{SUPABASE_ANON_KEY}}'
}
```

### 5. Full-Stack Generation (`generateFullStackApp()`)

**Purpose:** Generate complete Next.js project from user request

**Workflow:**

```
1. Determine Required Patterns
   ↓
2. Resolve Pattern Dependencies
   ↓
3. Build Enhanced LLM Prompt
   ├─ System prompt (FULLSTACK_ARCHITECT_PROMPT)
   ├─ Pattern reference (what's available)
   └─ User request context
   ↓
4. Call LLM (Gemini 3 Pro via OpenRouter)
   ↓
5. Parse JSON Response
   ├─ Extract files array
   ├─ Extract metadata (env vars, instructions)
   └─ Handle parsing errors gracefully
   ↓
6. Merge Files
   ├─ Add pattern files
   ├─ Add generated files (LLM output)
   ├─ Merge with precedence: LLM > Patterns
   └─ Ensure essential files exist
   ↓
7. Save to Supabase
   ├─ WebsiteArtifact with all metadata
   ├─ Patterns used (for reference)
   └─ Environment variables needed
```

### 6. Enhanced Architect Prompt (`src/config/agentPrompts.ts`)

**Purpose:** Guide LLM to generate high-quality Next.js code

**Sections:**

1. **Tech Stack Declaration** (120 lines)
   - Next.js 15, TypeScript, Supabase, Shadcn/UI, Tailwind

2. **Project Structure** (40 lines)
   - Directory layout expectations
   - File organization patterns
   - Naming conventions

3. **Component Guidelines** (50 lines)
   - Server Components by default
   - Client Components when needed ('use client')
   - Data fetching patterns
   - Error handling

4. **Pattern Reference** (40 lines)
   - Explain available patterns
   - When to use each
   - How they compose

5. **Database Schema Guidelines** (30 lines)
   - Migration file naming (`001_table.sql`)
   - RLS policy requirements
   - Foreign keys and constraints
   - Indexes for performance

6. **Output Format** (20 lines)
   - Expected JSON structure
   - Required fields
   - File path conventions

7. **Quality Checklist** (10 lines)
   - TypeScript strict mode
   - No console.log in production
   - Proper error handling
   - Accessibility

**Token Usage:** ~4,000 tokens

### 7. File Finalization

**Function:** `ensureEssentialNextJsFiles(files: File[]): File[]`

**Ensures these files always exist:**

1. **package.json**
   ```json
   {
     "name": "my-app",
     "version": "0.1.0",
     "private": true,
     "scripts": {
       "dev": "next dev",
       "build": "next build",
       "start": "next start",
       "lint": "next lint"
     },
     "dependencies": {
       "next": "^15.0.0",
       "react": "^19.0.0",
       "@supabase/supabase-js": "^2.38.0",
       // ... other dependencies from patterns
     }
   }
   ```

2. **.env.example**
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

3. **README.md**
   - Quick start guide
   - Project structure
   - Environment setup
   - Database migration steps
   - Deployment instructions

### 8. Export & Delivery (`src/utils/nextjsExport.ts`)

**Purpose:** Package and deliver projects to users

**Functions:**

1. **createProjectZip()**
   - Uses JSZip to create ZIP archive
   - Includes all source files
   - Adds generated README, .env.example, .gitignore
   - Returns Blob for download

2. **downloadProjectZip()**
   - Creates ZIP via createProjectZip()
   - Creates download link
   - Triggers browser download
   - Cleans up object URLs

3. **generateProjectReadme()**
   - Multi-section documentation
   - Setup instructions
   - Project structure
   - Available scripts
   - Features list
   - Deployment options
   - Troubleshooting

4. **generateEnvExample()**
   - Lists required variables
   - Lists optional variables
   - Provides example values
   - Documents purpose of each var

### 9. Adaptive UI (`src/components/workspace/WebsiteEditorView.tsx`)

**Purpose:** Display different interfaces based on project type

**HTML Projects:**
```
┌─────────────────────────────────┐
│ [Back] [Export] [Open]          │
├─────────────────────────────────┤
│                                 │
│      HTML Preview (iframe)      │
│                                 │
└─────────────────────────────────┘
```

**Next.js Projects:**
```
┌─────────────────────────────────┐
│ [Back] [Preview|Files|Schema] [Export]│
├─────────────────────────────────┤
│                                 │
│  Preview Tab:  HTML preview     │
│  Files Tab:    Tree + Editor    │
│  Schema Tab:   Migrations       │
│                                 │
└─────────────────────────────────┘
```

**Implementation:**
- Detect mode: `isNextJs = artifact.appType === 'nextjs'`
- Tab state: `activeTab: 'preview' | 'files' | 'schema'`
- Conditional rendering based on mode and tab
- Preserve file selection across tab switches

### 10. File Tree Component (`src/components/workspace/FileTreeEditor.tsx`)

**Purpose:** Navigate file structure hierarchically

**Features:**
- Build tree from flat file array
- Collapsible folders
- File type icons
- Active selection highlighting
- Auto-expand first 2 levels

**Helper Functions:**
```typescript
buildFileTree(files: File[]): FileTreeNode
  └─ Creates nested structure from flat array
  └─ Sorts folders before files
  └─ Deduplicates path handling

getFileIcon(fileName: string, isFolder: boolean): ReactNode
  └─ Maps file extension to icon color
  └─ ts/tsx: blue, js/jsx: yellow, css: pink, sql: green, etc.

getFileCount(files: File[]): { total, byType }
  └─ Statistics for project files
```

### 11. Code Viewer Component (`src/components/editor/CodeMirror.tsx`)

**Purpose:** Display syntax-highlighted code

**Features:**
- Language detection by file extension
- Syntax highlighting via CodeMirror 6
- Dark/light theme support
- Line numbers
- Read-only mode

**Language Support:**
- TypeScript/JavaScript (tsx, ts, jsx, js)
- HTML/CSS (html, css)
- JSON/SQL/Markdown (json, sql, md)
- Environment files (.env)

**Dependencies:**
```
@codemirror/lang-javascript
@codemirror/lang-html
@codemirror/lang-css
@codemirror/lang-json
@codemirror/lang-sql
@codemirror/lang-markdown
@codemirror/theme-one-dark
```

### 12. Schema Manager Component (`src/components/workspace/SchemaManager.tsx`)

**Purpose:** Display and manage database migrations

**Features:**
- List all SQL migration files
- Copy-to-clipboard for each migration
- Show required environment variables
- Step-by-step setup instructions
- Table detection and counting
- Full SQL preview in collapsible section

**Implementation:**
```typescript
migrations = artifact.files.filter(f =>
  f.path.includes('migrations') && f.type === 'sql'
)

tables = new Set()
migrations.forEach(m => {
  const matches = m.content.match(/CREATE TABLE\s+(\w+)/gi)
  matches?.forEach(match => tables.add(match))
})
```

## Data Flow

### HTML Generation Flow

```
User Request: "Create a landing page"
  ↓
mode = 'html' (detected or explicit)
  ↓
generateHTMLSite(params)
  ├─ Extract businessDescription, features, identity
  ├─ Build Architect prompt
  ├─ Call LLM
  ├─ Parse HTML response
  ├─ Create WebsiteArtifact { appType: 'html', files: [{path: '/index.html', ...}] }
  └─ Save to Supabase
  ↓
WebsiteEditorView
  └─ Display preview only
  └─ Export single HTML file
```

### Next.js Generation Flow

```
User Request: "Build a SaaS task management app"
  ↓
mode = 'nextjs' (detected or explicit)
  ↓
generateFullStackApp(params)
  ├─ determineRequiredPatterns(description, features)
  │   └─ Checks for: auth, dashboard, data tables, etc.
  │   └─ Returns: ['supabase-auth', 'dashboard-layout', 'data-table']
  ├─ resolvePatternDependencies([...])
  │   └─ Adds: 'nextjs-base', 'shadcn-setup', 'supabase-client', 'user-profile-table'
  ├─ Merge patterns into project template
  ├─ Build enhanced LLM prompt with pattern context
  ├─ Call LLM with full context
  ├─ Parse JSON response
  ├─ Merge pattern files + generated files
  ├─ ensureEssentialNextJsFiles()
  ├─ Create WebsiteArtifact {
  │    appType: 'nextjs',
  │    files: [20-50 files],
  │    metadata: {
  │      patterns: [...],
  │      envVars: { required: [...], optional: [...] },
  │      setupInstructions: "..."
  │    }
  │  }
  └─ Save to Supabase
  ↓
WebsiteEditorView
  ├─ Show tabs: Preview | Files | Schema
  ├─ Preview: HTML render of home page
  ├─ Files: FileTreeEditor + CodeViewer
  └─ Schema: SchemaManager with migrations
  ↓
Export
  └─ createProjectZip()
  └─ downloadProjectZip()
```

## Type Definitions

### WebsiteArtifact

```typescript
type WebsiteArtifact = {
  files: Array<{
    path: string;        // e.g., '/app/page.tsx'
    content: string;     // File contents
    type: 'html' | 'css' | 'js' | 'json' | 'tsx' | 'ts' | 'jsx' | 'sql' | 'env' | 'md';
  }>;
  primaryPage: string;   // e.g., '/index.html' or '/app/page.tsx'

  // NEW FIELDS
  appType?: 'html' | 'nextjs';
  metadata?: {
    patterns?: string[];           // ['supabase-auth', 'dashboard-layout']
    envVars?: {
      required: string[];          // ['NEXT_PUBLIC_SUPABASE_URL']
      optional: string[];          // ['NEXT_PUBLIC_SENTRY_DSN']
    };
    setupInstructions?: string;    // Markdown instructions
    dependencies?: string[];       // npm package list
  };
};
```

## Testing Checklist

### 1. Mode Detection

- [ ] "landing page" → HTML mode
- [ ] "SaaS app" → Next.js mode
- [ ] "create a website" → HTML mode
- [ ] "dashboard with authentication" → Next.js mode
- [ ] Ambiguous request → HTML mode (default)

### 2. HTML Generation

- [ ] Single file generated
- [ ] appType = 'html'
- [ ] Preview works in iframe
- [ ] Export creates .html file
- [ ] Regression: Existing HTML projects still work

### 3. Next.js Generation

- [ ] appType = 'nextjs'
- [ ] 20-50 files generated
- [ ] File tree displays all files
- [ ] Files are syntactically correct TypeScript/SQL
- [ ] package.json has all required dependencies
- [ ] .env.example lists required variables
- [ ] Migrations are valid SQL

### 4. UI Components

- [ ] FileTreeEditor: Tree structure renders
- [ ] FileTreeEditor: Clicking file selects it
- [ ] CodeViewer: Syntax highlighting works
- [ ] CodeViewer: Code is readable
- [ ] SchemaManager: Migrations display
- [ ] SchemaManager: Copy buttons work
- [ ] Tabs: Can switch between Preview/Files/Schema

### 5. Export

- [ ] HTML: Single .html file downloads
- [ ] Next.js: Zip file with all files downloads
- [ ] Zip contains: package.json, tsconfig.json, app/, components/, lib/, supabase/migrations/
- [ ] Zip contains: README.md, .env.example, .gitignore
- [ ] README has: setup instructions, project structure, env setup, migration steps
- [ ] Extracted project runs: `npm install && npm run dev`

### 6. Full End-to-End

- [ ] Request SaaS app
- [ ] System generates Next.js project
- [ ] File tree shows correct structure
- [ ] Code viewer displays syntax-highlighted files
- [ ] Schema tab shows migrations
- [ ] Export downloads complete ZIP
- [ ] Extracted and run locally: `npm install && npm run dev`
- [ ] App runs on localhost:3000
- [ ] Auth flow works (signup, login, logout)
- [ ] Database is accessible after migration setup

## Adding New Patterns

To add a new code pattern:

1. **Define the pattern** in `src/config/codePatterns.ts`:

```typescript
export const NEW_PATTERN: CodePattern = {
  id: 'new-feature',
  name: 'New Feature Name',
  description: 'What this pattern does',
  category: 'component',
  dependencies: {
    npm: ['new-package@^1.0.0'],
    patterns: ['nextjs-base', 'shadcn-setup']
  },
  envVars: {
    required: ['NEW_FEATURE_API_KEY'],
    optional: []
  },
  files: [
    {
      path: '/components/NewComponent.tsx',
      template: `'use client';

export function NewComponent() {
  return <div>{{projectName}} New Component</div>
}`,
      description: 'Main component'
    }
  ],
  usage: 'When user requests "new feature"',
  relatedPatterns: ['data-table']
};
```

2. **Update pattern detection** in `determineRequiredPatterns()`:

```typescript
if (text.includes('new feature keyword')) {
  patterns.push('new-feature');
}
```

3. **Export pattern** in pattern list:

```typescript
export const CODE_PATTERNS = [
  NEXTJS_BASE_PATTERN,
  // ... other patterns
  NEW_PATTERN  // Add here
];
```

## Debugging

### Enable Debug Logging

Add to `generateFullStackApp()`:

```typescript
console.log('Mode:', mode);
console.log('Determined patterns:', requiredPatterns);
console.log('Resolved patterns:', resolvedPatterns);
console.log('LLM prompt:', fullPrompt);
console.log('Generated files count:', generated.files.length);
console.log('Final files count:', uniqueFiles.length);
```

### Inspect Generated Project

In `WebsiteEditorView`:

```typescript
console.log('Artifact:', artifact);
console.log('Files:', artifact.files);
console.log('Metadata:', artifact.metadata);
console.log('appType:', artifact.appType);
```

### Check Supabase Storage

Query artifact in database:

```sql
SELECT data FROM artifacts WHERE project_id = '...' AND type = 'website_code';
```

## Performance Considerations

### LLM Generation
- **Time:** 30-60 seconds for full project
- **Tokens:** ~8,000 prompt + ~4,000 completion
- **Cost:** ~$0.05 per generation (Gemini 3)

### Pattern Merging
- **Time:** <100ms for dependency resolution
- **Time:** <200ms for file merging
- **Optimization:** Cache resolved patterns if same request seen before

### UI Rendering
- **FileTreeEditor:** O(n) where n = number of files
- **CodeMirror:** Only renders visible lines (virtualization built-in)
- **SchemaManager:** Lightweight, regex parsing is fast

### Optimization Opportunities
1. Cache resolved pattern dependencies
2. Pre-compute pattern merges for common combinations
3. Implement incremental file updates (don't re-fetch all files)
4. Stream UI updates to show progress to user

## Security Considerations

### Environment Variables
- Service role keys NEVER in frontend code
- Supabase anon key is public (limited by RLS)
- .env files in .gitignore
- .env.example shows structure without secrets

### Code Generation
- LLM output validated before saving
- No code injection vulnerabilities in pattern merging
- File paths sanitized (no ../ traversal)
- SQL migrations use parameterized queries

### Data Privacy
- Projects stored in Supabase with user ownership
- File contents not analyzed beyond file type
- No PII collected from generated code
- Pattern library open/no sensitive data

## Maintenance

### Monitoring

Check error logs for:
- LLM generation failures
- Pattern merge conflicts
- File I/O errors
- Supabase connection issues

### Updates

When updating patterns:
1. Create migration file with version
2. Test with existing projects
3. Update documentation
4. Announce breaking changes

When updating LLM prompt:
1. Test with sample requests
2. Compare output quality
3. Monitor token usage
4. Get user feedback

---

**Last Updated:** December 2025
**Version:** 1.0.0
**Maintainer:** Anything Platform Team
