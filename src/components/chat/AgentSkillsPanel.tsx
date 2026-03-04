// ---------------------------------------------------------------------------
// Agent Skills Panel - Chat UI Side Panel
// ---------------------------------------------------------------------------

import { useState } from 'react';
import { Sparkles, X, Check, Zap, Settings, ChevronRight, ArrowRight } from 'lucide-react';
import { useAgentSkillsStore, type AgentSkill } from '../../stores/agent-skills-store.js';
import { getToolsForSkill } from '../../stores/skill-tool-map.js';

interface Props {
  className?: string;
}

export function AgentSkillsPanel({ className = '' }: Props) {
  const { skills, activateSkill, deactivateSkill } = useAgentSkillsStore();
  const [isOpen, setIsOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // Get installed skills
  const installedSkills = skills.filter(s => s.installed);
  const activeSkills = skills.filter(s => s.active);

  const handleToggle = (skill: AgentSkill) => {
    if (skill.active) {
      deactivateSkill(skill.id);
    } else if (skill.configured) {
      activateSkill(skill.id);
    }
  };

  return (
    <div className={`relative ${className}`}>
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
        <span className="text-sm font-medium">Agent Skills</span>
        {activeSkills.length > 0 && (
          <span className="px-1.5 py-0.5 bg-cyan-500/50 rounded text-xs">
            {activeSkills.length}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute bottom-full mb-2 left-0 w-80 bg-base-100 border border-cyan-500/30 rounded-lg shadow-xl shadow-cyan-500/10 overflow-hidden z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border-b border-cyan-500/30">
            <span className="text-sm font-medium text-cyan-200">Agent Skills</span>
            <button onClick={() => setIsOpen(false)} className="text-base-content/50 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Skills List */}
          <div className="max-h-80 overflow-y-auto p-2">
            {installedSkills.length === 0 ? (
              <div className="text-center py-6 text-base-content/50">
                <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No hay skills instalados</p>
                <p className="text-xs mt-1">Ve a la pestaña Skills para instalar</p>
              </div>
            ) : (
              <div className="space-y-1">
                {installedSkills.map((skill) => {
                  const mappedTools = getToolsForSkill(skill.id);
                  return (
                    <button
                      key={skill.id}
                      onClick={() => handleToggle(skill)}
                      disabled={!skill.configured}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                        skill.active
                          ? 'bg-cyan-500/30 border border-cyan-500/50'
                          : skill.configured
                            ? 'bg-base-200/50 border border-transparent hover:bg-base-200'
                            : 'bg-base-200/30 border border-transparent opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded flex items-center justify-center ${
                        skill.active ? 'bg-cyan-500 text-white' : 'bg-base-300 text-base-content/50'
                      }`}>
                        {skill.active ? <Check className="w-3 h-3" /> : null}
                      </div>
                      <span className="text-lg">{skill.icon}</span>
                      <div className="text-left flex-1">
                        <div className="text-sm font-medium text-base-content">{skill.name}</div>
                        <div className="text-xs text-base-content/50">
                          {!skill.configured ? 'Requires API Key' : skill.active ? 'Activo' : 'Inactivo'}
                        </div>
                        {skill.active && mappedTools.length > 0 && (
                          <div className="text-xs text-cyan-400 flex items-center gap-1 mt-0.5">
                            <ArrowRight className="w-2.5 h-2.5" />
                            {mappedTools.join(', ')}
                          </div>
                        )}
                      </div>
                      {skill.active && (
                        <Zap className="w-4 h-4 text-yellow-400" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-3 py-2 border-t border-cyan-500/30 bg-base-200/50 flex justify-between items-center">
            <span className="text-xs text-base-content/50">
              {activeSkills.length} activo(s) / {installedSkills.length} instalado(s)
            </span>
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
            >
              Ver todos
              <ChevronRight className={`w-3 h-3 transition-transform ${expanded ? 'rotate-90' : ''}`} />
            </button>
          </div>

          {/* Expanded View - All Skills */}
          {expanded && (
            <div className="border-t border-cyan-500/20 p-2 bg-base-200/30 max-h-60 overflow-y-auto">
              <div className="text-xs text-base-content/50 mb-2 uppercase">Todos los skills disponibles</div>
              {skills.map((skill) => (
                <div
                  key={skill.id}
                  className="flex items-center gap-2 px-2 py-1.5 rounded text-sm"
                >
                  <span className="text-base">{skill.icon}</span>
                  <span className="flex-1 text-base-content/70">{skill.name}</span>
                  {!skill.installed ? (
                    <span className="text-xs text-warning">No instalado</span>
                  ) : skill.active ? (
                    <span className="text-xs text-success">Activo</span>
                  ) : skill.configured ? (
                    <span className="text-xs text-base-content/50">Inactivo</span>
                  ) : (
                    <span className="text-xs text-error">Sin configurar</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
