// ---------------------------------------------------------------------------
// Skills Catalog - Pre-bundled skill contents
// ---------------------------------------------------------------------------

// This file is auto-generated during build from skills-catalog submodule
// DO NOT EDIT MANUALLY

export interface SkillContent {
  id: string;
  name: string;
  content: string;
}

// Hardcoded skill contents - extracted from skills-catalog at build time
export const CATALOG_SKILLS_CONTENT: Record<string, string> = {
  'core/git': `---
name: git
description: Git hygiene for multi-agent collaborative work. Use when performing version control operations, syncing with remote, committing changes, or ensuring work is properly shared with the team.
---

# Git Skill

This skill covers git hygiene for multi-agent collaborative work.

## Core Principle: Pull First, Always

**This is a multi-agent team environment with rapid, concurrent changes.**

Before doing ANY local work—reading files, making edits, or starting a task—you MUST sync with remote:

\`\`\`bash
git pull --rebase
\`\`\`

### Why This Matters

Multiple agents (human and AI) are working on this repository simultaneously. Without pulling first:
- You may be reading **stale files** that have already been modified
- Your edits may create **merge conflicts** with work that's already on remote
- You risk **overwriting someone else's changes**

**When in doubt, pull.** It's always safe to pull; it's never safe to assume you're current.

## Sync Cadence

| Event | Git Action |
|-------|------------|
| **FIRST thing—before any action** | \`git pull --rebase\` |
| Before starting any task | \`git pull --rebase\` |
| Before reading files for context | \`git pull --rebase\` (if not just pulled) |
| After each meaningful edit | \`git add . && git commit -m "..."\` |
| After completing a task | \`git push\` |
| Before ending any session | Full sync and push |

## Commit Message Format

\`\`\`
<type> #<issue-id>: <short description>

Types: feat, fix, docs, refactor, chore
\`\`\`

Examples:
- \`docs #12: Add RaaS pricing section to whitepaper\`
- \`fix #7: Correct diagram alignment in Stage A\``,

  'core/creating-skills': `---
name: creating-skills
description: Learn to create new skills for AI agents. Use when you need to create a new skill or modify an existing one.
---

# Creating Skills

This skill teaches how to create new agent skills.

## Overview

Skills are folders containing SKILL.md files with instructions for AI agents.

## Creating a New Skill

1. Create a folder: \`.claude/skills/<skill-name>/\`
2. Add \`SKILL.md\` with frontmatter and instructions
3. Add any scripts in \`scripts/\` folder

## SKILL.md Format

\`\`\`yaml
---
name: my-skill
description: What this skill does
---

# My Skill

Instructions for the agent...
\`\`\`

## Best Practices

- Keep descriptions concise (50-100 tokens)
- Include specific examples
- Use code blocks for commands`,

  'core/subagent': `---
name: subagent
description: Delegate complex tasks to sub-agents. Use when a task is too complex for a single agent to handle.
---

# Subagent Skill

This skill covers delegating work to sub-agents.

## Overview

When a task is complex, spawn a sub-agent to handle it.

## When to Delegate

- Multiple independent subtasks
- Research that could run in parallel
- Tasks requiring different expertise
- Large refactoring jobs

## How to Delegate

1. Break down the task into subtasks
2. Spawn a sub-agent for each subtask
3. Aggregate results

## Best Practices

- Provide clear context
- Set appropriate timeout
- Review sub-agent outputs`,

  'core/session-continuation': `---
name: session-continuation
description: Maintain context across sessions. Use to preserve important information between sessions.
---

# Session Continuation Skill

This skill covers maintaining context across sessions.

## Overview

Remember important context and persist it to memory files.

## How to Continue

1. Read MEMORY.md for context
2. Update with new learnings
3. Reference past sessions when relevant

## Memory Files

- \`MEMORY.md\` - Long-term memory
- \`memory/YYYY-MM-DD.md\` - Daily notes`,

  'core/bd': `---
name: bd
description: Task management with beads CLI. Use for tracking and managing tasks.
---

# Backlog Development (BD) Skill

This skill covers task management using beads CLI.

## Overview

Use beads to track work items and manage backlog.

## Commands

- \`bd add <task>\` - Add task
- \`bd list\` - List tasks
- \`bd done <id>\` - Complete task
- \`bd now\` - Show current task`,

  'core/task-delegation': `---
name: task-delegation
description: Delegate tasks effectively to agents or humans. Use when distributing work.
---

# Task Delegation Skill

This skill covers effective task delegation.

## Overview

Delegate tasks to maximize productivity.

## Principles

1. **Clear requirements** - Define what done looks like
2. **Provide context** - Give enough information
3. **Set expectations** - Timeline, quality standards
4. **Follow up** - Check progress appropriately`,

  'engineering/tdd': `---
name: tdd
description: Test-driven development. Write tests first, then code.
---

# Test-Driven Development (TDD) Skill

This skill covers TDD practices.

## Overview

Write tests before writing code.

## Cycle

1. **Red** - Write failing test
2. **Green** - Write minimal code to pass
3. **Refactor** - Improve code while keeping tests passing

## Benefits

- Better design
- Regression protection
- Living documentation`,

  'engineering/refactoring': `---
name: refactoring
description: Safe code restructuring. Improve code without changing behavior.
---

# Refactoring Skill

This skill covers safe refactoring.

## Overview

Improve code structure without breaking functionality.

## When to Refactor

- Code smells
- Before adding features
- On-code review feedback
- Technical debt

## Safety First

1. Ensure tests exist
2. Make small changes
3. Run tests after each change
4. Commit frequently`,

  'devops/ci-cd': `---
name: ci-cd
description: Set up and follow CI/CD pipelines. Use for continuous integration and deployment.
---

# CI/CD Skill

This skill covers CI/CD practices.

## Overview

Automate testing and deployment.

## Key Concepts

- **CI** - Automated testing on each commit
- **CD** - Automated deployment
- **Pipeline** - Sequence of automated steps

## Best Practices

- Fast feedback loops
- Automated rollback
- Feature flags
- Blue-green deployments`,

  'documentation/technical-writing': `---
name: technical-writing
description: Write clear technical documentation.
---

# Technical Writing Skill

This skill covers technical documentation.

## Overview

Write clear, concise technical docs.

## Principles

1. Know your audience
2. Use simple language
3. Include examples
4. Keep it updated

## Types

- README files
- API documentation
- Architecture Decision Records (ADRs)
- Runbooks`,
};

// Get skill content by ID
export function getSkillContent(skillId: string): string | null {
  return CATALOG_SKILLS_CONTENT[skillId] || null;
}

// Get all skill IDs
export function getAllSkillIds(): string[] {
  return Object.keys(CATALOG_SKILLS_CONTENT);
}
