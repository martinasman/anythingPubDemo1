'use client';

import Container from '../ui/Container';
import SectionHeading from '../ui/SectionHeading';
import { FEATURES } from '@/data/features';

export default function FeaturesGrid() {
  return (
    <section id="features" className="py-20 sm:py-28">
      <Container>
        <SectionHeading
          title="Everything You Need to Build"
          subtitle="Powerful AI tools that work together to create your complete business"
        />

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {FEATURES.map((feature, index) => (
            <div
              key={feature.title}
              className={`group relative p-6 rounded-2xl bg-white dark:bg-slate-800/50 border border-zinc-200 dark:border-slate-700/50 hover-scale animate-fade-in-up stagger-${index + 1}`}
            >
              {/* Icon with gradient background */}
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} mb-4`}>
                <feature.icon size={24} className="text-white" strokeWidth={1.5} />
              </div>

              {/* Title */}
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-slate-100 mb-2">
                {feature.title}
              </h3>

              {/* Description */}
              <p className="text-zinc-600 dark:text-slate-400 text-sm leading-relaxed">
                {feature.description}
              </p>

              {/* Hover glow effect */}
              <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none`} />
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
