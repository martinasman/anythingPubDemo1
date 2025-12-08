import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getDeploymentStatus, deleteProject } from '@/utils/vercel';
import {
  PublishedWebsiteRow,
  publishedWebsiteRowToPublishedWebsite,
} from '@/types/database';

// GET - Get a specific published website and its deployment status
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: publishedWebsite, error } = await (supabase
      .from('published_websites') as any)
      .select('*')
      .eq('id', id)
      .single();

    if (error || !publishedWebsite) {
      return NextResponse.json(
        { error: 'Published website not found' },
        { status: 404 }
      );
    }

    // If deployment is still in progress, check status
    if (publishedWebsite.status === 'deploying' && publishedWebsite.deployment_id) {
      try {
        const deployment = await getDeploymentStatus(publishedWebsite.deployment_id);

        // Update status if changed
        if (deployment.readyState === 'READY' || deployment.readyState === 'ERROR') {
          const newStatus = deployment.readyState === 'READY' ? 'published' : 'failed';
          await (supabase
            .from('published_websites') as any)
            .update({
              status: newStatus,
              deployment_url: deployment.url,
            })
            .eq('id', id);

          publishedWebsite.status = newStatus;
          publishedWebsite.deployment_url = deployment.url;
        }
      } catch (deployError) {
        console.error('Failed to get deployment status:', deployError);
      }
    }

    return NextResponse.json({
      publishedWebsite: publishedWebsiteRowToPublishedWebsite(publishedWebsite as PublishedWebsiteRow),
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH - Update a published website (e.g., access level, custom domain)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const body = await req.json();

    // Only allow updating certain fields
    const allowedFields = ['access_level', 'custom_domain'];
    const updates: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (field in body) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    const { data: publishedWebsite, error } = await (supabase
      .from('published_websites') as any)
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Failed to update published website:', error);
      return NextResponse.json(
        { error: 'Failed to update published website' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      publishedWebsite: publishedWebsiteRowToPublishedWebsite(publishedWebsite as PublishedWebsiteRow),
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Unpublish a website
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Get the published website first
    const { data: publishedWebsite, error: fetchError } = await (supabase
      .from('published_websites') as any)
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !publishedWebsite) {
      return NextResponse.json(
        { error: 'Published website not found' },
        { status: 404 }
      );
    }

    // Try to delete from Vercel (but don't fail if it doesn't work)
    if (publishedWebsite.deployment_id) {
      try {
        await deleteProject(publishedWebsite.subdomain);
      } catch (vercelError) {
        console.error('Failed to delete from Vercel:', vercelError);
        // Continue anyway - we'll still remove from our database
      }
    }

    // Delete from our database
    const { error: deleteError } = await (supabase
      .from('published_websites') as any)
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Failed to delete published website:', deleteError);
      return NextResponse.json(
        { error: 'Failed to unpublish website' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
