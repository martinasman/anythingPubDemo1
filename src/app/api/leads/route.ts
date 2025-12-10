import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// POST - Create a new lead manually
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { project_id, company_name, contact_name, email, phone, website, notes } = body;

    if (!project_id || !company_name) {
      return NextResponse.json(
        { error: 'Project ID and company name are required' },
        { status: 400 }
      );
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

    // Create the lead with default values
    const newLead = {
      project_id,
      company_name: company_name.trim(),
      contact_name: contact_name?.trim() || null,
      email: email?.trim() || null,
      phone: phone?.trim() || null,
      website: website?.trim() || null,
      notes: notes?.trim() || null,
      status: 'new' as const,
      priority: 'medium' as const,
      score: 50, // Default score for manual leads
      icp_score: 5, // Default ICP score
      source: 'manual',
      created_at: new Date().toISOString(),
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: lead, error: insertError } = await (supabase as any)
      .from('leads')
      .insert(newLead)
      .select()
      .single();

    if (insertError) {
      console.error('[Leads API] Insert error:', insertError);
      return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 });
    }

    return NextResponse.json({ lead }, { status: 201 });
  } catch (error) {
    console.error('[Leads API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET - Fetch all leads for a project
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

    // Fetch all leads for this project
    const { data: leads, error } = await supabase
      .from('leads')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Leads API] Fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
    }

    return NextResponse.json({ leads: leads || [] });
  } catch (error) {
    console.error('[Leads API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
