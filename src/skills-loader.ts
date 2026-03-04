// ---------------------------------------------------------------------------
// Skills Content Loader - Load actual skill content from skills-catalog
// ---------------------------------------------------------------------------

// Import all SKILL.md files as raw strings
// This is done at build time by Vite

const skillsImport = import.meta.glob('/src/skills-catalog/.claude/skills/**/*.md', { as: 'raw', eager: true });

export function getSkillContentFromCatalog(skillPath: string): string | null {
  // skillPath is like ".claude/skills/core/git"
  // We need to find the corresponding SKILL.md
  
  const normalizedPath = skillPath.replace(/^\.claude\/skills\//, '').replace(/\/$/, '');
  const [category, skillName] = normalizedPath.split('/');
  
  // Try different patterns
  const patterns = [
    `/src/skills-catalog/.claude/skills/${category}/${skillName}/SKILL.md`,
    `/src/skills-catalog/.claude/skills/${category}/${skillName}/skill.md`,
    `/src/skills-catalog/.claude/skills/${category}/${skillName}/README.md`,
  ];
  
  for (const pattern of patterns) {
    const content = skillsImport[pattern];
    if (content) {
      return content;
    }
  }
  
  return null;
}

// Get list of all available skill content files
export function getAllSkillContents(): Record<string, string> {
  const result: Record<string, string> = {};
  
  for (const [path, content] of Object.entries(skillsImport)) {
    if (path.endsWith('SKILL.md') || path.endsWith('skill.md')) {
      // Extract skill ID from path
      const match = path.match(/\.claude\/skills\/([^\/]+)\/([^\/]+)/);
      if (match) {
        const skillId = `${match[1]}/${match[2]}`;
        result[skillId] = content as string;
      }
    }
  }
  
  return result;
}

// Pre-loaded skill contents
export const CATALOG_SKILL_CONTENTS = getAllSkillContents();
