'use client';

import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

const TESTIMONIALS = [
  {
    name: 'Alex Chen',
    handle: '@alexbuilds',
    content: 'Built my entire SMMA in 20 minutes. Already landed 2 clients. This is insane.',
    revenue: '$4,200/mo',
  },
  {
    name: 'Sarah Johnson',
    handle: '@sarahj',
    content: 'The dropshipping flow is crazy. Found a product, had a store, ran ads — all in one sitting.',
    revenue: '$12,400/mo',
  },
  {
    name: 'Marcus Williams',
    handle: '@marcusw',
    content: 'Replaced my 9-5 in 3 weeks. Web design agency is printing money.',
    revenue: '$8,500/mo',
  },
];

export function SocialProof() {
  return (
    <section
      className="py-20 sm:py-28"
      style={{ background: 'var(--surface-0)' }}
    >
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="flex justify-center gap-1 mb-4"
          >
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className="w-5 h-5 fill-yellow-400 text-yellow-400"
              />
            ))}
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-sm font-medium mb-2"
            style={{ color: 'var(--text-secondary)' }}
          >
            Join 2,800+ builders
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-2xl sm:text-3xl font-bold"
            style={{ color: 'var(--text-primary)' }}
          >
            Real people. Real businesses. Real money.
          </motion.h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="p-6 rounded-2xl"
              style={{
                background: 'var(--surface-2)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-white"
                  style={{ background: 'var(--accent)' }}
                >
                  {testimonial.name.charAt(0)}
                </div>
                <div>
                  <div
                    className="font-medium text-sm"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {testimonial.name}
                  </div>
                  <div
                    className="text-xs"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    {testimonial.handle}
                  </div>
                </div>
              </div>

              {/* Content */}
              <p
                className="text-sm mb-4"
                style={{ color: 'var(--text-secondary)' }}
              >
                &quot;{testimonial.content}&quot;
              </p>

              {/* Revenue badge */}
              <div className="inline-flex">
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400">
                  {testimonial.revenue}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
