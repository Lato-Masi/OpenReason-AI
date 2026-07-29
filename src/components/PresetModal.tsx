import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Search, 
  Sparkles, 
  Terminal, 
  Cpu, 
  Briefcase, 
  Code2, 
  Layers, 
  Play, 
  CheckCircle2, 
  BookOpen, 
  ArrowRight,
  Flame,
  Gauge,
  BarChart3
} from 'lucide-react';
import { BENCHMARK_PRESETS, BenchmarkPreset } from '../data/benchmarkPresets';
import { ReasoningMode } from '../services/reasoningEngine';

interface PresetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPreset: (preset: BenchmarkPreset, autoRun?: boolean) => void;
  onOpenEvalModal?: () => void;
}

export const PresetModal: React.FC<PresetModalProps> = ({
  isOpen,
  onClose,
  onSelectPreset,
  onOpenEvalModal
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPresetId, setSelectedPresetId] = useState<string>(BENCHMARK_PRESETS[0].id);

  if (!isOpen) return null;

  const categories = [
    'All',
    'Logic Programming (Prolog/Datalog/kanren)',
    'Constraint Reasoning (Const-o-T)',
    'Business Strategy',
    'Coding & Algorithms'
  ];

  const filteredPresets = BENCHMARK_PRESETS.filter((preset) => {
    const matchesCategory = selectedCategory === 'All' || preset.category === selectedCategory;
    const matchesSearch = 
      preset.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      preset.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      preset.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      preset.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const activePreset = BENCHMARK_PRESETS.find(p => p.id === selectedPresetId) || filteredPresets[0] || BENCHMARK_PRESETS[0];

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Logic Programming (Prolog/Datalog/kanren)':
        return <Cpu className="w-4 h-4 text-cyan-400" />;
      case 'Constraint Reasoning (Const-o-T)':
        return <Layers className="w-4 h-4 text-emerald-400" />;
      case 'Business Strategy':
        return <Briefcase className="w-4 h-4 text-amber-400" />;
      case 'Coding & Algorithms':
        return <Code2 className="w-4 h-4 text-purple-400" />;
      default:
        return <Terminal className="w-4 h-4 text-zinc-400" />;
    }
  };

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case 'Extreme Benchmark':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-red-500/10 text-red-400 border border-red-500/30 flex items-center gap-1 font-semibold">
            <Flame className="w-3 h-3 text-red-400" />
            Extreme
          </span>
        );
      case 'Hard':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1 font-semibold">
            <Gauge className="w-3 h-3 text-amber-400" />
            Hard
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
            Standard
          </span>
        );
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-zinc-950 border border-zinc-800 rounded-xl w-full max-w-5xl h-[90vh] max-h-[850px] flex flex-col shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                <Sparkles className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-zinc-100 flex items-center gap-2">
                  Reasoning Benchmark & Prompt Preset Suite
                  <span className="text-[10px] font-mono bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded border border-zinc-700">
                    {BENCHMARK_PRESETS.length} Benchmarks
                  </span>
                </h2>
                <p className="text-xs text-zinc-400">
                  Select classical logic challenges (Prolog, Datalog, miniKanren), Const-o-T constraint models, strategic operations, and coding benchmarks.
                </p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search & Category Filter Bar */}
          <div className="px-5 py-3 border-b border-zinc-800/80 bg-zinc-900/30 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Prolog, Datalog, Const-o-T, algorithms, keywords..."
                className="w-full bg-zinc-900 text-zinc-200 text-xs pl-9 pr-3 py-2 rounded-lg border border-zinc-800 focus:border-emerald-500/50 focus:outline-none transition-all placeholder:text-zinc-600"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-zinc-500 hover:text-zinc-300 px-1"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Category Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    selectedCategory === cat 
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/40 shadow-sm' 
                      : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 border border-zinc-800/60'
                  }`}
                >
                  {getCategoryIcon(cat)}
                  <span>{cat === 'All' ? 'All Categories' : cat.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Main Modal Body: Split Pane */}
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
            {/* Left Column: Preset Item List */}
            <div className="w-full md:w-5/12 border-b md:border-b-0 md:border-r border-zinc-800/80 overflow-y-auto p-3 space-y-2 bg-zinc-950/50">
              {filteredPresets.length === 0 ? (
                <div className="p-8 text-center text-zinc-500 text-xs">
                  No benchmarks matching "{searchQuery}"
                </div>
              ) : (
                filteredPresets.map((preset) => {
                  const isSelected = activePreset.id === preset.id;
                  return (
                    <div
                      key={preset.id}
                      onClick={() => setSelectedPresetId(preset.id)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-zinc-900 border-emerald-500/50 ring-1 ring-emerald-500/20 shadow-lg'
                          : 'bg-zinc-900/40 border-zinc-800/60 hover:bg-zinc-900/80 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex items-center gap-1.5">
                          {getCategoryIcon(preset.category)}
                          <span className="text-xs font-semibold text-zinc-200 line-clamp-1">
                            {preset.title}
                          </span>
                        </div>
                        {getDifficultyBadge(preset.difficulty)}
                      </div>

                      <p className="text-[11px] text-zinc-400 line-clamp-2 mb-2 leading-relaxed">
                        {preset.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-1">
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                          {preset.suggestedMode}
                        </span>
                        {preset.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-500 border border-zinc-800">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Right Column: Detailed Template Inspection & Prompt Inspector */}
            <div className="w-full md:w-7/12 flex flex-col bg-zinc-900/20 overflow-y-auto p-4 sm:p-5">
              {activePreset && (
                <div className="flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-4">
                    {/* Header Details */}
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        {getCategoryIcon(activePreset.category)}
                        <span className="text-xs font-mono font-semibold text-zinc-400 uppercase tracking-wider">
                          {activePreset.category}
                        </span>
                        <span className="text-zinc-600">•</span>
                        {getDifficultyBadge(activePreset.difficulty)}
                      </div>
                      <h3 className="text-lg font-bold text-zinc-100 mb-1">
                        {activePreset.title}
                      </h3>
                      <p className="text-xs text-zinc-300 leading-relaxed">
                        {activePreset.description}
                      </p>
                    </div>

                    {/* Mode & Output Focus Badges */}
                    <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800/80 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-400 font-mono text-[10px] uppercase">Recommended Mode:</span>
                        <span className="font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                          {activePreset.suggestedMode} {activePreset.suggestedStrategy ? `(${activePreset.suggestedStrategy})` : ''}
                        </span>
                      </div>
                      <div>
                        <span className="text-zinc-500 font-mono text-[10px] uppercase block mb-1">Expected Output & Verification Focus:</span>
                        <p className="text-xs text-zinc-300 italic bg-zinc-900/60 p-2 rounded border border-zinc-800/50">
                          "{activePreset.expectedOutputFocus}"
                        </p>
                      </div>
                    </div>

                    {/* Full Prompt Display */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1">
                          <Terminal className="w-3 h-3 text-emerald-400" />
                          Prompt Specification Template
                        </span>
                      </div>
                      <div className="bg-zinc-950 p-3.5 rounded-lg border border-zinc-800 font-mono text-xs text-zinc-200 leading-relaxed whitespace-pre-wrap max-h-[260px] overflow-y-auto selection:bg-emerald-500 selection:text-black">
                        {activePreset.prompt}
                      </div>
                    </div>
                  </div>

                  {/* Modal Action Buttons */}
                  <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-medium border border-zinc-800 transition-colors"
                      >
                        Cancel
                      </button>

                      {onOpenEvalModal && (
                        <button
                          onClick={() => {
                            onClose();
                            onOpenEvalModal();
                          }}
                          className="px-3.5 py-2 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-mono font-semibold transition-all flex items-center gap-1.5"
                        >
                          <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Launch BenchKit Suite</span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          onSelectPreset(activePreset, false);
                          onClose();
                        }}
                        className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 transition-all flex items-center gap-1.5"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Load Prompt Only</span>
                      </button>

                      <button
                        onClick={() => {
                          onSelectPreset(activePreset, true);
                          onClose();
                        }}
                        className="px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2"
                      >
                        <Play className="w-3.5 h-3.5 fill-black" />
                        <span>Run Benchmark Execution</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
