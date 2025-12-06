import { z } from 'zod';
import { generateText } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { createClient } from '@supabase/supabase-js';
import type { WebsiteArtifact } from '@/types/database';
import { getArchitectPrompt, detectIndustryKey } from '@/config/agentPrompts';
import {
  PATTERN_REGISTRY,
  resolvePatternDependencies,
  mergePatternsIntoProject,
  determineRequiredPatterns,
} from '@/config/codePatterns';
import { getIndustryContext } from '@/config/industryContext';
import { analyzeBusinessPersonality, getDesignAdaptations } from '@/lib/services/businessAnalyzer';

// ============================================
// SCHEMA DEFINITION
// ============================================

export const codeGenSchema = z.object({
  businessDescription: z.string().describe('Description of the business and its purpose'),
  mode: z.enum(['html', 'nextjs']).optional().describe('App mode: html for landing pages, nextjs for full-stack apps'),
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

/**
 * Main entry point for website generation
 * Routes to HTML or Next.js generation based on mode
 */
export async function generateWebsiteFiles(params: z.infer<typeof codeGenSchema> & { projectId: string; modelId?: string; marketResearch?: any; mode?: 'html' | 'nextjs' }) {
  const { mode = 'html' } = params;

  console.log('[Code Tool] Generating ' + mode + ' app');

  if (mode === 'nextjs') {
    return await generateFullStackApp(params);
  } else {
    return await generateHTMLSite(params);
  }
}

/**
 * Generate HTML landing page (existing logic)
 */
async function generateHTMLSite(params: z.infer<typeof codeGenSchema> & { projectId: string; modelId?: string; marketResearch?: any }) {
  const { businessDescription, identity, projectId, modelId, marketResearch } = params;

  try {
    // Initialize OpenRouter client
    const openrouter = createOpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY!,
    });

    // Always use Gemini 3 Pro for best website generation
    const selectedModel = 'google/gemini-3-pro-preview';
    console.log('[Code Tool] Using model:', selectedModel);

    // Get industry context for personalized website generation
    const industryContext = getIndustryContext(businessDescription);
    const personality = analyzeBusinessPersonality(businessDescription);
    const designAdaptations = getDesignAdaptations(personality);

    // Get industry-specific architect prompt
    const industryKey = detectIndustryKey(businessDescription);
    const architectPrompt = getArchitectPrompt('html', industryKey);
    console.log('[Code Tool] Using industry template:', industryKey);

    // Build the prompt with world-class design standards
    const prompt = `${architectPrompt}

===== PROJECT BRIEF =====

Business Description: ${businessDescription}

===== INDUSTRY CONTEXT (PERSONALIZATION) =====
Industry: ${industryContext.industry}
Target Tone: ${industryContext.tone.join(', ')}
Key Content Themes: ${industryContext.contentThemes.join(', ')}

Copywriting Guidelines:
${industryContext.copyGuidelines}

Visual Emphasis:
${industryContext.visualEmphasis}

Recommended CTAs:
${industryContext.ctaLanguage.map((cta, i) => `${i + 1}. "${cta}"`).join('\n')}

Trust Signals to Highlight:
${industryContext.trustSignals.join(', ')}

===== BUSINESS PERSONALITY =====
Tone: ${personality.tone}
Sophistication Level: ${personality.sophistication}
Target Audience: ${personality.targetAudience}
Price Position: ${personality.pricePosition}

Design Recommendations:
- Color Scheme: ${designAdaptations.colorScheme}
- Typography: ${designAdaptations.typography}
- Spacing: ${designAdaptations.spacing}
- Imagery Style: ${designAdaptations.imagery}

${marketResearch ? `
===== COMPETITIVE POSITIONING (FROM MARKET RESEARCH) =====
Market Saturation: ${marketResearch.saturationLevel || 'Not analyzed'}
Competitor Price Range: ${marketResearch.priceRange ? `$${marketResearch.priceRange.min} - $${marketResearch.priceRange.max}` : 'Not analyzed'}
Recommended Strategy: ${marketResearch.recommendedStrategy || 'Not analyzed'}

Key Market Gaps:
${marketResearch.gaps && marketResearch.gaps.length > 0 ? marketResearch.gaps.slice(0, 3).map((gap: string, i: number) => `${i + 1}. ${gap}`).join('\n') : 'Not analyzed'}

Your Unique Differentiators:
${marketResearch.differentiators && marketResearch.differentiators.length > 0 ? marketResearch.differentiators.slice(0, 3).map((diff: string, i: number) => `${i + 1}. ${diff}`).join('\n') : 'Not analyzed'}
` : ''}

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

CONTACT FORM (CRITICAL - MUST INCLUDE):
Include a contact form in your CTA section with these exact fields:
1. Hidden projectId: <input type="hidden" name="projectId" value="__PROJECT_ID__" />
2. Name field: <input type="text" name="name" required placeholder="Your Name" />
3. Email field: <input type="email" name="email" required placeholder="your@email.com" />
4. Company field (optional): <input type="text" name="company" placeholder="Company Name" />
5. Message field: <textarea name="message" placeholder="How can we help?"></textarea>
6. Submit button with id="submit-btn"

The form should NOT have an action attribute - JavaScript will handle submission.

ADVANCED FEATURES (MUST INCLUDE):
CSS (styles.css):
- Custom animations (fade-in, slide-up, scale effects)
- Smooth transitions on hover states
- Gradient backgrounds and glassmorphism
- Advanced typography styles
- Professional spacing and layout
- Form styling with focus states

JavaScript (script.js):
- Smooth scroll to sections
- Mobile menu toggle
- Scroll-triggered animations (elements fade in on scroll)
- Form validation and submission (form handler will be injected)
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

    // Post-process files: inject projectId and form handler
    const apiUrl = process.env.NEXT_PUBLIC_APP_URL || '';

    // Form submission handler to inject into script.js
    const formHandler = `
// Form submission handler - connects to CRM
document.querySelectorAll('form').forEach(form => {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"], #submit-btn');
    const originalText = btn ? btn.textContent : 'Submit';

    try {
      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Sending...';
      }

      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());

      const response = await fetch('${apiUrl}/api/leads/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (result.success) {
        form.innerHTML = '<div class="text-center p-8"><h3 class="text-xl font-bold text-green-600">Thank you!</h3><p class="text-gray-600 mt-2">We\\'ll be in touch soon.</p></div>';
      } else {
        throw new Error(result.error || 'Submission failed');
      }
    } catch (err) {
      console.error('Form submission error:', err);
      if (btn) {
        btn.disabled = false;
        btn.textContent = originalText;
      }
      alert('Something went wrong. Please try again.');
    }
  });
});
`;

    // Process each file
    websiteData.files = websiteData.files.map(file => {
      let content = file.content;

      // Replace projectId placeholder
      content = content.replace(/__PROJECT_ID__/g, projectId);

      // Inject form handler at the end of script.js
      if (file.path === '/script.js') {
        content = content + '\n\n' + formHandler;
      }

      return { ...file, content };
    });

    // Save to Supabase with UPSERT for updates
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
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

/**
 * Generate full-stack Next.js + Supabase application
 */
async function generateFullStackApp(params: z.infer<typeof codeGenSchema> & { projectId: string; modelId?: string; marketResearch?: any }) {
  const { businessDescription, identity, projectId, modelId, marketResearch } = params;

  try {
    console.log('[Code Tool] Starting full-stack generation');

    // Initialize OpenRouter client
    const openrouter = createOpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY!,
    });

    // Determine required patterns from description
    const requiredPatterns = determineRequiredPatterns(businessDescription);
    console.log('[Code Tool] Required patterns:', requiredPatterns);

    // Resolve all pattern dependencies
    const resolvedPatterns = resolvePatternDependencies(requiredPatterns);
    console.log('[Code Tool] Resolved patterns:', resolvedPatterns.map(p => p.id));

    // Get pattern context for prompt
    const patternContext = resolvedPatterns
      .map(p => `Pattern: ${p.id}\n${p.description}\nFiles: ${p.files.map(f => f.path).join(', ')}`)
      .join('\n\n');

    // Build enhanced prompt
    const architectPrompt = getArchitectPrompt('nextjs');
    const fullPrompt = `${architectPrompt}

===== AVAILABLE PATTERNS =====
${patternContext}

===== PROJECT BRIEF =====
Business: ${businessDescription}
${identity ? `Brand: ${identity.name}` : ''}
${marketResearch ? `Market: ${JSON.stringify(marketResearch).substring(0, 200)}...` : ''}

Generate a complete Next.js application using the available patterns.`;

    // Call LLM
    const selectedModel = 'google/gemini-3-pro-preview';
    console.log('[Code Tool] Calling LLM:', selectedModel);

    const { text } = await generateText({
      model: openrouter(selectedModel),
      prompt: fullPrompt,
      temperature: 0.7,
    });

    // Parse response
    let parsedResponse: { files: Array<{ path: string; content: string; type: string }> } = { files: [] };
    try {
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```\n([\s\S]*?)\n```/);
      const jsonString = jsonMatch ? jsonMatch[1] : text;
      parsedResponse = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('[Code Tool] Parse error, attempting to extract JSON...');
      // Fallback: try to find JSON object
      const jsonStartIndex = text.indexOf('{');
      const jsonEndIndex = text.lastIndexOf('}');
      if (jsonStartIndex !== -1 && jsonEndIndex !== -1) {
        try {
          parsedResponse = JSON.parse(text.substring(jsonStartIndex, jsonEndIndex + 1));
        } catch {
          console.error('[Code Tool] Failed to parse LLM response:', text.substring(0, 500));
          throw new Error('LLM did not return valid JSON');
        }
      }
    }

    // Merge patterns with generated files
    const patternFiles = mergePatternsIntoProject(resolvedPatterns, {
      PROJECT_NAME: identity?.name || 'My App',
      PROJECT_SLUG: (identity?.name || 'my-app').toLowerCase().replace(/\s+/g, '-'),
    });

    // Combine all files, with generated files taking precedence
    const fileMap = new Map<string, { path: string; content: string; type: string }>();

    // Add pattern files first
    patternFiles.files.forEach(file => {
      fileMap.set(file.path, file as any);
    });

    // Add/override with generated files
    parsedResponse.files.forEach(file => {
      if (file.content) {
        fileMap.set(file.path, {
          path: file.path,
          content: file.content,
          type: file.type,
        });
      }
    });

    // Ensure essential files
    const allFiles = Array.from(fileMap.values());
    const ensuredFiles = ensureEssentialNextJsFiles(allFiles, identity) as Array<{
      path: string;
      content: string;
      type: 'html' | 'css' | 'js' | 'json' | 'tsx' | 'ts' | 'jsx' | 'sql' | 'env' | 'md';
    }>;

    // Build artifact
    const websiteData: WebsiteArtifact = {
      files: ensuredFiles,
      primaryPage: '/app/page.tsx',
      appType: 'nextjs',
      metadata: {
        patterns: requiredPatterns,
        envVars: {
          required: patternFiles.envVars.required,
          optional: patternFiles.envVars.optional,
        },
        setupInstructions: generateSetupInstructions(requiredPatterns, identity),
        dependencies: patternFiles.dependencies,
      },
    };

    // Save to Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: artifact, error } = await (supabase.from('artifacts') as any)
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
      console.error('Failed to save artifact:', error);
      throw new Error('Failed to save application');
    }

    return {
      success: true,
      artifact,
      summary: `🚀 Generated full-stack Next.js app with ${websiteData.files.length} files (${requiredPatterns.length} patterns)`,
    };
  } catch (error) {
    console.error('[Code Tool] Full-stack generation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Ensure essential Next.js configuration files exist
 */
function ensureEssentialNextJsFiles(
  files: Array<{ path: string; content: string; type: string }>,
  identity?: any
) {
  const fileMap = new Map<string, { path: string; content: string; type: string }>();

  files.forEach(file => {
    fileMap.set(file.path, file);
  });

  // Ensure package.json exists
  if (!fileMap.has('/package.json')) {
    fileMap.set('/package.json', {
      path: '/package.json',
      type: 'json',
      content: JSON.stringify(
        {
          name: (identity?.name || 'my-app').toLowerCase().replace(/\s+/g, '-'),
          version: '0.1.0',
          private: true,
          scripts: {
            dev: 'next dev',
            build: 'next build',
            start: 'next start',
            lint: 'next lint',
          },
          dependencies: {
            next: '15.1.0',
            react: '19.0.0-rc.1',
            'react-dom': '19.0.0-rc.1',
            '@supabase/supabase-js': '2.47.0',
          },
          devDependencies: {
            '@types/node': '20.15.1',
            '@types/react': '18.3.3',
            '@types/react-dom': '18.3.0',
            tailwindcss: '4.0.0',
            typescript: '5.7.0',
          },
        },
        null,
        2
      ),
    });
  }

  // Ensure .env.example exists
  if (!fileMap.has('/.env.example')) {
    fileMap.set('/.env.example', {
      path: '/.env.example',
      type: 'env',
      content: `# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
`,
    });
  }

  // Ensure README.md exists
  if (!fileMap.has('/README.md')) {
    fileMap.set('/README.md', {
      path: '/README.md',
      type: 'md',
      content: `# ${identity?.name || 'Next.js App'}

Generated with Anything Platform.

## Setup

1. Install dependencies:
\`\`\`bash
npm install
\`\`\`

2. Configure environment:
\`\`\`bash
cp .env.example .env.local
\`\`\`

3. Set up database:
- Create a Supabase project
- Run migrations in supabase/migrations/ in order
- Update .env.local with your Supabase credentials

4. Run development server:
\`\`\`bash
npm run dev
\`\`\`

5. Open http://localhost:3000
`,
    });
  }

  return Array.from(fileMap.values());
}

/**
 * Generate setup instructions based on patterns
 */
function generateSetupInstructions(patterns: string[], identity?: any): string {
  let instructions = `# Setup Instructions for ${identity?.name || 'Next.js App'}\n\n`;

  instructions += `## 1. Install Dependencies\n\`\`\`bash\nnpm install\n\`\`\`\n\n`;

  instructions += `## 2. Environment Variables\n`;
  instructions += `Copy \`.env.example\` to \`.env.local\` and fill in:\n`;
  instructions += `- \`NEXT_PUBLIC_SUPABASE_URL\`: Your Supabase project URL\n`;
  instructions += `- \`NEXT_PUBLIC_SUPABASE_ANON_KEY\`: Your Supabase anonymous key\n\n`;

  if (patterns.includes('user-profile-table') || patterns.includes('supabase-auth')) {
    instructions += `## 3. Database Setup\n`;
    instructions += `1. Go to your Supabase project dashboard\n`;
    instructions += `2. Open SQL Editor\n`;
    instructions += `3. Run migrations in \`supabase/migrations/\` in order\n\n`;
  }

  instructions += `## 4. Run Development Server\n\`\`\`bash\nnpm run dev\n\`\`\`\n\n`;
  instructions += `Open [http://localhost:3000](http://localhost:3000)\n`;

  return instructions;
}
