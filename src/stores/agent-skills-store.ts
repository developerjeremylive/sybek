// ---------------------------------------------------------------------------
// Agent Skills Store
// ---------------------------------------------------------------------------

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AgentSkill {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'search' | 'data' | 'productivity' | 'fun' | 'utilities';
  requiresApiKey: boolean;
  apiKeyConfig?: {
    key: string;
    placeholder: string;
    url?: string;
  };
  // Installed state
  installed: boolean;
  configured: boolean;
  apiKey?: string;
  active: boolean;
}

// Default available skills
const DEFAULT_SKILLS: AgentSkill[] = [
  // Search & Research
  {
    id: 'brave_search',
    name: 'Brave Search',
    description: 'Web search using Brave Search API',
    icon: '🔍',
    category: 'search',
    requiresApiKey: true,
    apiKeyConfig: {
      key: 'brave_api_key',
      placeholder: 'Your Brave Search API Key',
      url: 'https://brave.com/search/api/',
    },
    installed: false,
    configured: false,
    active: false,
  },
  {
    id: 'ddg_search',
    name: 'DuckDuckGo',
    description: 'Web search using DuckDuckGo (no API key needed) - Uses duckduckgo tool',
    icon: '🦆',
    category: 'search',
    requiresApiKey: false,
    installed: false,
    configured: true,
    active: false,
  },
  {
    id: 'wikipedia',
    name: 'Wikipedia',
    description: 'Search and get Wikipedia articles',
    icon: '📚',
    category: 'search',
    requiresApiKey: false,
    installed: false,
    configured: true,
    active: false,
  },
  // Data & Info
  {
    id: 'weather',
    name: 'Weather',
    description: 'Get weather information for any city',
    icon: '🌤️',
    category: 'data',
    requiresApiKey: false,
    installed: false,
    configured: true,
    active: false,
  },
  {
    id: 'newsapi',
    name: 'News API',
    description: 'Get latest news headlines',
    icon: '📰',
    category: 'data',
    requiresApiKey: true,
    apiKeyConfig: {
      key: 'newsapi_key',
      placeholder: 'Your NewsAPI Key',
      url: 'https://newsapi.org/',
    },
    installed: false,
    configured: false,
    active: false,
  },
  // Productivity
  {
    id: 'notion',
    name: 'Notion',
    description: 'Interact with Notion workspaces',
    icon: '📝',
    category: 'productivity',
    requiresApiKey: true,
    apiKeyConfig: {
      key: 'notion_key',
      placeholder: 'Your Notion API Key',
      url: 'https://notion.so/my-integrations',
    },
    installed: false,
    configured: false,
    active: false,
  },
  {
    id: 'github',
    name: 'GitHub',
    description: 'Search repositories, issues, and PRs',
    icon: '🐙',
    category: 'productivity',
    requiresApiKey: true,
    apiKeyConfig: {
      key: 'github_token',
      placeholder: 'Your GitHub Token',
      url: 'https://github.com/settings/tokens',
    },
    installed: false,
    configured: false,
    active: false,
  },
  // Fun
  {
    id: 'joke',
    name: 'Random Joke',
    description: 'Get random jokes',
    icon: '😄',
    category: 'fun',
    requiresApiKey: false,
    installed: false,
    configured: true,
    active: false,
  },
  {
    id: 'cat_fact',
    name: 'Cat Facts',
    description: 'Random cat facts',
    icon: '🐱',
    category: 'fun',
    requiresApiKey: false,
    installed: false,
    configured: true,
    active: false,
  },
  {
    id: 'meme',
    name: 'Meme Generator',
    description: 'Generate random memes',
    icon: '🎨',
    category: 'fun',
    requiresApiKey: false,
    installed: false,
    configured: true,
    active: false,
  },
  // Utilities
  {
    id: 'currency',
    name: 'Currency Converter',
    description: 'Convert between currencies',
    icon: '💱',
    category: 'utilities',
    requiresApiKey: false,
    installed: false,
    configured: true,
    active: false,
  },
  {
    id: 'translate',
    name: 'Translator',
    description: 'Translate text between languages',
    icon: '🌍',
    category: 'utilities',
    requiresApiKey: true,
    apiKeyConfig: {
      key: 'libretranslate_url',
      placeholder: 'LibreTranslate URL (optional, uses default if empty)',
    },
    installed: false,
    configured: false,
    active: false,
  },
  {
    id: 'email',
    name: 'Email Send',
    description: 'Send emails via SMTP',
    icon: '📧',
    category: 'utilities',
    requiresApiKey: true,
    apiKeyConfig: {
      key: 'smtp_config',
      placeholder: 'SMTP configuration (JSON)',
    },
    installed: false,
    configured: false,
    active: false,
  },
];

interface AgentSkillsState {
  skills: AgentSkill[];
  installedSkills: AgentSkill[];
  activeSkills: string[];
  
  // Actions
  installSkill: (skillId: string) => void;
  uninstallSkill: (skillId: string) => void;
  configureSkill: (skillId: string, apiKey: string) => void;
  activateSkill: (skillId: string) => void;
  deactivateSkill: (skillId: string) => void;
  testConnection: (skillId: string) => Promise<{ success: boolean; message: string }>;
  getActiveSkills: () => AgentSkill[];
}

export const useAgentSkillsStore = create<AgentSkillsState>()(
  persist(
    (set, get) => ({
      skills: DEFAULT_SKILLS,
      installedSkills: [],
      activeSkills: [],

      installSkill: (skillId: string) => set((state) => {
        const skill = state.skills.find(s => s.id === skillId);
        if (!skill) return state;
        
        const updatedSkill = { 
          ...skill, 
          installed: true,
          configured: !skill.requiresApiKey 
        };
        
        return {
          skills: state.skills.map(s => s.id === skillId ? updatedSkill : s),
          installedSkills: [...state.installedSkills, updatedSkill],
        };
      }),

      uninstallSkill: (skillId: string) => set((state) => {
        const skill = state.skills.find(s => s.id === skillId);
        if (!skill) return state;
        
        const updatedSkill = { 
          ...skill, 
          installed: false,
          configured: false,
          active: false,
          apiKey: undefined,
        };
        
        return {
          skills: state.skills.map(s => s.id === skillId ? updatedSkill : s),
          installedSkills: state.installedSkills.filter(s => s.id !== skillId),
          activeSkills: state.activeSkills.filter(id => id !== skillId),
        };
      }),

      configureSkill: (skillId: string, apiKey: string) => set((state) => {
        const updatedSkill = { 
          ...state.skills.find(s => s.id === skillId)!,
          configured: true,
          apiKey,
        };
        
        return {
          skills: state.skills.map(s => s.id === skillId ? updatedSkill : s),
          installedSkills: state.installedSkills.map(s => s.id === skillId ? updatedSkill : s),
        };
      }),

      activateSkill: (skillId: string) => set((state) => {
        const skill = state.skills.find(s => s.id === skillId);
        if (!skill || !skill.installed || !skill.configured) return state;
        
        const updatedSkill = { ...skill, active: true };
        
        return {
          skills: state.skills.map(s => s.id === skillId ? updatedSkill : s),
          installedSkills: state.installedSkills.map(s => s.id === skillId ? updatedSkill : s),
          activeSkills: [...state.activeSkills, skillId],
        };
      }),

      deactivateSkill: (skillId: string) => set((state) => {
        const skill = state.skills.find(s => s.id === skillId);
        if (!skill) return state;
        
        const updatedSkill = { ...skill, active: false };
        
        return {
          skills: state.skills.map(s => s.id === skillId ? updatedSkill : s),
          installedSkills: state.installedSkills.map(s => s.id === skillId ? updatedSkill : s),
          activeSkills: state.activeSkills.filter(id => id !== skillId),
        };
      }),

      testConnection: async (skillId: string) => {
        const skill = get().skills.find(s => s.id === skillId);
        if (!skill) return { success: false, message: 'Skill not found' };
        
        // For now, simulate test based on configuration
        if (skill.requiresApiKey && !skill.apiKey) {
          return { success: false, message: 'API key required' };
        }
        
        // Simulate success for non-API key skills
        return { success: true, message: 'Connection successful!' };
      },

      getActiveSkills: () => {
        const state = get();
        return state.skills.filter(s => s.active);
      },
    }),
    {
      name: 'sybek-agent-skills',
    }
  )
);
