'use client';

import { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { useProjectStore } from '@/store/projectStore';
import WorkspaceLayout from './WorkspaceLayout';
import type { Project, Message, Artifact } from '@/types/database';

interface WorkspaceHydrationProps {
  projectId: string;
  initialProject: Project | null;
  initialMessages: Message[];
  initialArtifacts: Artifact[];
}

export default function WorkspaceHydration({
  projectId,
  initialProject,
  initialMessages,
  initialArtifacts,
}: WorkspaceHydrationProps) {
  const searchParams = useSearchParams();
  const initialPrompt = searchParams?.get('prompt');
  const { setInitialData, addMessage, updateArtifact } = useProjectStore();
  const hasInitialized = useRef(false);

  // Initialize store with server data - only once on mount
  useEffect(() => {
    if (!hasInitialized.current && initialProject) {
      console.log('[WorkspaceHydration] Initializing store', { hasProject: !!initialProject, messagesCount: initialMessages.length, artifactsCount: initialArtifacts.length });
      console.log('[WorkspaceHydration] Project:', initialProject);
      setInitialData(initialProject, initialMessages, initialArtifacts);
      hasInitialized.current = true;
    }
  }, [initialProject, initialMessages, initialArtifacts, setInitialData]);

  // Auto-submit initial prompt from URL
  useEffect(() => {
    console.log('[WorkspaceHydration] Checking auto-submit', { initialPrompt, messagesLength: initialMessages.length });
    if (initialPrompt && initialMessages.length === 0) {
      // Delay to ensure ChatPanel has mounted and listener is ready
      const timer = setTimeout(() => {
        console.log('[WorkspaceHydration] Dispatching autoSubmitPrompt event with:', initialPrompt);

        // Mark generation as started so LoadingCanvas shows immediately
        useProjectStore.getState().setHasStartedGeneration(true);

        const event = new CustomEvent('autoSubmitPrompt', {
          detail: { prompt: initialPrompt },
        });
        window.dispatchEvent(event);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [initialPrompt, initialMessages.length]);

  // Set up realtime subscriptions
  useEffect(() => {
    if (!projectId) return;

    const supabase = createClient();

    // Get the latest store functions via ref to avoid dependency issues
    const storeRef = { updateArtifact, addMessage };

    // Subscribe to artifact changes
    const artifactChannel = supabase
      .channel(`artifacts:${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'artifacts',
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          console.log('[Realtime] Artifact change:', payload.eventType, payload.new);

          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const artifact = payload.new as Artifact;

            // Validate artifact data - silently ignore invalid payloads (can happen during deletions)
            if (!artifact || !artifact.type || !artifact.data) {
              return;
            }

            // Validate artifact type
            const validTypes: Array<'website_code' | 'identity' | 'ads' | 'market_research' | 'business_plan' | 'leads' | 'outreach' | 'first_week_plan' | 'crm' | 'lead_website'> = [
              'website_code', 'identity', 'ads', 'market_research', 'business_plan', 'leads', 'outreach', 'first_week_plan', 'crm', 'lead_website'
            ];
            if (!validTypes.includes(artifact.type as any)) {
              console.error('[Realtime] Unknown artifact type:', artifact.type);
              return;
            }

            // Lead websites are handled locally in LeadDetailWorkspace via direct fetch
            // No need to update global store - just log and return
            if (artifact.type === 'lead_website') {
              console.log('[Realtime] lead_website update detected, handled locally in LeadDetailWorkspace');
              return;
            }

            console.log('[Realtime] Calling updateArtifact:', artifact.type, artifact);
            storeRef.updateArtifact(artifact.type, artifact);

            // NOTE: Don't transition to overview here - let ChatPanel handle it
            // when all tools complete. This prevents showing overview too early
            // while tools are still running.
          }
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] Subscription status:', status);
      });

    // Subscribe to message changes - DISABLED to prevent duplicates
    // Messages are managed locally in ChatPanel for immediate UX
    // const messageChannel = supabase
    //   .channel(`messages:${projectId}`)
    //   .on(
    //     'postgres_changes',
    //     {
    //       event: 'INSERT',
    //       schema: 'public',
    //       table: 'messages',
    //       filter: `project_id=eq.${projectId}`,
    //     },
    //     (payload) => {
    //       const message = payload.new as Message;
    //       addMessage(message);
    //     }
    //   )
    //   .subscribe();

    // Cleanup on unmount
    return () => {
      console.log('[Realtime] Cleaning up subscriptions');
      supabase.removeChannel(artifactChannel);
      // supabase.removeChannel(messageChannel);
    };
  }, [projectId]); // Only depend on projectId to prevent subscription recreation

  if (!initialProject) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-zinc-50 dark:bg-slate-950">
        <div className="text-center space-y-3">
          <div className="text-zinc-400 text-sm">Project not found</div>
          <a
            href="/"
            className="text-xs text-blue-500 hover:text-blue-600 underline"
          >
            Return to home
          </a>
        </div>
      </div>
    );
  }

  // Always show workspace immediately - loading happens inside chat
  return <WorkspaceLayout projectId={projectId} />;
}
