import { NextResponse } from 'next/server';

// ============================================
// TYPES
// ============================================

interface OpenRouterModel {
  id: string;
  name: string;
  description?: string;
  context_length: number;
  max_completion_tokens?: number;
  pricing: {
    prompt: string;
    completion: string;
    image?: string;
    request?: string;
  };
  architecture?: {
    modality?: string;
    tokenizer?: string;
    instruct_type?: string;
  };
  top_provider?: {
    max_completion_tokens?: number;
    is_moderated?: boolean;
  };
  supported_parameters?: string[];
}

interface OpenRouterResponse {
  data: OpenRouterModel[];
}

// ============================================
// ROUTE HANDLER
// ============================================

export async function GET() {
  try {
    // Fetch all models from OpenRouter
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        'X-Title': 'Anything - Business OS',
      },
      next: {
        revalidate: 86400, // Cache for 24 hours (ISR)
      },
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data: OpenRouterResponse = await response.json();

    // Format and return models - only include models that support tools
    const formattedModels = data.data
      .filter((model) => model.supported_parameters?.includes('tools'))
      .map((model) => ({
        id: model.id,
        name: model.name,
        description: model.description || '',
        contextLength: model.context_length,
        maxTokens: model.max_completion_tokens || model.top_provider?.max_completion_tokens,
        pricing: {
          prompt: parseFloat(model.pricing.prompt),
          completion: parseFloat(model.pricing.completion),
        },
        provider: model.id.split('/')[0], // Extract provider from id (e.g., "anthropic" from "anthropic/claude-3.5-sonnet")
      }));

    // Sort by provider and name for better UX
    formattedModels.sort((a, b) => {
      if (a.provider === b.provider) {
        return a.name.localeCompare(b.name);
      }
      return a.provider.localeCompare(b.provider);
    });

    return NextResponse.json({
      models: formattedModels,
      count: formattedModels.length,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to fetch OpenRouter models:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch models',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
