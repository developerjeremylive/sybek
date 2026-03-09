// ---------------------------------------------------------------------------
// Active Tools Store
// ---------------------------------------------------------------------------

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ActiveToolsState {
  activeTools: string[];
  toggleTool: (toolId: string) => void;
  setTools: (tools: string[]) => void;
  clearTools: () => void;
}

export const useActiveToolsStore = create<ActiveToolsState>()(
  persist(
    (set) => ({
      activeTools: [],
      
      toggleTool: (toolId: string) => set((state) => {
        const isActive = state.activeTools.includes(toolId);
        if (isActive) {
          return { activeTools: state.activeTools.filter(t => t !== toolId) };
        } else {
          return { activeTools: [...state.activeTools, toolId] };
        }
      }),
      
      setTools: (tools: string[]) => set({ activeTools: tools }),
      
      clearTools: () => set({ activeTools: [] }),
    }),
    {
      name: 'sybek-active-tools',
    }
  )
);
