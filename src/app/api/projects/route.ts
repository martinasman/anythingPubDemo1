import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import type { BusinessModeId, ModeData } from '@/types/database';

interface CreateProjectRequest {
  mode: BusinessModeId;
  name?: string;
  description?: string;
  modelId?: string;
  // Agency-specific fields
  agencyType?: string;
  targetMarket?: string;
  // Commerce-specific fields
  entryPoint?: string;
  productUrl?: string;
  productDescription?: string;
  niche?: string;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const body: CreateProjectRequest = await req.json();

    const { mode, modelId, ...restData } = body;

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in to create a project.' },
        { status: 401 }
      );
    }

    // Build mode_data based on mode type
    let modeData: ModeData = {};
    let projectName = body.name || 'New Project';
    let projectDescription = body.description || '';

    if (mode === 'agency') {
      modeData = {
        agencyType: restData.agencyType || 'custom',
        description: restData.description || '',
        targetMarket: restData.targetMarket || '',
      };
      // Generate a better name based on agency type
      if (!body.name && restData.agencyType) {
        const typeNames: Record<string, string> = {
          'web-design': 'Web Design Agency',
          smma: 'Social Media Agency',
          'ai-automation': 'AI Automation Agency',
          consulting: 'Consulting Business',
          custom: 'Service Business',
        };
        projectName = typeNames[restData.agencyType] || 'New Agency';
      }
      projectDescription = restData.description || `${projectName} targeting ${restData.targetMarket || 'various clients'}`;
    } else if (mode === 'commerce') {
      modeData = {
        entryPoint: restData.entryPoint || 'manual',
        productUrl: restData.productUrl,
        productDescription: restData.productDescription,
        niche: restData.niche,
      };
      // Generate name based on commerce entry point
      if (!body.name) {
        if (restData.niche) {
          projectName = `${restData.niche} Store`;
        } else if (restData.productUrl) {
          projectName = 'Product Store';
        } else {
          projectName = 'E-commerce Store';
        }
      }
      projectDescription = restData.productDescription || restData.niche || 'E-commerce store';
    }

    // Create the project
    // Using 'as any' to bypass strict typing until Supabase types are regenerated
    const { data: project, error: createError } = await (supabase
      .from('projects') as any)
      .insert({
        user_id: user.id,
        name: projectName,
        description: projectDescription,
        status: 'active',
        model_id: modelId || 'google/gemini-3-pro-preview',
        mode,
        mode_data: modeData,
      })
      .select()
      .single();

    if (createError) {
      console.error('Failed to create project:', createError);
      return NextResponse.json(
        { error: createError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      projectId: project.id,
      project,
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
