'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import Container from '../ui/Container';
import SectionHeading from '../ui/SectionHeading';
import { FAQ_ITEMS } from '@/data/faq';

function FAQItem({ question, answer, isOpen, onClick }: {
  question: string;
  answer: string;
  isOpen: boolean;
  onClick: () => void;
}) {
  return (
    <div className="border-b border-zinc-200 dark:border-slate-700 last:border-0">
      <button
        onClick={onClick}
        className="w-full py-5 flex items-center justify-between text-left"
      >
        <span className="font-medium text-zinc-900 dark:text-slate-100 pr-8">
          {question}
        </span>
        <ChevronDown
          size={20}
          className={`flex-shrink-0 text-zinc-500 transition-transform duration-300 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${
          isOpen ? 'max-h-96 pb-5' : 'max-h-0'
        }`}
      >
        <p className="text-zinc-600 dark:text-slate-400 leading-relaxed">
          {answer}
        </p>
      </div>
    </div>
  );
}

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-20 sm:py-28">
      <Container size="md">
        <SectionHeading
          title="Questions? We've Got Answers"
          subtitle="Everything you need to know about using Anything"
        />

        <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-zinc-200 dark:border-slate-700 px-6 sm:px-8 divide-y divide-zinc-200 dark:divide-zinc-700">
          {FAQ_ITEMS.map((item, index) => (
            <FAQItem
              key={index}
              question={item.question}
              answer={item.answer}
              isOpen={openIndex === index}
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
            />
          ))}
        </div>
      </Container>
    </section>
  );
}
