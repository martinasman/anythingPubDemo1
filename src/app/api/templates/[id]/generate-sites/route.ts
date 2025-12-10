import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { nanoid } from 'nanoid';
import type { TemplateArtifact, TemplatesArtifact, Lead, LeadWebsiteArtifact, LeadWebsitesArtifact } from '@/types/database';

// POST - Generate personalized sites for selected leads
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: templateId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { project_id, lead_ids } = body;

    if (!project_id) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    if (!lead_ids || !Array.isArray(lead_ids) || lead_ids.length === 0) {
      return NextResponse.json({ error: 'At least one lead ID is required' }, { status: 400 });
    }

    // Verify user owns the project
    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('id', project_id)
      .eq('user_id', user.id)
      .single();

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Fetch the template
    const { data: artifact } = await (supabase as any)
      .from('artifacts')
      .select('*')
      .eq('project_id', project_id)
      .eq('type', 'templates')
      .single();

    if (!artifact) {
      return NextResponse.json({ error: 'Templates not found' }, { status: 404 });
    }

    const templatesData = artifact.data as TemplatesArtifact;
    const template = templatesData.templates.find(t => t.id === templateId);

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    console.log('[Generate Sites] Found template:', template.name);
    console.log('[Generate Sites] Generating for', lead_ids.length, 'leads');

    // Fetch leads data
    const { data: leads, error: leadsError } = await (supabase as any)
      .from('leads')
      .select('*')
      .eq('project_id', project_id)
      .in('id', lead_ids);

    if (leadsError || !leads) {
      console.error('[Generate Sites] Failed to fetch leads:', leadsError);
      return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
    }

    console.log('[Generate Sites] Found', leads.length, 'leads');

    // Generate personalized sites for each lead
    const generatedSites: Array<{
      leadId: string;
      leadName: string;
      previewToken: string;
      previewUrl: string;
      generatedAt: string;
      status: 'ready';
    }> = [];

    const leadWebsites: LeadWebsiteArtifact[] = [];

    for (const lead of leads) {
      const previewToken = nanoid(21);
      const now = new Date().toISOString();

      // Personalize the template
      const personalizedHtml = personalizeTemplate(
        template.baseWebsite.files[0]?.content || '',
        {
          businessName: lead.company_name,
          phone: lead.phone || '(555) 123-4567',
          address: lead.address || 'Your City, State',
          tagline: `Quality ${template.industry} services you can trust`
        }
      );

      // Create lead website artifact
      const leadWebsite: LeadWebsiteArtifact = {
        leadId: lead.id,
        leadName: lead.company_name,
        previewToken,
        files: [
          {
            path: '/index.html',
            content: personalizedHtml,
            type: 'html'
          }
        ],
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        designStyle: template.designDNA.overallVibe,
      };

      leadWebsites.push(leadWebsite);

      // Track generated site in template
      generatedSites.push({
        leadId: lead.id,
        leadName: lead.company_name,
        previewToken,
        previewUrl: `/preview/${previewToken}`,
        generatedAt: now,
        status: 'ready'
      });

      // Update lead with preview token
      await (supabase as any)
        .from('leads')
        .update({
          preview_token: previewToken,
          website_status: 'ready',
          updated_at: now
        })
        .eq('id', lead.id);

      console.log('[Generate Sites] Generated site for:', lead.company_name);
    }

    // Save lead websites to artifact
    const { data: existingLeadWebsites } = await (supabase as any)
      .from('artifacts')
      .select('*')
      .eq('project_id', project_id)
      .eq('type', 'lead_website')
      .single();

    if (existingLeadWebsites) {
      const existingData = existingLeadWebsites.data as LeadWebsitesArtifact;

      // Filter out any existing websites for these leads, then add new ones
      const filteredWebsites = (existingData.websites || []).filter(
        w => !lead_ids.includes(w.leadId)
      );

      const updatedData: LeadWebsitesArtifact = {
        websites: [...filteredWebsites, ...leadWebsites]
      };

      await (supabase as any)
        .from('artifacts')
        .update({
          data: updatedData,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingLeadWebsites.id);
    } else {
      const newArtifact: LeadWebsitesArtifact = {
        websites: leadWebsites
      };

      await (supabase as any)
        .from('artifacts')
        .insert({
          project_id,
          type: 'lead_website',
          data: newArtifact,
          version: 1
        });
    }

    // Update template with generated sites
    const updatedTemplate: TemplateArtifact = {
      ...template,
      generatedSites: [...(template.generatedSites || []), ...generatedSites],
      updatedAt: new Date().toISOString()
    };

    const updatedTemplates = templatesData.templates.map(t =>
      t.id === templateId ? updatedTemplate : t
    );

    await (supabase as any)
      .from('artifacts')
      .update({
        data: { templates: updatedTemplates },
        updated_at: new Date().toISOString()
      })
      .eq('id', artifact.id);

    console.log('[Generate Sites] Complete! Generated', generatedSites.length, 'sites');

    return NextResponse.json({
      success: true,
      generated: generatedSites.length,
      sites: generatedSites
    });

  } catch (error) {
    console.error('[Generate Sites] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper: Personalize template HTML with lead data
function personalizeTemplate(
  html: string,
  data: {
    businessName: string;
    phone: string;
    address: string;
    tagline: string;
  }
): string {
  return html
    .replace(/\{\{BUSINESS_NAME\}\}/g, data.businessName)
    .replace(/\{\{PHONE\}\}/g, data.phone)
    .replace(/\{\{ADDRESS\}\}/g, data.address)
    .replace(/\{\{TAGLINE\}\}/g, data.tagline);
}
