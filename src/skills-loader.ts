// ---------------------------------------------------------------------------
// Skills Content Loader - Load actual skill content from skills-catalog
// ---------------------------------------------------------------------------

// Import all SKILL.md files as raw strings (optional - may not exist)
let skillsImport: Record<string, string> = {};
try {
  skillsImport = import.meta.glob('./skills-catalog/.claude/skills/**/*.md', { as: 'raw', eager: true });
  console.log('[SkillsLoader] Imported skill files:', Object.keys(skillsImport));
} catch (e) {
  console.log('[SkillsLoader] No skills-catalog found, skipping');
}

export function getSkillContentFromCatalog(skillPath: string): string | null {
  // skillPath is like ".claude/skills/core/git"
  // We need to find the corresponding SKILL.md
  
  const normalizedPath = skillPath.replace(/^\.claude\/skills\//, '').replace(/\/$/, '');
  const [category, skillName] = normalizedPath.split('/');
  
  // Try different patterns
  const patterns = [
    `./skills-catalog/.claude/skills/${category}/${skillName}/SKILL.md`,
    `./skills-catalog/.claude/skills/${category}/${skillName}/skill.md`,
    `./skills-catalog/.claude/skills/${category}/${skillName}/README.md`,
    `../skills-catalog/.claude/skills/${category}/${skillName}/SKILL.md`,
    `/src/skills-catalog/.claude/skills/${category}/${skillName}/SKILL.md`,
  ];
  
  for (const pattern of patterns) {
    const content = skillsImport[pattern];
    if (content) {
      console.log('[SkillsLoader] Found skill:', pattern);
      return content as string;
    }
  }
  
  console.log('[SkillsLoader] NOT found for:', skillPath, 'tried patterns:', patterns);
  return null;
}

// Get list of all available skill content files
export function getAllSkillContents(): Record<string, string> {
  const result: Record<string, string> = {};
  
  for (const [path, content] of Object.entries(skillsImport)) {
    if (path.toLowerCase().includes('skill') || path.toLowerCase().includes('readme')) {
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
console.log('[SkillsLoader] CATALOG_SKILL_CONTENTS:', Object.keys(CATALOG_SKILL_CONTENTS));
