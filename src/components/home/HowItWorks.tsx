'use client';

import { MessageSquare, Sparkles, Rocket } from 'lucide-react';
import Container from '../ui/Container';
import SectionHeading from '../ui/SectionHeading';

const steps = [
  {
    number: 1,
    icon: MessageSquare,
    title: 'Describe Your Idea',
    description: 'Tell us about your business concept in plain language. The more detail, the better the results.',
  },
  {
    number: 2,
    icon: Sparkles,
    title: 'AI Does the Work',
    description: 'Watch as our AI researches your market, creates your brand identity, and builds your website in real-time.',
  },
  {
    number: 3,
    icon: Rocket,
    title: 'Launch & Iterate',
    description: 'Review your generated assets, chat with AI to refine them, then export or deploy your business.',
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 sm:py-28 bg-zinc-50 dark:bg-slate-900/50 transition-colors">
      <Container>
        <SectionHeading
          title="Three Steps to Launch"
          subtitle="From idea to live business in minutes, not months"
        />

        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((step, index) => (
            <div
              key={step.number}
              className={`relative text-center animate-fade-in-up stagger-${index + 1}`}
            >
              {/* Connector line (hidden on mobile and last item) */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-[2px] bg-gradient-to-r from-zinc-300 to-transparent dark:from-zinc-700" />
              )}

              {/* Step number circle */}
              <div className="relative inline-flex items-center justify-center w-24 h-24 mb-6 rounded-full bg-white dark:bg-slate-800 shadow-lg border border-zinc-200 dark:border-slate-700">
                <span className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-zinc-900 dark:bg-slate-100 text-white dark:text-slate-900 text-sm font-bold flex items-center justify-center">
                  {step.number}
                </span>
                <step.icon size={32} className="text-zinc-700 dark:text-slate-300" strokeWidth={1.5} />
              </div>

              {/* Content */}
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-slate-100 mb-3">
                {step.title}
              </h3>
              <p className="text-zinc-600 dark:text-slate-400 leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
