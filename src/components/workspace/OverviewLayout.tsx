'use client';

import { useMemo } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { Sparkles, DollarSign, Globe, Users, Check, ArrowRight } from 'lucide-react';

export default function OverviewLayout() {
  const { artifacts, runningTools, setWorkspaceView } = useProjectStore();

  // Check loading states
  const isIdentityLoading = runningTools.has('identity');
  const isBusinessPlanLoading = runningTools.has('businessplan');
  const isWebsiteLoading = runningTools.has('website');
  const isLeadsLoading = runningTools.has('leads');

  // Check completed states
  const hasIdentity = !!artifacts.identity;
  const hasOffer = !!artifacts.businessPlan?.pricingTiers?.length;
  const hasWebsite = !!artifacts.website;
  const hasLeads = !!artifacts.leads?.leads?.length;

  // Create website preview URL
  const websitePreviewUrl = useMemo(() => {
    if (!artifacts.website?.files) return null;
    const htmlFile = artifacts.website.files.find(f => f.path === '/index.html');
    if (!htmlFile) return null;
    const cssFile = artifacts.website.files.find(f => f.path === '/styles.css');
    const jsFile = artifacts.website.files.find(f => f.path === '/script.js');
    let modifiedHtml = htmlFile.content;
    if (cssFile) modifiedHtml = modifiedHtml.replace('</head>', `<style>${cssFile.content}</style></head>`);
    if (jsFile) modifiedHtml = modifiedHtml.replace('</body>', `<script>${jsFile.content}</script></body>`);
    const blob = new Blob([modifiedHtml], { type: 'text/html' });
    return URL.createObjectURL(blob);
  }, [artifacts.website]);

  // Count completed items
  const completedCount = [hasIdentity, hasOffer, hasWebsite, hasLeads].filter(Boolean).length;
  const totalCount = 4;

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header with progress */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white">
              {artifacts.identity?.name || 'Your Business'}
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              {completedCount === 0
                ? 'Send a message to start building'
                : `${completedCount} of ${totalCount} complete`}
            </p>
          </div>
          {completedCount > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex -space-x-1">
                {[...Array(totalCount)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-2.5 h-2.5 rounded-full border-2 border-white dark:border-zinc-900 ${
                      i < completedCount ? 'bg-green-500' : 'bg-zinc-200 dark:bg-zinc-700'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Main Grid - 2x2 layout */}
        <div className="grid grid-cols-2 gap-4">
          {/* Brand Card */}
          <DashboardCard
            title="Brand"
            description="Logo, name & colors"
            icon={Sparkles}
            isLoading={isIdentityLoading}
            isComplete={hasIdentity}
            onClick={() => setWorkspaceView('BRAND')}
          >
            {hasIdentity && artifacts.identity && (
              <div className="flex items-center gap-3 mt-3">
                <img
                  src={artifacts.identity.logoUrl}
                  alt=""
                  className="w-10 h-10 rounded-lg object-contain bg-white dark:bg-zinc-800"
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">
                    {artifacts.identity.name}
                  </p>
                  <div className="flex gap-1 mt-1">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: artifacts.identity.colors.primary }} />
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: artifacts.identity.colors.secondary }} />
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: artifacts.identity.colors.accent }} />
                  </div>
                </div>
              </div>
            )}
          </DashboardCard>

          {/* Offer Card */}
          <DashboardCard
            title="Offer"
            description="Pricing & packages"
            icon={DollarSign}
            isLoading={isBusinessPlanLoading}
            isComplete={hasOffer}
            onClick={() => setWorkspaceView('FINANCE')}
          >
            {hasOffer && artifacts.businessPlan?.pricingTiers && (
              <div className="mt-3 space-y-1.5">
                {artifacts.businessPlan.pricingTiers.slice(0, 3).map((tier, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-zinc-600 dark:text-zinc-400">{tier.name}</span>
                    <span className="font-medium text-zinc-900 dark:text-white">{tier.price}</span>
                  </div>
                ))}
              </div>
            )}
          </DashboardCard>

          {/* Website Card */}
          <DashboardCard
            title="Website"
            description="Landing page"
            icon={Globe}
            isLoading={isWebsiteLoading}
            isComplete={hasWebsite}
            onClick={() => setWorkspaceView('SITE')}
          >
            {websitePreviewUrl && (
              <div className="mt-3 relative w-full h-24 rounded-lg overflow-hidden bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                <iframe
                  src={websitePreviewUrl}
                  className="w-full h-full border-0 scale-[0.2] origin-top-left pointer-events-none"
                  style={{ width: '500%', height: '500%' }}
                  sandbox="allow-same-origin"
                  title="Preview"
                />
              </div>
            )}
          </DashboardCard>

          {/* Leads Card */}
          <DashboardCard
            title="Leads"
            description="Prospects & CRM"
            icon={Users}
            isLoading={isLeadsLoading}
            isComplete={hasLeads}
            onClick={() => setWorkspaceView('CRM')}
          >
            {hasLeads && artifacts.leads?.leads && (
              <div className="mt-3">
                <div className="text-2xl font-semibold text-zinc-900 dark:text-white">
                  {artifacts.leads.leads.length}
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">prospects found</p>
              </div>
            )}
          </DashboardCard>
        </div>

        {/* Quick Actions - Only show when there's content */}
        {hasIdentity && (
          <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-3">
              Quick Actions
            </p>
            <div className="flex flex-wrap gap-2">
              <QuickAction onClick={() => setWorkspaceView('SITE')}>
                Edit Website
              </QuickAction>
              <QuickAction onClick={() => setWorkspaceView('BRAND')}>
                Update Brand
              </QuickAction>
              <QuickAction onClick={() => setWorkspaceView('FINANCE')}>
                Change Pricing
              </QuickAction>
              {!hasLeads && (
                <QuickAction onClick={() => setWorkspaceView('CRM')}>
                  Find Leads
                </QuickAction>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// DASHBOARD CARD COMPONENT - Neutral Design
// =============================================================================

interface DashboardCardProps {
  title: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  isLoading: boolean;
  isComplete: boolean;
  isLocked?: boolean;
  onClick: () => void;
  children?: React.ReactNode;
}

function DashboardCard({
  title,
  description,
  icon: Icon,
  isLoading,
  isComplete,
  isLocked,
  onClick,
  children,
}: DashboardCardProps) {
  // Locked state
  if (isLocked) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-700 p-5 opacity-50">
        <div className="flex items-center justify-between mb-2">
          <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
            <Icon size={20} className="text-zinc-400 dark:text-zinc-500" />
          </div>
        </div>
        <h3 className="text-base font-semibold text-zinc-400 dark:text-zinc-500">{title}</h3>
        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">Complete Brand & Offer first</p>
      </div>
    );
  }

  // Loading state
  if (isLoading && !isComplete) {
    return (
      <div className="rounded-2xl bg-white dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 p-5">
        <div className="flex items-center justify-between mb-2">
          <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-700 flex items-center justify-center">
            <Icon size={20} className="text-zinc-500 dark:text-zinc-400" />
          </div>
          <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
        </div>
        <div className="mt-3">
          <div className="h-4 w-20 bg-zinc-200/50 dark:bg-zinc-700/50 rounded animate-pulse" />
          <div className="h-3 w-28 bg-zinc-200/30 dark:bg-zinc-700/30 rounded mt-1 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className="rounded-2xl bg-white dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 p-5 cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-zinc-300 dark:hover:border-zinc-600 group"
    >
      <div className="flex items-center justify-between mb-1">
        <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-700 flex items-center justify-center group-hover:bg-zinc-200 dark:group-hover:bg-zinc-600 transition-colors">
          <Icon size={20} className="text-zinc-600 dark:text-zinc-300" />
        </div>
        <div className="flex items-center gap-2">
          {isComplete && (
            <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
              <Check size={12} className="text-white" />
            </div>
          )}
          <ArrowRight size={16} className="text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      <h3 className="text-base font-semibold text-zinc-900 dark:text-white mt-3">{title}</h3>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{description}</p>

      {children}
    </div>
  );
}

// =============================================================================
// QUICK ACTION BUTTON
// =============================================================================

function QuickAction({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
    >
      {children}
    </button>
  );
}
