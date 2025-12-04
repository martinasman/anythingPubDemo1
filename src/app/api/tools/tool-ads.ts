import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import type { AdsArtifact } from '@/types/database';

// ============================================
// SCHEMA DEFINITION
// ============================================

export const adsSchema = z.object({
  businessDescription: z.string().describe('Description of the business and what it sells'),
  targetAudience: z.string().describe('Who the ads should target'),
  mainOffer: z.string().describe('The main offer or value proposition to highlight'),
  platforms: z.array(z.enum(['facebook', 'instagram', 'google', 'linkedin', 'tiktok'])).optional().describe('Platforms to generate ads for'),
  formats: z.array(z.enum(['square', 'story', 'landscape'])).optional().describe('Ad formats to generate'),
  brandColors: z.object({
    primary: z.string(),
    secondary: z.string(),
  }).optional().describe('Brand colors to use in the ads'),
});

// ============================================
// HELPER FUNCTIONS
// ============================================

function generateAdCopy(
  businessDescription: string,
  targetAudience: string,
  mainOffer: string,
  platform: 'facebook' | 'instagram' | 'google' | 'linkedin' | 'tiktok'
): { headline: string; bodyText: string; cta: string } {
  // Platform-specific copy variations
  const ctaOptions = {
    facebook: ['Learn More', 'Shop Now', 'Get Started', 'Sign Up'],
    instagram: ['Shop Now', 'Swipe Up', 'Link in Bio', 'Learn More'],
    google: ['Get Started', 'Shop Now', 'Learn More', 'Contact Us'],
    linkedin: ['Learn More', 'Connect', 'Get Started', 'Apply Now'],
    tiktok: ['Shop Now', 'Check It Out', 'Get Yours', 'Try Now'],
  };

  // Extract key benefit from offer
  const keyBenefit = mainOffer.split(' ').slice(0, 5).join(' ');

  // Generate headlines based on platform
  const headlines: Record<string, string[]> = {
    facebook: [
      `${keyBenefit} - Limited Time!`,
      `Discover ${keyBenefit}`,
      `Ready for ${keyBenefit}?`,
    ],
    instagram: [
      `✨ ${keyBenefit}`,
      `${keyBenefit} 🔥`,
      `You deserve ${keyBenefit}`,
    ],
    google: [
      `${keyBenefit} | Get Started Today`,
      `Best ${keyBenefit} - Shop Now`,
      `${keyBenefit} - Free Shipping`,
    ],
    linkedin: [
      `Transform Your Business with ${keyBenefit}`,
      `Professional ${keyBenefit} Solutions`,
      `${keyBenefit} for Your Team`,
    ],
    tiktok: [
      `POV: You found ${keyBenefit}`,
      `This ${keyBenefit} is 🔥`,
      `Wait for it... ${keyBenefit}`,
    ],
  };

  const platformHeadlines = headlines[platform] || headlines.facebook;
  const headline = platformHeadlines[Math.floor(Math.random() * platformHeadlines.length)];

  // Generate body text
  const bodyTemplates = [
    `${businessDescription}. Perfect for ${targetAudience}. ${mainOffer}.`,
    `Looking for ${mainOffer}? We've got you covered. ${businessDescription}.`,
    `${targetAudience} love us! ${businessDescription}. Get ${mainOffer} today.`,
  ];
  const bodyText = bodyTemplates[Math.floor(Math.random() * bodyTemplates.length)];

  const ctas = ctaOptions[platform] || ctaOptions.facebook;
  const cta = ctas[Math.floor(Math.random() * ctas.length)];

  return { headline, bodyText, cta };
}

async function generateAdImage(
  businessDescription: string,
  targetAudience: string,
  mainOffer: string,
  platform: 'facebook' | 'instagram' | 'google' | 'linkedin' | 'tiktok',
  format: 'square' | 'story' | 'landscape',
  colors?: { primary: string; secondary: string }
): Promise<string> {
  try {
    console.log(`[Ads Gen] Generating ${format} ad image for ${platform}...`);

    const aspectRatios = {
      square: '1:1',
      story: '9:16',
      landscape: '16:9',
    };

    const adPrompt = `Create a professional advertising image for a ${platform} ad.

Business: ${businessDescription}
Target Audience: ${targetAudience}
Main Offer: ${mainOffer}
Format: ${aspectRatios[format]} ${format}
${colors ? `Brand Colors: Primary ${colors.primary}, Secondary ${colors.secondary}` : ''}

Requirements:
- Eye-catching, scroll-stopping visual
- Professional and modern design
- Relevant imagery that resonates with the target audience
- Clean composition suitable for ads
- NO text in the image (text will be added separately)
- High contrast and vibrant colors
- Product/service visualization if relevant`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        'X-Title': 'AnythingV10',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-pro-image-preview',
        messages: [
          {
            role: 'user',
            content: adPrompt,
          },
        ],
        modalities: ['image', 'text'],
        temperature: 0.9,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Ads Gen] API error:', response.status, errorText);
      throw new Error(`API request failed: ${response.status}`);
    }

    const result = await response.json();
    console.log(`[Ads Gen] API response for ${platform}:`, JSON.stringify(result, null, 2).slice(0, 1000));

    const message = result.choices?.[0]?.message;
    const candidate = result.candidates?.[0];

    let imageData: string | null = null;

    // Method 1: Check OpenRouter images field (data URLs)
    if (message?.images && Array.isArray(message.images) && message.images.length > 0) {
      console.log(`[Ads Gen] Found images in message.images field`);
      const firstImage = message.images[0];

      if (typeof firstImage === 'string') {
        if (firstImage.startsWith('data:')) {
          imageData = firstImage;
        } else {
          let mimeType = 'image/png';
          if (firstImage.startsWith('iVBOR')) mimeType = 'image/png';
          else if (firstImage.startsWith('/9j/')) mimeType = 'image/jpeg';
          else if (firstImage.startsWith('UklGR')) mimeType = 'image/webp';
          else if (firstImage.startsWith('R0lGOD')) mimeType = 'image/gif';
          imageData = `data:${mimeType};base64,${firstImage}`;
        }
      } else if (firstImage?.url) {
        imageData = firstImage.url.startsWith('data:')
          ? firstImage.url
          : `data:image/png;base64,${firstImage.url}`;
      } else if (firstImage?.data) {
        const mimeType = firstImage.mime_type || firstImage.mimeType || 'image/png';
        imageData = `data:${mimeType};base64,${firstImage.data}`;
      } else if (firstImage?.b64_json) {
        imageData = `data:image/png;base64,${firstImage.b64_json}`;
      } else if (firstImage?.type === 'image_url' && firstImage?.image_url?.url) {
        imageData = firstImage.image_url.url;
      }
    }

    // Method 2: Check message.content array for inline_data or inlineData
    if (!imageData && message?.content) {
      if (Array.isArray(message.content)) {
        console.log(`[Ads Gen] Checking message.content array`);
        for (const part of message.content) {
          if (part.inline_data) {
            const { mime_type, data } = part.inline_data;
            imageData = `data:${mime_type || 'image/png'};base64,${data}`;
            break;
          }
          if (part.inlineData) {
            const { mimeType, data } = part.inlineData;
            imageData = `data:${mimeType || 'image/png'};base64,${data}`;
            break;
          }
          if (part.type === 'image' && part.image_url?.url) {
            imageData = part.image_url.url;
            break;
          }
        }
      }
    }

    // Method 3: Check native Gemini candidates format
    if (!imageData && candidate?.content?.parts) {
      console.log(`[Ads Gen] Checking candidates format`);
      for (const part of candidate.content.parts) {
        if (part.inlineData) {
          const { mimeType, data } = part.inlineData;
          imageData = `data:${mimeType || 'image/png'};base64,${data}`;
          break;
        }
      }
    }

    if (!imageData) {
      console.error(`[Ads Gen] No image data found. Full response:`, JSON.stringify(result, null, 2).slice(0, 2000));
      throw new Error('No image data in response');
    }

    if (!imageData.startsWith('data:')) {
      imageData = `data:image/png;base64,${imageData}`;
    }

    // Validate image data size
    if (imageData.length < 1000) {
      console.error(`[Ads Gen] Image data too small: ${imageData.length} chars`);
      throw new Error('Generated image data is too small');
    }

    console.log(`[Ads Gen] ✅ Generated ${format} ad image for ${platform}, size: ${imageData.length}`);
    return imageData;
  } catch (error) {
    console.error('[Ads Gen] Error:', error);
    return generateFallbackAdImage(platform, format, colors);
  }
}

function generateFallbackAdImage(
  platform: string,
  format: 'square' | 'story' | 'landscape',
  colors?: { primary: string; secondary: string }
): string {
  const dimensions = {
    square: { width: 400, height: 400 },
    story: { width: 270, height: 480 },
    landscape: { width: 480, height: 270 },
  };

  const { width, height } = dimensions[format];
  const primary = colors?.primary || '#3B82F6';
  const secondary = colors?.secondary || '#1E40AF';

  const svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${primary};stop-opacity:1" />
        <stop offset="100%" style="stop-color:${secondary};stop-opacity:1" />
      </linearGradient>
    </defs>
    <rect width="${width}" height="${height}" fill="url(#grad)"/>
    <text x="${width/2}" y="${height/2}" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">${platform.toUpperCase()} AD</text>
  </svg>`;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

// ============================================
// TOOL IMPLEMENTATION
// ============================================

export async function generateAds(params: z.infer<typeof adsSchema> & { projectId: string }) {
  const { businessDescription, targetAudience, mainOffer, platforms, formats, brandColors, projectId } = params;

  try {
    console.log('[Ads Tool] 📢 Starting ad generation...');

    // Use provided platforms/formats or defaults
    const selectedPlatforms = platforms?.length ? platforms : ['facebook', 'instagram', 'google', 'linkedin'] as const;
    const selectedFormats = formats?.length ? formats : ['square'] as const;

    // Generate ad configs for each platform/format combination
    const adConfigs: Array<{
      platform: 'facebook' | 'instagram' | 'google' | 'linkedin' | 'tiktok';
      format: 'square' | 'story' | 'landscape';
    }> = [];

    for (const platform of selectedPlatforms) {
      for (const format of selectedFormats) {
        adConfigs.push({ platform, format });
      }
    }

    console.log(`[Ads Tool] Generating ${adConfigs.length} ads for: ${selectedPlatforms.join(', ')} in formats: ${selectedFormats.join(', ')}`);

    // Generate all ads in parallel
    const adPromises = adConfigs.map(async (config, index) => {
      const { headline, bodyText, cta } = generateAdCopy(
        businessDescription,
        targetAudience,
        mainOffer,
        config.platform
      );

      const imageUrl = await generateAdImage(
        businessDescription,
        targetAudience,
        mainOffer,
        config.platform,
        config.format,
        brandColors
      );

      return {
        id: `ad-${index + 1}-${Date.now()}`,
        imageUrl,
        headline,
        bodyText,
        cta,
        platform: config.platform,
        format: config.format,
      };
    });

    const ads = await Promise.all(adPromises);

    const adsData: AdsArtifact = { ads };

    // Save to Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: artifact, error } = await (supabase
      .from('artifacts') as any)
      .upsert(
        {
          project_id: projectId,
          type: 'ads',
          data: adsData,
          version: 1,
        },
        {
          onConflict: 'project_id,type',
        }
      )
      .select()
      .single();

    if (error) {
      console.error('Failed to save ads artifact:', error);
      throw new Error('Failed to save ads');
    }

    console.log('[Ads Tool] ✅ Generated 4 ad creatives');

    return {
      success: true,
      artifact,
      summary: `📢 Created ${ads.length} ad creatives for Facebook, Instagram, Google, and LinkedIn`,
      ads: adsData,
    };
  } catch (error) {
    console.error('Ad generation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
