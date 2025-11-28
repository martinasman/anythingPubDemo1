import { create } from 'zustand';

type ViewType = 'OVERVIEW' | 'WEBSITE';

interface ViewStore {
  currentView: ViewType;
  setView: (view: ViewType) => void;
}

export const useViewStore = create<ViewStore>((set) => ({
  currentView: 'OVERVIEW',
  setView: (view) => set({ currentView: view }),
}));
