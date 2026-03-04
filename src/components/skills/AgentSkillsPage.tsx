// ---------------------------------------------------------------------------
// Agent Skills Page - Desktop View for Catalog Skills
// ---------------------------------------------------------------------------

import { useState } from 'react';
import { useCatalogSkillsStore, type CatalogSkill } from '../../stores/catalog-skills-store.js';
import { 
  Search, Download, Trash2, Check, X, Settings, 
  Zap, FolderOpen, ChevronRight, BookOpen
} from 'lucide-react';

export function AgentSkillsPage() {
  const { 
    catalogSkills, 
    installedSkills, 
    activeSkills, 
    installSkill, 
    uninstallSkill, 
    activateSkill, 
    deactivateSkill 
  } = useCatalogSkillsStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Get unique categories
  const categories = [...new Set(catalogSkills.map(s => s.category))];

  // Filter skills
  const filteredSkills = catalogSkills.filter(skill => {
    const matchesSearch = skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        skill.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || skill.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleInstall = (skill: CatalogSkill) => {
    installSkill(skill.id);
  };

  const handleUninstall = (skill: CatalogSkill) => {
    uninstallSkill(skill.id);
  };

  const handleToggleActive = (skill: CatalogSkill) => {
    if (activeSkills.includes(skill.id)) {
      deactivateSkill(skill.id);
    } else {
      activateSkill(skill.id);
    }
  };

  return (
    <div className="min-h-screen bg-base-100 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <FolderOpen className="w-8 h-8 text-cyan-400" />
          <h1 className="text-2xl font-bold">Agent Skills</h1>
        </div>
        <p className="text-base-content/60">
          Install and activate skills from the skills-catalog to enhance your AI assistant.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-base-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-cyan-400">{catalogSkills.length}</div>
          <div className="text-sm text-base-content/60">Available Skills</div>
        </div>
        <div className="bg-base-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-400">{installedSkills.length}</div>
          <div className="text-sm text-base-content/60">Installed</div>
        </div>
        <div className="bg-base-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-yellow-400">{activeSkills.length}</div>
          <div className="text-sm text-base-content/60">Active</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-base-content/40" />
          <input
            type="text"
            placeholder="Search skills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input input-bordered w-full pl-10"
          />
        </div>
        <select 
          className="select select-bordered"
          value={selectedCategory || ''}
          onChange={(e) => setSelectedCategory(e.target.value || null)}
        >
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat} className="capitalize">{cat}</option>
          ))}
        </select>
      </div>

      {/* Skills Grid - with vertical scroll */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[calc(100vh-350px)] overflow-y-auto pr-2">
        {filteredSkills.map((skill) => {
          const isInstalled = installedSkills.includes(skill.id);
          const isActive = activeSkills.includes(skill.id);
          
          return (
            <div 
              key={skill.id}
              className={`bg-base-200 rounded-lg p-4 border transition-all ${
                isActive ? 'border-cyan-500/50 bg-cyan-500/10' : 'border-transparent'
              }`}
            >
              {/* Header */}
              <div className="flex items-start gap-3 mb-3">
                <div className="text-2xl">{skill.icon}</div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{skill.name}</h3>
                  <p className="text-xs text-base-content/50 capitalize">{skill.category}</p>
                </div>
                {isActive && (
                  <span className="px-2 py-0.5 bg-cyan-500/30 text-cyan-300 text-xs rounded-full flex items-center gap-1">
                    <Zap className="w-3 h-3" /> Active
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="text-sm text-base-content/70 mb-4 line-clamp-2">
                {skill.description}
              </p>

              {/* Actions */}
              <div className="flex gap-2">
                {!isInstalled ? (
                  <button
                    onClick={() => handleInstall(skill)}
                    className="btn btn-sm btn-primary flex-1"
                  >
                    <Download className="w-4 h-4" />
                    Install
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => handleToggleActive(skill)}
                      className={`btn btn-sm flex-1 ${isActive ? 'btn-warning' : 'btn-success'}`}
                    >
                      {isActive ? (
                        <>
                          <X className="w-4 h-4" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4" />
                          Activate
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleUninstall(skill)}
                      className="btn btn-sm btn-ghost btn-square"
                      title="Uninstall"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredSkills.length === 0 && (
        <div className="text-center py-12 text-base-content/50">
          <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No skills found matching your search.</p>
        </div>
      )}
    </div>
  );
}
