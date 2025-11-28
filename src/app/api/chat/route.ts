import { streamText, stepCountIs } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { createClient } from '@/utils/supabase/server';
import { performMarketResearch, researchSchema } from '../tools/tool-research';
import { generateBrandIdentity, designSchema } from '../tools/tool-design';
import { generateWebsiteFiles, codeGenSchema } from '../tools/tool-code';
import { generateBusinessPlan, businessPlanSchema } from '../tools/tool-businessplan';
import { generateLeads, leadsSchema } from '../tools/tool-leads';
import { generateOutreachScripts, outreachSchema } from '../tools/tool-outreach';
// Edit tools for modifying existing artifacts
import { editWebsiteFiles, editWebsiteSchema } from '../tools/tool-edit-website';
import { editBrandIdentity, editIdentitySchema } from '../tools/tool-edit-identity';
import { editPricing, editPricingSchema } from '../tools/tool-edit-pricing';

// ============================================
// TOOL PROGRESS CONFIGURATION
// ============================================

interface ToolProgress {
  name: string;
  steps: string[];
  startMessage: string;
  completeMessage: string;
}

const TOOL_CONFIG: Record<string, ToolProgress> = {
  // Generation tools
  perform_market_research: {
    name: 'Market Research',
    steps: ['Searching for competitors', 'Analyzing pricing strategies', 'Identifying market gaps'],
    startMessage: '🔍 Researching your market...',
    completeMessage: '✅ Market research complete!',
  },
  generate_brand_identity: {
    name: 'Brand Identity',
    steps: ['Generating business name', 'Creating logo design', 'Selecting color palette'],
    startMessage: '✨ Creating your brand identity...',
    completeMessage: '✅ Brand identity ready!',
  },
  generate_business_plan: {
    name: 'Business Plan',
    steps: ['Defining pricing tiers', 'Creating service packages', 'Building revenue model'],
    startMessage: '📋 Creating your business plan...',
    completeMessage: '✅ Business plan ready!',
  },
  generate_website_files: {
    name: 'Website',
    steps: ['Designing layout structure', 'Writing HTML & CSS', 'Adding interactive elements'],
    startMessage: '🌐 Building your website...',
    completeMessage: '✅ Website ready!',
  },
  generate_leads: {
    name: 'Lead Generation',
    steps: ['Searching target market', 'Qualifying prospects', 'Extracting contact info'],
    startMessage: '🎯 Finding leads...',
    completeMessage: '✅ Leads generated!',
  },
  generate_outreach_scripts: {
    name: 'Outreach Scripts',
    steps: ['Analyzing lead profiles', 'Writing call scripts', 'Creating email templates'],
    startMessage: '📧 Creating outreach scripts...',
    completeMessage: '✅ Scripts ready!',
  },
  // Edit tools
  edit_website: {
    name: 'Updating Website',
    steps: ['Reading current code', 'Applying changes', 'Saving updates'],
    startMessage: '🌐 Updating your website...',
    completeMessage: '✅ Website updated!',
  },
  edit_identity: {
    name: 'Updating Brand',
    steps: ['Reading current identity', 'Applying changes', 'Saving updates'],
    startMessage: '✨ Updating your brand...',
    completeMessage: '✅ Brand updated!',
  },
  edit_pricing: {
    name: 'Updating Pricing',
    steps: ['Reading current plan', 'Applying changes', 'Saving updates'],
    startMessage: '💰 Updating your pricing...',
    completeMessage: '✅ Pricing updated!',
  },
};

// ============================================
// ROUTE HANDLER
// ============================================

export async function POST(req: Request) {
  try {
    const { messages, projectId, modelId } = await req.json();

    if (!projectId) {
      return new Response('Project ID is required', { status: 400 });
    }

    // Initialize Supabase client
    const supabase = await createClient();

    // Initialize OpenRouter client
    const openrouter = createOpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY!,
    });

    // Use selected model or default to Claude 3.5 Sonnet
    // Model selector already filters for tool-compatible models
    let selectedModel = modelId || 'anthropic/claude-3.5-sonnet';
    if (selectedModel.endsWith(':free')) {
      selectedModel = selectedModel.replace(':free', '');
      console.log('[Chat API] ⚠️ Stripped :free suffix for tool support');
    }

    console.log('[Chat API] Model:', selectedModel);
    console.log('[Chat API] Messages count:', messages.length);

    // Save user message FIRST (before streaming)
    const userMessage = messages[messages.length - 1];
    if (userMessage.role === 'user') {
      const { error: userMsgError } = await (supabase.from('messages') as any).insert({
        project_id: projectId,
        role: 'user',
        content: userMessage.content,
      });
      if (userMsgError) console.error('[DB] User message save failed:', userMsgError);
    }

    // System prompt for business builder
    const SYSTEM_PROMPT = `You are an AI that builds complete, ready-to-launch businesses. You have these tools available:

=== GENERATION TOOLS (for creating NEW artifacts) ===
- perform_market_research: Research competitors, pricing, and market opportunities
- generate_brand_identity: Create business name, logo, colors, and branding
- generate_business_plan: Create pricing tiers, service packages, and revenue model
- generate_website_files: Build a complete website using brand identity
- generate_leads: Find potential customers (only when user asks)
- generate_outreach_scripts: Create personalized scripts (only when user asks)

=== EDIT TOOLS (for MODIFYING existing artifacts) ===
- edit_website: Modify existing website (change colors, text, layout, sections)
- edit_identity: Modify existing brand (rename, change colors, update tagline)
- edit_pricing: Modify existing pricing (add tiers, change prices, update packages)

=== CRITICAL RULES FOR CHOOSING TOOLS ===

1. FIRST MESSAGE (no artifacts exist): Use GENERATE tools
   - Run perform_market_research, generate_brand_identity, generate_business_plan in PARALLEL
   - Then run generate_website_files with the brand identity

2. SUBSEQUENT MESSAGES (artifacts already exist): Use EDIT tools
   - "Change the button to blue" → edit_website
   - "Make the hero section taller" → edit_website
   - "Rename the business to X" → edit_identity
   - "Change primary color to red" → edit_identity
   - "Add a premium tier at $299" → edit_pricing
   - "Change starter price to $99" → edit_pricing

3. REGENERATE only when user explicitly says "regenerate", "start over", or "create new"

=== EDIT TOOL PARAMETERS ===
- edit_website: { editInstructions: "what to change" }
- edit_identity: { editInstructions: "what to change" }
- edit_pricing: { editInstructions: "what to change" }

=== GENERATE TOOL PARAMETERS ===
- generate_website_files: { businessDescription, identity: { name, colors, font, tagline, logoUrl } }
- generate_business_plan: { businessType, targetMarket, competitors, brandName }
- generate_leads: { businessType, targetIndustries, targetLocation, numberOfLeads }
- generate_outreach_scripts: { businessType, brandName, leads }

=== USER-TRIGGERED TOOLS ===
- generate_leads: ONLY when user explicitly asks to generate leads
- generate_outreach_scripts: ONLY when user explicitly asks for scripts AND leads exist

=== FIRST MESSAGE SUMMARY ===
After initial generation, provide:
"🎉 Your business foundation is ready!

**[Business Name]** - [One-line description]

• Market Research: Found [X] competitors
• Brand Identity: Custom logo + color palette
• Business Plan: [X] pricing tiers
• Website: Modern landing page ready

You can now ask me to make specific changes like:
→ 'Change the button color to blue'
→ 'Rename the business to TechFlow'
→ 'Add a premium tier at $499'"

=== EDIT CONFIRMATION ===
After editing, briefly confirm what was changed. The system will automatically show status messages.`;


    // Tool definitions
    const tools = {
      perform_market_research: {
        description:
          'Perform comprehensive market research to identify competitors, pricing strategies, and market opportunities for a business idea',
        inputSchema: researchSchema,
        execute: async (params: any) => {
          return await performMarketResearch({ ...params, projectId });
        },
      },
      generate_brand_identity: {
        description:
          'Generate a complete brand identity including logo, color palette, typography, and tagline',
        inputSchema: designSchema,
        execute: async (params: any) => {
          return await generateBrandIdentity({ ...params, projectId });
        },
      },
      generate_business_plan: {
        description:
          'Generate a complete business plan with pricing tiers, service packages, revenue model, and value proposition',
        inputSchema: businessPlanSchema,
        execute: async (params: any) => {
          return await generateBusinessPlan({ ...params, projectId });
        },
      },
      generate_website_files: {
        description:
          'Generate a complete, responsive website with HTML, CSS, and JavaScript files based on the business description and brand identity',
        inputSchema: codeGenSchema,
        execute: async (params: any) => {
          return await generateWebsiteFiles({ ...params, projectId, modelId: selectedModel });
        },
      },
      generate_leads: {
        description:
          'Generate a list of qualified potential customers/leads by searching the web for companies that match the ideal customer profile',
        inputSchema: leadsSchema,
        execute: async (params: any) => {
          return await generateLeads({ ...params, projectId });
        },
      },
      generate_outreach_scripts: {
        description:
          'Generate personalized cold call scripts and email sequences for each lead, tailored to their industry and pain points',
        inputSchema: outreachSchema,
        execute: async (params: any) => {
          return await generateOutreachScripts({ ...params, projectId });
        },
      },
      // Edit tools for modifying existing artifacts
      edit_website: {
        description:
          'Edit an existing website - use this to make changes like updating colors, text, layout, or sections. Do NOT use generate_website_files for edits.',
        inputSchema: editWebsiteSchema,
        execute: async (params: any) => {
          return await editWebsiteFiles({ ...params, projectId });
        },
      },
      edit_identity: {
        description:
          'Edit the existing brand identity - use this to change the business name, colors, tagline, or regenerate the logo. Do NOT use generate_brand_identity for edits.',
        inputSchema: editIdentitySchema,
        execute: async (params: any) => {
          return await editBrandIdentity({ ...params, projectId });
        },
      },
      edit_pricing: {
        description:
          'Edit the existing pricing and business plan - use this to add/remove tiers, change prices, or update service packages. Do NOT use generate_business_plan for edits.',
        inputSchema: editPricingSchema,
        execute: async (params: any) => {
          return await editPricing({ ...params, projectId });
        },
      },
    };

    // Create a custom readable stream for progress updates
    const encoder = new TextEncoder();
    const progressStream = new TransformStream<Uint8Array, Uint8Array>();
    const progressWriter = progressStream.writable.getWriter();

    // Helper to write progress messages
    const writeProgress = async (message: string) => {
      await progressWriter.write(encoder.encode(message));
    };

    // Track active tools for progress display
    const activeTools = new Set<string>();
    const completedTools = new Set<string>();
    const toolStartTimes: Record<string, number> = {};

    // Stream AI response with tools
    const result = streamText({
      model: openrouter(selectedModel),
      system: SYSTEM_PROMPT,
      messages,
      temperature: 0.7,
      maxRetries: 2,
      stopWhen: stepCountIs(10),
      tools,

      // Stream progress updates for tool executions
      onStepFinish: async ({ toolCalls, toolResults, text }) => {
        console.log('[Chat API] Step finished with', toolCalls?.length || 0, 'tool calls');

        // Write tool start messages with detailed steps
        if (toolCalls && toolCalls.length > 0) {
          for (const call of toolCalls) {
            if (!activeTools.has(call.toolName)) {
              activeTools.add(call.toolName);
              toolStartTimes[call.toolName] = Date.now();
              const config = TOOL_CONFIG[call.toolName];
              if (config) {
                // Stream human-readable narration text (displayed in chat)
                await writeProgress(`${config.startMessage}\n\n`);
                // Stream structured progress marker for UI
                await writeProgress(`[PROGRESS:${call.toolName}:start:${config.name}]\n`);
                // Stream steps as they "happen"
                for (let i = 0; i < config.steps.length; i++) {
                  await writeProgress(`[STEP:${call.toolName}:${i}:${config.steps[i]}]\n`);
                }
              }
              console.log(`[Chat API] 🔧 Executing: ${call.toolName}`);
            }
          }
        }

        // Write tool completion messages
        if (toolResults && toolResults.length > 0) {
          for (const toolResult of toolResults) {
            if (!completedTools.has(toolResult.toolName)) {
              completedTools.add(toolResult.toolName);
              const config = TOOL_CONFIG[toolResult.toolName];
              const duration = toolStartTimes[toolResult.toolName]
                ? Math.round((Date.now() - toolStartTimes[toolResult.toolName]) / 1000)
                : 0;

              if (config) {
                // Stream human-readable completion narration (displayed in chat)
                await writeProgress(`\n${config.completeMessage}\n\n`);
                // Stream completion marker with duration
                await writeProgress(`[PROGRESS:${toolResult.toolName}:complete:${config.name}:${duration}s]\n`);
              }

              console.log(`[Chat API] ✅ Completed: ${toolResult.toolName} (${duration}s)`);
            }
          }
        }
      },

      // Save assistant message when complete
      onFinish: async ({ text, toolCalls, finishReason }) => {
        console.log('[Chat API] Stream finished:', finishReason);
        console.log('[Chat API] Tool calls:', toolCalls?.length || 0);

        // Generate content from text or tool calls
        let content = text || '';

        // If no AI text but tools were called, generate a summary
        if (!content && completedTools.size > 0) {
          content = '\n\n🎉 Your business is ready! Check out the panels on the right to see your:\n• Market Research\n• Brand Identity & Logo\n• Website Preview\n\nAsk me to refine anything!';
          await writeProgress(content);
        }

        // Save to database
        const finalContent = content ||
          (toolCalls && toolCalls.length > 0
            ? `Executed: ${toolCalls.map(t => t.toolName).join(', ')}`
            : '');

        if (finalContent) {
          const { error: assistantMsgError } = await (supabase.from('messages') as any).insert({
            project_id: projectId,
            role: 'assistant',
            content: finalContent,
            metadata: {
              toolCount: toolCalls?.length || 0,
              finishReason,
            },
          });

          if (assistantMsgError) {
            console.error('[DB] Assistant message save failed:', assistantMsgError);
          } else {
            console.log('[DB] ✅ Saved assistant message');
          }
        }

        // Close the progress writer
        await progressWriter.close();
      },
    });

    // Merge the AI text stream with our progress stream
    const aiStream = result.textStream;

    // Create a combined stream that includes both progress and AI text
    const combinedStream = new ReadableStream({
      async start(controller) {
        const aiReader = aiStream.getReader();
        const progressReader = progressStream.readable.getReader();

        // Read from both streams
        const readAI = async () => {
          try {
            while (true) {
              const { done, value } = await aiReader.read();
              if (done) break;
              controller.enqueue(encoder.encode(value));
            }
          } catch (e) {
            console.error('[Stream] AI stream error:', e);
          }
        };

        const readProgress = async () => {
          try {
            while (true) {
              const { done, value } = await progressReader.read();
              if (done) break;
              controller.enqueue(value);
            }
          } catch (e) {
            console.error('[Stream] Progress stream error:', e);
          }
        };

        // Run both readers concurrently
        await Promise.all([readAI(), readProgress()]);
        controller.close();
      },
    });

    return new Response(combinedStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error) {
    console.error('[Chat API] Error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
