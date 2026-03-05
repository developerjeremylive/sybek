// ---------------------------------------------------------------------------
// Layout Store - Manages column layout (1, 2, or 3 columns)
// ---------------------------------------------------------------------------

import { create } from 'zustand';

export type ColumnLayout = 1 | 2 | 3;

interface LayoutState {
  columns: ColumnLayout;
  setColumns: (cols: ColumnLayout) => void;
}

export const useLayoutStore = create<LayoutState>((set) => ({
  columns: 1,
  setColumns: (cols) => set({ columns: cols }),
}));
