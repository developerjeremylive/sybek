// ---------------------------------------------------------------------------
// Agent Skills Panel - Chat UI Side Panel - Uses Catalog Skills
// ---------------------------------------------------------------------------

import { useState } from 'react';
import { Sparkles, X, Check, Zap, ChevronRight, FolderOpen } from 'lucide-react';
import { useCatalogSkillsStore, type CatalogSkill } from '../../stores/catalog-skills-store.js';

interface Props {
  className?: string;
}

export function AgentSkillsPanel({ className = '' }: Props) {
  const { catalogSkills, installedSkills, activeSkills, installSkill, uninstallSkill, activateSkill, deactivateSkill } = useCatalogSkillsStore();
  const [isOpen, setIsOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showV2Notification, setShowV2Notification] = useState(false);

  const showV2Toast = () => {
    setShowV2Notification(true);
    setTimeout(() => setShowV2Notification(false), 3000);
  };

  // Group skills by category
  const categories = [...new Set(catalogSkills.map(s => s.category))];
  
  const handleInstall = async (skill: CatalogSkill) => {
    try {
      await installSkill(skill.id);
    } catch (e) {
      console.error('Failed to install skill:', e);
    }
  };
  
  const handleActivate = (skill: CatalogSkill) => {
    // Skills v2 coming soon - show notification
    showV2Toast();
  };

  return (
    <div className={`relative ${className}`}>
      {/* V2 Notification Toast */}
      {showV2Notification && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 animate-slide-in">
          <div className="bg-gradient-to-r from-amber-500/90 to-orange-500/90 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3">
            <Zap className="w-5 h-5" />
            <span className="font-medium">Skills implementation coming in version 2.0</span>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
          activeSkills.length > 0
            ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
            : 'bg-base-200 border-base-300 text-base-content/70 hover:border-cyan-500/30'
        }`}
      >
        <Sparkles className="w-4 h-4" />
        <span className="text-sm font-medium">Skills</span>
        {activeSkills.length > 0 && (
          <span className="px-1.5 py-0.5 bg-cyan-500/50 rounded text-xs">
            {activeSkills.length}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute bottom-full mb-2 left-0 w-96 bg-base-100 border border-cyan-500/30 rounded-lg shadow-xl shadow-cyan-500/10 overflow-hidden z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border-b border-cyan-500/30">
            <span className="text-sm font-medium text-cyan-200">Agent Skills (Catalog)</span>
            <button onClick={() => setIsOpen(false)} className="text-base-content/50 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Category Tabs */}
          <div className="flex gap-1 px-2 py-2 border-b border-cyan-500/20 overflow-x-auto">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-2 py-1 text-xs rounded whitespace-nowrap ${
                !selectedCategory ? 'bg-cyan-500/50 text-white' : 'bg-base-200 text-base-content/70'
              }`}
            >
              All ({catalogSkills.length})
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2 py-1 text-xs rounded whitespace-nowrap capitalize ${
                  selectedCategory === cat ? 'bg-cyan-500/50 text-white' : 'bg-base-200 text-base-content/70'
                }`}
              >
                {cat} ({catalogSkills.filter(s => s.category === cat).length})
              </button>
            ))}
          </div>

          {/* Skills List */}
          <div className="max-h-80 overflow-y-auto p-2">
            {(selectedCategory ? catalogSkills.filter(s => s.category === selectedCategory) : catalogSkills).map((skill) => {
              const isInstalled = installedSkills.includes(skill.id);
              const isActive = activeSkills.includes(skill.id);
              
              return (
                <div
                  key={skill.id}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg mb-1 transition-all ${
                    isActive
                      ? 'bg-cyan-500/30 border border-cyan-500/50'
                      : isInstalled
                        ? 'bg-base-200/50 border border-transparent'
                        : 'bg-base-200/30 border border-transparent hover:bg-base-200'
                  }`}
                >
                  <span className="text-lg">{skill.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-base-content">{skill.name}</div>
                    <div className="text-xs text-base-content/50 truncate">{skill.description}</div>
                  </div>
                  <div className="flex gap-1">
                    {!isInstalled ? (
                      <button
                        onClick={() => handleInstall(skill)}
                        className="px-2 py-1 text-xs bg-cyan-500/50 hover:bg-cyan-500 rounded text-white"
                      >
                        Install
                      </button>
                    ) : (
                      <button
                        onClick={() => handleActivate(skill)}
                        className={`px-2 py-1 text-xs rounded ${
                          isActive 
                            ? 'bg-cyan-500 text-white' 
                            : 'bg-base-300 text-base-content/70 hover:bg-cyan-500/50'
                        }`}
                      >
                        {isActive ? 'Active' : 'Activate'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="px-3 py-2 border-t border-cyan-500/30 bg-base-200/50 flex justify-between items-center">
            <div className="flex items-center gap-2 text-xs text-base-content/50">
              <FolderOpen className="w-3 h-3" />
              <span>From skills-catalog</span>
            </div>
            <span className="text-xs text-base-content/50">
              {activeSkills.length} active / {installedSkills.length} installed
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
