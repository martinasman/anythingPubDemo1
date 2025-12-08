/**
 * Design Inspiration Analyzer
 *
 * Uses Gemini 3 Pro Preview to analyze reference screenshots
 * and extract structured design patterns.
 */

import { generateText } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import * as fs from 'fs';
import * as path from 'path';
import type { DesignInspiration } from './types';

// Enhanced analysis prompt - extracts both style AND structure
const ANALYSIS_PROMPT = `You are an expert UI/UX designer analyzing a website screenshot. Extract the COMPLETE design DNA - both visual style AND page structure.

CRITICAL: Scroll through the ENTIRE screenshot and identify EVERY section from top to bottom.

Return ONLY valid JSON (no markdown, no explanation) in this exact structure:

{
  "layout": {
    "heroStyle": "centered" | "split" | "full-bleed" | "asymmetric" | "minimal",
    "gridPattern": "single-column" | "2-column" | "3-column" | "4-column" | "bento" | "masonry",
    "sectionSpacing": "tight" | "normal" | "generous" | "dramatic",
    "navStyle": "fixed-top" | "transparent" | "minimal" | "hamburger-only" | "centered-logo"
  },
  "colorScheme": {
    "dominantColor": "#hexcode (extract the EXACT primary brand color)",
    "accentColor": "#hexcode (CTA buttons, highlights - extract EXACT color)",
    "backgroundColor": "#hexcode (main background)",
    "textColor": "#hexcode (primary text)",
    "backgroundStyle": "light" | "dark" | "gradient" | "image" | "mixed"
  },
  "typography": {
    "headingStyle": "bold-sans" | "elegant-serif" | "geometric" | "display" | "minimal",
    "headingWeight": "normal" | "medium" | "semibold" | "bold" | "black",
    "bodyFont": "sans-serif" | "serif" | "mono",
    "textDensity": "minimal" | "balanced" | "content-rich"
  },
  "components": {
    "buttonStyle": "rounded-full" | "rounded" | "sharp" | "outline" | "ghost" | "gradient",
    "cardStyle": "flat" | "elevated" | "bordered" | "glassmorphic" | "minimal",
    "imageStyle": "rounded" | "sharp" | "circular" | "masked" | "full-bleed"
  },
  "effects": {
    "hasAnimations": true/false,
    "hasShadows": true/false,
    "hasGradients": true/false,
    "hasGlassmorphism": true/false,
    "hasParallax": true/false,
    "hasHoverEffects": true/false
  },
  "tailwindClasses": {
    "hero": "exact Tailwind classes for hero (e.g., 'min-h-screen flex items-center bg-gradient-to-br from-slate-900 to-slate-800')",
    "sections": "classes for sections (e.g., 'py-24 md:py-32 px-6')",
    "cards": "classes for cards (e.g., 'bg-white rounded-2xl shadow-xl p-8')",
    "buttons": "classes for buttons (e.g., 'px-8 py-4 bg-blue-600 text-white rounded-full')",
    "headings": "classes for headings (e.g., 'text-5xl md:text-7xl font-bold tracking-tight')",
    "body": "classes for body (e.g., 'text-lg text-gray-600 leading-relaxed')"
  },
  "sectionStructure": {
    "order": ["list", "every", "section", "from", "top", "to", "bottom"],
    "sections": {
      "hero": {
        "layout": "split-left" | "split-right" | "centered" | "full-image" | etc,
        "hasImage": true/false,
        "hasCards": false,
        "description": "Detailed description: Large headline on left, dashboard mockup on right, two CTA buttons",
        "tailwindClasses": "min-h-screen grid grid-cols-1 lg:grid-cols-2 gap-12 items-center px-6 py-20"
      },
      "clients": {
        "layout": "logo-row",
        "hasImage": true,
        "hasCards": false,
        "description": "Grayscale client logos in a horizontal row",
        "tailwindClasses": "py-12 border-y border-gray-100"
      },
      "services": {
        "layout": "grid-3",
        "hasImage": false,
        "hasCards": true,
        "cardCount": 3,
        "hasIcons": true,
        "description": "3 service cards with icons, titles, and descriptions",
        "tailwindClasses": "py-24 grid grid-cols-1 md:grid-cols-3 gap-8"
      }
    }
  },
  "overallVibe": "A sophisticated and premium B2B SaaS website that blends classic, elegant typography with modern, soft gradients. Projects trustworthiness and innovation for tech decision-makers.",
  "designNotes": "Key patterns to replicate: subtle gradient backgrounds, elegant serif headlines mixed with sans-serif body, generous whitespace, soft shadows on cards, glassmorphism nav bar"
}

IMPORTANT INSTRUCTIONS:
1. Extract EXACT hex colors from the image - don't guess
2. List EVERY section you see in the order they appear (hero, features, testimonials, pricing, CTA, footer, etc.)
3. For each section, describe its EXACT layout and what elements it contains
4. The Tailwind classes should be precise and immediately usable
5. Capture the premium/sophisticated feel in your descriptions

Return ONLY the JSON object, nothing else.`;

/**
 * Analyze a screenshot image using Gemini 3 Pro Preview
 */
export async function analyzeInspirationImage(imagePath: string): Promise<DesignInspiration> {
  console.log('[DesignRef] Analyzing inspiration image:', imagePath);

  // Read image and convert to base64
  const absolutePath = path.resolve(imagePath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Inspiration image not found: ${absolutePath}`);
  }

  const imageBuffer = fs.readFileSync(absolutePath);
  const base64Image = imageBuffer.toString('base64');

  // Detect mime type from extension
  const ext = path.extname(imagePath).toLowerCase();
  const mimeType = ext === '.png' ? 'image/png'
    : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg'
    : ext === '.webp' ? 'image/webp'
    : 'image/png';

  console.log('[DesignRef] Image loaded, size:', imageBuffer.length, 'bytes, type:', mimeType);

  // Create OpenRouter client
  const openrouter = createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY!,
  });

  // Use Gemini 2.0 Flash for visual analysis (more reliable than preview models)
  const model = 'google/gemini-2.0-flash-001';
  console.log('[DesignRef] Using model:', model);

  // Build message content with proper typing
  type MessageContent =
    | { type: 'text'; text: string }
    | { type: 'image'; image: string; mimeType: string };

  const messageContent: MessageContent[] = [
    {
      type: 'image',
      image: base64Image,
      mimeType,
    },
    {
      type: 'text',
      text: ANALYSIS_PROMPT,
    },
  ];

  const { text } = await generateText({
    model: openrouter(model),
    messages: [
      {
        role: 'user',
        content: messageContent as any, // Type assertion for AI SDK compatibility
      },
    ],
    temperature: 0.3, // Lower temperature for consistent analysis
  });

  console.log('[DesignRef] Analysis complete, parsing response...');

  // Parse JSON response
  const cleaned = text
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();

  try {
    const inspiration = JSON.parse(cleaned) as DesignInspiration;
    console.log('[DesignRef] Parsed successfully. Vibe:', inspiration.overallVibe);
    return inspiration;
  } catch (error) {
    console.error('[DesignRef] Failed to parse response:', cleaned.slice(0, 500));
    throw new Error('Failed to parse design analysis from Gemini');
  }
}

/**
 * Analyze a design reference from base64 image data
 * Used for uploaded screenshots that don't exist on disk
 */
export async function analyzeDesignFromBase64(
  base64Image: string,
  mimeType: string = 'image/png'
): Promise<DesignInspiration> {
  console.log('[DesignRef] Analyzing design from base64, type:', mimeType, 'size:', base64Image.length, 'chars');

  // Create OpenRouter client
  const openrouter = createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY!,
  });

  // Use Gemini 2.0 Flash for visual analysis (more reliable than preview models)
  const model = 'google/gemini-2.0-flash-001';
  console.log('[DesignRef] Using model:', model);

  // Build message content with proper typing
  type MessageContent =
    | { type: 'text'; text: string }
    | { type: 'image'; image: string; mimeType: string };

  const messageContent: MessageContent[] = [
    {
      type: 'image',
      image: base64Image,
      mimeType,
    },
    {
      type: 'text',
      text: ANALYSIS_PROMPT,
    },
  ];

  const { text } = await generateText({
    model: openrouter(model),
    messages: [
      {
        role: 'user',
        content: messageContent as any, // Type assertion for AI SDK compatibility
      },
    ],
    temperature: 0.3, // Lower temperature for consistent analysis
  });

  console.log('[DesignRef] Analysis complete, parsing response...');

  // Parse JSON response
  const cleaned = text
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();

  try {
    const inspiration = JSON.parse(cleaned) as DesignInspiration;
    console.log('[DesignRef] Parsed successfully. Vibe:', inspiration.overallVibe);
    return inspiration;
  } catch (error) {
    console.error('[DesignRef] Failed to parse response:', cleaned.slice(0, 500));
    throw new Error('Failed to parse design analysis from Gemini');
  }
}

/**
 * Analyze a design reference from a URL (downloads and analyzes)
 */
export async function analyzeDesignFromUrl(imageUrl: string): Promise<DesignInspiration> {
  console.log('[DesignRef] Analyzing design from URL:', imageUrl);

  // Download image
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.status}`);
  }

  const buffer = await response.arrayBuffer();
  const base64Image = Buffer.from(buffer).toString('base64');

  // Detect mime type from content-type header or URL
  const contentType = response.headers.get('content-type') || 'image/png';
  const mimeType = contentType.includes('jpeg') ? 'image/jpeg'
    : contentType.includes('png') ? 'image/png'
    : contentType.includes('webp') ? 'image/webp'
    : 'image/png';

  console.log('[DesignRef] Downloaded image, size:', buffer.byteLength, 'bytes, type:', mimeType);

  return analyzeDesignFromBase64(base64Image, mimeType);
}

/**
 * Generate a hash for an image file (for cache invalidation)
 */
export function getImageHash(imagePath: string): string {
  const absolutePath = path.resolve(imagePath);
  if (!fs.existsSync(absolutePath)) {
    return '';
  }

  const stats = fs.statSync(absolutePath);
  // Simple hash based on file size and modification time
  return `${stats.size}-${stats.mtimeMs}`;
}
