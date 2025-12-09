import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import type { LeadsArtifact } from '@/types/database';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * DELETE /api/leads/[id]
 * Deletes a lead from both the dedicated leads table and the artifacts
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createAdminClient();
    const { id: leadId } = await params;
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!leadId) {
      return NextResponse.json(
        { error: 'Missing lead ID' },
        { status: 400 }
      );
    }

    if (!projectId) {
      return NextResponse.json(
        { error: 'Missing projectId query parameter' },
        { status: 400 }
      );
    }

    console.log('[API] Deleting lead:', { leadId, projectId });

    // Delete from dedicated leads table
    const { error: leadDeleteError } = await supabase
      .from('leads')
      .delete()
      .eq('id', leadId);

    if (leadDeleteError) {
      console.error('[API] Error deleting lead from leads table:', leadDeleteError);
      // Don't fail - the lead might only exist in artifacts
    }

    // Also remove from artifacts for backwards compatibility
    const { data: artifact } = await supabase
      .from('artifacts')
      .select('*')
      .eq('project_id', projectId)
      .eq('type', 'leads')
      .single();

    if (artifact) {
      const leadsData = artifact.data as LeadsArtifact;
      const filteredLeads = leadsData.leads.filter(lead => lead.id !== leadId);

      // Only update if a lead was actually removed
      if (filteredLeads.length !== leadsData.leads.length) {
        const { error: artifactUpdateError } = await supabase
          .from('artifacts')
          .update({
            data: { ...leadsData, leads: filteredLeads },
            updated_at: new Date().toISOString()
          })
          .eq('id', artifact.id);

        if (artifactUpdateError) {
          console.error('[API] Error updating leads artifact:', artifactUpdateError);
        }
      }
    }

    // Also check if there's a lead_website artifact that references this lead
    const { data: leadWebsiteArtifact } = await supabase
      .from('artifacts')
      .select('*')
      .eq('project_id', projectId)
      .eq('type', 'lead_website')
      .single();

    if (leadWebsiteArtifact?.data?.websites) {
      const websites = leadWebsiteArtifact.data.websites as Array<{ leadId: string }>;
      const filteredWebsites = websites.filter(w => w.leadId !== leadId);

      if (filteredWebsites.length !== websites.length) {
        await supabase
          .from('artifacts')
          .update({
            data: { ...leadWebsiteArtifact.data, websites: filteredWebsites },
            updated_at: new Date().toISOString()
          })
          .eq('id', leadWebsiteArtifact.id);
      }
    }

    console.log('[API] Lead deleted successfully:', leadId);
    return NextResponse.json({ success: true, leadId });
  } catch (error) {
    console.error('[API] Lead delete error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
