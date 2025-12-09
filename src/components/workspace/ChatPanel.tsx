'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import React from 'react';
import { ArrowUp, Plus, Paperclip, ChevronDown, Pencil, MessageSquare, Lightbulb, MousePointer2, X, Check, Loader2, Square } from 'lucide-react';

// ============================================
// IMAGE UPLOAD TYPES
// ============================================

interface PendingImage {
  id: string;
  file: File;
  preview: string;      // Object URL for preview
  uploading: boolean;
  uploaded: boolean;
  url?: string;         // Supabase URL after upload
  error?: string;
  purpose: 'reference' | 'content';  // reference = AI analyzes for styling, content = embed in website
}
import Image from 'next/image';
import { useProjectStore, type WorkspaceView } from '@/store/projectStore';
import { TOOL_DISPLAY_NAMES } from '@/store/projectStore';
import { WorkSection, type WorkItem, type ProgressStage } from './WorkSection';
import { CodeChangeViewer, type CodeChange } from './CodeChangeViewer';
import { WaveText } from '../ui/WaveText';

// Curated top models with provider info (same as HeroInput)
interface TopModel {
  id: string;
  name: string;
  provider: string;
  providerLogo: string;
}

const TOP_MODELS: Record<string, TopModel[]> = {
  Google: [
    { id: 'google/gemini-2.5-flash-preview', name: 'Gemini 2.5 Flash', provider: 'Google', providerLogo: '/logos/google.svg' },
    { id: 'google/gemini-3-pro-preview', name: 'Gemini 3 Pro Preview', provider: 'Google', providerLogo: '/logos/google.svg' },
  ],
  Anthropic: [
    { id: 'anthropic/claude-opus-4.5', name: 'Claude Opus 4.5', provider: 'Anthropic', providerLogo: '/logos/anthropic.svg' },
    { id: 'anthropic/claude-sonnet-4.5', name: 'Claude Sonnet 4.5', provider: 'Anthropic', providerLogo: '/logos/anthropic.svg' },
    { id: 'anthropic/claude-haiku-4.5', name: 'Claude Haiku 4.5', provider: 'Anthropic', providerLogo: '/logos/anthropic.svg' },
  ],
  xAI: [
    { id: 'x-ai/grok-4.1', name: 'Grok 4.1', provider: 'xAI', providerLogo: '/logos/xai.svg' },
  ],
  OpenAI: [
    { id: 'openai/gpt-5-pro', name: 'GPT-5 Pro', provider: 'OpenAI', providerLogo: '/logos/openai.svg' },
    { id: 'openai/gpt-5.1', name: 'GPT-5.1', provider: 'OpenAI', providerLogo: '/logos/openai.svg' },
  ],
  DeepSeek: [
    { id: 'deepseek/deepseek-v3.2', name: 'DeepSeek V3.2', provider: 'DeepSeek', providerLogo: '/logos/deepseek.svg' },
    { id: 'deepseek/deepseek-r1', name: 'DeepSeek R1', provider: 'DeepSeek', providerLogo: '/logos/deepseek.svg' },
  ],
  Moonshot: [
    { id: 'moonshotai/kimi-k2', name: 'Kimi K2', provider: 'Moonshot', providerLogo: '/logos/moonshot.svg' },
  ],
};

// Flatten for easy lookup
const ALL_MODELS = Object.values(TOP_MODELS).flat();
const DEFAULT_MODEL = ALL_MODELS.find(m => m.id === 'google/gemini-3-pro-preview') || ALL_MODELS[0];

interface ChatPanelProps {
  projectName?: string;
}

// ============================================
// CHAT MODES
// ============================================

type ChatMode = 'edit' | 'chat' | 'plan';

const CHAT_MODE_CONFIG: Record<ChatMode, {
  label: string;
  icon: typeof Pencil;
  placeholder: string;
  description: string;
}> = {
  edit: {
    label: 'Edit',
    icon: Pencil,
    placeholder: 'Describe what to change...',
    description: 'Make changes to your website, brand, or pricing',
  },
  chat: {
    label: 'Chat',
    icon: MessageSquare,
    placeholder: 'Ask anything...',
    description: 'Chat freely without making changes',
  },
  plan: {
    label: 'Plan',
    icon: Lightbulb,
    placeholder: 'What do you want to build?',
    description: 'Plan and strategize before building',
  },
};

// Placeholder text based on workspace view
const PLACEHOLDER_BY_VIEW: Record<WorkspaceView, string> = {
  HOME: 'Ask anything...',
  SITE: 'Edit your website...',
  BRAND: 'Refine your brand identity...',
  FINANCE: 'Update your pricing and offer...',
  CRM: 'Manage your leads and outreach...',
  ADS: 'Create ads and marketing content...',
};

// Get placeholder based on context (mode-aware, lead-aware)
const getPlaceholder = (workspaceView: WorkspaceView, currentLeadName: string | null, chatMode: ChatMode): string => {
  if (currentLeadName) {
    return `Ask about ${currentLeadName}...`;
  }
  // Use mode-specific placeholder
  return CHAT_MODE_CONFIG[chatMode].placeholder;
};

// Tool-specific emojis for context-aware loading messages
const TOOL_EMOJIS: Record<string, string> = {
  'perform_market_research': '🔍',
  'generate_brand_identity': '✨',
  'generate_business_plan': '📊',
  'generate_website_files': '🌐',
  'generate_first_week_plan': '📅',
  'generate_leads': '🎯',
  'generate_outreach_scripts': '📧',
  'edit_website': '🌐',
  'edit_identity': '✨',
  'edit_pricing': '💰',
  'remix_website': '🔄',
};

export default function ChatPanel({ projectName = 'New Project' }: ChatPanelProps) {
  const {
    project,
    messages: storeMessages,
    selectedModelId,
    setSelectedModelId,
    addMessage,
    updateMessage,
    setToolRunning,
    editorMode,
    workspaceView,
    setHasStartedGeneration,
    setWorkspaceView,
    // Canvas state for lead context
    canvasState,
    artifacts,
    // Canvas state actions
    setCanvasState,
    startTool,
    updateToolStage,
    completeTool,
    failTool,
    resetTools,
    refreshArtifact,
    // Element selection for visual editing
    selectedElementSelector,
    setSelectedElementSelector,
    selectedElementInfo,
    setSelectedElementInfo,
    isSelectMode,
    setIsSelectMode,
  } = useProjectStore();

  // Get current lead if viewing lead detail
  const currentLead = canvasState.type === 'lead-detail'
    ? artifacts.leads?.leads.find(l => l.id === canvasState.leadId)
    : null;

  // Track active lead for website generation (set via autoSubmitPrompt event)
  const [activeLeadId, setActiveLeadId] = useState<string | null>(null);

  // Local model state using curated TOP_MODELS (same as HeroInput)
  const [selectedModel, setSelectedModel] = useState<TopModel>(() => {
    // Initialize from project's selected model or default
    if (selectedModelId) {
      const found = ALL_MODELS.find(m => m.id === selectedModelId);
      if (found) return found;
    }
    return DEFAULT_MODEL;
  });
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [isModeDropdownOpen, setIsModeDropdownOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatMode, setChatMode] = useState<ChatMode>('edit');
  const [workItems, setWorkItems] = useState<Record<string, WorkItem>>({});
  const [codeChanges, setCodeChanges] = useState<Record<string, CodeChange[]>>({});
  const dropdownRef = useRef<HTMLDivElement>(null);
  const modeDropdownRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const submissionLockRef = useRef(false);
  const handleSendMessageRef = useRef<((messageText?: string, leadIdOverride?: string) => Promise<void>) | undefined>(undefined);

  // Image upload state
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync selected model with project's model ID when it changes externally
  useEffect(() => {
    if (selectedModelId) {
      const found = ALL_MODELS.find(m => m.id === selectedModelId);
      if (found && found.id !== selectedModel.id) {
        setSelectedModel(found);
      }
    }
  }, [selectedModelId, selectedModel.id]);

  // Click outside to close dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsModelDropdownOpen(false);
      }
      if (modeDropdownRef.current && !modeDropdownRef.current.contains(event.target as Node)) {
        setIsModeDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [storeMessages]);

  // ============================================
  // IMAGE UPLOAD HANDLERS
  // ============================================

  // Handle file input change
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      await handleFilesSelected(files);
    }
    // Reset input for re-selection of same file
    e.target.value = '';
  };

  // Process selected files
  const handleFilesSelected = async (files: File[]) => {
    // Limit to 5 images max
    const maxImages = 5;
    const availableSlots = maxImages - pendingImages.length;
    const filesToAdd = files.slice(0, availableSlots);

    if (files.length > availableSlots) {
      console.warn(`[ChatPanel] Only ${availableSlots} more image(s) allowed`);
    }

    // Filter to only image files
    const imageFiles = filesToAdd.filter(file => file.type.startsWith('image/'));

    // Create pending image entries with previews
    const newImages: PendingImage[] = imageFiles.map(file => ({
      id: crypto.randomUUID(),
      file,
      preview: URL.createObjectURL(file),
      uploading: true,
      uploaded: false,
      purpose: 'content' as const,  // Default to content (embed in website)
    }));

    setPendingImages(prev => [...prev, ...newImages]);

    // Upload each image
    for (const img of newImages) {
      try {
        const formData = new FormData();
        formData.append('file', img.file);
        formData.append('projectId', project?.id || '');
        formData.append('purpose', img.purpose);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Upload failed');
        }

        const result = await response.json();

        setPendingImages(prev => prev.map(p =>
          p.id === img.id
            ? { ...p, uploading: false, uploaded: true, url: result.url }
            : p
        ));
      } catch (error) {
        console.error('[ChatPanel] Upload error:', error);
        setPendingImages(prev => prev.map(p =>
          p.id === img.id
            ? { ...p, uploading: false, error: error instanceof Error ? error.message : 'Upload failed' }
            : p
        ));
      }
    }
  };

  // Remove an image from pending
  const removeImage = (id: string) => {
    setPendingImages(prev => {
      const img = prev.find(p => p.id === id);
      if (img?.preview) {
        URL.revokeObjectURL(img.preview);
      }
      return prev.filter(p => p.id !== id);
    });
  };

  // Toggle image purpose between reference and content
  const toggleImagePurpose = (id: string) => {
    setPendingImages(prev => prev.map(p =>
      p.id === id
        ? { ...p, purpose: p.purpose === 'reference' ? 'content' : 'reference' }
        : p
    ));
  };

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files).filter(f =>
      f.type.startsWith('image/')
    );

    if (files.length > 0) {
      await handleFilesSelected(files);
    }
  };

  // Clear all pending images (called after send)
  const clearPendingImages = () => {
    pendingImages.forEach(img => {
      if (img.preview) {
        URL.revokeObjectURL(img.preview);
      }
    });
    setPendingImages([]);
  };

  // Handle message submission
  // leadIdOverride allows passing leadId directly (avoids async state timing issues)
  const handleSendMessage = useCallback(async (messageText?: string, leadIdOverride?: string) => {
    const rawText = messageText || input.trim();
    // Use override if provided, otherwise fall back to state, then canvas state
    const effectiveLeadId = leadIdOverride || activeLeadId || (
      canvasState.type === 'lead-detail' ? canvasState.leadId : null
    );
    // Prepend element selector context if an element is selected
    const textToSend = selectedElementSelector
      ? `[Targeting element: ${selectedElementSelector}] ${rawText}`
      : rawText;
    console.log('[ChatPanel] handleSendMessage called', { textToSend, isLoading, projectId: project?.id, locked: submissionLockRef.current, selectedElementSelector });

    // Prevent double submission with lock
    if (submissionLockRef.current) {
      console.log('[ChatPanel] Submission blocked - already in progress');
      return;
    }

    if (!textToSend || isLoading || !project?.id) {
      console.warn('[ChatPanel] Early return:', { hasText: !!textToSend, isLoading, hasProject: !!project?.id });
      return;
    }

    // Acquire lock
    submissionLockRef.current = true;

    // Clear input immediately
    setInput('');
    setIsLoading(true);

    // Clear selected element after sending (user intent has been captured)
    if (selectedElementSelector) {
      setSelectedElementSelector(null);
      setSelectedElementInfo(null);
    }

    // Mark that generation has started - this shows the ghost cards
    setHasStartedGeneration(true);

    // Build image references from pending images
    const imageRefs = pendingImages
      .filter(img => img.uploaded && img.url)
      .map(img => ({
        url: img.url!,
        filename: img.file.name,
        purpose: img.purpose,
        mimeType: img.file.type,
      }));

    // Add user message optimistically to store (show raw text to user, not the prefixed version)
    const userMessage = {
      id: crypto.randomUUID(),
      project_id: project.id,
      role: 'user' as const,
      content: rawText, // Display the raw text without selector prefix
      metadata: imageRefs.length > 0 ? { images: imageRefs } : undefined,
      created_at: new Date().toISOString(),
    };
    addMessage(userMessage);

    // Clear pending images after capturing them
    clearPendingImages();

    // Create placeholder assistant message - server will send real progress via [STATUS:...] markers
    const assistantMessageId = crypto.randomUUID();
    const assistantMessage = {
      id: assistantMessageId,
      project_id: project.id,
      role: 'assistant' as const,
      content: '🔄 Connecting...',
      created_at: new Date().toISOString(),
    };
    addMessage(assistantMessage);

    // No fake cycling messages - server sends real [STATUS:...] markers that update the message

    try {
      // Create abort controller for this request
      abortControllerRef.current = new AbortController();

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            ...storeMessages.map(m => ({ role: m.role, content: m.content, id: m.id, metadata: m.metadata })),
            { role: 'user', content: textToSend, id: userMessage.id, metadata: userMessage.metadata }
          ],
          projectId: project.id,
          modelId: selectedModelId,
          assistantMessageId, // Pass assistant message ID for DB save
          chatMode, // Pass chat mode for prompt adjustment
          leadId: effectiveLeadId, // Pass lead ID for lead website generation
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Tool name to store ToolType mapping
      const toolNameToType: Record<string, 'research' | 'identity' | 'website' | 'businessplan' | 'leads' | 'outreach'> = {
        'perform_market_research': 'research',
        'generate_brand_identity': 'identity',
        'generate_website_files': 'website',
        'generate_business_plan': 'businessplan',
        'generate_leads': 'leads',
        'generate_outreach_scripts': 'outreach',
        // Edit tools map to the same artifact types
        'edit_website': 'website',
        'edit_identity': 'identity',
        'edit_pricing': 'businessplan',
        // Remix tool generates website
        'remix_website': 'website',
      };

      // Tool name to workspace view mapping for AI auto-switch
      const toolNameToView: Record<string, 'HOME' | 'BRAND' | 'CRM' | 'SITE' | 'FINANCE'> = {
        'generate_website_files': 'SITE',
        'edit_website': 'SITE',
        'generate_brand_identity': 'BRAND',
        'edit_identity': 'BRAND',
        'generate_business_plan': 'FINANCE',
        'edit_pricing': 'FINANCE',
        'generate_leads': 'CRM',
        'generate_outreach_scripts': 'CRM',
        'remix_website': 'SITE',
      };

      // Tool name to artifact type for refresh (MUST be defined before streaming loop)
      const toolNameToArtifactType: Record<string, 'website_code' | 'identity' | 'market_research' | 'business_plan' | 'leads' | 'outreach' | 'crawled_site'> = {
        'generate_website_files': 'website_code',
        'edit_website': 'website_code',
        'generate_brand_identity': 'identity',
        'edit_identity': 'identity',
        'perform_market_research': 'market_research',
        'generate_business_plan': 'business_plan',
        'edit_pricing': 'business_plan',
        'generate_leads': 'leads',
        'generate_outreach_scripts': 'outreach',
        'remix_website': 'website_code',
      };

      // Reset work items and code changes tracking
      setWorkItems({});
      setCodeChanges({});
      resetTools(); // Reset canvas tool statuses

      // Track if we've started any tools (for canvas state transition)
      let hasStartedAnyTool = false;
      // Track which generation tool ran for artifact-specific validation
      let activeGenerationTool: string | null = null;

      // Read the plain text stream and update message progressively
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      let hasReceivedText = false;

      if (reader) {
        console.log('[ChatPanel] Stream started');

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            console.log('[ChatPanel] Stream complete');

            // Mark all running work items as complete (fixes spinner never stopping)
            setWorkItems(prev => {
              const updated = { ...prev };
              for (const key of Object.keys(updated)) {
                if (updated[key].status === 'running') {
                  updated[key] = {
                    ...updated[key],
                    status: 'complete',
                  };
                }
              }
              return updated;
            });

            // Clear all running tools
            Object.values(toolNameToType).forEach(toolType => {
              setToolRunning(toolType, false);
            });

            // Transition to overview only if the specific artifact is ready
            // Don't show overview before website/brand/etc are ready
            if (hasStartedAnyTool && activeGenerationTool) {
              // Map tool names to artifact keys
              const toolToArtifactKey: Record<string, string> = {
                'generate_website_files': 'website',
                'edit_website': 'website',
                'remix_website': 'website',
                'generate_brand_identity': 'identity',
                'edit_identity': 'identity',
                'perform_market_research': 'research',
                'generate_business_plan': 'businessPlan',
                'edit_pricing': 'businessPlan',
              };

              const requiredArtifactKey = toolToArtifactKey[activeGenerationTool];

              // Poll for the specific artifact (max 6 attempts, 300ms each = 1.8 seconds)
              const toolName = activeGenerationTool; // Capture for closure
              const pollForArtifact = async () => {
                for (let attempt = 0; attempt < 6; attempt++) {
                  // Refresh the artifact from database
                  const artifactType = toolNameToArtifactType[toolName];
                  if (artifactType) {
                    await refreshArtifact(artifactType);
                  }

                  // Check if artifact exists now
                  const { artifacts } = useProjectStore.getState();
                  const artifactExists = requiredArtifactKey
                    ? artifacts[requiredArtifactKey as keyof typeof artifacts] !== null
                    : Object.values(artifacts).some(a => a !== null);

                  if (artifactExists) {
                    console.log('[ChatPanel] Artifact ready, transitioning to overview');
                    setCanvasState({ type: 'overview' });
                    return;
                  }

                  console.log(`[ChatPanel] Waiting for artifact... attempt ${attempt + 1}/6`);
                  await new Promise(resolve => setTimeout(resolve, 100));
                }

                // After ~2 seconds, transition anyway (with whatever state exists)
                console.log('[ChatPanel] Timeout waiting for artifact, transitioning to overview');
                setCanvasState({ type: 'overview' });
              };

              pollForArtifact();
            }

            // If no text was received, show completion message
            if (!hasReceivedText || assistantContent.trim() === '') {
              updateMessage(assistantMessageId, 'Your business is ready.');
            }
            break;
          }

          const chunk = decoder.decode(value, { stream: true });

          // Debug: Log chunks that contain markers (uncomment for debugging)
          if (chunk.includes('[WORK') || chunk.includes('[PROGRESS')) {
            console.log('[ChatPanel] 📨 Received marker chunk:', chunk.substring(0, 200));
          }

          // Parse [STATUS:phase:message] markers for immediate feedback
          const statusMatches = chunk.matchAll(/\[STATUS:([^:]+):([^\]]+)\]/g);
          for (const match of statusMatches) {
            const [, phase, message] = match;
            // Status updates replace the cycling messages
            updateMessage(assistantMessageId, `🔄 ${message}`);
          }

          // Parse [WORK:tool:description] markers (tool started)
          const workMatches = chunk.matchAll(/\[WORK:(\w+):([^\]]+)\]/g);
          for (const match of workMatches) {
            const [, toolName, description] = match;
            const toolType = toolNameToType[toolName];
            console.log('[ChatPanel] 🔧 TOOL STARTED:', toolName, '-', description);

            // No need to stop cycling - server sends real STATUS markers now

            // Only show loading canvas for generation tools, NOT edit tools
            // Edit tools should update in place without the full loading screen
            // generate_leads should NOT show loading canvas - it's a conversational flow
            const isGenerationTool = toolName.startsWith('generate_') || toolName === 'perform_market_research' || toolName === 'remix_website';
            const skipLoadingCanvas = toolName === 'generate_leads';
            if (!hasStartedAnyTool && isGenerationTool && !skipLoadingCanvas) {
              hasStartedAnyTool = true;
              activeGenerationTool = toolName; // Track which tool for artifact validation
              setCanvasState({ type: 'loading' });
            }

            // Update local work items state
            setWorkItems(prev => ({
              ...prev,
              [toolName]: {
                toolName,
                description,
                status: 'running',
              },
            }));

            // Update global canvas tool status
            startTool(toolName);

            if (toolType) setToolRunning(toolType, true);

            // Update assistant message with context-aware loading text
            const emoji = TOOL_EMOJIS[toolName] || '⚙️';
            const displayName = TOOL_DISPLAY_NAMES[toolName] || description;
            updateMessage(assistantMessageId, `${emoji} ${displayName}...`);
          }

          // Parse [REMIX_STATUS:phase:message] markers for phase transitions
          const remixStatusMatches = chunk.matchAll(/\[REMIX_STATUS:([^:]+):([^\]]+)\]/g);
          for (const match of remixStatusMatches) {
            const [, phase, message] = match;
            const emoji = phase === 'crawling' ? '🌐' : phase === 'generating' ? '✨' : '🔄';
            updateMessage(assistantMessageId, `${emoji} ${message}`);
          }

          // Parse [REMIX_CRAWL:url:message] markers for remix crawl progress
          const remixCrawlMatches = chunk.matchAll(/\[REMIX_CRAWL:([^:]+):([^\]]+)\]/g);
          for (const match of remixCrawlMatches) {
            const [, url, message] = match;
            // Update tool stage with crawl progress (deferred to avoid setState during render)
            queueMicrotask(() => updateToolStage('remix_website', `Crawling: ${message}`));
            // Also update the chat message with lively crawl progress
            updateMessage(assistantMessageId, `🔍 ${message}`);
          }

          // Parse [REMIX_ANALYZE:step:message] markers for analyzing phase
          const remixAnalyzeMatches = chunk.matchAll(/\[REMIX_ANALYZE:([^:]+):([^\]]+)\]/g);
          for (const match of remixAnalyzeMatches) {
            const [, step, message] = match;
            // Update tool stage with analyze progress (deferred to avoid setState during render)
            queueMicrotask(() => updateToolStage('remix_website', message));
            // Also update the chat message with analyze progress
            updateMessage(assistantMessageId, `🎯 ${message}`);
          }

          // Parse [REMIX_GENERATE:page:message] markers for remix generation progress
          const remixGenMatches = chunk.matchAll(/\[REMIX_GENERATE:([^:]+):([^\]]+)\]/g);
          for (const match of remixGenMatches) {
            const [, page, message] = match;
            // Update tool stage with generation progress (deferred to avoid setState during render)
            queueMicrotask(() => updateToolStage('remix_website', `Generating: ${message}`));
            // Also update the chat message with generation progress
            updateMessage(assistantMessageId, `🎨 ${message}`);
          }

          // Parse [REMIX_COMPLETE:summary] markers for remix completion
          const remixCompleteMatches = chunk.matchAll(/\[REMIX_COMPLETE:([^\]]+)\]/g);
          for (const match of remixCompleteMatches) {
            const [, summary] = match;
            // Tool completion is handled by WORK_DONE marker
          }

          // Parse [WORK_DONE:tool:duration] markers (tool completed)
          // Note: duration can be empty for fast tools (<0.5s), so use * not +
          const doneMatches = chunk.matchAll(/\[WORK_DONE:(\w+):([^\]]*)\]/g);
          for (const match of doneMatches) {
            const [, toolName, duration] = match;
            const toolType = toolNameToType[toolName];
            console.log('[ChatPanel] ✅ TOOL COMPLETED:', toolName, duration ? `(${duration})` : '');

            // Update local work items state
            setWorkItems(prev => ({
              ...prev,
              [toolName]: {
                ...prev[toolName],
                status: 'complete',
                duration,
              },
            }));

            // Update global canvas tool status
            completeTool(toolName, duration);

            if (toolType) setToolRunning(toolType, false);

            // AI Auto-switch: Navigate to relevant view when tool completes
            const targetView = toolNameToView[toolName];
            if (targetView) {
              setWorkspaceView(targetView);
            }

            // Refresh artifact after tool completes (store has retry logic for race condition)
            // Special handling for edit_website - check if we're editing a lead website
            if (toolName === 'edit_website') {
              const canvasState = useProjectStore.getState().canvasState;
              if (canvasState.type === 'lead-detail') {
                // Lead website edit - emit event for LeadDetailWorkspace to refresh
                console.log('[ChatPanel] Lead website edited, emitting refresh event for lead:', canvasState.leadId);
                window.dispatchEvent(new CustomEvent('leadWebsiteEdited', {
                  detail: { leadId: canvasState.leadId }
                }));
              } else {
                // Agency website edit - refresh website_code artifact
                console.log('[ChatPanel] Agency website edited, refreshing website_code');
                refreshArtifact('website_code');
              }
            } else {
              const artifactType = toolNameToArtifactType[toolName];
              if (artifactType) {
                console.log('[ChatPanel] Refreshing artifact:', artifactType);
                refreshArtifact(artifactType);
              }
            }

            // Emit completion event for lead website generation
            if (toolName === 'generate_website_files' && effectiveLeadId) {
              console.log('[ChatPanel] Emitting leadWebsiteGenerated for lead:', effectiveLeadId);
              window.dispatchEvent(new CustomEvent('leadWebsiteGenerated', {
                detail: { leadId: effectiveLeadId, success: true }
              }));
            }
          }

          // Parse [WORK_PROGRESS:tool:message] markers (progress updates)
          const workProgressMatches = chunk.matchAll(/\[WORK_PROGRESS:(\w+):([^\]]+)\]/g);
          for (const match of workProgressMatches) {
            const [, toolName, message] = match;
            console.log('[ChatPanel] 📊 Progress:', toolName, message);

            // Emit progress event for lead website generation
            if (toolName === 'generate_website_files' && effectiveLeadId) {
              window.dispatchEvent(new CustomEvent('leadWebsiteProgress', {
                detail: { leadId: effectiveLeadId, stage: toolName, message }
              }));
            }
          }

          // Parse [WORK_ERROR:tool:message] markers (tool failed)
          const errorMatches = chunk.matchAll(/\[WORK_ERROR:(\w+):([^\]]+)\]/g);
          for (const match of errorMatches) {
            const [, toolName, errorMessage] = match;
            const toolType = toolNameToType[toolName];

            console.error('[ChatPanel] Tool failed:', toolName, errorMessage);

            // Update local work items state
            setWorkItems(prev => ({
              ...prev,
              [toolName]: {
                ...prev[toolName],
                status: 'error',
                errorMessage,
              },
            }));

            // Update global canvas tool status
            failTool(toolName, errorMessage);

            if (toolType) setToolRunning(toolType, false);
          }

          // Parse [CODE_CHANGE:file:description|before|after] markers
          const codeChangeMatches = chunk.matchAll(/\[CODE_CHANGE:([^:]+):([^\]|]+)(?:\|([^|]+)\|([^|]+))?\]/g);
          for (const match of codeChangeMatches) {
            const [, file, description, before, after] = match;

            setCodeChanges(prev => ({
              ...prev,
              [assistantMessageId]: [
                ...(prev[assistantMessageId] || []),
                {
                  file,
                  description,
                  before,
                  after,
                  timestamp: Date.now(),
                  status: 'complete',
                },
              ],
            }));
          }

          // Parse [PROGRESS:stage:message] markers for multi-stage progress
          const progressMatches = chunk.matchAll(/\[PROGRESS:([^:]+):([^\]]+)\]/g);
          for (const match of progressMatches) {
            const [, stageId, message] = match;

            setWorkItems(prev => {
              // Find the currently running tool to add this stage to
              const runningToolName = Object.keys(prev).find(k => prev[k].status === 'running');
              if (!runningToolName) return prev;

              // Also update global tool status for LoadingCanvas (deferred to avoid setState during render)
              queueMicrotask(() => updateToolStage(runningToolName, message));

              const currentTool = prev[runningToolName];
              const existingStages = currentTool.stages || [];

              // Mark previous stages as complete, add new stage as active
              const updatedStages: ProgressStage[] = existingStages.map(s => ({
                ...s,
                status: 'complete' as const,
              }));

              // Add the new stage as active with unique ID (using crypto.randomUUID per React best practices)
              updatedStages.push({
                id: crypto.randomUUID(),
                message,
                status: 'active',
                timestamp: Date.now(),
              });

              return {
                ...prev,
                [runningToolName]: {
                  ...currentTool,
                  currentStage: stageId,
                  stages: updatedStages,
                },
              };
            });
          }

          // Remove all markers from displayed content (including legacy markers for backwards compatibility)
          const cleanChunk = chunk
            .replace(/\[WORK:\w+:[^\]]+\]\n?/g, '')
            .replace(/\[WORK_DONE:\w+:[^\]]*\]\n?/g, '')
            .replace(/\[WORK_ERROR:\w+:[^\]]+\]\n?/g, '')
            .replace(/\[WORK_PROGRESS:\w+:[^\]]+\]\n?/g, '')
            .replace(/\[CODE_CHANGE:[^\]]+\]\n?/g, '')
            // Status markers for immediate feedback
            .replace(/\[STATUS:[^\]]+\]\n?/g, '')
            // Remix progress markers
            .replace(/\[REMIX_STATUS:[^\]]+\]\n?/g, '')
            .replace(/\[REMIX_CRAWL:[^\]]+\]\n?/g, '')
            .replace(/\[REMIX_ANALYZE:[^\]]+\]\n?/g, '')
            .replace(/\[REMIX_GENERATE:[^\]]+\]\n?/g, '')
            .replace(/\[REMIX_COMPLETE:[^\]]+\]\n?/g, '')
            // Legacy marker cleanup (backwards compatibility during transition)
            .replace(/\[THINKING\][^\n]*\n?/g, '')
            .replace(/\[PROGRESS:[^\]]+\]\n?/g, '')
            .replace(/\[STEP:[^\]]+\]\n?/g, '')
            .replace(/\[TOOL_START:\w+\]\n?/g, '')
            .replace(/\[TOOL_COMPLETE:\w+\]\n?/g, '');

          // Only update if we receive actual text
          if (cleanChunk && cleanChunk.trim()) {
            assistantContent += cleanChunk;
            hasReceivedText = true;
            updateMessage(assistantMessageId, assistantContent);
          }
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Request aborted');
      } else {
        console.error('Failed to send message:', error);
        // Update message with error
        updateMessage(assistantMessageId, 'Error: Failed to get response. Please try again.');
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
      submissionLockRef.current = false; // Release lock
      setActiveLeadId(null); // Clear lead context after request completes
      // No fake cycling to clear - server sends real STATUS markers now
    }
  }, [project?.id, isLoading, input, storeMessages, selectedModelId, addMessage, updateMessage, setToolRunning, setHasStartedGeneration, setWorkspaceView, selectedElementSelector, setSelectedElementSelector, setSelectedElementInfo, activeLeadId]);

  // Keep ref updated with latest handleSendMessage
  useEffect(() => {
    handleSendMessageRef.current = handleSendMessage;
  }, [handleSendMessage]);

  // Listen for auto-submit event from WorkspaceHydration and LeadDetailWorkspace
  // IMPORTANT: Use ref to avoid re-registering listener when handleSendMessage changes
  useEffect(() => {
    const handleAutoSubmit = (event: CustomEvent) => {
      console.log('[ChatPanel] autoSubmitPrompt event received', event.detail);
      const { prompt, leadId, leadName } = event.detail;

      // Log lead context if provided
      if (leadId) {
        console.log('[ChatPanel] Lead website generation for:', leadId, leadName);
      }

      if (prompt && handleSendMessageRef.current) {
        console.log('[ChatPanel] Auto-submitting prompt via ref:', prompt, 'leadId:', leadId);
        // Pass leadId directly to avoid async state timing issues
        handleSendMessageRef.current(prompt, leadId);
      } else {
        console.warn('[ChatPanel] Auto-submit blocked - no ref or prompt');
      }
    };

    console.log('[ChatPanel] Setting up autoSubmitPrompt listener (stable)');
    window.addEventListener('autoSubmitPrompt', handleAutoSubmit as EventListener);
    return () => {
      console.log('[ChatPanel] Removing autoSubmitPrompt listener');
      window.removeEventListener('autoSubmitPrompt', handleAutoSubmit as EventListener);
    };
  }, []); // Empty deps - listener stays stable, uses ref for latest function

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage();
  };

  const hasInput = input.trim().length > 0;

  return (
    <div className="h-full flex flex-col" style={{ background: 'var(--surface-1)' }}>
      {/* Chat Stream */}
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-4 scrollbar-hide">
        {storeMessages.length === 0 ? (
          /* Empty State */
          <div className="flex items-center justify-center h-full" />
        ) : (
          /* Message List */
          <>
            {storeMessages.map((message, index) => {
              const isLastMessage = index === storeMessages.length - 1;
              const isStreaming = isLastMessage && isLoading && message.role === 'assistant';
              const isInitialLoading = isStreaming && message.content.startsWith('🔄');
              const hasWorkItems = isLastMessage && Object.keys(workItems).length > 0;
              const hasCodeChanges = codeChanges[message.id] && codeChanges[message.id].length > 0;

              return (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'user' ? (
                    /* User message - keep in bubble */
                    (() => {
                      const images = message.metadata?.images as Array<{ url: string; filename: string; purpose: string }> | undefined;
                      return (
                        <div className="max-w-[80%]">
                          {/* Display uploaded images above message */}
                          {images && images.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-2 justify-end">
                              {images.map((img, i) => (
                                <div key={i}>
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={img.url}
                                    alt={img.filename}
                                    className="w-16 h-16 object-cover rounded-lg border border-zinc-300 dark:border-zinc-600"
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                          <div className="rounded-2xl px-4 py-3 text-sm bg-zinc-200 dark:bg-[#262626] text-zinc-900 dark:text-zinc-100">
                            {message.content}
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    /* AI message - display with icon */
                    <div className="flex gap-3 w-full max-w-full">
                      {/* AI Icon */}
                      <div className="flex-shrink-0 w-7 h-7 rounded-full overflow-hidden bg-zinc-100 dark:bg-[#262626]">
                        <Image
                          src="/anythingicondark.png"
                          alt="AI"
                          width={28}
                          height={28}
                          className="dark:hidden"
                        />
                        <Image
                          src="/anythingiconlight.png"
                          alt="AI"
                          width={28}
                          height={28}
                          className="hidden dark:block"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Work Section - collapsible progress display */}
                        {hasWorkItems && (
                          <WorkSection
                            items={Object.values(workItems)}
                          />
                        )}

                        {/* Code Changes Viewer - show real-time code edits */}
                        {hasCodeChanges && (
                          <CodeChangeViewer
                            changes={codeChanges[message.id]}
                            isStreaming={isStreaming}
                          />
                        )}

                        {/* Message Content */}
                        {message.content.trim() && (
                          <div className="text-sm text-zinc-900 dark:text-zinc-100 whitespace-pre-wrap leading-relaxed">
                            {isInitialLoading ? (
                              <div className="flex items-center gap-2">
                                <span className="relative flex h-4 w-4">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-zinc-400 dark:bg-zinc-500 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-4 w-4 bg-zinc-500 dark:bg-zinc-400"></span>
                                </span>
                                <WaveText
                                  text={message.content.replace(/^[^\s]+\s/, '')}
                                  className="text-zinc-600 dark:text-zinc-400"
                                />
                              </div>
                            ) : (message.metadata as any)?.type === 'model_change' ? (
                              <div className="flex items-center gap-2">
                                <span className="text-zinc-500 dark:text-zinc-400">Model changed to</span>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={(message.metadata as any).modelLogo}
                                  alt=""
                                  width={16}
                                  height={16}
                                  className="rounded-sm"
                                />
                                <span className="font-medium">{(message.metadata as any).modelName}</span>
                              </div>
                            ) : (
                              <>
                                {message.content}
                                {isStreaming && (
                                  <span className="inline-block ml-1 w-2 h-4 bg-zinc-400 dark:bg-zinc-500 animate-pulse" />
                                )}
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Bottom Input */}
      <form onSubmit={handleSubmit}>
        <div className="p-1.5">
          <div
            className={`relative rounded-2xl transition-all ${isDragging ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
            style={{ background: 'var(--surface-2)', boxShadow: 'var(--shadow-md)' }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {/* Drag overlay */}
            {isDragging && (
              <div className="absolute inset-0 bg-blue-500/10 rounded-2xl flex items-center justify-center z-30 pointer-events-none">
                <div className="text-blue-500 font-medium text-sm">Drop images here</div>
              </div>
            )}

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />

            {/* Top content area - stacks element targeting and image previews */}
            {(pendingImages.length > 0 || selectedElementInfo) && (
              <div className="absolute top-2 left-3 right-3 flex flex-col gap-2 z-20">
                {/* Element Targeting Badge - show when element is selected */}
                {selectedElementInfo && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-zinc-100 dark:bg-[#171717] border border-zinc-200 dark:border-zinc-700 rounded-lg">
                    <MousePointer2 size={14} className="text-zinc-500 dark:text-zinc-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                          Targeting:
                        </span>
                        <code className="text-xs font-mono text-zinc-600 dark:text-zinc-400 truncate">
                          &lt;{selectedElementInfo.tagName}&gt;
                        </code>
                      </div>
                      {selectedElementInfo.text && (
                        <p className="text-xs text-zinc-500 dark:text-zinc-500 truncate mt-0.5">
                          &quot;{selectedElementInfo.text}&quot;
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedElementInfo(null);
                        setSelectedElementSelector(null);
                      }}
                      className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}

                {/* Image Previews - shown when images are pending */}
                {pendingImages.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {pendingImages.map((img) => (
                      <div key={img.id} className="relative group">
                        {/* Thumbnail */}
                        <div className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-colors ${
                          img.error ? 'border-red-500' :
                          img.uploading ? 'border-blue-500' :
                          img.uploaded ? 'border-green-500' :
                          'border-zinc-300 dark:border-zinc-600'
                        }`}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={img.preview}
                            alt="Upload preview"
                            className="w-full h-full object-cover"
                          />
                          {/* Upload progress overlay */}
                          {img.uploading && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <Loader2 className="w-4 h-4 text-white animate-spin" />
                            </div>
                          )}
                          {/* Error overlay */}
                          {img.error && (
                            <div className="absolute inset-0 bg-red-500/50 flex items-center justify-center">
                              <X className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </div>

                        {/* Remove button */}
                        <button
                          type="button"
                          onClick={() => removeImage(img.id)}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-800 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}

                    {/* Add more button */}
                    {pendingImages.length < 5 && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-14 h-14 rounded-lg border-2 border-dashed border-zinc-300 dark:border-zinc-600 flex items-center justify-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:border-zinc-400 dark:hover:border-zinc-500 transition-colors"
                      >
                        <Plus size={18} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e as any);
                }
              }}
              placeholder={getPlaceholder(workspaceView, currentLead?.companyName ?? null, chatMode)}
              className={`w-full pl-4 pr-12 pb-12 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 resize-none focus:outline-none bg-transparent rounded-2xl overflow-y-auto ${
                pendingImages.length > 0 && selectedElementInfo ? 'pt-32' : pendingImages.length > 0 ? 'pt-20' : selectedElementInfo ? 'pt-14' : 'pt-3'
              }`}
              rows={1}
              style={{
                minHeight: pendingImages.length > 0 || selectedElementInfo ? '180px' : '120px',
                maxHeight: '300px'
              }}
              disabled={isLoading}
            />

            {/* Left Action Buttons - Order: Plus → Attach → Mode → Cursor → Model */}
            <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
              {/* Plus Button */}
              <button
                type="button"
                className="flex items-center justify-center w-7 h-7 text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-[#171717] rounded-lg transition-all"
                aria-label="Add attachment"
              >
                <Plus size={14} strokeWidth={1.5} />
              </button>

              {/* Attach File Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`flex items-center justify-center w-7 h-7 rounded-lg transition-all ${
                  pendingImages.length > 0
                    ? 'text-blue-500 bg-blue-50 dark:bg-blue-950'
                    : 'text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-[#171717]'
                }`}
                aria-label="Attach images"
                title="Upload images (drag & drop also works)"
              >
                <Paperclip size={14} strokeWidth={1.5} />
              </button>

              {/* Mode Picker Dropdown */}
              <div className="relative" ref={modeDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsModeDropdownOpen(!isModeDropdownOpen)}
                  className="flex items-center gap-1.5 px-2 h-6 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-[#171717] rounded transition-colors border border-zinc-200 dark:border-zinc-700"
                >
                  {React.createElement(CHAT_MODE_CONFIG[chatMode].icon, { size: 12 })}
                  <span className="font-medium">{CHAT_MODE_CONFIG[chatMode].label}</span>
                  <ChevronDown size={12} className={`transition-transform ${isModeDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isModeDropdownOpen && (
                  <div className="absolute left-0 bottom-full mb-2 w-52 bg-white dark:bg-[#171717] border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-xl z-50 overflow-hidden">
                    {(['edit', 'chat', 'plan'] as ChatMode[]).map((mode) => {
                      const config = CHAT_MODE_CONFIG[mode];
                      const isActive = chatMode === mode;
                      return (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => {
                            setChatMode(mode);
                            setIsModeDropdownOpen(false);
                          }}
                          className={`w-full px-3 py-2.5 text-left flex items-center gap-3 transition-colors ${
                            isActive
                              ? 'bg-zinc-100 dark:bg-[#262626]'
                              : 'hover:bg-zinc-50 dark:hover:bg-[#262626]'
                          }`}
                        >
                          {React.createElement(config.icon, { size: 14, className: 'text-zinc-500 dark:text-zinc-400 flex-shrink-0' })}
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{config.label}</div>
                            <div className="text-xs text-zinc-500 dark:text-zinc-400">{config.description}</div>
                          </div>
                          {isActive && <Check size={14} className="text-zinc-900 dark:text-white flex-shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Cursor Mode Toggle */}
              <button
                type="button"
                onClick={() => setIsSelectMode(!isSelectMode)}
                className={`flex items-center justify-center w-7 h-7 rounded-lg transition-all ${
                  isSelectMode
                    ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
                    : 'text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-[#171717]'
                }`}
                title={isSelectMode ? 'Exit selection mode' : 'Select element to edit'}
              >
                <MousePointer2 size={14} strokeWidth={1.5} />
              </button>

              {/* Model Picker Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                  className="flex items-center gap-1.5 px-2 h-6 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-[#171717] rounded transition-colors border border-zinc-200 dark:border-zinc-700"
                  aria-label="Select model"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedModel.providerLogo}
                    alt={selectedModel.provider}
                    width={14}
                    height={14}
                    className="rounded-sm"
                  />
                  <span className="font-medium max-w-[120px] truncate">
                    {selectedModel.name}
                  </span>
                  <ChevronDown
                    size={12}
                    strokeWidth={1.5}
                    className={`transition-transform ${isModelDropdownOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {isModelDropdownOpen && (
                  <div className="absolute left-0 bottom-full mb-2 w-72 bg-white dark:bg-[#171717] border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden z-50">
                    {/* Models List by Category */}
                    <div className="max-h-[400px] overflow-y-auto py-2">
                      {Object.entries(TOP_MODELS).map(([provider, models]) => (
                        <div key={provider}>
                          {/* Provider Header */}
                          <div className="px-3 py-1.5 text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                            {provider}
                          </div>
                          {/* Models */}
                          {models.map((model) => (
                            <button
                              key={model.id}
                              type="button"
                              onClick={() => {
                                // Only show message if model actually changed
                                if (selectedModel.id !== model.id) {
                                  addMessage({
                                    id: crypto.randomUUID(),
                                    project_id: project?.id || '',
                                    role: 'assistant',
                                    content: `Model changed to ${model.name}`,
                                    created_at: new Date().toISOString(),
                                    metadata: {
                                      type: 'model_change',
                                      modelName: model.name,
                                      modelLogo: model.providerLogo,
                                    },
                                  });
                                }
                                setSelectedModel(model);
                                setSelectedModelId(model.id);
                                setIsModelDropdownOpen(false);
                              }}
                              className={`w-full px-3 py-2 text-left hover:bg-zinc-50 dark:hover:bg-[#262626] transition-colors flex items-center gap-2.5 ${
                                selectedModel.id === model.id
                                  ? 'bg-zinc-50 dark:bg-[#262626]'
                                  : ''
                              }`}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={model.providerLogo}
                                alt={model.provider}
                                width={18}
                                height={18}
                                className="rounded-sm flex-shrink-0"
                              />
                              <span className="font-medium text-sm text-zinc-900 dark:text-zinc-100">
                                {model.name}
                              </span>
                              {selectedModel.id === model.id && (
                                <span className="ml-auto text-zinc-900 dark:text-white">✓</span>
                              )}
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Send/Stop Button */}
            {isLoading ? (
              <button
                type="button"
                onClick={() => abortControllerRef.current?.abort()}
                className="absolute bottom-3 right-3 flex items-center justify-center w-7 h-7 bg-zinc-900 dark:bg-white rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all"
                aria-label="Stop generating"
              >
                <Square size={12} strokeWidth={0} className="fill-white dark:fill-zinc-900" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!hasInput}
                className="absolute bottom-3 right-3 flex items-center justify-center w-7 h-7 text-white bg-zinc-900 dark:bg-white dark:text-zinc-900 rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Send message"
              >
                <ArrowUp size={16} strokeWidth={2} />
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
