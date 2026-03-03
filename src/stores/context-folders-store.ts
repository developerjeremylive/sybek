// ---------------------------------------------------------------------------
// Context Folders Store - manages folders selected for chat context
// ---------------------------------------------------------------------------

import { create } from 'zustand';

interface ContextFoldersState {
  contextFolders: string[];
  currentSessionFolder: string;
  setContextFolders: (folders: string[]) => void;
  addContextFolder: (folder: string) => void;
  removeContextFolder: (folder: string) => void;
  setCurrentSessionFolder: (folder: string) => void;
  loadFromStorage: () => void;
}

export const useContextFoldersStore = create<ContextFoldersState>((set) => ({
  contextFolders: [],
  currentSessionFolder: '',
  
  setContextFolders: (folders) => {
    set({ contextFolders: folders });
    localStorage.setItem('contextFolders', JSON.stringify(folders));
  },
  
  addContextFolder: (folder) => {
    set((state) => {
      const newFolders = state.contextFolders.includes(folder)
        ? state.contextFolders
        : [...state.contextFolders, folder];
      localStorage.setItem('contextFolders', JSON.stringify(newFolders));
      return { contextFolders: newFolders };
    });
  },
  
  removeContextFolder: (folder) => {
    set((state) => {
      const newFolders = state.contextFolders.filter(f => f !== folder);
      localStorage.setItem('contextFolders', JSON.stringify(newFolders));
      return { contextFolders: newFolders };
    });
  },
  
  setCurrentSessionFolder: (folder) => {
    set({ currentSessionFolder: folder });
    localStorage.setItem('currentSessionFolder', folder);
  },
  
  loadFromStorage: () => {
    try {
      const savedFolders = localStorage.getItem('contextFolders');
      const savedSession = localStorage.getItem('currentSessionFolder');
      
      set({
        contextFolders: savedFolders ? JSON.parse(savedFolders) : [],
        currentSessionFolder: savedSession || '',
      });
    } catch {
      set({ contextFolders: [], currentSessionFolder: '' });
    }
  },
}));
