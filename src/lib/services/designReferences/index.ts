/**
 * Design References Service
 *
 * Loads and caches design inspiration from reference screenshots.
 * Used to guide website generation with consistent, high-quality styling.
 */

import * as fs from 'fs';
import * as path from 'path';
import { analyzeInspirationImage, getImageHash } from './analyzer';
import type { DesignInspiration, AnalysisCache } from './types';

// Path to the inspiration image folder (use absolute path for Next.js API routes)
const REFERENCE_FOLDER = path.join(process.cwd(), 'public/visualnewtest');
const CACHE_FILE = path.join(process.cwd(), 'public/visualnewtest/_cache.json');

// In-memory cache for the current session
let memoryCache: DesignInspiration | null = null;
let memoryCacheHash: string = '';

/**
 * Find the first image file in the reference folder
 */
function findInspirationImage(): string | null {
  const folderPath = path.resolve(REFERENCE_FOLDER);

  if (!fs.existsSync(folderPath)) {
    console.log('[DesignRef] Reference folder does not exist:', folderPath);
    return null;
  }

  const files = fs.readdirSync(folderPath);
  const imageFile = files.find(f =>
    /\.(png|jpg|jpeg|webp)$/i.test(f) && !f.startsWith('_')
  );

  if (!imageFile) {
    console.log('[DesignRef] No inspiration image found in:', folderPath);
    return null;
  }

  return path.join(REFERENCE_FOLDER, imageFile);
}

/**
 * Load cached analysis from disk
 */
function loadCacheFromDisk(): AnalysisCache | null {
  const cachePath = path.resolve(CACHE_FILE);

  if (!fs.existsSync(cachePath)) {
    return null;
  }

  try {
    const cacheData = fs.readFileSync(cachePath, 'utf-8');
    return JSON.parse(cacheData) as AnalysisCache;
  } catch {
    console.log('[DesignRef] Failed to load cache, will re-analyze');
    return null;
  }
}

/**
 * Save analysis cache to disk
 */
function saveCacheToDisk(imageHash: string, inspiration: DesignInspiration): void {
  const cachePath = path.resolve(CACHE_FILE);
  const cacheData: AnalysisCache = {
    analyzedAt: new Date().toISOString(),
    imageHash,
    inspiration,
  };

  try {
    fs.writeFileSync(cachePath, JSON.stringify(cacheData, null, 2));
    console.log('[DesignRef] Cache saved to disk');
  } catch (error) {
    console.error('[DesignRef] Failed to save cache:', error);
  }
}

/**
 * Get design inspiration from the reference image.
 * Returns cached analysis if available and image hasn't changed.
 * Otherwise analyzes the image with Gemini 3 Pro.
 *
 * @returns DesignInspiration or null if no reference image exists
 */
export async function getDesignInspiration(): Promise<DesignInspiration | null> {
  // Find the inspiration image
  const imagePath = findInspirationImage();

  if (!imagePath) {
    console.log('[DesignRef] No inspiration image configured');
    return null;
  }

  // Get current image hash
  const currentHash = getImageHash(imagePath);

  // Check memory cache first
  if (memoryCache && memoryCacheHash === currentHash) {
    console.log('[DesignRef] Using memory cache');
    return memoryCache;
  }

  // Check disk cache
  const diskCache = loadCacheFromDisk();
  if (diskCache && diskCache.imageHash === currentHash) {
    console.log('[DesignRef] Using disk cache (analyzed at:', diskCache.analyzedAt + ')');
    memoryCache = diskCache.inspiration;
    memoryCacheHash = currentHash;
    return diskCache.inspiration;
  }

  // Analyze the image
  console.log('[DesignRef] Analyzing inspiration image with Gemini 3 Pro...');

  try {
    const inspiration = await analyzeInspirationImage(imagePath);

    // Cache results
    memoryCache = inspiration;
    memoryCacheHash = currentHash;
    saveCacheToDisk(currentHash, inspiration);

    return inspiration;
  } catch (error) {
    console.error('[DesignRef] Analysis failed:', error);
    return null;
  }
}

/**
 * Force re-analysis of the inspiration image (ignores cache)
 */
export async function refreshDesignInspiration(): Promise<DesignInspiration | null> {
  // Clear memory cache
  memoryCache = null;
  memoryCacheHash = '';

  // Delete disk cache
  const cachePath = path.resolve(CACHE_FILE);
  if (fs.existsSync(cachePath)) {
    fs.unlinkSync(cachePath);
  }

  return getDesignInspiration();
}

/**
 * Check if a design reference is configured
 */
export function hasDesignReference(): boolean {
  return findInspirationImage() !== null;
}

// Re-export types
export type { DesignInspiration, AnalysisCache } from './types';
