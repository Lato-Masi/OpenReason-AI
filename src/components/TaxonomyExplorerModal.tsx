import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, BookOpen, ShieldAlert, AlertTriangle, Compass, CheckCircle2, Search, Filter } from 'lucide-react';
import { COGNITIVE_BIASES_CATALOG, LOGICAL_FALLACIES_CATALOG, COGNITIVE_STYLES_CATALOG } from '../services/taxonomyRegistry';

interface TaxonomyExplorerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TaxonomyExplorerModal: React.FC<TaxonomyExplorerModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'biases' | 'fallacies' | 'styles'>('biases');
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const biasList = Object.values(COGNITIVE_BIASES_CATALOG);
  const fallacyList = Object.values(LOGICAL_FALLACIES_CATALOG);
  const styleList = Object.values(COGNITIVE_STYLES_CATALOG);

  const filteredBiases = biasList.filter(b => 
    b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredFallacies = fallacyList.filter(f => 
    f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredStyles = styleList.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-5xl h-[85vh] bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-zinc-100"
        >
          {/* Modal Header */}
          <div className="p-4 sm:p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 rounded-xl text-emerald-400">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  OpenReason Epistemic Taxonomy Catalog
                  <span className="px-2 py-0.5 text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
                    v2.0 Taxonomy Engine
                  </span>
                </h2>
                <p className="text-xs text-zinc-400">
                  Comprehensive reference catalogs for cognitive biases, formal/informal logical fallacies, and cognitive styles.
                </p>
              </div>
            </div>

            <button 
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search & Navigation Bar */}
          <div className="px-6 py-3 border-b border-zinc-800 bg-zinc-950/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => setActiveTab('biases')}
                className={`px-3 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors ${
                  activeTab === 'biases'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-zinc-800/60 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Cognitive Biases ({biasList.length})
              </button>

              <button
                onClick={() => setActiveTab('fallacies')}
                className={`px-3 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors ${
                  activeTab === 'fallacies'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : 'bg-zinc-800/60 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                Logical Fallacies ({fallacyList.length})
              </button>

              <button
                onClick={() => setActiveTab('styles')}
                className={`px-3 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors ${
                  activeTab === 'styles'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : 'bg-zinc-800/60 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Compass className="w-4 h-4 text-cyan-400" />
                Cognitive Styles ({styleList.length})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search catalog..."
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-zinc-200 outline-none focus:border-emerald-500/50"
              />
            </div>
          </div>

          {/* Catalog Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-zinc-900/50">
            {activeTab === 'biases' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredBiases.map((bias) => (
                  <div key={bias.id} className="p-4 bg-zinc-950/80 rounded-xl border border-zinc-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-amber-300 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                        {bias.name}
                      </h4>
                      <span className={`px-2 py-0.5 text-[10px] font-mono rounded font-bold uppercase ${
                        bias.severity === 'critical' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                        bias.severity === 'high' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                        'bg-zinc-800 text-zinc-400'
                      }`}>
                        {bias.severity} Severity
                      </span>
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      {bias.description}
                    </p>
                    {bias.mitigationStrategy && (
                      <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs text-emerald-300 font-mono flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                          <strong className="block text-[10px] text-emerald-400 uppercase tracking-wider">Mitigation Strategy:</strong>
                          {bias.mitigationStrategy}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : activeTab === 'fallacies' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredFallacies.map((fallacy) => (
                  <div key={fallacy.id} className="p-4 bg-zinc-950/80 rounded-xl border border-zinc-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-rose-300 flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-rose-400" />
                        {fallacy.name}
                      </h4>
                      <span className="px-2 py-0.5 text-[10px] font-mono bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded font-bold uppercase">
                        {fallacy.severity} severity
                      </span>
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      {fallacy.description}
                    </p>
                    {fallacy.mitigationStrategy && (
                      <div className="p-2 bg-zinc-900 border border-zinc-800 rounded text-[11px] font-mono text-zinc-300">
                        <strong className="text-emerald-400 block text-[9px] uppercase">Mitigation Strategy:</strong>
                        {fallacy.mitigationStrategy}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredStyles.map((style) => (
                  <div key={style.id} className="p-4 bg-zinc-950/80 rounded-xl border border-zinc-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-cyan-300 flex items-center gap-2">
                        <Compass className="w-4 h-4 text-cyan-400" />
                        {style.name}
                      </h4>
                      <span className="px-2 py-0.5 text-[10px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded font-bold uppercase">
                        {style.category}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      {style.description}
                    </p>
                    <div className="space-y-1.5 pt-2 border-t border-zinc-800/80">
                      <div className="text-[11px] text-zinc-400 font-mono">
                        <strong className="text-cyan-400">Core Strength:</strong> {style.strength}
                      </div>
                      <div className="text-[11px] text-zinc-400 font-mono">
                        <strong className="text-purple-400">Application:</strong> {style.application}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="p-4 border-t border-zinc-800 bg-zinc-950/80 flex items-center justify-between text-xs font-mono text-zinc-400">
            <span>OpenReason Cognitive Audit Engine Catalog</span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium transition-colors"
            >
              Close Catalog
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
