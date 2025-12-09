import { z } from 'zod';
import { createClient } from '@/utils/supabase/server';

// ============================================
// SCHEMA DEFINITION
// ============================================

export const imageSchema = z.object({
  prompt: z.string().describe('Detailed description of the image to generate'),
  style: z.enum(['photo', 'illustration', 'icon', '3d', 'artistic']).optional()
    .describe('Visual style preference: photo (photorealistic), illustration (vector-style), icon (simple/flat), 3d (rendered), artistic (creative)'),
  aspectRatio: z.enum(['1:1', '16:9', '9:16', '4:3']).optional()
    .describe('Image aspect ratio - 1:1 for square, 16:9 for landscape/hero, 9:16 for portrait/story, 4:3 for standard'),
});

// ============================================
// STYLE PROMPTS
// ============================================

const STYLE_PROMPTS: Record<string, string> = {
  photo: 'Photorealistic, high quality photograph, natural lighting, professional photography',
  illustration: 'Clean digital illustration, vector-style, modern design, flat colors with subtle gradients',
  icon: 'Simple icon design, flat colors, minimal details, clean lines, suitable for UI',
  '3d': '3D rendered, realistic materials and lighting, high quality render, octane render style',
  artistic: 'Artistic interpretation, creative, unique style, visually striking',
};

// ============================================
// MAIN FUNCTION
// ============================================

export async function generateImage(params: {
  prompt: string;
  style?: string;
  aspectRatio?: string;
  projectId: string;
  onProgress?: (update: { type: 'stage'; stage: string; message: string }) => Promise<void>;
}) {
  const { prompt, style = 'photo', aspectRatio = '1:1', projectId, onProgress } = params;

  console.log('[Image Gen] Starting:', { prompt: prompt.substring(0, 50), style, aspectRatio });

  try {
    await onProgress?.({ type: 'stage', stage: 'prepare', message: 'Preparing image generation...' });

    // Build enhanced prompt based on style
    const stylePrompt = STYLE_PROMPTS[style] || STYLE_PROMPTS.photo;
    const enhancedPrompt = `${stylePrompt}. ${prompt}. Aspect ratio: ${aspectRatio}. High quality, detailed.`;

    await onProgress?.({ type: 'stage', stage: 'generate', message: 'Generating image with AI...' });

    // Use Gemini 3 Pro Image Preview (Nano Banana Pro) via OpenRouter
    // Same model used by tool-design.ts and tool-ads.ts for logo/ad generation
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-pro-image-preview', // Gemini 3 Pro Image (Nano Banana Pro)
        messages: [{
          role: 'user',
          content: enhancedPrompt
        }],
        // Request image generation
        modalities: ['text', 'image'],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Image Gen] API error:', response.status, errorText);
      throw new Error(`Image generation API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('[Image Gen] Response structure:', Object.keys(data));

    // Extract image from response (multiple possible formats from different models)
    let imageData: string | null = null;

    // Format 1: images array in message
    if (data.choices?.[0]?.message?.images?.[0]) {
      imageData = data.choices[0].message.images[0];
      console.log('[Image Gen] Found image in message.images');
    }
    // Format 2: content array with image type
    else if (data.choices?.[0]?.message?.content) {
      const content = data.choices[0].message.content;
      if (Array.isArray(content)) {
        const imageContent = content.find((c: any) =>
          c.type === 'image' || c.type === 'image_url'
        );
        if (imageContent?.image_url?.url) {
          imageData = imageContent.image_url.url;
          console.log('[Image Gen] Found image in content array');
        } else if (imageContent?.data) {
          imageData = imageContent.data;
          console.log('[Image Gen] Found image data in content');
        }
      }
    }
    // Format 3: Direct base64 in content
    else if (typeof data.choices?.[0]?.message?.content === 'string') {
      const content = data.choices[0].message.content;
      // Check if it's a base64 image
      if (content.startsWith('data:image') || content.match(/^[A-Za-z0-9+/=]{100,}/)) {
        imageData = content;
        console.log('[Image Gen] Found base64 in content string');
      }
    }

    if (!imageData) {
      console.error('[Image Gen] No image found in response:', JSON.stringify(data).substring(0, 500));

      // Return a helpful message instead of failing
      return {
        success: false,
        error: 'Image generation is not available with the current model. Try using the brand identity or ad generation tools instead.',
        suggestion: 'The generate_brand_identity and generate_ads tools can create logos and ad images.',
      };
    }

    await onProgress?.({ type: 'stage', stage: 'save', message: 'Saving image...' });

    // Save to Supabase storage
    const supabase = await createClient();
    const filename = `generated_${Date.now()}.png`;
    const path = `${projectId}/${filename}`;

    // Convert base64 to buffer if needed
    let imageBuffer: Buffer;
    if (imageData.startsWith('data:')) {
      // Data URL format
      const base64Data = imageData.split(',')[1];
      imageBuffer = Buffer.from(base64Data, 'base64');
    } else if (imageData.startsWith('http')) {
      // URL - fetch it
      const imgResponse = await fetch(imageData);
      const arrayBuffer = await imgResponse.arrayBuffer();
      imageBuffer = Buffer.from(arrayBuffer);
    } else {
      // Raw base64
      imageBuffer = Buffer.from(imageData, 'base64');
    }

    const { error: uploadError } = await supabase.storage
      .from('chat-images')
      .upload(path, imageBuffer, {
        contentType: 'image/png',
        upsert: true,
      });

    if (uploadError) {
      console.error('[Image Gen] Upload failed:', uploadError);
      // Return data URL as fallback
      const dataUrl = imageData.startsWith('data:')
        ? imageData
        : `data:image/png;base64,${imageData}`;

      return {
        success: true,
        imageUrl: dataUrl,
        summary: `🎨 Generated image: "${prompt.substring(0, 50)}${prompt.length > 50 ? '...' : ''}"`,
        note: 'Image generated but could not be saved to storage.',
      };
    }

    const { data: { publicUrl } } = supabase.storage
      .from('chat-images')
      .getPublicUrl(path);

    console.log('[Image Gen] ✅ Success:', publicUrl);

    return {
      success: true,
      imageUrl: publicUrl,
      summary: `🎨 Generated ${style} image: "${prompt.substring(0, 50)}${prompt.length > 50 ? '...' : ''}"`,
    };

  } catch (error) {
    console.error('[Image Gen] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate image',
    };
  }
}
