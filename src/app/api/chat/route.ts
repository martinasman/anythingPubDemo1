import { streamText, stepCountIs, tool } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { createClient } from '@/utils/supabase/server';
import type { ArtifactType } from '@/types/database';
import { performMarketResearch, researchSchema } from '../tools/tool-research';
import { generateBrandIdentity, designSchema } from '../tools/tool-design';
import { generateWebsiteFiles, codeGenSchema } from '../tools/tool-code';
import { generateLeads, leadsSchema } from '../tools/tool-leads';
import { generateOutreachScripts, outreachSchema } from '../tools/tool-outreach';
import { generateFirstWeekPlan, firstWeekPlanSchema } from '../tools/tool-first-week-plan';
// Edit tools for modifying existing artifacts
import { editWebsiteFiles, editWebsiteSchema } from '../tools/tool-edit-website';
import { editBrandIdentity, editIdentitySchema } from '../tools/tool-edit-identity';
import { addWebsitePage, addPageSchema } from '../tools/tool-add-page';
// CRM tool
import { manageCRM, crmSchema } from '../tools/tool-crm';
// Remix tool for website modernization
import { remixWebsite, remixSchema } from '../tools/tool-remix';
// Image generation tool
import { generateImage, imageSchema } from '../tools/tool-image';
// AI system prompt
import { ORCHESTRATOR_SYSTEM_PROMPT } from '@/config/agentPrompts';

// ============================================
// TOOL DISPLAY NAMES (simplified)
// ============================================

const TOOL_DISPLAY_NAMES: Record<string, string> = {
  perform_market_research: 'Researching your market',
  generate_brand_identity: 'Creating your brand',
  generate_website_files: 'Building your website',
  generate_first_week_plan: 'Planning your first week',
  generate_leads: 'Finding prospects',
  generate_outreach_scripts: 'Writing outreach scripts',
  generate_image: 'Generating image',
  edit_website: 'Editing website',
  edit_identity: 'Updating brand',
  add_page: 'Adding new page',
  manage_crm: 'Managing clients',
  remix_website: 'Remixing website',
};

// ============================================
// MODEL PRICING (per 1M tokens in USD)
// ============================================

const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  // Anthropic
  'anthropic/claude-sonnet-4': { input: 3, output: 15 },
  'anthropic/claude-3.5-sonnet': { input: 3, output: 15 },
  'anthropic/claude-3-haiku': { input: 0.25, output: 1.25 },
  // Google
  'google/gemini-2.0-flash-001': { input: 0.1, output: 0.4 },
  'google/gemini-flash-1.5': { input: 0.075, output: 0.3 },
  'google/gemini-pro-1.5': { input: 1.25, output: 5 },
  // OpenAI
  'openai/gpt-4o': { input: 2.5, output: 10 },
  'openai/gpt-4o-mini': { input: 0.15, output: 0.6 },
  'openai/gpt-4-turbo': { input: 10, output: 30 },
  // xAI
  'x-ai/grok-2': { input: 2, output: 10 },
  'x-ai/grok-beta': { input: 5, output: 15 },
  // DeepSeek
  'deepseek/deepseek-chat': { input: 0.14, output: 0.28 },
  'deepseek/deepseek-coder': { input: 0.14, output: 0.28 },
  // Moonshot (Kimi)
  'moonshotai/moonshot-v1-128k': { input: 0.6, output: 0.6 },
};

// ============================================
// ROUTE HANDLER
// ============================================

export async function POST(req: Request) {
  // ============================================
  // TIMING DIAGNOSTICS
  // ============================================
  const timings: Record<string, number> = {};
  const requestStartTime = Date.now();
  const logTiming = (label: string) => {
    const elapsed = Date.now() - requestStartTime;
    timings[label] = elapsed;
    console.log(`[Timing] ${label}: ${elapsed}ms`);
  };

  try {
    const { messages, projectId, modelId, assistantMessageId, chatMode = 'edit', leadId } = await req.json();
    logTiming('request_parsed');

    if (!projectId) {
      return new Response('Project ID is required', { status: 400 });
    }

    console.log('[Chat API] Chat mode:', chatMode, 'Lead ID:', leadId || 'none');

    // Initialize Supabase client
    const supabase = await createClient();
    logTiming('supabase_client_created');

    // Initialize OpenRouter client
    const openrouter = createOpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY!,
    });
    logTiming('openrouter_client_created');

    // Use selected model or default to Claude 3.5 Sonnet
    // Model selector already filters for tool-compatible models
    let selectedModel = modelId || 'anthropic/claude-3.5-sonnet';
    if (selectedModel.endsWith(':free')) {
      selectedModel = selectedModel.replace(':free', '');
      console.log('[Chat API] ⚠️ Stripped :free suffix for tool support');
    }

    console.log('[Chat API] Model:', selectedModel);
    console.log('[Chat API] Messages count:', messages.length);

    // Save user message (fire-and-forget - don't block streaming)
    const userMessage = messages[messages.length - 1];
    if (userMessage.role === 'user') {
      (supabase.from('messages') as any).insert({
        id: userMessage.id, // Pass client-generated ID for deduplication
        project_id: projectId,
        role: 'user',
        content: userMessage.content,
      }).then(({ error: userMsgError }: { error: any }) => {
        if (userMsgError) console.error('[DB] User message save failed:', userMsgError);
      });
    }
    logTiming('user_message_queued');

    // Build system prompt based on chat mode
    const CHAT_MODE_INSTRUCTIONS: Record<string, string> = {
      edit: `You are in EDIT mode. Your ONLY job is to make changes to the website.

⚠️ MANDATORY RULES - YOU MUST FOLLOW THESE:
1. You MUST call edit_website for ANY website change request - no exceptions
2. Do NOT say "I encountered an error" or "having trouble" - just call the tool
3. Do NOT offer to "regenerate" or "rebuild" - use edit_website instead
4. Do NOT reference previous attempts or failures - treat EVERY request fresh
5. Do NOT explain what you're going to do - just DO it by calling the tool

When the user asks for ANY change (colors, text, layout, images, sections, etc.):
→ Your ONLY response is to call edit_website immediately
→ No preamble, no explanation, just the tool call`,
      chat: `You are in CHAT mode. Have a helpful conversation.
You CAN use tools if the user asks for changes - just be conversational about it.
Answer questions, provide advice, and implement changes when asked.`,
      plan: `You are in PLAN mode. Help the user strategize and plan before building.
Discuss ideas, create plans, outline features. You can make changes if explicitly asked.`,
    };

    const modeInstruction = CHAT_MODE_INSTRUCTIONS[chatMode] || CHAT_MODE_INSTRUCTIONS.edit;
    const SYSTEM_PROMPT = `${ORCHESTRATOR_SYSTEM_PROMPT}\n\n## CURRENT MODE\n${modeInstruction}`;

    console.log('[Chat API] System prompt loaded with mode:', chatMode);

    // ============================================
    // APP MODE DETECTION (HTML vs Full-Stack)
    // ============================================

    function detectAppMode(messageContent: string): 'html' | 'nextjs' {
      const text = messageContent.toLowerCase();

      const fullStackSignals = [
        'saas',
        'app',
        'dashboard',
        'login',
        'signup',
        'database',
        'user accounts',
        'manage',
        'admin panel',
        'crud',
        'authentication',
        'users can',
        'profiles',
        'settings page',
      ];

      const htmlSignals = [
        'landing page',
        'marketing site',
        'portfolio',
        'website',
        'coming soon',
        'static site',
        'one page',
        'simple site',
      ];

      const fullStackScore = fullStackSignals.filter((signal) => text.includes(signal)).length;
      const htmlScore = htmlSignals.filter((signal) => text.includes(signal)).length;

      // Default to HTML for ambiguous cases (safer/faster)
      const mode = fullStackScore > htmlScore ? 'nextjs' : 'html';
      console.log('[Mode Detection] Score: nextjs=' + fullStackScore + ', html=' + htmlScore + ', selected=' + mode);
      return mode;
    }

    // Detect mode from user message
    const appMode = detectAppMode(userMessage?.content || '');
    console.log('[Chat API] App mode detected:', appMode);

    // ============================================
    // IMAGE CONTEXT EXTRACTION
    // ============================================

    interface ImageRef {
      url: string;
      filename: string;
      purpose: 'reference' | 'content';
      mimeType: string;
    }

    // Extract images from the latest user message metadata
    const imageRefs = (userMessage?.metadata?.images as ImageRef[] | undefined) || [];
    const imageContext = {
      referenceImages: imageRefs.filter(i => i.purpose === 'reference'),
      contentImages: imageRefs.filter(i => i.purpose === 'content'),
    };

    if (imageRefs.length > 0) {
      console.log('[Chat API] Image context:', {
        reference: imageContext.referenceImages.length,
        content: imageContext.contentImages.length,
      });
    }

    // ============================================
    // PROGRESS STREAM SETUP (must be BEFORE tools)
    // Tools reference writeProgress, activeTools, toolStartTimes
    // so these must be defined first
    // ============================================

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

    // Tool definitions
    const tools = {
      perform_market_research: tool({
        description:
          'Perform comprehensive market research to identify competitors, pricing strategies, and market opportunities for a business idea',
        inputSchema: researchSchema,
        execute: async (params) => {
          return await performMarketResearch({ ...params, projectId });
        },
      }),
      generate_brand_identity: tool({
        description:
          'Create a COMPLETE new brand identity for NEW businesses only. DO NOT use for edits. If user says "change colors" or "update name", use edit_identity instead.',
        inputSchema: designSchema,
        execute: async (params) => {
          return await generateBrandIdentity({ ...params, projectId });
        },
      }),
      generate_website_files: tool({
        description:
          'Generate a COMPLETE new website from scratch for NEW projects only. DO NOT use for edits. If user says "change font", "update colors", "make it more X", use edit_website instead.',
        inputSchema: codeGenSchema,
        execute: async (params) => {
          // Fetch market research if available to inform website generation
          let marketResearch: any = null;
          try {
            const { data: researchArtifact } = await supabase
              .from('artifacts')
              .select('data')
              .eq('project_id', projectId)
              .eq('type', 'research')
              .single();

            if (researchArtifact && typeof researchArtifact === 'object' && 'data' in researchArtifact) {
              const artifact = researchArtifact as { data?: { marketIntelligence?: any } };
              marketResearch = artifact.data?.marketIntelligence;
            }
          } catch {
            // Market research not available, continue without it
          }

          return await generateWebsiteFiles({
            ...params,
            projectId,
            modelId: selectedModel,
            marketResearch,
            mode: appMode,
            imageContext, // Pass image context for embedding/reference
            leadId, // Pass lead ID for lead website generation
            onProgress: async (stage, message) => {
              // Route different stage types to appropriate markers
              if (stage === 'activity') {
                // Lovable-style activity feed: [ACTIVITY:action:target:duration?]
                await writeProgress(`[ACTIVITY:${message}]\n`);
              } else if (stage === 'thinking') {
                await writeProgress(`[THINKING:${message}]\n`);
              } else if (stage === 'file_create') {
                await writeProgress(`[FILE:create:${message}]\n`);
              } else {
                await writeProgress(`[WORK_PROGRESS:generate_website_files:${message}]\n`);
              }
            },
          });
        },
      }),
      generate_leads: tool({
        description:
          'Generate a list of qualified potential customers/leads by searching the web for companies that match the ideal customer profile',
        inputSchema: leadsSchema,
        execute: async (params) => {
          console.log('[Route] generate_leads called with:', JSON.stringify(params));
          try {
            return await generateLeads({ ...params, projectId });
          } catch (err) {
            console.error('[Route] generate_leads error:', err);
            return { success: false, error: String(err) };
          }
        },
      }),
      generate_outreach_scripts: tool({
        description:
          'Generate personalized cold call scripts and email sequences for each lead, tailored to their industry and pain points',
        inputSchema: outreachSchema,
        execute: async (params) => {
          return await generateOutreachScripts({ ...params, projectId });
        },
      }),
      generate_first_week_plan: tool({
        description:
          'Generate a day-by-day action plan to make money in the first week. Creates specific tasks, outreach scripts, and success metrics for landing the first client.',
        inputSchema: firstWeekPlanSchema,
        execute: async (params) => {
          return await generateFirstWeekPlan({ ...params, projectId });
        },
      }),
      generate_image: tool({
        description:
          'Generate an image ONLY when user explicitly says "generate an image", "create a picture", "make me an image". DO NOT use for font changes, color updates, or styling. DO NOT use unless user literally asks for an image.',
        inputSchema: imageSchema,
        execute: async (params) => {
          return await generateImage({
            ...params,
            projectId,
            onProgress: async (update) => {
              if (update.type === 'stage') {
                const marker = `[PROGRESS:${update.stage}:${update.message}]\n`;
                await writeProgress(marker);
              }
            }
          });
        },
      }),
      // Edit tools for modifying existing artifacts
      edit_website: tool({
        description:
          'ALWAYS use this for ANY changes to an existing website. This is the PRIMARY tool for modifications. Includes: font changes, color updates, layout adjustments, styling changes, "make it more X", section additions, text edits. NEVER use generate_website_files for edits.',
        inputSchema: editWebsiteSchema,
        execute: async (params) => {
          // Emit work marker BEFORE tool executes so progress stages can attach to it
          activeTools.add('edit_website');
          toolStartTimes['edit_website'] = Date.now();
          await writeProgress(`[WORK:edit_website:Updating your website]\n`);
          return await editWebsiteFiles({
            ...params,
            projectId,
            imageContext, // Pass image context for vision-based edits
            modelId: selectedModel, // Use user's selected model
            leadId, // Pass lead ID for lead website editing
            onProgress: async (update) => {
              if (update.type === 'stage') {
                // Emit progress stage marker
                const marker = `[PROGRESS:${update.stage}:${update.message}]\n`;
                await writeProgress(marker);
              } else if (update.type === 'change') {
                // Emit code change marker
                const marker = `[CODE_CHANGE:${update.file}:${update.description}${update.before && update.after ? `|${update.before}|${update.after}` : ''}]\n`;
                await writeProgress(marker);
              }
            }
          });
        },
      }),
      edit_identity: tool({
        description:
          'ALWAYS use this for ANY changes to existing brand identity. Includes: changing business name, colors, tagline, logo updates. NEVER use generate_brand_identity for edits.',
        inputSchema: editIdentitySchema,
        execute: async (params) => {
          return await editBrandIdentity({
            ...params,
            projectId,
            onProgress: async (update) => {
              if (update.type === 'stage') {
                const marker = `[PROGRESS:${update.stage}:${update.message}]\n`;
                await writeProgress(marker);
              }
            }
          });
        },
      }),
      // Add new page to website
      add_page: tool({
        description:
          'Add a new page to an existing website. Creates a new HTML page with matching styles and navigation. Use when user asks to add an about page, contact page, services page, etc. If leadId is provided (from lead context), adds page to lead website.',
        inputSchema: addPageSchema,
        execute: async (params) => {
          return await addWebsitePage({
            ...params,
            projectId,
            leadId, // Pass leadId if available from context
            onProgress: async (update) => {
              if (update.type === 'stage') {
                const marker = `[PROGRESS:${update.stage}:${update.message}]\n`;
                await writeProgress(marker);
              }
            }
          });
        },
      }),
      manage_crm: tool({
        description:
          'Manage client relationships: convert leads to clients, add new clients, update client information, add notes and activities, and track client status changes',
        inputSchema: crmSchema,
        execute: async (params) => {
          return await manageCRM({ ...params, projectId });
        },
      }),
      // Website remix tool - crawls and modernizes existing websites
      remix_website: tool({
        description:
          'Remix/modernize an existing website. Crawls all pages, extracts content/brand/forms, and generates a modern 2025 version. Use when user provides a URL and asks to remake, redesign, or modernize a site.',
        inputSchema: remixSchema,
        execute: async (params) => {
          return await remixWebsite({
            ...params,
            projectId,
            onProgress: async (update) => {
              // Emit progress markers for the UI
              if (update.phase === 'crawling' && update.step === 'page') {
                await writeProgress(`[REMIX_CRAWL:${update.detail}:${update.message}]\n`);
              } else if (update.phase === 'crawling' && update.step === 'start') {
                await writeProgress(`[REMIX_STATUS:crawling:${update.message}]\n`);
              } else if (update.phase === 'analyzing') {
                // Emit analyzing phase updates for lively UI
                await writeProgress(`[REMIX_ANALYZE:${update.step}:${update.message}${update.detail ? ` - ${update.detail}` : ''}]\n`);
              } else if (update.phase === 'generating' && update.step.startsWith('file_')) {
                // Per-file progress - emit as standard PROGRESS marker for WorkSection stages
                await writeProgress(`[PROGRESS:${update.step}:${update.message}]\n`);
              } else if (update.phase === 'generating' && update.step === 'page') {
                await writeProgress(`[REMIX_GENERATE:${update.detail}:${update.message}]\n`);
              } else if (update.phase === 'generating' && update.step === 'start') {
                await writeProgress(`[REMIX_STATUS:generating:${update.message}]\n`);
              } else if (update.phase === 'complete') {
                await writeProgress(`[REMIX_COMPLETE:${update.detail}]\n`);
              }
            },
          });
        },
      }),
    };

    // Send REAL status updates to client (not fake cycling messages)
    // These show actual progress in the chat UI
    // NOTE: Don't await - writeProgress blocks if stream has no reader yet (backpressure)
    writeProgress('[STATUS:init:Analyzing your request...]\n');

    // Log timing before starting stream
    logTiming('stream_starting');

    // Send status update that we're connecting to AI
    // NOTE: Don't await - writeProgress blocks if stream has no reader yet (backpressure)
    writeProgress('[STATUS:connecting:Connecting to AI...]\n');

    // Track if we've received the first AI response (for timing)
    let firstTokenReceived = false;

    // Track if an edit tool completed successfully - suppress AI text after
    let editToolCompleted = false;

    // Timeout-based status escalation for cold starts
    // Send reassuring messages if AI takes too long to respond
    // Extended to cover 70+ seconds for cold starts that can take 1+ minute
    let statusEscalationTimer: NodeJS.Timeout | null = null;
    const STATUS_ESCALATION_MESSAGES = [
      { delay: 2000, msg: '[STATUS:thinking:AI is thinking...]\n' },
      { delay: 6000, msg: '[STATUS:processing:Still connecting...]\n' },
      { delay: 12000, msg: '[STATUS:waiting:This is taking longer than usual...]\n' },
      { delay: 20000, msg: '[STATUS:warming:AI model is warming up...]\n' },
      { delay: 35000, msg: '[STATUS:patience:Almost there, thanks for waiting...]\n' },
      { delay: 50000, msg: '[STATUS:loading:Still loading, please hold...]\n' },
      { delay: 70000, msg: '[STATUS:slow:Unusually slow today, hang tight...]\n' },
    ];
    let escalationIndex = 0;

    const scheduleNextEscalation = () => {
      if (escalationIndex >= STATUS_ESCALATION_MESSAGES.length) return;
      const { delay, msg } = STATUS_ESCALATION_MESSAGES[escalationIndex];
      const currentDelay = escalationIndex === 0 ? delay : (delay - STATUS_ESCALATION_MESSAGES[escalationIndex - 1].delay);

      statusEscalationTimer = setTimeout(() => {
        if (!firstTokenReceived) {
          // NOTE: Don't await - fire and forget to avoid blocking
          writeProgress(msg);
          escalationIndex++;
          scheduleNextEscalation();
        }
      }, currentDelay);
    };

    // Start escalation timer
    scheduleNextEscalation();

    // Stream AI response with tools
    console.log('[Chat API] Starting streamText with model:', selectedModel);
    console.log('[Chat API] Chat mode:', chatMode);
    console.log('[Chat API] Tools available:', Object.keys(tools));
    console.log('[Chat API] User message:', userMessage?.content?.substring(0, 100));

    const result = streamText({
      model: openrouter(selectedModel),
      system: SYSTEM_PROMPT,
      messages,
      temperature: 0.7,
      maxRetries: 2,
      stopWhen: stepCountIs(10),
      tools,

      // Stream progress updates for tool executions
      onStepFinish: async ({ toolCalls, toolResults, usage }) => {
        // Log timing for first step and clear escalation timer
        if (!firstTokenReceived) {
          firstTokenReceived = true;
          logTiming('first_step_finished');
          // Clear the cold start escalation timer since we got a response
          if (statusEscalationTimer) {
            clearTimeout(statusEscalationTimer);
            statusEscalationTimer = null;
          }
        }

        console.log('[Chat API] Step finished with', toolCalls?.length || 0, 'tool calls');

        // Emit token usage for cost tracking
        if (usage) {
          const pricing = MODEL_PRICING[selectedModel] || { input: 3, output: 15 };
          const inputTokens = usage.inputTokens || 0;
          const outputTokens = usage.outputTokens || 0;
          const cost = (inputTokens * pricing.input + outputTokens * pricing.output) / 1_000_000;
          await writeProgress(`[TOKENS:${inputTokens}:${outputTokens}:${cost.toFixed(4)}]\n`);
          console.log(`[Chat API] 💰 Tokens: ${inputTokens} in / ${outputTokens} out = $${cost.toFixed(4)}`);
        }

        // Emit start markers for new tools
        if (toolCalls && toolCalls.length > 0) {
          for (const call of toolCalls) {
            if (!activeTools.has(call.toolName)) {
              activeTools.add(call.toolName);
              toolStartTimes[call.toolName] = Date.now();

              // CRITICAL: Clear escalation timer when tool actually starts
              // This prevents "Unusually slow today" from overriding progress during long tool executions
              if (statusEscalationTimer) {
                clearTimeout(statusEscalationTimer);
                statusEscalationTimer = null;
                console.log('[Chat API] Cleared escalation timer - tool started');
              }

              const displayName = TOOL_DISPLAY_NAMES[call.toolName] || call.toolName;
              // Emit simplified [WORK:tool:description] marker
              await writeProgress(`[WORK:${call.toolName}:${displayName}]\n`);
              console.log(`[Chat API] 🔧 Executing: ${call.toolName}`);
              // Note: generate_website_files now emits its own progress via onProgress callback
            }
          }
        }

        // Emit completion markers with duration
        if (toolResults && toolResults.length > 0) {
          for (const toolResult of toolResults) {
            if (!completedTools.has(toolResult.toolName)) {
              completedTools.add(toolResult.toolName);
              const rawDuration = toolStartTimes[toolResult.toolName]
                ? (Date.now() - toolStartTimes[toolResult.toolName]) / 1000
                : 0;
              // Show minimum 0.5s for very fast tools to feel more responsive
              const displayDuration = rawDuration < 0.5 ? '' : rawDuration.toFixed(1);
              const duration = displayDuration;

              // Check if the tool result indicates failure
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const result = (toolResult as any).result as { success?: boolean; error?: string; summary?: string } | undefined;
              if (result && result.success === false) {
                // Emit error marker for failed tools
                const errorMessage = result.error || 'Unknown error';
                await writeProgress(`[WORK_ERROR:${toolResult.toolName}:${errorMessage}]\n`);
                console.log(`[Chat API] ❌ Failed: ${toolResult.toolName} - ${errorMessage}`);
              } else {
                // Emit simplified [WORK_DONE:tool:duration] marker
                // Only show duration if it was significant (>0.5s)
                const durationDisplay = duration ? `${duration}s` : '';
                await writeProgress(`[WORK_DONE:${toolResult.toolName}:${durationDisplay}]\n`);
                console.log(`[Chat API] ✅ Completed: ${toolResult.toolName}${duration ? ` (${duration}s)` : ''}`);

                // Inject success message for edit tools (AI doesn't reliably see tool results)
                // Also set flag to suppress any subsequent AI text that might hallucinate errors
                if (toolResult.toolName === 'edit_website') {
                  const summary = result?.summary || 'Updated your website';
                  await writeProgress(`Done! ${summary}.\n`);
                  editToolCompleted = true;
                } else if (toolResult.toolName === 'edit_identity') {
                  await writeProgress(`Done! Updated your brand identity.\n`);
                  editToolCompleted = true;
                }
              }
            }
          }
        }
      },

      // Save assistant message when complete
      onFinish: async ({ text, toolCalls, finishReason }) => {
        logTiming('stream_finished');
        console.log('[Chat API] Stream finished:', finishReason);
        console.log('[Chat API] === TIMING SUMMARY ===', timings);
        console.log('[Chat API] Tool calls:', toolCalls?.length || 0);

        // Generate content from text or tool calls
        let content = text || '';

        // Save to database
        const finalContent = content ||
          (toolCalls && toolCalls.length > 0
            ? `Executed: ${toolCalls.map(t => t.toolName).join(', ')}`
            : '');

        if (finalContent) {
          // Fire-and-forget - don't block stream close
          (supabase.from('messages') as any).insert({
            id: assistantMessageId, // Use client-generated ID for deduplication
            project_id: projectId,
            role: 'assistant',
            content: finalContent,
            metadata: {
              toolCount: toolCalls?.length || 0,
              finishReason,
            },
          }).then(({ error: assistantMsgError }: { error: any }) => {
            if (assistantMsgError) {
              console.error('[DB] Assistant message save failed:', assistantMsgError);
            } else {
              console.log('[DB] ✅ Saved assistant message');
            }
          });
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
            let firstChunk = true;
            while (true) {
              const { done, value } = await aiReader.read();
              if (done) break;

              // Suppress AI text after edit tool completes successfully
              // This prevents the AI from hallucinating errors after successful edits
              if (editToolCompleted) {
                console.log('[Chat API] Suppressing AI text after edit completion');
                continue; // Skip this chunk
              }

              // Log timing for first AI text token
              if (firstChunk) {
                firstChunk = false;
                logTiming('first_ai_token');
                console.log('[Chat API] 🚀 First AI token received!');
                // Clear escalation timer and mark first token received
                firstTokenReceived = true;
                if (statusEscalationTimer) {
                  clearTimeout(statusEscalationTimer);
                  statusEscalationTimer = null;
                }
                // Send status update that AI is responding
                controller.enqueue(encoder.encode('[STATUS:responding:AI is responding...]\n'));
              }
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
