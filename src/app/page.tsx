'use client';

import Header from '@/components/home/Header';
import HeroSection from '@/components/home/HeroSection';
import ShowcaseCarousel from '@/components/home/ShowcaseCarousel';
import HowItWorks from '@/components/home/HowItWorks';
import FeaturesGrid from '@/components/home/FeaturesGrid';
import PricingSection from '@/components/home/PricingSection';
import FAQ from '@/components/home/FAQ';
import FinalCTA from '@/components/home/FinalCTA';
import Footer from '@/components/home/Footer';
import PendingProjectHandler from '@/components/home/PendingProjectHandler';
import ProjectDashboard from '@/components/home/ProjectDashboard';

export default function Home() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 transition-colors">
      {/* Handle pending projects after sign-in redirect */}
      <PendingProjectHandler />

      <Header />

      <main>
        {/* Hero Section */}
        <HeroSection />

        {/* Project Dashboard (only shows when authenticated) */}
        <ProjectDashboard />

        {/* Showcase Carousel */}
        <ShowcaseCarousel />

        {/* How It Works */}
        <HowItWorks />

        {/* Features Grid */}
        <FeaturesGrid />

        {/* Pricing */}
        <PricingSection />

        {/* FAQ */}
        <FAQ />

        {/* Final CTA */}
        <FinalCTA />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
