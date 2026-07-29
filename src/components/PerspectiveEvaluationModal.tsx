import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Layers, ShieldCheck, Zap, AlertTriangle, Users, Compass, RefreshCw, Sparkles, CheckCircle } from 'lucide-react';
import { MultiPerspectiveResult } from '../types';
import { evaluateMultiPerspective } from '../services/perspectiveEvaluatorService';

interface PerspectiveEvaluationModalProps {
  isOpen: boolean;
  onClose: () => void;
  prompt: string;
  finalAnswer: string;
  selectedModel?: string;
  initialResult?: MultiPerspectiveResult | null;
}

export const PerspectiveEvaluationModal: React.FC<PerspectiveEvaluationModalProps> = ({
  isOpen,
  onClose,
  prompt,
  finalAnswer,
  selectedModel = 'gemini-3.6-flash',
  initialResult
}) => {
  const [result, setResult] = useState<MultiPerspectiveResult | null>(initialResult || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRunEvaluation = async () => {
    setLoading(true);
    setError(null);
    try {
      const evalRes = await evaluateMultiPerspective(prompt, finalAnswer, selectedModel);
      setResult(evalRes);
    } catch (err: any) {
      console.error('Multi-perspective evaluation failed:', err);
      setError(err?.message || 'Failed to run evaluation.');
    } finally {
      setLoading(false);
    }
  };

  const dimensions = result ? [
    { name: 'Feasibility', key: 'feasibility', icon: Zap, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', data: result.feasibility },
    { name: 'Impact & Leverage', key: 'impact', icon: Sparkles, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', data: result.impact },
    { name: 'Risk & Safety', key: 'risk', icon: ShieldCheck, color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20', data: result.risk },
    { name: 'Stakeholder Alignment', key: 'stakeholderReception', icon: Users, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20', data: result.stakeholderReception },
    { name: 'Long-Term Resilience', key: 'sustainability', icon: Compass, color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/20', data: result.sustainability },
  ] : [];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-4xl h-[85vh] bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-zinc-100"
        >
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-purple-500/30 rounded-xl text-purple-400">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  Multi-Perspective Strategic Solution Evaluator
                  <span className="px-2 py-0.5 text-[10px] font-mono bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-full">
                    5D Radar Matrix
                  </span>
                </h2>
                <p className="text-xs text-zinc-400">
                  Stress-test reasoning solutions across Feasibility, Impact, Risk, Stakeholder Alignment, and Long-Term Resilience.
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

          {/* Content Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-zinc-900/50">
            {!result && !loading && (
              <div className="flex flex-col items-center justify-center h-64 text-center space-y-4">
                <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-400">
                  <Layers className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-200">No Multi-Perspective Audit Generated Yet</h3>
                  <p className="text-xs text-zinc-400 max-w-md mt-1">
                    Run the 5-Dimensional Strategic Evaluator to assess feasibility, impact, risk margins, stakeholder adoption, and long-term resilience.
                  </p>
                </div>
                <button
                  onClick={handleRunEvaluation}
                  className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-medium text-xs rounded-xl shadow-lg flex items-center gap-2 transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  Run 5D Strategic Evaluation
                </button>
              </div>
            )}

            {loading && (
              <div className="flex flex-col items-center justify-center h-64 space-y-3">
                <RefreshCw className="w-8 h-8 text-purple-400 animate-spin" />
                <span className="text-xs font-mono text-zinc-300">
                  Evaluating solution across 5 strategic dimensions...
                </span>
              </div>
            )}

            {error && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {result && !loading && (
              <div className="space-y-6">
                {/* Executive Score Summary Banner */}
                <div className="p-5 bg-zinc-950/80 rounded-xl border border-zinc-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">Overall Strategic Score</span>
                      <span className="px-2 py-0.5 text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded font-bold">
                        VERIFIED SYNTHESIS
                      </span>
                    </div>
                    <p className="text-xs text-zinc-300 max-w-xl">
                      <strong className="text-white">Executive Advisory: </strong>
                      {result.recommendation}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="text-2xl font-extrabold text-white font-mono">
                        {(result.overallScore * 100).toFixed(0)}
                        <span className="text-xs text-zinc-500 font-normal">/100</span>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400">Strategic Alignment</span>
                    </div>
                    <button
                      onClick={handleRunEvaluation}
                      className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-lg transition-colors"
                      title="Re-run evaluation"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* 5-Dimensional Breakdown Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {dimensions.map((dim) => {
                    const Icon = dim.icon;
                    const pct = Math.round(dim.data.score * 100);
                    return (
                      <div key={dim.key} className={`p-4 rounded-xl border ${dim.bg} space-y-3`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Icon className={`w-4 h-4 ${dim.color}`} />
                            <h4 className="text-xs font-bold text-white font-mono">{dim.name}</h4>
                          </div>
                          <span className={`text-xs font-mono font-bold ${dim.color}`}>{pct}%</span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-zinc-950/80 rounded-full h-2 border border-zinc-800 overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            className={`h-full ${
                              pct >= 80 ? 'bg-emerald-500' : pct >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                            }`}
                          />
                        </div>

                        <p className="text-xs text-zinc-300 leading-relaxed">
                          {dim.data.rationale}
                        </p>

                        {dim.data.keyInsights && dim.data.keyInsights.length > 0 && (
                          <div className="space-y-1 pt-2 border-t border-zinc-800/60">
                            {dim.data.keyInsights.map((insight, idx) => (
                              <div key={idx} className="flex items-center gap-1.5 text-[11px] text-zinc-400 font-mono">
                                <CheckCircle className="w-3 h-3 text-zinc-500 shrink-0" />
                                <span>{insight}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-zinc-800 bg-zinc-950/80 flex items-center justify-between text-xs font-mono text-zinc-400">
            <span>OpenReason Multi-Perspective Strategic Matrix</span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium transition-colors"
            >
              Close Evaluator
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
