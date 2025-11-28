import { z } from 'zod';
import { generateText } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { createClient } from '@/utils/supabase/server';
import type { WebsiteArtifact } from '@/types/database';

// ============================================
// SCHEMA DEFINITION
// ============================================

export const editWebsiteSchema = z.object({
  editInstructions: z.string().describe('What changes to make to the website (e.g., "change button color to blue", "make hero section taller")'),
});

// ============================================
// TOOL IMPLEMENTATION
// ============================================

export async function editWebsiteFiles(params: z.infer<typeof editWebsiteSchema> & { projectId: string }) {
  const { editInstructions, projectId } = params;

  try {
    console.log('[Edit Website] 🔧 Starting website edit...');
    console.log('[Edit Website] Instructions:', editInstructions);

    // 1. Fetch current website artifact from Supabase
    const supabase = await createClient();
    const { data: artifact, error: fetchError } = await (supabase
      .from('artifacts') as any)
      .select('*')
      .eq('project_id', projectId)
      .eq('type', 'website_code')
      .single();

    if (fetchError || !artifact) {
      console.error('[Edit Website] No existing website found:', fetchError);
      throw new Error('No website found to edit. Generate a website first.');
    }

    const currentWebsite = artifact.data as WebsiteArtifact;
    const htmlFile = currentWebsite.files.find(f => f.path === '/index.html');
    const cssFile = currentWebsite.files.find(f => f.path === '/styles.css');
    const jsFile = currentWebsite.files.find(f => f.path === '/script.js');

    if (!htmlFile) {
      throw new Error('Website has no HTML file');
    }

    console.log('[Edit Website] Current files loaded');

    // 2. Initialize OpenRouter client
    const openrouter = createOpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY!,
    });

    // Use Claude for precise editing
    const selectedModel = 'anthropic/claude-3.5-sonnet';
    console.log('[Edit Website] Using model:', selectedModel);

    // 3. Build the edit prompt
    const prompt = `You are editing an existing website. Your job is to make ONLY the requested changes and keep everything else exactly the same.

===== CURRENT HTML =====
${htmlFile.content}

===== CURRENT CSS =====
${cssFile?.content || '/* No custom CSS */'}

===== CURRENT JAVASCRIPT =====
${jsFile?.content || '// No custom JS'}

===== USER REQUEST =====
${editInstructions}

===== YOUR TASK =====
Make ONLY the changes requested by the user. Do not modify anything else.
Keep the same structure, styling, and functionality unless specifically asked to change it.

Return the COMPLETE updated files in this exact JSON format (no markdown, no explanations):

{
  "files": [
    {
      "path": "/index.html",
      "content": "<!DOCTYPE html>...",
      "type": "html"
    },
    {
      "path": "/styles.css",
      "content": "/* CSS */...",
      "type": "css"
    },
    {
      "path": "/script.js",
      "content": "// JavaScript...",
      "type": "javascript"
    }
  ]
}

CRITICAL: Return complete file contents, not diffs or partial updates.`;

    // 4. Get AI response
    const { text } = await generateText({
      model: openrouter(selectedModel),
      prompt,
      temperature: 0.3, // Lower temperature for more precise edits
    });

    // 5. Parse the response
    let updatedWebsite: WebsiteArtifact;
    try {
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```\n([\s\S]*?)\n```/);
      const jsonString = jsonMatch ? jsonMatch[1] : text;
      const parsed = JSON.parse(jsonString);

      updatedWebsite = {
        files: parsed.files,
        primaryPage: '/index.html',
      };
    } catch (parseError) {
      console.error('[Edit Website] Failed to parse response:', text.slice(0, 500));
      throw new Error('Failed to parse AI response');
    }

    // 6. Save updated artifact with incremented version
    const { data: updatedArtifact, error: saveError } = await (supabase
      .from('artifacts') as any)
      .update({
        data: updatedWebsite,
        version: (artifact.version || 1) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('project_id', projectId)
      .eq('type', 'website_code')
      .select()
      .single();

    if (saveError) {
      console.error('[Edit Website] Failed to save:', saveError);
      throw new Error('Failed to save website updates');
    }

    console.log('[Edit Website] ✅ Website updated successfully');

    return {
      success: true,
      artifact: updatedArtifact,
      summary: `✏️ Website updated: ${editInstructions}`,
    };
  } catch (error) {
    console.error('[Edit Website] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
