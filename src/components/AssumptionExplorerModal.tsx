import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, GitFork, CheckCircle2, AlertTriangle, XCircle, HelpCircle, RefreshCw, Sparkles, FileText, Layers, ShieldCheck } from 'lucide-react';
import { AssumptionAnalysisResult } from '../types';
import { analyzeAssumptions } from '../services/assumptionService';

interface AssumptionExplorerModalProps {
  isOpen: boolean;
  onClose: () => void;
  prompt: string;
  selectedModel?: string;
  initialAnalysis?: AssumptionAnalysisResult | null;
}

export const AssumptionExplorerModal: React.FC<AssumptionExplorerModalProps> = ({
  isOpen,
  onClose,
  prompt,
  selectedModel = 'gemini-3.6-flash',
  initialAnalysis
}) => {
  const [analysis, setAnalysis] = useState<AssumptionAnalysisResult | null>(initialAnalysis || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'assumptions' | 'validations' | 'profiles' | 'interpretations'>('assumptions');

  if (!isOpen) return null;

  const handleRunAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await analyzeAssumptions(prompt, selectedModel);
      setAnalysis(res);
    } catch (err: any) {
      console.error('Assumption analysis failed:', err);
      setError(err?.message || 'Failed to execute assumption analysis.');
    } finally {
      setLoading(false);
    }
  };

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
              <div className="p-2.5 bg-gradient-to-br from-indigo-500/20 to-emerald-500/20 border border-indigo-500/30 rounded-xl text-indigo-400">
                <GitFork className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  OpenReason Assumption Validation & Profile Engine
                  <span className="px-2 py-0.5 text-[10px] font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full">
                    Epistemic Audit
                  </span>
                </h2>
                <p className="text-xs text-zinc-400">
                  Explicit/implicit assumption extraction, validity & consistency auditing, and probabilistic profile branching.
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

          {/* Navigation Bar */}
          <div className="px-6 py-3 border-b border-zinc-800 bg-zinc-950/40 flex items-center justify-between gap-3 text-xs font-mono overflow-x-auto">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('assumptions')}
                className={`px-3 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors ${
                  activeTab === 'assumptions'
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                    : 'bg-zinc-800/60 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <FileText className="w-4 h-4 text-indigo-400" />
                Assumptions ({analysis?.assumptions.length || 0})
              </button>

              <button
                onClick={() => setActiveTab('validations')}
                className={`px-3 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors ${
                  activeTab === 'validations'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-zinc-800/60 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Validation Audit ({analysis?.validations.length || 0})
              </button>

              <button
                onClick={() => setActiveTab('profiles')}
                className={`px-3 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors ${
                  activeTab === 'profiles'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    : 'bg-zinc-800/60 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <GitFork className="w-4 h-4 text-purple-400" />
                Probabilistic Profiles ({analysis?.profiles.length || 0})
              </button>

              <button
                onClick={() => setActiveTab('interpretations')}
                className={`px-3 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors ${
                  activeTab === 'interpretations'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : 'bg-zinc-800/60 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Layers className="w-4 h-4 text-cyan-400" />
                Interpretations
              </button>
            </div>

            <button
              onClick={handleRunAnalysis}
              disabled={loading}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg flex items-center gap-1.5 text-xs font-mono transition-colors border border-zinc-700 shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
              Re-Audit Assumptions
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-zinc-900/50">
            {!analysis && !loading && (
              <div className="flex flex-col items-center justify-center h-64 text-center space-y-4">
                <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-400">
                  <GitFork className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-200">No Assumption Audit Generated</h3>
                  <p className="text-xs text-zinc-400 max-w-md mt-1">
                    Execute explicit assumption extraction, consistency validation, and probabilistic branching for this problem.
                  </p>
                </div>
                <button
                  onClick={handleRunAnalysis}
                  className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white font-medium text-xs rounded-xl shadow-lg flex items-center gap-2 transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  Run Assumption Audit
                </button>
              </div>
            )}

            {loading && (
              <div className="flex flex-col items-center justify-center h-64 space-y-3">
                <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
                <span className="text-xs font-mono text-zinc-300">
                  Extracting implicit assumptions & evaluating consistency...
                </span>
              </div>
            )}

            {error && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {analysis && !loading && (
              <>
                {activeTab === 'assumptions' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {analysis.assumptions.map((asm) => (
                      <div key={asm.id} className="p-4 bg-zinc-950/80 rounded-xl border border-zinc-800 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 text-[10px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded font-bold uppercase">
                            {asm.id} • {asm.type}
                          </span>
                          <span className="px-2 py-0.5 text-[10px] font-mono bg-zinc-800 text-zinc-400 rounded uppercase">
                            {asm.category}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-200 font-medium leading-relaxed">
                          "{asm.statement}"
                        </p>
                        <div className="space-y-1.5 pt-2 border-t border-zinc-800">
                          <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                            <span>Initial Confidence:</span>
                            <span className="text-indigo-400 font-bold">{Math.round(asm.confidence * 100)}%</span>
                          </div>
                          <p className="text-[11px] text-zinc-400 italic">
                            Justification: {asm.justification}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'validations' && (
                  <div className="space-y-3">
                    {analysis.validations.map((val) => {
                      const asm = analysis.assumptions.find(a => a.id === val.assumptionId);
                      return (
                        <div key={val.assumptionId} className="p-4 bg-zinc-950/80 rounded-xl border border-zinc-800 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {val.verdict === 'VALID' ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              ) : val.verdict === 'QUESTIONABLE' ? (
                                <AlertTriangle className="w-4 h-4 text-amber-400" />
                              ) : (
                                <XCircle className="w-4 h-4 text-rose-400" />
                              )}
                              <span className="text-xs font-bold font-mono text-zinc-200">{val.assumptionId}</span>
                            </div>
                            <span className={`px-2.5 py-0.5 text-[10px] font-mono rounded-full font-bold uppercase ${
                              val.verdict === 'VALID' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                              val.verdict === 'QUESTIONABLE' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                              'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            }`}>
                              {val.verdict}
                            </span>
                          </div>

                          {asm && (
                            <p className="text-xs text-zinc-300">
                              <strong className="text-zinc-500 font-mono">Statement:</strong> "{asm.statement}"
                            </p>
                          )}

                          <div className="grid grid-cols-2 gap-3 text-xs font-mono bg-zinc-900/80 p-2.5 rounded-lg border border-zinc-800">
                            <div>
                              <span className="text-zinc-500 text-[10px] block uppercase">Consistency Score</span>
                              <span className="font-bold text-emerald-400">{Math.round(val.consistencyScore * 100)}%</span>
                            </div>
                            <div>
                              <span className="text-zinc-500 text-[10px] block uppercase">Relevance Score</span>
                              <span className="font-bold text-cyan-400">{Math.round(val.relevanceScore * 100)}%</span>
                            </div>
                          </div>

                          {val.empiricalEvidence && (
                            <div className="text-[11px] text-zinc-300 font-mono bg-emerald-500/5 border border-emerald-500/20 p-2.5 rounded-lg">
                              <strong className="text-emerald-400 block text-[9px] uppercase">Empirical Evidence / Verification:</strong>
                              {val.empiricalEvidence}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {activeTab === 'profiles' && (
                  <div className="space-y-4">
                    {analysis.profiles.map((prof) => {
                      const probPct = Math.round(prof.probability * 100);
                      return (
                        <div key={prof.profileId} className="p-4 bg-zinc-950/80 rounded-xl border border-zinc-800 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <GitFork className="w-4 h-4 text-purple-400" />
                              <h4 className="text-sm font-bold text-white font-mono">{prof.title}</h4>
                            </div>
                            <span className="text-xs font-mono font-bold text-purple-400">{probPct}% Weight</span>
                          </div>

                          {/* Probability Progress Bar */}
                          <div className="w-full bg-zinc-900 rounded-full h-2 border border-zinc-800 overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${probPct}%` }}
                              className="h-full bg-gradient-to-r from-purple-500 to-indigo-500"
                            />
                          </div>

                          <p className="text-xs text-zinc-300">
                            {prof.description}
                          </p>

                          <div className="p-3 bg-zinc-900/80 rounded-lg border border-zinc-800 space-y-1 text-xs font-mono">
                            <strong className="text-purple-400 text-[10px] uppercase block">Branching Strategy:</strong>
                            <p className="text-zinc-300">{prof.reasoningBranch}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {activeTab === 'interpretations' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl space-y-2">
                      <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider font-mono flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                        Primary Problem Interpretation
                      </h4>
                      <p className="text-xs text-zinc-200 leading-relaxed font-mono">
                        {analysis.primaryInterpretation}
                      </p>
                    </div>

                    <div className="p-4 bg-zinc-950/80 border border-zinc-800 rounded-xl space-y-3">
                      <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider font-mono flex items-center gap-2">
                        <Layers className="w-4 h-4 text-cyan-400" />
                        Alternative Interpretations Under Differing Assumption Sets
                      </h4>
                      <div className="space-y-2">
                        {analysis.alternativeInterpretations.map((interp, idx) => (
                          <div key={idx} className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-300 font-mono">
                            <span className="text-cyan-400 font-bold mr-2">#{idx + 1}</span>
                            {interp}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-zinc-800 bg-zinc-950/80 flex items-center justify-between text-xs font-mono text-zinc-400">
            <span>OpenReason Assumption & Epistemic Audit Matrix</span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium transition-colors"
            >
              Close Auditor
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
