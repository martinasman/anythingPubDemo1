import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import type { TemplatesArtifact } from '@/types/database';

// GET - Get a single template by ID
export async function GET(
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
    const { data: artifact } = await (supabase as any)
      .from('artifacts')
      .select('*')
      .eq('project_id', projectId)
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

    return NextResponse.json({ template });

  } catch (error) {
    console.error('[Template API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete a template
export async function DELETE(
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
    const { data: artifact } = await (supabase as any)
      .from('artifacts')
      .select('*')
      .eq('project_id', projectId)
      .eq('type', 'templates')
      .single();

    if (!artifact) {
      return NextResponse.json({ error: 'Templates not found' }, { status: 404 });
    }

    const templatesData = artifact.data as TemplatesArtifact;
    const filteredTemplates = templatesData.templates.filter(t => t.id !== templateId);

    if (filteredTemplates.length === templatesData.templates.length) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Update artifact
    await (supabase as any)
      .from('artifacts')
      .update({
        data: { templates: filteredTemplates },
        updated_at: new Date().toISOString()
      })
      .eq('id', artifact.id);

    return NextResponse.json({ success: true, message: 'Template deleted' });

  } catch (error) {
    console.error('[Template API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
