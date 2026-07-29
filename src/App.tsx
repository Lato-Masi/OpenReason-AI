/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  Brain, 
  Layers, 
  CheckCircle2, 
  ChevronRight, 
  Zap, 
  Activity, 
  Terminal,
  RefreshCw,
  Send,
  AlertCircle,
  Copy,
  Plus,
  ShieldAlert,
  Network,
  Database,
  Hash,
  Info,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Settings,
  Archive,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  BarChart3,
  BookOpen,
  Key,
  HelpCircle,
  AlertTriangle,
  GitFork,
  RotateCcw,
  Sliders
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  processReasoning, 
  analyzeIntent, 
  ReasoningStep, 
  ReasoningMode, 
  ReasoningResult, 
  IntentAnalysis, 
  DiscoveryNode,
  DynamicConfig,
  DEFAULT_DYNAMIC_CONFIG,
  ModuleConfig
} from './services/reasoningEngine';
import { ThinkingLevel } from "@google/genai";
import { 
  POPULAR_OPENROUTER_MODELS, 
  fetchOpenRouterModels, 
  OpenRouterModel,
  isOpenRouterModel 
} from './services/openrouterService';
import { TokenMetricsView } from './components/TokenMetricsView';
import { ReasoningDependencyGraph } from './components/ReasoningDependencyGraph';
import { ConsolidatedLibraryModal } from './components/ConsolidatedLibraryModal';
import { TelemetryAnalyticsModal } from './components/TelemetryAnalyticsModal';
import { TaxonomyExplorerModal } from './components/TaxonomyExplorerModal';
import { PerspectiveEvaluationModal } from './components/PerspectiveEvaluationModal';
import { AssumptionExplorerModal } from './components/AssumptionExplorerModal';
import { ApiKeyModal } from './components/ApiKeyModal';
import { AutoTunerModal } from './components/AutoTunerModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LandingPage } from './components/LandingPage';
import { hasCustomGeminiKey, hasCustomOpenRouterKey } from './services/apiKeyService';
import { formatLLMError, FormattedLLMError } from './services/llmErrorAdapter';
import { BenchmarkPreset } from './data/benchmarkPresets';
import { saveMemory } from './services/db';
import Markdown from 'react-markdown';

const ModelSelect = ({
  value,
  onChange,
  openRouterModels,
  className = ""
}: {
  value: string;
  onChange: (val: string) => void;
  openRouterModels: OpenRouterModel[];
  className?: string;
}) => {
  const geminiModels = [
    { id: "gemini-3.6-flash", name: "Gemini 3.6 Flash (Default)" },
    { id: "gemini-3.1-flash-lite-preview", name: "Gemini 3.1 Flash Lite" },
    { id: "gemini-flash-latest", name: "Gemini Flash Latest" },
    { id: "gemini-3.1-pro-preview", name: "Gemini 3.1 Pro (Paid Key)" }
  ];

  const knownIds = new Set([
    ...geminiModels.map(m => m.id),
    ...openRouterModels.map(m => m.id)
  ]);

  const isUnknownValue = Boolean(value && !knownIds.has(value));

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`bg-zinc-900 border border-zinc-700 text-[10px] px-2 py-1.5 rounded text-zinc-300 font-mono outline-none focus:border-emerald-500/50 ${className}`}
    >
      <optgroup label="Google Gemini">
        {geminiModels.map(m => (
          <option key={m.id} value={m.id}>{m.name}</option>
        ))}
      </optgroup>
      <optgroup label="OpenRouter AI Models">
        {openRouterModels.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name || m.id}
          </option>
        ))}
      </optgroup>
      {isUnknownValue && (
        <optgroup label="Custom / Selected Model">
          <option value={value}>{value}</option>
        </optgroup>
      )}
    </select>
  );
};

const estimateInputTokens = (text: string) => {
  if (!text.trim()) return 0;
  return Math.max(1, Math.ceil(text.length / 3.8));
};

const estimateOutputTokens = (text: string) => {
  if (!text.trim()) return 0;
  const inTokens = estimateInputTokens(text);
  return Math.min(8192, Math.max(300, Math.ceil(inTokens * 2.2 + 250)));
};

const isDeepEqual = (a: any, b: any): boolean => {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== 'object' || typeof b !== 'object') return false;

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
    if (!isDeepEqual(a[key], b[key])) return false;
  }

  return true;
};

export default function App() {
  const [input, setInput] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [intentAnalysis, setIntentAnalysis] = useState<IntentAnalysis | null>(null);
  const [steps, setSteps] = useState<ReasoningStep[]>([]);
  const [currentResult, setCurrentResult] = useState<ReasoningResult | null>(null);
  const [history, setHistory] = useState<ReasoningResult[]>([]);
  const [activeTab, setActiveTab] = useState<'result' | 'steps' | 'metrics'>('result');
  const [traceViewMode, setTraceViewMode] = useState<'graph' | 'timeline' | 'split'>('graph');
  const [selectedModel, setSelectedModel] = useState('gemini-3.6-flash');
  const [temperature, setTemperature] = useState(0.85);
  const [inspectingStep, setInspectingStep] = useState<ReasoningStep | null>(null);
  const [selectedNode, setSelectedNode] = useState<DiscoveryNode | null>(null);
  const [isModelParamsOpen, setIsModelParamsOpen] = useState(true);
  const [isCoreModulesOpen, setIsCoreModulesOpen] = useState(true);
  const [isSystemNoteOpen, setIsSystemNoteOpen] = useState(true);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isLibraryModalOpen, setIsLibraryModalOpen] = useState(false);
  const [libraryModalMode, setLibraryModalMode] = useState<'library' | 'benchkit'>('library');
  const [isInputCollapsed, setIsInputCollapsed] = useState(false);
  const [isTelemetryOpen, setIsTelemetryOpen] = useState(false);
  const [isTaxonomyModalOpen, setIsTaxonomyModalOpen] = useState(false);
  const [isPerspectiveModalOpen, setIsPerspectiveModalOpen] = useState(false);
  const [isAssumptionModalOpen, setIsAssumptionModalOpen] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isAutoTunerOpen, setIsAutoTunerOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'landing' | 'workspace'>('landing');
  const [dynamicConfig, setDynamicConfig] = useState<DynamicConfig>(DEFAULT_DYNAMIC_CONFIG);
  const [isDynamicMode, setIsDynamicMode] = useState(true);
  const [openRouterModels, setOpenRouterModels] = useState<OpenRouterModel[]>(POPULAR_OPENROUTER_MODELS);
  const [isMobileOrTablet, setIsMobileOrTablet] = useState(false);
  const [resetNotice, setResetNotice] = useState(false);
  const [activeErrorBanner, setActiveErrorBanner] = useState<FormattedLLMError | null>(null);

  const handleResetHeatmapDefaults = () => {
    const defaults: DynamicConfig = JSON.parse(JSON.stringify(DEFAULT_DYNAMIC_CONFIG));
    if (selectedModel) {
      Object.keys(defaults.modeConfigs).forEach((modeKey) => {
        defaults.modeConfigs[modeKey as ReasoningMode].model = selectedModel;
      });
      Object.keys(defaults.moduleConfigs).forEach((modKey) => {
        defaults.moduleConfigs[modKey].model = selectedModel;
      });
    }
    setDynamicConfig(defaults);
    setResetNotice(true);
    setTimeout(() => setResetNotice(false), 3000);
  };

  const handleSelectPreset = (preset: BenchmarkPreset, autoRun: boolean = false) => {
    setInput(preset.prompt);
    if (autoRun) {
      setTimeout(() => {
        handleReason(preset.prompt);
      }, 50);
    }
  };

  const syncAllHeatmapStages = (targetModel: string) => {
    if (!targetModel) return;

    setSelectedModel(prev => (prev === targetModel ? prev : targetModel));

    setDynamicConfig(prevConfig => {
      const nextConfig: DynamicConfig = {
        modeConfigs: {
          [ReasoningMode.REFLEX]: { ...prevConfig.modeConfigs[ReasoningMode.REFLEX], model: targetModel },
          [ReasoningMode.ANALYTIC]: { ...prevConfig.modeConfigs[ReasoningMode.ANALYTIC], model: targetModel },
          [ReasoningMode.REFLECTIVE]: { ...prevConfig.modeConfigs[ReasoningMode.REFLECTIVE], model: targetModel },
          [ReasoningMode.CONST_O_T]: { ...prevConfig.modeConfigs[ReasoningMode.CONST_O_T], model: targetModel },
          [ReasoningMode.SELF_REWARDING]: { ...prevConfig.modeConfigs[ReasoningMode.SELF_REWARDING] || { model: targetModel, temperature: 0.70, thinkingLevel: ThinkingLevel.HIGH, codeExecution: true }, model: targetModel },
        },
        moduleConfigs: Object.fromEntries(
          Object.entries(prevConfig.moduleConfigs).map(([key, cfg]) => [
            key,
            { ...(cfg as ModuleConfig), model: targetModel }
          ])
        ) as Record<string, ModuleConfig>
      };

      if (isDeepEqual(prevConfig, nextConfig)) {
        return prevConfig;
      }

      return nextConfig;
    });
  };

  const handleActiveEngineChange = (newModel: string) => {
    syncAllHeatmapStages(newModel);
  };

  useEffect(() => {
    const handleResize = () => {
      const isMobileTablet = window.innerWidth < 1024;
      setIsMobileOrTablet(isMobileTablet);
      if (isMobileTablet) {
        setIsSidebarOpen(false);
        setIsRightSidebarOpen(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchOpenRouterModels().then((models) => {
      if (models && models.length > 0) {
        setOpenRouterModels(models);
      }
    });
  }, []);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  const discoveryNodeCount = steps.reduce((acc, step) => acc + (step.discoveryNodes?.length || 0), 0);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [steps]);

  useEffect(() => {
    // Auto-open sidebar when new knowledge nodes appear? Or just nudge?
    // Let's implement a 'ping' or nudge effect for the sidebar trigger
  }, [discoveryNodeCount]);

  const handleAnalyzeIntent = async () => {
    if (!input.trim() || isAnalyzing || isProcessing) return;

    setIsAnalyzing(true);
    setIntentAnalysis(null);
    
    try {
      const analysis = await analyzeIntent(input, selectedModel);
      setIntentAnalysis(analysis);
    } catch (error) {
      console.error(error);
      // Fallback: just start reasoning if analysis fails
      handleReason(input);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReason = async (refinedPrompt?: string) => {
    const finalPrompt = refinedPrompt || input;
    if (!finalPrompt.trim() || isProcessing) return;

    setIntentAnalysis(null);
    setActiveErrorBanner(null);
    setIsProcessing(true);
    setSteps([]);
    setCurrentResult(null);
    setActiveTab('steps');

    try {
      const result = await processReasoning(finalPrompt, (newStep) => {
        setSteps(prev => [...prev, newStep]);
      }, { 
        model: selectedModel, 
        temperature: isDynamicMode ? undefined : temperature,
        dynamicConfig: isDynamicMode ? dynamicConfig : undefined
      });

      setCurrentResult(result);
      setHistory(prev => [result, ...prev]);
      setActiveTab('result');

      if (result.verdict === "REJECTED" && result.finalAnswer.includes("⚠️")) {
        const errObj = formatLLMError(result.finalAnswer, selectedModel);
        setActiveErrorBanner(errObj);
      }

      // Save execution trace memory to IndexedDB
      saveMemory({
        prompt: finalPrompt,
        strategy: result.strategy || 'DEDUCTIVE',
        mode: result.mode || 'Const-o-T',
        primaryModality: result.primaryModality,
        domainParadigm: result.domainParadigm,
        domainFramework: result.domainFramework,
        finalAnswer: result.finalAnswer,
        stepsCount: result.steps.length,
        totalTokens: result.totalTokens,
        estimatedCost: result.estimatedCost,
        durationMs: result.durationMs,
        timestamp: Date.now(),
        steps: result.steps
      }).catch(err => console.error('IndexedDB save trace error:', err));
    } catch (error: any) {
      console.error("[App] Pipeline execution exception:", error);
      const errObj = formatLLMError(error, selectedModel);
      setActiveErrorBanner(errObj);
    } finally {
      setIsProcessing(false);
    }
  };

  const getStageIcon = (stage: string) => {
    switch (stage.toLowerCase()) {
      case 'classifier': return <Search className="w-3 h-3" />;
      case 'skeleton': return <Layers className="w-3 h-3" />;
      case 'feature mapper': return <Zap className="w-3 h-3" />;
      case 'solver': return <Brain className="w-3 h-3" />;
      case 'verifier': return <CheckCircle2 className="w-3 h-3" />;
      case 'formalizer': return <Terminal className="w-3 h-3" />;
      case 'critic': return <ShieldAlert className="w-3 h-3" />;
      case 'finalizer': return <Zap className="w-3 h-3" />;
      case 'initial reasoning': return <Brain className="w-3 h-3 text-cyan-400" />;
      case 'self-elicitation dialogue': return <Search className="w-3 h-3 text-amber-400" />;
      case 'constraint formalization': return <Terminal className="w-3 h-3 text-purple-400" />;
      case 'constraint-integrated solver': return <Layers className="w-3 h-3 text-emerald-400" />;
      case 'constraint validation': return <CheckCircle2 className="w-3 h-3 text-emerald-400" />;
      default: return <Activity className="w-3 h-3" />;
    }
  };

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'concept': return <Database className="w-3 h-3 text-blue-400" />;
      case 'evidence': return <ShieldAlert className="w-3 h-3 text-emerald-400" />;
      case 'hypothesis': return <Zap className="w-3 h-3 text-amber-400" />;
      case 'logic': return <Hash className="w-3 h-3 text-purple-400" />;
      case 'branch': return <Network className="w-3 h-3 text-pink-400" />;
      default: return <Info className="w-3 h-3 text-zinc-400" />;
    }
  };

  const getModeColor = (mode: ReasoningMode) => {
    switch (mode) {
      case ReasoningMode.REFLEX: return 'text-blue-400 border-blue-400/20 bg-blue-400/5';
      case ReasoningMode.ANALYTIC: return 'text-purple-400 border-purple-400/20 bg-purple-400/5';
      case ReasoningMode.REFLECTIVE: return 'text-amber-400 border-amber-400/20 bg-amber-400/5';
      case ReasoningMode.CONST_O_T: return 'text-emerald-400 border-emerald-400/20 bg-emerald-400/5';
      case ReasoningMode.SELF_REWARDING: return 'text-cyan-400 border-cyan-400/20 bg-cyan-400/5';
    }
  };

  if (viewMode === 'landing') {
    return (
      <>
        <LandingPage 
          onLaunchWorkspace={() => setViewMode('workspace')}
          onOpenLibrary={(mode) => {
            setLibraryModalMode(mode || 'library');
            setIsLibraryModalOpen(true);
          }}
          onSelectPrompt={(prompt) => {
            setInput(prompt);
            setViewMode('workspace');
          }}
        />

        <ConsolidatedLibraryModal 
          isOpen={isLibraryModalOpen}
          onClose={() => setIsLibraryModalOpen(false)}
          onSelectPreset={handleSelectPreset}
          activeModel={selectedModel}
          dynamicConfig={dynamicConfig}
          isDynamicMode={isDynamicMode}
          initialMode={libraryModalMode}
        />

        <ApiKeyModal 
          isOpen={isApiKeyModalOpen}
          onClose={() => setIsApiKeyModalOpen(false)}
          onKeysUpdated={() => {
            fetchOpenRouterModels().then(m => { if (m && m.length > 0) setOpenRouterModels(m); });
          }}
        />
      </>
    );
  }

  return (
    <div className="flex flex-col h-screen w-full bg-zinc-950 text-zinc-200 font-sans overflow-hidden selection:bg-emerald-500 selection:text-black">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-3 sm:px-4 h-14 sm:h-12 border-b border-zinc-700 bg-zinc-800 shrink-0">
        <div className="flex items-center gap-2 sm:gap-3 cursor-pointer group" onClick={() => setViewMode('landing')} title="Return to OpenReason Landing Page & Framework Guide">
          <div className="w-7 h-7 sm:w-6 sm:h-6 bg-emerald-500 rounded flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Brain className="w-4 h-4 text-black" />
          </div>
          <span className="text-xs sm:text-sm font-bold tracking-tight text-white truncate">
            OpenReason <span className="hidden sm:inline text-zinc-500 font-normal">/ Core Pipeline</span>
          </span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <button 
            onClick={() => setViewMode('landing')}
            className="px-2.5 py-1 sm:py-1 hover:bg-zinc-700 rounded transition-colors text-emerald-300 hover:text-white min-h-[44px] sm:min-h-0 flex items-center gap-1.5 relative font-mono text-[11px] border border-emerald-500/30 bg-emerald-500/10 font-bold"
            title="Return to Landing Page & Framework Guide (What, Who, How, When, Where & AI Accuracy)"
          >
            <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">About OpenReason</span>
          </button>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 sm:p-1.5 hover:bg-zinc-700 rounded transition-colors text-zinc-400 hover:text-white min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex items-center justify-center relative"
            title={isSidebarOpen ? "Close Left Sidebar" : "Open Knowledge Explorer"}
          >
            {isSidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
            {discoveryNodeCount > 0 && !isSidebarOpen && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </button>
          <button 
            onClick={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
            className="p-2 sm:p-1.5 hover:bg-zinc-700 rounded transition-colors text-zinc-400 hover:text-white min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex items-center justify-center"
            title={isRightSidebarOpen ? "Close Right Sidebar" : "Open Engine Settings"}
          >
            {isRightSidebarOpen ? <PanelRightClose className="w-4 h-4" /> : <Settings className="w-4 h-4" />}
          </button>
          <button 
            onClick={() => setIsTaxonomyModalOpen(true)}
            className="px-2.5 py-1 sm:py-1 hover:bg-zinc-700 rounded transition-colors text-zinc-200 hover:text-white min-h-[44px] sm:min-h-0 flex items-center gap-1.5 relative font-mono text-[11px] border border-zinc-700 bg-zinc-900 cursor-pointer"
            title="Explore Cognitive Biases, Logical Fallacies & Reasoning Paradigms Catalog"
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline font-bold">Taxonomy</span>
          </button>
          <button 
            onClick={() => setIsAutoTunerOpen(true)}
            className="px-2.5 py-1 sm:py-1 hover:bg-emerald-950/40 rounded transition-colors text-emerald-300 hover:text-emerald-200 min-h-[44px] sm:min-h-0 flex items-center gap-1.5 relative font-mono text-[11px] border border-emerald-500/30 bg-emerald-500/10 cursor-pointer"
            title="Auto-Tuning Parameter Optimization Loop (Token Safeguarded)"
          >
            <Sliders className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline font-bold">Auto-Tuner</span>
          </button>
          <button 
            onClick={() => setIsApiKeyModalOpen(true)}
            className="px-2.5 py-1 sm:py-1 hover:bg-zinc-700 rounded transition-colors text-zinc-200 hover:text-white min-h-[44px] sm:min-h-0 flex items-center gap-1.5 relative font-mono text-[11px] border border-zinc-700 bg-zinc-900 cursor-pointer"
            title="Manage Bring Your Own API Keys (Gemini & OpenRouter)"
          >
            <Key className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline font-bold">API Keys</span>
            {(hasCustomGeminiKey() || hasCustomOpenRouterKey()) && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" title="Custom API key active" />
            )}
          </button>
          <div className="hidden md:flex items-center gap-2 px-2 py-1 bg-zinc-700 rounded text-[11px] font-medium font-mono">
            <div className={`w-2 h-2 rounded-full ${isProcessing || isAnalyzing ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`}></div>
            Status: {isProcessing ? 'Reasoning' : isAnalyzing ? 'Analyzing Intent' : 'Ready'}
          </div>
          <button 
            onClick={handleAnalyzeIntent}
            disabled={!input.trim() || isProcessing || isAnalyzing}
            className={`px-3 sm:px-4 py-2 sm:py-1.5 rounded text-xs sm:text-[11px] font-bold transition-all flex items-center gap-2 min-h-[44px] sm:min-h-0 ${
              input.trim() && !isProcessing && !isAnalyzing
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-lg shadow-emerald-900/20' 
              : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
            }`}
          >
            {(isProcessing || isAnalyzing) && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
            <span className="hidden sm:inline">{isAnalyzing ? 'AUDITING INTENT...' : 'ENGAGE PIPELINE'}</span>
            <span className="sm:hidden">{isAnalyzing ? 'AUDITING...' : 'ENGAGE'}</span>
          </button>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Dynamic Config Modal */}
        <AnimatePresence>
          {isConfigModalOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-md overflow-y-auto"
            >
              <motion.div 
                initial={{ scale: 0.95, y: 10 }}
                animate={{ scale: 1, y: 0 }}
                className="w-full max-w-3xl bg-zinc-900 border border-zinc-700 shadow-2xl rounded-xl overflow-hidden flex flex-col max-h-[92vh]"
              >
                <div className="p-4 sm:p-6 border-b border-zinc-800 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-500 shrink-0">
                      <SlidersHorizontal className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-xs sm:text-sm font-bold text-white uppercase tracking-widest">Inference Heatmap Config</h2>
                      <p className="text-[9px] sm:text-[10px] text-zinc-500 font-mono uppercase">Fine-tune strategy temperatures</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => {
                        setIsConfigModalOpen(false);
                        setIsAutoTunerOpen(true);
                      }}
                      title="Launch Auto-Tuning Parameter Optimization Loop with Token Safeguards"
                      className="px-2.5 py-1 text-[9px] font-mono uppercase bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded transition-all flex items-center gap-1.5 min-h-[36px] cursor-pointer"
                    >
                      <Sliders className="w-3 h-3 text-emerald-400" />
                      <span className="hidden sm:inline font-bold">Auto-Tune Parameters</span>
                      <span className="sm:hidden font-bold">Auto-Tune</span>
                    </button>
                    <button 
                      onClick={handleResetHeatmapDefaults}
                      title="Reset all reasoning mode temperatures and thinking levels to optimized system defaults"
                      className="px-2.5 py-1 text-[9px] font-mono uppercase bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 hover:text-amber-300 border border-amber-500/30 rounded transition-all flex items-center gap-1.5 min-h-[36px] cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span className="hidden sm:inline">Reset Heatmap to Default</span>
                      <span className="sm:hidden">Reset Default</span>
                    </button>
                    <button 
                      onClick={() => syncAllHeatmapStages(selectedModel)}
                      title="Sync all heatmap stages to active engine model"
                      className="px-2.5 py-1 text-[9px] font-mono uppercase bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded transition-all flex items-center gap-1.5 min-h-[36px] cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span className="hidden sm:inline">Sync All to {selectedModel}</span>
                      <span className="sm:hidden">Sync All</span>
                    </button>
                    <button onClick={() => setIsConfigModalOpen(false)} className="p-2 text-zinc-500 hover:text-white min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer">
                      <Plus className="w-5 h-5 rotate-45" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 sm:space-y-10">
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-2 border-b border-emerald-500/10 pb-2">
                       <Zap className="w-3 h-3" /> Strategy Modes
                    </h3>
                    <div className="grid grid-cols-1 gap-4 sm:gap-6">
                      {Object.entries(dynamicConfig.modeConfigs).map(([mode, cfg]) => {
                        const moduleCfg = cfg as ModuleConfig;
                        return (
                        <div key={mode} className="p-3 sm:p-4 bg-zinc-800/50 rounded-lg border border-zinc-700 space-y-3 sm:space-y-4">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] text-zinc-200 font-bold uppercase tracking-tight">{mode}</label>
                            <span className={`text-[8px] px-1.5 py-0.5 rounded border border-emerald-500/30 text-emerald-400 font-mono`}>ENGINE CONFIG: {mode}</span>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                            <div className="space-y-1.5">
                              <label className="text-[9px] text-zinc-500 font-mono uppercase">Model Engine</label>
                              <ModelSelect 
                                value={moduleCfg.model}
                                onChange={(val) => setDynamicConfig({
                                  ...dynamicConfig,
                                  modeConfigs: { ...dynamicConfig.modeConfigs, [mode]: { ...moduleCfg, model: val } }
                                })}
                                openRouterModels={openRouterModels}
                                className="w-full"
                              />
                            </div>
                            
                            <div className="space-y-1.5">
                              <label className="text-[9px] text-zinc-500 font-mono uppercase text-left block">Temp: {moduleCfg.temperature.toFixed(2)}</label>
                              <input 
                                type="range" min="0" max="1" step="0.05" value={moduleCfg.temperature}
                                onChange={(e) => setDynamicConfig({
                                  ...dynamicConfig,
                                  modeConfigs: { ...dynamicConfig.modeConfigs, [mode]: { ...moduleCfg, temperature: parseFloat(e.target.value) } }
                                })}
                                className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none accent-emerald-500"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[9px] text-zinc-500 font-mono uppercase">Thinking Level</label>
                              <select 
                                value={moduleCfg.thinkingLevel}
                                onChange={(e) => setDynamicConfig({
                                  ...dynamicConfig,
                                  modeConfigs: { ...dynamicConfig.modeConfigs, [mode]: { ...moduleCfg, thinkingLevel: e.target.value as ThinkingLevel } }
                                })}
                                className="w-full bg-zinc-900 border border-zinc-700 text-[10px] px-2 py-1.5 rounded text-zinc-300 font-mono outline-none min-h-[38px] sm:min-h-0"
                              >
                                <option value={ThinkingLevel.HIGH}>High Reasoning</option>
                                <option value={ThinkingLevel.LOW}>Low Latency</option>
                                <option value={ThinkingLevel.MINIMAL}>Minimal (Fast)</option>
                              </select>
                            </div>

                            <div className="space-y-1.5 flex flex-col justify-center">
                              <label className="text-[9px] text-zinc-500 font-mono uppercase mb-1">Code Execution</label>
                              <button 
                                onClick={() => setDynamicConfig({
                                  ...dynamicConfig,
                                  modeConfigs: { ...dynamicConfig.modeConfigs, [mode]: { ...moduleCfg, codeExecution: !moduleCfg.codeExecution } }
                                })}
                                className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase transition-all border min-h-[38px] sm:min-h-0 flex items-center justify-center ${
                                  moduleCfg.codeExecution 
                                    ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' 
                                    : 'bg-zinc-900 border-zinc-700 text-zinc-500'
                                }`}
                              >
                                {moduleCfg.codeExecution ? 'ENABLED' : 'DISABLED'}
                              </button>
                            </div>
                          </div>
                        </div>
                      );})}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-[10px] font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2 border-b border-blue-500/10 pb-2">
                       <Layers className="w-3 h-3" /> Technical Modules
                    </h3>
                    <div className="grid grid-cols-1 gap-3 sm:gap-4">
                      {Object.entries(dynamicConfig.moduleConfigs).map(([module, cfg]) => {
                        const moduleCfg = cfg as ModuleConfig;
                        return (
                        <div key={module} className="p-3 bg-zinc-800/30 rounded-lg border border-zinc-700 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4 items-center">
                          <label className="text-[10px] text-zinc-400 font-mono uppercase font-bold">{module}</label>
                          
                          <ModelSelect 
                            value={moduleCfg.model}
                            onChange={(val) => setDynamicConfig({
                              ...dynamicConfig,
                              moduleConfigs: { ...dynamicConfig.moduleConfigs, [module]: { ...moduleCfg, model: val } }
                            })}
                            openRouterModels={openRouterModels}
                            className="w-full"
                          />

                          <div className="flex items-center gap-2">
                            <input 
                              type="range" min="0" max="1" step="0.05" value={moduleCfg.temperature}
                              onChange={(e) => setDynamicConfig({
                                ...dynamicConfig,
                                moduleConfigs: { ...dynamicConfig.moduleConfigs, [module]: { ...moduleCfg, temperature: parseFloat(e.target.value) } }
                              })}
                              className="flex-1 h-1.5 bg-zinc-700 rounded-lg appearance-none accent-blue-500"
                            />
                            <span className="text-[9px] font-mono text-blue-400 w-6 text-right">{moduleCfg.temperature.toFixed(2)}</span>
                          </div>

                          <select 
                            value={moduleCfg.thinkingLevel}
                            onChange={(e) => setDynamicConfig({
                              ...dynamicConfig,
                              moduleConfigs: { ...dynamicConfig.moduleConfigs, [module]: { ...moduleCfg, thinkingLevel: e.target.value as ThinkingLevel } }
                            })}
                            className="bg-zinc-900 border border-zinc-700 text-[9px] px-2 py-1.5 rounded text-zinc-300 font-mono outline-none min-h-[36px] sm:min-h-0"
                          >
                            <option value={ThinkingLevel.HIGH}>HIGH</option>
                            <option value={ThinkingLevel.LOW}>LOW</option>
                            <option value={ThinkingLevel.MINIMAL}>MIN</option>
                          </select>

                          <button 
                            onClick={() => setDynamicConfig({
                              ...dynamicConfig,
                              moduleConfigs: { ...dynamicConfig.moduleConfigs, [module]: { ...moduleCfg, codeExecution: !moduleCfg.codeExecution } }
                            })}
                            className={`px-2 py-1.5 rounded text-[8px] font-bold uppercase transition-all border text-center min-h-[36px] sm:min-h-0 flex items-center justify-center ${
                              moduleCfg.codeExecution 
                                ? 'bg-blue-500/10 border-blue-500/40 text-blue-400' 
                                : 'bg-zinc-900 border-zinc-700 text-zinc-600'
                            }`}
                          >
                            {moduleCfg.codeExecution ? 'CODE: ON' : 'CODE: OFF'}
                          </button>
                        </div>
                      );})}
                    </div>
                  </div>
                </div>

                <div className="p-4 sm:p-6 bg-zinc-950/50 border-t border-zinc-800 flex flex-col sm:flex-row justify-between items-center gap-3 shrink-0">
                  <div className="flex items-center gap-3">
                    <p className="text-[9px] text-zinc-600 font-mono max-w-xs text-center sm:text-left">
                      Higher temperatures increase creativity but may introduce logical hallucinations.
                    </p>
                    {resetNotice && (
                      <span className="text-[9px] text-emerald-400 font-mono bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/30 font-bold tracking-tight">
                        ✓ Defaults Restored
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                    <button 
                      onClick={handleResetHeatmapDefaults}
                      className="w-full sm:w-auto px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-amber-400 hover:text-amber-300 border border-amber-500/30 hover:border-amber-500/50 rounded text-[10px] font-bold uppercase tracking-widest transition-all min-h-[44px] flex items-center justify-center gap-1.5 cursor-pointer font-mono"
                      title="Reset all reasoning mode temperatures and thinking levels to optimized system defaults"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset Heatmap to Default</span>
                    </button>
                    <button 
                      onClick={() => setIsConfigModalOpen(false)}
                      className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold uppercase tracking-widest transition-all shadow-lg shadow-emerald-900/20 min-h-[44px] flex items-center justify-center cursor-pointer font-mono"
                    >
                      Save Configuration
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* LLM Adapter Error Banner Overlay */}
        <AnimatePresence>
          {activeErrorBanner && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            >
              <motion.div 
                initial={{ scale: 0.95, y: 10 }}
                animate={{ scale: 1, y: 0 }}
                className="w-full max-w-lg bg-zinc-900 border border-amber-500/40 rounded-2xl p-6 shadow-2xl space-y-4 font-sans"
              >
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-mono font-bold text-white tracking-wide">
                        {activeErrorBanner.title}
                      </h3>
                      <span className="text-[10px] font-mono text-amber-400 font-bold uppercase">
                        ErrorCode: {activeErrorBanner.errorCode}
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setActiveErrorBanner(null)}
                    className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
                  >
                    <Plus className="w-5 h-5 rotate-45" />
                  </button>
                </div>

                <div className="p-3.5 bg-zinc-950/80 rounded-xl border border-zinc-800 space-y-2 text-xs text-zinc-300 font-mono">
                  <p className="leading-relaxed font-semibold text-amber-200">
                    {activeErrorBanner.userMessage}
                  </p>
                  <div className="pt-2 border-t border-zinc-800 text-[11px] text-zinc-400">
                    <strong className="text-emerald-400">Recommended Action: </strong>
                    {activeErrorBanner.actionableAdvice}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2 font-mono text-xs">
                  {activeErrorBanner.isApiKeyError && (
                    <button
                      onClick={() => {
                        setActiveErrorBanner(null);
                        setIsApiKeyModalOpen(true);
                      }}
                      className="w-full sm:w-auto px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Key className="w-4 h-4 text-amber-400" />
                      Configure API Keys
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setActiveErrorBanner(null);
                      handleReason();
                    }}
                    className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Retry Request
                  </button>

                  <button
                    onClick={() => setActiveErrorBanner(null)}
                    className="w-full sm:w-auto px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl transition-colors cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Discovery Node Detail Overlay */}
        <AnimatePresence>
          {selectedNode && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs"
            >
              <motion.div 
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                className="w-full max-w-lg bg-zinc-900 border border-emerald-500/30 rounded-xl p-4 sm:p-6 shadow-2xl"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/10 rounded-lg shrink-0">
                      {getNodeIcon(selectedNode.type)}
                    </div>
                    <div>
                      <h2 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">{selectedNode.label}</h2>
                      <span className="text-[10px] text-emerald-500 font-mono uppercase tracking-tighter">{selectedNode.type} discovered</span>
                    </div>
                  </div>
                  <button onClick={() => setSelectedNode(null)} className="p-2 text-zinc-500 hover:text-white min-h-[44px] min-w-[44px] flex items-center justify-center">
                    <Plus className="w-5 h-5 rotate-45" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div className="p-3 sm:p-4 bg-zinc-800 rounded-lg border border-zinc-700 text-xs text-zinc-300 leading-relaxed font-mono break-words">
                    {selectedNode.description || "No expanded metadata available for this logical node."}
                  </div>
                  <div className="flex justify-end pt-2">
                    <button 
                      onClick={() => setSelectedNode(null)}
                      className="w-full sm:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold uppercase tracking-widest transition-all min-h-[44px] flex items-center justify-center"
                    >
                      Close Inspector
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {intentAnalysis && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-sm overflow-y-auto"
            >
              <motion.div 
                initial={{ scale: 0.95, y: 10 }}
                animate={{ scale: 1, y: 0 }}
                className="w-full max-w-2xl bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl p-4 sm:p-6 flex flex-col gap-4 sm:gap-6 max-h-[90vh] overflow-hidden"
              >
                <div className="flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-500/20 rounded-lg shrink-0">
                      <ShieldAlert className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <h2 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">Intent Audit Results</h2>
                      <p className="text-[10px] text-zinc-500 uppercase font-mono">Cognitive Filter Layer Active</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIntentAnalysis(null)}
                    className="p-2 text-zinc-500 hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                  >
                    <Plus className="w-5 h-5 rotate-45" />
                  </button>
                </div>

                <div className="space-y-4 overflow-y-auto pr-1 sm:pr-2 pb-4 scroll-smooth">
                  {/* Biases/Assumptions */}
                  <div className="space-y-2">
                    <h3 className="text-[10px] font-bold text-amber-400 uppercase tracking-widest flex items-center gap-2">
                      <AlertCircle className="w-3 h-3" />
                      Detected Biases & Assumptions
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {intentAnalysis.biases.map((bias, i) => (
                        <div key={i} className="px-2 py-1 bg-amber-500/10 border border-amber-500/20 rounded text-[10px] text-amber-200/80 font-mono">
                          {bias}
                        </div>
                      ))}
                      {intentAnalysis.biases.length === 0 && <span className="text-[10px] text-zinc-600">No significant biases detected.</span>}
                    </div>
                  </div>

                  {/* Refinement Options */}
                  <div className="space-y-3">
                    <h3 className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                      <Brain className="w-3 h-3" />
                      Select Refined Logical Intent
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
                      {intentAnalysis.refined_intents.map((opt, i) => (
                        <button 
                          key={i}
                          onClick={() => handleReason(opt.refined_prompt)}
                          className="group text-left p-3 sm:p-4 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-emerald-500/50 rounded-lg transition-all duration-200 min-h-[44px]"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-[10px] font-bold text-zinc-500 group-hover:text-emerald-400 uppercase font-mono tracking-tighter">
                              {opt.label}
                            </span>
                            <ChevronRight className="w-3 h-3 text-zinc-600 group-hover:text-emerald-400" />
                          </div>
                          <p className="text-xs text-white mb-2 leading-relaxed font-mono italic">"{opt.refined_prompt}"</p>
                          <p className="text-[10px] text-zinc-400 leading-snug">Rationale: {opt.rationale}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-800 flex justify-end gap-3">
                  <button 
                    onClick={() => setIntentAnalysis(null)}
                    className="px-4 py-2 text-[10px] font-bold text-zinc-500 hover:text-white uppercase tracking-widest transition-colors"
                  >
                    Cancel / Restate
                  </button>
                  <button 
                    onClick={() => handleReason(input)}
                    className="px-4 py-2 bg-zinc-800 border border-zinc-700 rounded text-[10px] font-bold text-zinc-300 hover:bg-zinc-700 hover:text-white uppercase tracking-widest transition-all"
                  >
                    Proceed with Original Prompt
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile / Tablet Left Drawer Backdrop */}
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-xs z-40 lg:hidden"
            />
          )}
        </AnimatePresence>

        {/* Mobile / Tablet Left Slide-Over Drawer */}
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw] bg-zinc-950 border-r border-zinc-800 shadow-2xl flex flex-col lg:hidden"
            >
              <div className="p-3 text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center justify-between border-b border-zinc-800">
                <span className="flex items-center gap-2">
                  <Brain className="w-3.5 h-3.5 text-emerald-500" />
                  Knowledge Explorer
                </span>
                <button 
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-1 text-zinc-400 hover:text-white rounded hover:bg-zinc-800"
                >
                  <Plus className="w-4 h-4 rotate-45" />
                </button>
              </div>
              <div className="flex flex-1 flex-col gap-0.5 px-2 text-[12px] overflow-y-auto">
                {steps.length === 0 ? (
                  <div className="p-4 text-center">
                    <p className="text-[10px] text-zinc-600 italic">No nodes discovered yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4 mt-2">
                    {steps.some(s => s.discoveryNodes) ? (
                      steps.filter(s => s.discoveryNodes).map((step, sIdx) => (
                        <div key={sIdx} className="space-y-1">
                          <div className="px-2 py-1 text-[9px] font-bold text-zinc-600 uppercase tracking-tighter border-b border-zinc-800/50 flex items-center justify-between">
                            {step.stage} findings
                            <div className="w-1 h-1 rounded-full bg-emerald-500"></div>
                          </div>
                          <div className="space-y-0.5">
                            {step.discoveryNodes?.map((node, nIdx) => (
                              <button 
                                key={nIdx}
                                onClick={() => { setSelectedNode(node); setIsSidebarOpen(false); }}
                                className="w-full flex items-center gap-2 p-2 hover:bg-zinc-800 rounded text-left group transition-colors min-h-[40px]"
                              >
                                <span className="shrink-0">{getNodeIcon(node.type)}</span>
                                <span className="truncate text-zinc-400 group-hover:text-zinc-200">{node.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="px-3 py-6 text-center border border-dashed border-zinc-800 rounded-lg mx-2">
                        <Activity className="w-4 h-4 text-zinc-800 mx-auto mb-2" />
                        <p className="text-[10px] text-zinc-700 font-mono">Aggregating trace findings...</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="p-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider border-t border-zinc-900 mt-2">Execution Archive</div>
              <div className="flex flex-1 flex-col gap-1 px-2 text-[12px] overflow-y-auto">
                {history.length === 0 ? (
                  <div className="p-3 text-zinc-600 italic text-[11px]">No local cache</div>
                ) : (
                  history.map((h, i) => (
                    <button 
                      key={i}
                      onClick={() => { setCurrentResult(h); setSteps(h.steps); setActiveTab('result'); setIsSidebarOpen(false); }}
                      className={`flex flex-col gap-1 p-2 rounded text-left group transition-colors min-h-[44px] justify-center ${
                        currentResult === h ? 'bg-zinc-700 text-emerald-400' : 'hover:bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="truncate flex-1 font-mono text-[10px]">{h.finalAnswer.substring(0, 20)}...</span>
                        <span className="text-[9px] opacity-40 uppercase">{h.mode}</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
              <div className="mt-auto p-3 border-t border-zinc-800 bg-zinc-900/50">
                <div className="text-[10px] text-zinc-500 mb-1 font-mono uppercase tracking-widest">OpenReason / Main</div>
                <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                  <span className="flex items-center gap-1">MODELS: {3 + openRouterModels.length}</span>
                  <span className="flex items-center gap-1">LATENCY: OK</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Desktop Left Sidebar: Knowledge & History */}
        <motion.aside 
          initial={false}
          animate={{ width: isSidebarOpen ? 224 : 48 }}
          className="border-r border-zinc-700 bg-zinc-950 flex-col overflow-hidden relative hidden lg:flex"
        >
          {isSidebarOpen ? (
            <>
              <div className="p-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex items-center justify-between">
                Knowledge Explorer
                <Brain className="w-3 h-3 text-emerald-500" />
              </div>
              <div className="flex flex-1 flex-col gap-0.5 px-2 text-[12px] overflow-y-auto">
                {steps.length === 0 ? (
                  <div className="p-4 text-center">
                    <p className="text-[10px] text-zinc-600 italic">No nodes discovered yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4 mt-2">
                    {steps.some(s => s.discoveryNodes) ? (
                      steps.filter(s => s.discoveryNodes).map((step, sIdx) => (
                        <div key={sIdx} className="space-y-1">
                          <div className="px-2 py-1 text-[9px] font-bold text-zinc-600 uppercase tracking-tighter border-b border-zinc-800/50 flex items-center justify-between">
                            {step.stage} findings
                            <div className="w-1 h-1 rounded-full bg-emerald-500"></div>
                          </div>
                          <div className="space-y-0.5">
                            {step.discoveryNodes?.map((node, nIdx) => (
                              <button 
                                key={nIdx}
                                onClick={() => setSelectedNode(node)}
                                className="w-full flex items-center gap-2 p-1.5 hover:bg-zinc-800 rounded text-left group transition-colors"
                              >
                                <span className="shrink-0">{getNodeIcon(node.type)}</span>
                                <span className="truncate text-zinc-400 group-hover:text-zinc-200">{node.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="px-3 py-6 text-center border border-dashed border-zinc-800 rounded-lg mx-2">
                        <Activity className="w-4 h-4 text-zinc-800 mx-auto mb-2" />
                        <p className="text-[10px] text-zinc-700 font-mono">Aggregating trace findings...</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="p-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider border-t border-zinc-900 mt-4">Execution Archive</div>
              <div className="flex flex-1 flex-col gap-1 px-2 text-[12px] overflow-y-auto">
                {history.length === 0 ? (
                  <div className="p-3 text-zinc-600 italic text-[11px]">No local cache</div>
                ) : (
                  history.map((h, i) => (
                    <button 
                      key={i}
                      onClick={() => { setCurrentResult(h); setSteps(h.steps); setActiveTab('result'); }}
                      className={`flex flex-col gap-1 p-2 rounded text-left group transition-colors ${
                        currentResult === h ? 'bg-zinc-700 text-emerald-400' : 'hover:bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="truncate flex-1 font-mono text-[10px]">{h.finalAnswer.substring(0, 20)}...</span>
                        <span className="text-[9px] opacity-40 uppercase">{h.mode}</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
              <div className="mt-auto p-3 border-t border-zinc-700 bg-zinc-900/50">
                <div className="text-[10px] text-zinc-500 mb-2 font-mono uppercase tracking-widest">OpenReason / Main</div>
                <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                  <span className="flex items-center gap-1">MODELS: {3 + openRouterModels.length}</span>
                  <span className="flex items-center gap-1">LATENCY: OK</span>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center py-4 gap-6">
              <div className="relative cursor-pointer" onClick={() => setIsSidebarOpen(true)}>
                <Brain className="w-5 h-5 text-emerald-500" />
                {discoveryNodeCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                )}
              </div>
              <div className="relative cursor-pointer" onClick={() => setIsSidebarOpen(true)}>
                <Archive className="w-5 h-5 text-zinc-500" />
                {history.length > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center bg-zinc-700 text-[7px] font-bold text-zinc-300 rounded-full">
                    {history.length}
                  </span>
                )}
              </div>
            </div>
          )}
        </motion.aside>

        {/* Major Viewport */}
        <main className="flex-1 flex flex-col bg-zinc-900 overflow-hidden relative min-w-0">
          <div className={`flex-1 flex flex-col ${isInputCollapsed ? 'lg:flex' : 'lg:grid lg:grid-rows-2'} gap-px bg-zinc-700 overflow-y-auto lg:overflow-hidden transition-all duration-300`}>
            
            {/* Top Pane: Input */}
            <div className={`bg-zinc-950 p-3 sm:p-4 flex flex-col shrink-0 ${isInputCollapsed ? 'min-h-0 py-2.5 border-b border-zinc-800' : 'lg:shrink min-h-[220px] lg:min-h-0'} overflow-hidden transition-all duration-300`}>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                    <Terminal className="w-3 h-3 text-emerald-400" />
                    Reasoning Context Input
                  </h3>
                  <button 
                    onClick={() => setIsInputCollapsed(!isInputCollapsed)}
                    className="px-2 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 hover:text-white font-bold text-[9px] font-mono flex items-center gap-1 transition-all shadow-sm cursor-pointer"
                    title={isInputCollapsed ? "Expand Reasoning Context Input Box" : "Collapse Reasoning Context Input Box"}
                  >
                    {isInputCollapsed ? (
                      <>
                        <ChevronDown className="w-3 h-3 text-emerald-400" />
                        <span>Expand Context</span>
                      </>
                    ) : (
                      <>
                        <ChevronUp className="w-3 h-3 text-zinc-400" />
                        <span>Collapse Context</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="flex items-center gap-1.5 text-[9px] font-mono">
                  <button 
                    onClick={() => { setLibraryModalMode('library'); setIsLibraryModalOpen(true); }}
                    className="px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-emerald-500/40 font-bold transition-all flex items-center gap-1.5 shadow-sm hover:scale-[1.02] active:scale-[0.98]"
                    title="Open Consolidated Templates, Prompts & BenchKit AST Benchmarks Hub"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Templates, Prompts & Benchmarks</span>
                    <span className="px-1 py-0.2 rounded text-[8px] bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-500/30">
                      AST
                    </span>
                  </button>

                  <button 
                    onClick={() => setIsTelemetryOpen(true)}
                    className="px-2.5 py-1 rounded bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/40 font-bold transition-all flex items-center gap-1.5 shadow-sm hover:scale-[1.02] active:scale-[0.98]"
                    title="Open IndexedDB Telemetry & Metric Dashboard"
                  >
                    <Activity className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Telemetry Vault</span>
                    <span className="px-1 py-0.2 rounded text-[8px] bg-indigo-500/30 text-indigo-200">
                      IndexedDB
                    </span>
                  </button>
                </div>
              </div>

              {isInputCollapsed ? (
                <div 
                  onClick={() => setIsInputCollapsed(false)}
                  className="bg-zinc-900/80 hover:bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700 rounded-lg p-2.5 flex items-center justify-between gap-3 text-xs font-mono cursor-pointer transition-all group"
                  title="Click to expand reasoning context input"
                >
                  <div className="flex items-center gap-2 truncate text-zinc-300 min-w-0">
                    <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase font-bold shrink-0">
                      Active Context
                    </span>
                    <span className="truncate text-zinc-400 group-hover:text-zinc-200 transition-colors">
                      {input.trim() ? input.replace(/\s+/g, ' ') : '(No prompt context set — click to expand and insert reasoning task)'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-[10px] text-zinc-500 shrink-0">
                    <span>chars: {input.length}</span>
                    <span className="hidden sm:inline">~{estimateInputTokens(input)} in / ~{estimateOutputTokens(input)} out tokens</span>
                    <span className="text-emerald-400 group-hover:underline flex items-center gap-0.5 font-bold">
                      Expand <ChevronDown className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex-1 bg-zinc-800 rounded border border-zinc-700 flex flex-col min-h-[140px]">
                  <textarea 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Insert logic problem or reasoning task..."
                    className="flex-1 p-3 sm:p-4 bg-transparent outline-none resize-none font-mono text-xs sm:text-sm leading-relaxed text-emerald-100 placeholder:text-zinc-600 min-h-[90px]"
                  />
                  <div className="px-3 sm:px-4 py-2 bg-zinc-900 border-t border-zinc-700 flex flex-wrap justify-between items-center gap-2 shrink-0">
                    <div className="flex items-center gap-2 sm:gap-3 text-[10px] font-mono text-zinc-500 flex-wrap">
                      <span>chars: {input.length}</span>
                      <span className="text-zinc-700">|</span>
                      <span className="flex items-center gap-1 text-emerald-400/90 font-semibold" title="Estimated prompt input tokens and expected reasoning output tokens">
                        <Hash className="w-3 h-3 text-emerald-500 shrink-0" />
                        <span className="text-zinc-400">Est. Tokens:</span>
                        <span className="text-zinc-300">~{estimateInputTokens(input)} in</span>
                        <span className="text-zinc-600">/</span>
                        <span className="text-emerald-400">~{estimateOutputTokens(input)} out</span>
                      </span>
                    </div>
                    <button 
                      onClick={() => setInput('')}
                      className="text-[10px] font-bold text-zinc-500 hover:text-white uppercase transition-colors min-h-[36px] sm:min-h-0 flex items-center"
                    >
                      Clear Input
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Pane: Trace/Result */}
            <div className="bg-zinc-950 p-3 sm:p-4 flex flex-col flex-1 lg:flex-1 min-h-[300px] lg:min-h-0 overflow-hidden relative">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 border-b border-zinc-800 pb-2 shrink-0">
                <div className="flex gap-2 sm:gap-4 flex-wrap">
                  <button 
                    onClick={() => setActiveTab('result')}
                    className={`text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-colors py-1 ${activeTab === 'result' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-zinc-500 hover:text-zinc-300'}`}
                  >
                    Output Result
                  </button>
                  <button 
                    onClick={() => setActiveTab('steps')}
                    className={`text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-colors py-1 ${activeTab === 'steps' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-zinc-500 hover:text-zinc-300'}`}
                  >
                    Trace Logic
                  </button>
                  <button 
                    onClick={() => setActiveTab('metrics')}
                    className={`text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-colors py-1 flex items-center gap-1.5 ${activeTab === 'metrics' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-zinc-500 hover:text-zinc-300'}`}
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    Token Metrics
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  {currentResult && (
                    <span className={`text-[9px] px-2 py-0.5 rounded border uppercase font-bold ${getModeColor(currentResult.mode)}`}>
                      {currentResult.mode} MODE active
                    </span>
                  )}
                  {currentResult?.strategy && currentResult.strategy !== 'NONE' && (
                    <span className="text-[9px] px-2 py-0.5 rounded border border-emerald-500/30 text-emerald-400 uppercase font-bold bg-emerald-500/5">
                      {currentResult.strategy}
                    </span>
                  )}
                  {currentResult?.domainParadigm && currentResult.domainParadigm !== 'GENERAL' && (
                    <span className="text-[9px] px-2 py-0.5 rounded border border-purple-500/30 text-purple-300 uppercase font-bold bg-purple-500/10">
                      Domain: {currentResult.domainParadigm}
                    </span>
                  )}
                  {currentResult?.primaryModality && (
                    <span className="text-[9px] px-2 py-0.5 rounded border border-amber-500/30 text-amber-300 uppercase font-bold bg-amber-500/10">
                      Modality: {currentResult.primaryModality}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto font-mono text-[11px] text-zinc-300 pr-1 sm:pr-2 scroll-smooth" ref={scrollRef}>
                <AnimatePresence mode="wait">
                  {activeTab === 'steps' ? (
                    <motion.div 
                      key="steps"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="space-y-4"
                    >
                      {/* Trace View Mode Selector */}
                      <div className="flex items-center justify-between bg-zinc-900/60 p-2 rounded-lg border border-zinc-800 font-mono text-[10px]">
                        <div className="flex items-center gap-2">
                          <GitFork className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-zinc-300 font-bold uppercase tracking-wider">Trace Visualization Mode</span>
                        </div>
                        <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded border border-zinc-800">
                          <button
                            onClick={() => setTraceViewMode('graph')}
                            className={`px-2 py-0.5 rounded font-bold transition-colors ${traceViewMode === 'graph' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-zinc-500 hover:text-zinc-300'}`}
                          >
                            D3 Logic Graph
                          </button>
                          <button
                            onClick={() => setTraceViewMode('split')}
                            className={`px-2 py-0.5 rounded font-bold transition-colors ${traceViewMode === 'split' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-zinc-500 hover:text-zinc-300'}`}
                          >
                            Split Graph & Logs
                          </button>
                          <button
                            onClick={() => setTraceViewMode('timeline')}
                            className={`px-2 py-0.5 rounded font-bold transition-colors ${traceViewMode === 'timeline' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-zinc-500 hover:text-zinc-300'}`}
                          >
                            Sequential Logs
                          </button>
                        </div>
                      </div>

                      {/* D3 Graph View */}
                      {(traceViewMode === 'graph' || traceViewMode === 'split') && (
                        <div className="w-full">
                          <ReasoningDependencyGraph
                            steps={steps}
                            result={currentResult}
                            onSelectStep={(step) => setInspectingStep(step)}
                            className={traceViewMode === 'split' ? 'h-[380px]' : 'h-[520px]'}
                          />
                        </div>
                      )}

                      {/* Sequential Log Timeline View */}
                      {(traceViewMode === 'timeline' || traceViewMode === 'split') && (
                        <div className="space-y-4 pt-2">
                          {steps.length === 0 && (
                            <div className="py-10 text-center text-zinc-600 italic">No logic trace initiated</div>
                          )}
                          {steps.map((step, idx) => (
                            <div key={idx} className="group">
                              <div className="flex flex-wrap items-center justify-between gap-1 mb-1.5">
                                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                                  <span className="text-emerald-500 font-bold">[{step.stage.toUpperCase()}]</span>
                                  {step.model && (
                                    <span className="text-[8px] px-1 bg-emerald-500/10 text-emerald-400/70 border border-emerald-500/20 rounded font-mono uppercase">{step.model}</span>
                                  )}
                                  {step.temperature !== undefined && (
                                    <span className="text-[8px] px-1 bg-zinc-800 text-zinc-500 rounded font-mono">HEAT: {step.temperature.toFixed(2)}</span>
                                  )}
                                  {step.thought && (
                                    <span className="text-[8px] px-1 bg-blue-500/10 text-blue-400 rounded font-mono uppercase animate-pulse border border-blue-500/20">Thinking Active</span>
                                  )}
                                  {step.codeExecution && (
                                    <span className="text-[8px] px-1 bg-amber-500/10 text-amber-400 rounded font-mono uppercase border border-amber-500/20">Code Run</span>
                                  )}
                                  {step.evidence && (
                                    <span className="flex items-center gap-1 bg-emerald-500/20 text-emerald-400 text-[8px] px-1 rounded font-bold uppercase tracking-tighter">
                                      <ShieldAlert className="w-2 h-2" /> Evidence
                                    </span>
                                  )}
                                  <span className="text-[9px] text-zinc-600">{new Date(step.timestamp).toLocaleTimeString()}</span>
                                </div>
                                {(step.rawPrompt || step.rawResponse || step.thought || step.codeExecution) && (
                                  <button 
                                    onClick={() => setInspectingStep(step === inspectingStep ? null : step)}
                                    className="text-[9px] font-bold text-zinc-500 hover:text-emerald-400 uppercase tracking-tighter transition-colors bg-zinc-800 px-2 py-1 rounded flex items-center gap-1 min-h-[32px] sm:min-h-0"
                                  >
                                    {inspectingStep === step ? <ChevronDown className="w-3 h-3 rotate-180" /> : <ChevronDown className="w-3 h-3" />}
                                    {inspectingStep === step ? 'Collapse' : 'Expand'}
                                  </button>
                                )}
                              </div>
                              <div className={`pl-2 sm:pl-4 py-2 border-l border-zinc-800 transition-all ${idx === steps.length - 1 ? 'border-emerald-500/50 bg-emerald-500/[0.02]' : ''}`}>
                                <div className="prose prose-invert prose-xs max-w-none leading-relaxed opacity-90 break-words text-zinc-300">
                                  <Markdown>{step.content}</Markdown>
                                </div>
                                
                                <AnimatePresence>
                                  {inspectingStep === step && (
                                    <motion.div 
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      className="overflow-hidden mt-3 space-y-4"
                                    >
                                      {step.thought && (
                                        <div className="bg-blue-500/5 border border-blue-500/20 p-3 sm:p-4 rounded-lg relative overflow-hidden">
                                          <div className="text-[7px] text-blue-400 font-bold uppercase tracking-widest mb-1">Gemini Internal Thought Trace</div>
                                          <div className="flex items-center gap-2 mb-2">
                                            <Brain className="w-3 h-3 text-blue-400" />
                                            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Cognitive Process Summary</span>
                                          </div>
                                          <div className="prose prose-invert prose-xs max-w-none text-blue-200/80 leading-relaxed pl-2 border-l-2 border-blue-500/30 break-words text-[10px] sm:text-[11px]">
                                            <Markdown>{step.thought}</Markdown>
                                          </div>
                                        </div>
                                      )}

                                      {step.codeExecution && (
                                        <div className="space-y-2">
                                          <div className="bg-amber-500/5 border border-amber-500/20 p-3 sm:p-4 rounded-lg relative overflow-hidden">
                                            <div className="text-[7px] text-amber-400 font-bold uppercase tracking-widest mb-1">Python Sandbox Execution</div>
                                            <div className="flex items-center gap-2 mb-2">
                                              <Terminal className="w-3 h-3 text-amber-400" />
                                              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Generated Logic</span>
                                            </div>
                                            <div className="text-[10px] text-amber-100/70 font-mono bg-black/40 p-2 rounded border border-amber-500/10 overflow-x-auto">
                                              {step.codeExecution.code}
                                            </div>
                                          </div>
                                          <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg">
                                            <div className="flex items-center gap-2 mb-2 text-[9px] text-zinc-500">
                                              <Zap className="w-2.5 h-2.5" /> STDOUT/STDERR
                                            </div>
                                            <div className="text-[10px] text-emerald-400 font-mono break-words">
                                              {step.codeExecution.output}
                                            </div>
                                          </div>
                                        </div>
                                      )}

                                      {step.evidence && (
                                        <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-lg">
                                          <div className="flex items-center gap-2 mb-2">
                                            <ShieldAlert className="w-3 h-3 text-emerald-400" />
                                            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Verification Evidence</span>
                                          </div>
                                          <div className="prose prose-invert prose-xs max-w-none text-zinc-300 leading-relaxed italic border-l-2 border-emerald-500/30 pl-3 text-[10px] sm:text-[11px]">
                                            <Markdown>{step.evidence}</Markdown>
                                          </div>
                                        </div>
                                      )}

                                      {step.flawsFound && step.flawsFound.length > 0 && (
                                        <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg space-y-2">
                                          <div className="flex items-center gap-2">
                                            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                                            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">
                                              Cognitive Bias & Fallacy Audit Flags ({step.flawsFound.length})
                                            </span>
                                          </div>
                                          <div className="space-y-1.5">
                                            {step.flawsFound.map((flaw, fIdx) => (
                                              <div key={fIdx} className="bg-black/50 p-2.5 rounded border border-amber-500/20 text-[10px] space-y-1">
                                                <div className="flex items-center justify-between">
                                                  <span className="font-bold text-amber-300 font-mono">{flaw.name}</span>
                                                  <span className="text-[8px] font-mono px-1.5 py-0.5 bg-amber-500/20 text-amber-300 rounded uppercase font-bold">{flaw.severity}</span>
                                                </div>
                                                <p className="text-zinc-300">{flaw.evidence}</p>
                                                <div className="text-emerald-400 font-mono text-[9px]">
                                                  <strong>Mitigation Strategy:</strong> {flaw.mitigation}
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                      
                                      {step.rawPrompt && (
                                        <div className="space-y-1">
                                          <div className="flex items-center justify-between">
                                            <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">Inbound Prompt Context</span>
                                            <button onClick={() => navigator.clipboard.writeText(step.rawPrompt || '')} className="text-[8px] text-zinc-600 hover:text-zinc-400 flex items-center gap-1">
                                              <Copy className="w-2 h-2" /> COPY
                                            </button>
                                          </div>
                                          <div className="bg-black/60 p-2.5 rounded text-[10px] text-emerald-200/60 font-mono whitespace-pre-wrap border border-zinc-800/50 break-words">
                                            {step.rawPrompt}
                                          </div>
                                        </div>
                                      )}
                                      {step.rawResponse && (
                                        <div className="space-y-1">
                                          <div className="flex items-center justify-between">
                                            <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">Outbound Response Raw</span>
                                            <button onClick={() => navigator.clipboard.writeText(step.rawResponse || '')} className="text-[8px] text-zinc-600 hover:text-zinc-400 flex items-center gap-1">
                                              <Copy className="w-2 h-2" /> COPY
                                            </button>
                                          </div>
                                          <div className="bg-black/60 p-2.5 rounded text-[10px] text-amber-200/60 font-mono whitespace-pre-wrap border border-zinc-800/50 break-words">
                                            {step.rawResponse}
                                          </div>
                                        </div>
                                      )}
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {isProcessing && (
                        <div className="flex items-center gap-2 text-emerald-500 italic animate-pulse py-2">
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          Running inference core...
                        </div>
                      )}
                    </motion.div>
                  ) : activeTab === 'result' ? (
                    <motion.div 
                      key="result"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="h-full"
                    >
                      {!currentResult ? (
                        <div className="flex flex-col items-center justify-center h-full opacity-20 py-16 sm:py-20 grayscale">
                          <Brain className="w-10 h-10 sm:w-12 sm:h-12 mb-3 sm:mb-4" />
                          <p className="text-[10px] font-bold uppercase tracking-widest leading-loose text-center">Awaiting output stream</p>
                        </div>
                      ) : (
                        <div className="space-y-4 sm:space-y-6">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3 sm:pb-4">
                            <h2 className="text-base sm:text-xl font-bold text-white uppercase tracking-widest flex items-center gap-2 sm:gap-3">
                              <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 fill-emerald-500/20" /> Synthesis Result
                            </h2>
                            <div className="flex flex-wrap items-center gap-3 sm:gap-6">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">Confidence</span>
                                <div className="w-16 sm:w-24 h-1.5 bg-zinc-800 rounded-full overflow-hidden border border-zinc-700/50">
                                  <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${currentResult.confidence * 100}%` }}
                                    className={`h-full shadow-lg ${currentResult.confidence > 0.8 ? 'bg-emerald-500' : currentResult.confidence > 0.5 ? 'bg-amber-500' : 'bg-red-500'}`}
                                  />
                                </div>
                                <span className={`text-[10px] font-mono font-bold ${currentResult.confidence > 0.8 ? 'text-emerald-400' : 'text-zinc-300'}`}>
                                  {(currentResult.confidence * 100).toFixed(0)}%
                                </span>
                              </div>
                              <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border flex items-center gap-1.5 ${
                                currentResult.verdict === 'STABLE' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 
                                currentResult.verdict === 'UNCERTAIN' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-red-500/10 border-red-500/30 text-red-400'
                              }`}>
                                <div className={`w-1 h-1 rounded-full animate-pulse ${
                                  currentResult.verdict === 'STABLE' ? 'bg-emerald-400' : 
                                  currentResult.verdict === 'UNCERTAIN' ? 'bg-amber-400' : 'bg-red-400'
                                }`} />
                                Verdict: {currentResult.verdict}
                              </div>

                              <button
                                onClick={() => setIsPerspectiveModalOpen(true)}
                                className="px-2.5 py-1 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white rounded text-[10px] font-bold font-mono flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                                title="Run 5-Dimensional Feasibility, Risk, Impact & Sustainability Evaluation"
                              >
                                <Layers className="w-3 h-3" />
                                5D Strategic Audit
                              </button>

                              <button
                                onClick={() => setIsAssumptionModalOpen(true)}
                                className="px-2.5 py-1 bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white rounded text-[10px] font-bold font-mono flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                                title="Run Explicit/Implicit Assumption Extraction & Probabilistic Profile Audit"
                              >
                                <GitFork className="w-3 h-3" />
                                Assumption Matrix
                              </button>
                            </div>
                          </div>

                          {(currentResult.domainParadigm || currentResult.primaryModality || currentResult.domainFramework) && (
                            <div className="bg-zinc-900 border border-zinc-800 rounded p-3 flex flex-wrap items-center justify-between gap-3 font-mono text-[10px] shadow-sm">
                              <div className="flex items-center gap-2">
                                <span className="text-zinc-500 uppercase tracking-widest font-bold">Domain Paradigm:</span>
                                <span className="px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/30 text-purple-300 font-bold uppercase">
                                  {currentResult.domainParadigm || "GENERAL"}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-zinc-500 uppercase tracking-widest font-bold">Epistemic Modality:</span>
                                <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold uppercase">
                                  {currentResult.primaryModality || "DEDUCTIVE"}
                                </span>
                              </div>
                              {currentResult.domainFramework && (
                                <div className="flex items-center gap-2">
                                  <span className="text-zinc-500 uppercase tracking-widest font-bold">Framework:</span>
                                  <span className="px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-bold">
                                    {currentResult.domainFramework}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}

                          <div className="bg-zinc-900 border border-zinc-800 rounded p-3 sm:p-4 shadow-2xl">
                            <div className="prose prose-invert prose-sm max-w-none text-zinc-100 leading-relaxed selection:bg-emerald-500 selection:text-black text-xs sm:text-sm break-words">
                              <Markdown>{currentResult.finalAnswer}</Markdown>
                            </div>
                          </div>

                          {currentResult.flawsAudit && (
                            <div className="bg-zinc-900 border border-zinc-800 rounded p-4 space-y-3 shadow-md">
                              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                                <div className="flex items-center gap-2">
                                  <ShieldAlert className="w-4 h-4 text-emerald-400" />
                                  <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                                    Epistemic Integrity & Flaw Audit
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 font-mono text-xs">
                                  <span className="text-zinc-400">Logical Integrity Score:</span>
                                  <span className="font-bold text-emerald-400">{(currentResult.flawsAudit.score * 100).toFixed(0)}%</span>
                                </div>
                              </div>
                              <p className="text-xs text-zinc-300 font-mono">
                                {currentResult.flawsAudit.mitigationSummary}
                              </p>
                              {currentResult.flawsAudit.flaws.length > 0 && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
                                  {currentResult.flawsAudit.flaws.map((flaw, fIdx) => (
                                    <div key={fIdx} className="p-2.5 bg-black/40 border border-zinc-800 rounded text-xs space-y-1">
                                      <div className="flex items-center justify-between">
                                        <span className="font-bold text-amber-300 font-mono">{flaw.name}</span>
                                        <span className="text-[9px] font-mono px-1.5 py-0.5 bg-amber-500/20 text-amber-300 rounded uppercase font-bold">{flaw.severity}</span>
                                      </div>
                                      <p className="text-[11px] text-zinc-400">{flaw.evidence}</p>
                                      <div className="text-[10px] text-emerald-400 font-mono pt-1 border-t border-zinc-800">
                                        <strong>Mitigation:</strong> {flaw.mitigation}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {currentResult.formalLogic && (
                            <motion.div 
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="border border-emerald-500/20 bg-emerald-500/5 rounded-lg overflow-hidden"
                            >
                              <div className="px-3 py-2 bg-emerald-500/10 border-b border-emerald-500/20 flex flex-wrap items-center justify-between gap-1">
                                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                                  <Terminal className="w-3 h-3" />
                                  Formal Logic Module (HOL / FOL)
                                </span>
                                <span className="text-[9px] font-mono text-emerald-400 opacity-60">
                                  {currentResult.formalLogic.ontology.title}
                                </span>
                              </div>
                              <div className="p-3 sm:p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">Higher Order Ontology</h4>
                                  <div className="bg-black/40 p-3 rounded font-mono text-[9px] text-emerald-300/80 overflow-x-auto max-h-48 overflow-y-auto">
                                    <pre>{JSON.stringify(currentResult.formalLogic.ontology.schema, null, 2)}</pre>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">First Order CEL Expressions</h4>
                                  <div className="space-y-1.5">
                                    {currentResult.formalLogic.expressions.map((exp, i) => (
                                      <div key={i} className="bg-black/40 p-2 rounded border border-emerald-500/10">
                                        <div className="text-[8px] text-emerald-400 mb-1 font-bold">{exp.id}: {exp.description}</div>
                                        <div className="font-mono text-[9px] text-emerald-200">{exp.cel}</div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </div>
                      )}
                    </motion.div>
                  ) : activeTab === 'metrics' ? (
                    <motion.div
                      key="metrics"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <TokenMetricsView steps={steps} currentResult={currentResult} />
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Mini Log Footer */}
          <footer className="h-12 border-t border-zinc-700 bg-zinc-950 flex items-center px-4 gap-4 overflow-hidden">
            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest shrink-0">Terminal Output</span>
            <div className="flex gap-4 items-center overflow-hidden font-mono text-[9px] text-zinc-500 truncate italic">
              {steps.length > 0 ? (
                <div className="truncate">
                  <span className="text-blue-400">INFO</span> [14:22] Completed {steps[steps.length - 1].stage} stage. Memory heap optimized.
                </div>
              ) : (
                <div className="truncate text-zinc-600 underline decoration-zinc-800 underline-offset-4">Kernel idle. Awaiting user engage signal. Connection to OpenReason verified.</div>
              )}
            </div>
          </footer>
        </main>

        {/* Mobile / Tablet Right Drawer Backdrop */}
        <AnimatePresence>
          {isRightSidebarOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsRightSidebarOpen(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-xs z-40 lg:hidden"
            />
          )}
        </AnimatePresence>

        {/* Mobile / Tablet Right Slide-Over Drawer */}
        <AnimatePresence>
          {isRightSidebarOpen && (
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 z-50 w-80 max-w-[85vw] bg-zinc-900 border-l border-zinc-800 shadow-2xl flex flex-col lg:hidden"
            >
              <div className="p-3 text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center justify-between border-b border-zinc-800 shrink-0">
                <span className="flex items-center gap-2">
                  <Settings className="w-3.5 h-3.5 text-emerald-500" />
                  Engine Settings
                </span>
                <button 
                  onClick={() => setIsRightSidebarOpen(false)}
                  className="p-1 text-zinc-400 hover:text-white rounded hover:bg-zinc-800"
                >
                  <Plus className="w-4 h-4 rotate-45" />
                </button>
              </div>
              <div className="p-4 flex flex-col gap-6 overflow-y-auto flex-1">
                <div className="space-y-6">
                  <div className="space-y-4">
                    <button 
                      onClick={() => setIsModelParamsOpen(!isModelParamsOpen)}
                      className="w-full flex items-center justify-between group transition-colors min-h-[38px]"
                    >
                      <div className="text-[10px] font-bold text-zinc-500 group-hover:text-zinc-300 uppercase tracking-widest text-left">Model Parameters</div>
                      <motion.div animate={{ rotate: isModelParamsOpen ? 90 : 0 }} transition={{ duration: 0.2 }}>
                        <ChevronRight className="w-3 h-3 text-zinc-500" />
                      </motion.div>
                    </button>
                    
                    <AnimatePresence initial={false}>
                      {isModelParamsOpen && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden space-y-3"
                        >
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-center">
                              <label className="text-[10px] text-zinc-400 font-mono uppercase tracking-tight">Active Engine</label>
                              {isOpenRouterModel(selectedModel) && (
                                <span className={`text-[8px] px-1 py-0.5 rounded font-mono font-bold uppercase ${
                                  process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_KEY !== 'MY_OPENROUTER_API_KEY'
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                }`}>
                                  {process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_KEY !== 'MY_OPENROUTER_API_KEY' ? 'OpenRouter API' : 'Key Unset'}
                                </span>
                              )}
                            </div>
                            <ModelSelect 
                              value={selectedModel}
                              onChange={(val) => handleActiveEngineChange(val)}
                              openRouterModels={openRouterModels}
                              className="w-full text-zinc-200 font-mono"
                            />
                          </div>
                          <div className="space-y-1.5 pt-3">
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-[10px] text-zinc-400 font-mono uppercase tracking-tight">Dynamic Mode</label>
                              <button 
                                onClick={() => setIsDynamicMode(!isDynamicMode)}
                                className={`w-10 h-5 rounded-full transition-colors relative ${isDynamicMode ? 'bg-emerald-500' : 'bg-zinc-700'}`}
                              >
                                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${isDynamicMode ? 'left-5' : 'left-0.5'}`}></div>
                              </button>
                            </div>
                            
                            {isDynamicMode ? (
                              <button 
                                onClick={() => { setIsConfigModalOpen(true); setIsRightSidebarOpen(false); }}
                                className="w-full flex items-center justify-between p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded group hover:bg-emerald-500/20 transition-all min-h-[44px]"
                              >
                                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Tune Dynamic Heatmap</span>
                                <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
                              </button>
                            ) : (
                              <div className="space-y-2">
                                <div className="flex justify-between text-[10px] text-zinc-400 font-mono uppercase">
                                  <label>Fixed Inference Temp</label>
                                  <span className="text-emerald-400 font-bold">{temperature.toFixed(2)}</span>
                                </div>
                                <input 
                                  type="range"
                                  min="0"
                                  max="1"
                                  step="0.05"
                                  value={temperature}
                                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                                  className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                                />
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="space-y-4">
                    <button 
                      onClick={() => setIsCoreModulesOpen(!isCoreModulesOpen)}
                      className="w-full flex items-center justify-between group transition-colors min-h-[38px]"
                    >
                      <div className="text-[10px] font-bold text-zinc-500 group-hover:text-zinc-300 uppercase tracking-widest text-left">Core Modules</div>
                      <motion.div animate={{ rotate: isCoreModulesOpen ? 90 : 0 }} transition={{ duration: 0.2 }}>
                        <ChevronRight className="w-3 h-3 text-zinc-500" />
                      </motion.div>
                    </button>

                    <AnimatePresence initial={false}>
                      {isCoreModulesOpen && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden grid grid-cols-1 gap-1.5"
                        >
                          {[
                            { label: 'Classifier v2', key: 'Classifier', active: true, icon: '🔍' },
                            { label: 'Logic Verifier', key: 'Verifier', active: true, icon: '🧠' },
                            { label: 'Formalizer', key: 'Finalizer', active: true, icon: '📜' },
                            { label: 'Self-Correction', key: 'Critic', active: true, icon: '🛡️' },
                            { label: 'Feature Mapper', key: 'Mapper', active: true, icon: '⚡' },
                            { label: 'Task Solver', key: 'Solver', active: true, icon: '⚖️' },
                          ].map((mod) => {
                            const modCfg = dynamicConfig.moduleConfigs[mod.key];
                            const assignedModel = modCfg?.model || selectedModel;
                            return (
                            <div key={mod.label} className={`flex items-center gap-2 p-2 rounded border text-[10px] font-mono transition-all ${
                              mod.active ? 'bg-zinc-800 border-zinc-700 text-zinc-300' : 'bg-transparent border-dashed border-zinc-800 text-zinc-600'
                            }`}>
                              <span>{mod.icon}</span>
                              <div className="flex-1 min-w-0">
                                <div className="font-bold truncate text-zinc-200">{mod.label}</div>
                                <div className="text-[8px] text-emerald-400/80 truncate font-mono">{assignedModel}</div>
                              </div>
                              {mod.active && <div className="w-1 h-1 rounded-full bg-emerald-500"></div>}
                            </div>
                          );})}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="space-y-4">
                    <button 
                      onClick={() => setIsSystemNoteOpen(!isSystemNoteOpen)}
                      className="w-full flex items-center justify-between group transition-colors min-h-[38px]"
                    >
                      <div className="text-[10px] font-bold text-zinc-500 group-hover:text-zinc-300 uppercase tracking-widest text-left">System Note</div>
                      <motion.div animate={{ rotate: isSystemNoteOpen ? 90 : 0 }} transition={{ duration: 0.2 }}>
                        <ChevronRight className="w-3 h-3 text-zinc-500" />
                      </motion.div>
                    </button>

                    <AnimatePresence initial={false}>
                      {isSystemNoteOpen && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded">
                            <p className="text-[10px] text-emerald-200/70 leading-relaxed font-mono text-left">
                              Reasoning engine calibrated for complex code analysis & logical chain verification. All trace logs are kept in transient memory.
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Desktop Right Sidebar: Context & Actions */}
        <motion.aside 
          initial={false}
          animate={{ width: isRightSidebarOpen ? 256 : 48 }}
          className="border-l border-zinc-700 bg-zinc-900/50 flex-col overflow-hidden relative hidden lg:flex"
        >
          {isRightSidebarOpen ? (
            <div className="p-4 flex flex-col gap-6 overflow-y-auto w-64">
              <div className="space-y-6">
                <div className="space-y-4">
                  <button 
                    onClick={() => setIsModelParamsOpen(!isModelParamsOpen)}
                    className="w-full flex items-center justify-between group transition-colors"
                  >
                    <div className="text-[10px] font-bold text-zinc-500 group-hover:text-zinc-300 uppercase tracking-widest text-left">Model Parameters</div>
                    <motion.div
                      animate={{ rotate: isModelParamsOpen ? 90 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronRight className="w-3 h-3 text-zinc-500" />
                    </motion.div>
                  </button>
                  
                  <AnimatePresence initial={false}>
                    {isModelParamsOpen && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden space-y-3"
                      >
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center">
                            <label className="text-[10px] text-zinc-400 font-mono uppercase tracking-tight">Active Engine</label>
                            {isOpenRouterModel(selectedModel) && (
                              <span className={`text-[8px] px-1 py-0.5 rounded font-mono font-bold uppercase ${
                                hasCustomOpenRouterKey() || (process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_KEY !== 'MY_OPENROUTER_API_KEY')
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              }`}>
                                {hasCustomOpenRouterKey() ? 'BYOK Active' : process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_KEY !== 'MY_OPENROUTER_API_KEY' ? 'OpenRouter API' : 'Key Unset'}
                              </span>
                            )}
                          </div>
                          <ModelSelect 
                            value={selectedModel}
                            onChange={(val) => handleActiveEngineChange(val)}
                            openRouterModels={openRouterModels}
                            className="w-full text-zinc-200 font-mono"
                          />
                        </div>

                        <button
                          onClick={() => setIsApiKeyModalOpen(true)}
                          className="w-full flex items-center justify-between p-2 bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700 hover:border-amber-500/40 rounded text-xs font-mono text-zinc-300 transition-all group"
                        >
                          <span className="flex items-center gap-2">
                            <Key className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span>API Keys (BYOK)</span>
                          </span>
                          <span className="text-[9px] text-amber-400 font-bold group-hover:underline">
                            {hasCustomGeminiKey() || hasCustomOpenRouterKey() ? 'Custom Active' : 'Configure'} ↗
                          </span>
                        </button>
                        <div className="space-y-1.5 pt-3">
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-[10px] text-zinc-400 font-mono uppercase tracking-tight">Dynamic Mode</label>
                            <button 
                              onClick={() => setIsDynamicMode(!isDynamicMode)}
                              className={`w-8 h-4 rounded-full transition-colors relative ${isDynamicMode ? 'bg-emerald-500' : 'bg-zinc-700'}`}
                            >
                              <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${isDynamicMode ? 'left-4.5' : 'left-0.5'}`}></div>
                            </button>
                          </div>
                          
                          {isDynamicMode ? (
                            <button 
                              onClick={() => setIsConfigModalOpen(true)}
                              className="w-full flex items-center justify-between p-2 bg-emerald-500/10 border border-emerald-500/20 rounded group hover:bg-emerald-500/20 transition-all"
                            >
                              <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">Tune Dynamic Heatmap</span>
                              <SlidersHorizontal className="w-3 h-3 text-emerald-400" />
                            </button>
                          ) : (
                            <div className="space-y-2">
                              <div className="flex justify-between text-[10px] text-zinc-400 font-mono uppercase">
                                <label>Fixed Inference Temp</label>
                                <span className="text-emerald-400 font-bold">{temperature.toFixed(2)}</span>
                              </div>
                              <input 
                                type="range"
                                min="0"
                                max="1"
                                step="0.05"
                                value={temperature}
                                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                                className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                              />
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="space-y-4">
                  <button 
                    onClick={() => setIsCoreModulesOpen(!isCoreModulesOpen)}
                    className="w-full flex items-center justify-between group transition-colors"
                  >
                    <div className="text-[10px] font-bold text-zinc-500 group-hover:text-zinc-300 uppercase tracking-widest text-left">Core Modules</div>
                    <motion.div
                      animate={{ rotate: isCoreModulesOpen ? 90 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronRight className="w-3 h-3 text-zinc-500" />
                    </motion.div>
                  </button>

                  <AnimatePresence initial={false}>
                    {isCoreModulesOpen && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden grid grid-cols-1 gap-1.5"
                      >
                        {[
                          { label: 'Classifier v2', key: 'Classifier', active: true, icon: '🔍' },
                          { label: 'Logic Verifier', key: 'Verifier', active: true, icon: '🧠' },
                          { label: 'Formalizer', key: 'Finalizer', active: true, icon: '📜' },
                          { label: 'Self-Correction', key: 'Critic', active: true, icon: '🛡️' },
                          { label: 'Feature Mapper', key: 'Mapper', active: true, icon: '⚡' },
                          { label: 'Task Solver', key: 'Solver', active: true, icon: '⚖️' },
                        ].map((mod) => {
                          const modCfg = dynamicConfig.moduleConfigs[mod.key];
                          const assignedModel = modCfg?.model || selectedModel;
                          return (
                          <div key={mod.label} className={`flex items-center gap-2 p-2 rounded border text-[10px] font-mono transition-all ${
                            mod.active ? 'bg-zinc-800 border-zinc-700 text-zinc-300' : 'bg-transparent border-dashed border-zinc-800 text-zinc-600'
                          }`}>
                            <span>{mod.icon}</span>
                            <div className="flex-1 min-w-0">
                              <div className="font-bold truncate text-zinc-200">{mod.label}</div>
                              <div className="text-[8px] text-emerald-400/80 truncate font-mono">{assignedModel}</div>
                            </div>
                            {mod.active && <div className="w-1 h-1 rounded-full bg-emerald-500"></div>}
                          </div>
                        );})}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="space-y-4">
                  <button 
                    onClick={() => setIsSystemNoteOpen(!isSystemNoteOpen)}
                    className="w-full flex items-center justify-between group transition-colors"
                  >
                    <div className="text-[10px] font-bold text-zinc-500 group-hover:text-zinc-300 uppercase tracking-widest text-left">System Note</div>
                    <motion.div
                      animate={{ rotate: isSystemNoteOpen ? 90 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronRight className="w-3 h-3 text-zinc-500" />
                    </motion.div>
                  </button>

                  <AnimatePresence initial={false}>
                    {isSystemNoteOpen && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded">
                          <p className="text-[10px] text-emerald-200/70 leading-relaxed font-mono text-left">
                            Reasoning engine calibrated for complex code analysis & logical chain verification. All trace logs are kept in transient memory.
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center py-4 gap-6">
              <div className="cursor-pointer group" onClick={() => setIsRightSidebarOpen(true)} title="Model Parameters">
                <Settings className="w-5 h-5 text-zinc-500 group-hover:text-emerald-500 transition-colors" />
              </div>
              <div className="cursor-pointer group" onClick={() => setIsRightSidebarOpen(true)} title="Core Modules">
                <Database className="w-5 h-5 text-zinc-500 group-hover:text-emerald-500 transition-colors" />
              </div>
              <div className="cursor-pointer group" onClick={() => setIsRightSidebarOpen(true)} title="System Note">
                <Info className="w-5 h-5 text-emerald-500" />
              </div>
            </div>
          )}
        </motion.aside>
      </div>

      <ConsolidatedLibraryModal 
        isOpen={isLibraryModalOpen}
        onClose={() => setIsLibraryModalOpen(false)}
        onSelectPreset={handleSelectPreset}
        activeModel={selectedModel}
        dynamicConfig={dynamicConfig}
        isDynamicMode={isDynamicMode}
        initialMode={libraryModalMode}
      />

      <TelemetryAnalyticsModal 
        isOpen={isTelemetryOpen}
        onClose={() => setIsTelemetryOpen(false)}
      />

      <TaxonomyExplorerModal 
        isOpen={isTaxonomyModalOpen}
        onClose={() => setIsTaxonomyModalOpen(false)}
      />

      <PerspectiveEvaluationModal 
        isOpen={isPerspectiveModalOpen}
        onClose={() => setIsPerspectiveModalOpen(false)}
        prompt={input}
        finalAnswer={currentResult?.finalAnswer || ''}
        selectedModel={selectedModel}
      />

      <AssumptionExplorerModal 
        isOpen={isAssumptionModalOpen}
        onClose={() => setIsAssumptionModalOpen(false)}
        prompt={input}
        selectedModel={selectedModel}
        initialAnalysis={currentResult?.assumptionsAnalysis}
      />

      <ApiKeyModal 
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        onKeysUpdated={() => {
          fetchOpenRouterModels().then(m => { if (m && m.length > 0) setOpenRouterModels(m); });
        }}
      />

      <AutoTunerModal 
        isOpen={isAutoTunerOpen}
        onClose={() => setIsAutoTunerOpen(false)}
        activePrompt={input}
        dynamicConfig={dynamicConfig}
        onApplyConfig={(updatedConfig) => {
          setDynamicConfig(updatedConfig);
        }}
      />
    </div>
  );
}

