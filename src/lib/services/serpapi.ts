/**
 * SerpAPI Google Maps Integration Service
 *
 * Searches Google Maps for local businesses in a category + location.
 * Falls back to Tavily search if SerpAPI fails.
 */

import { tavily } from '@tavily/core';

// ============================================
// URL CLEANING HELPER
// ============================================

/**
 * Clean Google redirect URLs to extract the actual destination URL
 * Handles format: /url?q=https://actual-site.com&sa=U&ved=...
 */
function cleanGoogleRedirectUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;

  // Check if it's a Google redirect URL
  if (url.includes('/url?q=') || url.includes('url?q=')) {
    try {
      // Handle both relative and absolute URLs
      const fullUrl = url.startsWith('http') ? url : `https://google.com${url}`;
      const urlObj = new URL(fullUrl);
      const actualUrl = urlObj.searchParams.get('q');
      if (actualUrl) {
        return actualUrl;
      }
    } catch {
      // If parsing fails, try regex extraction as fallback
      const match = url.match(/[?&]q=([^&]+)/);
      if (match) {
        return decodeURIComponent(match[1]);
      }
    }
  }

  return url;
}

// ============================================
// TYPES
// ============================================

export interface GoogleMapsResult {
  placeId: string;
  name: string;
  address: string;
  phone?: string;
  website?: string;
  rating?: number;
  reviewCount?: number;
  type?: string;
  thumbnail?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

interface SerpAPIGoogleMapsResponse {
  local_results?: Array<{
    place_id: string;
    title: string;
    address: string;
    phone?: string;
    website?: string;
    rating?: number;
    reviews?: number;
    reviews_original?: string;
    type?: string;
    thumbnail?: string;
    gps_coordinates?: {
      latitude: number;
      longitude: number;
    };
  }>;
  error?: string;
}

// ============================================
// SERPAPI INTEGRATION
// ============================================

/**
 * Search Google Maps for businesses using SerpAPI
 */
export async function searchGoogleMapsBusinesses(
  query: string,
  location: string,
  options: {
    limit?: number;
    type?: string;
  } = {}
): Promise<GoogleMapsResult[]> {
  console.log('[SerpAPI] ===== SEARCH STARTED =====');
  console.log('[SerpAPI] Query:', query);
  console.log('[SerpAPI] Location:', location);
  console.log('[SerpAPI] Options:', options);

  const SERPAPI_KEY = process.env.SERPAPI_KEY;
  console.log('[SerpAPI] API Key exists:', !!SERPAPI_KEY);
  console.log('[SerpAPI] API Key first 10 chars:', SERPAPI_KEY?.substring(0, 10));

  if (!SERPAPI_KEY) {
    console.warn('[SerpAPI] No API key found, falling back to Tavily');
    return searchWithTavilyFallback(query, location, options.limit || 20);
  }

  try {
    // Build SerpAPI URL for Google Maps search
    // Note: Google Maps engine requires either ll (lat,lng) OR location + ll
    // We use the query itself for location context and add a default zoom
    const params = new URLSearchParams({
      engine: 'google_maps',
      q: `${query} in ${location}`,  // Include location in query for better results
      type: 'search',
      api_key: SERPAPI_KEY,
      hl: 'en',  // Language
      gl: 'us',  // Country (default, will be overridden by query context)
    });

    const url = `https://serpapi.com/search?${params.toString()}`;
    console.log('[SerpAPI] Fetching URL:', url.replace(SERPAPI_KEY, 'REDACTED'));

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    console.log('[SerpAPI] Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[SerpAPI] Error response:', errorText);
      throw new Error(`SerpAPI request failed: ${response.status} ${response.statusText}`);
    }

    const data: SerpAPIGoogleMapsResponse = await response.json();
    console.log('[SerpAPI] Response has local_results:', !!data.local_results);
    console.log('[SerpAPI] Number of results:', data.local_results?.length || 0);

    if (data.error) {
      console.error('[SerpAPI] API returned error:', data.error);
      throw new Error(`SerpAPI error: ${data.error}`);
    }

    const results = (data.local_results || [])
      .slice(0, options.limit || 20)
      .map(result => ({
        placeId: result.place_id,
        name: result.title,
        address: result.address,
        phone: result.phone,
        website: cleanGoogleRedirectUrl(result.website),
        rating: result.rating,
        reviewCount: result.reviews,
        type: result.type,
        thumbnail: result.thumbnail,
        coordinates: result.gps_coordinates ? {
          latitude: result.gps_coordinates.latitude,
          longitude: result.gps_coordinates.longitude,
        } : undefined,
      }));

    console.log(`[SerpAPI] Found ${results.length} businesses for "${query}" in "${location}"`);
    return results;
  } catch (error) {
    console.error('[SerpAPI] Search failed:', error);
    console.log('[SerpAPI] Falling back to Tavily search');
    return searchWithTavilyFallback(query, location, options.limit || 20);
  }
}

// ============================================
// TAVILY FALLBACK
// ============================================

/**
 * Fallback to Tavily web search if SerpAPI fails
 */
async function searchWithTavilyFallback(
  query: string,
  location: string,
  limit: number
): Promise<GoogleMapsResult[]> {
  const TAVILY_API_KEY = process.env.TAVILY_API_KEY;

  if (!TAVILY_API_KEY) {
    console.error('[Tavily] No API key found');
    return [];
  }

  try {
    const tvly = tavily({ apiKey: TAVILY_API_KEY });

    // Search for businesses with location
    const searchQuery = `${query} ${location} business contact phone address`;
    const response = await tvly.search(searchQuery, {
      searchDepth: 'advanced',
      maxResults: limit,
      includeAnswer: false,
    });

    // Parse results into business format
    const results: GoogleMapsResult[] = response.results.map((result, index) => {
      // Try to extract phone from content
      const phoneMatch = result.content.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
      const phone = phoneMatch ? phoneMatch[0] : undefined;

      // Extract business name from title
      const name = result.title.split(' - ')[0].split(' | ')[0].trim();

      return {
        placeId: `tavily-${index}-${Date.now()}`,
        name,
        address: location, // Tavily doesn't give structured address
        phone,
        website: cleanGoogleRedirectUrl(result.url),
        rating: undefined,
        reviewCount: undefined,
        type: undefined,
        thumbnail: undefined,
        coordinates: undefined,
      };
    });

    console.log(`[Tavily Fallback] Found ${results.length} businesses for "${query}" in "${location}"`);
    return results;
  } catch (error) {
    console.error('[Tavily Fallback] Search failed:', error);
    return [];
  }
}

// ============================================
// SEARCH BY CATEGORY
// ============================================

/**
 * Search for businesses by category and location
 * Common categories: restaurants, gyms, dentists, lawyers, plumbers, etc.
 */
export async function searchBusinessesByCategory(
  category: string,
  location: string,
  limit: number = 20
): Promise<GoogleMapsResult[]> {
  // Build natural language query
  const query = `${category} near ${location}`;
  return searchGoogleMapsBusinesses(query, location, { limit });
}

/**
 * Search for businesses that likely need websites
 * Focuses on local service businesses
 */
export async function searchBusinessesNeedingWebsites(
  category: string,
  location: string,
  limit: number = 30
): Promise<GoogleMapsResult[]> {
  // Search with higher limit since we'll filter
  const businesses = await searchBusinessesByCategory(category, location, limit);

  // Filter to businesses most likely to need websites:
  // - No website
  // - Few reviews (newer businesses)
  // - Lower ratings (might need help)
  return businesses.filter(business => {
    // Prioritize businesses without websites
    if (!business.website) return true;

    // Include businesses with few reviews (newer, might not have good online presence)
    if (business.reviewCount !== undefined && business.reviewCount < 20) return true;

    // Include businesses with lower ratings (might need marketing help)
    if (business.rating !== undefined && business.rating < 4.0) return true;

    return false;
  });
}

// ============================================
// SEARCH BUSINESSES WITHOUT WEBSITES
// ============================================

/**
 * High-value business categories most likely to lack websites
 * Organized by industry for UI dropdown
 */
export const HIGH_VALUE_CATEGORIES = {
  'Home Services': [
    'plumbers', 'electricians', 'HVAC', 'handyman', 'landscaping',
    'cleaning services', 'roofers', 'painters', 'pest control'
  ],
  'Food & Beverage': [
    'food trucks', 'bakeries', 'catering', 'small restaurants',
    'cafes', 'delis', 'food stands'
  ],
  'Health & Wellness': [
    'massage therapists', 'personal trainers', 'yoga studios',
    'chiropractors', 'acupuncturists', 'nutritionists'
  ],
  'Professional Services': [
    'accountants', 'notary', 'tax preparation', 'tutoring',
    'consultants', 'bookkeepers', 'translators'
  ],
  'Retail': [
    'boutiques', 'gift shops', 'antique stores', 'jewelry stores',
    'florists', 'pet stores', 'thrift stores'
  ],
  'Auto & Transport': [
    'auto repair', 'car detailing', 'towing services',
    'tire shops', 'auto body shops'
  ],
};

/**
 * Search for businesses WITHOUT websites
 * Searches multiple categories and filters to only return businesses with no website
 */
export async function searchBusinessesWithoutWebsites(
  location: string,
  categories: string[] = ['plumbers', 'electricians', 'restaurants', 'cleaning services'],
  limit: number = 30
): Promise<GoogleMapsResult[]> {
  console.log('[SerpAPI] ===== SEARCHING FOR BUSINESSES WITHOUT WEBSITES =====');
  console.log('[SerpAPI] Location:', location);
  console.log('[SerpAPI] Categories:', categories);
  console.log('[SerpAPI] Limit:', limit);

  const allResults: GoogleMapsResult[] = [];

  // Search each category
  for (const category of categories) {
    console.log(`[SerpAPI] Searching category: ${category}`);

    const results = await searchGoogleMapsBusinesses(
      `${category}`,
      location,
      { limit: limit * 2 } // Over-fetch since we'll filter
    );

    // FILTER: Only keep businesses WITHOUT a website
    const noWebsite = results.filter(r => !r.website);
    console.log(`[SerpAPI] ${category}: ${results.length} total, ${noWebsite.length} without websites`);

    allResults.push(...noWebsite);
  }

  // Dedupe by placeId
  const unique = Array.from(
    new Map(allResults.map(r => [r.placeId, r])).values()
  );

  console.log(`[SerpAPI] Total unique businesses without websites: ${unique.length}`);

  // Sort by signals that indicate good targets:
  // - Fewer reviews = newer business = better target
  // - But has SOME reviews = legitimate business
  return unique
    .sort((a, b) => {
      // Prioritize businesses with some reviews (legitimate) but not many (new)
      const aScore = a.reviewCount ? Math.min(a.reviewCount, 50) : 0;
      const bScore = b.reviewCount ? Math.min(b.reviewCount, 50) : 0;
      return aScore - bScore; // Lower review count first
    })
    .slice(0, limit);
}

// ============================================
// GEOCODING HELPER
// ============================================

/**
 * Convert location string to coordinates (simple version)
 * For production, consider using Google Geocoding API
 */
export function parseLocationString(location: string): { lat: number; lng: number } | null {
  // Check if location is already coordinates
  const coordMatch = location.match(/(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/);
  if (coordMatch) {
    return {
      lat: parseFloat(coordMatch[1]),
      lng: parseFloat(coordMatch[2]),
    };
  }

  // For named locations, return null - SerpAPI handles this
  return null;
}

// ============================================
// BATCH SEARCH
// ============================================

/**
 * Search multiple categories in parallel
 */
export async function searchMultipleCategories(
  categories: string[],
  location: string,
  limitPerCategory: number = 10
): Promise<Map<string, GoogleMapsResult[]>> {
  const results = new Map<string, GoogleMapsResult[]>();

  // Execute searches in parallel
  const searches = categories.map(async (category) => {
    const businesses = await searchBusinessesByCategory(category, location, limitPerCategory);
    return { category, businesses };
  });

  const searchResults = await Promise.all(searches);

  searchResults.forEach(({ category, businesses }) => {
    results.set(category, businesses);
  });

  return results;
}
