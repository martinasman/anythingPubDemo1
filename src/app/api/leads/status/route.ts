import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { LeadsArtifact, Lead } from '@/types/database';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function PATCH(request: Request) {
  try {
    const { projectId, leadId, status } = await request.json();

    if (!projectId || !leadId || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: projectId, leadId, status' },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses: Lead['status'][] = ['new', 'contacted', 'responded', 'converted', 'rejected'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status value' },
        { status: 400 }
      );
    }

    // Fetch current leads artifact
    const { data: artifact, error: fetchError } = await supabase
      .from('artifacts')
      .select('*')
      .eq('project_id', projectId)
      .eq('type', 'leads')
      .single();

    if (fetchError) {
      console.error('[API] Error fetching leads artifact:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch leads' },
        { status: 500 }
      );
    }

    if (!artifact) {
      return NextResponse.json(
        { error: 'Leads artifact not found' },
        { status: 404 }
      );
    }

    // Update the lead status
    const leadsData = artifact.data as LeadsArtifact;
    const updatedLeads = leadsData.leads.map(lead =>
      lead.id === leadId ? { ...lead, status } : lead
    );

    // Save updated artifact
    const { error: updateError } = await supabase
      .from('artifacts')
      .update({
        data: { ...leadsData, leads: updatedLeads },
        updated_at: new Date().toISOString()
      })
      .eq('id', artifact.id);

    if (updateError) {
      console.error('[API] Error updating leads artifact:', updateError);
      return NextResponse.json(
        { error: 'Failed to update lead status' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, leadId, status });
  } catch (error) {
    console.error('[API] Lead status update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
