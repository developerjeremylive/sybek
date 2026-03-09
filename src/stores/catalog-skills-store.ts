// ---------------------------------------------------------------------------
// Catalog Skills Store - Load skills from skills-catalog with file persistence
// ---------------------------------------------------------------------------

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getSkillContent, CATALOG_SKILLS_CONTENT } from '../skills-catalog-content.js';

export interface CatalogSkill {
  id: string;           // e.g., "core/git"
  name: string;        // e.g., "Git"
  description: string;  // From SKILL.md frontmatter
  category: string;    // core, engineering, devops, documentation, research
  path: string;        // Path to the skill folder in skills-catalog
  icon: string;        // Based on category
  isCustom: boolean;   // True if skill was installed from catalog
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
  { id: 'core/git', name: 'Git', description: 'Git hygiene for multi-agent collaborative work', category: 'core', path: '.claude/skills/core/git', icon: '🧠', isCustom: false },
  { id: 'core/git-hygiene', name: 'Git Hygiene', description: 'Version control best practices', category: 'core', path: '.claude/skills/core/git-hygiene', icon: '🧠', isCustom: false },
  { id: 'core/bd', name: 'Backlog', description: 'Task management with beads CLI', category: 'core', path: '.claude/skills/core/bd', icon: '🧠', isCustom: false },
  { id: 'core/subagent', name: 'Subagent', description: 'Delegate complex tasks to sub-agents', category: 'core', path: '.claude/skills/core/subagent', icon: '🧠', isCustom: false },
  { id: 'core/session-continuation', name: 'Session', description: 'Maintain context across sessions', category: 'core', path: '.claude/skills/core/session-continuation', icon: '🧠', isCustom: false },
  { id: 'core/creating-skills', name: 'Creating Skills', description: 'Learn to create new skills', category: 'core', path: '.claude/skills/core/creating-skills', icon: '🧠', isCustom: false },
  { id: 'core/task-delegation', name: 'Task Delegation', description: 'Delegate tasks effectively', category: 'core', path: '.claude/skills/core/task-delegation', icon: '🧠', isCustom: false },
  { id: 'core/technical-lead-role', name: 'Tech Lead', description: 'Orchestration and delegation patterns', category: 'core', path: '.claude/skills/core/technical-lead-role', icon: '🧠', isCustom: false },
  { id: 'core/backlog-workflow', name: 'Backlog Workflow', description: 'Manage backlog and track work', category: 'core', path: '.claude/skills/core/backlog-workflow', icon: '🧠', isCustom: false },
  { id: 'core/testing-strategy', name: 'Testing Strategy', description: 'Test-driven development', category: 'core', path: '.claude/skills/core/testing-strategy', icon: '🧠', isCustom: false },
  { id: 'core/code-review', name: 'Code Review', description: 'Code review best practices', category: 'core', path: '.claude/skills/core/code-review', icon: '🧠', isCustom: false },
  { id: 'core/documentation-writing', name: 'Documentation', description: 'Technical writing', category: 'core', path: '.claude/skills/core/documentation-writing', icon: '🧠', isCustom: false },
  
  // Engineering skills
  { id: 'engineering/refactoring', name: 'Refactoring', description: 'Safe code restructuring', category: 'engineering', path: '.claude/skills/engineering/refactoring', icon: '⚙️', isCustom: false },
  { id: 'engineering/tdd', name: 'TDD', description: 'Test-driven development', category: 'engineering', path: '.claude/skills/engineering/tdd', icon: '⚙️', isCustom: false },
  { id: 'engineering/performance-optimization', name: 'Performance', description: 'Performance optimization', category: 'engineering', path: '.claude/skills/engineering/performance-optimization', icon: '⚙️', isCustom: false },
  { id: 'engineering/architecture-review', name: 'Architecture', description: 'Architecture review', category: 'engineering', path: '.claude/skills/engineering/architecture-review', icon: '⚙️', isCustom: false },
  
  // DevOps skills
  { id: 'devops/ci-cd', name: 'CI/CD', description: 'Set up CI/CD pipelines', category: 'devops', path: '.claude/skills/devops/ci-cd', icon: '🚀', isCustom: false },
  { id: 'devops/deployment', name: 'Deployment', description: 'Deployment automation', category: 'devops', path: '.claude/skills/devops/deployment', icon: '🚀', isCustom: false },
  { id: 'devops/infrastructure', name: 'Infrastructure', description: 'Infrastructure as code', category: 'devops', path: '.claude/skills/devops/infrastructure', icon: '🚀', isCustom: false },
  { id: 'devops/monitoring', name: 'Monitoring', description: 'Monitoring and observability', category: 'devops', path: '.claude/skills/devops/monitoring', icon: '🚀', isCustom: false },
  
  // Documentation skills
  { id: 'documentation/technical-writing', name: 'Tech Writing', description: 'Technical documentation', category: 'documentation', path: '.claude/skills/documentation/technical-writing', icon: '📝', isCustom: false },
  { id: 'documentation/adr', name: 'ADR', description: 'Architecture Decision Records', category: 'documentation', path: '.claude/skills/documentation/adr', icon: '📝', isCustom: false },
  { id: 'documentation/api-documentation', name: 'API Docs', description: 'API documentation', category: 'documentation', path: '.claude/skills/documentation/api-documentation', icon: '📝', isCustom: false },
  
  // Research skills
  { id: 'research/technical-research', name: 'Tech Research', description: 'Technical research', category: 'research', path: '.claude/skills/research/technical-research', icon: '🔬', isCustom: false },
  { id: 'research/evaluation', name: 'Evaluation', description: 'Evaluation frameworks', category: 'research', path: '.claude/skills/research/evaluation', icon: '🔬', isCustom: false },
  { id: 'research/proof-of-concept', name: 'PoC', description: 'Proof of concept', category: 'research', path: '.claude/skills/research/proof-of-concept', icon: '🔬', isCustom: false },
];

// Skills folder in the workspace
const SKILLS_FOLDER = 'skills';

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
  saveSkillContent: (skillId: string, content: string) => Promise<void>;
  getSkillFilePath: (skillId: string) => string;
  isSkillInstalled: (skillId: string) => boolean;
  isSkillActive: (skillId: string) => boolean;
  getAllActiveSkillContents: () => Promise<string[]>;
}

export const useCatalogSkillsStore = create<CatalogSkillsState>()(
  persist(
    (set, get) => ({
      catalogSkills: DEFAULT_CATALOG_SKILLS,
      installedSkills: [],
      activeSkills: [],

      // Install skill - creates the SKILL.md file in the workspace from catalog
      installSkill: async (skillId: string) => {
        const skill = get().catalogSkills.find(s => s.id === skillId);
        if (!skill || get().installedSkills.includes(skillId)) return;
        
        const filePath = get().getSkillFilePath(skillId);
        
        // Get actual content from pre-bundled catalog
        let skillContent = getSkillContent(skillId);
        
        // If not found in catalog, use placeholder
        if (!skillContent) {
          skillContent = `---
name: ${skill.name}
description: ${skill.description}
---

# ${skill.name}

${skill.description}

## Overview

This skill was installed from the skills-catalog.

## Usage

Follow the instructions in this file when performing tasks related to ${skill.name}.

## Notes

- Category: ${skill.category}
- Original path: ${skill.path}
`;
        }

        try {
          const { writeGroupFile } = await import('../storage.js');
          // Use DEFAULT_GROUP_ID from config
          const { DEFAULT_GROUP_ID } = await import('../config.js');
          await writeGroupFile(DEFAULT_GROUP_ID, filePath, skillContent);
          
          // Only update state if file was created successfully
          set((state) => {
            if (state.installedSkills.includes(skillId)) return state;
            return { installedSkills: [...state.installedSkills, skillId] };
          });
        } catch (e) {
          console.error('Failed to install skill:', e);
          throw e;
        }
      },

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

      // Get file path for a skill's SKILL.md
      getSkillFilePath: (skillId: string) => {
        return `${SKILLS_FOLDER}/${skillId.replace(/\//g, '-')}/SKILL.md`;
      },

      // Check if skill is installed
      isSkillInstalled: (skillId: string) => {
        return get().installedSkills.includes(skillId);
      },

      // Check if skill is active
      isSkillActive: (skillId: string) => {
        return get().activeSkills.includes(skillId);
      },

      // Get content of an installed skill
      // Priority: 1) Custom saved skill in skills/ folder, 2) Default catalog content
      getSkillContent: async (skillId: string) => {
        const skill = get().catalogSkills.find(s => s.id === skillId);
        if (!skill) return '';
        
        const filePath = get().getSkillFilePath(skillId);
        
        try {
          // Try to read from storage (custom version)
          const { readGroupFile } = await import('../storage.js');
          const { DEFAULT_GROUP_ID } = await import('../config.js');
          const content = await readGroupFile(DEFAULT_GROUP_ID, filePath);
          return content;
        } catch {
          // Return default content based on skill metadata
          return `# ${skill.name}\n\n---\nname: ${skill.id}\ndescription: ${skill.description}\n---\n\n${skill.description}\n\n(Skill installed from catalog - ${skill.category})`;
        }
      },

      // Save custom skill content to file
      saveSkillContent: async (skillId: string, content: string) => {
        const filePath = get().getSkillFilePath(skillId);
        
        try {
          const { writeGroupFile } = await import('../storage.js');
          const { DEFAULT_GROUP_ID } = await import('../config.js');
          await writeGroupFile(DEFAULT_GROUP_ID, filePath, content);
        } catch (e) {
          console.error('Failed to save skill content:', e);
          throw e;
        }
      },

      // Get contents of all active skills for system prompt
      getAllActiveSkillContents: async () => {
        const state = get();
        const contents: string[] = [];
        
        for (const skillId of state.activeSkills) {
          const content = await get().getSkillContent(skillId);
          if (content) {
            contents.push(content);
          }
        }
        
        return contents;
      },
    }),
    {
      name: 'sybek-catalog-skills',
    }
  )
);

// Skill descriptions for system prompt (Agent Skills protocol format)
export const SKILL_DESCRIPTIONS: Record<string, string> = {
  'core/git': 'Git - Follow git hygiene: pull before any work, commit often, sync before ending session',
  'core/git-hygiene': 'Git Hygiene - Version control best practices for multi-agent work',
  'core/bd': 'Backlog - Use beads CLI for task management',
  'core/subagent': 'Subagent - Delegate complex tasks to sub-agents when appropriate',
  'core/session-continuation': 'Session - Maintain context across sessions using memory files',
  'core/creating-skills': 'Creating Skills - Can create new skills when needed',
  'core/task-delegation': 'Task Delegation - Delegate tasks effectively to agents or humans',
  'core/technical-lead-role': 'Tech Lead - Follow orchestration and delegation patterns',
  'core/backlog-workflow': 'Backlog Workflow - Manage backlog and track work systematically',
  'core/testing-strategy': 'Testing Strategy - Follow TDD and testing best practices',
  'core/code-review': 'Code Review - Perform thorough code reviews',
  'core/documentation-writing': 'Documentation Writing - Write excellent technical documentation',
  
  'engineering/refactoring': 'Refactoring - Follow safe code restructuring patterns',
  'engineering/tdd': 'TDD - Test-driven development: write tests first, then code',
  'engineering/performance-optimization': 'Performance - Optimize for performance when needed',
  'engineering/architecture-review': 'Architecture - Follow architecture review patterns',
  
  'devops/ci-cd': 'CI/CD - Set up and follow CI/CD pipelines',
  'devops/deployment': 'Deployment - Follow deployment automation practices',
  'devops/infrastructure': 'Infrastructure - Infrastructure as code practices',
  'devops/monitoring': 'Monitoring - Follow monitoring and observability practices',
  
  'documentation/technical-writing': 'Technical Writing - Write clear technical documentation',
  'documentation/adr': 'ADR - Use Architecture Decision Records',
  'documentation/api-documentation': 'API Documentation - Document APIs properly',
  
  'research/technical-research': 'Technical Research - Conduct systematic technical research',
  'research/evaluation': 'Evaluation - Use proper evaluation frameworks',
  'research/proof-of-concept': 'Proof of Concept - Follow PoC methodology',
};

// Get skill descriptions for system prompt
export function getSkillDescriptions(skillIds: string[]): string[] {
  return skillIds.map(id => SKILL_DESCRIPTIONS[id]).filter(Boolean);
}
