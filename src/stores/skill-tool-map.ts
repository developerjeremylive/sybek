// ---------------------------------------------------------------------------
// Skill to Tool Mapping
// ---------------------------------------------------------------------------

// Maps Agent Skills to their corresponding MCP tools
export const SKILL_TOOL_MAP: Record<string, string[]> = {
  'ddg_search': ['web_search'],
  'brave_search': ['web_search'],
  'wikipedia': ['wikipedia'],
  'weather': ['get_weather'],
  'newsapi': ['web_search'], // News uses web search
  'notion': [], // Requires specific integration
  'github': ['github'], // If there's a GitHub MCP tool
  'joke': ['joke'],
  'cat_fact': ['cat_fact'],
  'dog_fact': ['dog_fact'],
  'meme': ['web_search'], // Uses web search
  'currency': ['convert_currency'],
  'translate': [], // Requires specific integration
  'email': [], // Requires specific integration
};

// Get tools for a skill
export function getToolsForSkill(skillId: string): string[] {
  return SKILL_TOOL_MAP[skillId] || [];
}

// Get all tools for multiple skills
export function getToolsForSkills(skillIds: string[]): string[] {
  const tools = new Set<string>();
  for (const skillId of skillIds) {
    const skillTools = getToolsForSkill(skillId);
    skillTools.forEach(t => tools.add(t));
  }
  return Array.from(tools);
}

// Skill descriptions for system prompt
export const SKILL_DESCRIPTIONS: Record<string, string> = {
  'ddg_search': 'DuckDuckGo Search (PREFERRED) - Use web_search tool for web searches',
  'brave_search': 'Brave Search (PREFERRED) - Use web_search tool for web searches',
  'wikipedia': 'Wikipedia - Search and read Wikipedia articles',
  'weather': 'Weather - Get current weather for any city',
  'newsapi': 'News API - Get latest news headlines',
  'notion': 'Notion - Interact with Notion workspaces',
  'github': 'GitHub - Search repositories, issues, and PRs',
  'joke': 'Random Joke - Get random jokes',
  'cat_fact': 'Cat Facts - Random cat facts',
  'dog_fact': 'Dog Facts - Random dog facts',
  'meme': 'Meme Generator - Generate random memes',
  'currency': 'Currency Converter - Convert between currencies',
  'translate': 'Translator - Translate text between languages',
  'email': 'Email - Send emails via SMTP',
};
