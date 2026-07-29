import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Play, 
  CheckSquare, 
  Square, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Cpu, 
  Zap, 
  DollarSign, 
  Hash, 
  BarChart3, 
  Download, 
  Layers, 
  Clock, 
  Sparkles, 
  ShieldAlert,
  ListFilter,
  Check,
  ChevronRight,
  Code2
} from 'lucide-react';
import { BENCHMARK_PRESETS, BenchmarkPreset } from '../data/benchmarkPresets';
import { estimateBenchmarkCosts, calculateActualCost, getModelPriceRate } from '../services/costEstimator';
import { evaluateBenchmarkResult, EvaluationReport } from '../services/evaluator';
import { processReasoning, ReasoningMode, ReasoningResult, DynamicConfig } from '../services/reasoningEngine';
import { saveBenchmarkReport } from '../services/db';

interface BenchmarkEvalModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeModel: string;
  dynamicConfig?: DynamicConfig;
  isDynamicMode?: boolean;
}

export const BenchmarkEvalModal: React.FC<BenchmarkEvalModalProps> = ({
  isOpen,
  onClose,
  activeModel,
  dynamicConfig,
  isDynamicMode = true
}) => {
  // Checkbox selection state (default select 2 classical benchmarks to prevent accidental full-run token costs)
  const [selectedIds, setSelectedIds] = useState<string[]>(['zebra-puzzle', 'kinship-datalog']);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  // Execution State
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [currentRunningTitle, setCurrentRunningTitle] = useState<string>('');
  const [evalReports, setEvalReports] = useState<EvaluationReport[]>([]);
  const [activeTab, setActiveTab] = useState<'configure' | 'results'>('configure');

  if (!isOpen) return null;

  const categories = [
    'All',
    'Epistemic & Hallucination Traps',
    'Epistemic & Modality Suite (Temporal, Modal, Spatial, Bayesian, Game Theory, Meta-Epistemic)',
    'BenchKit Standard Suite (GSM8K, HumanEval, LogiQA, ARC, AIME)',
    'Logic Programming (Prolog/Datalog/kanren)',
    'Constraint Reasoning (Const-o-T)',
    'Business Strategy',
    'Coding & Algorithms'
  ];

  const filteredPresets = BENCHMARK_PRESETS.filter(
    p => {
      if (selectedCategory === 'All') return true;
      if (selectedCategory === 'Epistemic & Hallucination Traps') return Boolean(p.groundTruth.isEpistemicTrap);
      return p.category === selectedCategory;
    }
  );

  const selectedPresets = BENCHMARK_PRESETS.filter(p => selectedIds.includes(p.id));

  // Pre-flight cost estimation
  const costEstimate = estimateBenchmarkCosts(
    activeModel,
    selectedPresets.map(p => ({
      estimatedInputTokens: p.groundTruth.estimatedInputTokens,
      estimatedOutputTokens: p.groundTruth.estimatedOutputTokens
    }))
  );

  const modelRates = getModelPriceRate(activeModel);

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

  // Run Benchmark Evaluation Suite
  const handleStartEvaluation = async () => {
    if (selectedPresets.length === 0) return;

    setIsRunning(true);
    setEvalReports([]);
    setActiveTab('results');
    setCurrentIndex(0);

    const reports: EvaluationReport[] = [];

    for (let i = 0; i < selectedPresets.length; i++) {
      const preset = selectedPresets[i];
      setCurrentIndex(i);
      setCurrentRunningTitle(preset.title);

      const startTime = performance.now();
      try {
        // Execute reasoning engine for benchmark
        const result: ReasoningResult = await processReasoning(
          preset.prompt,
          undefined,
          { model: activeModel, dynamicConfig }
        );

        const endTime = performance.now();
        const latencyMs = Math.round(endTime - startTime);

        // Calculate actual token consumption & cost
        let inTokens = 0;
        let outTokens = 0;
        for (const step of result.steps) {
          inTokens += step.inputTokens || Math.ceil((step.rawPrompt || '').length / 3.8);
          outTokens += step.outputTokens || Math.ceil((step.content || '').length / 3.8);
        }

        const costCalc = calculateActualCost(activeModel, inTokens, outTokens);

        // Run embedded BenchKit evaluator
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
        // Create fail report
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

  // Export JSON Report
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
  const totalActualCost = evalReports.reduce((acc, r) => acc + r.actualCostUSD, 0);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-zinc-950 border border-zinc-800 rounded-xl w-full max-w-5xl h-[92vh] max-h-[880px] flex flex-col shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/70">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                <BarChart3 className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-zinc-100">
                    BenchKit Reasoning Benchmark Framework
                  </h2>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                    AST Match Evaluator
                  </span>
                </div>
                <p className="text-xs text-zinc-400 flex items-center gap-2 mt-0.5">
                  <span>Testing Active Model:</span>
                  <span className="font-mono font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded">
                    {activeModel}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Tab Navigation */}
              <div className="flex items-center bg-zinc-900 rounded-lg p-1 border border-zinc-800">
                <button
                  onClick={() => setActiveTab('configure')}
                  className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                    activeTab === 'configure' 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Configure Suite
                </button>
                <button
                  onClick={() => setActiveTab('results')}
                  className={`px-3 py-1 rounded text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    activeTab === 'results' 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <span>Results</span>
                  {evalReports.length > 0 && (
                    <span className="px-1.5 py-0.2 text-[9px] font-mono rounded bg-emerald-500/30 text-emerald-300">
                      {evalReports.length}
                    </span>
                  )}
                </button>
              </div>

              <button 
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modal Main Content */}
          {activeTab === 'configure' ? (
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
              {/* Left Column: Benchmark Selection Panel */}
              <div className="w-full md:w-7/12 border-b md:border-b-0 md:border-r border-zinc-800 flex flex-col overflow-hidden bg-zinc-950/60">
                {/* Category & Select Controls */}
                <div className="p-3 border-b border-zinc-800/80 bg-zinc-900/30 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400 font-mono text-[10px] uppercase font-bold flex items-center gap-1">
                      <ListFilter className="w-3 h-3 text-emerald-400" />
                      Filter & Select Benchmarks
                    </span>
                    <button
                      onClick={toggleSelectAll}
                      className="text-[11px] font-mono text-emerald-400 hover:underline flex items-center gap-1"
                    >
                      {selectedIds.length === filteredPresets.length ? 'Deselect All' : 'Select All Filtered'}
                    </button>
                  </div>

                  <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
                    {categories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-2 py-1 rounded text-[11px] font-medium whitespace-nowrap transition-all ${
                          selectedCategory === cat 
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/40' 
                            : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-zinc-200'
                        }`}
                      >
                        {cat === 'All' ? 'All Categories' : cat.startsWith('BenchKit') ? 'BenchKit Suite' : cat.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Benchmark Checklist List */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {filteredPresets.map(preset => {
                    const isSelected = selectedIds.includes(preset.id);
                    return (
                      <div
                        key={preset.id}
                        onClick={() => togglePresetId(preset.id)}
                        className={`p-3 rounded-lg border cursor-pointer transition-all flex items-start gap-3 ${
                          isSelected
                            ? 'bg-zinc-900 border-emerald-500/50 shadow-md ring-1 ring-emerald-500/20'
                            : 'bg-zinc-900/30 border-zinc-800/60 hover:bg-zinc-900/60 hover:border-zinc-700'
                        }`}
                      >
                        <button className="mt-0.5 text-emerald-400">
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Square className="w-4 h-4 text-zinc-600" />
                          )}
                        </button>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="text-xs font-bold text-zinc-200 line-clamp-1">
                                {preset.title}
                              </span>
                              {preset.groundTruth.isEpistemicTrap && (
                                <span className="text-[8px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 shrink-0">
                                  🛡️ Hallucination Trap
                                </span>
                              )}
                            </div>
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 shrink-0">
                              ~{preset.groundTruth.estimatedInputTokens + preset.groundTruth.estimatedOutputTokens} tokens
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-400 line-clamp-1 mb-1.5">
                            {preset.description}
                          </p>
                          <div className="flex flex-wrap items-center gap-1.5 text-[9px] font-mono">
                            <span className="text-cyan-400 font-semibold">{preset.category.split(' ')[0]}</span>
                            <span className="text-zinc-600">•</span>
                            <span className="text-emerald-400">{preset.suggestedMode}</span>
                            <span className="text-zinc-600">•</span>
                            <span className="text-zinc-400">{preset.groundTruth.requiredASTNodes.length} AST nodes</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Pre-Flight Token & Cost Safeguard Panel */}
              <div className="w-full md:w-5/12 flex flex-col justify-between p-4 sm:p-5 bg-zinc-900/20 overflow-y-auto space-y-4">
                <div className="space-y-4">
                  {/* Title */}
                  <div className="border-b border-zinc-800/80 pb-3">
                    <h3 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5 mb-1">
                      <ShieldAlert className="w-4 h-4 text-amber-400" />
                      Cost & Token Safety Protection
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Before executing reasoning evaluations, OpenReason estimates prompt and generation token volumes to prevent unexpected API costs.
                    </p>
                  </div>

                  {/* Active Model & Price Rates */}
                  <div className="p-3.5 bg-zinc-950 rounded-lg border border-zinc-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-400 font-mono text-[10px] uppercase">Active Target Model:</span>
                      <span className="font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                        {activeModel}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800/80 text-[11px] font-mono">
                      <div>
                        <span className="text-zinc-500 block text-[9px]">Input Token Rate:</span>
                        <span className="text-zinc-200 font-bold">${modelRates.inputPerMillionUSD.toFixed(3)} / 1M</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 block text-[9px]">Output Token Rate:</span>
                        <span className="text-zinc-200 font-bold">${modelRates.outputPerMillionUSD.toFixed(3)} / 1M</span>
                      </div>
                    </div>
                  </div>

                  {/* Estimated Token Consumption Breakdown */}
                  <div className="p-4 bg-zinc-950 rounded-lg border border-zinc-800/80 space-y-3">
                    <span className="text-[10px] font-mono uppercase text-zinc-400 font-bold block">
                      Estimated Pre-Flight Usage ({selectedPresets.length} selected)
                    </span>

                    <div className="grid grid-cols-2 gap-3 font-mono">
                      <div className="p-2.5 bg-zinc-900/60 rounded border border-zinc-800">
                        <span className="text-[9px] text-zinc-500 block">Est. Input Tokens</span>
                        <span className="text-sm font-bold text-blue-400">{costEstimate.totalInputTokens.toLocaleString()}</span>
                      </div>
                      <div className="p-2.5 bg-zinc-900/60 rounded border border-zinc-800">
                        <span className="text-[9px] text-zinc-500 block">Est. Output Tokens</span>
                        <span className="text-sm font-bold text-emerald-400">{costEstimate.totalOutputTokens.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between">
                      <span className="text-xs text-zinc-400 font-mono">Max Projected Cost:</span>
                      <span className="text-base font-bold font-mono text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded border border-amber-500/30">
                        {costEstimate.formattedCost}
                      </span>
                    </div>
                  </div>

                  {/* Safety Notice */}
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-300 text-[11px] leading-relaxed flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>
                      One model is tested at a time. Reasoning pipelines execute step-by-step with real API calls.
                    </span>
                  </div>
                </div>

                {/* Start Action Button */}
                <button
                  onClick={handleStartEvaluation}
                  disabled={selectedPresets.length === 0 || isRunning}
                  className="w-full py-3 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-800 text-black disabled:text-zinc-600 font-bold text-xs transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4 fill-black" />
                  <span>Execute {selectedPresets.length} Benchmark Evaluations ({costEstimate.formattedCost})</span>
                </button>
              </div>
            </div>
          ) : (
            /* Results Tab: Live Running & Leaderboard Dashboard */
            <div className="flex-1 flex flex-col overflow-y-auto p-4 sm:p-5 space-y-4 bg-zinc-950">
              {/* Progress Bar when running */}
              {isRunning && (
                <div className="p-4 bg-zinc-900 border border-emerald-500/40 rounded-xl space-y-2 animate-pulse">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-emerald-400 font-bold flex items-center gap-2">
                      <Sparkles className="w-4 h-4 animate-spin text-emerald-400" />
                      Evaluating Benchmark {currentIndex + 1} of {selectedPresets.length}: {currentRunningTitle}
                    </span>
                    <span className="text-zinc-400">
                      {Math.round(((currentIndex) / selectedPresets.length) * 100)}% Complete
                    </span>
                  </div>
                  <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                      style={{ width: `${((currentIndex + 1) / selectedPresets.length) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 bg-zinc-900/80 border border-zinc-800 rounded-lg">
                  <span className="text-[9px] font-mono text-zinc-500 uppercase font-semibold block mb-1">
                    Tested Benchmarks
                  </span>
                  <div className="text-xl font-bold font-mono text-zinc-100">
                    {evalReports.length} / {selectedPresets.length}
                  </div>
                </div>

                <div className="p-3.5 bg-zinc-900/80 border border-zinc-800 rounded-lg">
                  <span className="text-[9px] font-mono text-zinc-500 uppercase font-semibold block mb-1">
                    Pass Accuracy Rate
                  </span>
                  <div className={`text-xl font-bold font-mono ${
                    avgScore >= 80 ? 'text-emerald-400' : avgScore >= 50 ? 'text-amber-400' : 'text-red-400'
                  }`}>
                    {avgScore}% ({passCount} Pass)
                  </div>
                </div>

                <div className="p-3.5 bg-zinc-900/80 border border-zinc-800 rounded-lg">
                  <span className="text-[9px] font-mono text-zinc-500 uppercase font-semibold block mb-1">
                    Total Tokens Used
                  </span>
                  <div className="text-xl font-bold font-mono text-blue-400">
                    {evalReports.reduce((acc, r) => acc + r.totalTokens, 0).toLocaleString()}
                  </div>
                </div>

                <div className="p-3.5 bg-zinc-900/80 border border-zinc-800 rounded-lg">
                  <span className="text-[9px] font-mono text-zinc-500 uppercase font-semibold block mb-1">
                    Total Execution Cost
                  </span>
                  <div className="text-xl font-bold font-mono text-amber-400">
                    ${totalActualCost.toFixed(5)}
                  </div>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <span className="text-xs font-mono text-zinc-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-emerald-400" />
                  BenchKit AST Evaluation Ledger
                </span>

                <div className="flex items-center gap-2">
                  {evalReports.length > 0 && (
                    <button
                      onClick={handleExportJSON}
                      className="px-3 py-1.5 rounded bg-zinc-900 hover:bg-zinc-800 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-semibold transition-all flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export JSON Report</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Reports List */}
              <div className="space-y-4">
                {evalReports.length === 0 ? (
                  <div className="py-12 text-center text-zinc-500 text-xs font-mono">
                    No evaluations executed yet. Select benchmarks in the "Configure Suite" tab and click Execute.
                  </div>
                ) : (
                  evalReports.map((report, idx) => (
                    <div 
                      key={report.benchmarkId + idx}
                      className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl space-y-3"
                    >
                      {/* Top Title & Verdict */}
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-zinc-100">
                              {idx + 1}. {report.benchmarkTitle}
                            </span>
                            <span className="text-[9px] font-mono text-zinc-500">
                              ({report.latencyMs}ms • {report.formattedCost})
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-400 font-mono">
                            {report.summaryText}
                          </p>
                        </div>

                        {/* Verdict Badge */}
                        <div>
                          {report.verdict === 'PASS' ? (
                            <span className="px-2.5 py-1 rounded text-xs font-bold font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              PASS ({report.overallScore}%)
                            </span>
                          ) : report.verdict === 'PARTIAL' ? (
                            <span className="px-2.5 py-1 rounded text-xs font-bold font-mono bg-amber-500/15 text-amber-400 border border-amber-500/40 flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              PARTIAL ({report.overallScore}%)
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded text-xs font-bold font-mono bg-red-500/15 text-red-400 border border-red-500/40 flex items-center gap-1">
                              <XCircle className="w-3.5 h-3.5" />
                              FAIL ({report.overallScore}%)
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Epistemic & Hallucination Audit Callout */}
                      {report.isEpistemicTrap && (
                        <div className={`p-3 rounded-lg border text-xs font-mono space-y-1 ${
                          report.hallucinationDetected
                            ? 'bg-red-500/15 border-red-500/40 text-red-300'
                            : report.epistemicBehaviorMatched
                            ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                            : 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                        }`}>
                          <div className="font-bold flex items-center gap-1.5">
                            {report.hallucinationDetected ? (
                              <span className="text-red-400 flex items-center gap-1">
                                <AlertTriangle className="w-4 h-4 shrink-0" /> 🚨 FATAL FLAW: Hallucination Manufactured
                              </span>
                            ) : report.epistemicBehaviorMatched ? (
                              <span className="text-emerald-400 flex items-center gap-1">
                                <CheckCircle2 className="w-4 h-4 shrink-0" /> 🛡️ Epistemic Safety & Refusal Verified
                              </span>
                            ) : (
                              <span className="text-amber-400 flex items-center gap-1">
                                <AlertTriangle className="w-4 h-4 shrink-0" /> ⚠️ Epistemic Warning
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] leading-relaxed opacity-90">
                            {report.epistemicNotes}
                          </div>
                        </div>
                      )}

                      {/* Score Metrics Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 font-mono text-[10px]">
                        {report.isEpistemicTrap ? (
                          <div className="p-2 bg-zinc-950 rounded border border-amber-500/30">
                            <span className="text-amber-400 font-bold block">Epistemic Rigor</span>
                            <span className={`text-xs font-bold ${report.epistemicScore === 100 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {report.epistemicScore}%
                            </span>
                          </div>
                        ) : (
                          <div className="p-2 bg-zinc-950 rounded border border-zinc-800/80">
                            <span className="text-zinc-500 block">Canonical Match</span>
                            <span className="text-xs font-bold text-emerald-400">{report.canonicalScore}%</span>
                          </div>
                        )}
                        <div className="p-2 bg-zinc-950 rounded border border-zinc-800/80">
                          <span className="text-zinc-500 block">AST Structural</span>
                          <span className="text-xs font-bold text-cyan-400">{report.astScore}%</span>
                        </div>
                        <div className="p-2 bg-zinc-950 rounded border border-zinc-800/80">
                          <span className="text-zinc-500 block">Keyword Recall</span>
                          <span className="text-xs font-bold text-purple-400">{report.keywordScore}%</span>
                        </div>
                        <div className="p-2 bg-zinc-950 rounded border border-zinc-800/80">
                          <span className="text-zinc-500 block">Context Integrity</span>
                          <span className="text-xs font-bold text-blue-400">{report.contextIntegrityScore}%</span>
                        </div>
                        <div className="p-2 bg-zinc-950 rounded border border-zinc-800/80">
                          <span className="text-zinc-500 block">Loop Penalty</span>
                          <span className="text-xs font-bold text-rose-400">-{report.overthinkingPenalty}</span>
                        </div>
                      </div>

                      {/* Canonical Key Match Details */}
                      {report.canonicalMatches.length > 0 && (
                        <div className="p-3 bg-zinc-950 rounded border border-zinc-800/80 space-y-1.5 font-mono text-[11px]">
                          <span className="text-[10px] text-zinc-500 uppercase font-bold block">
                            Canonical Solution Key Matches:
                          </span>
                          <div className="space-y-1">
                            {report.canonicalMatches.map((m, i) => (
                              <div key={i} className="flex items-center justify-between text-xs">
                                <span className="text-zinc-400">
                                  • <strong className="text-zinc-200">{m.key}</strong>: Expected [{m.expectedValues.join(', ')}]
                                </span>
                                {m.matched ? (
                                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                                    <Check className="w-3 h-3" /> Matched ({m.extractedValue})
                                  </span>
                                ) : (
                                  <span className="text-red-400 font-bold flex items-center gap-1">
                                    <X className="w-3 h-3" /> Missing / Mismatched
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* AST Node Details */}
                      {report.astMatches.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 font-mono text-[10px]">
                          <span className="text-zinc-500">AST Structural Nodes:</span>
                          {report.astMatches.map((node, i) => (
                            <span 
                              key={i}
                              className={`px-1.5 py-0.5 rounded border ${
                                node.found 
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                                  : 'bg-red-500/10 text-red-400 border-red-500/30'
                              }`}
                            >
                              {node.found ? '✓' : '✗'} {node.nodeName}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
