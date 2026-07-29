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
  Flame, 
  Gauge, 
  BarChart3,
  CheckSquare,
  Square,
  AlertTriangle,
  XCircle,
  Download,
  Zap,
  DollarSign,
  Hash,
  Clock,
  ShieldAlert,
  ArrowRight,
  Filter,
  Check
} from 'lucide-react';
import { BENCHMARK_PRESETS, BenchmarkPreset } from '../data/benchmarkPresets';
import { estimateBenchmarkCosts, calculateActualCost, getModelPriceRate } from '../services/costEstimator';
import { evaluateBenchmarkResult, EvaluationReport } from '../services/evaluator';
import { processReasoning, ReasoningResult, DynamicConfig } from '../services/reasoningEngine';
import { saveBenchmarkReport } from '../services/db';

interface ConsolidatedLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPreset: (preset: BenchmarkPreset, autoRun?: boolean) => void;
  activeModel: string;
  dynamicConfig?: DynamicConfig;
  isDynamicMode?: boolean;
  initialMode?: 'library' | 'benchkit';
}

export const ConsolidatedLibraryModal: React.FC<ConsolidatedLibraryModalProps> = ({
  isOpen,
  onClose,
  onSelectPreset,
  activeModel,
  dynamicConfig,
  isDynamicMode = true,
  initialMode = 'library'
}) => {
  // Mode switch: 'library' (browsing/loading individual prompts) or 'benchkit' (batch benchmark execution)
  const [activeView, setActiveView] = useState<'library' | 'benchkit'>(initialMode);

  // Common Search & Filtering
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Library View State
  const [selectedPresetId, setSelectedPresetId] = useState<string>(BENCHMARK_PRESETS[0].id);

  // BenchKit Batch Eval State
  const [selectedIds, setSelectedIds] = useState<string[]>(['zebra-puzzle', 'kinship-datalog']);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [currentRunningTitle, setCurrentRunningTitle] = useState<string>('');
  const [evalReports, setEvalReports] = useState<EvaluationReport[]>([]);
  const [evalSubTab, setEvalSubTab] = useState<'configure' | 'results'>('configure');

  if (!isOpen) return null;

  const categories = [
    'All',
    'Epistemic & Modality Suite (Temporal, Modal, Spatial, Bayesian, Game Theory, Meta-Epistemic)',
    'BenchKit Standard Suite (GSM8K, HumanEval, LogiQA, ARC, AIME)',
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

  const activeLibraryPreset = BENCHMARK_PRESETS.find(p => p.id === selectedPresetId) || filteredPresets[0] || BENCHMARK_PRESETS[0];

  // Selected presets for Batch BenchKit
  const selectedEvalPresets = BENCHMARK_PRESETS.filter(p => selectedIds.includes(p.id));

  // Cost Estimation for Batch BenchKit
  const costEstimate = estimateBenchmarkCosts(
    activeModel,
    selectedEvalPresets.map(p => ({
      estimatedInputTokens: p.groundTruth.estimatedInputTokens,
      estimatedOutputTokens: p.groundTruth.estimatedOutputTokens
    }))
  );

  const modelRates = getModelPriceRate(activeModel);

  const getCategoryIcon = (category: string) => {
    if (category.includes('Logic')) return <Cpu className="w-4 h-4 text-cyan-400" />;
    if (category.includes('Constraint')) return <Layers className="w-4 h-4 text-emerald-400" />;
    if (category.includes('Business')) return <Briefcase className="w-4 h-4 text-amber-400" />;
    if (category.includes('Coding')) return <Code2 className="w-4 h-4 text-purple-400" />;
    if (category.includes('Epistemic')) return <Sparkles className="w-4 h-4 text-indigo-400" />;
    return <Terminal className="w-4 h-4 text-zinc-400" />;
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

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredPresets.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredPresets.map(p => p.id));
    }
  };

  const togglePresetId = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Run Batch Benchmark Evaluation Suite
  const handleStartEvaluation = async () => {
    if (selectedEvalPresets.length === 0) return;

    setIsRunning(true);
    setEvalReports([]);
    setEvalSubTab('results');
    setCurrentIndex(0);

    const reports: EvaluationReport[] = [];

    for (let i = 0; i < selectedEvalPresets.length; i++) {
      const preset = selectedEvalPresets[i];
      setCurrentIndex(i);
      setCurrentRunningTitle(preset.title);

      const startTime = performance.now();
      try {
        const result: ReasoningResult = await processReasoning(
          preset.prompt,
          undefined,
          { model: activeModel, dynamicConfig }
        );

        const endTime = performance.now();
        const latencyMs = Math.round(endTime - startTime);

        let inTokens = 0;
        let outTokens = 0;
        for (const step of result.steps) {
          inTokens += step.inputTokens || Math.ceil((step.rawPrompt || '').length / 3.8);
          outTokens += step.outputTokens || Math.ceil((step.content || '').length / 3.8);
        }

        const costCalc = calculateActualCost(activeModel, inTokens, outTokens);

        const report = evaluateBenchmarkResult(
          preset,
          result,
          latencyMs,
          costCalc.totalCost,
          costCalc.formattedCost
        );

        reports.push(report);
        setEvalReports([...reports]);

        // Auto-save benchmark report to IndexedDB
        saveBenchmarkReport({
          benchmarkId: report.benchmarkId,
          benchmarkTitle: report.benchmarkTitle,
          category: preset.category,
          model: activeModel,
          verdict: report.verdict,
          overallScore: report.overallScore,
          canonicalScore: report.canonicalScore,
          astScore: report.astScore,
          keywordScore: report.keywordScore,
          contextIntegrityScore: report.contextIntegrityScore,
          overthinkingPenalty: report.overthinkingPenalty,
          totalInputTokens: report.totalInputTokens,
          totalOutputTokens: report.totalOutputTokens,
          totalTokens: report.totalTokens,
          actualCostUSD: report.actualCostUSD,
          formattedCost: report.formattedCost,
          latencyMs: report.latencyMs,
          summaryText: report.summaryText,
          timestamp: Date.now()
        }).catch(err => console.error('IndexedDB save benchmark error:', err));
      } catch (err: any) {
        console.error(`Benchmark run error for ${preset.id}:`, err);
        const failReport: EvaluationReport = {
          benchmarkId: preset.id,
          benchmarkTitle: preset.title,
          verdict: 'FAIL',
          overallScore: 0,
          canonicalScore: 0,
          astScore: 0,
          keywordScore: 0,
          contextIntegrityScore: 0,
          overthinkingPenalty: 0,
          canonicalMatches: [],
          astMatches: [],
          matchedKeywords: [],
          missingKeywords: preset.groundTruth.requiredKeywords,
          totalInputTokens: 0,
          totalOutputTokens: 0,
          totalTokens: 0,
          actualCostUSD: 0,
          formattedCost: '$0.00',
          latencyMs: 0,
          summaryText: `Execution Error: ${err.message || 'Pipeline failed'}`
        };
        reports.push(failReport);
        setEvalReports([...reports]);
      }
    }

    setIsRunning(false);
  };

  const handleExportJSON = () => {
    const exportData = {
      timestamp: new Date().toISOString(),
      model: activeModel,
      totalBenchmarksTested: evalReports.length,
      passedCount: evalReports.filter(r => r.verdict === 'PASS').length,
      partialCount: evalReports.filter(r => r.verdict === 'PARTIAL').length,
      failedCount: evalReports.filter(r => r.verdict === 'FAIL').length,
      overallAccuracy: (
        (evalReports.reduce((acc, r) => acc + r.overallScore, 0) / (evalReports.length || 1))
      ).toFixed(1) + '%',
      reports: evalReports
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `openreason_benchkit_${activeModel.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const passCount = evalReports.filter(r => r.verdict === 'PASS').length;
  const avgScore = evalReports.length > 0 
    ? Math.round(evalReports.reduce((acc, r) => acc + r.overallScore, 0) / evalReports.length)
    : 0;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-6xl h-[92vh] max-h-[920px] flex flex-col shadow-2xl overflow-hidden text-zinc-100"
        >
          {/* Main Top Header */}
          <div className="px-6 py-4 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-4 bg-zinc-900/80">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500/20 to-indigo-500/20 border border-emerald-500/30 text-emerald-400">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  OpenReason Reasoning & Benchmark Library
                  <span className="px-2 py-0.5 text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
                    Consolidated Hub
                  </span>
                </h2>
                <p className="text-xs text-zinc-400 font-mono">
                  Unified Repository of Logic Templates, Epistemic Suites & BenchKit AST Verification Benchmarks.
                </p>
              </div>
            </div>

            {/* View Switcher Controls */}
            <div className="flex items-center gap-2 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
              <button
                onClick={() => setActiveView('library')}
                className={`px-4 py-2 rounded-lg text-xs font-mono font-bold flex items-center gap-2 transition-all ${
                  activeView === 'library'
                    ? 'bg-zinc-800 text-emerald-400 border border-emerald-500/30 shadow-md'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <BookOpen className="w-4 h-4 text-emerald-400" />
                Templates & Prompts
              </button>

              <button
                onClick={() => setActiveView('benchkit')}
                className={`px-4 py-2 rounded-lg text-xs font-mono font-bold flex items-center gap-2 transition-all ${
                  activeView === 'benchkit'
                    ? 'bg-zinc-800 text-indigo-400 border border-indigo-500/30 shadow-md'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <BarChart3 className="w-4 h-4 text-indigo-400" />
                BenchKit AST Benchmarks
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Category Filter & Search Bar */}
          <div className="px-6 py-3 border-b border-zinc-800 bg-zinc-950/60 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center gap-2 overflow-x-auto py-1 max-w-full">
              <span className="text-zinc-500 uppercase tracking-widest text-[10px] font-bold shrink-0 flex items-center gap-1">
                <Filter className="w-3 h-3 text-zinc-400" /> Filter Category:
              </span>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-lg text-[11px] whitespace-nowrap transition-colors shrink-0 ${
                    selectedCategory === cat
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                      : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                  }`}
                >
                  {cat === 'All' ? 'All Categories' : cat.split(' ')[0]}
                </button>
              ))}
            </div>

            <div className="relative min-w-[240px] flex-1 sm:flex-initial">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search templates, benchmarks, tags..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-emerald-500/50"
              />
            </div>
          </div>

          {/* VIEW 1: TEMPLATES & PROMPTS LIBRARY VIEW */}
          {activeView === 'library' && (
            <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden bg-zinc-900/30">
              {/* Left Column: Preset Cards List */}
              <div className="md:col-span-5 border-r border-zinc-800 overflow-y-auto p-4 space-y-2.5">
                <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 px-1 pb-1">
                  <span>Available Templates: <strong>{filteredPresets.length}</strong></span>
                  <span className="text-emerald-400 font-bold">Select to Preview</span>
                </div>

                {filteredPresets.map((preset) => {
                  const isSelected = preset.id === activeLibraryPreset.id;
                  const isCheckedInBatch = selectedIds.includes(preset.id);
                  return (
                    <div
                      key={preset.id}
                      onClick={() => setSelectedPresetId(preset.id)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-2 relative group ${
                        isSelected
                          ? 'bg-zinc-900 border-emerald-500/50 shadow-lg'
                          : 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {getCategoryIcon(preset.category)}
                          <h3 className="text-xs font-bold text-white font-mono group-hover:text-emerald-300 transition-colors">
                            {preset.title}
                          </h3>
                        </div>
                        {getDifficultyBadge(preset.difficulty)}
                      </div>

                      <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                        {preset.description}
                      </p>

                      <div className="flex items-center justify-between pt-1 text-[10px] font-mono">
                        <div className="flex items-center gap-1.5 text-zinc-500">
                          <span className="px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-300 font-semibold uppercase">
                            {preset.suggestedMode}
                          </span>
                          <span>•</span>
                          <span>Est. ~{preset.groundTruth.estimatedInputTokens + preset.groundTruth.estimatedOutputTokens} tokens</span>
                        </div>

                        {/* Toggle adding to batch eval queue */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePresetId(preset.id);
                          }}
                          className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors flex items-center gap-1 ${
                            isCheckedInBatch
                              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                              : 'bg-zinc-800 text-zinc-500 hover:text-zinc-300'
                          }`}
                          title="Add/Remove from BenchKit Batch Queue"
                        >
                          {isCheckedInBatch ? <CheckSquare className="w-3 h-3 text-indigo-400" /> : <Square className="w-3 h-3" />}
                          {isCheckedInBatch ? 'In Batch Queue' : '+ Batch'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Right Column: Active Preset Detailed Inspector & Actions */}
              <div className="md:col-span-7 flex flex-col overflow-y-auto p-6 space-y-6 bg-zinc-950/80">
                {activeLibraryPreset ? (
                  <>
                    <div className="space-y-3 pb-4 border-b border-zinc-800">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="px-2.5 py-1 text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-lg font-bold uppercase">
                          {activeLibraryPreset.category}
                        </span>
                        {getDifficultyBadge(activeLibraryPreset.difficulty)}
                      </div>

                      <h2 className="text-lg font-bold text-white font-mono">
                        {activeLibraryPreset.title}
                      </h2>
                      <p className="text-xs text-zinc-300 leading-relaxed font-sans">
                        {activeLibraryPreset.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {activeLibraryPreset.tags.map(tag => (
                          <span key={tag} className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 rounded text-[10px] font-mono text-zinc-400">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Prompt Text Container */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-zinc-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                          <Terminal className="w-4 h-4 text-emerald-400" />
                          Template Prompt Content
                        </span>
                        <span className="text-zinc-500 text-[10px]">
                          ~{activeLibraryPreset.prompt.length} chars
                        </span>
                      </div>
                      <div className="p-4 bg-zinc-900 rounded-xl border border-zinc-800 font-mono text-xs text-zinc-200 leading-relaxed max-h-60 overflow-y-auto whitespace-pre-wrap select-text">
                        {activeLibraryPreset.prompt}
                      </div>
                    </div>

                    {/* Ground Truth & Recommended Specs */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                      <div className="p-4 bg-zinc-900/70 border border-zinc-800 rounded-xl space-y-2">
                        <h4 className="text-[10px] font-bold uppercase text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Formal Ground Truth Specification
                        </h4>
                        <div className="text-zinc-300 space-y-1 text-[11px]">
                          <div><strong className="text-zinc-500">Canonical Key:</strong> {Object.values(activeLibraryPreset.groundTruth.canonicalKeys).flat().join(', ')}</div>
                          <div><strong className="text-zinc-500">Required AST Nodes:</strong> {activeLibraryPreset.groundTruth.requiredASTNodes.join(', ')}</div>
                          <div><strong className="text-zinc-500">Verifiers:</strong> {activeLibraryPreset.groundTruth.requiredKeywords.join(', ')}</div>
                        </div>
                      </div>

                      <div className="p-4 bg-zinc-900/70 border border-zinc-800 rounded-xl space-y-2">
                        <h4 className="text-[10px] font-bold uppercase text-indigo-400 flex items-center gap-1">
                          <Cpu className="w-3.5 h-3.5" /> Engine Configuration Recommendation
                        </h4>
                        <div className="text-zinc-300 space-y-1 text-[11px]">
                          <div><strong className="text-zinc-500">Suggested Mode:</strong> {activeLibraryPreset.suggestedMode}</div>
                          <div><strong className="text-zinc-500">Est. Input Tokens:</strong> ~{activeLibraryPreset.groundTruth.estimatedInputTokens}</div>
                          <div><strong className="text-zinc-500">Est. Output Tokens:</strong> ~{activeLibraryPreset.groundTruth.estimatedOutputTokens}</div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-4 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-3">
                      <button
                        onClick={() => {
                          const isChecked = selectedIds.includes(activeLibraryPreset.id);
                          togglePresetId(activeLibraryPreset.id);
                          if (!isChecked) setActiveView('benchkit');
                        }}
                        className={`px-4 py-2.5 rounded-xl border text-xs font-mono font-bold flex items-center gap-2 transition-all ${
                          selectedIds.includes(activeLibraryPreset.id)
                            ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                            : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        <BarChart3 className="w-4 h-4 text-indigo-400" />
                        {selectedIds.includes(activeLibraryPreset.id) ? 'In BenchKit Batch Queue' : '+ Add to BenchKit Batch Suite'}
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            onSelectPreset(activeLibraryPreset, false);
                            onClose();
                          }}
                          className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-bold text-xs font-mono rounded-xl border border-zinc-700 flex items-center gap-2 transition-all"
                        >
                          <BookOpen className="w-4 h-4 text-emerald-400" />
                          Load into Input Workspace
                        </button>

                        <button
                          onClick={() => {
                            onSelectPreset(activeLibraryPreset, true);
                            onClose();
                          }}
                          className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-bold text-xs font-mono rounded-xl shadow-lg flex items-center gap-2 transition-all"
                        >
                          <Play className="w-4 h-4 fill-current" />
                          Auto-Run Reasoning Trace
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-zinc-500">
                    <BookOpen className="w-10 h-10 mb-2 opacity-40" />
                    <p className="text-xs font-mono">Select a template from the library to inspect details.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VIEW 2: BENCHKIT AST BENCHMARK EVALUATOR VIEW */}
          {activeView === 'benchkit' && (
            <div className="flex-1 flex flex-col overflow-hidden bg-zinc-950">
              {/* Eval Sub-tabs Header */}
              <div className="px-6 py-2.5 border-b border-zinc-800 bg-zinc-900/50 flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEvalSubTab('configure')}
                    className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors ${
                      evalSubTab === 'configure'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    1. Configure Batch Suite ({selectedEvalPresets.length} selected)
                  </button>

                  <button
                    onClick={() => setEvalSubTab('results')}
                    className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors ${
                      evalSubTab === 'results'
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    2. Benchmark Results & Verification ({evalReports.length})
                  </button>
                </div>

                <div className="flex items-center gap-3 text-zinc-400 text-[11px]">
                  <span>Active Engine: <strong className="text-emerald-400">{activeModel}</strong></span>
                  <span>•</span>
                  <span>Estimated Total Cost: <strong className="text-amber-400">{costEstimate.formattedCost}</strong></span>
                </div>
              </div>

              {/* Subtab 1: Configure Batch Suite */}
              {evalSubTab === 'configure' && (
                <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden p-6 gap-6">
                  {/* Left: Test Selection Checklist */}
                  <div className="md:col-span-8 flex flex-col overflow-hidden bg-zinc-900/40 rounded-2xl border border-zinc-800 p-4 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-zinc-800 text-xs font-mono">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={toggleSelectAll}
                          className="p-1 text-zinc-400 hover:text-white"
                        >
                          {selectedIds.length === filteredPresets.length ? (
                            <CheckSquare className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                        <span className="font-bold text-zinc-200 uppercase tracking-wider">
                          Select Benchmarks for Automated AST Verification ({selectedIds.length}/{filteredPresets.length})
                        </span>
                      </div>
                      <span className="text-zinc-500 text-[11px]">
                        Pre-flight AST Verification
                      </span>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                      {filteredPresets.map((preset) => {
                        const isChecked = selectedIds.includes(preset.id);
                        return (
                          <div
                            key={preset.id}
                            onClick={() => togglePresetId(preset.id)}
                            className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                              isChecked
                                ? 'bg-zinc-900/90 border-emerald-500/40 text-zinc-100'
                                : 'bg-zinc-950/40 border-zinc-800/80 text-zinc-400 hover:border-zinc-700'
                            }`}
                          >
                            <div className="mt-0.5">
                              {isChecked ? (
                                <CheckSquare className="w-4 h-4 text-emerald-400" />
                              ) : (
                                <Square className="w-4 h-4 text-zinc-600" />
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <h4 className="text-xs font-bold font-mono text-zinc-100 truncate">
                                  {preset.title}
                                </h4>
                                {getDifficultyBadge(preset.difficulty)}
                              </div>
                              <p className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5">
                                {preset.description}
                              </p>
                              <div className="flex items-center gap-3 text-[10px] font-mono text-zinc-500 mt-1">
                                <span>Canonical Key: <strong className="text-emerald-400">{Object.values(preset.groundTruth.canonicalKeys).flat()[0] || 'AST Node'}</strong></span>
                                <span>•</span>
                                <span>~{preset.groundTruth.estimatedInputTokens + preset.groundTruth.estimatedOutputTokens} tokens</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right: Cost & Run Summary */}
                  <div className="md:col-span-4 flex flex-col justify-between bg-zinc-900/70 border border-zinc-800 rounded-2xl p-5 space-y-6">
                    <div className="space-y-4 font-mono">
                      <div className="flex items-center gap-2 pb-3 border-b border-zinc-800">
                        <Zap className="w-5 h-5 text-amber-400" />
                        <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                          Pre-flight Cost & Token Audit
                        </h3>
                      </div>

                      <div className="space-y-3 text-xs">
                        <div className="flex justify-between py-1 border-b border-zinc-800/60">
                          <span className="text-zinc-400">Selected Test Suite:</span>
                          <span className="font-bold text-white">{selectedEvalPresets.length} benchmarks</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-zinc-800/60">
                          <span className="text-zinc-400">Target AI Engine:</span>
                          <span className="font-bold text-emerald-400">{activeModel}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-zinc-800/60">
                          <span className="text-zinc-400">Est. Input Tokens:</span>
                          <span className="text-zinc-300">~{costEstimate.totalInputTokens.toLocaleString()} tokens</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-zinc-800/60">
                          <span className="text-zinc-400">Est. Output Tokens:</span>
                          <span className="text-zinc-300">~{costEstimate.totalOutputTokens.toLocaleString()} tokens</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-zinc-800/60">
                          <span className="text-zinc-400">Rate ($/1M in / out):</span>
                          <span className="text-zinc-400">${modelRates.inputPerMillionUSD.toFixed(2)} / ${modelRates.outputPerMillionUSD.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between py-2 bg-emerald-500/10 border border-emerald-500/20 px-3 rounded-lg text-sm font-bold">
                          <span className="text-emerald-300">Est. Batch Cost:</span>
                          <span className="text-emerald-400">{costEstimate.formattedCost}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <button
                        onClick={handleStartEvaluation}
                        disabled={isRunning || selectedEvalPresets.length === 0}
                        className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-mono font-bold text-xs rounded-xl shadow-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                      >
                        <Play className="w-4 h-4 fill-current" />
                        Execute Batch BenchKit Benchmarks ({selectedEvalPresets.length})
                      </button>
                      <p className="text-[10px] text-zinc-500 font-mono text-center">
                        Results are evaluated live with AST verification and saved to local IndexedDB telemetry.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Subtab 2: Benchmark Results & Verification */}
              {evalSubTab === 'results' && (
                <div className="flex-1 flex flex-col overflow-hidden p-6 space-y-4">
                  {/* Status Banner when Running */}
                  {isRunning && (
                    <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-between font-mono text-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                        <div>
                          <div className="font-bold text-indigo-300">Running Benchmark Suite ({currentIndex + 1}/{selectedEvalPresets.length})</div>
                          <div className="text-[11px] text-zinc-400">Executing trace for: "{currentRunningTitle}"</div>
                        </div>
                      </div>
                      <span className="text-indigo-400 font-bold">{Math.round(((currentIndex + 1) / selectedEvalPresets.length) * 100)}% Complete</span>
                    </div>
                  )}

                  {/* Summary Scorecard */}
                  {evalReports.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono text-xs">
                      <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl">
                        <span className="text-zinc-500 text-[10px] uppercase block">Total Benchmarks</span>
                        <span className="text-lg font-bold text-white">{evalReports.length}</span>
                      </div>
                      <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl">
                        <span className="text-zinc-500 text-[10px] uppercase block">Passed (PASS)</span>
                        <span className="text-lg font-bold text-emerald-400">{passCount} / {evalReports.length}</span>
                      </div>
                      <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl">
                        <span className="text-zinc-500 text-[10px] uppercase block">Avg Accuracy Score</span>
                        <span className="text-lg font-bold text-cyan-400">{avgScore}%</span>
                      </div>
                      <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-between">
                        <div>
                          <span className="text-zinc-500 text-[10px] uppercase block">Export Report</span>
                          <span className="text-xs text-zinc-300 font-bold">JSON Audit Log</span>
                        </div>
                        <button
                          onClick={handleExportJSON}
                          className="px-3 py-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
                        >
                          <Download className="w-3.5 h-3.5" /> Export
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Detailed Results List */}
                  <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                    {evalReports.length === 0 && !isRunning && (
                      <div className="flex flex-col items-center justify-center h-64 text-center text-zinc-500 font-mono space-y-3">
                        <BarChart3 className="w-10 h-10 opacity-30" />
                        <p className="text-xs">No benchmark evaluation executed yet.</p>
                        <button
                          onClick={() => setEvalSubTab('configure')}
                          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-bold"
                        >
                          Select Benchmarks & Run Test
                        </button>
                      </div>
                    )}

                    {evalReports.map((report) => (
                      <div key={report.benchmarkId} className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-xl space-y-3 font-mono text-xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {report.verdict === 'PASS' ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            ) : report.verdict === 'PARTIAL' ? (
                              <AlertTriangle className="w-4 h-4 text-amber-400" />
                            ) : (
                              <XCircle className="w-4 h-4 text-rose-400" />
                            )}
                            <h4 className="font-bold text-white text-sm">{report.benchmarkTitle}</h4>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-zinc-400 text-[11px]">{report.latencyMs}ms • {report.formattedCost}</span>
                            <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                              report.verdict === 'PASS' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                              report.verdict === 'PARTIAL' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                              'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            }`}>
                              {report.verdict} ({report.overallScore}%)
                            </span>
                          </div>
                        </div>

                        <p className="text-zinc-300 text-[11px] leading-relaxed">
                          {report.summaryText}
                        </p>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-zinc-950 p-2.5 rounded-lg border border-zinc-800 text-[10px]">
                          <div><span className="text-zinc-500 block">Canonical Match</span> <strong className="text-emerald-400">{report.canonicalScore}%</strong></div>
                          <div><span className="text-zinc-500 block">AST Logical Match</span> <strong className="text-cyan-400">{report.astScore}%</strong></div>
                          <div><span className="text-zinc-500 block">Context Terms</span> <strong className="text-indigo-400">{report.contextIntegrityScore}%</strong></div>
                          <div><span className="text-zinc-500 block">Overthinking Penalty</span> <strong className="text-amber-400">-{report.overthinkingPenalty}%</strong></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Footer Bar */}
          <div className="px-6 py-3 border-t border-zinc-800 bg-zinc-950/80 flex items-center justify-between text-xs font-mono text-zinc-400">
            <span>OpenReason Logic & Epistemic Benchmark Repository</span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium transition-colors"
            >
              Close Hub
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
