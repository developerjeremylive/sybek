// ---------------------------------------------------------------------------
// Catalog Skills Store - Load skills from skills-catalog submodule
// ---------------------------------------------------------------------------

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CatalogSkill {
  id: string;           // e.g., "core/git"
  name: string;         // e.g., "Git"
  description: string;  // From SKILL.md frontmatter
  category: string;     // core, engineering, devops, documentation, research
  path: string;        // Path to the skill folder
  icon: string;        // Based on category
}

// Category icons
const CATEGORY_ICONS: Record<string, string> = {
  core: '🧠',
  engineering: '⚙️',
  devops: '🚀',
  documentation: '📝',
  research: '🔬',
};

// Default skills from the catalog (will be loaded dynamically)
const DEFAULT_CATALOG_SKILLS: CatalogSkill[] = [
  // Core skills
  { id: 'core/git', name: 'Git', description: 'Git hygiene for multi-agent collaborative work', category: 'core', path: '.claude/skills/core/git', icon: '🧠' },
  { id: 'core/git-hygiene', name: 'Git Hygiene', description: 'Version control best practices', category: 'core', path: '.claude/skills/core/git-hygiene', icon: '🧠' },
  { id: 'core/bd', name: 'Backlog', description: 'Task management with beads CLI', category: 'core', path: '.claude/skills/core/bd', icon: '🧠' },
  { id: 'core/subagent', name: 'Subagent', description: 'Delegate complex tasks to sub-agents', category: 'core', path: '.claude/skills/core/subagent', icon: '🧠' },
  { id: 'core/session-continuation', name: 'Session', description: 'Maintain context across sessions', category: 'core', path: '.claude/skills/core/session-continuation', icon: '🧠' },
  { id: 'core/creating-skills', name: 'Creating Skills', description: 'Learn to create new skills', category: 'core', path: '.claude/skills/core/creating-skills', icon: '🧠' },
  { id: 'core/task-delegation', name: 'Task Delegation', description: 'Delegate tasks effectively', category: 'core', path: '.claude/skills/core/task-delegation', icon: '🧠' },
  { id: 'core/technical-lead-role', name: 'Tech Lead', description: 'Orchestration and delegation patterns', category: 'core', path: '.claude/skills/core/technical-lead-role', icon: '🧠' },
  { id: 'core/backlog-workflow', name: 'Backlog Workflow', description: 'Manage backlog and track work', category: 'core', path: '.claude/skills/core/backlog-workflow', icon: '🧠' },
  { id: 'core/testing-strategy', name: 'Testing Strategy', description: 'Test-driven development', category: 'core', path: '.claude/skills/core/testing-strategy', icon: '🧠' },
  { id: 'core/code-review', name: 'Code Review', description: 'Code review best practices', category: 'core', path: '.claude/skills/core/code-review', icon: '🧠' },
  { id: 'core/documentation-writing', name: 'Documentation', description: 'Technical writing', category: 'core', path: '.claude/skills/core/documentation-writing', icon: '🧠' },
  
  // Engineering skills
  { id: 'engineering/refactoring', name: 'Refactoring', description: 'Safe code restructuring', category: 'engineering', path: '.claude/skills/engineering/refactoring', icon: '⚙️' },
  { id: 'engineering/tdd', name: 'TDD', description: 'Test-driven development', category: 'engineering', path: '.claude/skills/engineering/tdd', icon: '⚙️' },
  { id: 'engineering/performance-optimization', name: 'Performance', description: 'Performance optimization', category: 'engineering', path: '.claude/skills/engineering/performance-optimization', icon: '⚙️' },
  { id: 'engineering/architecture-review', name: 'Architecture', description: 'Architecture review', category: 'engineering', path: '.claude/skills/engineering/architecture-review', icon: '⚙️' },
  
  // DevOps skills
  { id: 'devops/ci-cd', name: 'CI/CD', description: 'Set up CI/CD pipelines', category: 'devops', path: '.claude/skills/devops/ci-cd', icon: '🚀' },
  { id: 'devops/deployment', name: 'Deployment', description: 'Deployment automation', category: 'devops', path: '.claude/skills/devops/deployment', icon: '🚀' },
  { id: 'devops/infrastructure', name: 'Infrastructure', description: 'Infrastructure as code', category: 'devops', path: '.claude/skills/devops/infrastructure', icon: '🚀' },
  { id: 'devops/monitoring', name: 'Monitoring', description: 'Monitoring and observability', category: 'devops', path: '.claude/skills/devops/monitoring', icon: '🚀' },
  
  // Documentation skills
  { id: 'documentation/technical-writing', name: 'Tech Writing', description: 'Technical documentation', category: 'documentation', path: '.claude/skills/documentation/technical-writing', icon: '📝' },
  { id: 'documentation/adr', name: 'ADR', description: 'Architecture Decision Records', category: 'documentation', path: '.claude/skills/documentation/adr', icon: '📝' },
  { id: 'documentation/api-documentation', name: 'API Docs', description: 'API documentation', category: 'documentation', path: '.claude/skills/documentation/api-documentation', icon: '📝' },
  
  // Research skills
  { id: 'research/technical-research', name: 'Tech Research', description: 'Technical research', category: 'research', path: '.claude/skills/research/technical-research', icon: '🔬' },
  { id: 'research/evaluation', name: 'Evaluation', description: 'Evaluation frameworks', category: 'research', path: '.claude/skills/research/evaluation', icon: '🔬' },
  { id: 'research/proof-of-concept', name: 'PoC', description: 'Proof of concept', category: 'research', path: '.claude/skills/research/proof-of-concept', icon: '🔬' },
];

interface CatalogSkillsState {
  catalogSkills: CatalogSkill[];
  installedSkills: string[];  // Array of skill IDs
  activeSkills: string[];     // Array of skill IDs
  
  // Actions
  installSkill: (skillId: string) => void;
  uninstallSkill: (skillId: string) => void;
  activateSkill: (skillId: string) => void;
  deactivateSkill: (skillId: string) => void;
  getActiveSkills: () => CatalogSkill[];
  getSkillContent: (skillId: string) => Promise<string>;
}

export const useCatalogSkillsStore = create<CatalogSkillsState>()(
  persist(
    (set, get) => ({
      catalogSkills: DEFAULT_CATALOG_SKILLS,
      installedSkills: [],
      activeSkills: [],

      installSkill: (skillId: string) => set((state) => {
        if (state.installedSkills.includes(skillId)) return state;
        return { installedSkills: [...state.installedSkills, skillId] };
      }),

      uninstallSkill: (skillId: string) => set((state) => ({
        installedSkills: state.installedSkills.filter(id => id !== skillId),
        activeSkills: state.activeSkills.filter(id => id !== skillId),
      })),

      activateSkill: (skillId: string) => set((state) => {
        if (!state.installedSkills.includes(skillId)) return state;
        if (state.activeSkills.includes(skillId)) return state;
        return { activeSkills: [...state.activeSkills, skillId] };
      }),

      deactivateSkill: (skillId: string) => set((state) => ({
        activeSkills: state.activeSkills.filter(id => id !== skillId),
      })),

      getActiveSkills: () => {
        const state = get();
        return state.catalogSkills.filter(s => state.activeSkills.includes(s.id));
      },

      getSkillContent: async (skillId: string) => {
        const skill = get().catalogSkills.find(s => s.id === skillId);
        if (!skill) return '';
        // In a real app, this would fetch the SKILL.md file
        // For now, return a placeholder
        return `# ${skill.name}\n\n${skill.description}\n\n(Skill content would be loaded from ${skill.path}/SKILL.md)`;
      },
    }),
    {
      name: 'sybek-catalog-skills',
    }
  )
);
