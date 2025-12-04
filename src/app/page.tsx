'use client';

import Header from '@/components/home/Header';
import { HeroSection } from '@/components/landing/HeroSection';
import { ModeSelection } from '@/components/landing/ModeSelection';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { SocialProof } from '@/components/landing/SocialProof';
import { Footer } from '@/components/landing/Footer';
import HeroInput from '@/components/home/HeroInput';
import ProjectDashboard from '@/components/home/ProjectDashboard';
import PendingProjectHandler from '@/components/home/PendingProjectHandler';

export default function Home() {
  return (
    <div className="min-h-screen transition-colors" style={{ background: 'var(--surface-1)' }}>
      {/* Handle pending projects after sign-in redirect */}
      <PendingProjectHandler />

      <Header />

      <main>
        {/* Hero Section with headline and stats */}
        <HeroSection />

        {/* Mode Selection Cards - Primary Entry Point */}
        <ModeSelection />

        {/* Playground Input - Secondary Entry Point */}
        <section className="py-8">
          <div className="max-w-2xl mx-auto px-4">
            <div className="relative">
              {/* Divider with "or" */}
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t" style={{ borderColor: 'var(--border-subtle)' }} />
              </div>
              <div className="relative flex justify-center">
                <span
                  className="px-4 text-sm"
                  style={{
                    background: 'var(--surface-1)',
                    color: 'var(--text-tertiary)',
                  }}
                >
                  or describe anything
                </span>
              </div>
            </div>
            <div className="mt-8">
              <HeroInput />
            </div>
          </div>
        </section>

        {/* Project Dashboard (only shows when authenticated) */}
        <ProjectDashboard />

        {/* How It Works */}
        <HowItWorks />

        {/* Social Proof / Testimonials */}
        <SocialProof />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
