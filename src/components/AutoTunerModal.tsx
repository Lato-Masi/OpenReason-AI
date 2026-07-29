import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Sliders, Zap, ShieldAlert, Cpu, CheckCircle2, AlertTriangle, 
  Play, RotateCcw, ArrowRight, Gauge, DollarSign, Hash, Layers, 
  Sparkles, Flame, Check, HelpCircle, Terminal, RefreshCw
} from 'lucide-react';
import { ThinkingLevel } from "@google/genai";
import { ReasoningMode, DynamicConfig, ModuleConfig, DEFAULT_DYNAMIC_CONFIG } from '../services/reasoningEngine';
import { 
  AutoTunerOptions, 
  AutoTunerResult, 
  ParameterCandidate, 
  estimateAutoTuningBudget, 
  runAutoTuningLoop 
} from '../services/autoTunerService';

interface AutoTunerModalProps {
  isOpen: boolean;
  onClose: () => void;
  activePrompt?: string;
  activeMode?: ReasoningMode;
  dynamicConfig: DynamicConfig;
  onApplyConfig: (updatedConfig: DynamicConfig) => void;
}

const PRESET_PROMPTS = [
  {
    label: "Logic & Constraint Formalization",
    prompt: "Prove that if A implies B and B implies C, and we know A is true but C is false, what can we deduce about the consistency of the premise set?"
  },
  {
    label: "Complex Code & Algorithmic Design",
    prompt: "Design an optimized sliding window algorithm in TypeScript that finds the maximum sum of subarray of size k, with edge case handling and O(n) runtime complexity."
  },
  {
    label: "Strategic Business Case Analysis",
    prompt: "Analyze the trade-offs of migrating a monolith to a serverless microservices architecture for an e-commerce platform processing 10,000 RPS. Address latency, cost, and observability."
  }
];

export const AutoTunerModal: React.FC<AutoTunerModalProps> = ({
  isOpen,
  onClose,
  activePrompt,
  activeMode = ReasoningMode.CONST_O_T,
  dynamicConfig,
  onApplyConfig
}) => {
  const [testPrompt, setTestPrompt] = useState<string>(activePrompt || PRESET_PROMPTS[0].prompt);
  const [selectedMode, setSelectedMode] = useState<ReasoningMode>(activeMode);
  const [selectedModel, setSelectedModel] = useState<string>("gemini-3.6-flash");
  const [maxLoops, setMaxLoops] = useState<number>(4);
  const [maxTokenCap, setMaxTokenCap] = useState<number>(20000);
  const [similarityThreshold, setSimilarityThreshold] = useState<number>(0.80);

  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [currentProgress, setCurrentProgress] = useState<{
    currentLoop: number;
    totalLoops: number;
    log: string;
    totalTokensSoFar: number;
  } | null>(null);

  const [logs, setLogs] = useState<string[]>([]);
  const [tunerResult, setTunerResult] = useState<AutoTunerResult | null>(null);
  const [appliedSuccess, setAppliedSuccess] = useState<boolean>(false);

  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activePrompt) {
      setTestPrompt(activePrompt);
    }
  }, [activePrompt]);

  useEffect(() => {
    if (activeMode) {
      setSelectedMode(activeMode);
    }
  }, [activeMode]);

  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // Pre-flight budget calculation
  const budget = estimateAutoTuningBudget(testPrompt, selectedMode, maxLoops, maxTokenCap);

  const handleStartAutoTuning = async () => {
    setIsRunning(true);
    setTunerResult(null);
    setLogs([]);
    setAppliedSuccess(false);

    const options: AutoTunerOptions = {
      testPrompt,
      mode: selectedMode,
      model: selectedModel,
      maxLoops,
      maxTokenCap,
      semanticSimilarityThreshold: similarityThreshold,
      dynamicConfig
    };

    try {
      const result = await runAutoTuningLoop(options, (progress) => {
        setCurrentProgress({
          currentLoop: progress.currentLoop,
          totalLoops: progress.totalLoops,
          log: progress.log,
          totalTokensSoFar: progress.totalTokensSoFar
        });
        setLogs(prev => [...prev, progress.log]);
      });

      setTunerResult(result);
      setLogs(result.summaryLog);
    } catch (err: any) {
      console.error("Auto-Tuning loop failed:", err);
      setLogs(prev => [...prev, `❌ Critical Failure: ${err?.message || String(err)}`]);
    } finally {
      setIsRunning(false);
      setCurrentProgress(null);
    }
  };

  const handleApplyOptimalConfig = () => {
    if (!tunerResult) return;
    const clonedCfg: DynamicConfig = JSON.parse(JSON.stringify(dynamicConfig));
    
    // Apply optimal config to selected mode & all modules
    clonedCfg.modeConfigs[selectedMode] = { ...tunerResult.optimalConfig };
    Object.keys(clonedCfg.moduleConfigs).forEach(key => {
      clonedCfg.moduleConfigs[key] = {
        ...clonedCfg.moduleConfigs[key],
        temperature: tunerResult.optimalConfig.temperature,
        thinkingLevel: tunerResult.optimalConfig.thinkingLevel
      };
    });

    onApplyConfig(clonedCfg);
    setAppliedSuccess(true);
    setTimeout(() => setAppliedSuccess(false), 3000);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-950/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-mono font-bold text-white tracking-wide">
                    Auto-Tuning Parameter Optimization Loop
                  </h2>
                  <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-400" /> Token Budget Protected
                  </span>
                </div>
                <p className="text-xs text-zinc-400 font-sans">
                  Rule-based sensitivity analysis, reproducibility verification, and token budget safeguard engine.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              disabled={isRunning}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1 text-zinc-200">
            {/* Top Control Panel Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Column 1: Test Prompt & Presets */}
              <div className="lg:col-span-2 space-y-3 bg-zinc-950/60 p-4 rounded-xl border border-zinc-800/80">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Terminal className="w-4 h-4 text-emerald-400" />
                    Benchmark Test Prompt
                  </label>
                  <span className="text-[10px] font-mono text-zinc-500">
                    {testPrompt.length} chars (~{Math.ceil(testPrompt.length / 3.8)} tokens)
                  </span>
                </div>

                <textarea
                  value={testPrompt}
                  onChange={(e) => setTestPrompt(e.target.value)}
                  disabled={isRunning}
                  rows={4}
                  className="w-full bg-zinc-900 border border-zinc-700/80 rounded-lg p-3 text-xs text-zinc-200 font-mono focus:outline-none focus:border-emerald-500 transition-colors disabled:opacity-50"
                  placeholder="Enter test prompt to run optimization sweep..."
                />

                {/* Preset Prompt Buttons */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">
                    Use Standard Benchmark Preset:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_PROMPTS.map((preset, idx) => (
                      <button
                        key={idx}
                        onClick={() => setTestPrompt(preset.prompt)}
                        disabled={isRunning}
                        className="px-2.5 py-1 text-[10px] font-mono bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/60 rounded-md transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Column 2: Target Configuration & Mode */}
              <div className="space-y-4 bg-zinc-950/60 p-4 rounded-xl border border-zinc-800/80">
                <h3 className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5 border-b border-zinc-800 pb-2">
                  <Cpu className="w-4 h-4 text-indigo-400" />
                  Target Mode & Model
                </h3>

                {/* Mode Select */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-zinc-400 uppercase">Reasoning Mode</label>
                  <select
                    value={selectedMode}
                    onChange={(e) => setSelectedMode(e.target.value as ReasoningMode)}
                    disabled={isRunning}
                    className="w-full bg-zinc-900 border border-zinc-700 text-xs font-mono text-zinc-200 rounded-lg p-2 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                  >
                    {Object.values(ReasoningMode).map(mode => (
                      <option key={mode} value={mode}>{mode}</option>
                    ))}
                  </select>
                </div>

                {/* Model Select */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-zinc-400 uppercase">Model</label>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    disabled={isRunning}
                    className="w-full bg-zinc-900 border border-zinc-700 text-xs font-mono text-zinc-200 rounded-lg p-2 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                  >
                    <option value="gemini-3.6-flash">gemini-3.6-flash (Fast & Cost Effective)</option>
                    <option value="gemini-3.1-pro">gemini-3.1-pro (Deep Reasoning)</option>
                  </select>
                </div>

                {/* Current Baseline Defaults Display */}
                <div className="p-2.5 bg-zinc-900/80 rounded-lg border border-zinc-800/80 text-[10px] font-mono space-y-1 text-zinc-400">
                  <div className="text-zinc-300 font-bold uppercase">Current Engine Defaults:</div>
                  <div className="flex justify-between">
                    <span>Temperature:</span>
                    <span className="text-emerald-400 font-bold">{dynamicConfig.modeConfigs[selectedMode]?.temperature ?? 0.70}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Thinking Level:</span>
                    <span className="text-indigo-400 font-bold">{dynamicConfig.modeConfigs[selectedMode]?.thinkingLevel ?? 'HIGH'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Safeguards & Constraints Sliders */}
            <div className="bg-zinc-950/80 p-5 rounded-xl border border-zinc-800 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  <h3 className="text-xs font-mono font-bold text-zinc-200 uppercase tracking-wider">
                    Optimization Controls & Token Cap Safeguards
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-amber-400/90 font-bold">
                  Prevents Uncontrolled Token Expenditure
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono">
                {/* Max Loops Cap */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-300 font-bold flex items-center gap-1">
                      <RotateCcw className="w-3.5 h-3.5 text-indigo-400" />
                      Max Loops Cap
                    </span>
                    <span className="text-indigo-400 font-bold">{maxLoops} Loops</span>
                  </div>
                  <input
                    type="range"
                    min={2}
                    max={8}
                    step={1}
                    value={maxLoops}
                    onChange={(e) => setMaxLoops(Number(e.target.value))}
                    disabled={isRunning}
                    className="w-full accent-indigo-500 cursor-pointer disabled:opacity-50"
                  />
                  <span className="text-[9px] text-zinc-500 block">
                    Hard ceiling on test loop iterations (2 to 8).
                  </span>
                </div>

                {/* Hard Token Cap */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-300 font-bold flex items-center gap-1">
                      <Hash className="w-3.5 h-3.5 text-emerald-400" />
                      Total Token Cap
                    </span>
                    <span className="text-emerald-400 font-bold">{maxTokenCap.toLocaleString()} Tokens</span>
                  </div>
                  <input
                    type="range"
                    min={5000}
                    max={50000}
                    step={2500}
                    value={maxTokenCap}
                    onChange={(e) => setMaxTokenCap(Number(e.target.value))}
                    disabled={isRunning}
                    className="w-full accent-emerald-500 cursor-pointer disabled:opacity-50"
                  />
                  <span className="text-[9px] text-zinc-500 block">
                    Cumulative budget ceiling across all test runs.
                  </span>
                </div>

                {/* Semantic Similarity Threshold */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-300 font-bold flex items-center gap-1">
                      <Gauge className="w-3.5 h-3.5 text-cyan-400" />
                      Quality Threshold
                    </span>
                    <span className="text-cyan-400 font-bold">{Math.round(similarityThreshold * 100)}% Similarity</span>
                  </div>
                  <input
                    type="range"
                    min={0.50}
                    max={0.95}
                    step={0.05}
                    value={similarityThreshold}
                    onChange={(e) => setSimilarityThreshold(Number(e.target.value))}
                    disabled={isRunning}
                    className="w-full accent-cyan-500 cursor-pointer disabled:opacity-50"
                  />
                  <span className="text-[9px] text-zinc-500 block">
                    Minimum acceptable output similarity vs baseline.
                  </span>
                </div>
              </div>

              {/* Pre-Flight Budget Estimator Card */}
              <div className="p-4 bg-zinc-900/90 rounded-xl border border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-mono">
                <div className="space-y-1">
                  <div className="text-[10px] text-zinc-400 uppercase font-bold flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                    Pre-Flight Budget Estimate:
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <div>
                      <span className="text-zinc-500 text-[10px]">Per Run: </span>
                      <strong className="text-zinc-200">~{budget.estimatedTokensPerRun.toLocaleString()} tok</strong>
                    </div>
                    <div>
                      <span className="text-zinc-500 text-[10px]">Total ({maxLoops} loops): </span>
                      <strong className="text-emerald-400">~{budget.estimatedTotalTokens.toLocaleString()} tok</strong>
                    </div>
                    <div>
                      <span className="text-zinc-500 text-[10px]">Est. Cost: </span>
                      <strong className="text-purple-300">${budget.estimatedTotalCost.toFixed(5)}</strong>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  {budget.fitsInCap ? (
                    <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-lg text-[10px] font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Budget Fits Safely Within Cap
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-lg text-[10px] font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> Auto-Clamped to {budget.recommendedMaxLoops} Loops
                    </span>
                  )}

                  <button
                    onClick={handleStartAutoTuning}
                    disabled={isRunning || !testPrompt.trim()}
                    className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold font-mono rounded-lg transition-all shadow-lg shadow-emerald-950/40 hover:scale-102 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer w-full sm:w-auto"
                  >
                    {isRunning ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Running Auto-Tuner...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-current" />
                        Start Auto-Tuning Loop
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Live Progress Bar & Execution Logs */}
            {(isRunning || logs.length > 0) && (
              <div className="space-y-3 bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-zinc-300 font-bold flex items-center gap-2">
                    <Flame className="w-4 h-4 text-emerald-400" />
                    Auto-Tuner Progression Logs
                  </span>
                  {currentProgress && (
                    <span className="text-emerald-400 font-bold">
                      Loop {currentProgress.currentLoop} of {currentProgress.totalLoops} ({currentProgress.totalTokensSoFar.toLocaleString()} / {maxTokenCap.toLocaleString()} Tokens)
                    </span>
                  )}
                </div>

                {/* Progress Bar */}
                {isRunning && currentProgress && (
                  <div className="w-full bg-zinc-900 rounded-full h-2 overflow-hidden border border-zinc-800">
                    <motion.div
                      className="bg-emerald-500 h-full"
                      initial={{ width: '0%' }}
                      animate={{ width: `${(currentProgress.currentLoop / currentProgress.totalLoops) * 100}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                )}

                {/* Terminal Console Logs */}
                <div className="p-3 bg-black/80 rounded-lg border border-zinc-800/80 font-mono text-[11px] text-zinc-300 max-h-40 overflow-y-auto space-y-1">
                  {logs.map((logLine, idx) => (
                    <div key={idx} className={logLine.includes('❌') ? 'text-rose-400 font-bold' : logLine.includes('⚠️') ? 'text-amber-300' : 'text-zinc-300'}>
                      {logLine}
                    </div>
                  ))}
                  <div ref={logEndRef} />
                </div>
              </div>
            )}

            {/* Results Matrix & Sensitivity Heatmap */}
            {tunerResult && (
              <div className="space-y-6 pt-2">
                {/* Result Overview Banner */}
                <div className="p-4 bg-zinc-950/90 rounded-xl border border-emerald-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 font-mono">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded text-[10px] font-bold">
                        {tunerResult.status}
                      </span>
                      <h4 className="text-sm font-bold text-white">
                        Completed {tunerResult.loopsCompleted} Loops | Total Tokens: {tunerResult.totalTokensSpent.toLocaleString()} | Est. Cost: ${tunerResult.totalCostSpent.toFixed(5)}
                      </h4>
                    </div>
                    <p className="text-xs text-zinc-400 font-sans">
                      Baseline Reproducibility: {tunerResult.baselineReproducibility.passed ? 'Passed ✓' : 'Uncertain'} (Similarity: {(tunerResult.baselineReproducibility.similarityScore * 100).toFixed(1)}%)
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleApplyOptimalConfig}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold font-mono rounded-lg transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-950/50"
                    >
                      {appliedSuccess ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-white" />
                          Parameters Applied!
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Apply Optimized Config to Engine
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Candidate Comparison Matrix */}
                <div className="space-y-3">
                  <h4 className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2 border-b border-zinc-800 pb-2">
                    <Layers className="w-4 h-4 text-indigo-400" />
                    Tested Parameter Candidate Sensitivity Matrix
                  </h4>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left font-mono text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-zinc-800 bg-zinc-950/80 text-zinc-400 text-[10px] uppercase">
                          <th className="p-2.5">Loop / Strategy</th>
                          <th className="p-2.5">Temp</th>
                          <th className="p-2.5">Thinking</th>
                          <th className="p-2.5">Tokens</th>
                          <th className="p-2.5">Cost</th>
                          <th className="p-2.5">Similarity</th>
                          <th className="p-2.5">Confidence</th>
                          <th className="p-2.5 text-right">Composite Score</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/60 bg-zinc-900/40">
                        {tunerResult.candidatesTested.map((candidate, idx) => {
                          const isOptimal = candidate.configTested.temperature === tunerResult.optimalConfig.temperature &&
                                            candidate.configTested.thinkingLevel === tunerResult.optimalConfig.thinkingLevel;

                          return (
                            <tr key={idx} className={`hover:bg-zinc-800/40 transition-colors ${isOptimal ? 'bg-emerald-500/10 border-l-2 border-emerald-500' : ''}`}>
                              <td className="p-2.5">
                                <div className="font-bold text-zinc-200 flex items-center gap-1.5">
                                  <span>Loop {candidate.loopIndex}</span>
                                  {isOptimal && (
                                    <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 text-[9px] font-bold rounded border border-emerald-500/30">
                                      OPTIMAL
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-zinc-500 block truncate max-w-[200px]">
                                  {candidate.description}
                                </span>
                              </td>

                              <td className="p-2.5 text-emerald-400 font-bold">
                                {candidate.configTested.temperature}
                              </td>

                              <td className="p-2.5 text-indigo-400">
                                {candidate.configTested.thinkingLevel}
                              </td>

                              <td className="p-2.5 text-zinc-300">
                                {candidate.tokensUsed.toLocaleString()}
                              </td>

                              <td className="p-2.5 text-purple-300">
                                ${candidate.costIncurred.toFixed(5)}
                              </td>

                              <td className="p-2.5 font-bold">
                                <span className={candidate.semanticSimilarityToBaseline >= similarityThreshold ? 'text-emerald-400' : 'text-amber-400'}>
                                  {(candidate.semanticSimilarityToBaseline * 100).toFixed(1)}%
                                </span>
                              </td>

                              <td className="p-2.5 text-cyan-400">
                                {Math.round(candidate.confidence * 100)}%
                              </td>

                              <td className="p-2.5 text-right font-bold text-white">
                                {candidate.score.toFixed(3)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Optimal Config Spotlight Box */}
                <div className="p-4 bg-zinc-950/90 rounded-xl border border-indigo-500/30 space-y-3 font-mono">
                  <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-indigo-400" />
                      Optimized Parameter Recommendations vs Defaults
                    </span>
                    <span className="text-[10px] text-zinc-500">Mode: {selectedMode}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div className="p-3 bg-zinc-900 rounded-lg border border-zinc-800 space-y-1">
                      <span className="text-[10px] text-zinc-400 uppercase">Recommended Temperature</span>
                      <div className="flex items-center gap-2">
                        <span className="line-through text-zinc-500">{tunerResult.initialConfig.temperature}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400 font-bold text-sm">{tunerResult.optimalConfig.temperature}</span>
                      </div>
                    </div>

                    <div className="p-3 bg-zinc-900 rounded-lg border border-zinc-800 space-y-1">
                      <span className="text-[10px] text-zinc-400 uppercase">Thinking Level</span>
                      <div className="flex items-center gap-2">
                        <span className="line-through text-zinc-500">{tunerResult.initialConfig.thinkingLevel}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
                        <span className="text-indigo-400 font-bold text-sm">{tunerResult.optimalConfig.thinkingLevel}</span>
                      </div>
                    </div>

                    <div className="p-3 bg-zinc-900 rounded-lg border border-zinc-800 space-y-1">
                      <span className="text-[10px] text-zinc-400 uppercase">Target Semantic Similarity</span>
                      <div className="text-cyan-400 font-bold text-sm">
                        {(tunerResult.baselineReproducibility.similarityScore * 100).toFixed(1)}% Score
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-950/60 flex items-center justify-between font-mono text-xs text-zinc-400">
            <span>
              Engine Safeguards: <strong className="text-emerald-400">Active</strong>
            </span>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
