'use client';

import { Globe, ExternalLink, DollarSign } from 'lucide-react';

export interface Customer {
  id: string;
  company_name: string;
  website?: string;
  contact_name?: string;
  email?: string;
  lifetime_value?: number;
  status: 'active' | 'churned' | 'paused';
  converted_at?: string;
}

interface CustomerCardProps {
  customer: Customer;
  isDark: boolean;
  onClick?: () => void;
}

export function CustomerCard({ customer, isDark, onClick }: CustomerCardProps) {
  const cardBg = isDark ? 'bg-zinc-900/80 backdrop-blur-sm' : 'bg-white/90 backdrop-blur-sm';
  const cardBorder = isDark ? 'border border-white/20' : 'border border-zinc-300';
  const textPrimary = isDark ? 'text-white' : 'text-zinc-900';
  const textSecondary = isDark ? 'text-zinc-400' : 'text-zinc-600';

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div
      onClick={onClick}
      className={`${cardBg} ${cardBorder} rounded-2xl overflow-hidden cursor-pointer transition-all hover:scale-[1.02] hover:shadow-xl`}
      style={{ minHeight: '350px', aspectRatio: '16/10' }}
    >
      {/* Website Preview - Takes top 75% */}
      <div className="relative w-full h-[75%] bg-white overflow-hidden">
        {customer.website ? (
          <iframe
            src={customer.website}
            className="absolute top-0 left-0 w-[500%] h-[500%] origin-top-left scale-[0.2] pointer-events-none"
            title={`${customer.company_name} website`}
            sandbox="allow-scripts allow-same-origin"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-100 dark:bg-zinc-800">
            <Globe className={`w-12 h-12 ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`} />
          </div>
        )}

        {/* Status Badge */}
        <div className="absolute top-3 right-3">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            customer.status === 'active'
              ? 'bg-green-500/90 text-white'
              : customer.status === 'paused'
              ? 'bg-amber-500/90 text-white'
              : 'bg-zinc-500/90 text-white'
          }`}>
            {customer.status.charAt(0).toUpperCase() + customer.status.slice(1)}
          </span>
        </div>
      </div>

      {/* Info Section - Bottom 25% */}
      <div className="h-[25%] px-4 py-3 flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <h3 className={`font-semibold text-sm ${textPrimary} truncate`}>
            {customer.company_name}
          </h3>
          {customer.contact_name && (
            <p className={`text-xs ${textSecondary} truncate`}>
              {customer.contact_name}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Lifetime Value */}
          {customer.lifetime_value && customer.lifetime_value > 0 && (
            <div className="flex items-center gap-1">
              <DollarSign className="w-3 h-3 text-green-500" />
              <span className={`text-sm font-medium ${textPrimary}`}>
                {formatCurrency(customer.lifetime_value)}
              </span>
            </div>
          )}

          {/* External Link */}
          {customer.website && (
            <a
              href={customer.website}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className={`p-2 rounded-lg ${isDark ? 'hover:bg-zinc-700' : 'hover:bg-zinc-100'} transition-colors`}
            >
              <ExternalLink className={`w-4 h-4 ${textSecondary}`} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
