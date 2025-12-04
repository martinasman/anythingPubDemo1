'use client';

import { useState } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { useCanvasBackground } from '@/hooks/useCanvasBackground';
import { Check, X, RefreshCw, ArrowUp } from 'lucide-react';

// =============================================================================
// REAL BRAND LOGOS (SVG)
// =============================================================================

const FacebookLogo = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="12" fill="#1877F2"/>
    <path d="M16.5 12.5h-2.5v8h-3v-8h-2v-2.5h2v-1.5c0-2.5 1-4 4-4h2v2.5h-1.5c-1 0-1.5.5-1.5 1.5v1.5h3l-.5 2.5z" fill="white"/>
  </svg>
);

const InstagramLogo = ({ size = 24, id = 'ig' }: { size?: number; id?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <defs>
      <linearGradient id={`${id}-grad`} x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#FCAF45"/>
        <stop offset="50%" stopColor="#E1306C"/>
        <stop offset="100%" stopColor="#833AB4"/>
      </linearGradient>
    </defs>
    <rect width="24" height="24" rx="6" fill={`url(#${id}-grad)`}/>
    <rect x="4" y="4" width="16" height="16" rx="4" stroke="white" strokeWidth="1.5" fill="none"/>
    <circle cx="12" cy="12" r="4" stroke="white" strokeWidth="1.5" fill="none"/>
    <circle cx="17" cy="7" r="1.5" fill="white"/>
  </svg>
);

const GoogleLogo = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const LinkedInLogo = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <rect width="24" height="24" rx="4" fill="#0A66C2"/>
    <path d="M8 10v7H5v-7h3zm-1.5-1.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM19 17h-3v-3.5c0-1.5-1-2-1.5-2s-1.5.5-1.5 2V17h-3v-7h3v1c.5-.5 1.5-1 3-1 2 0 3 1.5 3 4v3z" fill="white"/>
  </svg>
);

const TikTokLogo = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <rect width="24" height="24" rx="4" fill="black"/>
    <path d="M17 9.5c-1.5 0-2.7-.8-3.2-2V7h-2.3v9c0 1.4-1.1 2.5-2.5 2.5S6.5 17.4 6.5 16s1.1-2.5 2.5-2.5c.3 0 .5 0 .8.1v-2.4c-.3 0-.5-.1-.8-.1-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5v-4.7c.9.5 1.9.8 3 .8V9.5z" fill="white"/>
    <path d="M17 9.5c-1.5 0-2.7-.8-3.2-2V7h-2.3v9c0 1.4-1.1 2.5-2.5 2.5S6.5 17.4 6.5 16s1.1-2.5 2.5-2.5c.3 0 .5 0 .8.1v-2.4c-.3 0-.5-.1-.8-.1-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5v-4.7c.9.5 1.9.8 3 .8V9.5z" fill="#00F2EA" transform="translate(-0.5, -0.5)"/>
    <path d="M17 9.5c-1.5 0-2.7-.8-3.2-2V7h-2.3v9c0 1.4-1.1 2.5-2.5 2.5S6.5 17.4 6.5 16s1.1-2.5 2.5-2.5c.3 0 .5 0 .8.1v-2.4c-.3 0-.5-.1-.8-.1-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5v-4.7c.9.5 1.9.8 3 .8V9.5z" fill="#FF0050" transform="translate(0.5, 0.5)"/>
  </svg>
);

// Platform logo component
const PlatformLogo = ({ platform, size = 24, id }: { platform: string; size?: number; id?: string }) => {
  switch (platform) {
    case 'facebook':
      return <FacebookLogo size={size} />;
    case 'instagram':
      return <InstagramLogo size={size} id={id} />;
    case 'google':
      return <GoogleLogo size={size} />;
    case 'linkedin':
      return <LinkedInLogo size={size} />;
    case 'tiktok':
      return <TikTokLogo size={size} />;
    default:
      return <GoogleLogo size={size} />;
  }
};

// =============================================================================
// PLATFORM & FORMAT CONFIGURATION
// =============================================================================

const PLATFORMS = [
  { id: 'facebook', name: 'Facebook' },
  { id: 'instagram', name: 'Instagram' },
  { id: 'google', name: 'Google' },
  { id: 'linkedin', name: 'LinkedIn' },
  { id: 'tiktok', name: 'TikTok' },
] as const;

const FORMATS = [
  { id: 'square', name: 'Square', ratio: '1:1' },
  { id: 'story', name: 'Story', ratio: '9:16' },
  { id: 'landscape', name: 'Landscape', ratio: '16:9' },
] as const;

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function AdsFocusView() {
  const { artifacts, runningTools, updateArtifact } = useProjectStore();
  const { isDark } = useCanvasBackground();
  const ads = artifacts.ads;
  const identity = artifacts.identity;

  // Form state
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['facebook', 'instagram']);
  const [selectedFormats, setSelectedFormats] = useState<string[]>(['square']);
  const [adMessage, setAdMessage] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [useBrandColors, setUseBrandColors] = useState(true);

  // Check if ads generation is running (not in ToolType, so check generic loading)
  const isAdsLoading = runningTools.size > 0;

  // Dynamic styling
  const textPrimary = isDark ? 'text-white' : 'text-zinc-900';
  const textSecondary = isDark ? 'text-zinc-400' : 'text-zinc-600';

  // Toggle platform selection
  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platformId)
        ? prev.filter(p => p !== platformId)
        : [...prev, platformId]
    );
  };

  // Toggle format selection
  const toggleFormat = (formatId: string) => {
    setSelectedFormats(prev =>
      prev.includes(formatId)
        ? prev.filter(f => f !== formatId)
        : [...prev, formatId]
    );
  };

  // Calculate total ads to generate
  const totalAds = selectedPlatforms.length * selectedFormats.length;

  // Submit handler
  const handleSubmit = () => {
    if (!adMessage || selectedPlatforms.length === 0 || selectedFormats.length === 0) return;

    const brandColorInfo = useBrandColors && identity?.colors
      ? ` Use brand colors: primary ${identity.colors.primary}, secondary ${identity.colors.secondary}.`
      : '';

    window.dispatchEvent(new CustomEvent('autoSubmitPrompt', {
      detail: {
        prompt: `Generate ${totalAds} ads for the following platforms: ${selectedPlatforms.join(', ')}.
Use these formats: ${selectedFormats.join(', ')}.
Main message/offer: "${adMessage}".
Target audience: "${targetAudience || 'general audience'}".${brandColorInfo}
Execute the generate_ads tool now.`
      }
    }));
  };

  // Remove ad handler
  const handleRemoveAd = (adId: string) => {
    if (!ads?.ads) return;
    const updatedAds = ads.ads.filter(ad => ad.id !== adId);
    updateArtifact('ads', { data: { ads: updatedAds } } as any);
  };

  // Remix ad handler
  const handleRemixAd = (ad: NonNullable<typeof ads>['ads'][0]) => {
    window.dispatchEvent(new CustomEvent('autoSubmitPrompt', {
      detail: {
        prompt: `Regenerate this specific ad with a fresh creative approach:
Platform: ${ad.platform}
Format: ${ad.format}
Keep the same platform and format but create a completely new visual.
Main message/offer: "${adMessage || 'same as before'}".
Target audience: "${targetAudience || 'general audience'}".
Execute the generate_ads tool now with platforms: [${ad.platform}] and formats: [${ad.format}].`
      }
    }));
  };

  const canSubmit = adMessage.trim() && selectedPlatforms.length > 0 && selectedFormats.length > 0;

  return (
    <div className={`h-full overflow-auto`}>
      <div className="p-6 space-y-6 max-w-4xl mx-auto">

        {/* Platforms - No background */}
        <div>
          <label className={`text-sm font-medium ${textSecondary} mb-3 block`}>
            Platforms
          </label>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map(platform => {
              const isSelected = selectedPlatforms.includes(platform.id);
              return (
                <button
                  key={platform.id}
                  onClick={() => togglePlatform(platform.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${
                    isSelected
                      ? isDark
                        ? 'bg-white/10 border-white/30'
                        : 'bg-zinc-100 border-zinc-400'
                      : isDark
                        ? 'border-zinc-700 hover:border-zinc-600'
                        : 'border-zinc-200 hover:border-zinc-300'
                  }`}
                >
                  <PlatformLogo platform={platform.id} size={20} id={`plat-${platform.id}`} />
                  <span className={`text-sm font-medium ${textPrimary}`}>{platform.name}</span>
                  {isSelected && <Check size={14} className="text-green-500" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Formats - No background */}
        <div>
          <label className={`text-sm font-medium ${textSecondary} mb-3 block`}>
            Size
          </label>
          <div className="flex flex-wrap gap-2">
            {FORMATS.map(format => {
              const isSelected = selectedFormats.includes(format.id);
              return (
                <button
                  key={format.id}
                  onClick={() => toggleFormat(format.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${
                    isSelected
                      ? isDark
                        ? 'bg-white text-zinc-900 border-transparent'
                        : 'bg-zinc-900 text-white border-transparent'
                      : isDark
                        ? 'border-zinc-700 hover:border-zinc-600'
                        : 'border-zinc-200 hover:border-zinc-300'
                  }`}
                >
                  <span className={`text-sm font-medium ${isSelected ? '' : textPrimary}`}>{format.name}</span>
                  <span className={`text-xs ${isSelected ? 'opacity-60' : textSecondary}`}>{format.ratio}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Brand Colors Toggle - No background */}
        {identity && (
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                useBrandColors
                  ? 'bg-blue-500 border-blue-500'
                  : isDark ? 'border-zinc-600' : 'border-zinc-300'
              }`}
            >
              {useBrandColors && <Check size={14} className="text-white" />}
            </div>
            <span className={`text-sm ${textPrimary}`}>Use brand colors from identity</span>
          </label>
        )}

        {/* Message Input - Chat style */}
        <div className="relative rounded-2xl" style={{ background: 'var(--surface-2)', boxShadow: 'var(--shadow-md)' }}>
          <textarea
            value={adMessage}
            onChange={(e) => setAdMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && canSubmit && !isAdsLoading) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="Describe your offer or message... (e.g., 50% off first month, Free consultation)"
            className="w-full pl-4 pr-12 pt-3 pb-12 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 resize-none focus:outline-none bg-transparent rounded-2xl"
            rows={1}
            style={{ minHeight: '100px' }}
            disabled={isAdsLoading}
          />

          {/* Target audience small input */}
          <div className="absolute bottom-3 left-3 flex items-center gap-2">
            <input
              type="text"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              placeholder="Target audience (optional)"
              className="px-2 py-1 text-xs bg-transparent border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-600 dark:text-zinc-400 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-500 w-48"
            />
          </div>

          {/* Send button */}
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || isAdsLoading}
            className={`absolute bottom-3 right-3 w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
              canSubmit && !isAdsLoading
                ? 'bg-zinc-900 dark:bg-white dark:text-zinc-900 text-white hover:opacity-90'
                : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-400 cursor-not-allowed'
            }`}
          >
            {isAdsLoading ? (
              <RefreshCw size={16} className="animate-spin" />
            ) : (
              <ArrowUp size={16} />
            )}
          </button>
        </div>

        {/* Ad count indicator */}
        {totalAds > 0 && (
          <p className={`text-xs ${textSecondary} text-center`}>
            Will generate {totalAds} ad{totalAds !== 1 ? 's' : ''} ({selectedPlatforms.length} platform{selectedPlatforms.length !== 1 ? 's' : ''} × {selectedFormats.length} format{selectedFormats.length !== 1 ? 's' : ''})
          </p>
        )}

        {/* Generated Ads Grid - Images Only */}
        {ads?.ads && ads.ads.length > 0 && (
          <div className="space-y-4">
            <h2 className={`text-lg font-semibold ${textPrimary}`}>
              Generated Ads
              <span className={`text-sm font-normal ${textSecondary} ml-2`}>
                ({ads.ads.length})
              </span>
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {ads.ads.map((ad, index) => (
                <div
                  key={ad.id}
                  className="relative rounded-xl overflow-hidden group aspect-square"
                >
                  <img
                    src={ad.imageUrl}
                    alt={`Ad ${index + 1}`}
                    className="w-full h-full object-cover"
                  />

                  {/* Platform badge with real logo (top-left) */}
                  <div className="absolute top-2 left-2 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-sm">
                    <PlatformLogo platform={ad.platform} size={20} id={`ad-${ad.id}`} />
                  </div>

                  {/* Format badge (top-right) */}
                  <div className="absolute top-2 right-2 px-2 py-1 rounded-full bg-black/60 text-white text-xs font-medium">
                    {ad.format}
                  </div>

                  {/* Hover actions */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={() => handleRemixAd(ad)}
                      className="p-2 bg-white/90 rounded-full hover:bg-white transition-colors"
                      title="Remix this ad"
                    >
                      <RefreshCw size={18} className="text-zinc-700" />
                    </button>
                    <button
                      onClick={() => handleRemoveAd(ad.id)}
                      className="p-2 bg-white/90 rounded-full hover:bg-white transition-colors"
                      title="Remove this ad"
                    >
                      <X size={18} className="text-red-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
