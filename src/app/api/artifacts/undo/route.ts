import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { projectId, type } = body;

    if (!projectId || !type) {
      return NextResponse.json(
        { error: 'Missing required fields: projectId, type' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Fetch current artifact with previous_data
    const { data: artifact, error: fetchError } = await (supabase
      .from('artifacts') as any)
      .select('*')
      .eq('project_id', projectId)
      .eq('type', type)
      .single();

    if (fetchError) {
      console.error('[Undo] Error fetching artifact:', fetchError);
      return NextResponse.json(
        { error: 'Artifact not found' },
        { status: 404 }
      );
    }

    // Check if there's a previous version to restore
    if (!artifact.previous_data) {
      return NextResponse.json(
        { error: 'No previous version available to undo' },
        { status: 400 }
      );
    }

    // Restore previous version
    const { data: updatedArtifact, error: updateError } = await (supabase
      .from('artifacts') as any)
      .update({
        data: artifact.previous_data,
        previous_data: artifact.data, // Current becomes previous (allows redo)
        version: (artifact.version || 1) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('project_id', projectId)
      .eq('type', type)
      .select()
      .single();

    if (updateError) {
      console.error('[Undo] Error restoring artifact:', updateError);
      return NextResponse.json(
        { error: 'Failed to undo changes' },
        { status: 500 }
      );
    }

    console.log('[Undo] Successfully restored previous version for', type);

    return NextResponse.json({
      success: true,
      artifact: updatedArtifact,
    });
  } catch (error) {
    console.error('[Undo] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
