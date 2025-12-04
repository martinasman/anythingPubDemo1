'use client';

import { useState, useEffect, useRef } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { Globe, DollarSign, Users, Check, Paintbrush, Image } from 'lucide-react';
import { useCanvasBackground, backgrounds } from '@/hooks/useCanvasBackground';

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

      {/* Grid Layout - Centered, asymmetric */}
      <div className="grid grid-cols-3 gap-4 p-6" style={{ maxWidth: '800px' }}>

        {/* Website Card - Wide - Just the preview */}
        <div
          className={`col-span-2 rounded-2xl cursor-pointer transition-all hover:scale-[1.02] min-h-[240px] overflow-hidden ${cardBorder}`}
          onClick={() => {
            setCanvasState({ type: 'detail', view: 'website' });
            setWorkspaceView('SITE');
          }}
        >
          {/* Preview fills entire card */}
          <div className="relative w-full h-full min-h-[240px] bg-white">
            {previewUrl ? (
              <iframe
                src={previewUrl}
                className="absolute top-0 left-0 w-[500%] h-[500%] origin-top-left scale-[0.2] pointer-events-none"
                title="Website preview"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-zinc-100">
                <Globe className={`w-8 h-8 ${iconColor}`} />
              </div>
            )}
          </div>
        </div>

        {/* Ads Card - 2x2 grid preview */}
        <div
          className={`col-span-1 rounded-2xl cursor-pointer transition-all hover:scale-[1.02] min-h-[240px] overflow-hidden relative ${cardBorder}`}
          onClick={() => {
            setCanvasState({ type: 'detail', view: 'ads' });
            setWorkspaceView('ADS');
          }}
        >
          {artifacts.ads?.ads?.length ? (
            <div className="absolute inset-0 grid grid-cols-2 gap-1 p-1">
              {artifacts.ads.ads.slice(0, 4).map((ad) => (
                <div key={ad.id} className="relative overflow-hidden rounded-lg bg-zinc-800">
                  <img
                    src={ad.imageUrl}
                    alt={ad.headline}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className={`w-full h-full ${cardBg} flex items-center justify-center`}>
              <Image className={`w-8 h-8 ${iconColor}`} />
            </div>
          )}
        </div>

        {/* Offer Card */}
        <div
          className={`col-span-1 ${cardBg} ${cardBorder} rounded-2xl p-6 cursor-pointer transition-all hover:scale-[1.02] min-h-[240px] flex flex-col`}
          onClick={() => {
            setCanvasState({ type: 'detail', view: 'offer' });
            setWorkspaceView('FINANCE');
          }}
        >
          <h3 className={`${titleColor} text-sm font-medium mb-1`}>Your Pricing</h3>
          <p className={`${descColor} text-xs mb-3`}>
            Monetization strategy.
          </p>
          <ul className="space-y-1.5 flex-1">
            <li className={`flex items-center gap-2 text-xs ${bulletColor}`}>
              <Check className={`w-3 h-3 ${iconColor} flex-shrink-0`} />
              Pricing tiers
            </li>
            <li className={`flex items-center gap-2 text-xs ${bulletColor}`}>
              <Check className={`w-3 h-3 ${iconColor} flex-shrink-0`} />
              Value props
            </li>
          </ul>
          <div className="flex justify-end mt-2">
            <DollarSign className={`w-8 h-8 ${iconColor}`} />
          </div>
        </div>

        {/* CRM/Leads Card - Wide */}
        <div
          className={`col-span-2 ${cardBg} ${cardBorder} rounded-2xl p-6 cursor-pointer transition-all hover:scale-[1.02] min-h-[240px] flex flex-col`}
          onClick={() => {
            setCanvasState({ type: 'detail', view: 'leads' });
            setWorkspaceView('CRM');
          }}
        >
          <h3 className={`${titleColor} text-sm font-medium mb-1`}>Your Prospects</h3>
          <p className={`${descColor} text-xs mb-3`}>
            Potential customers in your market.
          </p>
          <ul className="space-y-1.5 flex-1">
            <li className={`flex items-center gap-2 text-xs ${bulletColor}`}>
              <Check className={`w-3 h-3 ${iconColor} flex-shrink-0`} />
              Lead discovery
            </li>
            <li className={`flex items-center gap-2 text-xs ${bulletColor}`}>
              <Check className={`w-3 h-3 ${iconColor} flex-shrink-0`} />
              Contact info
            </li>
            <li className={`flex items-center gap-2 text-xs ${bulletColor}`}>
              <Check className={`w-3 h-3 ${iconColor} flex-shrink-0`} />
              Outreach scripts
            </li>
          </ul>
          <div className="flex justify-end mt-2">
            <Users className={`w-8 h-8 ${iconColor}`} />
          </div>
        </div>

      </div>
    </div>
  );
}
