import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import {
  deployToVercel,
  sanitizeSubdomain,
  isVercelConfigured,
  getDeploymentUrl,
} from '@/utils/vercel';
import {
  PublishedWebsiteRow,
  publishedWebsiteRowToPublishedWebsite,
  WebsiteArtifact,
  LeadWebsitesArtifact,
} from '@/types/database';

interface PublishRequest {
  projectId: string;
  sourceType: 'project' | 'lead';
  leadId?: string;
  subdomain: string;
  accessLevel?: 'public' | 'password' | 'private';
}

// POST - Create a new deployment
export async function POST(req: NextRequest) {
  try {
    // Check if Vercel is configured
    if (!isVercelConfigured()) {
      return NextResponse.json(
        { error: 'Vercel integration is not configured. Please set VERCEL_API_TOKEN.' },
        { status: 500 }
      );
    }

    const supabase = await createClient();
    const body: PublishRequest = await req.json();

    const { projectId, sourceType, leadId, subdomain, accessLevel = 'public' } = body;

    // Validate required fields
    if (!projectId || !sourceType || !subdomain) {
      return NextResponse.json(
        { error: 'Missing required fields: projectId, sourceType, subdomain' },
        { status: 400 }
      );
    }

    // Sanitize subdomain
    const sanitizedSubdomain = sanitizeSubdomain(subdomain);
    if (!sanitizedSubdomain) {
      return NextResponse.json(
        { error: 'Invalid subdomain' },
        { status: 400 }
      );
    }

    // Check if subdomain is already taken
    const { data: existingWebsite } = await (supabase
      .from('published_websites') as any)
      .select('id')
      .eq('subdomain', sanitizedSubdomain)
      .single();

    if (existingWebsite) {
      return NextResponse.json(
        { error: 'This subdomain is already taken. Please choose a different one.' },
        { status: 409 }
      );
    }

    // Get website files based on source type
    let files: Array<{ path: string; content: string }> = [];
    let sourceArtifactId: string | undefined;

    if (sourceType === 'project') {
      // Get project website from artifacts
      const { data: artifact, error: artifactError } = await (supabase
        .from('artifacts') as any)
        .select('*')
        .eq('project_id', projectId)
        .eq('type', 'website_code')
        .single();

      if (artifactError || !artifact) {
        return NextResponse.json(
          { error: 'No website found for this project. Generate a website first.' },
          { status: 404 }
        );
      }

      sourceArtifactId = artifact.id;
      const websiteData = artifact.data as WebsiteArtifact;
      files = websiteData.files.map(f => ({
        path: f.path,
        content: f.content,
      }));
    } else if (sourceType === 'lead') {
      if (!leadId) {
        return NextResponse.json(
          { error: 'leadId is required for lead website publishing' },
          { status: 400 }
        );
      }

      // Get lead website from artifacts
      const { data: artifact, error: artifactError } = await (supabase
        .from('artifacts') as any)
        .select('*')
        .eq('project_id', projectId)
        .eq('type', 'lead_website')
        .single();

      if (artifactError || !artifact) {
        return NextResponse.json(
          { error: 'No lead websites found for this project.' },
          { status: 404 }
        );
      }

      sourceArtifactId = artifact.id;
      const leadWebsitesData = artifact.data as LeadWebsitesArtifact;
      const leadWebsite = leadWebsitesData.websites?.find(w => w.leadId === leadId);

      if (!leadWebsite) {
        return NextResponse.json(
          { error: 'No website found for this lead. Generate a website first.' },
          { status: 404 }
        );
      }

      files = leadWebsite.files.map(f => ({
        path: f.path,
        content: f.content,
      }));
    }

    if (files.length === 0) {
      return NextResponse.json(
        { error: 'No files to deploy' },
        { status: 400 }
      );
    }

    // Get project name for Vercel
    const { data: project } = await (supabase
      .from('projects') as any)
      .select('name')
      .eq('id', projectId)
      .single();

    const projectName = project?.name || 'website';

    // Create initial record in database
    const baseDomain = process.env.PUBLISH_BASE_DOMAIN || 'vercel.app';
    const deploymentUrl = getDeploymentUrl(sanitizedSubdomain, baseDomain);

    const { data: publishedWebsite, error: insertError } = await (supabase
      .from('published_websites') as any)
      .insert({
        project_id: projectId,
        subdomain: sanitizedSubdomain,
        base_domain: baseDomain,
        deployment_url: deploymentUrl,
        source_type: sourceType,
        source_artifact_id: sourceArtifactId,
        lead_id: leadId || null,
        access_level: accessLevel,
        status: 'deploying',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to create published website record:', insertError);
      return NextResponse.json(
        { error: 'Failed to create deployment record' },
        { status: 500 }
      );
    }

    // Deploy to Vercel
    try {
      const deployment = await deployToVercel(files, projectName, sanitizedSubdomain);

      // Update record with deployment info
      await (supabase
        .from('published_websites') as any)
        .update({
          deployment_id: deployment.id,
          deployment_url: deployment.url,
          status: deployment.readyState === 'READY' ? 'published' : 'deploying',
          last_deployed_at: new Date().toISOString(),
        })
        .eq('id', publishedWebsite.id);

      return NextResponse.json({
        publishedWebsite: publishedWebsiteRowToPublishedWebsite({
          ...publishedWebsite,
          deployment_id: deployment.id,
          deployment_url: deployment.url,
          status: deployment.readyState === 'READY' ? 'published' : 'deploying',
        } as PublishedWebsiteRow),
        deployment,
      });
    } catch (deployError) {
      console.error('Vercel deployment failed:', deployError);

      // Update record as failed
      await (supabase
        .from('published_websites') as any)
        .update({ status: 'failed' })
        .eq('id', publishedWebsite.id);

      return NextResponse.json(
        { error: `Deployment failed: ${deployError instanceof Error ? deployError.message : 'Unknown error'}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - List published websites for a project
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId is required' },
        { status: 400 }
      );
    }

    const { data: publishedWebsites, error } = await (supabase
      .from('published_websites') as any)
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch published websites:', error);
      return NextResponse.json(
        { error: 'Failed to fetch published websites' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      publishedWebsites: (publishedWebsites || []).map((row: PublishedWebsiteRow) =>
        publishedWebsiteRowToPublishedWebsite(row)
      ),
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
