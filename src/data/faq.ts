export interface FAQItem {
  question: string;
  answer: string;
}

export const FAQ_ITEMS: FAQItem[] = [
  {
    question: 'How does the credit system work?',
    answer: 'Each AI generation uses credits based on the task: Market Research costs 5 credits, Brand Identity costs 10 credits, and Website Generation costs 15 credits. Generate a full business for just 25 credits with our bundle discount. Free accounts start with 50 credits.',
  },
  {
    question: 'What AI models are available?',
    answer: 'We support 100+ AI models through OpenRouter including Claude 3.5, GPT-4, Gemini Pro, and many more. Free users have access to basic models, while Pro and Unlimited users can access all premium models.',
  },
  {
    question: 'Can I export my generated content?',
    answer: 'Absolutely! You can download your website as HTML, CSS, and JavaScript files. You can also export your brand assets including logos, color palettes, and typography guidelines.',
  },
  {
    question: 'Is my data secure?',
    answer: 'Yes, we take security seriously. All data is encrypted in transit and at rest. We never share your business ideas or generated content with third parties. You own everything you create.',
  },
  {
    question: 'How long does generation take?',
    answer: 'Most generations complete in 30-60 seconds. Market research runs in parallel with brand identity generation, then your website is built. You can watch the entire process in real-time.',
  },
  {
    question: 'Can I edit the generated content?',
    answer: 'Yes! After generation, you can chat with the AI to refine and iterate on any aspect of your business. Want different colors? A new tagline? Just ask and the AI will update your assets.',
  },
];
