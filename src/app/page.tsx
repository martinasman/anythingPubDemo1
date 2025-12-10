'use client';

import Header from '@/components/home/Header';
import HeroInput from '@/components/home/HeroInput';
import ProjectDashboard from '@/components/home/ProjectDashboard';
import PendingProjectHandler from '@/components/home/PendingProjectHandler';

export default function Home() {
  return (
    <div className="min-h-screen transition-colors bg-zinc-100 dark:bg-zinc-900">
      {/* Handle pending projects after sign-in redirect */}
      <PendingProjectHandler />

      <Header />

      <main>
        {/* Hero Input - Primary Entry Point */}
        <section className="min-h-[calc(100vh-80px)] flex items-center justify-center">
          <div className="max-w-2xl w-full mx-auto px-4">
            <HeroInput />
          </div>
        </section>

        {/* Project Dashboard (only shows when authenticated) */}
        <ProjectDashboard />
      </main>
    </div>
  );
}
