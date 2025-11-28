'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { ArrowUp, Plus, Paperclip, ChevronDown, Search, Loader2, Check, Circle } from 'lucide-react';
import Image from 'next/image';
import { useProjectStore } from '@/store/projectStore';
import { fetchModels, searchModels, type Model } from '@/lib/services/openRouter';
import { detectIntent } from '@/lib/utils/intentDetector';

// Progress tracking types
interface ProgressStep {
  toolName: string;
  stepIndex: number;
  text: string;
  completed: boolean;
}

interface ToolProgress {
  toolName: string;
  displayName: string;
  status: 'running' | 'complete';
  duration?: string;
  steps: ProgressStep[];
}

interface ChatPanelProps {
  projectName?: string;
}

// Placeholder text based on editor mode
const PLACEHOLDER_BY_MODE: Record<string, string> = {
  bento: 'Ask anything...',
  website: 'Edit your website...',
  leads: 'Manage your leads...',
  outreach: 'Refine your outreach...',
};

export default function ChatPanel({ projectName = 'New Project' }: ChatPanelProps) {
  const { project, messages: storeMessages, selectedModelId, setSelectedModelId, addMessage, updateMessage, setToolRunning, editorMode, setHasStartedGeneration, setWorkspaceView } = useProjectStore();
  const [models, setModels] = useState<Model[]>([]);
  const [filteredModels, setFilteredModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [modelsLoading, setModelsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [toolProgress, setToolProgress] = useState<Record<string, ToolProgress>>({});
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Load models on mount
  useEffect(() => {
    async function loadModels() {
      try {
        const fetchedModels = await fetchModels();
        setModels(fetchedModels);
        setFilteredModels(fetchedModels);

        const currentModel = fetchedModels.find((m) => m.id === selectedModelId);
        setSelectedModel(currentModel || fetchedModels[0]);
        setModelsLoading(false);
      } catch (error) {
        console.error('Failed to load models:', error);
        setModelsLoading(false);
      }
    }

    loadModels();
  }, [selectedModelId]);

  // Handle search
  useEffect(() => {
    setFilteredModels(searchModels(models, searchQuery));
  }, [searchQuery, models]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsModelDropdownOpen(false);
        setSearchQuery('');
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isModelDropdownOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isModelDropdownOpen]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [storeMessages]);

  // Handle message submission
  const handleSendMessage = useCallback(async (messageText?: string) => {
    const textToSend = messageText || input.trim();
    console.log('[ChatPanel] handleSendMessage called', { textToSend, isLoading, projectId: project?.id });
    if (!textToSend || isLoading || !project?.id) {
      console.warn('[ChatPanel] Early return:', { hasText: !!textToSend, isLoading, hasProject: !!project?.id });
      return;
    }

    // Clear input immediately
    setInput('');
    setIsLoading(true);

    // Mark that generation has started - this shows the ghost cards
    setHasStartedGeneration(true);

    // Add user message optimistically to store
    const userMessage = {
      id: crypto.randomUUID(),
      project_id: project.id,
      role: 'user' as const,
      content: textToSend,
      created_at: new Date().toISOString(),
    };
    addMessage(userMessage);

    // Detect intent for context-aware loading message
    const { emoji, loadingMessage } = detectIntent(textToSend);

    // Create placeholder assistant message with context-aware status
    const assistantMessageId = crypto.randomUUID();
    const assistantMessage = {
      id: assistantMessageId,
      project_id: project.id,
      role: 'assistant' as const,
      content: `${emoji} ${loadingMessage}`,
      created_at: new Date().toISOString(),
    };
    addMessage(assistantMessage);

    try {
      // Create abort controller for this request
      abortControllerRef.current = new AbortController();

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            ...storeMessages.map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: textToSend }
          ],
          projectId: project.id,
          modelId: selectedModelId,
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
      };

      // Reset progress tracking
      setToolProgress({});

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
            // Clear all running tools
            Object.values(toolNameToType).forEach(toolType => {
              setToolRunning(toolType, false);
            });
            // If no text was received, show completion message
            if (!hasReceivedText || assistantContent.trim() === '') {
              updateMessage(assistantMessageId, '✅ All tasks completed successfully!');
            }
            break;
          }

          const chunk = decoder.decode(value, { stream: true });

          // Parse progress markers: [PROGRESS:toolName:status:displayName] or [PROGRESS:toolName:complete:displayName:duration]
          const progressMatches = chunk.matchAll(/\[PROGRESS:(\w+):(start|complete):([^:\]]+)(?::([^\]]+))?\]/g);
          for (const match of progressMatches) {
            const [, toolName, status, displayName, duration] = match;
            const toolType = toolNameToType[toolName];

            if (status === 'start') {
              setToolProgress(prev => ({
                ...prev,
                [toolName]: {
                  toolName,
                  displayName,
                  status: 'running',
                  steps: [],
                },
              }));
              if (toolType) setToolRunning(toolType, true);
            } else if (status === 'complete') {
              setToolProgress(prev => ({
                ...prev,
                [toolName]: {
                  ...prev[toolName],
                  status: 'complete',
                  duration,
                },
              }));
              if (toolType) setToolRunning(toolType, false);

              // AI Auto-switch: Navigate to relevant view when tool completes
              const targetView = toolNameToView[toolName];
              if (targetView) {
                setWorkspaceView(targetView);
              }
            }
          }

          // Parse step markers: [STEP:toolName:stepIndex:stepText]
          const stepMatches = chunk.matchAll(/\[STEP:(\w+):(\d+):([^\]]+)\]/g);
          for (const match of stepMatches) {
            const [, toolName, stepIndexStr, stepText] = match;
            const stepIndex = parseInt(stepIndexStr, 10);

            setToolProgress(prev => {
              const tool = prev[toolName];
              if (!tool) return prev;

              const steps = [...tool.steps];
              steps[stepIndex] = {
                toolName,
                stepIndex,
                text: stepText,
                completed: false,
              };

              // Mark previous steps as completed
              for (let i = 0; i < stepIndex; i++) {
                if (steps[i]) steps[i].completed = true;
              }

              return {
                ...prev,
                [toolName]: { ...tool, steps },
              };
            });
          }

          // Remove all markers from displayed content
          const cleanChunk = chunk
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
    }
  }, [project?.id, isLoading, input, storeMessages, selectedModelId, addMessage, updateMessage, setToolRunning, setHasStartedGeneration, setWorkspaceView]);

  // Listen for auto-submit event from WorkspaceHydration
  useEffect(() => {
    const handleAutoSubmit = (event: CustomEvent) => {
      console.log('[ChatPanel] autoSubmitPrompt event received', event.detail);
      const { prompt } = event.detail;
      console.log('[ChatPanel] Auto-submit check:', { prompt, isLoading, hasProject: !!project?.id });
      if (prompt && !isLoading && project?.id) {
        console.log('[ChatPanel] Auto-submitting prompt:', prompt);
        setInput(prompt);
        handleSendMessage(prompt);
      } else {
        console.warn('[ChatPanel] Auto-submit blocked:', { hasPrompt: !!prompt, isLoading, hasProject: !!project?.id });
      }
    };

    console.log('[ChatPanel] Setting up autoSubmitPrompt listener');
    window.addEventListener('autoSubmitPrompt', handleAutoSubmit as EventListener);
    return () => {
      window.removeEventListener('autoSubmitPrompt', handleAutoSubmit as EventListener);
    };
  }, [isLoading, project?.id, handleSendMessage]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage();
  };

  const hasInput = input.trim().length > 0;

  return (
    <div className="h-full flex flex-col" style={{ background: 'var(--surface-1)' }}>
      {/* Chat Stream */}
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto px-6 py-8 space-y-6 scrollbar-hide">
        {storeMessages.length === 0 ? (
          /* Empty State */
          <div className="flex items-center justify-center h-full" />
        ) : (
          /* Message List */
          <>
            {storeMessages.map((message, index) => {
              const isLastMessage = index === storeMessages.length - 1;
              const isStreaming = isLastMessage && isLoading && message.role === 'assistant';
              const isInitialLoading = isStreaming && message.content.startsWith('⏳');
              const hasProgress = isLastMessage && isLoading && Object.keys(toolProgress).length > 0;

              return (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'user' ? (
                    /* User message - keep in bubble */
                    <div className="max-w-[80%] rounded-2xl px-4 py-3 text-sm bg-zinc-900 dark:bg-white text-white dark:text-zinc-900">
                      {message.content}
                    </div>
                  ) : (
                    /* AI message - display with icon */
                    <div className="flex gap-3 w-full max-w-full">
                      {/* AI Icon */}
                      <div className="flex-shrink-0 w-7 h-7 rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
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
                        {/* Progress Display */}
                        {hasProgress && (
                          <div className="mb-4 space-y-3">
                            {Object.values(toolProgress).map((tool) => (
                              <div key={tool.toolName} className="rounded-lg bg-zinc-50 dark:bg-zinc-800/50 p-3">
                                <div className="flex items-center gap-2 mb-2">
                                  {tool.status === 'running' ? (
                                    <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                                  ) : (
                                    <Check className="h-4 w-4 text-green-500" />
                                  )}
                                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                                    {tool.displayName}
                                  </span>
                                  {tool.duration && (
                                    <span className="text-xs text-zinc-400 ml-auto">
                                      {tool.duration}
                                    </span>
                                  )}
                                </div>
                                {tool.steps.length > 0 && (
                                  <div className="pl-6 space-y-1">
                                    {tool.steps.map((step, i) => (
                                      <div key={i} className="flex items-center gap-2 text-xs">
                                        {step.completed || tool.status === 'complete' ? (
                                          <Check className="h-3 w-3 text-green-500" />
                                        ) : (
                                          <Circle className="h-3 w-3 text-zinc-300 dark:text-zinc-600" />
                                        )}
                                        <span className={
                                          step.completed || tool.status === 'complete'
                                            ? 'text-zinc-500 dark:text-zinc-400'
                                            : 'text-zinc-400 dark:text-zinc-500'
                                        }>
                                          {step.text}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Message Content - no background */}
                        {(!hasProgress || message.content.trim()) && (
                          <div className="text-sm text-zinc-900 dark:text-zinc-100 whitespace-pre-wrap leading-relaxed">
                            {isInitialLoading && !hasProgress ? (
                              <div className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin text-zinc-500" />
                                <span className="text-zinc-500">{message.content.replace(/^[^\s]+\s/, '')}</span>
                              </div>
                            ) : (
                              <>
                                {message.content}
                                {isStreaming && !hasProgress && (
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
          <div className="relative rounded-2xl" style={{ background: 'var(--surface-2)', boxShadow: 'var(--shadow-md)' }}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e as any);
                }
              }}
              placeholder={PLACEHOLDER_BY_MODE[editorMode] || 'Ask anything...'}
              className="w-full pl-4 pr-12 pt-3 pb-12 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 resize-none focus:outline-none bg-transparent rounded-2xl"
              rows={1}
              style={{ minHeight: '120px' }}
              disabled={isLoading}
            />

            {/* Left Action Buttons */}
            <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
              <button
                type="button"
                className="flex items-center justify-center w-7 h-7 text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-all"
                aria-label="Add attachment"
              >
                <Plus size={14} strokeWidth={1.5} />
              </button>
              <button
                type="button"
                className="flex items-center justify-center w-7 h-7 text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-all"
                aria-label="Attach file"
              >
                <Paperclip size={14} strokeWidth={1.5} />
              </button>

              {/* Model Picker Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                  className="flex items-center gap-1 px-2 h-6 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded transition-colors border border-zinc-200 dark:border-zinc-700"
                  aria-label="Select model"
                  disabled={modelsLoading}
                >
                  <span className="font-medium max-w-[120px] truncate">
                    {modelsLoading
                      ? 'Loading...'
                      : selectedModel
                        ? selectedModel.name
                        : 'Select Model'}
                  </span>
                  <ChevronDown
                    size={12}
                    strokeWidth={1.5}
                    className={`transition-transform ${isModelDropdownOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {isModelDropdownOpen && !modelsLoading && (
                  <div className="absolute left-0 bottom-full mb-2 w-96 rounded-lg overflow-hidden z-50" style={{ background: 'var(--surface-3)', boxShadow: 'var(--shadow-xl)' }}>
                    {/* Search Input */}
                    <div className="p-3 border-b border-zinc-100 dark:border-zinc-700/50">
                      <div className="relative">
                        <Search
                          size={14}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                        />
                        <input
                          ref={searchInputRef}
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search models..."
                          className="w-full pl-9 pr-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-zinc-900 dark:text-zinc-100"
                        />
                      </div>
                    </div>

                    {/* Models List */}
                    <div className="max-h-96 overflow-y-auto">
                      {filteredModels.length === 0 ? (
                        <div className="px-4 py-8 text-center text-xs text-zinc-400">
                          No models found
                        </div>
                      ) : (
                        filteredModels.map((model) => (
                          <button
                            key={model.id}
                            type="button"
                            onClick={() => {
                              setSelectedModel(model);
                              setSelectedModelId(model.id);
                              setIsModelDropdownOpen(false);
                              setSearchQuery('');
                            }}
                            className={`w-full px-4 py-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors ${
                              selectedModel?.id === model.id
                                ? 'bg-zinc-50 dark:bg-zinc-700'
                                : ''
                            }`}
                          >
                            <div className="text-xs font-medium text-zinc-900 dark:text-zinc-100">
                              {model.name}
                            </div>
                            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                              {model.id}
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Send Button */}
            <button
              type="submit"
              disabled={!hasInput || isLoading}
              className="absolute bottom-3 right-3 flex items-center justify-center w-7 h-7 text-white bg-zinc-900 dark:bg-white dark:text-zinc-900 rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Send message"
            >
              <ArrowUp size={16} strokeWidth={2} />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
