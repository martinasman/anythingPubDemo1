import { z } from 'zod';
import { generateText } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { createClient } from '@supabase/supabase-js';
import type { WebsiteArtifact } from '@/types/database';

// ============================================
// TYPES
// ============================================

export interface CodeChange {
  file: string;
  description: string;
  before?: string;
  after?: string;
}

export interface ProgressUpdate {
  type: 'stage' | 'change';
  stage?: string;
  message?: string;
  file?: string;
  description?: string;
  before?: string;
  after?: string;
}

type ProgressCallback = (update: ProgressUpdate) => Promise<void>;

// Image context for vision-based edits
interface ImageContext {
  referenceImages: Array<{ url: string; filename: string; purpose: string; mimeType: string }>;
  contentImages: Array<{ url: string; filename: string; purpose: string; mimeType: string }>;
}

// ============================================
// SCHEMA DEFINITION
// ============================================

export const editWebsiteSchema = z.object({
  editInstructions: z.string().describe('What changes to make to the website (e.g., "change button color to blue", "make hero section taller")'),
  targetPage: z.string().optional().describe('Which page to edit (e.g., "/index.html", "/about/index.html"). Defaults to /index.html'),
});

// ============================================
// SIMPLE DIRECT EDIT - No more selector nonsense
// ============================================

export async function editWebsiteFiles(params: z.infer<typeof editWebsiteSchema> & {
  projectId: string;
  onProgress?: ProgressCallback;
  imageContext?: ImageContext;
  modelId?: string;
  leadId?: string; // Optional lead ID for lead website editing
}) {
  const { editInstructions, targetPage = '/index.html', projectId, onProgress, imageContext, modelId, leadId } = params;

  try {
    console.log('[Edit Website] ========================================');
    console.log('[Edit Website] STARTING EDIT');
    console.log('[Edit Website] Instructions:', editInstructions);
    console.log('[Edit Website] Target page:', targetPage);
    console.log('[Edit Website] Project ID:', projectId);
    console.log('[Edit Website] Lead ID:', leadId || 'none (main website)');
    console.log('[Edit Website] ========================================');

    // Stage 1: Load current website
    await onProgress?.({ type: 'stage', stage: 'fetch', message: 'Loading current website...' });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    let currentWebsite: WebsiteArtifact;
    let artifact: any;
    let isLeadWebsite = false;
    let leadWebsiteData: any = null;

    // If leadId is provided, fetch from lead_website artifact
    if (leadId) {
      const { data: leadArtifact, error: leadFetchError } = await (supabase
        .from('artifacts') as any)
        .select('*')
        .eq('project_id', projectId)
        .eq('type', 'lead_website')
        .single();

      if (leadFetchError || !leadArtifact) {
        throw new Error('No lead website found to edit. Generate a website for this lead first.');
      }

      // Find the specific lead's website in the websites array
      const leadWebsite = leadArtifact.data?.websites?.find((w: any) => w.leadId === leadId);
      if (!leadWebsite) {
        throw new Error(`No website found for lead ${leadId}. Generate a website first.`);
      }

      artifact = leadArtifact;
      leadWebsiteData = leadWebsite;
      isLeadWebsite = true;
      currentWebsite = { files: leadWebsite.files, primaryPage: '/index.html' };
      console.log('[Edit Website] Found lead website with', leadWebsite.files?.length, 'files');
    } else {
      // Standard website_code fetch
      const { data: codeArtifact, error: fetchError } = await (supabase
        .from('artifacts') as any)
        .select('*')
        .eq('project_id', projectId)
        .eq('type', 'website_code')
        .single();

      if (fetchError || !codeArtifact) {
        throw new Error('No website found to edit. Generate a website first.');
      }

      artifact = codeArtifact;
      currentWebsite = codeArtifact.data as WebsiteArtifact;
    }

    // Find the target HTML file
    const normalizedTarget = targetPage.startsWith('/') ? targetPage : `/${targetPage}`;
    const htmlFile = currentWebsite.files.find(f => f.path === normalizedTarget)
      || currentWebsite.files.find(f => f.path === '/index.html');

    if (!htmlFile) {
      throw new Error(`Page ${normalizedTarget} not found`);
    }

    const currentHTML = htmlFile.content;
    console.log('[Edit Website] Current HTML length:', currentHTML.length);

    // Stage 2: Generate edited HTML
    console.log('[Edit Website] Stage 2: Calling AI to apply changes...');

    // Use the model from the picker, fallback to Gemini Flash
    const selectedModel = modelId || 'google/gemini-2.0-flash-001';
    console.log('[Edit Website] Using model:', selectedModel);

    await onProgress?.({ type: 'stage', stage: 'generate', message: `Applying changes with ${selectedModel.split('/').pop()}...` });

    const openrouter = createOpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY!,
    });

    // Build image instructions if provided
    let imageSection = '';
    if (imageContext?.contentImages && imageContext.contentImages.length > 0) {
      imageSection = `
IMAGES TO ADD (use these exact URLs):
${imageContext.contentImages.map((img, i) => `- Image ${i + 1}: ${img.url}`).join('\n')}
`;
    }

    // Build page list for internal linking context
    const htmlPages = currentWebsite.files
      .filter(f => f.path.endsWith('.html'))
      .map(f => {
        // Convert path to display: /about/index.html → /about
        let displayPath = f.path;
        if (displayPath === '/index.html') displayPath = '/';
        else if (displayPath.endsWith('/index.html')) displayPath = displayPath.replace('/index.html', '');
        else displayPath = displayPath.replace('.html', '');
        return displayPath;
      });

    const pageListSection = htmlPages.length > 1 ? `
AVAILABLE PAGES IN THIS WEBSITE:
${htmlPages.map(p => `- ${p}`).join('\n')}

INTERNAL LINKING - When the user asks to link to another page:
- Link to home: href="/"
- Link to about: href="/about"
- Link to services: href="/services"
- Link to contact: href="/contact"
Use the paths listed above. Never use full URLs for internal links.
` : '';

    // FAST PATH: For simple edits (font, color, text), use diff-based approach
    // This is 10x faster than regenerating the entire HTML
    const isSimpleEdit = /^(change|update|make|set|use|switch)\s+(the\s+)?(font|color|text|heading|title|button|background|padding|margin|size)/i.test(editInstructions);

    let newHTML: string = '';

    if (isSimpleEdit) {
      // DIFF-BASED EDITING: Only return the changes
      console.log('[Edit Website] Using FAST diff-based editing');
      await onProgress?.({ type: 'stage', stage: 'analyze', message: 'Analyzing changes needed...' });

      const diffPrompt = `You are making a SURGICAL edit to HTML. Return ONLY the find/replace operations needed.

USER REQUEST: "${editInstructions}"
${imageSection}
CURRENT HTML (excerpt - first 2000 chars for context):
\`\`\`html
${currentHTML.slice(0, 2000)}${currentHTML.length > 2000 ? '\n... [truncated]' : ''}
\`\`\`

Return a JSON array of find/replace operations. Each operation has:
- "find": exact string to find (be precise - include surrounding context to ensure uniqueness)
- "replace": what to replace it with

For font changes, target the font-family in <style> or inline styles.
For color changes, target the color/background-color values.
For text changes, target the exact text content.

Example response for "change font to Poppins":
[{"find": "font-family: Inter", "replace": "font-family: 'Poppins'"},{"find": "font-family: 'Inter'", "replace": "font-family: 'Poppins'"}]

Example response for "change the heading to Hello World":
[{"find": ">Welcome to Our Site<", "replace": ">Hello World<"}]

Return ONLY the JSON array, no explanation.`;

      const diffResult = await generateText({
        model: openrouter('google/gemini-2.0-flash-001'), // Always use fast model for diffs
        prompt: diffPrompt,
        temperature: 0,
        maxOutputTokens: 2000,
      });

      let operations: Array<{find: string; replace: string}> = [];
      try {
        const jsonText = diffResult.text.trim().replace(/^```json?\s*/, '').replace(/\s*```$/, '');
        operations = JSON.parse(jsonText);
      } catch (e) {
        console.log('[Edit Website] Failed to parse diff response, falling back to full edit');
        // Fall through to full edit below
      }

      if (operations.length > 0) {
        newHTML = currentHTML;
        let appliedCount = 0;
        for (const op of operations) {
          if (newHTML.includes(op.find)) {
            newHTML = newHTML.split(op.find).join(op.replace);
            appliedCount++;
          }
        }

        if (appliedCount > 0) {
          console.log('[Edit Website] Applied', appliedCount, 'diff operations');
        } else {
          // None of the finds matched - fall back to full edit
          console.log('[Edit Website] No diff operations matched, falling back to full edit');
          operations = []; // Clear to trigger fallback
        }
      }

      // If diff approach failed, fall through to full edit
      if (operations.length === 0) {
        newHTML = ''; // Will trigger fallback below
      }
    } else {
      newHTML = ''; // Trigger full edit
    }

    // FULL EDIT: For complex changes or if diff failed
    if (!newHTML || newHTML === currentHTML) {
      console.log('[Edit Website] Using full HTML regeneration');

      const prompt = `You are editing a website's HTML. Make ONLY the changes the user requested.

USER REQUEST: "${editInstructions}"
${imageSection}${pageListSection}
CURRENT HTML:
\`\`\`html
${currentHTML}
\`\`\`

INSTRUCTIONS:
1. Follow the user's request EXACTLY - their creative vision takes priority
2. You have FULL permission to:
   - Add new sections anywhere in the page
   - Remove existing sections if requested
   - Reorganize or reorder sections
   - Completely restructure the page if asked
   - Change layouts, styles, and content freely
   - Add or modify navigation links between pages
3. If the user asks for structural changes, DO THEM
4. Return the COMPLETE modified HTML

The user's prompt IS the specification. Do exactly what they ask.

Return ONLY the modified HTML code, nothing else. No markdown, no explanation, just the HTML.`;

      const result = await generateText({
        model: openrouter(selectedModel),
        prompt,
        temperature: 0.1,
        maxOutputTokens: 32000,
      });

      newHTML = result.text.trim();

      // Clean up if AI wrapped in markdown
      if (newHTML.startsWith('```')) {
        const match = newHTML.match(/```(?:html)?\s*([\s\S]*?)\s*```/);
        if (match) {
          newHTML = match[1].trim();
        }
      }
    }

    // Validate we got actual HTML back
    if (!newHTML.includes('<') || newHTML.length < 100) {
      throw new Error('AI did not return valid HTML. Please try again.');
    }

    console.log('[Edit Website] New HTML length:', newHTML.length);

    // Stage 3: Save
    console.log('[Edit Website] Stage 3: Saving to database...');
    await onProgress?.({ type: 'stage', stage: 'save', message: 'Saving changes...' });

    // Update the file content
    const updatedFiles = currentWebsite.files.map(f =>
      f.path === htmlFile.path ? { ...f, content: newHTML } : f
    );

    const newVersion = (artifact.version || 1) + 1;
    console.log('[Edit Website] Saving to DB with version:', newVersion);

    let saveError: any = null;
    let updatedRows: any[] = [];

    if (isLeadWebsite && leadId) {
      // Save to lead_website artifact
      const updatedLeadWebsite = {
        ...leadWebsiteData,
        files: updatedFiles,
      };

      // Replace this lead's website in the websites array
      const updatedWebsites = artifact.data.websites.map((w: any) =>
        w.leadId === leadId ? updatedLeadWebsite : w
      );

      const { data, error } = await (supabase
        .from('artifacts') as any)
        .update({
          data: { websites: updatedWebsites },
          version: newVersion,
          updated_at: new Date().toISOString(),
        })
        .eq('project_id', projectId)
        .eq('type', 'lead_website')
        .select();

      saveError = error;
      updatedRows = data || [];
      console.log('[Edit Website] Saved lead website for lead:', leadId);
    } else {
      // Standard website_code save
      const updatedWebsite: WebsiteArtifact = {
        ...currentWebsite,
        files: updatedFiles,
      };

      const { data, error } = await (supabase
        .from('artifacts') as any)
        .update({
          data: updatedWebsite,
          version: newVersion,
          updated_at: new Date().toISOString(),
        })
        .eq('project_id', projectId)
        .eq('type', 'website_code')
        .select();

      saveError = error;
      updatedRows = data || [];
    }

    console.log('[Edit Website] Supabase response - error:', saveError, 'rows:', updatedRows?.length);

    if (saveError) {
      console.error('[Edit Website] Save error:', saveError);
      throw new Error('Failed to save website updates');
    }

    if (!updatedRows || updatedRows.length === 0) {
      console.error('[Edit Website] NO ROWS UPDATED! This means the .eq() filters did not match any artifact.');
      throw new Error('No artifact found to update - check project_id and type');
    }

    console.log('[Edit Website] Successfully saved! New version in DB:', updatedRows[0]?.version);
    console.log('[Edit Website] ========================================');
    console.log('[Edit Website] EDIT COMPLETE');
    console.log('[Edit Website] Saved version:', newVersion);
    console.log('[Edit Website] HTML length changed:', currentHTML.length, '->', newHTML.length);
    console.log('[Edit Website] Is lead website:', isLeadWebsite);
    console.log('[Edit Website] ========================================');

    await onProgress?.({
      type: 'change',
      file: htmlFile.path,
      description: `✓ ${editInstructions}`,
    });

    return {
      success: true,
      changesApplied: 1,
      changes: [{
        file: htmlFile.path,
        description: editInstructions,
      }],
      summary: `Successfully updated ${htmlFile.path}`,
    };

  } catch (error) {
    console.error('[Edit Website] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
