'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/utils/supabase/client';

interface PendingProject {
  prompt: string;
  modelId: string;
}

export default function PendingProjectHandler() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    async function handlePendingProject() {
      // Wait for auth to load and ensure user is authenticated
      if (isLoading || !user || isCreating) return;

      // Check for pending project in sessionStorage
      const pendingData = sessionStorage.getItem('pendingProject');
      if (!pendingData) return;

      try {
        const pending: PendingProject = JSON.parse(pendingData);

        // Remove from storage immediately to prevent duplicate processing
        sessionStorage.removeItem('pendingProject');

        setIsCreating(true);

        // Create the project
        const supabase = createClient();
        const { data: project, error } = await (supabase
          .from('projects') as any)
          .insert({
            name: pending.prompt.slice(0, 50),
            description: pending.prompt,
            status: 'active',
            user_id: user.id,
            model_id: pending.modelId,
          })
          .select()
          .single();

        if (error) throw error;

        // Redirect to the new project
        const encodedPrompt = encodeURIComponent(pending.prompt);
        router.push(`/p/${project.id}?prompt=${encodedPrompt}`);
      } catch (error) {
        console.error('Failed to create pending project:', error);
        setIsCreating(false);
      }
    }

    handlePendingProject();
  }, [user, isLoading, isCreating, router]);

  // This component doesn't render anything visible
  return null;
}
