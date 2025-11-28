'use client';

import { useProjectStore } from '@/store/projectStore';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import Image from 'next/image';
import OverviewLayout from './OverviewLayout';
import BrandView from './BrandView';
import WebsiteFocusView from './WebsiteFocusView';
import CRMFocusView from './CRMFocusView';
import FinanceView from './FinanceView';
import OnboardingWalkthrough from './OnboardingWalkthrough';

export default function ContextPanel() {
  const {
    artifacts,
    hasStartedGeneration,
    workspaceView,
    hasSeenOnboarding,
    setHasSeenOnboarding,
  } = useProjectStore();

  const [showOnboarding, setShowOnboarding] = useState(false);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Determine if all key artifacts are ready for onboarding
  const hasIdentity = !!artifacts.identity;
  const hasWebsite = !!artifacts.website;
  const allKeyArtifactsReady = hasIdentity && hasWebsite;

  // Show onboarding after first generation completes (when key artifacts are ready)
  useEffect(() => {
    if (hasStartedGeneration && !hasSeenOnboarding && allKeyArtifactsReady) {
      setShowOnboarding(true);
    }
  }, [hasStartedGeneration, hasSeenOnboarding, allKeyArtifactsReady]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    setHasSeenOnboarding(true);
  };

  // Idle state - before generation starts
  if (!hasStartedGeneration) {
    return (
      <div className="h-full w-full overflow-hidden flex flex-col" style={{ background: 'var(--surface-1)' }}>
        <div className="flex items-center justify-center h-full">
          <div className="text-center max-w-sm">
            <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              {mounted ? (
                <Image
                  src={resolvedTheme === 'dark' ? '/logolight.png' : '/logodark.png'}
                  alt="Anything"
                  width={64}
                  height={64}
                  className="opacity-30"
                />
              ) : (
                <div className="w-16 h-16" />
              )}
            </div>
            <h3 className="text-lg font-medium text-zinc-600 dark:text-zinc-400 mb-2">
              Ready to build
            </h3>
            <p className="text-sm text-zinc-400 dark:text-zinc-500">
              Send a message to start generating your business assets
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-hidden flex flex-col" style={{ background: 'var(--surface-1)' }}>
      {/* Active View - Full height now that Dock is in Toolbar */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {workspaceView === 'HOME' && <OverviewLayout />}
        {workspaceView === 'BRAND' && <BrandView />}
        {workspaceView === 'CRM' && <CRMFocusView />}
        {workspaceView === 'SITE' && <WebsiteFocusView />}
        {workspaceView === 'FINANCE' && <FinanceView />}
      </div>

      {/* Onboarding Modal */}
      {showOnboarding && <OnboardingWalkthrough onComplete={handleOnboardingComplete} />}
    </div>
  );
}
