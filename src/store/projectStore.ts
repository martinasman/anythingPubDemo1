import { create } from 'zustand';
import type {
  Project,
  Message,
  Artifact,
  ArtifactType,
  WebsiteArtifact,
  IdentityArtifact,
  ResearchArtifact,
  BusinessPlanArtifact,
  LeadsArtifact,
  OutreachArtifact,
  Lead,
  LeadActivity,
} from '@/types/database';

// ============================================
// STATE INTERFACE
// ============================================

type ToolType = 'research' | 'identity' | 'website' | 'businessplan' | 'leads' | 'outreach';
type EditorMode = 'bento' | 'website' | 'leads' | 'outreach';
type ContextView = 'overview' | 'identity' | 'offer' | 'funnel' | 'leads' | 'legal';
export type WorkspaceView = 'HOME' | 'BRAND' | 'CRM' | 'SITE' | 'FINANCE';

interface ProjectState {
  // Core Data
  project: Project | null;
  messages: Message[];
  artifacts: {
    website: WebsiteArtifact | null;
    identity: IdentityArtifact | null;
    research: ResearchArtifact | null;
    businessPlan: BusinessPlanArtifact | null;
    leads: LeadsArtifact | null;
    outreach: OutreachArtifact | null;
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
  hasSeenOnboarding: boolean;

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
  setHasSeenOnboarding: (seen: boolean) => void;
  clearProject: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Lead management actions
  updateLeadStatus: (leadId: string, status: Lead['status']) => Promise<void>;
  addLeadActivity: (activity: Omit<LeadActivity, 'id' | 'createdAt'>) => Promise<void>;
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
    businessPlan: null,
    leads: null,
    outreach: null,
  },
  selectedModelId: 'anthropic/claude-3.5-sonnet',
  isLoading: false,
  error: null,
  runningTools: new Set<ToolType>(),
  editorMode: 'bento' as EditorMode,
  hasStartedGeneration: false,
  contextView: 'overview' as ContextView,
  workspaceView: 'HOME' as WorkspaceView,
  hasSeenOnboarding: typeof window !== 'undefined' ? localStorage.getItem('hasSeenOnboarding') === 'true' : false,

  // Actions
  setInitialData: (project, messages, rawArtifacts) => {
    console.log('[Store] setInitialData called with', rawArtifacts.length, 'artifacts');
    const artifacts = {
      website: null as WebsiteArtifact | null,
      identity: null as IdentityArtifact | null,
      research: null as ResearchArtifact | null,
      businessPlan: null as BusinessPlanArtifact | null,
      leads: null as LeadsArtifact | null,
      outreach: null as OutreachArtifact | null,
    };

    // Parse raw artifacts into typed state
    rawArtifacts.forEach((artifact) => {
      console.log('[Store] Processing artifact:', artifact.type);
      if (artifact.type === 'website_code') {
        artifacts.website = artifact.data as WebsiteArtifact;
        console.log('[Store] Loaded website artifact');
      } else if (artifact.type === 'identity') {
        artifacts.identity = artifact.data as IdentityArtifact;
        console.log('[Store] Loaded identity artifact');
      } else if (artifact.type === 'market_research') {
        artifacts.research = artifact.data as ResearchArtifact;
        console.log('[Store] Loaded research artifact');
      } else if (artifact.type === 'business_plan') {
        artifacts.businessPlan = artifact.data as BusinessPlanArtifact;
        console.log('[Store] Loaded business plan artifact');
      } else if (artifact.type === 'leads') {
        artifacts.leads = artifact.data as LeadsArtifact;
        console.log('[Store] Loaded leads artifact');
      } else if (artifact.type === 'outreach') {
        artifacts.outreach = artifact.data as OutreachArtifact;
        console.log('[Store] Loaded outreach artifact');
      }
    });

    console.log('[Store] Final artifacts:', artifacts);

    // Determine if generation has started (any artifacts exist or messages beyond initial)
    const hasAnyArtifacts = rawArtifacts.length > 0;
    const hasUserMessages = messages.some(m => m.role === 'user');

    set({
      project,
      messages,
      artifacts,
      selectedModelId: project.model_id || 'deepseek/deepseek-r1',
      isLoading: false,
      error: null,
      hasStartedGeneration: hasAnyArtifacts || hasUserMessages,
    });
  },

  addMessage: (message) => {
    set((state) => ({
      messages: [...state.messages, message],
    }));
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

    set((state) => {
      const newArtifacts = { ...state.artifacts };

      if (type === 'website_code') {
        console.log('[Store] Updating website artifact');
        newArtifacts.website = artifact.data as WebsiteArtifact;
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
      } else if (type === 'business_plan') {
        console.log('[Store] Updating business plan artifact');
        newArtifacts.businessPlan = artifact.data as BusinessPlanArtifact;
      } else if (type === 'leads') {
        console.log('[Store] Updating leads artifact');
        newArtifacts.leads = artifact.data as LeadsArtifact;
      } else if (type === 'outreach') {
        console.log('[Store] Updating outreach artifact');
        newArtifacts.outreach = artifact.data as OutreachArtifact;
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

  setHasSeenOnboarding: (seen) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('hasSeenOnboarding', seen.toString());
    }
    set({ hasSeenOnboarding: seen });
  },

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
        businessPlan: null,
        leads: null,
        outreach: null,
      },
      selectedModelId: 'anthropic/claude-3.5-sonnet',
      isLoading: false,
      error: null,
      runningTools: new Set<ToolType>(),
      editorMode: 'bento' as EditorMode,
      hasStartedGeneration: false,
      contextView: 'overview' as ContextView,
      workspaceView: 'HOME' as WorkspaceView,
    });
  },

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  // Lead management actions
  updateLeadStatus: async (leadId, status) => {
    const state = get();
    const projectId = state.project?.id;

    if (!state.artifacts.leads) {
      console.error('[Store] No leads artifact to update');
      return;
    }

    // Find the lead and get previous status for activity log
    const lead = state.artifacts.leads.leads.find(l => l.id === leadId);
    const previousStatus = lead?.status;

    // Optimistic update
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

    // Persist to API if we have a project
    if (projectId) {
      try {
        await fetch('/api/leads/status', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId, leadId, status })
        });

        // Log status change activity
        if (previousStatus && previousStatus !== status) {
          await get().addLeadActivity({
            leadId,
            type: 'status_changed',
            content: `Status changed from ${previousStatus} to ${status}`,
            metadata: { previousStatus, newStatus: status }
          });
        }
      } catch (error) {
        console.error('[Store] Failed to persist lead status:', error);
        // Optionally revert optimistic update here
      }
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
}));
