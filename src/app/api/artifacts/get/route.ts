import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';

export async function GET(request: Request) {
  try {
    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const type = searchParams.get('type');

    if (!projectId) {
      return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });
    }

    if (!type) {
      return NextResponse.json({ error: 'Missing type' }, { status: 400 });
    }

    const { data: artifact, error } = await supabase
      .from('artifacts')
      .select('*')
      .eq('project_id', projectId)
      .eq('type', type)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('[API] Error fetching artifact:', error);
      return NextResponse.json({ error: 'Failed to fetch artifact' }, { status: 500 });
    }

    // Debug logging to trace version
    if (artifact && type === 'website_code') {
      console.log('[API artifacts/get] Returning website_code version:', artifact.version, 'files:', artifact.data?.files?.length);
    }

    return NextResponse.json({ artifact: artifact || null });
  } catch (error) {
    console.error('[API] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
