# Quick Start - Development Guide

For developers wanting to understand and work with the full-stack generation system.

## 5-Minute Overview

The Anything platform generates code in two modes:

### HTML Mode
```
User: "Create a landing page for a gym"
  ↓
System: Detects "landing page" keyword
  ↓
Output: Single HTML file with CSS and JavaScript embedded
  ↓
User: Downloads and opens in browser, ready to deploy
```

### Next.js Mode
```
User: "Build a SaaS task app with authentication"
  ↓
System: Detects "SaaS" and "authentication" keywords
  ↓
System: Selects patterns (auth, dashboard, database)
  ↓
System: Merges patterns + LLM-generated custom code
  ↓
Output: 30+ files (complete Next.js project)
  ↓
User: Extracts ZIP, installs, configures database, deploys
```

## Key Files to Know

### Generation Logic
```
src/app/api/
├── chat/route.ts              ← Mode detection happens here
└── tools/tool-code.ts         ← Generation logic here (660+ lines)
```

**Key Functions:**
- `detectAppMode()` - Analyzes request, returns 'html' or 'nextjs'
- `generateWebsiteFiles()` - Routes to correct generator
- `generateHTMLSite()` - Existing HTML generation
- `generateFullStackApp()` - New Next.js generation

### Pattern Library
```
src/config/
├── codePatterns.ts            ← 7 reusable patterns (740 lines)
└── agentPrompts.ts            ← LLM prompts with FULLSTACK_ARCHITECT_PROMPT
```

**Key Functions:**
- `resolvePatternDependencies()` - Recursive dependency resolution
- `mergePatternsIntoProject()` - Combines patterns with variable substitution
- `determineRequiredPatterns()` - Selects patterns based on request

### UI Components
```
src/components/
├── workspace/
│   ├── WebsiteEditorView.tsx   ← Main editor (adaptive UI)
│   ├── FileTreeEditor.tsx       ← File navigation
│   └── SchemaManager.tsx        ← Database migrations
└── editor/
    └── CodeMirror.tsx           ← Code viewer with highlighting
```

### Export System
```
src/utils/nextjsExport.ts      ← ZIP creation and download
```

**Key Functions:**
- `createProjectZip()` - Creates ZIP blob
- `downloadProjectZip()` - Triggers browser download
- `generateProjectReadme()` - Creates setup instructions

### Data Types
```
src/types/database.ts
```

**Key Type:**
```typescript
type WebsiteArtifact = {
  files: Array<{ path, content, type }>;
  primaryPage: string;
  appType?: 'html' | 'nextjs';        // NEW
  metadata?: {                         // NEW
    patterns?: string[];
    envVars?: { required: string[]; optional: string[] };
    setupInstructions?: string;
    dependencies?: string[];
  };
}
```

## Common Development Tasks

### Task 1: Add a New Pattern

**Location:** `src/config/codePatterns.ts`

**Steps:**

1. Define the pattern object:
```typescript
export const MY_NEW_PATTERN: CodePattern = {
  id: 'my-new-feature',
  name: 'My New Feature',
  description: 'Adds XYZ functionality',
  category: 'component',
  dependencies: {
    npm: ['some-package@^1.0.0'],
    patterns: ['nextjs-base', 'shadcn-setup']  // Dependencies
  },
  envVars: {
    required: ['MY_FEATURE_API_KEY'],
    optional: []
  },
  files: [
    {
      path: '/components/MyComponent.tsx',
      template: `'use client';

export function MyComponent() {
  return <div>{{projectName}}</div>
}`,
      description: 'Main component for my feature'
    }
  ],
  usage: 'When user asks for "my feature keyword"',
  relatedPatterns: ['data-table']
};
```

2. Add to pattern list:
```typescript
export const CODE_PATTERNS = [
  NEXTJS_BASE_PATTERN,
  // ... existing patterns
  MY_NEW_PATTERN  // Add here
];
```

3. Update pattern detection in `src/app/api/tools/tool-code.ts`:
```typescript
function determineRequiredPatterns(description: string, features?: string[]): string[] {
  // ...
  if (text.includes('my feature keyword')) {
    patterns.push('my-new-feature');
  }
  // ...
}
```

### Task 2: Improve Mode Detection

**Location:** `src/app/api/chat/route.ts`

**Current Logic:**
```typescript
function detectAppMode(userMessage: string): 'html' | 'nextjs' {
  const fullStackScore = count of full-stack keywords
  const htmlScore = count of HTML keywords

  return fullStackScore > htmlScore ? 'nextjs' : 'html'
}
```

**To Add New Signals:**

1. HTML signals:
```typescript
const htmlSignals = [
  'landing page', 'portfolio', 'website', // existing
  'new signal here'  // add here
];
```

2. Full-stack signals:
```typescript
const fullStackSignals = [
  'saas', 'app', 'dashboard', 'login',  // existing
  'new signal here'  // add here
];
```

### Task 3: Modify the Architect Prompt

**Location:** `src/config/agentPrompts.ts`

**Current Structure:**
```typescript
export const FULLSTACK_ARCHITECT_PROMPT = `
[Tech Stack Declaration]
[Project Structure]
[Component Guidelines]
[Pattern Reference]
[Database Schema Guidelines]
[Output Format]
[Quality Checklist]
`;
```

**To Update:**
1. Locate the section you want to modify
2. Edit the text
3. Ensure JSON format example is clear
4. Test with sample request

### Task 4: Debug Generation

**Add Logging:**

In `src/app/api/tools/tool-code.ts`, add to `generateFullStackApp()`:

```typescript
export async function generateFullStackApp(params) {
  console.log('[DEBUG] Mode:', 'nextjs');
  console.log('[DEBUG] Input:', params);

  const requiredPatterns = determineRequiredPatterns(description, features);
  console.log('[DEBUG] Required patterns:', requiredPatterns);

  const resolvedPatterns = resolvePatternDependencies(requiredPatterns);
  console.log('[DEBUG] Resolved patterns:', resolvedPatterns.map(p => p.id));

  // ... rest of function

  console.log('[DEBUG] Final files count:', uniqueFiles.length);
  console.log('[DEBUG] Files:', uniqueFiles.map(f => f.path));

  return result;
}
```

**View Logs:**
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for `[DEBUG]` messages
4. Watch network requests in Network tab

### Task 5: Test a Change

**Quick Test Loop:**

```bash
# 1. Make your code change
# 2. Server hot-reloads automatically

# 3. Test in browser
# Send test request in chat

# 4. Check results
# Open DevTools Console
# Check generated artifact in WebsiteEditorView

# 5. Inspect artifact
# In console:
console.log(artifact)
console.log(artifact.files)
console.log(artifact.appType)
```

### Task 6: Add New File Type Support

**Location:** `src/components/editor/CodeMirror.tsx`

**For Syntax Highlighting:**

1. Install language support:
```bash
npm install @codemirror/lang-python  # Example for Python
```

2. Import in CodeMirror.tsx:
```typescript
import { python } from '@codemirror/lang-python';
```

3. Add to `getLanguageExtension()`:
```typescript
function getLanguageExtension(language?: string) {
  switch (language) {
    case 'tsx':
      return javascript({ jsx: true, typescript: true });
    case 'py':  // Add this
      return python();
    // ... rest
  }
}
```

4. Update `detectLanguage()`:
```typescript
export function detectLanguage(filePath: string) {
  const extensionMap = {
    tsx: 'tsx',
    ts: 'ts',
    py: 'py',  // Add this
    // ... rest
  };
}
```

### Task 7: Improve Error Handling

**Location:** `src/app/api/tools/tool-code.ts`

**Template:**
```typescript
try {
  // Generation logic
} catch (error) {
  console.error('Error in generation:', error);

  // Specific error handling
  if (error.code === 'TIMEOUT') {
    return {
      error: 'Generation took too long. Try a simpler request.',
      retry: true
    };
  }

  if (error.message.includes('unauthorized')) {
    return {
      error: 'API authentication failed. Check credentials.',
      retry: false
    };
  }

  // Generic fallback
  return {
    error: 'Generation failed. Please try again.',
    details: error.message
  };
}
```

## Testing Changes

### Unit Test Pattern

```typescript
// Test mode detection
test('detectAppMode - HTML signals', () => {
  const result = detectAppMode('Create a landing page');
  expect(result).toBe('html');
});

test('detectAppMode - NextJS signals', () => {
  const result = detectAppMode('Build a SaaS dashboard');
  expect(result).toBe('nextjs');
});

// Test pattern resolution
test('resolvePatternDependencies', () => {
  const result = resolvePatternDependencies(['supabase-auth']);
  const ids = result.map(p => p.id);

  expect(ids).toContain('supabase-auth');
  expect(ids).toContain('user-profile-table');  // dependency
  expect(ids).toContain('supabase-client');     // dependency

  // Check order: dependencies before dependents
  expect(ids.indexOf('supabase-client')).toBeLessThan(
    ids.indexOf('supabase-auth')
  );
});
```

### Manual Test Cases

**Test: New Pattern**
```
1. Add MY_NEW_PATTERN to codePatterns.ts
2. Update determineRequiredPatterns() to select it
3. Generate project requesting that feature
4. Check Files tab for pattern files
5. Verify pattern files exist with correct content
6. Verify variable substitution worked
```

**Test: Mode Detection Change**
```
1. Add new keyword to signals
2. Test with request containing that keyword
3. Verify correct mode detected
4. Check appType in artifact
5. Verify UI shows correct tabs
```

## Performance Optimization

### Measure Current Performance

```javascript
// In browser console
performance.mark('start')
// ... perform action ...
performance.mark('end')
performance.measure('my-action', 'start', 'end')
console.log(performance.getEntriesByName('my-action')[0].duration)
```

### Common Bottlenecks

1. **LLM Generation** (30-60 seconds)
   - OpenRouter timeout settings
   - Model performance
   - Prompt token count

2. **Pattern Merging** (<1 second)
   - File count: 50-100 files OK
   - Variable substitution: Fast
   - Dependency resolution: Cache candidates

3. **UI Rendering** (<100ms)
   - File tree: Tree structure efficient
   - CodeMirror: Lazy loads visible lines
   - Schema tab: Lightweight

### Optimization Opportunities

```typescript
// Cache resolved dependencies
const PATTERN_CACHE = new Map<string, CodePattern[]>();

function resolvePatternDependencies(patternIds: string[]): CodePattern[] {
  const key = patternIds.sort().join(',');

  if (PATTERN_CACHE.has(key)) {
    return PATTERN_CACHE.get(key)!;
  }

  const result = /* resolution logic */;
  PATTERN_CACHE.set(key, result);
  return result;
}
```

## Debugging Tips

### Check LLM Output
```typescript
// In generateFullStackApp(), before parsing:
const fullText = await textStream.text();
console.log('Raw LLM output:', fullText);

// Check if JSON is valid
try {
  JSON.parse(fullText);
  console.log('Valid JSON ✓');
} catch (e) {
  console.log('Invalid JSON:', e.message);
  // Try extracting JSON from response
}
```

### Inspect Pattern Merging
```typescript
// After merging, inspect result
console.log('Pattern files:', patternFiles.map(f => f.path));
console.log('Generated files:', generated.files.map(f => f.path));
console.log('Final files:', uniqueFiles.map(f => f.path));
console.log('Duplicates:',
  uniqueFiles.length < patternFiles.length + generated.files.length
);
```

### Check UI State
```javascript
// In WebsiteEditorView:
console.log('appType:', artifact.appType);
console.log('isNextJs:', isNextJs);
console.log('activeTab:', activeTab);
console.log('selectedFile:', selectedFile);
console.log('files count:', artifact.files.length);
```

## Common Mistakes to Avoid

❌ **Don't:**
- Modify patterns without testing composition
- Change type definitions without updating all usages
- Forget to handle errors in generation pipeline
- Assume LLM output format is always valid
- Add large dependencies without checking bundle impact

✅ **Do:**
- Test new patterns with sample requests
- Add logging before debugging
- Handle errors gracefully with user-friendly messages
- Validate LLM output before using it
- Check performance impact of changes

## File Organization Tips

```typescript
// GOOD: Clear separation of concerns
// src/app/api/tools/tool-code.ts - Generation logic
// src/config/codePatterns.ts - Pattern definitions
// src/config/agentPrompts.ts - LLM prompts
// src/utils/nextjsExport.ts - Export utilities

// BAD: Mixed concerns
// src/generation.ts - Everything in one file

// GOOD: Meaningful function names
function resolvePatternDependencies(ids)

// BAD: Unclear names
function resolveDeps(ids)
```

## Getting Help

### Check Existing Code

1. **Look for similar implementations**
   ```bash
   # Search for pattern
   grep -r "supabase-client" src/
   ```

2. **Review existing patterns**
   - Open `src/config/codePatterns.ts`
   - Look at SUPABASE_CLIENT_PATTERN
   - See pattern structure and patterns

3. **Check component implementations**
   - Look at FileTreeEditor.tsx
   - See how tree building works
   - Understand component patterns

### Review Documentation

- **DEVELOPER_GUIDE.md** - Architecture and design
- **IMPLEMENTATION_SUMMARY.md** - What was built and why
- **Code comments** - Inline explanations

### Debug Approach

1. Add `console.log()` statements
2. Open DevTools Console
3. Reproduce the issue
4. Check console output
5. Trace execution flow
6. Find the exact point of failure
7. Fix and test

## Next Steps

Ready to start developing?

1. **Read DEVELOPER_GUIDE.md** - Understand architecture
2. **Explore the code** - Open codePatterns.ts and tool-code.ts
3. **Run the app** - `npm run dev`
4. **Test generation** - Send requests in chat
5. **Make a change** - Add a new signal to mode detection
6. **Test your change** - Verify it works as expected
7. **Add more features** - Follow the patterns established

---

**Happy coding!** 🚀

For detailed architecture information, see [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md)
