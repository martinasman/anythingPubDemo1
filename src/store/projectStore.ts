import { create } from 'zustand';
import type {
  Project,
  Message,
  Artifact,
  ArtifactType,
  WebsiteArtifact,
  IdentityArtifact,
  ResearchArtifact,
  LeadsArtifact,
  OutreachArtifact,
  FirstWeekPlanArtifact,
  Lead,
  LeadActivity,
  CRMArtifact,
} from '@/types/database';

// ============================================
// STATE INTERFACE
// ============================================

type ToolType = 'research' | 'identity' | 'website' | 'businessplan' | 'leads' | 'outreach' | 'firstweekplan';
type EditorMode = 'bento' | 'website' | 'leads' | 'outreach';
type ContextView = 'overview' | 'identity' | 'funnel' | 'leads' | 'legal';
export type WorkspaceView = 'HOME' | 'BRAND' | 'CRM' | 'SITE';

// Canvas state types for loading/overview system
export type CanvasState =
  | { type: 'empty' }
  | { type: 'loading' }
  | { type: 'overview' }
  | { type: 'detail'; view: 'website' | 'brand' | 'plan' | 'leads' | 'clients' | 'templates' }
  | { type: 'lead-detail'; leadId: string }
  // Remix-specific states
  | { type: 'remix-crawling'; url: string; pagesDiscovered: number; pagesCrawled: number; currentPage: string }
  | { type: 'remix-generating'; currentPage: number; totalPages: number; pageName: string };

export interface ToolStatus {
  name: string;
  displayName: string;
  status: 'pending' | 'running' | 'complete' | 'error';
  startedAt?: number;
  completedAt?: number;
  duration?: string;
  currentStage?: string; // Current stage message for dynamic progress
  errorMessage?: string; // Error details for failed tools
}

// Tool display names for loading canvas
export const TOOL_DISPLAY_NAMES: Record<string, string> = {
  'perform_market_research': 'Researching your market',
  'generate_brand_identity': 'Creating your brand',
  'generate_website_files': 'Building your website',
  'generate_first_week_plan': 'Planning your first week',
  'generate_leads': 'Finding prospects',
  'generate_outreach_scripts': 'Writing outreach scripts',
  'generate_lead_website': 'Generating website preview',
  'edit_website': 'Updating your website',
  'edit_identity': 'Updating your brand',
  'remix_website': 'Remixing website',
};

interface ProjectState {
  // Core Data
  project: Project | null;
  messages: Message[];
  artifacts: {
    website: WebsiteArtifact | null;
    identity: IdentityArtifact | null;
    research: ResearchArtifact | null;
    leads: LeadsArtifact | null;
    outreach: OutreachArtifact | null;
    firstWeekPlan: FirstWeekPlanArtifact | null;
    crm: CRMArtifact | null;
  };
  selectedModelId: string;

  // UI State
  isLoading: boolean;
  error: string | null;
  runningTools: Set<ToolType>;
  editorMode: EditorMode;
  hasStartedGeneration: boolean;
  contextView: ContextView;
  workspaceView: WorkspaceView;

  // Canvas state for loading/overview system
  canvasState: CanvasState;
  toolStatuses: Map<string, ToolStatus>;

  // Element selection for visual editing
  selectedElementSelector: string | null;
  selectedElementInfo: { selector: string; tagName: string; text?: string } | null;
  isSelectMode: boolean;
  setSelectedElementSelector: (selector: string | null) => void;
  setSelectedElementInfo: (info: { selector: string; tagName: string; text?: string } | null) => void;
  setIsSelectMode: (mode: boolean) => void;

  // Actions
  setInitialData: (
    project: Project,
    messages: Message[],
    rawArtifacts: Artifact[]
  ) => void;
  addMessage: (message: Message) => void;
  updateMessage: (messageId: string, content: string) => void;
  updateArtifact: (type: ArtifactType, artifact: Artifact) => void;
  setSelectedModelId: (modelId: string) => void;
  setToolRunning: (tool: ToolType, isRunning: boolean) => void;
  setEditorMode: (mode: EditorMode) => void;
  setHasStartedGeneration: (started: boolean) => void;
  setContextView: (view: ContextView) => void;
  setWorkspaceView: (view: WorkspaceView) => void;
  clearProject: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Lead management actions
  updateLeadStatus: (leadId: string, status: Lead['status']) => Promise<void>;
  addLeadActivity: (activity: Omit<LeadActivity, 'id' | 'createdAt'>) => Promise<void>;
  deleteLead: (leadId: string) => Promise<void>;

  // First Week Plan actions
  updateTaskCompletion: (taskId: string, completed: boolean) => Promise<void>;

  // Canvas state actions
  setCanvasState: (state: CanvasState) => void;
  startTool: (toolName: string) => void;
  updateToolStage: (toolName: string, stageMessage: string) => void;
  completeTool: (toolName: string, duration?: string) => void;
  failTool: (toolName: string, errorMessage: string) => void;
  resetTools: () => void;
  retryGeneration: (artifactType: 'identity' | 'website' | 'leads' | 'outreach') => Promise<void>;

  // Artifact refresh action (fallback for when realtime doesn't fire)
  refreshArtifact: (type: ArtifactType) => Promise<void>;
}

// ============================================
// STORE
// ============================================

export const useProjectStore = create<ProjectState>((set, get) => ({
  // Initial State
  project: null,
  messages: [],
  artifacts: {
    website: null,
    identity: null,
    research: null,
    leads: null,
    outreach: null,
    firstWeekPlan: null,
    crm: null,
  },
  selectedModelId: 'anthropic/claude-3.5-sonnet',
  isLoading: false,
  error: null,
  runningTools: new Set<ToolType>(),
  editorMode: 'bento' as EditorMode,
  hasStartedGeneration: false,
  contextView: 'overview' as ContextView,
  workspaceView: 'HOME' as WorkspaceView,
  canvasState: { type: 'empty' } as CanvasState,
  toolStatuses: new Map<string, ToolStatus>(),
  selectedElementSelector: null,
  selectedElementInfo: null,
  isSelectMode: false,

  // Actions
  setSelectedElementSelector: (selector) => set({ selectedElementSelector: selector }),
  setSelectedElementInfo: (info) => set({ selectedElementInfo: info }),
  setIsSelectMode: (mode) => set({ isSelectMode: mode }),
  setInitialData: (project, messages, rawArtifacts) => {
    console.log('[Store] setInitialData called with', rawArtifacts.length, 'artifacts');
    const artifacts = {
      website: null as WebsiteArtifact | null,
      identity: null as IdentityArtifact | null,
      research: null as ResearchArtifact | null,
      leads: null as LeadsArtifact | null,
      outreach: null as OutreachArtifact | null,
      firstWeekPlan: null as FirstWeekPlanArtifact | null,
      crm: null as CRMArtifact | null,
    };

    // Parse raw artifacts into typed state
    rawArtifacts.forEach((artifact) => {
      console.log('[Store] Processing artifact:', artifact.type);
      if (artifact.type === 'website_code') {
        artifacts.website = {
          ...(artifact.data as WebsiteArtifact),
          version: artifact.version || 1,
          previous_data: artifact.previous_data as WebsiteArtifact | undefined,
        };
        console.log('[Store] Loaded website artifact, version:', artifact.version);
      } else if (artifact.type === 'identity') {
        artifacts.identity = artifact.data as IdentityArtifact;
        console.log('[Store] Loaded identity artifact');
      } else if (artifact.type === 'market_research') {
        artifacts.research = artifact.data as ResearchArtifact;
        console.log('[Store] Loaded research artifact');
      } else if (artifact.type === 'leads') {
        artifacts.leads = artifact.data as LeadsArtifact;
        console.log('[Store] Loaded leads artifact');
      } else if (artifact.type === 'outreach') {
        artifacts.outreach = artifact.data as OutreachArtifact;
        console.log('[Store] Loaded outreach artifact');
      } else if (artifact.type === 'first_week_plan') {
        artifacts.firstWeekPlan = artifact.data as FirstWeekPlanArtifact;
        console.log('[Store] Loaded first week plan artifact');
      } else if (artifact.type === 'crm') {
        artifacts.crm = artifact.data as CRMArtifact;
        console.log('[Store] Loaded CRM artifact');
      }
    });

    console.log('[Store] Final artifacts:', artifacts);

    // Deduplicate messages by ID - server is source of truth
    const messageMap = new Map();

    // Only use database messages, don't merge with local state
    // This prevents stale optimistic messages from persisting after reload
    messages.forEach(msg => messageMap.set(msg.id, msg));

    const deduplicatedMessages = Array.from(messageMap.values())
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    // Determine if generation has started (any artifacts exist or messages beyond initial)
    const hasAnyArtifacts = rawArtifacts.length > 0;
    const hasUserMessages = deduplicatedMessages.some(m => m.role === 'user');

    // Determine canvas state based on loaded data
    const canvasState: CanvasState = hasAnyArtifacts
      ? { type: 'overview' }
      : { type: 'empty' };

    set({
      project,
      messages: deduplicatedMessages,
      artifacts,
      selectedModelId: project.model_id || 'deepseek/deepseek-r1',
      isLoading: false,
      error: null,
      hasStartedGeneration: hasAnyArtifacts || hasUserMessages,
      canvasState,
      toolStatuses: new Map<string, ToolStatus>(), // Reset tool statuses
    });
  },

  addMessage: (message) => {
    set((state) => {
      // Prevent duplicate messages by ID
      const exists = state.messages.some(m => m.id === message.id);
      if (exists) {
        console.warn('[Store] Duplicate message blocked:', message.id);
        return state; // No change
      }
      return {
        messages: [...state.messages, message],
      };
    });
  },

  updateMessage: (messageId, content) => {
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === messageId ? { ...msg, content } : msg
      ),
    }));
  },

  updateArtifact: (type, artifact) => {
    console.log('[Store] updateArtifact called:', type, artifact);

    // Validate inputs
    if (!artifact) {
      console.error('[Store] Cannot update: artifact is null/undefined');
      return;
    }

    if (!artifact.data) {
      console.error('[Store] Cannot update: artifact.data is null/undefined');
      return;
    }

    const oldArtifacts = get().artifacts;

    set((state) => {
      const newArtifacts = { ...state.artifacts };

      if (type === 'website_code') {
        console.log('[Store] Updating website artifact, version:', artifact.version);
        newArtifacts.website = {
          ...(artifact.data as WebsiteArtifact),
          version: artifact.version || 1,
          previous_data: artifact.previous_data as WebsiteArtifact | undefined,
        };
      } else if (type === 'identity') {
        console.log('[Store] Updating identity artifact');
        const identityData = artifact.data as IdentityArtifact;
        console.log('[Store] Identity data:', {
          name: identityData.name,
          logoUrlType: typeof identityData.logoUrl,
          logoUrlLength: identityData.logoUrl?.length,
          logoUrlStart: identityData.logoUrl?.substring(0, 100),
          colors: identityData.colors,
          font: identityData.font,
          tagline: identityData.tagline,
        });
        newArtifacts.identity = identityData;
      } else if (type === 'market_research') {
        console.log('[Store] Updating research artifact');
        newArtifacts.research = artifact.data as ResearchArtifact;
      } else if (type === 'leads') {
        console.log('[Store] Updating leads artifact');
        newArtifacts.leads = artifact.data as LeadsArtifact;
      } else if (type === 'outreach') {
        console.log('[Store] Updating outreach artifact');
        newArtifacts.outreach = artifact.data as OutreachArtifact;
      } else if (type === 'first_week_plan') {
        console.log('[Store] Updating first week plan artifact');
        newArtifacts.firstWeekPlan = artifact.data as FirstWeekPlanArtifact;
      } else if (type === 'crm') {
        console.log('[Store] Updating CRM artifact');
        newArtifacts.crm = artifact.data as CRMArtifact;
      } else {
        console.error('[Store] Unknown artifact type:', type);
        return state; // Don't update state for unknown types
      }

      console.log('[Store] New artifacts state:', newArtifacts);
      return { artifacts: newArtifacts };
    });

  },

  setSelectedModelId: (modelId) => set({ selectedModelId: modelId }),

  setEditorMode: (mode) => set({ editorMode: mode }),

  setHasStartedGeneration: (started) => set({ hasStartedGeneration: started }),

  setContextView: (view) => set({ contextView: view }),

  setWorkspaceView: (view) => set({ workspaceView: view }),

  setToolRunning: (tool, isRunning) => {
    set((state) => {
      const newRunningTools = new Set(state.runningTools);
      if (isRunning) {
        newRunningTools.add(tool);
      } else {
        newRunningTools.delete(tool);
      }
      return { runningTools: newRunningTools };
    });
  },

  clearProject: () => {
    set({
      project: null,
      messages: [],
      artifacts: {
        website: null,
        identity: null,
        research: null,
        leads: null,
        outreach: null,
        firstWeekPlan: null,
        crm: null,
      },
      selectedModelId: 'anthropic/claude-3.5-sonnet',
      isLoading: false,
      error: null,
      runningTools: new Set<ToolType>(),
      editorMode: 'bento' as EditorMode,
      hasStartedGeneration: false,
      contextView: 'overview' as ContextView,
      workspaceView: 'HOME' as WorkspaceView,
      canvasState: { type: 'empty' } as CanvasState,
      toolStatuses: new Map<string, ToolStatus>(),
    });
  },

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  // Lead management actions
  updateLeadStatus: async (leadId, status) => {
    const state = get();
    const projectId = state.project?.id;

    // Get previous status for activity log (if lead exists in artifacts)
    let previousStatus: Lead['status'] | undefined;

    // Optimistic update if lead exists in artifacts
    if (state.artifacts.leads) {
      const lead = state.artifacts.leads.leads.find(l => l.id === leadId);
      previousStatus = lead?.status;

      set((state) => ({
        artifacts: {
          ...state.artifacts,
          leads: state.artifacts.leads ? {
            ...state.artifacts.leads,
            leads: state.artifacts.leads.leads.map(l =>
              l.id === leadId ? { ...l, status } : l
            )
          } : null
        }
      }));
    }

    // ALWAYS persist to API - it handles both artifacts AND dedicated leads table
    if (projectId) {
      try {
        const response = await fetch('/api/leads/status', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId, leadId, status })
        });

        if (!response.ok) {
          console.error('[Store] Failed to update lead status:', response.status);
          return;
        }

        // Log status change activity
        await get().addLeadActivity({
          leadId,
          type: 'status_changed',
          content: `Status changed to ${status}`,
          metadata: { previousStatus, newStatus: status }
        });
      } catch (error) {
        console.error('[Store] Failed to persist lead status:', error);
      }
    } else {
      console.error('[Store] No project ID to update lead status');
    }
  },

  addLeadActivity: async (activityData) => {
    const state = get();
    const projectId = state.project?.id;

    const activity: LeadActivity = {
      id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...activityData,
      createdAt: new Date().toISOString()
    };

    // Optimistic update
    set((state) => ({
      artifacts: {
        ...state.artifacts,
        leads: state.artifacts.leads ? {
          ...state.artifacts.leads,
          activities: [...(state.artifacts.leads.activities || []), activity]
        } : null
      }
    }));

    // Persist to API if we have a project
    if (projectId) {
      try {
        await fetch('/api/leads/activity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId, activity })
        });
      } catch (error) {
        console.error('[Store] Failed to persist activity:', error);
      }
    }
  },

  deleteLead: async (leadId) => {
    const state = get();
    const projectId = state.project?.id;

    if (!projectId) {
      console.error('[Store] No project ID to delete lead');
      return;
    }

    // Optimistic update - remove from leads artifact
    set((state) => ({
      artifacts: {
        ...state.artifacts,
        leads: state.artifacts.leads ? {
          ...state.artifacts.leads,
          leads: state.artifacts.leads.leads.filter(l => l.id !== leadId),
          activities: (state.artifacts.leads.activities || []).filter(a => a.leadId !== leadId)
        } : null
      }
    }));

    // Also update canvas state if we're viewing the deleted lead
    const canvasState = get().canvasState;
    if (canvasState.type === 'lead-detail' && canvasState.leadId === leadId) {
      set({ canvasState: { type: 'overview' } });
    }

    // Persist to API
    try {
      const response = await fetch(`/api/leads/${leadId}?projectId=${projectId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        console.error('[Store] Failed to delete lead:', response.status);
        // Could revert optimistic update here if needed
      } else {
        console.log('[Store] Lead deleted successfully:', leadId);
      }
    } catch (error) {
      console.error('[Store] Failed to delete lead:', error);
    }
  },

  // First Week Plan actions
  updateTaskCompletion: async (taskId, completed) => {
    const state = get();
    const projectId = state.project?.id;

    if (!state.artifacts.firstWeekPlan) {
      console.error('[Store] No first week plan artifact to update');
      return;
    }

    // Optimistic update
    set((state) => ({
      artifacts: {
        ...state.artifacts,
        firstWeekPlan: state.artifacts.firstWeekPlan ? {
          ...state.artifacts.firstWeekPlan,
          taskCompletion: {
            ...(state.artifacts.firstWeekPlan.taskCompletion || {}),
            [taskId]: completed,
          },
        } : null
      }
    }));

    // Persist to API if we have a project
    if (projectId) {
      try {
        await fetch('/api/artifacts/update-task-completion', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId, taskId, completed })
        });
      } catch (error) {
        console.error('[Store] Failed to persist task completion:', error);
        // Optionally revert optimistic update here
      }
    }
  },

  // Canvas state actions
  setCanvasState: (state) => {
    console.log('[Store] setCanvasState:', state);
    set({ canvasState: state });
  },

  startTool: (toolName) => {
    console.log('[Store] startTool:', toolName);
    set((state) => {
      const newToolStatuses = new Map(state.toolStatuses);
      newToolStatuses.set(toolName, {
        name: toolName,
        displayName: TOOL_DISPLAY_NAMES[toolName] || toolName,
        status: 'running',
        startedAt: Date.now(),
      });
      return { toolStatuses: newToolStatuses };
    });
  },

  updateToolStage: (toolName, stageMessage) => {
    set((state) => {
      const newToolStatuses = new Map(state.toolStatuses);
      const tool = newToolStatuses.get(toolName);
      if (tool) {
        newToolStatuses.set(toolName, {
          ...tool,
          currentStage: stageMessage,
        });
      }
      return { toolStatuses: newToolStatuses };
    });
  },

  completeTool: (toolName, duration) => {
    console.log('[Store] completeTool:', toolName, duration);
    set((state) => {
      const newToolStatuses = new Map(state.toolStatuses);
      const tool = newToolStatuses.get(toolName);
      if (tool) {
        newToolStatuses.set(toolName, {
          ...tool,
          status: 'complete',
          completedAt: Date.now(),
          duration,
        });
      }
      return { toolStatuses: newToolStatuses };
    });
  },

  resetTools: () => {
    console.log('[Store] resetTools');
    set({ toolStatuses: new Map<string, ToolStatus>() });
  },

  failTool: (toolName, errorMessage) => {
    console.log('[Store] failTool:', toolName, errorMessage);
    set((state) => {
      const newToolStatuses = new Map(state.toolStatuses);
      const tool = newToolStatuses.get(toolName);
      if (tool) {
        newToolStatuses.set(toolName, {
          ...tool,
          status: 'error',
          errorMessage,
          completedAt: Date.now(),
        });
      }
      return { toolStatuses: newToolStatuses };
    });
  },

  retryGeneration: async (artifactType) => {
    const state = get();
    const { project, messages } = state;

    if (!project) {
      console.error('[Store] retryGeneration: No project');
      return;
    }

    const retryMessages: Record<string, string> = {
      identity: 'Please regenerate the brand identity. The previous attempt failed.',
      website: 'Please regenerate the website. The previous attempt failed.',
      leads: 'Please regenerate the leads list. The previous attempt failed.',
      outreach: 'Please regenerate the outreach scripts. The previous attempt failed.',
    };

    const retryMessage = retryMessages[artifactType];
    if (!retryMessage) {
      console.error('[Store] retryGeneration: Unknown artifact type:', artifactType);
      return;
    }

    try {
      console.log('[Store] retryGeneration:', artifactType);
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          message: retryMessage,
          conversationHistory: messages.map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      });

      if (!response.ok) {
        console.error('[Store] retryGeneration failed:', response.status);
      }
    } catch (error) {
      console.error('[Store] retryGeneration error:', error);
    }
  },

  refreshArtifact: async (type) => {
    const { project, updateArtifact, artifacts } = get();
    if (!project) {
      console.log('[Store] refreshArtifact: No project, skipping');
      return;
    }

    const currentVersion = type === 'website_code' ? (artifacts.website?.version ?? 0) : 0;
    console.log('[Store] refreshArtifact:', type, 'current version:', currentVersion);

    // Retry up to 15 times with 300ms delay (4.5 seconds total max)
    // Supabase can be slow to commit large HTML changes
    for (let attempt = 0; attempt < 15; attempt++) {
      try {
        const response = await fetch(`/api/artifacts/get?projectId=${project.id}&type=${type}`);
        if (!response.ok) {
          console.error('[Store] refreshArtifact: Failed to fetch', response.status);
          return;
        }

        const { artifact } = await response.json();
        if (artifact) {
          console.log('[Store] refreshArtifact: Got version:', artifact.version, '(current:', currentVersion, ')');

          // For website, wait for version to increment; for others, update immediately
          if (type !== 'website_code' || artifact.version > currentVersion || currentVersion === 0) {
            // Force new object reference to trigger React re-render
            const freshArtifact = JSON.parse(JSON.stringify(artifact));
            updateArtifact(type, freshArtifact);
            console.log('[Store] refreshArtifact: Updated to version:', artifact.version);
            return;
          }

          // Version not incremented yet, wait and retry
          console.log('[Store] refreshArtifact: Waiting for new version, attempt', attempt + 1);
          await new Promise(r => setTimeout(r, 300));
        } else {
          console.log('[Store] refreshArtifact: No artifact found for type:', type);
          return;
        }
      } catch (error) {
        console.error('[Store] refreshArtifact: Error', error);
        return;
      }
    }

    // After all retries, force update anyway (maybe version didn't change)
    console.log('[Store] refreshArtifact: Max retries reached, forcing update');
    try {
      const response = await fetch(`/api/artifacts/get?projectId=${project.id}&type=${type}`);
      const { artifact } = await response.json();
      if (artifact) {
        updateArtifact(type, JSON.parse(JSON.stringify(artifact)));
      }
    } catch (e) {
      console.error('[Store] refreshArtifact: Final fetch failed', e);
    }
  },

}));
