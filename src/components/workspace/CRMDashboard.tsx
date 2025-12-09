'use client';

import { useState, useMemo } from 'react';
import {
  Users,
  Globe,
  DollarSign,
  TrendingUp,
  Filter,
  Search,
  ExternalLink,
  Eye,
  CreditCard,
  CheckCircle,
  Clock,
  AlertCircle,
  MoreHorizontal,
  ChevronRight,
  Loader2,
  Plus,
  FileCode,
  Send,
  Trash2,
  MapPin,
  X,
} from 'lucide-react';
import type { Lead, OutreachArtifact, LeadsArtifact, LeadWebsiteArtifact } from '@/types/database';

// ============================================
// BUSINESS CATEGORIES FOR SEARCH
// ============================================

const BUSINESS_CATEGORIES = {
  'Home Services': [
    'plumbers', 'electricians', 'HVAC', 'handyman', 'landscaping',
    'cleaning services', 'roofers', 'painters', 'pest control'
  ],
  'Food & Beverage': [
    'restaurants', 'food trucks', 'bakeries', 'catering',
    'cafes', 'delis'
  ],
  'Health & Wellness': [
    'gyms', 'yoga studios', 'massage therapists', 'personal trainers',
    'chiropractors', 'dentists'
  ],
  'Professional Services': [
    'accountants', 'lawyers', 'real estate agents', 'insurance agents',
    'consultants', 'notary'
  ],
  'Retail': [
    'boutiques', 'gift shops', 'jewelry stores', 'florists',
    'pet stores', 'thrift stores'
  ],
  'Auto & Transport': [
    'auto repair', 'car detailing', 'towing services',
    'tire shops', 'auto body shops'
  ],
};

// ============================================
// TYPES
// ============================================

interface CRMDashboardProps {
  leads: LeadsArtifact | null;
  outreach: OutreachArtifact | null;
  leadWebsites?: LeadWebsiteArtifact[];
  isLoading: boolean;
  onGenerateLeads: () => void;
  onAdvancedSearch?: (params: { location: string; category: string; noWebsiteOnly: boolean }) => void;
  onUpdateLeadStatus?: (leadId: string, status: Lead['status']) => void;
  onLeadClick?: (lead: Lead) => void;
  onCreatePaymentLink?: (lead: Lead) => void;
  onDeleteLead?: (leadId: string) => void;
}

type WebsiteFilter = 'all' | 'none' | 'ready' | 'sent' | 'paid';
type SortOption = 'newest' | 'score' | 'deal' | 'name';

// ============================================
// MAIN DASHBOARD COMPONENT
// ============================================

export default function CRMDashboard({
  leads,
  outreach,
  leadWebsites = [],
  isLoading,
  onGenerateLeads,
  onAdvancedSearch,
  onUpdateLeadStatus,
  onLeadClick,
  onCreatePaymentLink,
  onDeleteLead,
}: CRMDashboardProps) {
  const [websiteFilter, setWebsiteFilter] = useState<WebsiteFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [searchQuery, setSearchQuery] = useState('');

  // Advanced Search Panel State
  const [showSearchPanel, setShowSearchPanel] = useState(false);
  const [searchLocation, setSearchLocation] = useState('');
  const [searchCategory, setSearchCategory] = useState('');
  const [customBusinessType, setCustomBusinessType] = useState('');
  const [numberOfLeads, setNumberOfLeads] = useState(20);
  const [noWebsiteOnly, setNoWebsiteOnly] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const handleAdvancedSearch = () => {
    if (!searchLocation.trim()) return;

    setIsSearching(true);
    setShowSearchPanel(false);

    // Use custom business type if provided, otherwise use dropdown category
    const businessType = customBusinessType.trim() || searchCategory;

    // Build the prompt for the chat
    let prompt = `Find ${numberOfLeads} leads in ${searchLocation}`;
    if (businessType) {
      prompt = `Find ${numberOfLeads} ${businessType} in ${searchLocation}`;
    }
    if (noWebsiteOnly) {
      prompt += ' that don\'t have a website';
    }

    // Dispatch event for ChatPanel to handle
    window.dispatchEvent(new CustomEvent('autoSubmitPrompt', {
      detail: {
        prompt,
        // Pass structured params for tool-leads.ts
        leadSearchParams: {
          location: searchLocation,
          searchTerms: businessType || undefined,
          noWebsiteOnly,
          numberOfLeads,
          categories: businessType ? [businessType] : undefined,
        }
      }
    }));

    // Reset searching state after a delay
    setTimeout(() => setIsSearching(false), 2000);
  };

  const allLeads = leads?.leads || [];

  // Calculate stats
  const stats = useMemo(() => {
    const totalLeads = allLeads.length;
    // Count websites by checking if leads have previewToken
    const websitesCreated = allLeads.filter(lead => !!lead.previewToken).length;
    const totalPipelineValue = allLeads.reduce((sum, lead) => sum + (lead.dealValue || 0), 0);
    const totalPaid = allLeads
      .filter(lead => lead.stripePaymentStatus === 'paid')
      .reduce((sum, lead) => sum + (lead.paidAmount || 0), 0);

    return {
      totalLeads,
      websitesCreated,
      totalPipelineValue,
      totalPaid,
    };
  }, [allLeads]);

  // Check if lead has a website (by checking previewToken)
  const leadHasWebsite = (lead: Lead) => {
    return !!lead.previewToken;
  };

  // Filter and sort leads
  const filteredLeads = useMemo(() => {
    let filtered = [...allLeads];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(lead =>
        lead.companyName.toLowerCase().includes(query) ||
        lead.industry?.toLowerCase().includes(query) ||
        lead.contactEmail?.toLowerCase().includes(query)
      );
    }

    // Website status filter
    if (websiteFilter !== 'all') {
      filtered = filtered.filter(lead => {
        const hasWebsite = leadHasWebsite(lead);
        const isPaid = lead.stripePaymentStatus === 'paid';

        switch (websiteFilter) {
          case 'none':
            return !hasWebsite;
          case 'ready':
            return hasWebsite && !isPaid;
          case 'sent':
            return hasWebsite && lead.websiteStatus === 'sent';
          case 'paid':
            return isPaid;
          default:
            return true;
        }
      });
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'score':
          return (b.score || 0) - (a.score || 0);
        case 'deal':
          return (b.dealValue || 0) - (a.dealValue || 0);
        case 'name':
          return a.companyName.localeCompare(b.companyName);
        case 'newest':
        default:
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }
    });

    return filtered;
  }, [allLeads, websiteFilter, sortBy, searchQuery]);

  // Loading state
  if (isLoading && !leads) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  // Empty state - show search panel
  if (!leads || allLeads.length === 0) {
    return (
      <div className="h-full flex flex-col bg-zinc-900">
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="w-20 h-20 flex items-center justify-center mb-6">
            <img
              src="/anythingiconlight.png"
              alt="Anything"
              className="w-16 h-16"
            />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No Leads Yet</h3>
          <p className="text-zinc-400 text-center mb-6 max-w-md">
            Start building your sales pipeline by finding local businesses that need websites.
          </p>

          {/* Inline Search Panel for Empty State */}
          <div className="w-full max-w-md p-4 bg-zinc-800/50 border border-zinc-700 rounded-xl space-y-4">
            {/* Location Input */}
            <div>
              <label className="text-xs text-zinc-400 mb-1.5 block">Location *</label>
              <div className="relative">
                <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                  placeholder="Austin, TX"
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 text-sm"
                />
              </div>
            </div>

            {/* Custom Business Type Input */}
            <div>
              <label className="text-xs text-zinc-400 mb-1.5 block">Business Type</label>
              <input
                type="text"
                value={customBusinessType}
                onChange={(e) => {
                  setCustomBusinessType(e.target.value);
                  if (e.target.value) setSearchCategory(''); // Clear dropdown if custom type entered
                }}
                placeholder="e.g., dog groomers, yoga studios, food trucks..."
                className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 text-sm"
              />
              <p className="text-xs text-zinc-500 mt-1">Type any business category or pick from presets below</p>
            </div>

            {/* Category Dropdown (as preset options) */}
            <div>
              <label className="text-xs text-zinc-400 mb-1.5 block">Or choose a preset</label>
              <select
                value={searchCategory}
                onChange={(e) => {
                  setSearchCategory(e.target.value);
                  if (e.target.value) setCustomBusinessType(''); // Clear custom if dropdown selected
                }}
                className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 appearance-none cursor-pointer"
              >
                <option value="">All businesses</option>
                {Object.entries(BUSINESS_CATEGORIES).map(([group, categories]) => (
                  <optgroup key={group} label={group}>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            {/* Number of Leads */}
            <div>
              <label className="text-xs text-zinc-400 mb-1.5 block">Number of Leads</label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={5}
                  max={50}
                  step={5}
                  value={numberOfLeads}
                  onChange={(e) => setNumberOfLeads(parseInt(e.target.value))}
                  className="flex-1 h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <span className="w-12 text-center text-white font-medium bg-zinc-900 px-2 py-1 rounded border border-zinc-700 text-sm">
                  {numberOfLeads}
                </span>
              </div>
            </div>

            {/* No Website Only Toggle */}
            <div className="flex items-center justify-between p-3 bg-zinc-900 rounded-lg border border-zinc-700">
              <div>
                <span className="text-sm font-medium text-white">No Website Only</span>
                <p className="text-xs text-zinc-500 mt-0.5">Only find businesses without a website</p>
              </div>
              <button
                onClick={() => setNoWebsiteOnly(!noWebsiteOnly)}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  noWebsiteOnly ? 'bg-blue-500' : 'bg-zinc-700'
                }`}
              >
                <div
                  className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                    noWebsiteOnly ? 'translate-x-[22px]' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            {/* Search Button */}
            <button
              onClick={handleAdvancedSearch}
              disabled={!searchLocation.trim() || isSearching}
              className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isSearching ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search size={16} />
                  Find {numberOfLeads} Leads
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-zinc-900">
      {/* Header with Find Leads Button */}
      <div className="px-6 pt-6 pb-2 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">CRM Dashboard</h2>
        <button
          onClick={() => setShowSearchPanel(!showSearchPanel)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
            showSearchPanel
              ? 'bg-blue-500 text-white'
              : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white'
          }`}
        >
          {isSearching ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Searching...
            </>
          ) : (
            <>
              <Plus size={16} />
              Find Leads
            </>
          )}
        </button>
      </div>

      {/* Advanced Search Panel */}
      {showSearchPanel && (
        <div className="mx-6 mb-4 p-4 bg-zinc-800/50 border border-zinc-700 rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-white">Find New Leads</h3>
            <button
              onClick={() => setShowSearchPanel(false)}
              className="p-1 rounded hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Location Input */}
          <div>
            <label className="text-xs text-zinc-400 mb-1.5 block">Location *</label>
            <div className="relative">
              <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
                placeholder="Austin, TX"
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 text-sm"
              />
            </div>
          </div>

          {/* Custom Business Type Input */}
          <div>
            <label className="text-xs text-zinc-400 mb-1.5 block">Business Type</label>
            <input
              type="text"
              value={customBusinessType}
              onChange={(e) => {
                setCustomBusinessType(e.target.value);
                if (e.target.value) setSearchCategory(''); // Clear dropdown if custom type entered
              }}
              placeholder="e.g., dog groomers, yoga studios, food trucks..."
              className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 text-sm"
            />
            <p className="text-xs text-zinc-500 mt-1">Type any business category or pick from presets below</p>
          </div>

          {/* Category Dropdown (as preset options) */}
          <div>
            <label className="text-xs text-zinc-400 mb-1.5 block">Or choose a preset</label>
            <select
              value={searchCategory}
              onChange={(e) => {
                setSearchCategory(e.target.value);
                if (e.target.value) setCustomBusinessType(''); // Clear custom if dropdown selected
              }}
              className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 appearance-none cursor-pointer"
            >
              <option value="">All businesses</option>
              {Object.entries(BUSINESS_CATEGORIES).map(([group, categories]) => (
                <optgroup key={group} label={group}>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Number of Leads */}
          <div>
            <label className="text-xs text-zinc-400 mb-1.5 block">Number of Leads</label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={5}
                max={50}
                step={5}
                value={numberOfLeads}
                onChange={(e) => setNumberOfLeads(parseInt(e.target.value))}
                className="flex-1 h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <span className="w-12 text-center text-white font-medium bg-zinc-900 px-2 py-1 rounded border border-zinc-700 text-sm">
                {numberOfLeads}
              </span>
            </div>
          </div>

          {/* No Website Only Toggle */}
          <div className="flex items-center justify-between p-3 bg-zinc-900 rounded-lg border border-zinc-700">
            <div>
              <span className="text-sm font-medium text-white">No Website Only</span>
              <p className="text-xs text-zinc-500 mt-0.5">Only find businesses without a website</p>
            </div>
            <button
              onClick={() => setNoWebsiteOnly(!noWebsiteOnly)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                noWebsiteOnly ? 'bg-blue-500' : 'bg-zinc-700'
              }`}
            >
              <div
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                  noWebsiteOnly ? 'translate-x-[22px]' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {/* Search Button */}
          <button
            onClick={handleAdvancedSearch}
            disabled={!searchLocation.trim()}
            className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Search size={16} />
            Find {numberOfLeads} Leads
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="px-6 pb-4 grid grid-cols-4 gap-4">
        <StatCard
          label="Total Leads"
          value={stats.totalLeads}
          icon={Users}
        />
        <StatCard
          label="Websites Created"
          value={stats.websitesCreated}
          icon={Globe}
        />
        <StatCard
          label="Pipeline Value"
          value={`$${stats.totalPipelineValue.toLocaleString()}`}
          icon={TrendingUp}
        />
        <StatCard
          label="Revenue Collected"
          value={`$${stats.totalPaid.toLocaleString()}`}
          icon={DollarSign}
        />
      </div>

      {/* Filters Row */}
      <div className="px-6 pb-4 flex items-center gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search leads..."
            className="w-full pl-10 pr-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 text-sm"
          />
        </div>

        {/* Website Status Filter */}
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-zinc-500" />
          <div className="flex bg-zinc-800 rounded-lg p-1">
            {(['all', 'none', 'ready', 'paid'] as WebsiteFilter[]).map(filter => (
              <button
                key={filter}
                onClick={() => setWebsiteFilter(filter)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  websiteFilter === filter
                    ? 'bg-blue-500 text-white'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {filter === 'all' && 'All'}
                {filter === 'none' && 'No Website'}
                {filter === 'ready' && 'Website Ready'}
                {filter === 'paid' && 'Paid'}
              </button>
            ))}
          </div>
        </div>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortOption)}
          className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
        >
          <option value="newest">Newest First</option>
          <option value="score">Highest Score</option>
          <option value="deal">Highest Deal</option>
          <option value="name">Name A-Z</option>
        </select>
      </div>

      {/* Table Header */}
      <div className="px-6 py-3 bg-zinc-800/50 border-y border-zinc-700">
        <div className="grid grid-cols-12 gap-4 text-xs font-medium text-zinc-500 uppercase tracking-wide">
          <div className="col-span-3">Company</div>
          <div className="col-span-2">Deal Value</div>
          <div className="col-span-2">Website</div>
          <div className="col-span-2">Payment</div>
          <div className="col-span-1">Score</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>
      </div>

      {/* Leads List */}
      <div className="flex-1 overflow-y-auto">
        {filteredLeads.length === 0 ? (
          <div className="text-center py-12 text-zinc-500">
            <p>No leads match your filters</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800">
            {filteredLeads.map(lead => (
              <LeadTableRow
                key={lead.id}
                lead={lead}
                onClick={() => onLeadClick?.(lead)}
                onCreatePaymentLink={() => onCreatePaymentLink?.(lead)}
                onDelete={() => onDeleteLead?.(lead.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// STAT CARD COMPONENT
// ============================================

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}) {
  return (
    <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide">{label}</span>
        <Icon size={18} className="text-zinc-400" />
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
    </div>
  );
}

// ============================================
// LEAD TABLE ROW COMPONENT
// ============================================

function LeadTableRow({
  lead,
  onClick,
  onCreatePaymentLink,
  onDelete,
}: {
  lead: Lead;
  onClick?: () => void;
  onCreatePaymentLink?: () => void;
  onDelete?: () => void;
}) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const hasWebsite = !!lead.previewToken;
  const isPaid = lead.stripePaymentStatus === 'paid';
  const hasPendingPayment = lead.stripePaymentStatus === 'pending' && lead.stripePaymentLinkUrl;

  return (
    <div
      className="px-6 py-4 hover:bg-zinc-800/50 transition-colors cursor-pointer group"
      onClick={onClick}
    >
      <div className="grid grid-cols-12 gap-4 items-center">
        {/* Company - col-span-3 */}
        <div className="col-span-3 min-w-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 font-medium text-sm shrink-0">
              {lead.companyName.substring(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h4 className="font-medium text-white truncate">{lead.companyName}</h4>
              <p className="text-xs text-zinc-500 truncate">{lead.industry || 'Unknown Industry'}</p>
            </div>
          </div>
        </div>

        {/* Deal Value - col-span-2 */}
        <div className="col-span-2">
          {lead.dealValue ? (
            <span className="text-white font-medium">
              ${lead.dealValue.toLocaleString()}
              <span className="text-zinc-500 text-xs ml-1">{lead.dealCurrency || 'USD'}</span>
            </span>
          ) : (
            <span className="text-zinc-500 text-sm">No deal set</span>
          )}
        </div>

        {/* Website Status - col-span-2 */}
        <div className="col-span-2">
          {hasWebsite ? (
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-medium">
                <CheckCircle size={12} />
                Ready
              </span>
              <a
                href={`/preview/${lead.previewToken}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="p-1 rounded hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
              >
                <Eye size={14} />
              </a>
            </div>
          ) : (
            <span className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-zinc-700 text-zinc-400 text-xs font-medium">
              <Clock size={12} />
              None
            </span>
          )}
        </div>

        {/* Payment Status - col-span-2 */}
        <div className="col-span-2">
          {isPaid ? (
            <span className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-medium">
              <DollarSign size={12} />
              Paid ${lead.paidAmount?.toLocaleString()}
            </span>
          ) : hasPendingPayment ? (
            <a
              href={lead.stripePaymentLinkUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-orange-500/20 text-orange-400 text-xs font-medium hover:bg-orange-500/30 transition-colors"
            >
              <Clock size={12} />
              Awaiting Payment
              <ExternalLink size={10} />
            </a>
          ) : (
            <span className="text-zinc-500 text-xs">-</span>
          )}
        </div>

        {/* Score - col-span-1 */}
        <div className="col-span-1">
          <div className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getScoreStyle(lead.score)}`}>
            {lead.score}
          </div>
        </div>

        {/* Actions - col-span-2 */}
        <div className="col-span-2 flex items-center justify-end gap-2">
          {hasWebsite && !isPaid && !hasPendingPayment && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCreatePaymentLink?.();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-medium rounded-lg transition-colors"
            >
              <CreditCard size={14} />
              Get Paid!
            </button>
          )}

          {!hasWebsite && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClick?.();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium rounded-lg transition-colors"
            >
              <FileCode size={14} />
              Create Website
            </button>
          )}

          {/* Delete button with confirmation */}
          {showDeleteConfirm ? (
            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => {
                  onDelete?.();
                  setShowDeleteConfirm(false);
                }}
                className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white text-xs font-medium rounded transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-2 py-1 bg-zinc-700 hover:bg-zinc-600 text-white text-xs font-medium rounded transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDeleteConfirm(true);
              }}
              className="p-1.5 rounded-lg hover:bg-red-500/20 text-zinc-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
              title="Delete lead"
            >
              <Trash2 size={16} />
            </button>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              onClick?.();
            }}
            className="p-1.5 rounded-lg hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function getScoreStyle(score: number): string {
  if (score >= 80) return 'bg-green-500/20 text-green-400';
  if (score >= 60) return 'bg-blue-500/20 text-blue-400';
  if (score >= 40) return 'bg-orange-500/20 text-orange-400';
  return 'bg-red-500/20 text-red-400';
}
