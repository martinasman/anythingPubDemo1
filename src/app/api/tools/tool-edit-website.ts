import { z } from 'zod';
import { generateText } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { createClient } from '@supabase/supabase-js';
import { parseHTML } from 'linkedom';
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

interface HTMLEdit {
  selector: string;
  action: 'style' | 'text' | 'attribute' | 'addClass' | 'removeClass';
  property?: string;
  value: string;
  description?: string;
}

interface CSSEdit {
  selector: string;
  property: string;
  value: string;
  description?: string;
}

interface EditResponse {
  htmlEdits?: HTMLEdit[];
  cssEdits?: CSSEdit[];
}

// ============================================
// SCHEMA DEFINITION
// ============================================

export const editWebsiteSchema = z.object({
  editInstructions: z.string().describe('What changes to make to the website (e.g., "change button color to blue", "make hero section taller")'),
  targetPage: z.string().optional().describe('Which page to edit (e.g., "/index.html", "/about/index.html"). Defaults to /index.html'),
});

// ============================================
// HELPER: Extract useful context from HTML
// ============================================

function extractHTMLContext(html: string): string {
  const context: string[] = [];

  // Get all class names used
  const classMatches = html.match(/class="([^"]+)"/g) || [];
  const classes = [...new Set(classMatches.map(m => m.replace('class="', '').replace('"', '')))];
  if (classes.length > 0) {
    context.push(`CSS Classes: ${classes.slice(0, 30).join(', ')}`);
  }

  // Get all IDs
  const idMatches = html.match(/id="([^"]+)"/g) || [];
  const ids = [...new Set(idMatches.map(m => m.replace('id="', '').replace('"', '')))];
  if (ids.length > 0) {
    context.push(`IDs: ${ids.slice(0, 20).join(', ')}`);
  }

  // Get button texts
  const buttons = html.match(/<button[^>]*>([^<]+)<\/button>/g) || [];
  if (buttons.length > 0) {
    context.push(`Buttons: ${buttons.slice(0, 5).join(', ')}`);
  }

  // Get headings
  const h1s = html.match(/<h1[^>]*>([^<]*)<\/h1>/g) || [];
  const h2s = html.match(/<h2[^>]*>([^<]*)<\/h2>/g) || [];
  if (h1s.length > 0 || h2s.length > 0) {
    context.push(`Headings: ${[...h1s, ...h2s].slice(0, 5).join(', ')}`);
  }

  // Get links
  const links = html.match(/<a[^>]*>([^<]*)<\/a>/g) || [];
  if (links.length > 0) {
    context.push(`Links: ${links.slice(0, 5).join(', ')}`);
  }

  return context.join('\n');
}

// ============================================
// HELPER: Escape regex special characters
// ============================================

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ============================================
// APPLY HTML EDITS using DOM
// ============================================

function applyHTMLEdits(html: string, edits: HTMLEdit[]): { html: string; applied: CodeChange[] } {
  const { document } = parseHTML(html);
  const applied: CodeChange[] = [];

  for (const edit of edits) {
    try {
      const elements = document.querySelectorAll(edit.selector);

      if (elements.length === 0) {
        console.warn(`[Edit Website] No elements found for selector: ${edit.selector}`);
        continue;
      }

      for (const el of elements) {
        const beforeState = el.outerHTML?.substring(0, 50) || '';

        switch (edit.action) {
          case 'style':
            if (edit.property) {
              (el as any).style[edit.property] = edit.value;
            }
            break;
          case 'text':
            el.textContent = edit.value;
            break;
          case 'attribute':
            if (edit.property) {
              el.setAttribute(edit.property, edit.value);
            }
            break;
          case 'addClass':
            el.classList.add(edit.value);
            break;
          case 'removeClass':
            el.classList.remove(edit.value);
            break;
        }

        const afterState = el.outerHTML?.substring(0, 50) || '';

        applied.push({
          file: '/index.html',
          description: edit.description || `${edit.action} on ${edit.selector}`,
          before: beforeState,
          after: afterState,
        });
      }

      console.log(`[Edit Website] ✓ Applied ${edit.action} to ${elements.length} element(s): ${edit.selector}`);
    } catch (err) {
      console.error(`[Edit Website] Error applying edit to ${edit.selector}:`, err);
    }
  }

  return { html: document.toString(), applied };
}

// ============================================
// APPLY CSS EDITS
// ============================================

function applyCSSEdits(css: string, edits: CSSEdit[]): { css: string; applied: CodeChange[] } {
  let result = css;
  const applied: CodeChange[] = [];

  for (const edit of edits) {
    try {
      const escapedSelector = escapeRegex(edit.selector);
      const selectorRegex = new RegExp(
        `(${escapedSelector}\\s*\\{[^}]*)\\}`,
        'g'
      );

      const beforeCSS = result.substring(0, 100);

      if (result.match(selectorRegex)) {
        // Selector exists - add/update property
        result = result.replace(selectorRegex, (match, block) => {
          const propRegex = new RegExp(`${escapeRegex(edit.property)}\\s*:[^;]+;?`, 'g');
          if (block.match(propRegex)) {
            // Property exists - update it
            return block.replace(propRegex, `${edit.property}: ${edit.value};`) + '}';
          } else {
            // Add new property before closing brace
            return block.trimEnd() + `\n  ${edit.property}: ${edit.value};\n}`;
          }
        });
      } else {
        // Selector doesn't exist - add new rule at the end
        result += `\n\n${edit.selector} {\n  ${edit.property}: ${edit.value};\n}`;
      }

      applied.push({
        file: '/styles.css',
        description: edit.description || `Set ${edit.property} on ${edit.selector}`,
        before: beforeCSS,
        after: result.substring(0, 100),
      });

      console.log(`[Edit Website] ✓ Applied CSS: ${edit.selector} { ${edit.property}: ${edit.value} }`);
    } catch (err) {
      console.error(`[Edit Website] Error applying CSS edit:`, err);
    }
  }

  return { css: result, applied };
}

// ============================================
// TOOL IMPLEMENTATION - DOM-BASED EDITING
// ============================================

// Image context for vision-based edits
interface ImageContext {
  referenceImages: Array<{ url: string; filename: string; purpose: string; mimeType: string }>;
  contentImages: Array<{ url: string; filename: string; purpose: string; mimeType: string }>;
}

export async function editWebsiteFiles(params: z.infer<typeof editWebsiteSchema> & {
  projectId: string;
  onProgress?: ProgressCallback;
  imageContext?: ImageContext;
  modelId?: string;
}) {
  const { editInstructions, targetPage = '/index.html', projectId, onProgress, imageContext, modelId } = params;

  try {
    console.log('[Edit Website] 🔧 Starting DOM-based website edit...');
    console.log('[Edit Website] Instructions:', editInstructions);
    console.log('[Edit Website] Target page:', targetPage);

    // Stage 1: Fetching current files
    await onProgress?.({ type: 'stage', stage: 'fetch', message: 'Loading website...' });

    // 1. Fetch current website artifact from Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
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

    // Find the target HTML file (default to /index.html)
    const normalizedTarget = targetPage.startsWith('/') ? targetPage : `/${targetPage}`;
    const htmlFile = currentWebsite.files.find(f => f.path === normalizedTarget)
      || currentWebsite.files.find(f => f.path === '/index.html');
    const cssFile = currentWebsite.files.find(f => f.path === '/styles.css');

    if (!htmlFile) {
      throw new Error(`Page ${normalizedTarget} not found`);
    }

    const actualTargetPage = htmlFile.path;
    console.log('[Edit Website] Editing page:', actualTargetPage);

    // Stage 2: Generate changes
    await onProgress?.({ type: 'stage', stage: 'analyze', message: 'Planning changes...' });

    // 2. Initialize OpenRouter client
    const openrouter = createOpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY!,
    });

    // Use the user's selected model, or default to Claude 3.5 Sonnet
    const hasContentImages = imageContext?.contentImages && imageContext.contentImages.length > 0;
    const hasReferenceImages = imageContext?.referenceImages && imageContext.referenceImages.length > 0;
    const selectedModel = modelId || 'anthropic/claude-3.5-sonnet';
    const modelDisplayName = selectedModel.split('/').pop() || selectedModel;

    // Show model being used in chat
    await onProgress?.({ type: 'stage', stage: 'model', message: `Using ${modelDisplayName}...` });

    console.log('[Edit Website] Using model:', selectedModel);
    if (hasContentImages) console.log('[Edit Website] Content images to embed:', imageContext!.contentImages.length);
    if (hasReferenceImages) console.log('[Edit Website] Reference images:', imageContext!.referenceImages.length);

    // Build image context instructions if images provided
    let imageInstructions = '';
    if (imageContext?.contentImages && imageContext.contentImages.length > 0) {
      imageInstructions += `

═══════════════════════════════════════════════════════════════════
USER UPLOADED IMAGES - YOU MUST USE THESE
═══════════════════════════════════════════════════════════════════

The user uploaded ${imageContext.contentImages.length} image(s) to add to their website.
Use these EXACT URLs:

${imageContext.contentImages.map((img, i) => `IMAGE ${i + 1}: ${img.url}`).join('\n')}

HOW TO ADD IMAGES:

1. As BACKGROUND IMAGE (for hero, sections, etc.):
   {"cssEdits": [{"selector": ".hero, section:first-of-type", "property": "background-image", "value": "url('${imageContext.contentImages[0].url}')", "description": "Add background image"}]}
   Also add: {"cssEdits": [{"selector": ".hero", "property": "background-size", "value": "cover", "description": "Cover background"}]}
   Also add: {"cssEdits": [{"selector": ".hero", "property": "background-position", "value": "center", "description": "Center background"}]}

2. As IMG TAG (for content areas):
   {"htmlEdits": [{"selector": ".hero img, .featured img", "action": "attribute", "property": "src", "value": "${imageContext.contentImages[0].url}", "description": "Set image source"}]}

IMPORTANT: The user said "${editInstructions}" - use the image URL above to fulfill this request!
`;
    }

    if (hasReferenceImages) {
      imageInstructions += `\n\nDESIGN REFERENCE:\nThe user has provided ${imageContext!.referenceImages.length} reference image(s) showing their desired style.
Analyze these images and match their:
- Color scheme (extract dominant colors)
- Typography style
- Spacing and layout feel
- Overall aesthetic`;
    }

    // 3. Build the DOM-BASED prompt
    const prompt = `You are making targeted edits to a website using CSS selectors.${imageInstructions}

USER REQUEST: "${editInstructions}"

WEBSITE STRUCTURE:
${extractHTMLContext(htmlFile.content)}

Return ONLY a JSON object (no markdown, no explanation) with edits to make:

{
  "htmlEdits": [
    {
      "selector": "CSS selector to target element(s)",
      "action": "style | text | attribute | addClass | removeClass",
      "property": "for style: CSS property name, for attribute: attribute name",
      "value": "new value",
      "description": "brief description"
    }
  ],
  "cssEdits": [
    {
      "selector": "CSS selector (e.g., button, .class, #id)",
      "property": "CSS property",
      "value": "new value",
      "description": "brief description"
    }
  ]
}

COMMON PATTERNS:
- Round buttons: {"htmlEdits": [{"selector": "button, .btn, a.button, [type='submit']", "action": "style", "property": "borderRadius", "value": "9999px", "description": "Round all buttons"}]}
- Bigger text: {"htmlEdits": [{"selector": "h1", "action": "style", "property": "fontSize", "value": "4rem", "description": "Increase heading size"}]}
- Change text: {"htmlEdits": [{"selector": ".hero h1, h1", "action": "text", "value": "New Headline", "description": "Update heading text"}]}
- Darker background: {"cssEdits": [{"selector": "body", "property": "background-color", "value": "#1a1a2e", "description": "Darken background"}]}
- Button color: {"cssEdits": [{"selector": "button, .btn", "property": "background-color", "value": "#3b82f6", "description": "Change button color"}]}
- More padding: {"htmlEdits": [{"selector": ".hero, section", "action": "style", "property": "padding", "value": "80px 20px", "description": "Increase section padding"}]}

RULES:
1. Use broad selectors to catch all matching elements (e.g., "button, .btn, a.button")
2. For style changes, use camelCase property names (borderRadius, not border-radius)
3. For CSS edits, use kebab-case (background-color)
4. Return 1-5 edits maximum
5. Return ONLY valid JSON, nothing else

JSON:`;

    // 4. Get AI response
    await onProgress?.({ type: 'stage', stage: 'generate', message: 'Generating changes...' });

    let text: string;

    try {
      if (hasReferenceImages) {
        // Build multimodal message with images for vision model
        type MessageContent =
          | { type: 'text'; text: string }
          | { type: 'image'; image: string; mimeType: string };

        const messageContent: MessageContent[] = [];

        // Add reference images (fetch and convert to base64)
        for (const img of imageContext!.referenceImages) {
          try {
            const response = await fetch(img.url);
            const buffer = await response.arrayBuffer();
            const base64 = Buffer.from(buffer).toString('base64');
            messageContent.push({
              type: 'image',
              image: base64,
              mimeType: img.mimeType || 'image/jpeg',
            });
          } catch (err) {
            console.error('[Edit Website] Failed to fetch reference image:', img.url, err);
          }
        }

        // Add text prompt
        messageContent.push({ type: 'text', text: prompt });

        const result = await generateText({
          model: openrouter(selectedModel),
          messages: [{ role: 'user', content: messageContent }],
          temperature: 0.1,
          maxOutputTokens: 1000,
        });
        text = result.text;
      } else {
        // Standard text-only call
        const result = await generateText({
          model: openrouter(selectedModel),
          prompt,
          temperature: 0.1,
          maxOutputTokens: 1000,
        });
        text = result.text;
      }
    } catch (apiError) {
      console.error('[Edit Website] API call failed:', apiError);
      const errorMessage = apiError instanceof Error ? apiError.message : 'Unknown error';
      throw new Error(`AI API error: ${errorMessage}. Try selecting a different model.`);
    }

    // Validate we got a response
    if (!text || text.trim() === '') {
      console.error('[Edit Website] Empty response from model:', selectedModel);
      const modelName = selectedModel.split('/').pop() || selectedModel;
      throw new Error(`Model "${modelName}" returned empty response. Please try again or select a different model.`);
    }

    console.log('[Edit Website] AI response:', text.substring(0, 300));

    // Stage 3: Apply changes
    await onProgress?.({ type: 'stage', stage: 'apply', message: 'Applying changes...' });

    // 5. Parse the response
    let editResponse: EditResponse = { htmlEdits: [], cssEdits: [] };
    try {
      let jsonString = text.trim();

      // Remove markdown code blocks if present
      const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonString = jsonMatch[1];
      } else {
        // Find JSON object directly
        const objMatch = text.match(/\{[\s\S]*\}/);
        if (objMatch) {
          jsonString = objMatch[0];
        }
      }

      editResponse = JSON.parse(jsonString.trim());
    } catch (parseError) {
      console.error('[Edit Website] Failed to parse response:', parseError);
      console.error('[Edit Website] Raw text:', text);
      throw new Error('Failed to parse AI response. Try rephrasing your edit request.');
    }

    const htmlEdits = editResponse.htmlEdits || [];
    const cssEdits = editResponse.cssEdits || [];

    if (htmlEdits.length === 0 && cssEdits.length === 0) {
      throw new Error('No changes detected. Try being more specific about what to change.');
    }

    const totalEdits = htmlEdits.length + cssEdits.length;
    await onProgress?.({ type: 'stage', stage: 'edits', message: `Applying ${totalEdits} change${totalEdits !== 1 ? 's' : ''}...` });

    console.log(`[Edit Website] Applying ${htmlEdits.length} HTML edits and ${cssEdits.length} CSS edits`);

    // 6. Apply edits
    const allChanges: CodeChange[] = [];
    const updatedFiles = [...currentWebsite.files];

    // Apply HTML edits to target page
    if (htmlEdits.length > 0) {
      const htmlIndex = updatedFiles.findIndex(f => f.path === actualTargetPage);
      if (htmlIndex !== -1) {
        const pageName = actualTargetPage.split('/').pop() || 'page';
        // Emit progress: editing this file
        await onProgress?.({ type: 'stage', stage: 'edit_html', message: `Editing ${pageName}...` });

        const { html: newHtml, applied } = applyHTMLEdits(updatedFiles[htmlIndex].content, htmlEdits);
        updatedFiles[htmlIndex].content = newHtml;
        // Update file paths in applied changes to reflect actual target
        allChanges.push(...applied.map(c => ({ ...c, file: actualTargetPage })));

        // Emit progress: file edited
        await onProgress?.({ type: 'stage', stage: 'done_html', message: `Edited ${pageName}` });

        for (const change of applied) {
          await onProgress?.({
            type: 'change',
            file: change.file,
            description: change.description,
            before: change.before,
            after: change.after,
          });
        }
      }
    }

    // Apply CSS edits
    if (cssEdits.length > 0 && cssFile) {
      const cssIndex = updatedFiles.findIndex(f => f.path === '/styles.css');
      if (cssIndex !== -1) {
        // Emit progress: editing this file
        await onProgress?.({ type: 'stage', stage: 'edit_css', message: 'Editing styles.css...' });

        const { css: newCss, applied } = applyCSSEdits(updatedFiles[cssIndex].content, cssEdits);
        updatedFiles[cssIndex].content = newCss;
        allChanges.push(...applied);

        // Emit progress: file edited
        await onProgress?.({ type: 'stage', stage: 'done_css', message: 'Edited styles.css' });

        for (const change of applied) {
          await onProgress?.({
            type: 'change',
            file: change.file,
            description: change.description,
            before: change.before,
            after: change.after,
          });
        }
      }
    }

    if (allChanges.length === 0) {
      throw new Error('Could not apply any changes. The selectors may not match any elements.');
    }

    // Stage 4: Save
    await onProgress?.({ type: 'stage', stage: 'save', message: 'Saving...' });

    // 7. Save updated artifact (preserve existing metadata)
    const updatedWebsite: WebsiteArtifact = {
      ...currentWebsite,
      files: updatedFiles,
    };

    // Save previous state for undo capability
    const { error: saveError } = await (supabase
      .from('artifacts') as any)
      .update({
        data: updatedWebsite,
        previous_data: currentWebsite, // Store previous version for undo
        version: (artifact.version || 1) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('project_id', projectId)
      .eq('type', 'website_code');

    if (saveError) {
      console.error('[Edit Website] Failed to save:', saveError);
      throw new Error('Failed to save website updates');
    }

    console.log(`[Edit Website] ✅ Done! Applied ${allChanges.length} changes`);

    return {
      success: true,
      changesApplied: allChanges.length,
      changes: allChanges,
      summary: `✏️ Made ${allChanges.length} change${allChanges.length > 1 ? 's' : ''}: ${allChanges.map(c => c.description).join(', ')}`,
    };
  } catch (error) {
    console.error('[Edit Website] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
