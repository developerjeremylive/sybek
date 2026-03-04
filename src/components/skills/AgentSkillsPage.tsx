// ---------------------------------------------------------------------------
// Agent Skills Page - Marketplace and Management
// ---------------------------------------------------------------------------

import { useState } from 'react';
import { useAgentSkillsStore, type AgentSkill } from '../../stores/agent-skills-store.js';
import { 
  Search, Download, Trash2, Check, X, Settings, 
  Zap, ExternalLink, RefreshCw, CheckCircle, XCircle,
  MessageSquare, Wrench, Search as SearchIcon
} from 'lucide-react';

export function AgentSkillsPage() {
  const { skills, installSkill, uninstallSkill, configureSkill, activateSkill, deactivateSkill, testConnection } = useAgentSkillsStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [configuringSkill, setConfiguringSkill] = useState<string | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const categories = [
    { id: 'all', label: 'All', icon: <SearchIcon className="w-4 h-4" /> },
    { id: 'search', label: 'Search', icon: <Search className="w-4 h-4" /> },
    { id: 'data', label: 'Data', icon: <MessageSquare className="w-4 h-4" /> },
    { id: 'productivity', label: 'Productivity', icon: <Wrench className="w-4 h-4" /> },
    { id: 'fun', label: 'Fun', icon: <Zap className="w-4 h-4" /> },
    { id: 'utilities', label: 'Utilities', icon: <Settings className="w-4 h-4" /> },
  ];

  const filteredSkills = skills.filter(skill => {
    const matchesSearch = skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        skill.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'all' || skill.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const installedCount = skills.filter(s => s.installed).length;
  const activeCount = skills.filter(s => s.active).length;

  const handleInstall = (skill: AgentSkill) => {
    if (skill.requiresApiKey) {
      setConfiguringSkill(skill.id);
    } else {
      installSkill(skill.id);
    }
  };

  const handleConfigure = () => {
    if (configuringSkill && apiKeyInput) {
      configureSkill(configuringSkill, apiKeyInput);
      installSkill(configuringSkill);
      setConfiguringSkill(null);
      setApiKeyInput('');
    }
  };

  const handleTest = async (skillId: string) => {
    setTestingId(skillId);
    const result = await testConnection(skillId);
    setTestResult(result);
    setTimeout(() => {
      setTestingId(null);
      setTestResult(null);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-base-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-900 px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-2">🤖 Agent Skills</h1>
          <p className="text-purple-200">Extend your AI assistant with powerful skills</p>
          
          {/* Stats */}
          <div className="flex gap-4 mt-4">
            <div className="bg-white/10 backdrop-blur rounded-lg px-4 py-2">
              <span className="text-2xl font-bold text-white">{installedCount}</span>
              <span className="text-purple-200 ml-2">Installed</span>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg px-4 py-2">
              <span className="text-2xl font-bold text-emerald-400">{activeCount}</span>
              <span className="text-purple-200 ml-2">Active</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* Search and Categories */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input input-bordered w-full"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`btn btn-sm gap-2 whitespace-nowrap ${
                  activeCategory === cat.id 
                    ? 'btn-primary' 
                    : 'btn-ghost'
                }`}
              >
                {cat.icon}
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Skills Grid - with vertical scroll */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 300px)' }}>
          {filteredSkills.map(skill => (
            <SkillCard
              key={skill.id}
              skill={skill}
              onInstall={() => handleInstall(skill)}
              onUninstall={() => uninstallSkill(skill.id)}
              onActivate={() => activateSkill(skill.id)}
              onDeactivate={() => deactivateSkill(skill.id)}
              onTest={() => handleTest(skill.id)}
              testing={testingId === skill.id}
              testResult={testingId === skill.id ? testResult : null}
            />
          ))}
        </div>

        {filteredSkills.length === 0 && (
          <div className="text-center py-12 text-base-content/50">
            <SearchIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No skills found</p>
          </div>
        )}
      </div>

      {/* Configure Modal */}
      {configuringSkill && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-base-100 p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-bold mb-4">Configure API Key</h3>
            <p className="text-base-content/70 mb-4">
              {skills.find(s => s.id === configuringSkill)?.description}
            </p>
            
            <input
              type="password"
              placeholder="Enter API key..."
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              className="input input-bordered w-full mb-4"
            />
            
            <div className="flex gap-2">
              <button 
                onClick={handleConfigure}
                className="btn btn-primary flex-1"
                disabled={!apiKeyInput}
              >
                Install
              </button>
              <button 
                onClick={() => {
                  setConfiguringSkill(null);
                  setApiKeyInput('');
                }}
                className="btn btn-ghost"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Skill Card Component
function SkillCard({
  skill,
  onInstall,
  onUninstall,
  onActivate,
  onDeactivate,
  onTest,
  testing,
  testResult,
}: {
  skill: AgentSkill;
  onInstall: () => void;
  onUninstall: () => void;
  onActivate: () => void;
  onDeactivate: () => void;
  onTest: () => void;
  testing: boolean;
  testResult: { success: boolean; message: string } | null;
}) {
  const categoryColors: Record<string, string> = {
    search: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    data: 'bg-green-500/20 text-green-400 border-green-500/30',
    productivity: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    fun: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
    utilities: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  };

  return (
    <div className={`bg-base-200 rounded-xl p-4 border transition-all ${
      skill.active 
        ? 'border-emerald-500/50 shadow-lg shadow-emerald-500/10' 
        : 'border-base-300'
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="text-3xl">{skill.icon}</div>
          <div>
            <h3 className="font-bold">{skill.name}</h3>
            <span className={`text-xs px-2 py-0.5 rounded border ${categoryColors[skill.category]}`}>
              {skill.category}
            </span>
          </div>
        </div>
        
        {/* Status indicators */}
        <div className="flex gap-1">
          {skill.configured && (
            <span className="tooltip" data-tip="Configured">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
            </span>
          )}
          {skill.active && (
            <span className="tooltip" data-tip="Active">
              <Zap className="w-4 h-4 text-yellow-400" />
            </span>
          )}
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-base-content/70 mb-4">{skill.description}</p>

      {/* API Key indicator */}
      {skill.requiresApiKey && (
        <div className="flex items-center gap-1 text-xs text-warning mb-3">
          <Settings className="w-3 h-3" />
          API Key required
        </div>
      )}

      {/* Test Result */}
      {testResult && (
        <div className={`text-xs mb-3 p-2 rounded ${
          testResult.success 
            ? 'bg-emerald-500/20 text-emerald-400' 
            : 'bg-red-500/20 text-red-400'
        }`}>
          {testResult.success ? <CheckCircle className="w-3 h-3 inline mr-1" /> : <XCircle className="w-3 h-3 inline mr-1" />}
          {testResult.message}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 flex-wrap">
        {!skill.installed ? (
          <button 
            onClick={onInstall}
            className="btn btn-sm btn-primary gap-1"
          >
            <Download className="w-3 h-3" />
            Install
          </button>
        ) : (
          <>
            {skill.active ? (
              <button 
                onClick={onDeactivate}
                className="btn btn-sm btn-warning gap-1"
              >
                <X className="w-3 h-3" />
                Deactivate
              </button>
            ) : (
              <button 
                onClick={onActivate}
                className="btn btn-sm btn-success gap-1"
                disabled={!skill.configured}
              >
                <Zap className="w-3 h-3" />
                Activate
              </button>
            )}
            
            <button 
              onClick={onTest}
              className="btn btn-sm btn-ghost gap-1"
              disabled={testing}
            >
              <RefreshCw className={`w-3 h-3 ${testing ? 'animate-spin' : ''}`} />
              Test
            </button>
            
            <button 
              onClick={onUninstall}
              className="btn btn-sm btn-ghost text-error gap-1"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
