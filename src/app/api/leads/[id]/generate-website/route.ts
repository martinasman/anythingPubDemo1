/**
 * Generate Website Preview for Lead
 *
 * Creates an industry-specific website preview for a lead
 * that can be shared with them via a preview link.
 */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { getIndustryWebsiteStyle, getArchitectPrompt, detectIndustryKey } from '@/config/agentPrompts';
import { extractWebsiteContent } from '@/lib/services/websiteAnalyzer';
import { selectStyle, formatStyleName, type DesignStyle } from '@/lib/services/styleSelector';
import { getIndustryContext } from '@/config/industryContext';
import { analyzeBusinessPersonality, getDesignAdaptations } from '@/lib/services/businessAnalyzer';
import { nanoid } from 'nanoid';
import type { LeadWebsiteArtifact } from '@/types/database';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

interface AIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

// Helper to format SSE messages
function formatSSE(event: string, data: any): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Create streaming response
  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  let currentStage = 'validation';

  // Helper to emit SSE progress events
  const emitProgress = async (stage: string, message: string) => {
    const sseData = formatSSE('progress', { stage, message });
    await writer.write(encoder.encode(sseData));
    console.log(`[Progress] ${stage}: ${message}`);
  };

  // Start async processing
  (async () => {
    try {
      const supabase = createAdminClient();
      const { id: leadId } = await params;
      const body = await request.json();
      const { industry, businessName, projectId, websiteUrl } = body;

      if (!leadId) {
        const errorData = formatSSE('error', { error: 'Lead ID is required', stage: currentStage });
        await writer.write(encoder.encode(errorData));
        await writer.close();
        return;
      }

      if (!projectId) {
        const errorData = formatSSE('error', { error: 'Project ID is required', stage: currentStage });
        await writer.write(encoder.encode(errorData));
        await writer.close();
        return;
      }

      // Verify project exists
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('id')
        .eq('id', projectId)
        .single();

      if (projectError || !project) {
        const errorData = formatSSE('error', { error: 'Invalid project ID', stage: currentStage });
        await writer.write(encoder.encode(errorData));
        await writer.close();
        return;
      }

      // Emit validation complete
      await emitProgress('validation', 'Inputs validated successfully');

      let selectedStyle: DesignStyle | null = null;
      let extractedContent = null;
      let sourceUrl = null;

      // If websiteUrl provided, extract content and select style
      if (websiteUrl) {
        currentStage = 'fetch';
        await emitProgress('fetch', 'Fetching website content...');
        sourceUrl = websiteUrl;
        extractedContent = await extractWebsiteContent(websiteUrl);
        await emitProgress('fetch', 'Content extracted successfully');

        // Get recent styles to avoid repetition
        const { data: artifact } = await supabase
          .from('artifacts')
          .select('*')
          .eq('project_id', projectId)
          .eq('type', 'lead_website')
          .single();

        const leadWebsites = artifact?.data?.websites?.filter((w: any) => w.leadId === leadId) || [];
        const recentStyles = leadWebsites
          .slice(0, 5)
          .map((w: any) => w.designStyle)
          .filter(Boolean);

        // Select style based on extracted content and industry
        currentStage = 'analysis';
        await emitProgress('analysis', 'Analyzing website structure...');
        selectedStyle = selectStyle({
          leadId,
          industry: industry || 'default',
          sourceStructure: extractedContent.structure.layout,
          recentStyles,
        });
        await emitProgress('analysis', `Style selected: ${selectedStyle ? formatStyleName(selectedStyle) : 'default'}`);
      }

      // Generate preview token
      const previewToken = nanoid(21);

      // Build the prompt for website generation
      const prompt = buildWebsitePrompt(
        businessName,
        industry,
        selectedStyle,
        extractedContent
      );

      // Generate website using AI
      currentStage = 'generation';
      const websiteFiles = await generateWebsiteWithAI(prompt, industry, emitProgress);

      if (!websiteFiles) {
        const errorData = formatSSE('error', { error: 'Failed to generate website', stage: currentStage });
        await writer.write(encoder.encode(errorData));
        await writer.close();
        return;
      }

      // Calculate expiration (30 days from now)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      // Save to artifacts table
      currentStage = 'database';
      await emitProgress('database', 'Preparing to save preview...');
      const websiteArtifact = {
        leadId,
        leadName: businessName,
        previewToken,
        files: websiteFiles,
        expiresAt: expiresAt.toISOString(),
        designStyle: selectedStyle,
        sourceUrl: sourceUrl,
      };

      // Fetch existing artifact or create new
      await emitProgress('database', 'Checking existing artifacts...');
      const { data: existingArtifact } = await supabase
        .from('artifacts')
        .select('*')
        .eq('project_id', projectId)
        .eq('type', 'lead_website')
        .single();

      const websites = existingArtifact?.data?.websites || [];

      // Add or replace website for this lead
      const updatedWebsites = [
        ...websites.filter((w: any) => w.leadId !== leadId),
        websiteArtifact
      ];

      await emitProgress('database', 'Saving website preview...');
      const { error: insertError } = await supabase
        .from('artifacts')
        .upsert({
          project_id: projectId,
          type: 'lead_website',
          data: { websites: updatedWebsites }
        }, {
          onConflict: 'project_id,type'
        });

      if (insertError) {
        console.error('[GenerateWebsite] Error saving website:', insertError);
        console.error('[GenerateWebsite] Insert data:', {
          project_id: projectId,
          lead_id: leadId,
          preview_token: previewToken,
          has_files: !!websiteFiles,
          files_count: websiteFiles?.length,
        });

        let errorMessage = 'Failed to save website preview';
        if (insertError.code === '23503') {
          errorMessage = 'Database constraint error. Please check that the project and lead exist.';
        } else if (insertError.code === '23505') {
          errorMessage = 'Preview token already exists. Please try again.';
        }

        const errorData = formatSSE('error', { error: errorMessage, stage: currentStage });
        await writer.write(encoder.encode(errorData));
        await writer.close();
        return;
      }

      // Also update the leads artifact if it exists
      if (projectId) {
        const { data: artifact } = await supabase
          .from('artifacts')
          .select('*')
          .eq('project_id', projectId)
          .eq('type', 'leads')
          .single();

        if (artifact) {
          const leadsData = artifact.data;
          const updatedLeads = leadsData.leads?.map((lead: any) =>
            lead.id === leadId ? { ...lead, previewToken } : lead
          );

          await supabase
            .from('artifacts')
            .update({
              data: { ...leadsData, leads: updatedLeads },
              updated_at: new Date().toISOString(),
            })
            .eq('id', artifact.id);
        }
      }

      const previewUrl = `/preview/${previewToken}`;

      // Emit success event
      await emitProgress('database', 'Preview saved successfully!');
      const successData = formatSSE('success', {
        previewToken,
        previewUrl,
        expiresAt: expiresAt.toISOString(),
        designStyle: selectedStyle ? formatStyleName(selectedStyle) : null,
      });
      await writer.write(encoder.encode(successData));
    } catch (error) {
      console.error('[GenerateWebsite] Error at stage', currentStage, ':', error);

      let errorMessage = 'Failed to generate website';

      if (error instanceof Error) {
        if (error.message.includes('OpenRouter API error: 429')) {
          errorMessage = 'AI rate limit exceeded. Wait 1-2 minutes and retry.';
        } else if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
          errorMessage = 'Connection timeout. Try again or generate without analyzing the URL.';
        } else if (error.message.includes('ENOTFOUND') || error.message.includes('404')) {
          errorMessage = 'Website not found. Verify the URL is correct.';
        } else if (error.message.includes('certificate') || error.message.includes('SSL')) {
          errorMessage = 'SSL certificate error. Source website may have security issues.';
        } else if (error.message.includes('database') || error.message.includes('supabase')) {
          errorMessage = 'Database error. Check connection and retry.';
        } else {
          errorMessage = error.message.substring(0, 100);
        }
      }

      const errorData = formatSSE('error', { error: errorMessage, stage: currentStage });
      await writer.write(encoder.encode(errorData));
    } finally {
      await writer.close();
    }
  })();

  // Return streaming response
  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

function buildWebsitePrompt(
  businessName: string,
  industry: string,
  forcedStyle?: DesignStyle | null,
  extractedContent?: any
): string {
  // Get industry context and personality for personalized design
  const industryContext = getIndustryContext(industry);
  const personality = analyzeBusinessPersonality(industry);
  const designAdaptations = getDesignAdaptations(personality);

  let prompt = `Generate a STUNNING, industry-specific landing page for:

BUSINESS: ${businessName}
INDUSTRY: ${industry}`;

  // Add industry context to make the design less generic
  prompt += `\n\n===== INDUSTRY CONTEXT =====
Industry: ${industryContext.industry}
Target Tone: ${industryContext.tone.join(', ')}
Key Content Themes: ${industryContext.contentThemes.join(', ')}

Copywriting Guidelines:
${industryContext.copyGuidelines}

Visual Emphasis:
${industryContext.visualEmphasis}

Recommended CTAs:
${industryContext.ctaLanguage.map((cta, i) => `${i + 1}. "${cta}"`).join('\n')}

Trust Signals to Include:
${industryContext.trustSignals.join(', ')}

Section Priorities:
${industryContext.sectionPriorities.map((section, i) => `${i + 1}. ${section}`).join('\n')}`;

  // Add business personality context
  prompt += `\n\n===== BUSINESS PERSONALITY =====
Tone: ${personality.tone}
Sophistication Level: ${personality.sophistication}
Target Audience: ${personality.targetAudience}
Price Position: ${personality.pricePosition}

Design Recommendations:
- Color Scheme: ${designAdaptations.colorScheme}
- Typography: ${designAdaptations.typography}
- Spacing: ${designAdaptations.spacing}
- Imagery Style: ${designAdaptations.imagery}`;

  // If we have a forced style from smart selection
  if (forcedStyle) {
    prompt += `\n\nFORCED_STYLE: ${forcedStyle}`;
  }

  // If we have extracted content from existing website
  if (extractedContent && extractedContent.content) {
    prompt += `\n\n===== EXTRACTED_CONTENT FROM EXISTING WEBSITE =====`;

    if (extractedContent.content.headline) {
      prompt += `\nHeadline: ${extractedContent.content.headline}`;
    }
    if (extractedContent.content.tagline) {
      prompt += `\nTagline: ${extractedContent.content.tagline}`;
    }
    if (extractedContent.content.headings.length > 0) {
      prompt += `\nKey Headings: ${extractedContent.content.headings.join(' | ')}`;
    }
    if (extractedContent.content.paragraphs.length > 0) {
      prompt += `\nContent: ${extractedContent.content.paragraphs.join('\n\n')}`;
    }
    if (extractedContent.colors.primary) {
      prompt += `\n\nColor Preferences:`;
      if (extractedContent.colors.primary) prompt += `\n- Primary: ${extractedContent.colors.primary}`;
      if (extractedContent.colors.secondary) prompt += `\n- Secondary: ${extractedContent.colors.secondary}`;
      if (extractedContent.colors.accent) prompt += `\n- Accent: ${extractedContent.colors.accent}`;
    }

    // Add extracted images to prompt
    if (extractedContent.images && extractedContent.images.length > 0) {
      prompt += `\n\nAvailable Real Images (${extractedContent.images.length} from original website):`;
      extractedContent.images.forEach((img: string, index: number) => {
        prompt += `\n${index + 1}. ${img}`;
      });
    }

    prompt += `\n\nPRESERVE this information in the new design while modernizing and improving clarity.`;
  }

  // If no forced style, use industry-based style selection
  if (!forcedStyle) {
    const industryStyle = getIndustryWebsiteStyle(industry || 'default');
    prompt += `\n\n===== STYLE DIRECTIVE =====
Design Style: ${industryStyle.style}
Color Scheme: ${industryStyle.colorScheme}
Typography: ${industryStyle.typography}
Imagery Guidelines: ${industryStyle.imagery}
CTA Style: ${industryStyle.ctaStyle}

===== SECTIONS TO INCLUDE =====
${industryStyle.sections.map((s, i) => `${i + 1}. ${s}`).join('\n')}`;
  }

  // Build image usage requirements based on extracted content
  const imageRequirements = extractedContent && extractedContent.images && extractedContent.images.length > 0
    ? `   - FIRST CHOICE: Use the ${extractedContent.images.length} real images provided above
   - Select the most appropriate image for each section (hero, features, gallery, etc.)
   - Real images should be used in their original URLs - do NOT modify them
   - If you need more images than provided, use https://placehold.co for additional ones`
    : `   - Use placeholder images from https://placehold.co (e.g., https://placehold.co/600x400/1a1a1a/white?text=Hero+Image)`;

  prompt += `\n\n===== CRITICAL REQUIREMENTS =====
1. IMAGE USAGE PRIORITY:
${imageRequirements}
2. Include realistic placeholder content that matches the industry
3. Mobile-responsive design using Tailwind CSS CDN
4. Include smooth animations and hover effects
5. Professional look that would impress a business owner
6. Add a footer with "Website Preview - Powered by [Your Agency]"

===== OUTPUT FORMAT =====
Return ONLY a valid JSON object:
{
  "files": [
    {
      "path": "/index.html",
      "content": "<!DOCTYPE html>...",
      "type": "html"
    }
  ]
}

No markdown, no explanations - ONLY the JSON.`;

  return prompt;
}

async function generateWebsiteWithAI(
  prompt: string,
  industry?: string,
  onProgress?: (stage: string, message: string) => Promise<void>
): Promise<Array<{ path: string; content: string; type: string }> | null> {
  if (!OPENROUTER_API_KEY) {
    console.error('[GenerateWebsite] No OpenRouter API key');
    return generateFallbackWebsite();
  }

  try {
    await onProgress?.('generation', 'Sending request to AI...');

    // Get industry-specific architect prompt
    const industryKey = detectIndustryKey(industry || '');
    const architectPrompt = getArchitectPrompt('html', industryKey);
    console.log('[GenerateWebsite] Using industry template:', industryKey);

    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-sonnet',
        messages: [
          { role: 'system', content: architectPrompt },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 12000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    await onProgress?.('generation', 'AI is designing your website...');

    const data: AIResponse = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No content in AI response');
    }

    await onProgress?.('generation', 'Processing website files...');

    // Parse JSON from response
    let jsonContent = content;
    if (content.includes('```json')) {
      jsonContent = content.split('```json')[1].split('```')[0];
    } else if (content.includes('```')) {
      jsonContent = content.split('```')[1].split('```')[0];
    }

    const parsed = JSON.parse(jsonContent.trim());

    if (!parsed.files || !Array.isArray(parsed.files)) {
      throw new Error('Invalid response structure');
    }

    await onProgress?.('generation', 'Website generated successfully!');

    return parsed.files;
  } catch (error) {
    console.error('[GenerateWebsite] AI generation failed:', error);
    return generateFallbackWebsite();
  }
}

function generateFallbackWebsite(): Array<{ path: string; content: string; type: string }> {
  return [
    {
      path: '/index.html',
      content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your New Website</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Inter', sans-serif; }
  </style>
</head>
<body class="bg-white text-gray-900">
  <header class="py-4 px-6 flex justify-between items-center border-b">
    <h1 class="text-lg font-bold">Your Business</h1>
    <nav class="flex gap-4">
      <a href="#" class="text-sm text-gray-600 hover:text-gray-900">Services</a>
      <a href="#" class="text-sm text-gray-600 hover:text-gray-900">About</a>
      <a href="#" class="text-sm text-gray-600 hover:text-gray-900">Contact</a>
    </nav>
  </header>

  <main>
    <section class="py-12 px-6 text-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <h2 class="text-3xl font-bold mb-6">Welcome to Your New Website</h2>
      <p class="text-base text-gray-600 mb-8 max-w-2xl mx-auto">
        This is a preview of what your professional website could look like.
        We can customize every aspect to match your brand and business needs.
      </p>
      <button class="bg-blue-600 text-white px-4 py-2 rounded-xl font-semibold text-sm hover:bg-blue-700 transition">
        Get Started
      </button>
    </section>

    <section class="py-12 px-6">
      <h3 class="text-2xl font-bold text-center mb-12">Our Services</h3>
      <div class="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        <div class="p-4 border rounded-xl hover:shadow-lg transition">
          <h4 class="text-lg font-semibold mb-2">Service One</h4>
          <p class="text-sm text-gray-600">Description of your first service offering.</p>
        </div>
        <div class="p-4 border rounded-xl hover:shadow-lg transition">
          <h4 class="text-lg font-semibold mb-2">Service Two</h4>
          <p class="text-sm text-gray-600">Description of your second service offering.</p>
        </div>
        <div class="p-4 border rounded-xl hover:shadow-lg transition">
          <h4 class="text-lg font-semibold mb-2">Service Three</h4>
          <p class="text-sm text-gray-600">Description of your third service offering.</p>
        </div>
      </div>
    </section>
  </main>

  <footer class="py-6 px-6 bg-gray-100 text-center text-xs text-gray-600">
    <p>Website Preview - Powered by Your Agency</p>
  </footer>
</body>
</html>`,
      type: 'html',
    },
  ];
}
