// ---------------------------------------------------------------------------
// Skill to Tool Mapping - For catalog skills
// ---------------------------------------------------------------------------

// Maps catalog skill IDs to tool names or instructions
export const SKILL_TOOL_MAP: Record<string, string> = {
  // Core skills - these don't map to specific tools, they add context
  'core/git': 'git',
  'core/git-hygiene': 'git',
  'core/bd': 'backlog',
  'core/subagent': 'subagent',
  'core/session-continuation': 'session',
  'core/creating-skills': 'skills',
  'core/task-delegation': 'delegation',
  'core/technical-lead-role': 'leadership',
  'core/backlog-workflow': 'backlog',
  'core/testing-strategy': 'testing',
  'core/code-review': 'review',
  'core/documentation-writing': 'docs',
  
  // Engineering skills
  'engineering/refactoring': 'refactoring',
  'engineering/tdd': 'tdd',
  'engineering/performance-optimization': 'performance',
  'engineering/architecture-review': 'architecture',
  
  // DevOps skills
  'devops/ci-cd': 'cicd',
  'devops/deployment': 'deployment',
  'devops/infrastructure': 'infrastructure',
  'devops/monitoring': 'monitoring',
  
  // Documentation skills
  'documentation/technical-writing': 'docs',
  'documentation/adr': 'adr',
  'documentation/api-documentation': 'api-docs',
  
  // Research skills
  'research/technical-research': 'research',
  'research/evaluation': 'evaluation',
  'research/proof-of-concept': 'poc',
};

// Skill descriptions for system prompt
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

// Get skill instruction key
export function getSkillInstruction(skillId: string): string {
  return SKILL_TOOL_MAP[skillId] || '';
}

// Get skill description for system prompt
export function getSkillDescription(skillId: string): string {
  return SKILL_DESCRIPTIONS[skillId] || '';
}

// Get descriptions for multiple skills
export function getSkillDescriptions(skillIds: string[]): string[] {
  return skillIds.map(id => getSkillDescription(id)).filter(Boolean);
}
