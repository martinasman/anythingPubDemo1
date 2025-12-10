'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface UseCreditsResult {
  credits: number | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  setCredits: (credits: number) => void;
}

export function useCredits(): UseCreditsResult {
  const { user } = useAuth();
  const [credits, setCredits] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCredits = useCallback(async () => {
    if (!user) {
      setCredits(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch('/api/credits');

      if (!response.ok) {
        throw new Error('Failed to fetch credits');
      }

      const data = await response.json();
      setCredits(data.credits);
      setError(null);
    } catch (err) {
      console.error('[useCredits] Error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCredits();
  }, [fetchCredits]);

  // Listen for credit updates from the chat stream
  useEffect(() => {
    const handleCreditUpdate = (event: CustomEvent<{ credits: number }>) => {
      setCredits(event.detail.credits);
    };

    window.addEventListener('creditUpdate' as any, handleCreditUpdate);
    return () => {
      window.removeEventListener('creditUpdate' as any, handleCreditUpdate);
    };
  }, []);

  return {
    credits,
    isLoading,
    error,
    refetch: fetchCredits,
    setCredits,
  };
}

// Helper to emit credit updates from chat stream
export function emitCreditUpdate(credits: number) {
  window.dispatchEvent(
    new CustomEvent('creditUpdate', {
      detail: { credits },
    })
  );
}
