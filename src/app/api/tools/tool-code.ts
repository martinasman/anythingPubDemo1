import { z } from 'zod';
import { generateText } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { createClient } from '@/utils/supabase/server';
import type { WebsiteArtifact } from '@/types/database';
import { ARCHITECT_SYSTEM_PROMPT } from '@/config/agentPrompts';

// ============================================
// SCHEMA DEFINITION
// ============================================

export const codeGenSchema = z.object({
  businessDescription: z.string().describe('Description of the business and its purpose'),
  identity: z
    .object({
      name: z.string(),
      colors: z.object({
        primary: z.string(),
        secondary: z.string(),
        accent: z.string(),
      }),
      font: z.string(),
      tagline: z.string().optional(),
      logoUrl: z.string().optional().describe('Base64 data URL of the generated logo'),
    })
    .optional()
    .describe('Brand identity to use for styling'),
});

// ============================================
// TOOL IMPLEMENTATION
// ============================================

export async function generateWebsiteFiles(params: z.infer<typeof codeGenSchema> & { projectId: string; modelId?: string }) {
  const { businessDescription, identity, projectId, modelId } = params;

  try {
    // Initialize OpenRouter client
    const openrouter = createOpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY!,
    });

    // Always use Gemini 3 Pro for best website generation
    const selectedModel = 'google/gemini-3-pro-preview';
    console.log('[Code Tool] Using model:', selectedModel);

    // Build the prompt with world-class design standards
    const prompt = `${ARCHITECT_SYSTEM_PROMPT}

===== PROJECT BRIEF =====

Business Description: ${businessDescription}

${
  identity
    ? `
===== BRAND IDENTITY (MANDATORY TO USE) =====

Business Name: ${identity.name}
Tagline: ${identity.tagline || 'Not provided'}
${identity.logoUrl ? `Logo URL: ${identity.logoUrl}` : ''}

BRAND COLORS (YOU MUST USE THESE EXACT HEX CODES):
- Primary Color: ${identity.colors.primary} (Use for main headlines, CTA buttons, key accents)
- Secondary Color: ${identity.colors.secondary} (Use for sub-sections, backgrounds, supporting elements)
- Accent Color: ${identity.colors.accent} (Use for highlights, hover states, special callouts)

Font Family: ${identity.font}

${identity.logoUrl ? `
LOGO PLACEMENT (CRITICAL - YOU MUST INCLUDE THE LOGO):
1. Header/Navigation: Place the logo in the top-left of the header
   <img src="${identity.logoUrl}" alt="${identity.name}" class="h-10 w-auto" />
2. Footer: Include a smaller version of the logo in the footer
3. The logo is a base64 data URL - use it directly in the src attribute
4. DO NOT use placeholder or generic logos - use the EXACT URL provided above
` : ''}

CRITICAL: DO NOT change these colors. DO NOT generate new colors. USE THE EXACT HEX CODES PROVIDED ABOVE.
You must apply these colors throughout the entire website in your CSS file.
Example CSS you MUST include:
- Use ${identity.colors.primary} for buttons, headings, borders
- Use ${identity.colors.secondary} for section backgrounds, cards
- Use ${identity.colors.accent} for highlights, icons, accents
`
    : `
Note: Generate appropriate colors and branding based on the business description.
`
}

===== YOUR TASK =====

Generate a stunning, production-ready landing page with SEPARATE HTML, CSS, and JavaScript files.

CRITICAL REQUIREMENTS:
1. Use Tailwind CSS CDN (v3.4+) for base styling
2. Include Google Fonts: ${identity?.font || 'Inter'}
3. Mobile-first responsive design
4. Semantic HTML5 structure
5. SEO-optimized meta tags
6. Accessibility features (ARIA labels)

SECTIONS TO INCLUDE:
1. Hero with bold headline, ${identity?.tagline ? `tagline: "${identity.tagline}"` : 'compelling subheadline'}, and CTA
2. Features/Benefits in Bento grid layout (3-6 features)
3. Social proof or testimonials
4. Final CTA section

ADVANCED FEATURES (MUST INCLUDE):
CSS (styles.css):
- Custom animations (fade-in, slide-up, scale effects)
- Smooth transitions on hover states
- Gradient backgrounds and glassmorphism
- Advanced typography styles
- Professional spacing and layout

JavaScript (script.js):
- Smooth scroll to sections
- Mobile menu toggle
- Scroll-triggered animations (elements fade in on scroll)
- Form validation
- Interactive hover effects
- Loading animations

Return EXACTLY 3 files in this JSON format (NO markdown, NO explanations):

{
  "files": [
    {
      "path": "/index.html",
      "content": "<!DOCTYPE html>...",
      "type": "html"
    },
    {
      "path": "/styles.css",
      "content": "/* Custom CSS */...",
      "type": "css"
    },
    {
      "path": "/script.js",
      "content": "// Interactive JavaScript...",
      "type": "javascript"
    }
  ]
}`;

    // Generate the code using LLM
    const { text } = await generateText({
      model: openrouter(selectedModel),
      prompt,
      temperature: 0.7,
    });

    // Parse the LLM response
    let websiteData: WebsiteArtifact;
    try {
      // Try to extract JSON from markdown code blocks if present
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```\n([\s\S]*?)\n```/);
      const jsonString = jsonMatch ? jsonMatch[1] : text;
      const parsed = JSON.parse(jsonString);

      websiteData = {
        files: parsed.files,
        primaryPage: '/index.html',
      };
    } catch (parseError) {
      console.error('Failed to parse LLM response:', text);
      throw new Error('LLM did not return valid JSON');
    }

    // Save to Supabase with UPSERT for updates
    const supabase = await createClient();
    const { data: artifact, error } = await (supabase
      .from('artifacts') as any)
      .upsert(
        {
          project_id: projectId,
          type: 'website_code',
          data: websiteData,
          version: 1,
        },
        {
          onConflict: 'project_id,type',
        }
      )
      .select()
      .single();

    if (error) {
      console.error('Failed to save website artifact:', error);
      throw new Error('Failed to save website code');
    }

    return {
      success: true,
      artifact,
      summary: `🏗️ Generated ${websiteData.files.length} files with ${identity?.name || 'custom'} branding`,
    };
  } catch (error) {
    console.error('Website generation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
