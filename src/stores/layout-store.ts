// ---------------------------------------------------------------------------
// Layout Store - Manages column layout (1, 2, or 3 columns)
// ---------------------------------------------------------------------------

import { create } from 'zustand';

export type ColumnLayout = 1 | 2 | 3;

interface LayoutState {
  columns: ColumnLayout;
  columnWidths: number[]; // percentages [col1, col2] or [col1, col2, col3]
  setColumns: (cols: ColumnLayout) => void;
  setColumnWidths: (widths: number[]) => void;
}

export const useLayoutStore = create<LayoutState>((set) => ({
  columns: 1,
  columnWidths: [100],
  setColumns: (cols) => {
    const widths = cols === 1 ? [100] : cols === 2 ? [50, 50] : [33, 33, 34];
    set({ columns: cols, columnWidths: widths });
  },
  setColumnWidths: (widths) => set({ columnWidths: widths }),
}));
