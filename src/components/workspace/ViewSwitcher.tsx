'use client';

import { Sparkles, Globe, Users } from 'lucide-react';

type ContextView = 'brand' | 'website' | 'crm';

interface ViewSwitcherProps {
  activeView: ContextView;
  onChange: (view: ContextView) => void;
}

const VIEWS: { value: ContextView; label: string; icon: typeof Globe }[] = [
  { value: 'brand', label: 'Brand', icon: Sparkles },
  { value: 'website', label: 'Website', icon: Globe },
  { value: 'crm', label: 'CRM', icon: Users },
];

export default function ViewSwitcher({ activeView, onChange }: ViewSwitcherProps) {
  return (
    <div className="flex justify-center py-3 border-b border-zinc-200 dark:border-slate-800">
      <div className="flex bg-zinc-100 dark:bg-slate-800 rounded-lg p-1 gap-1">
        {VIEWS.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            onClick={() => onChange(value)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${
              activeView === value
                ? 'bg-white dark:bg-slate-700 text-zinc-900 dark:text-white shadow-sm'
                : 'text-zinc-500 dark:text-slate-400 hover:text-zinc-700 dark:hover:text-slate-200'
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
