import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';

// ============================================
// GET - Fetch client activities
// ============================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const { id } = await params;

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId query parameter is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('client_activities')
      .select('*')
      .eq('client_id', id)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ activities: data || [] });
  } catch (error) {
    console.error('[API] GET /clients/[id]/activities error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================
// POST - Add an activity
// ============================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createAdminClient();
    const { projectId, type, content, metadata } = await request.json();
    const { id } = await params;

    if (!projectId || !type) {
      return NextResponse.json(
        { error: 'projectId and type are required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('client_activities')
      .insert([
        {
          project_id: projectId,
          client_id: id,
          type,
          content: content || null,
          metadata: metadata || null,
          user_name: 'system',
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json({ error: error?.message || 'Failed to add activity' }, { status: 400 });
    }

    return NextResponse.json({ activity: data, success: true }, { status: 201 });
  } catch (error) {
    console.error('[API] POST /clients/[id]/activities error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
