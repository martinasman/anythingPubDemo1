'use client';

interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  align?: 'left' | 'center';
  className?: string;
}

export default function SectionHeading({
  title,
  subtitle,
  align = 'center',
  className = ''
}: SectionHeadingProps) {
  const alignClass = align === 'center' ? 'text-center' : 'text-left';

  return (
    <div className={`mb-12 ${alignClass} ${className}`}>
      <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-slate-100 mb-4">
        {title}
      </h2>
      {subtitle && (
        <p className="text-lg text-zinc-600 dark:text-slate-400 max-w-2xl mx-auto">
          {subtitle}
        </p>
      )}
    </div>
  );
}
