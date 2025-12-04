'use client';

import { motion } from 'framer-motion';
import { MessageSquare, Wand2, Rocket } from 'lucide-react';

const STEPS = [
  {
    icon: MessageSquare,
    title: 'Describe Your Idea',
    description: 'Tell us what you want to build in plain English. No technical knowledge required.',
  },
  {
    icon: Wand2,
    title: 'AI Builds It',
    description: 'Watch as AI generates your brand, website, pricing, and marketing materials.',
  },
  {
    icon: Rocket,
    title: 'Launch & Profit',
    description: 'Go live instantly. Start getting customers and making money.',
  },
];

export function HowItWorks() {
  return (
    <section className="py-20 sm:py-28">
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-2xl sm:text-3xl font-bold mb-3"
            style={{ color: 'var(--text-primary)' }}
          >
            How it works
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            style={{ color: 'var(--text-secondary)' }}
          >
            Three steps. Five minutes. One complete business.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {STEPS.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative text-center"
            >
              {/* Step number */}
              <div className="relative inline-flex mb-6">
                <div
                  className="p-4 rounded-2xl"
                  style={{ background: 'var(--surface-2)' }}
                >
                  <step.icon
                    className="w-8 h-8"
                    style={{ color: 'var(--accent)' }}
                  />
                </div>
                <span
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{ background: 'var(--accent)' }}
                >
                  {index + 1}
                </span>
              </div>

              <h3
                className="text-lg font-semibold mb-2"
                style={{ color: 'var(--text-primary)' }}
              >
                {step.title}
              </h3>
              <p
                className="text-sm"
                style={{ color: 'var(--text-secondary)' }}
              >
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
