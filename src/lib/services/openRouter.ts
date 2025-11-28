// ============================================
// TYPES
// ============================================

export interface Model {
  id: string;
  name: string;
  description: string;
  contextLength: number;
  maxTokens?: number;
  pricing: {
    prompt: number;
    completion: number;
  };
  provider: string;
}

export interface ModelsResponse {
  models: Model[];
  count: number;
  lastUpdated: string;
}

// ============================================
// CONSTANTS
// ============================================

const CACHE_KEY = 'openrouter_models_cache_v2'; // v2: filtered for tool support
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// ============================================
// CACHE HELPERS
// ============================================

interface CacheData {
  models: Model[];
  timestamp: number;
}

function getCachedModels(): Model[] | null {
  if (typeof window === 'undefined') return null;

  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const data: CacheData = JSON.parse(cached);
    const isExpired = Date.now() - data.timestamp > CACHE_DURATION;

    if (isExpired) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }

    return data.models;
  } catch (error) {
    console.error('Failed to read cached models:', error);
    return null;
  }
}

function setCachedModels(models: Model[]): void {
  if (typeof window === 'undefined') return;

  try {
    const data: CacheData = {
      models,
      timestamp: Date.now(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to cache models:', error);
  }
}

// ============================================
// API FUNCTIONS
// ============================================

export async function fetchModels(): Promise<Model[]> {
  // Try cache first
  const cached = getCachedModels();
  if (cached) {
    return cached;
  }

  // Fetch from API
  try {
    const response = await fetch('/api/models');

    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.status}`);
    }

    const data: ModelsResponse = await response.json();

    // Cache the results
    setCachedModels(data.models);

    return data.models;
  } catch (error) {
    console.error('Error fetching models:', error);
    throw error;
  }
}

export function clearModelsCache(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(CACHE_KEY);
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

export function groupModelsByProvider(models: Model[]): Record<string, Model[]> {
  return models.reduce(
    (acc, model) => {
      const provider = model.provider;
      if (!acc[provider]) {
        acc[provider] = [];
      }
      acc[provider].push(model);
      return acc;
    },
    {} as Record<string, Model[]>
  );
}

export function searchModels(models: Model[], query: string): Model[] {
  if (!query.trim()) return models;

  const lowerQuery = query.toLowerCase();
  return models.filter(
    (model) =>
      model.name.toLowerCase().includes(lowerQuery) ||
      model.id.toLowerCase().includes(lowerQuery) ||
      model.description.toLowerCase().includes(lowerQuery) ||
      model.provider.toLowerCase().includes(lowerQuery)
  );
}

export function formatPricing(pricing: Model['pricing']): string {
  const promptPrice = (pricing.prompt * 1_000_000).toFixed(2);
  const completionPrice = (pricing.completion * 1_000_000).toFixed(2);
  return `$${promptPrice}/$${completionPrice} per 1M tokens`;
}

// Popular models that should appear at the top
export const POPULAR_MODEL_IDS = [
  'anthropic/claude-3.5-sonnet',
  'openai/gpt-4-turbo',
  'openai/gpt-4o',
  'google/gemini-pro-1.5',
  'meta-llama/llama-3.1-405b-instruct',
];

export function getPopularModels(models: Model[]): Model[] {
  return POPULAR_MODEL_IDS.map((id) => models.find((m) => m.id === id)).filter(
    Boolean
  ) as Model[];
}
