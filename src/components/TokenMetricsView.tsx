import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Hash, Zap, Brain, Cpu, BarChart3, TrendingUp, Layers, Activity } from 'lucide-react';
import { ReasoningStep, ReasoningResult } from '../services/reasoningEngine';

interface TokenMetricsViewProps {
  steps: ReasoningStep[];
  currentResult: ReasoningResult | null;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#10b981'];

export const TokenMetricsView: React.FC<TokenMetricsViewProps> = ({ steps, currentResult }) => {
  if (!steps || steps.length === 0) {
    return (
      <div className="py-16 text-center flex flex-col items-center justify-center space-y-3">
        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-full text-zinc-600">
          <BarChart3 className="w-8 h-8" />
        </div>
        <div className="text-xs font-mono uppercase tracking-widest text-zinc-400 font-bold">
          No Token Metrics Available
        </div>
        <p className="text-[11px] text-zinc-600 max-w-sm font-mono">
          Run a reasoning query to visualize stage-by-stage input & output token consumption metrics across the pipeline.
        </p>
      </div>
    );
  }

  // Calculate stage-by-stage token breakdown
  let cumulative = 0;
  const chartData = steps.map((step, idx) => {
    const promptText = step.rawPrompt || '';
    const responseText = (step.rawResponse || step.content || '') + (step.thought || '') + (step.codeExecution ? (step.codeExecution.code + step.codeExecution.output) : '');
    
    const inputTokens = step.inputTokens ?? Math.max(1, Math.ceil(promptText.length / 3.8));
    const outputTokens = step.outputTokens ?? Math.max(1, Math.ceil(responseText.length / 3.8));
    const stepTotal = inputTokens + outputTokens;
    cumulative += stepTotal;

    return {
      stepIndex: idx + 1,
      stage: step.stage,
      stageLabel: `${idx + 1}. ${step.stage}`,
      model: step.model || 'Gemini',
      inputTokens,
      outputTokens,
      totalTokens: stepTotal,
      cumulativeTokens: cumulative,
      temp: step.temperature ?? 0.7
    };
  });

  const totalInputTokens = chartData.reduce((acc, curr) => acc + curr.inputTokens, 0);
  const totalOutputTokens = chartData.reduce((acc, curr) => acc + curr.outputTokens, 0);
  const grandTotalTokens = totalInputTokens + totalOutputTokens;
  const peakStep = [...chartData].sort((a, b) => b.totalTokens - a.totalTokens)[0];

  const pieData = [
    { name: 'Input / Prompt Tokens', value: totalInputTokens, color: '#3b82f6' },
    { name: 'Output / Reasoning Tokens', value: totalOutputTokens, color: '#10b981' }
  ];

  const stagePieData = chartData.map((d, i) => ({
    name: d.stage,
    value: d.totalTokens,
    color: COLORS[i % COLORS.length]
  }));

  return (
    <div className="space-y-6 py-2">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-zinc-900/80 border border-zinc-800 rounded-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-500 mb-1">
            <span className="text-[9px] font-mono uppercase tracking-wider font-semibold">Total Pipeline Tokens</span>
            <Hash className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-lg sm:text-xl font-bold font-mono text-emerald-400">
            {grandTotalTokens.toLocaleString()}
          </div>
          <div className="text-[9px] text-zinc-500 font-mono mt-1">
            Across {steps.length} reasoning steps
          </div>
        </div>

        <div className="p-3.5 bg-zinc-900/80 border border-zinc-800 rounded-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-500 mb-1">
            <span className="text-[9px] font-mono uppercase tracking-wider font-semibold">Input Tokens</span>
            <Brain className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="text-lg sm:text-xl font-bold font-mono text-blue-400">
            {totalInputTokens.toLocaleString()}
          </div>
          <div className="text-[9px] text-zinc-500 font-mono mt-1">
            {((totalInputTokens / (grandTotalTokens || 1)) * 100).toFixed(1)}% of total volume
          </div>
        </div>

        <div className="p-3.5 bg-zinc-900/80 border border-zinc-800 rounded-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-500 mb-1">
            <span className="text-[9px] font-mono uppercase tracking-wider font-semibold">Output Tokens</span>
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-lg sm:text-xl font-bold font-mono text-emerald-400">
            {totalOutputTokens.toLocaleString()}
          </div>
          <div className="text-[9px] text-zinc-500 font-mono mt-1">
            {((totalOutputTokens / (grandTotalTokens || 1)) * 100).toFixed(1)}% reasoning output
          </div>
        </div>

        <div className="p-3.5 bg-zinc-900/80 border border-zinc-800 rounded-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-500 mb-1">
            <span className="text-[9px] font-mono uppercase tracking-wider font-semibold">Peak Stage</span>
            <Activity className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-sm font-bold font-mono text-amber-300 truncate">
            {peakStep?.stage || 'N/A'}
          </div>
          <div className="text-[9px] text-zinc-500 font-mono mt-1 truncate">
            {peakStep ? `${peakStep.totalTokens.toLocaleString()} tokens (${peakStep.model})` : '0 tokens'}
          </div>
        </div>
      </div>

      {/* Main Bar Chart: Input vs Output tokens per stage */}
      <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl space-y-3">
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider font-mono">
              Stage-by-Stage Token Consumption
            </h3>
          </div>
          <span className="text-[9px] font-mono text-zinc-500 uppercase">
            Stacked Input / Output per stage
          </span>
        </div>

        <div className="h-64 sm:h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis 
                dataKey="stageLabel" 
                stroke="#71717a" 
                fontSize={10} 
                tickLine={false}
                interval={0}
                angle={-15}
                textAnchor="end"
              />
              <YAxis stroke="#71717a" fontSize={10} tickLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', borderRadius: '0.5rem', fontSize: '11px', fontFamily: 'monospace' }}
                labelStyle={{ color: '#10b981', fontWeight: 'bold' }}
                formatter={(value: any, name: any) => [
                  `${Number(value).toLocaleString()} tokens`, 
                  name === 'inputTokens' ? 'Input Tokens' : 'Output Tokens'
                ]}
              />
              <Legend 
                wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace', paddingTop: '8px' }}
                formatter={(value) => value === 'inputTokens' ? 'Input Tokens' : 'Output Tokens'}
              />
              <Bar dataKey="inputTokens" stackId="tokens" fill="#3b82f6" radius={[0, 0, 2, 2]} />
              <Bar dataKey="outputTokens" stackId="tokens" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Two Column Grid: Cumulative Line Chart & Distribution Pie Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Cumulative Token Growth */}
        <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider font-mono">
                Cumulative Token Progression
              </h3>
            </div>
            <span className="text-[9px] font-mono text-zinc-500 uppercase">Growth trajectory</span>
          </div>

          <div className="h-56 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 10 }}>
                <defs>
                  <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="stage" stroke="#71717a" fontSize={10} tickLine={false} />
                <YAxis stroke="#71717a" fontSize={10} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', borderRadius: '0.5rem', fontSize: '11px', fontFamily: 'monospace' }}
                  labelStyle={{ color: '#10b981', fontWeight: 'bold' }}
                  formatter={(value: any) => [`${Number(value).toLocaleString()} tokens`, 'Cumulative Total']}
                />
                <Area type="monotone" dataKey="cumulativeTokens" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorCumulative)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stage Allocation Pie Chart */}
        <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-purple-400" />
              <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider font-mono">
                Stage Token Distribution
              </h3>
            </div>
            <span className="text-[9px] font-mono text-zinc-500 uppercase">By Stage</span>
          </div>

          <div className="h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stagePieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {stagePieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', borderRadius: '0.5rem', fontSize: '11px', fontFamily: 'monospace' }}
                  formatter={(value: any) => [`${Number(value).toLocaleString()} tokens`, 'Tokens']}
                />
                <Legend 
                  layout="vertical"
                  align="right"
                  verticalAlign="middle"
                  wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace', paddingLeft: '10px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detailed Stage Breakdown Table */}
      <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl space-y-3">
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider font-mono">
              Pipeline Stage Token Ledger
            </h3>
          </div>
          <span className="text-[9px] font-mono text-zinc-500 uppercase">
            {chartData.length} stages recorded
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-[10px]">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-500 uppercase">
                <th className="py-2 px-2">#</th>
                <th className="py-2 px-2">Stage</th>
                <th className="py-2 px-2">Model Engine</th>
                <th className="py-2 px-2 text-right">Input</th>
                <th className="py-2 px-2 text-right">Output</th>
                <th className="py-2 px-2 text-right">Total</th>
                <th className="py-2 px-2 text-right">% Volume</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {chartData.map((row) => {
                const pct = ((row.totalTokens / (grandTotalTokens || 1)) * 100).toFixed(1);
                return (
                  <tr key={row.stepIndex} className="hover:bg-zinc-800/40 transition-colors">
                    <td className="py-2 px-2 text-zinc-500">{row.stepIndex}</td>
                    <td className="py-2 px-2 font-bold text-emerald-400">{row.stage}</td>
                    <td className="py-2 px-2 text-zinc-400 truncate max-w-[150px]">{row.model}</td>
                    <td className="py-2 px-2 text-right text-blue-400">{row.inputTokens.toLocaleString()}</td>
                    <td className="py-2 px-2 text-right text-emerald-400">{row.outputTokens.toLocaleString()}</td>
                    <td className="py-2 px-2 text-right font-bold text-zinc-200">{row.totalTokens.toLocaleString()}</td>
                    <td className="py-2 px-2 text-right text-zinc-400">
                      <div className="flex items-center justify-end gap-1.5">
                        <span>{pct}%</span>
                        <div className="w-12 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-emerald-500 rounded-full" 
                            style={{ width: `${Math.min(100, Number(pct))}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
