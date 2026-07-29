import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { 
  X, Activity, BarChart3, Database, Download, Upload, Trash2, 
  CheckCircle2, AlertTriangle, XCircle, ShieldCheck, Zap, DollarSign,
  Clock, Hash, Brain, Filter, RefreshCw, ChevronRight, Layers,
  ArrowRightLeft, GitFork, TrendingUp, TrendingDown, Minus, Terminal,
  ChevronDown, Copy
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, 
  CartesianGrid, Cell, PieChart, Pie
} from 'recharts';
import { 
  getTelemetryMetrics, 
  clearBenchmarkReports, 
  clearMemory, 
  exportAllTelemetry, 
  importTelemetryData,
  StoredBenchmarkReport,
  MemoryEntry
} from '../services/db';

interface TelemetryAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TelemetryAnalyticsModal: React.FC<TelemetryAnalyticsModalProps> = ({
  isOpen,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'benchmarks' | 'traces' | 'compare'>('overview');
  const [loading, setLoading] = useState<boolean>(true);
  const [metrics, setMetrics] = useState<any>(null);
  const [selectedReport, setSelectedReport] = useState<StoredBenchmarkReport | null>(null);
  const [selectedTrace, setSelectedTrace] = useState<MemoryEntry | null>(null);
  const [filterVerdict, setFilterVerdict] = useState<string>('ALL');

  // Compare Runs State
  const [selectedRunAId, setSelectedRunAId] = useState<number | null>(null);
  const [selectedRunBId, setSelectedRunBId] = useState<number | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getTelemetryMetrics();
      setMetrics(data);
      if (data.recentExecutions && data.recentExecutions.length > 0) {
        if (selectedRunAId === null) {
          setSelectedRunAId(data.recentExecutions[0].id ?? null);
        }
        if (selectedRunBId === null) {
          setSelectedRunBId(
            data.recentExecutions.length > 1 
              ? (data.recentExecutions[1].id ?? null) 
              : (data.recentExecutions[0].id ?? null)
          );
        }
      }
    } catch (err) {
      console.error('Failed to load telemetry from IndexedDB:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleExport = async () => {
    const data = await exportAllTelemetry();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `openreason_telemetry_vault_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        await importTelemetryData(json);
        await loadData();
      } catch (err) {
        alert('Invalid JSON file format for Telemetry import.');
      }
    };
    reader.readAsText(file);
  };

  const handleClearAll = async () => {
    if (confirm('Are you sure you want to clear all benchmark logs and reasoning traces from IndexedDB?')) {
      await clearBenchmarkReports();
      await clearMemory();
      await loadData();
    }
  };

  const handleSwapRuns = () => {
    const temp = selectedRunAId;
    setSelectedRunAId(selectedRunBId);
    setSelectedRunBId(temp);
  };

  const runA = metrics?.recentExecutions?.find((e: MemoryEntry) => e.id === selectedRunAId) || null;
  const runB = metrics?.recentExecutions?.find((e: MemoryEntry) => e.id === selectedRunBId) || null;

  // Prepare Chart Data
  const chartCategoryData = metrics?.categoryStats ? Object.entries(metrics.categoryStats).map(([cat, stat]: any) => ({
    name: cat.split(' ')[0] + '...',
    fullName: cat,
    score: stat.avgScore,
    passRate: Math.round((stat.passCount / stat.total) * 100) || 0,
    total: stat.total
  })) : [];

  const verdictData = metrics ? [
    { name: 'PASS', value: metrics.passCount, color: '#10b981' },
    { name: 'PARTIAL', value: metrics.partialCount, color: '#f59e0b' },
    { name: 'FAIL', value: metrics.failCount, color: '#ef4444' }
  ].filter(d => d.value > 0) : [];

  const filteredBenchmarks = metrics?.recentBenchmarks ? metrics.recentBenchmarks.filter((b: StoredBenchmarkReport) => {
    if (filterVerdict === 'ALL') return true;
    return b.verdict === filterVerdict;
  }) : [];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-6xl h-[90vh] bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-zinc-100"
        >
          {/* Top Header Bar */}
          <div className="p-4 sm:p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 rounded-xl text-indigo-400">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  Telemetry Analytics & IndexedDB Trace Vault
                  <span className="px-2 py-0.5 text-[10px] font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full">
                    IndexedDB v2 Active
                  </span>
                </h2>
                <p className="text-xs text-zinc-400">
                  Persistent metric tracking, side-by-side run comparisons, context loss audits, and benchmark performance history.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={handleExport}
                className="px-3 py-1.5 text-xs font-mono font-medium text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Export Telemetry JSON"
              >
                <Download className="w-3.5 h-3.5 text-indigo-400" />
                Export
              </button>

              <label className="px-3 py-1.5 text-xs font-mono font-medium text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors">
                <Upload className="w-3.5 h-3.5 text-cyan-400" />
                Import
                <input type="file" accept=".json" onChange={handleImport} className="hidden" />
              </label>

              <button 
                onClick={handleClearAll}
                className="px-3 py-1.5 text-xs font-mono font-medium text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Clear IndexedDB Vault"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear
              </button>

              <button 
                onClick={onClose}
                className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors ml-2 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="px-6 border-b border-zinc-800 bg-zinc-950/40 flex items-center gap-4 text-xs font-mono overflow-x-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-3 border-b-2 flex items-center gap-2 font-medium transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'overview' 
                  ? 'border-indigo-500 text-indigo-400' 
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Telemetry Overview & Metrics
            </button>

            <button
              onClick={() => setActiveTab('benchmarks')}
              className={`py-3 border-b-2 flex items-center gap-2 font-medium transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'benchmarks' 
                  ? 'border-indigo-500 text-indigo-400' 
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              Benchmark Evaluations ({metrics?.recentBenchmarks?.length || 0})
            </button>

            <button
              onClick={() => setActiveTab('traces')}
              className={`py-3 border-b-2 flex items-center gap-2 font-medium transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'traces' 
                  ? 'border-indigo-500 text-indigo-400' 
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Brain className="w-4 h-4" />
              Reasoning Traces ({metrics?.recentExecutions?.length || 0})
            </button>

            <button
              onClick={() => setActiveTab('compare')}
              className={`py-3 border-b-2 flex items-center gap-2 font-medium transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'compare' 
                  ? 'border-indigo-500 text-indigo-400' 
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <ArrowRightLeft className="w-4 h-4 text-emerald-400" />
              Compare Runs
            </button>

            <div className="ml-auto text-[11px] text-zinc-500 font-mono whitespace-nowrap hidden sm:block">
              Total Storage Records: <span className="text-zinc-200 font-bold">{(metrics?.totalExecutions || 0) + (metrics?.totalBenchmarkRuns || 0)}</span>
            </div>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-zinc-900/50">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-64 text-zinc-400 gap-3">
                <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
                <span className="text-sm font-mono">Querying IndexedDB Storage Vault...</span>
              </div>
            ) : activeTab === 'overview' ? (
              <>
                {/* 4 Summary Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 bg-zinc-950/80 rounded-xl border border-zinc-800 flex items-center gap-3">
                    <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-lg">
                      <Activity className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[11px] font-mono text-zinc-400 block uppercase tracking-wider">Total Recorded Runs</span>
                      <span className="text-xl font-bold font-mono text-white">
                        {(metrics?.totalExecutions || 0) + (metrics?.totalBenchmarkRuns || 0)}
                      </span>
                      <span className="text-[10px] text-zinc-500 block font-mono">
                        {metrics?.totalBenchmarkRuns || 0} Evals | {metrics?.totalExecutions || 0} Traces
                      </span>
                    </div>
                  </div>

                  <div className="p-4 bg-zinc-950/80 rounded-xl border border-zinc-800 flex items-center gap-3">
                    <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-lg">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[11px] font-mono text-zinc-400 block uppercase tracking-wider">Avg Benchmark Score</span>
                      <span className="text-xl font-bold font-mono text-emerald-400">
                        {metrics?.avgBenchmarkScore || 0}%
                      </span>
                      <span className="text-[10px] text-zinc-500 block font-mono">
                        {metrics?.passCount || 0} PASS | {metrics?.partialCount || 0} PARTIAL | {metrics?.failCount || 0} FAIL
                      </span>
                    </div>
                  </div>

                  <div className="p-4 bg-zinc-950/80 rounded-xl border border-zinc-800 flex items-center gap-3">
                    <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-lg">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[11px] font-mono text-zinc-400 block uppercase tracking-wider">Context Retention Rate</span>
                      <span className="text-xl font-bold font-mono text-cyan-400">
                        {metrics?.avgContextIntegrity || 100}%
                      </span>
                      <span className="text-[10px] text-rose-400 block font-mono">
                        Avg Loop Penalty: -{metrics?.avgOverthinkingPenalty || '0.0'} pts
                      </span>
                    </div>
                  </div>

                  <div className="p-4 bg-zinc-950/80 rounded-xl border border-zinc-800 flex items-center gap-3">
                    <div className="p-3 bg-purple-500/10 text-purple-400 rounded-lg">
                      <DollarSign className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[11px] font-mono text-zinc-400 block uppercase tracking-wider">Cumulative Tokens & Cost</span>
                      <span className="text-xl font-bold font-mono text-purple-300">
                        ${(metrics?.totalCostUSD || 0).toFixed(4)}
                      </span>
                      <span className="text-[10px] text-zinc-500 block font-mono">
                        {(metrics?.totalTokens || 0).toLocaleString()} Tokens Processed
                      </span>
                    </div>
                  </div>
                </div>

                {/* Modality & Suite Performance Bar Chart */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 p-5 bg-zinc-950/80 rounded-xl border border-zinc-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-indigo-400" />
                        Average Score per Reasoning Suite / Modality
                      </h3>
                      <span className="text-[11px] font-mono text-zinc-500">IndexedDB Telemetry Aggregation</span>
                    </div>

                    {chartCategoryData.length > 0 ? (
                      <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartCategoryData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                            <XAxis dataKey="name" stroke="#71717a" fontSize={10} tickLine={false} />
                            <YAxis stroke="#71717a" fontSize={10} domain={[0, 100]} />
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', fontSize: '12px' }}
                              formatter={(value: any) => [`${value}% Score`, 'Average']}
                            />
                            <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                              {chartCategoryData.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={entry.score >= 80 ? '#10b981' : entry.score >= 50 ? '#f59e0b' : '#ef4444'} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="h-64 flex items-center justify-center text-xs font-mono text-zinc-500 border border-dashed border-zinc-800 rounded-lg">
                        No benchmark evaluation data recorded yet in IndexedDB. Run benchmark suite to populate charts.
                      </div>
                    )}
                  </div>

                  {/* Verdict Distribution Pie Chart */}
                  <div className="p-5 bg-zinc-950/80 rounded-xl border border-zinc-800 space-y-4 flex flex-col justify-between">
                    <div>
                      <h3 className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        Verdict Distribution
                      </h3>
                      <p className="text-[11px] text-zinc-500 font-mono mt-1">
                        Proportion of Pass, Partial, and Failed benchmark evaluations.
                      </p>
                    </div>

                    {verdictData.length > 0 ? (
                      <div className="h-48 w-full flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={verdictData}
                              cx="50%"
                              cy="50%"
                              innerRadius={45}
                              outerRadius={70}
                              paddingAngle={4}
                              dataKey="value"
                            >
                              {verdictData.map((entry, index) => (
                                <Cell key={`pie-cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', fontSize: '12px' }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="h-48 flex items-center justify-center text-xs font-mono text-zinc-500 border border-dashed border-zinc-800 rounded-lg">
                        No verdicts logged yet.
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono pt-2 border-t border-zinc-800">
                      <div>
                        <span className="text-emerald-400 font-bold block">{metrics?.passCount || 0}</span>
                        <span className="text-[10px] text-zinc-500">PASS</span>
                      </div>
                      <div>
                        <span className="text-amber-400 font-bold block">{metrics?.partialCount || 0}</span>
                        <span className="text-[10px] text-zinc-500">PARTIAL</span>
                      </div>
                      <div>
                        <span className="text-rose-400 font-bold block">{metrics?.failCount || 0}</span>
                        <span className="text-[10px] text-zinc-500">FAIL</span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : activeTab === 'benchmarks' ? (
              <div className="space-y-4">
                {/* Filter Controls */}
                <div className="flex items-center justify-between bg-zinc-950/80 p-3 rounded-xl border border-zinc-800 text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-zinc-400" />
                    <span className="text-zinc-400">Filter Verdict:</span>
                    {['ALL', 'PASS', 'PARTIAL', 'FAIL'].map((v) => (
                      <button
                        key={v}
                        onClick={() => setFilterVerdict(v)}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                          filterVerdict === v 
                            ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' 
                            : 'bg-zinc-800/60 text-zinc-400 hover:text-white'
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                  <span className="text-zinc-500">Showing {filteredBenchmarks.length} records</span>
                </div>

                {/* Benchmark Records List */}
                {filteredBenchmarks.length > 0 ? (
                  <div className="space-y-2">
                    {filteredBenchmarks.map((report: StoredBenchmarkReport, idx: number) => (
                      <div 
                        key={report.id || idx}
                        className="p-4 bg-zinc-950/80 hover:bg-zinc-950 rounded-xl border border-zinc-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 text-[10px] font-bold font-mono rounded ${
                              report.verdict === 'PASS' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                              report.verdict === 'PARTIAL' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                              'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            }`}>
                              {report.verdict} ({report.overallScore}%)
                            </span>
                            <h4 className="text-sm font-bold text-zinc-100">{report.benchmarkTitle}</h4>
                          </div>
                          <p className="text-xs text-zinc-400 font-mono">
                            Category: {report.category} | Model: {report.model}
                          </p>
                          <p className="text-[11px] text-zinc-500 font-mono">
                            {report.summaryText}
                          </p>
                        </div>

                        {/* Metrics Badges */}
                        <div className="flex items-center gap-3 font-mono text-[11px]">
                          <div className="p-2 bg-zinc-900 rounded border border-zinc-800 text-center">
                            <span className="text-zinc-500 text-[9px] block">Integrity</span>
                            <span className="text-blue-400 font-bold">{report.contextIntegrityScore || 100}%</span>
                          </div>
                          <div className="p-2 bg-zinc-900 rounded border border-zinc-800 text-center">
                            <span className="text-zinc-500 text-[9px] block">Penalty</span>
                            <span className="text-rose-400 font-bold">-{report.overthinkingPenalty || 0}</span>
                          </div>
                          <div className="p-2 bg-zinc-900 rounded border border-zinc-800 text-center">
                            <span className="text-zinc-500 text-[9px] block">Cost</span>
                            <span className="text-purple-300 font-bold">{report.formattedCost}</span>
                          </div>
                          <div className="p-2 bg-zinc-900 rounded border border-zinc-800 text-center">
                            <span className="text-zinc-500 text-[9px] block">Latency</span>
                            <span className="text-amber-400 font-bold">{(report.latencyMs / 1000).toFixed(1)}s</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-12 text-center text-xs font-mono text-zinc-500 border border-dashed border-zinc-800 rounded-xl">
                    No benchmark evaluation records found matching current filter.
                  </div>
                )}
              </div>
            ) : activeTab === 'traces' ? (
              /* Reasoning Traces Tab */
              <div className="space-y-3">
                {metrics?.recentExecutions?.length > 0 ? (
                  metrics.recentExecutions.map((entry: MemoryEntry, idx: number) => (
                    <div 
                      key={entry.id || idx}
                      className="p-4 bg-zinc-950/80 rounded-xl border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono"
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded font-bold">
                            {entry.mode || 'Const-o-T'}
                          </span>
                          <span className="px-2 py-0.5 text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded font-bold">
                            {entry.primaryModality || entry.strategy || 'DEDUCTIVE'}
                          </span>
                          <span className="text-[10px] text-zinc-500">
                            {new Date(entry.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-zinc-200 font-sans text-xs line-clamp-2">
                          "{entry.prompt}"
                        </p>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-zinc-400">
                        <span className="flex items-center gap-1">
                          <Layers className="w-3.5 h-3.5 text-indigo-400" />
                          {entry.stepsCount || 0} Steps
                        </span>
                        <span className="flex items-center gap-1">
                          <Hash className="w-3.5 h-3.5 text-cyan-400" />
                          {(entry.totalTokens || 0).toLocaleString()} Tokens
                        </span>
                        <span className="flex items-center gap-1 text-purple-300">
                          <DollarSign className="w-3.5 h-3.5" />
                          ${(entry.estimatedCost || 0).toFixed(4)}
                        </span>

                        <div className="flex items-center gap-1.5 ml-2">
                          <button
                            onClick={() => {
                              if (entry.id !== undefined) {
                                setSelectedRunAId(entry.id);
                                setActiveTab('compare');
                              }
                            }}
                            className={`px-2 py-1 text-[9px] font-bold uppercase rounded border transition-colors cursor-pointer ${
                              selectedRunAId === entry.id
                                ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700'
                            }`}
                          >
                            Set Run A
                          </button>
                          <button
                            onClick={() => {
                              if (entry.id !== undefined) {
                                setSelectedRunBId(entry.id);
                                setActiveTab('compare');
                              }
                            }}
                            className={`px-2 py-1 text-[9px] font-bold uppercase rounded border transition-colors cursor-pointer ${
                              selectedRunBId === entry.id
                                ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700'
                            }`}
                          >
                            Set Run B
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-12 text-center text-xs font-mono text-zinc-500 border border-dashed border-zinc-800 rounded-xl">
                    No reasoning trace sessions recorded in IndexedDB yet.
                  </div>
                )}
              </div>
            ) : (
              /* Compare Runs Tab */
              <div className="space-y-6">
                {/* Run Selection Bar */}
                <div className="p-4 bg-zinc-950/80 rounded-xl border border-zinc-800 space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                    <div className="flex items-center gap-2">
                      <ArrowRightLeft className="w-4 h-4 text-emerald-400" />
                      <h3 className="text-xs font-mono font-bold text-zinc-200 uppercase tracking-wider">
                        Side-by-Side Execution Comparison Config
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500">
                      Select 2 runs from IndexedDB trace vault
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 items-center">
                    {/* Run A Selector */}
                    <div className="lg:col-span-2 space-y-1">
                      <label className="text-[10px] font-mono text-indigo-400 font-bold uppercase tracking-wider flex items-center justify-between">
                        <span>Run A (Baseline)</span>
                        {runA && (
                          <span className="text-zinc-500 text-[9px]">
                            {new Date(runA.timestamp).toLocaleTimeString()}
                          </span>
                        )}
                      </label>
                      <select
                        value={selectedRunAId ?? ''}
                        onChange={(e) => setSelectedRunAId(Number(e.target.value))}
                        className="w-full bg-zinc-900 border border-indigo-500/30 text-zinc-200 text-xs font-mono rounded-lg p-2.5 focus:outline-none focus:border-indigo-500"
                      >
                        {metrics?.recentExecutions?.map((e: MemoryEntry) => (
                          <option key={e.id} value={e.id}>
                            #{e.id} - [{e.mode || 'Const-o-T'}] "{e.prompt.slice(0, 32)}..." ({e.totalTokens || 0} tok)
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Swap Button */}
                    <div className="flex items-center justify-center pt-3 sm:pt-0">
                      <button
                        onClick={handleSwapRuns}
                        title="Swap Run A and Run B"
                        className="p-2 bg-zinc-800 hover:bg-zinc-700 text-emerald-400 border border-zinc-700 rounded-lg transition-all hover:scale-105 min-h-[40px] w-full lg:w-auto flex items-center justify-center gap-2 font-mono text-xs cursor-pointer"
                      >
                        <ArrowRightLeft className="w-4 h-4" />
                        <span className="lg:hidden font-bold">Swap Runs</span>
                      </button>
                    </div>

                    {/* Run B Selector */}
                    <div className="lg:col-span-2 space-y-1">
                      <label className="text-[10px] font-mono text-purple-400 font-bold uppercase tracking-wider flex items-center justify-between">
                        <span>Run B (Comparison Target)</span>
                        {runB && (
                          <span className="text-zinc-500 text-[9px]">
                            {new Date(runB.timestamp).toLocaleTimeString()}
                          </span>
                        )}
                      </label>
                      <select
                        value={selectedRunBId ?? ''}
                        onChange={(e) => setSelectedRunBId(Number(e.target.value))}
                        className="w-full bg-zinc-900 border border-purple-500/30 text-zinc-200 text-xs font-mono rounded-lg p-2.5 focus:outline-none focus:border-purple-500"
                      >
                        {metrics?.recentExecutions?.map((e: MemoryEntry) => (
                          <option key={e.id} value={e.id}>
                            #{e.id} - [{e.mode || 'Const-o-T'}] "{e.prompt.slice(0, 32)}..." ({e.totalTokens || 0} tok)
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {runA && runB ? (
                  <>
                    {/* Key Delta Metrics Comparison Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
                      {/* Total Tokens Comparison */}
                      {(() => {
                        const tokA = runA.totalTokens || 0;
                        const tokB = runB.totalTokens || 0;
                        const diff = tokB - tokA;
                        const pct = tokA > 0 ? ((diff / tokA) * 100).toFixed(1) : '0.0';
                        return (
                          <div className="p-4 bg-zinc-950/80 rounded-xl border border-zinc-800 space-y-2">
                            <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-bold flex items-center justify-between">
                              <span className="flex items-center gap-1">
                                <Hash className="w-3.5 h-3.5 text-cyan-400" />
                                Total Tokens
                              </span>
                              <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                                diff < 0 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                                diff > 0 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                                'bg-zinc-800 text-zinc-400'
                              }`}>
                                {diff > 0 ? `+${diff}` : diff} ({diff > 0 ? `+${pct}%` : `${pct}%`})
                              </span>
                            </span>
                            <div className="flex items-center justify-between pt-1 border-t border-zinc-800/60">
                              <div>
                                <span className="text-[9px] text-indigo-400 block font-bold">Run A</span>
                                <span className="text-base font-bold text-white">{tokA.toLocaleString()}</span>
                              </div>
                              <div className="text-right">
                                <span className="text-[9px] text-purple-400 block font-bold">Run B</span>
                                <span className="text-base font-bold text-white">{tokB.toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Estimated Cost Comparison */}
                      {(() => {
                        const costA = runA.estimatedCost || 0;
                        const costB = runB.estimatedCost || 0;
                        const diffCost = costB - costA;
                        const pctCost = costA > 0 ? ((diffCost / costA) * 100).toFixed(1) : '0.0';
                        return (
                          <div className="p-4 bg-zinc-950/80 rounded-xl border border-zinc-800 space-y-2">
                            <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-bold flex items-center justify-between">
                              <span className="flex items-center gap-1">
                                <DollarSign className="w-3.5 h-3.5 text-purple-400" />
                                Estimated Cost
                              </span>
                              <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                                diffCost < 0 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                                diffCost > 0 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                                'bg-zinc-800 text-zinc-400'
                              }`}>
                                {diffCost > 0 ? `+$${diffCost.toFixed(4)}` : `$${diffCost.toFixed(4)}`}
                              </span>
                            </span>
                            <div className="flex items-center justify-between pt-1 border-t border-zinc-800/60">
                              <div>
                                <span className="text-[9px] text-indigo-400 block font-bold">Run A</span>
                                <span className="text-base font-bold text-purple-300">${costA.toFixed(4)}</span>
                              </div>
                              <div className="text-right">
                                <span className="text-[9px] text-purple-400 block font-bold">Run B</span>
                                <span className="text-base font-bold text-purple-300">${costB.toFixed(4)}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Steps Count Comparison */}
                      {(() => {
                        const stepsA = runA.stepsCount || runA.steps?.length || 0;
                        const stepsB = runB.stepsCount || runB.steps?.length || 0;
                        const diffSteps = stepsB - stepsA;
                        return (
                          <div className="p-4 bg-zinc-950/80 rounded-xl border border-zinc-800 space-y-2">
                            <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-bold flex items-center justify-between">
                              <span className="flex items-center gap-1">
                                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                                Reasoning Steps
                              </span>
                              <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                                diffSteps !== 0 ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'bg-zinc-800 text-zinc-400'
                              }`}>
                                {diffSteps > 0 ? `+${diffSteps} steps` : `${diffSteps} steps`}
                              </span>
                            </span>
                            <div className="flex items-center justify-between pt-1 border-t border-zinc-800/60">
                              <div>
                                <span className="text-[9px] text-indigo-400 block font-bold">Run A</span>
                                <span className="text-base font-bold text-white">{stepsA} Steps</span>
                              </div>
                              <div className="text-right">
                                <span className="text-[9px] text-purple-400 block font-bold">Run B</span>
                                <span className="text-base font-bold text-white">{stepsB} Steps</span>
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Duration / Latency Comparison */}
                      {(() => {
                        const durA = runA.durationMs || 0;
                        const durB = runB.durationMs || 0;
                        const diffDur = durB - durA;
                        return (
                          <div className="p-4 bg-zinc-950/80 rounded-xl border border-zinc-800 space-y-2">
                            <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-bold flex items-center justify-between">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-amber-400" />
                                Duration / Latency
                              </span>
                              <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                                diffDur < 0 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                                diffDur > 0 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                                'bg-zinc-800 text-zinc-400'
                              }`}>
                                {diffDur > 0 ? `+${(diffDur / 1000).toFixed(2)}s` : `${(diffDur / 1000).toFixed(2)}s`}
                              </span>
                            </span>
                            <div className="flex items-center justify-between pt-1 border-t border-zinc-800/60">
                              <div>
                                <span className="text-[9px] text-indigo-400 block font-bold">Run A</span>
                                <span className="text-base font-bold text-amber-300">{(durA / 1000).toFixed(2)}s</span>
                              </div>
                              <div className="text-right">
                                <span className="text-[9px] text-purple-400 block font-bold">Run B</span>
                                <span className="text-base font-bold text-amber-300">{(durB / 1000).toFixed(2)}s</span>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Side-by-Side Prompt Context Header */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* Run A Prompt Overview */}
                      <div className="p-4 bg-indigo-950/20 border border-indigo-500/30 rounded-xl space-y-2">
                        <div className="flex items-center justify-between font-mono text-xs border-b border-indigo-500/20 pb-2">
                          <span className="font-bold text-indigo-400 flex items-center gap-1.5">
                            <span className="px-1.5 py-0.5 bg-indigo-500/20 text-indigo-300 rounded text-[10px]">RUN A</span>
                            {runA.mode || 'Const-o-T'} Execution
                          </span>
                          <span className="text-[10px] text-zinc-400">
                            {new Date(runA.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-200 font-sans italic line-clamp-3">
                          "{runA.prompt}"
                        </p>
                        <div className="flex items-center gap-2 text-[10px] font-mono text-indigo-300/80 pt-1">
                          <span>Strategy: <strong>{runA.strategy || 'DEDUCTIVE'}</strong></span>
                          {runA.primaryModality && <span>| Modality: <strong>{runA.primaryModality}</strong></span>}
                        </div>
                      </div>

                      {/* Run B Prompt Overview */}
                      <div className="p-4 bg-purple-950/20 border border-purple-500/30 rounded-xl space-y-2">
                        <div className="flex items-center justify-between font-mono text-xs border-b border-purple-500/20 pb-2">
                          <span className="font-bold text-purple-400 flex items-center gap-1.5">
                            <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-300 rounded text-[10px]">RUN B</span>
                            {runB.mode || 'Const-o-T'} Execution
                          </span>
                          <span className="text-[10px] text-zinc-400">
                            {new Date(runB.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-200 font-sans italic line-clamp-3">
                          "{runB.prompt}"
                        </p>
                        <div className="flex items-center gap-2 text-[10px] font-mono text-purple-300/80 pt-1">
                          <span>Strategy: <strong>{runB.strategy || 'DEDUCTIVE'}</strong></span>
                          {runB.primaryModality && <span>| Modality: <strong>{runB.primaryModality}</strong></span>}
                        </div>
                      </div>
                    </div>

                    {/* Side-by-Side Reasoning Steps Trace Breakdown */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                        <h4 className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                          <Layers className="w-4 h-4 text-emerald-400" />
                          Step-by-Step Logic Trace Comparison
                        </h4>
                        <span className="text-[11px] font-mono text-zinc-500">
                          Parallel Execution Logs
                        </span>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Column Run A Steps */}
                        <div className="space-y-3">
                          <div className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-wider bg-indigo-500/10 p-2 rounded border border-indigo-500/20 flex items-center justify-between">
                            <span>Run A Logic Steps ({runA.steps?.length || 0})</span>
                            <span>{runA.mode || 'Const-o-T'}</span>
                          </div>

                          {(!runA.steps || runA.steps.length === 0) ? (
                            <div className="p-6 text-center text-xs font-mono text-zinc-500 border border-dashed border-zinc-800 rounded-lg">
                              No step-by-step trace breakdown recorded for Run A.
                            </div>
                          ) : (
                            runA.steps.map((step: any, idx: number) => (
                              <div key={idx} className="p-3 bg-zinc-950/80 rounded-lg border border-indigo-500/20 space-y-2 text-xs">
                                <div className="flex items-center justify-between text-[10px] font-mono">
                                  <span className="text-indigo-400 font-bold">
                                    Step {idx + 1}: [{step.stage?.toUpperCase() || 'STAGE'}]
                                  </span>
                                  {step.model && (
                                    <span className="text-zinc-500 text-[9px]">{step.model}</span>
                                  )}
                                </div>

                                {step.thought && (
                                  <div className="bg-blue-500/5 border border-blue-500/20 p-2 rounded text-[10px] font-mono text-blue-300/80">
                                    <div className="font-bold text-blue-400 text-[8px] uppercase tracking-wider mb-0.5">Gemini Cognitive Thought</div>
                                    <p className="line-clamp-2">{step.thought}</p>
                                  </div>
                                )}

                                <div className="prose prose-invert prose-xs max-w-none text-zinc-300 text-[11px] leading-relaxed">
                                  <Markdown>{step.content}</Markdown>
                                </div>

                                {step.codeExecution && (
                                  <div className="bg-amber-500/5 border border-amber-500/20 p-2 rounded text-[10px] font-mono text-amber-200/80">
                                    <div className="font-bold text-amber-400 text-[8px] uppercase tracking-wider mb-0.5 flex items-center gap-1">
                                      <Terminal className="w-2.5 h-2.5" /> Python Code Execution
                                    </div>
                                    <pre className="bg-black/40 p-1.5 rounded overflow-x-auto text-[9px]">{step.codeExecution.code}</pre>
                                  </div>
                                )}
                              </div>
                            ))
                          )}
                        </div>

                        {/* Column Run B Steps */}
                        <div className="space-y-3">
                          <div className="text-[10px] font-mono font-bold text-purple-400 uppercase tracking-wider bg-purple-500/10 p-2 rounded border border-purple-500/20 flex items-center justify-between">
                            <span>Run B Logic Steps ({runB.steps?.length || 0})</span>
                            <span>{runB.mode || 'Const-o-T'}</span>
                          </div>

                          {(!runB.steps || runB.steps.length === 0) ? (
                            <div className="p-6 text-center text-xs font-mono text-zinc-500 border border-dashed border-zinc-800 rounded-lg">
                              No step-by-step trace breakdown recorded for Run B.
                            </div>
                          ) : (
                            runB.steps.map((step: any, idx: number) => (
                              <div key={idx} className="p-3 bg-zinc-950/80 rounded-lg border border-purple-500/20 space-y-2 text-xs">
                                <div className="flex items-center justify-between text-[10px] font-mono">
                                  <span className="text-purple-400 font-bold">
                                    Step {idx + 1}: [{step.stage?.toUpperCase() || 'STAGE'}]
                                  </span>
                                  {step.model && (
                                    <span className="text-zinc-500 text-[9px]">{step.model}</span>
                                  )}
                                </div>

                                {step.thought && (
                                  <div className="bg-blue-500/5 border border-blue-500/20 p-2 rounded text-[10px] font-mono text-blue-300/80">
                                    <div className="font-bold text-blue-400 text-[8px] uppercase tracking-wider mb-0.5">Gemini Cognitive Thought</div>
                                    <p className="line-clamp-2">{step.thought}</p>
                                  </div>
                                )}

                                <div className="prose prose-invert prose-xs max-w-none text-zinc-300 text-[11px] leading-relaxed">
                                  <Markdown>{step.content}</Markdown>
                                </div>

                                {step.codeExecution && (
                                  <div className="bg-amber-500/5 border border-amber-500/20 p-2 rounded text-[10px] font-mono text-amber-200/80">
                                    <div className="font-bold text-amber-400 text-[8px] uppercase tracking-wider mb-0.5 flex items-center gap-1">
                                      <Terminal className="w-2.5 h-2.5" /> Python Code Execution
                                    </div>
                                    <pre className="bg-black/40 p-1.5 rounded overflow-x-auto text-[9px]">{step.codeExecution.code}</pre>
                                  </div>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Side-by-Side Final Answer Comparison */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                        <h4 className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          Final Synthesized Answer Output
                        </h4>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Run A Final Answer */}
                        <div className="p-4 bg-zinc-950/90 rounded-xl border border-indigo-500/30 space-y-2">
                          <div className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-wider border-b border-zinc-800 pb-2 flex items-center justify-between">
                            <span>Run A Final Answer</span>
                            <button
                              onClick={() => navigator.clipboard.writeText(runA.finalAnswer || '')}
                              className="text-[9px] text-zinc-500 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                            >
                              <Copy className="w-2.5 h-2.5" /> COPY
                            </button>
                          </div>
                          <div className="prose prose-invert prose-xs max-w-none text-zinc-200 text-xs leading-relaxed max-h-72 overflow-y-auto">
                            <Markdown>{runA.finalAnswer || 'No final answer recorded.'}</Markdown>
                          </div>
                        </div>

                        {/* Run B Final Answer */}
                        <div className="p-4 bg-zinc-950/90 rounded-xl border border-purple-500/30 space-y-2">
                          <div className="text-[10px] font-mono font-bold text-purple-400 uppercase tracking-wider border-b border-zinc-800 pb-2 flex items-center justify-between">
                            <span>Run B Final Answer</span>
                            <button
                              onClick={() => navigator.clipboard.writeText(runB.finalAnswer || '')}
                              className="text-[9px] text-zinc-500 hover:text-purple-300 flex items-center gap-1 cursor-pointer"
                            >
                              <Copy className="w-2.5 h-2.5" /> COPY
                            </button>
                          </div>
                          <div className="prose prose-invert prose-xs max-w-none text-zinc-200 text-xs leading-relaxed max-h-72 overflow-y-auto">
                            <Markdown>{runB.finalAnswer || 'No final answer recorded.'}</Markdown>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="p-12 text-center text-xs font-mono text-zinc-500 border border-dashed border-zinc-800 rounded-xl space-y-2">
                    <p className="text-zinc-400 font-bold">Select two execution runs to compare.</p>
                    <p>Select Run A and Run B from the dropdowns above or use the "Set Run A / Set Run B" buttons in the Reasoning Traces tab.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bottom Bar */}
          <div className="p-4 border-t border-zinc-800 bg-zinc-950/80 flex items-center justify-between text-xs font-mono text-zinc-400">
            <span className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              IndexedDB Storage: OpenReasonDB v2 Active
            </span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium transition-colors cursor-pointer"
            >
              Close Dashboard
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
