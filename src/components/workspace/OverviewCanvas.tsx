'use client';

import { useState, useEffect, useRef } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { Globe, Users, Check, Paintbrush, Image, Crown } from 'lucide-react';
import { useCanvasBackground, backgrounds } from '@/hooks/useCanvasBackground';
import { CustomerCard, type Customer } from './CustomerCard';

export default function OverviewCanvas() {
  const { setCanvasState, setWorkspaceView, artifacts } = useProjectStore();
  const { selectedBgId, setSelectedBgId, bgStyle, isDark } = useCanvasBackground();

  const [pickerOpen, setPickerOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false);
      }
    };
    if (pickerOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [pickerOpen]);

  // Card styling based on background
  const cardBg = isDark ? 'bg-zinc-900/80 backdrop-blur-sm' : 'bg-white/90 backdrop-blur-sm';
  const cardBorder = isDark ? 'border border-white/20' : 'border border-zinc-300';
  const titleColor = isDark ? 'text-white' : 'text-zinc-900';
  const descColor = isDark ? 'text-zinc-400' : 'text-zinc-600';
  const bulletColor = isDark ? 'text-zinc-300' : 'text-zinc-700';
  const iconColor = isDark ? 'text-zinc-500' : 'text-zinc-400';

  // Create blob URL for website preview (same approach as WebsiteFocusView)
  useEffect(() => {
    if (!artifacts.website?.files) {
      setPreviewUrl(null);
      return;
    }

    const htmlFile = artifacts.website.files.find(f => f.path === '/index.html');
    const cssFile = artifacts.website.files.find(f => f.path === '/styles.css');
    const jsFile = artifacts.website.files.find(f => f.path === '/script.js');

    if (!htmlFile) {
      setPreviewUrl(null);
      return;
    }

    let html = htmlFile.content;
    if (cssFile) {
      html = html.replace('</head>', `<style>${cssFile.content}</style></head>`);
    }
    if (jsFile) {
      html = html.replace('</body>', `<script>${jsFile.content}</script></body>`);
    }

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    setPreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [artifacts.website]);

  // Get customers from CRM artifact (converted leads)
  const customers: Customer[] = artifacts.crm?.clients?.map((client) => ({
    id: client.id,
    company_name: client.companyName || 'Unknown Company',
    website: undefined, // Not stored in CRM artifact clients array
    contact_name: client.primaryContact?.name,
    email: client.primaryContact?.email,
    lifetime_value: client.financialMetrics?.lifetimeValue || 0,
    status: client.status === 'active' ? 'active' : client.status === 'paused' ? 'paused' : client.status === 'churned' ? 'churned' : 'active',
    converted_at: client.lastActivityDate,
  })) || [];

  return (
    <div
      className="relative h-full overflow-auto flex items-center justify-center transition-all duration-300 rounded-tl-2xl"
      style={bgStyle}
    >
      {/* Background Picker */}
      <div ref={pickerRef} className="absolute top-4 right-4 z-10">
        <button
          onClick={() => setPickerOpen(!pickerOpen)}
          className={`p-2 rounded-lg transition-colors ${
            isDark
              ? 'bg-zinc-800/70 hover:bg-zinc-700 text-white'
              : 'bg-white/90 hover:bg-white text-zinc-900 border border-zinc-200'
          }`}
          title="Change background"
        >
          <Paintbrush className="w-4 h-4" />
        </button>

        {/* Picker Dropdown */}
        {pickerOpen && (
          <div className={`absolute top-full right-0 mt-2 p-3 rounded-xl shadow-xl ${
            isDark ? 'bg-zinc-900 border border-zinc-800' : 'bg-white border border-zinc-200'
          }`}>
            <div className="flex gap-2">
              {backgrounds.map(bg => (
                <button
                  key={bg.id}
                  onClick={() => {
                    setSelectedBgId(bg.id);
                    setPickerOpen(false);
                  }}
                  className={`relative w-10 h-10 rounded-lg overflow-hidden border-2 transition-all ${
                    selectedBgId === bg.id
                      ? 'border-white ring-2 ring-white/30'
                      : 'border-transparent hover:border-zinc-500'
                  }`}
                  title={bg.label}
                >
                  {bg.type === 'color' ? (
                    <div className="w-full h-full" style={{ backgroundColor: bg.value }} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                      <Image className="w-4 h-4 text-zinc-400" />
                    </div>
                  )}
                  {selectedBgId === bg.id && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Grid Layout - Three cards: Website, Leads, and Customers */}
      <div className="grid grid-cols-3 gap-4 p-6" style={{ maxWidth: '1200px' }}>

        {/* Website Card - Large preview */}
        <div
          className={`col-span-1 rounded-2xl cursor-pointer transition-all hover:scale-[1.02] overflow-hidden ${cardBorder}`}
          style={{ minHeight: '350px', aspectRatio: '16/10' }}
          onClick={() => {
            setCanvasState({ type: 'detail', view: 'website' });
            setWorkspaceView('SITE');
          }}
        >
          {/* Preview fills entire card */}
          <div className="relative w-full h-full bg-white">
            {previewUrl ? (
              <iframe
                src={previewUrl}
                className="absolute top-0 left-0 w-[500%] h-[500%] origin-top-left scale-[0.2] pointer-events-none"
                title="Website preview"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-zinc-100">
                <Globe className={`w-10 h-10 ${iconColor}`} />
              </div>
            )}
            {/* Label overlay */}
            <div className="absolute bottom-0 left-0 right-0 px-4 py-3 bg-gradient-to-t from-black/60 to-transparent">
              <h3 className="text-white text-sm font-medium">Your Website</h3>
            </div>
          </div>
        </div>

        {/* CRM/Leads Card */}
        <div
          className={`col-span-1 ${cardBg} ${cardBorder} rounded-2xl p-6 cursor-pointer transition-all hover:scale-[1.02] flex flex-col`}
          style={{ minHeight: '350px', aspectRatio: '16/10' }}
          onClick={() => {
            setCanvasState({ type: 'detail', view: 'leads' });
            setWorkspaceView('CRM');
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Users className={`w-5 h-5 ${iconColor}`} />
            <h3 className={`${titleColor} text-sm font-medium`}>Your Prospects</h3>
          </div>
          <p className={`${descColor} text-xs mb-4`}>
            Potential customers in your market.
          </p>
          <ul className="space-y-2 flex-1">
            <li className={`flex items-center gap-2 text-xs ${bulletColor}`}>
              <Check className={`w-3 h-3 ${iconColor} flex-shrink-0`} />
              Lead discovery & scoring
            </li>
            <li className={`flex items-center gap-2 text-xs ${bulletColor}`}>
              <Check className={`w-3 h-3 ${iconColor} flex-shrink-0`} />
              Contact info & website analysis
            </li>
            <li className={`flex items-center gap-2 text-xs ${bulletColor}`}>
              <Check className={`w-3 h-3 ${iconColor} flex-shrink-0`} />
              Outreach scripts & templates
            </li>
          </ul>
          {/* Lead count */}
          <div className={`mt-auto pt-4 border-t ${isDark ? 'border-zinc-700' : 'border-zinc-200'}`}>
            <span className={`text-2xl font-bold ${titleColor}`}>
              {artifacts.leads?.leads?.length || 0}
            </span>
            <span className={`text-sm ${descColor} ml-2`}>leads in pipeline</span>
          </div>
        </div>

        {/* Customers Card */}
        <div
          className={`col-span-1 ${cardBg} ${cardBorder} rounded-2xl p-6 cursor-pointer transition-all hover:scale-[1.02] flex flex-col`}
          style={{ minHeight: '350px', aspectRatio: '16/10' }}
          onClick={() => {
            // Could navigate to a dedicated customers view in the future
            setCanvasState({ type: 'detail', view: 'leads' });
            setWorkspaceView('CRM');
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Crown className={`w-5 h-5 text-amber-500`} />
            <h3 className={`${titleColor} text-sm font-medium`}>Your Customers</h3>
          </div>
          <p className={`${descColor} text-xs mb-4`}>
            Converted leads with their websites.
          </p>

          {customers.length > 0 ? (
            <div className="flex-1 space-y-2 overflow-hidden">
              {customers.slice(0, 3).map((customer) => (
                <div
                  key={customer.id}
                  className={`flex items-center gap-3 p-2 rounded-lg ${isDark ? 'bg-zinc-800' : 'bg-zinc-100'}`}
                >
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500/20 to-pink-500/20 flex items-center justify-center overflow-hidden">
                    {customer.website ? (
                      <Globe className={`w-4 h-4 ${isDark ? 'text-orange-400' : 'text-orange-500'}`} />
                    ) : (
                      <Crown className="w-4 h-4 text-amber-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-medium ${titleColor} truncate`}>
                      {customer.company_name}
                    </p>
                    {customer.lifetime_value && customer.lifetime_value > 0 && (
                      <p className="text-xs text-green-500">
                        ${customer.lifetime_value.toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              {customers.length > 3 && (
                <p className={`text-xs ${descColor} text-center`}>
                  +{customers.length - 3} more
                </p>
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className={`text-xs ${descColor} text-center`}>
                Convert leads to see them here
              </p>
            </div>
          )}

          {/* Customer count */}
          <div className={`mt-auto pt-4 border-t ${isDark ? 'border-zinc-700' : 'border-zinc-200'}`}>
            <span className={`text-2xl font-bold ${titleColor}`}>
              {customers.length}
            </span>
            <span className={`text-sm ${descColor} ml-2`}>
              {customers.length === 1 ? 'customer' : 'customers'}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
