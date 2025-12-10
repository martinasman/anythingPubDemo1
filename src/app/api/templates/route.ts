import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { nanoid } from 'nanoid';
import { analyzeDesignFromUrl, analyzeDesignFromBase64 } from '@/lib/services/designReferences/analyzer';
import { generateText } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import type { TemplateArtifact, TemplatesArtifact, DesignDNA } from '@/types/database';

// Industries list for quick selection
const INDUSTRIES = [
  'plumbers',
  'electricians',
  'hvac',
  'roofers',
  'landscapers',
  'dentists',
  'chiropractors',
  'gyms',
  'yoga-studios',
  'restaurants',
  'cafes',
  'salons',
  'barbers',
  'real-estate',
  'lawyers',
  'accountants',
  'auto-repair',
  'cleaning-services',
  'photographers',
  'other'
];

// POST - Create a new template
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      project_id,
      name,
      industry,
      custom_industry,
      screenshot_url,
      screenshot_base64,
      screenshot_mime_type
    } = body;

    if (!project_id) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    if (!industry) {
      return NextResponse.json({ error: 'Industry is required' }, { status: 400 });
    }

    if (!screenshot_url && !screenshot_base64) {
      return NextResponse.json({ error: 'Screenshot is required (URL or base64)' }, { status: 400 });
    }

    // Verify user owns the project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', project_id)
      .eq('user_id', user.id)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    console.log('[Templates API] Creating template for industry:', industry);

    // Step 1: Analyze the screenshot to extract design DNA
    let designDNA: DesignDNA;
    try {
      if (screenshot_url) {
        const inspiration = await analyzeDesignFromUrl(screenshot_url);
        designDNA = inspirationToDesignDNA(inspiration);
      } else {
        const inspiration = await analyzeDesignFromBase64(
          screenshot_base64,
          screenshot_mime_type || 'image/png'
        );
        designDNA = inspirationToDesignDNA(inspiration);
      }
      console.log('[Templates API] Design DNA extracted:', designDNA.overallVibe);
    } catch (error) {
      console.error('[Templates API] Failed to analyze screenshot:', error);
      return NextResponse.json(
        { error: 'Failed to analyze screenshot' },
        { status: 500 }
      );
    }

    // Step 2: Generate base template website
    let baseWebsite;
    try {
      baseWebsite = await generateBaseTemplate(
        industry === 'other' ? custom_industry || 'business' : industry,
        designDNA
      );
      console.log('[Templates API] Base template generated:', baseWebsite.files.length, 'files');
    } catch (error) {
      console.error('[Templates API] Failed to generate template:', error);
      return NextResponse.json(
        { error: 'Failed to generate template website' },
        { status: 500 }
      );
    }

    // Step 3: Create the template artifact
    const templateId = nanoid();
    const now = new Date().toISOString();

    const newTemplate: TemplateArtifact = {
      id: templateId,
      name: name || `${industry} Template`,
      industry,
      customIndustry: industry === 'other' ? custom_industry : undefined,
      screenshotUrl: screenshot_url,
      designDNA,
      baseWebsite,
      generatedSites: [],
      createdAt: now,
      updatedAt: now,
    };

    // Step 4: Save to artifacts table
    // First check if templates artifact exists
    const { data: existingArtifact } = await (supabase as any)
      .from('artifacts')
      .select('*')
      .eq('project_id', project_id)
      .eq('type', 'templates')
      .single();

    if (existingArtifact) {
      // Append to existing templates
      const existingData = existingArtifact.data as TemplatesArtifact;
      const updatedData: TemplatesArtifact = {
        templates: [...(existingData.templates || []), newTemplate]
      };

      const { error: updateError } = await (supabase as any)
        .from('artifacts')
        .update({
          data: updatedData,
          updated_at: now
        })
        .eq('id', existingArtifact.id);

      if (updateError) {
        console.error('[Templates API] Update error:', updateError);
        return NextResponse.json({ error: 'Failed to save template' }, { status: 500 });
      }
    } else {
      // Create new templates artifact
      const newArtifact: TemplatesArtifact = {
        templates: [newTemplate]
      };

      const { error: insertError } = await (supabase as any)
        .from('artifacts')
        .insert({
          project_id,
          type: 'templates',
          data: newArtifact,
          version: 1
        });

      if (insertError) {
        console.error('[Templates API] Insert error:', insertError);
        return NextResponse.json({ error: 'Failed to save template' }, { status: 500 });
      }
    }

    return NextResponse.json({
      template: newTemplate,
      message: 'Template created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('[Templates API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET - List all templates for a project
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    // Verify user owns the project
    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single();

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Fetch templates artifact
    const { data: artifact, error } = await (supabase as any)
      .from('artifacts')
      .select('*')
      .eq('project_id', projectId)
      .eq('type', 'templates')
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      console.error('[Templates API] Fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
    }

    const templates = artifact?.data?.templates || [];
    return NextResponse.json({
      templates,
      industries: INDUSTRIES
    });

  } catch (error) {
    console.error('[Templates API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper: Convert DesignInspiration to DesignDNA
function inspirationToDesignDNA(inspiration: any): DesignDNA {
  return {
    layout: inspiration.layout || {
      heroStyle: 'centered',
      gridPattern: '3-column',
      sectionSpacing: 'generous',
      navStyle: 'fixed-top'
    },
    colorScheme: inspiration.colorScheme || {
      dominantColor: '#1a1a2e',
      accentColor: '#4361ee',
      backgroundColor: '#ffffff',
      textColor: '#1a1a2e',
      backgroundStyle: 'light'
    },
    typography: inspiration.typography || {
      headingStyle: 'bold-sans',
      headingWeight: 'bold',
      bodyFont: 'sans-serif',
      textDensity: 'balanced'
    },
    components: inspiration.components || {
      buttonStyle: 'rounded',
      cardStyle: 'elevated',
      imageStyle: 'rounded'
    },
    effects: inspiration.effects || {
      hasAnimations: true,
      hasShadows: true,
      hasGradients: false,
      hasGlassmorphism: false,
      hasParallax: false,
      hasHoverEffects: true
    },
    sectionStructure: inspiration.sectionStructure || {
      order: ['hero', 'services', 'about', 'testimonials', 'cta', 'footer'],
      sections: {}
    },
    overallVibe: inspiration.overallVibe || 'Professional and trustworthy business website',
    designNotes: inspiration.designNotes || ''
  };
}

// Helper: Generate base template website from design DNA
async function generateBaseTemplate(
  industry: string,
  designDNA: DesignDNA
): Promise<{ files: Array<{ path: string; content: string; type: 'html' | 'css' | 'js' }>; primaryPage: string }> {

  const openrouter = createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY!,
  });

  const model = 'anthropic/claude-sonnet-4';

  // Build prompt with design DNA
  const prompt = `You are a world-class web designer. Generate a beautiful, modern HTML landing page template for a ${industry} business.

## DESIGN DNA (MATCH THIS EXACTLY):
- Layout: ${designDNA.layout.heroStyle} hero, ${designDNA.layout.gridPattern} grid, ${designDNA.layout.sectionSpacing} spacing
- Colors: Primary ${designDNA.colorScheme.dominantColor}, Accent ${designDNA.colorScheme.accentColor}, Background ${designDNA.colorScheme.backgroundColor}, Text ${designDNA.colorScheme.textColor}
- Background Style: ${designDNA.colorScheme.backgroundStyle}
- Typography: ${designDNA.typography.headingStyle} headings (${designDNA.typography.headingWeight}), ${designDNA.typography.bodyFont} body, ${designDNA.typography.textDensity} density
- Buttons: ${designDNA.components.buttonStyle} style
- Cards: ${designDNA.components.cardStyle} style
- Images: ${designDNA.components.imageStyle} style
- Effects: ${designDNA.effects.hasAnimations ? 'animations' : ''} ${designDNA.effects.hasShadows ? 'shadows' : ''} ${designDNA.effects.hasGradients ? 'gradients' : ''} ${designDNA.effects.hasGlassmorphism ? 'glassmorphism' : ''} ${designDNA.effects.hasHoverEffects ? 'hover effects' : ''}

## SECTION ORDER:
${designDNA.sectionStructure.order.join(' -> ')}

## VIBE:
${designDNA.overallVibe}

## DESIGN NOTES:
${designDNA.designNotes}

## REQUIREMENTS:
1. Use Tailwind CSS (via CDN)
2. Use placeholder variables for personalization:
   - {{BUSINESS_NAME}} - Company name
   - {{PHONE}} - Phone number
   - {{ADDRESS}} - Business address
   - {{TAGLINE}} - Business tagline
3. Mobile responsive
4. Include all sections from the section order
5. Use professional stock images from unsplash (use relevant ${industry} images)
6. Include a contact form
7. Make it look premium and modern

Return ONLY the complete HTML file content, nothing else. Do not use markdown code blocks.`;

  const { text } = await generateText({
    model: openrouter(model),
    prompt,
    temperature: 0.7,
  });

  // Clean the response
  let htmlContent = text
    .replace(/```html\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();

  // Ensure it starts with DOCTYPE
  if (!htmlContent.toLowerCase().startsWith('<!doctype')) {
    htmlContent = '<!DOCTYPE html>\n' + htmlContent;
  }

  return {
    files: [
      {
        path: '/index.html',
        content: htmlContent,
        type: 'html'
      }
    ],
    primaryPage: '/index.html'
  };
}
