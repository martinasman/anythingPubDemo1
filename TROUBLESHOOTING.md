# Troubleshooting Guide

Common issues and solutions for the Anything platform.

## Generation Issues

### Project Generation Takes Too Long

**Symptoms:**
- Generation request takes >2 minutes
- Browser seems unresponsive
- No error message

**Solutions:**

1. **Check Internet Connection**
   ```bash
   # Test connectivity
   curl -I https://openrouter.ai
   curl -I https://api.supabase.co
   ```

2. **Check LLM Service Status**
   - Verify OpenRouter API is accessible
   - Check API usage limits
   - Try simpler request first

3. **Check Server Logs**
   ```bash
   # Look for timeouts in terminal where `npm run dev` is running
   ```

4. **Increase Timeout** (if configurable)
   - Modify timeout in `tool-code.ts` if needed
   - Default is handled by OpenRouter (120 second timeout)

5. **Reduce Complexity**
   - Ask for simpler project
   - Request features incrementally

---

### "Failed to parse LLM response" Error

**Symptoms:**
- Error message about JSON parsing
- Project not generated
- No files visible

**Causes:**
- LLM returned invalid JSON
- Streaming response interrupted
- LLM model changed behavior

**Solutions:**

1. **Check Browser Console**
   ```javascript
   // Look for error details in DevTools Console
   // Copy full error message
   ```

2. **Try Simpler Request**
   ```
   // Instead of: "Build a complex marketplace with payments and notifications"
   // Try: "Build a simple task list app"
   ```

3. **Verify LLM Output**
   - Enable debug logging in `tool-code.ts`
   - Check what LLM actually returned
   - Look for JSON in response

4. **Retry Generation**
   - LLM might have had a hiccup
   - Retry with same request
   - If persists, contact support

---

### Mode Detection Wrong (HTML Generated for SaaS Request)

**Symptoms:**
- Requested SaaS app but got HTML page
- Expected Next.js project, got single HTML file
- `appType` is 'html' instead of 'nextjs'

**Solutions:**

1. **Check Request Keywords**
   - Mode detection looks for specific keywords
   - Ensure request mentions: "SaaS", "app", "dashboard", "login", "database", "user accounts"
   - Example: "Build a SaaS task app" (contains "SaaS" + "app")

2. **Explicit Mode Specification**
   - You can't explicitly specify mode in chat yet
   - Workaround: Add clear SaaS keywords to request
   - "Build a SaaS note-taking application with user authentication and database"

3. **Check Detection Logic**
   - Full-stack signals: saas, app, dashboard, login, signup, database, user accounts, manage, admin panel, crud, authentication, users can, profiles, settings
   - HTML signals: landing page, marketing site, portfolio, website, coming soon, static site, one page, simple site
   - Default: HTML (ambiguous cases)

4. **Report Issue**
   - If keywords clearly indicate SaaS but HTML generated
   - Report with exact request text
   - Help improve detection signals

---

## Downloaded Project Issues

### "npm install" Fails

**Symptoms:**
- Run `npm install` in extracted project
- Get dependency resolution errors
- Some packages won't install

**Common Causes:**

1. **Node Version Too Old**
   ```bash
   # Check Node version
   node --version
   # Need: 18.0.0 or newer
   ```

   **Solution:**
   ```bash
   # Update Node
   # Visit https://nodejs.org
   # Download LTS version (18+)
   ```

2. **Conflicting Dependencies**
   ```bash
   # Try deleting cache and reinstalling
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Network Issues**
   ```bash
   # Try different npm registry
   npm install --registry https://registry.npmjs.org/

   # Or use yarn
   yarn install
   ```

4. **Disk Space Issues**
   ```bash
   # Check available space
   df -h
   # Need: ~500MB minimum
   ```

---

### "NEXT_PUBLIC_SUPABASE_URL is not defined"

**Symptoms:**
- Error in browser console
- Environment variable warning
- App doesn't load

**Causes:**
- `.env.local` file missing
- `.env.local` in wrong location
- Wrong variable names

**Solutions:**

1. **Create .env.local File**
   ```bash
   # In project root (same level as package.json)
   cp .env.example .env.local
   ```

2. **Add Supabase Credentials**
   ```env
   # .env.local
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_key_here
   ```

3. **Restart Dev Server**
   ```bash
   # Stop current server (Ctrl+C)
   # Restart with: npm run dev
   ```

4. **Verify File Location**
   ```bash
   # File should be here:
   # my-app/.env.local

   # Check it exists:
   ls -la .env.local
   ```

5. **Check Variable Names**
   - Look in `.env.example` for exact names
   - Don't add NEXT_PUBLIC_ prefix to secret keys
   - Anon key uses NEXT_PUBLIC_ prefix
   - Service role key doesn't (server-side only)

---

### "Cannot find module '@/lib/supabase/client'"

**Symptoms:**
- TypeScript error
- Module not found error
- App won't compile

**Causes:**
- File wasn't generated
- Path alias misconfigured
- TypeScript cache issue

**Solutions:**

1. **Verify File Exists**
   ```bash
   # Check file was generated
   ls -la src/lib/supabase/client.ts
   ```

2. **Clear TypeScript Cache**
   ```bash
   rm -rf .next
   npm run dev
   ```

3. **Check tsconfig.json**
   ```json
   // Should have path alias
   {
     "compilerOptions": {
       "paths": {
         "@/*": ["./src/*"]
       }
     }
   }
   ```

4. **Regenerate Project**
   - If file genuinely missing
   - Request again with more explicit keywords
   - Example: "build a SaaS app with Supabase database"

---

## Database Issues

### Migrations Won't Apply

**Symptoms:**
- SQL paste fails in Supabase
- Syntax error message
- Tables don't appear

**Solutions:**

1. **Check SQL Syntax**
   - Copy migration text to SQL editor
   - Check for red squiggly underlines
   - Look for unclosed quotes or brackets

2. **Apply in Order**
   - Don't skip migrations
   - Apply 001, then 002, then 003
   - Order matters for foreign keys

3. **Check for Existing Tables**
   - If migration creates table that exists
   - Look for "IF NOT EXISTS"
   - Drop existing table or use CREATE TABLE IF NOT EXISTS

4. **Check RLS Policies**
   - Migrations include RLS
   - Ensure auth schema exists
   - Verify auth.users table exists

5. **Test in SQL Editor**
   ```sql
   -- Try running migration directly
   -- Look for errors
   -- Check permissions
   ```

---

### "RLS policy denies access" Error

**Symptoms:**
- Can't insert/read data
- "permission denied for schema public" error
- Data operations fail

**Causes:**
- RLS policy doesn't match user
- auth.uid() not working
- Session not authenticated

**Solutions:**

1. **Verify User is Authenticated**
   ```typescript
   // Check in browser console
   const { data: { user } } = await supabase.auth.getUser()
   console.log(user)  // Should have user object
   ```

2. **Check RLS Policy**
   - Go to Supabase Dashboard
   - Auth → Policies
   - Verify policy SQL is correct
   - Should use `auth.uid()` matching user_id

3. **Test Policy**
   ```sql
   -- In Supabase SQL Editor
   -- Test with authenticated user
   SELECT * FROM your_table WHERE user_id = auth.uid();
   ```

4. **Create Missing Policy**
   ```sql
   CREATE POLICY "Users can read own data" ON public.your_table
     FOR SELECT USING (auth.uid() = user_id);
   ```

5. **Debug in App**
   ```typescript
   try {
     const { data, error } = await supabase
       .from('your_table')
       .select('*')

     if (error) {
       console.error('Query error:', error.message)
     }
   } catch (err) {
     console.error('Exception:', err)
   }
   ```

---

### Migrations Run But Tables Don't Appear

**Symptoms:**
- SQL executed successfully
- No errors returned
- Tables not visible in Schema tab
- Can't query table

**Causes:**
- Migration not actually executed
- Created in wrong database
- Schema visibility issue

**Solutions:**

1. **Refresh Dashboard**
   - Close Supabase tab
   - Reopen dashboard
   - Navigate to Schema tab again
   - Tables might appear

2. **Check Actual Database**
   ```sql
   -- In SQL Editor, run:
   SELECT table_name
   FROM information_schema.tables
   WHERE table_schema = 'public'
   ```

3. **Check Migration File**
   ```sql
   -- Verify CREATE TABLE syntax
   CREATE TABLE your_table (
     id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
     user_id UUID NOT NULL REFERENCES auth.users(id),
     -- ... columns
   );
   ```

4. **Run Migration Again**
   - Copy entire migration file
   - Clear SQL editor
   - Paste fresh
   - Execute
   - Refresh dashboard

---

## UI/Editor Issues

### File Tree Not Showing

**Symptoms:**
- Files tab shows empty tree
- No files in hierarchy
- "No files generated" message

**Causes:**
- Next.js mode not detected
- Files not in artifact
- Component not rendering

**Solutions:**

1. **Verify appType**
   ```javascript
   // In browser console
   console.log(artifact.appType)  // Should be 'nextjs'
   ```

2. **Check Files Array**
   ```javascript
   // Should have 20+ files
   console.log(artifact.files.length)
   console.log(artifact.files.map(f => f.path))
   ```

3. **Check Tab State**
   - Make sure Files tab is actually selected
   - Click Files button again
   - Try switching tabs

4. **Refresh Page**
   ```javascript
   // Browser refresh
   Ctrl+R or Cmd+R
   ```

5. **Check Console for Errors**
   - Open DevTools (F12)
   - Look for red errors
   - Note any error messages
   - Report with error text

---

### Code Viewer Shows Wrong Language

**Symptoms:**
- SQL file highlighted as JavaScript
- TypeScript highlighted as plain text
- Wrong colors/formatting

**Causes:**
- File extension not recognized
- Language detection logic issue
- CodeMirror not initialized

**Solutions:**

1. **Check File Extension**
   - Hover over file in tree
   - Verify extension (.ts, .sql, .tsx, etc.)
   - Should be lowercase

2. **Check detectLanguage Function**
   ```typescript
   // In CodeMirror.tsx
   export function detectLanguage(filePath: string) {
     // Extracts extension and maps to language
     const ext = filePath.split('.').pop()?.toLowerCase()
     // Should work for all common types
   }
   ```

3. **Force Refresh**
   - Select different file
   - Select original file again
   - Should re-highlight

4. **Check CodeMirror Installation**
   ```bash
   # Verify packages installed
   npm list @codemirror/lang-javascript
   npm list @codemirror/lang-sql
   # Should show installed versions
   ```

---

### Export Button Not Working

**Symptoms:**
- Click Export, nothing happens
- File doesn't download
- "Exporting..." state never ends

**Causes:**
- Browser popup blocker
- Large project taking time
- Network issue
- File system issue

**Solutions:**

1. **Check Popup Blocker**
   - Browser might be blocking download
   - Check browser notifications
   - Allow downloads from this site
   - Try again

2. **Check Console for Errors**
   ```javascript
   // Open DevTools Console (F12)
   // Look for error messages
   // Check network requests
   ```

3. **Wait for Large Projects**
   - Next.js projects take 5-10 seconds to ZIP
   - Don't click again
   - Wait for file to appear in downloads

4. **Try Different Browser**
   - If Chrome fails, try Firefox
   - Test in different browser
   - Helps identify browser-specific issue

5. **Check Disk Space**
   - Ensure Downloads folder has space
   - Check available space
   - Clear some space if needed

---

### Schema Tab Empty

**Symptoms:**
- Schema tab shows "No database migrations found"
- Expected migrations not showing
- Copy SQL button unavailable

**Causes:**
- Migrations not in artifact
- Wrong file paths
- appType not 'nextjs'

**Solutions:**

1. **Verify Migrations Generated**
   ```javascript
   // In console
   const migrations = artifact.files.filter(f =>
     f.path.includes('migrations') && f.type === 'sql'
   )
   console.log(migrations)  // Should have items
   ```

2. **Check Request Included Database**
   - Request should mention: "database", "tables", "schema"
   - Example: "Build an app with user data and posts"
   - Not: "Build a simple landing page"

3. **Regenerate With Database Keywords**
   - Request with: "SaaS app for task management with database"
   - Should trigger schema generation

---

## Performance Issues

### Slow File Tree Navigation

**Symptoms:**
- Clicking files causes lag
- Tree expansion/collapse slow
- UI feels sluggish

**Solutions:**

1. **Check File Count**
   ```javascript
   console.log(artifact.files.length)
   // Should be <100
   ```

2. **Browser Performance**
   - Close other browser tabs
   - Close other applications
   - Restart browser
   - Use Performance tab in DevTools

3. **Check for Large Files**
   ```javascript
   // Find huge files
   artifact.files
     .sort((a, b) => b.content.length - a.content.length)
     .slice(0, 5)
   ```

4. **Try Simpler Project**
   - Generate smaller project
   - Test performance
   - See if it's project size or system

---

### Code Viewer Slow to Load

**Symptoms:**
- Long delay opening file
- Code takes time to highlight
- UI freezes while loading

**Solutions:**

1. **Check File Size**
   ```javascript
   // Size of selected file
   const file = artifact.files.find(f => f.path === selectedPath)
   console.log(file.content.length)  // bytes
   // Should be <100KB for most files
   ```

2. **Restart Dev Server**
   ```bash
   # Kill server (Ctrl+C)
   npm run dev
   # Fresh start
   ```

3. **Clear Browser Cache**
   - DevTools Settings → Network → Disable cache
   - Hard refresh (Ctrl+Shift+R)

4. **Check Internet Speed**
   - CodeMirror libraries load from CDN
   - Slow internet = slow highlights
   - Try with better connection

---

### Generation Slow

**Symptoms:**
- Takes >2 minutes to generate
- "Thinking..." for long time
- Very slow response

**Solutions:**

1. **Check LLM Service**
   - OpenRouter might be overloaded
   - Try again later
   - Check status page

2. **Simplify Request**
   - More complex requests take longer
   - Request basic features first
   - Add features incrementally

3. **Check Network**
   ```bash
   # Test connection
   ping openrouter.ai
   # Should be <100ms latency
   ```

4. **Check System Resources**
   ```bash
   # Check CPU/Memory
   top  # macOS/Linux
   taskmgr  # Windows
   # If high usage, close other apps
   ```

---

## Deployment Issues

### Project Won't Deploy to Vercel

**Symptoms:**
- Build fails on Vercel
- Deployment error
- Works locally but not on Vercel

**Common Issues:**

1. **Environment Variables Missing**
   ```bash
   # Add to Vercel project settings
   NEXT_PUBLIC_SUPABASE_URL=your_value
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_value
   SUPABASE_SERVICE_ROLE_KEY=your_value  # If used
   ```

2. **TypeScript Errors**
   ```bash
   # Run locally
   npm run build
   # See what errors
   ```

3. **Node Version Mismatch**
   - Vercel default might be old
   - Set Node 18+ in vercel.json:
   ```json
   {
     "engines": {
       "node": "18.x"
     }
   }
   ```

---

## How to Get Help

### Before Reporting Issue

1. **Check This Guide**
   - Search for your symptom
   - Try suggested solutions
   - Note what works/doesn't

2. **Check Browser Console**
   - Press F12 to open DevTools
   - Click Console tab
   - Copy any error messages

3. **Gather Information**
   ```javascript
   // Helpful debugging info
   console.log('appType:', artifact.appType)
   console.log('files:', artifact.files.length)
   console.log('metadata:', artifact.metadata)
   console.log('browser:', navigator.userAgent)
   ```

### Reporting Issues

Include:
- [ ] Exact request text
- [ ] Error message (from console)
- [ ] Steps to reproduce
- [ ] Browser and Node version
- [ ] Screenshot of issue
- [ ] Console logs

---

## Quick Reference

| Issue | Solution |
|-------|----------|
| Generation slow | Simplify request, check internet |
| Mode wrong | Add SaaS keywords to request |
| npm install fails | Update Node to 18+, clear cache |
| SUPABASE_URL missing | Create .env.local from .env.example |
| RLS error | Check auth.uid() in policy |
| Files not showing | Verify appType is 'nextjs' |
| Export fails | Check popup blocker, disk space |
| Schema empty | Regenerate with database keywords |

---

**Last Updated:** December 2025
**Version:** 1.0
