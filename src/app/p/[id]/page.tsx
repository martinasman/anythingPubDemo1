import { createClient } from '@/utils/supabase/server';
import WorkspaceHydration from '@/components/workspace/WorkspaceHydration';
import type { Project, Message, Artifact } from '@/types/database';

interface WorkspacePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function WorkspacePage({ params }: WorkspacePageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch project data
  const { data: project } = await (supabase
    .from('projects') as any)
    .select('*')
    .eq('id', id)
    .single() as { data: Project | null };

  // Fetch messages
  const { data: messages } = await (supabase
    .from('messages') as any)
    .select('*')
    .eq('project_id', id)
    .order('created_at', { ascending: true }) as { data: Message[] | null };

  // Fetch artifacts
  const { data: artifacts } = await (supabase
    .from('artifacts') as any)
    .select('*')
    .eq('project_id', id)
    .order('created_at', { ascending: false }) as { data: Artifact[] | null };

  console.log('[Workspace Page] Loaded artifacts:', artifacts?.length || 0);
  artifacts?.forEach(a => console.log('[Workspace Page] Artifact type:', a.type));

  return (
    <WorkspaceHydration
      projectId={id}
      initialProject={project}
      initialMessages={messages || []}
      initialArtifacts={artifacts || []}
    />
  );
}
