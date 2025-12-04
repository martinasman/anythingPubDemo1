'use client';

export function Footer() {
  return (
    <footer
      className="py-8 border-t"
      style={{
        borderColor: 'var(--border-subtle)',
        background: 'var(--surface-1)',
      }}
    >
      <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div
          className="text-lg font-bold"
          style={{ color: 'var(--text-primary)' }}
        >
          Anything
        </div>
        <div
          className="text-sm"
          style={{ color: 'var(--text-tertiary)' }}
        >
          &copy; 2025 Anything. From idea to income.
        </div>
      </div>
    </footer>
  );
}
