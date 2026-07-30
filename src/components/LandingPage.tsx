import React from 'react';
import { motion } from 'motion/react';
import { 
  Brain, 
  Sparkles, 
  Target, 
  Users, 
  Cpu, 
  CheckCircle2, 
  HelpCircle, 
  Zap, 
  ShieldAlert, 
  BookOpen, 
  BarChart3, 
  ArrowRight, 
  Terminal, 
  Compass, 
  Activity, 
  Code2, 
  Scale, 
  Play, 
  Lightbulb, 
  FileCheck,
  Check,
  Hash,
  GitBranch,
  Layers,
  ChevronRight,
  TrendingUp,
  Award
} from 'lucide-react';

interface LandingPageProps {
  onLaunchWorkspace: () => void;
  onOpenLibrary?: (mode?: 'library' | 'benchkit') => void;
  onSelectPrompt: (prompt: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onLaunchWorkspace,
  onSelectPrompt
}) => {
  return (
    <div className="min-h-screen w-full bg-zinc-950 text-zinc-100 font-sans overflow-y-auto selection:bg-emerald-500 selection:text-black">
      
      {/* Main Container for Linear Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-10 sm:space-y-12">
        
        {/* HERO SECTION */}
        <section className="relative space-y-6 pt-2">
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-[500px] h-[250px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />

          <div className="text-center max-w-3xl mx-auto space-y-4 relative z-10">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider"
            >
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span>System 2 AI Inspector & AST Benchmark Platform</span>
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-[1.15]"
            >
              Demystifying AI Reasoning & Proving <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-indigo-300 to-cyan-400">Logical Accuracy</span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-base text-zinc-300 max-w-2xl mx-auto leading-relaxed font-sans"
            >
              With endless marketing jargon surrounding frontier AI "reasoning tokens", how do you actually measure and prove AI accuracy? 
              <strong className="text-white"> OpenReason</strong> provides a transparent cognitive trace engine, multi-stage System 2 inspection, and formal Abstract Syntax Tree (AST) verifiers to audit every step of logical deduction.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="pt-2 flex justify-center font-mono"
            >
              <button
                onClick={onLaunchWorkspace}
                className="px-6 py-3 bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-zinc-950 font-extrabold text-xs sm:text-sm rounded-xl shadow-xl shadow-emerald-950/60 flex items-center gap-2.5 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Brain className="w-4 h-4" />
                <span>Enter OpenReason Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          </div>

          {/* Key Metrics Banner */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 font-mono text-xs">
            <div className="p-3.5 bg-zinc-900/80 border border-zinc-800 rounded-xl space-y-0.5 text-center">
              <span className="text-zinc-500 uppercase text-[9px] tracking-wider block">Cognitive Paradigms</span>
              <span className="text-lg sm:text-xl font-bold text-emerald-400">5 Distinct</span>
              <span className="text-[10px] text-zinc-400 block font-sans">Reflex to Const-o-T</span>
            </div>

            <div className="p-3.5 bg-zinc-900/80 border border-zinc-800 rounded-xl space-y-0.5 text-center">
              <span className="text-zinc-500 uppercase text-[9px] tracking-wider block">Accuracy Verification</span>
              <span className="text-lg sm:text-xl font-bold text-indigo-400">AST & Predicates</span>
              <span className="text-[10px] text-zinc-400 block font-sans">No fuzzy text matching</span>
            </div>

            <div className="p-3.5 bg-zinc-900/80 border border-zinc-800 rounded-xl space-y-0.5 text-center">
              <span className="text-zinc-500 uppercase text-[9px] tracking-wider block">Benchmark Suite</span>
              <span className="text-lg sm:text-xl font-bold text-amber-400">GSM8K + Prolog</span>
              <span className="text-[10px] text-zinc-400 block font-sans">+ Zebra & Modal Logic</span>
            </div>

            <div className="p-3.5 bg-zinc-900/80 border border-zinc-800 rounded-xl space-y-0.5 text-center">
              <span className="text-zinc-500 uppercase text-[9px] tracking-wider block">Token Economics</span>
              <span className="text-lg sm:text-xl font-bold text-cyan-400">Yield Telemetry</span>
              <span className="text-[10px] text-zinc-400 block font-sans">Cost vs logical accuracy</span>
            </div>
          </div>
        </section>

        <hr className="border-zinc-800/60" />

        {/* LINEAR SECTION 1: WHAT IS OPENREASON */}
        <section className="space-y-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Section 1</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              1. What Is OpenReason?
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl">
              An open-source cognitive trace engine and formal benchmark framework that turns standard LLM generation into an auditable, deterministic System 2 reasoning process.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono">
            <div className="p-4 bg-zinc-900/90 border border-zinc-800 rounded-xl space-y-2">
              <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg w-fit border border-emerald-500/20">
                <Terminal className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">System 2 Cognitive Tracing</h3>
              <p className="text-zinc-300 text-xs font-sans leading-relaxed">
                Decomposes prompt responses into structured, transparent thinking steps: Intent Audit, Premise Mapping, Formal Deduction, and Retrospective Self-Correction.
              </p>
            </div>

            <div className="p-4 bg-zinc-900/90 border border-zinc-800 rounded-xl space-y-2">
              <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg w-fit border border-indigo-500/20">
                <FileCheck className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">AST Verification Engine</h3>
              <p className="text-zinc-300 text-xs font-sans leading-relaxed">
                Evaluates reasoning outputs using Abstract Syntax Trees (AST), Prolog/Datalog verifiers, canonical ground truth keys, and overthinking penalty penalties.
              </p>
            </div>

            <div className="p-4 bg-zinc-900/90 border border-zinc-800 rounded-xl space-y-2">
              <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg w-fit border border-amber-500/20">
                <Activity className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">Cost & Yield Telemetry</h3>
              <p className="text-zinc-300 text-xs font-sans leading-relaxed">
                Provides real-time token economics, latency graphs, and pricing audits across Gemini and OpenRouter models to determine true cost per logical correctness.
              </p>
            </div>
          </div>

          {/* Visual Comparison: Traditional vs OpenReason */}
          <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl space-y-3">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              Traditional "Black Box" LLM vs OpenReason Inspection
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3.5 bg-zinc-950 border border-rose-500/20 rounded-lg space-y-1.5">
                <div className="text-rose-400 font-bold flex items-center gap-2 text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                  Standard Single-Pass LLM Generation
                </div>
                <ul className="space-y-1 text-zinc-400 font-sans text-[11px] list-disc list-inside">
                  <li>Opaque black-box outputs with hidden hallucinations.</li>
                  <li>No explicit verification of mathematical or logical constraints.</li>
                  <li>Inability to inspect intermediate reasoning branches.</li>
                  <li>Unpredictable reasoning costs with no yield tracking.</li>
                </ul>
              </div>

              <div className="p-3.5 bg-zinc-950 border border-emerald-500/30 rounded-lg space-y-1.5">
                <div className="text-emerald-400 font-bold flex items-center gap-2 text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  OpenReason Auditable System 2 Engine
                </div>
                <ul className="space-y-1 text-zinc-300 font-sans text-[11px] list-disc list-inside">
                  <li>Transparent cognitive trace logs showing step-by-step logic.</li>
                  <li>Formal AST parser matching canonical ground-truth keys.</li>
                  <li>Automated fallacy detection (circular logic, false premises).</li>
                  <li>Real-time token cost, latency, and reasoning yield scoring.</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <hr className="border-zinc-800/60" />

        {/* LINEAR SECTION 2: WHO IS IT FOR & HOW DOES IT WORK */}
        <section className="space-y-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-indigo-400 font-mono text-xs font-bold uppercase tracking-wider">
              <Users className="w-3.5 h-3.5" />
              <span>Section 2</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              2. Who Is It For & How Does It Work?
            </h2>
          </div>

          {/* Who is it for */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
              Target Audience & Industry Roles
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-xl space-y-1.5">
                <Code2 className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs font-bold text-white">AI Engineers & Architects</h4>
                <p className="text-zinc-400 text-[11px] font-sans leading-relaxed">
                  Debug prompt logic, compare frontier model providers, and prevent hallucinated reasoning before shipping AI agents.
                </p>
              </div>

              <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-xl space-y-1.5">
                <Scale className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs font-bold text-white">Governance & Compliance</h4>
                <p className="text-zinc-400 text-[11px] font-sans leading-relaxed">
                  Verify that automated legal, financial, or medical decisions adhere to strict rule sets and leave an audit trail.
                </p>
              </div>

              <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-xl space-y-1.5">
                <BarChart3 className="w-4 h-4 text-indigo-400" />
                <h4 className="text-xs font-bold text-white">Benchmark Researchers</h4>
                <p className="text-zinc-400 text-[11px] font-sans leading-relaxed">
                  Evaluate models on GSM8K, Prolog, Zebra logic, and Modal Logic using deterministic AST verification.
                </p>
              </div>

              <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-xl space-y-1.5">
                <Lightbulb className="w-4 h-4 text-cyan-400" />
                <h4 className="text-xs font-bold text-white">Logic Enthusiasts</h4>
                <p className="text-zinc-400 text-[11px] font-sans leading-relaxed">
                  Master the 5 core reasoning paradigms (Reflex, Analytic, Reflective, Const-o-T, Self-Rewarding) interactively.
                </p>
              </div>
            </div>
          </div>

          {/* How does it work (5-stage pipeline) */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
              <Cpu className="w-3.5 h-3.5" /> How OpenReason Executes Under the Hood
            </h3>

            <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-4 font-mono">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-2.5 text-xs">
                <div className="p-3 bg-zinc-900 border border-emerald-500/30 rounded-lg space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[10px]">
                    <span className="w-3.5 h-3.5 rounded-full bg-emerald-500/20 flex items-center justify-center text-[8px]">1</span>
                    INTENT AUDIT
                  </div>
                  <p className="text-zinc-400 font-sans text-[10px] leading-relaxed">
                    Filters prompt biases and formats tasks into structured reasoning inputs.
                  </p>
                </div>

                <div className="p-3 bg-zinc-900 border border-indigo-500/30 rounded-lg space-y-1">
                  <div className="flex items-center gap-1.5 text-indigo-400 font-bold text-[10px]">
                    <span className="w-3.5 h-3.5 rounded-full bg-indigo-500/20 flex items-center justify-center text-[8px]">2</span>
                    ENGINE ROUTING
                  </div>
                  <p className="text-zinc-400 font-sans text-[10px] leading-relaxed">
                    Dispatches prompt to Gemini or OpenRouter with custom thinking budget limits.
                  </p>
                </div>

                <div className="p-3 bg-zinc-900 border border-cyan-500/30 rounded-lg space-y-1">
                  <div className="flex items-center gap-1.5 text-cyan-400 font-bold text-[10px]">
                    <span className="w-3.5 h-3.5 rounded-full bg-cyan-500/20 flex items-center justify-center text-[8px]">3</span>
                    TRACE EXECUTION
                  </div>
                  <p className="text-zinc-400 font-sans text-[10px] leading-relaxed">
                    Streams multi-stage cognitive steps and fallacy detection nodes.
                  </p>
                </div>

                <div className="p-3 bg-zinc-900 border border-amber-500/30 rounded-lg space-y-1">
                  <div className="flex items-center gap-1.5 text-amber-400 font-bold text-[10px]">
                    <span className="w-3.5 h-3.5 rounded-full bg-amber-500/20 flex items-center justify-center text-[8px]">4</span>
                    AST VERIFICATION
                  </div>
                  <p className="text-zinc-400 font-sans text-[10px] leading-relaxed">
                    Parses outputs into Abstract Syntax Trees to verify predicate logic.
                  </p>
                </div>

                <div className="p-3 bg-zinc-900 border border-purple-500/30 rounded-lg space-y-1">
                  <div className="flex items-center gap-1.5 text-purple-400 font-bold text-[10px]">
                    <span className="w-3.5 h-3.5 rounded-full bg-purple-500/20 flex items-center justify-center text-[8px]">5</span>
                    YIELD TELEMETRY
                  </div>
                  <p className="text-zinc-400 font-sans text-[10px] leading-relaxed">
                    Calculates token cost, latency, overthinking penalties, and final score.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <hr className="border-zinc-800/60" />

        {/* LINEAR SECTION 3: WHEN & WHERE TO USE IT */}
        <section className="space-y-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-amber-400 font-mono text-xs font-bold uppercase tracking-wider">
              <Compass className="w-3.5 h-3.5" />
              <span>Section 3</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              3. When & Where Is It Best To Use It?
            </h2>
          </div>

          {/* When to Use */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> When Is OpenReason Best Applied?
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
              <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-xl space-y-1.5">
                <span className="text-emerald-400 font-bold text-xs block">1. Absolute Accuracy Required</span>
                <p className="text-zinc-300 font-sans text-[11px] leading-relaxed">
                  When standard text generation is insufficient and you require exact mathematical calculations, constraint satisfaction (Const-o-T), or formal logic programming.
                </p>
              </div>

              <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-xl space-y-1.5">
                <span className="text-indigo-400 font-bold text-xs block">2. Model Provider Evaluation</span>
                <p className="text-zinc-300 font-sans text-[11px] leading-relaxed">
                  When deciding whether to use Gemini 3.6 Flash, Gemini Pro, or OpenRouter frontier models. BenchKit provides exact cost-per-accuracy metrics.
                </p>
              </div>

              <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-xl space-y-1.5">
                <span className="text-amber-400 font-bold text-xs block">3. Overthinking & Cost Audits</span>
                <p className="text-zinc-300 font-sans text-[11px] leading-relaxed">
                  When models produce thousands of redundant thinking tokens without improving correctness. OpenReason isolates overthinking penalties in real time.
                </p>
              </div>
            </div>
          </div>

          {/* Where to Use */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5" /> Where Is It Best Utilized?
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
              <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-1.5">
                <span className="text-white font-bold text-xs block">Automated Code & Rule Engines</span>
                <p className="text-zinc-400 font-sans text-[11px] leading-relaxed">
                  Static code analysis, formal verification of smart contracts, AST parsing, and automated unit test generation.
                </p>
              </div>

              <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-1.5">
                <span className="text-white font-bold text-xs block">Enterprise Operations & Supply Chain</span>
                <p className="text-zinc-400 font-sans text-[11px] leading-relaxed">
                  Constraint-based resource scheduling, inventory routing, logistics optimization, and complex multi-variable budgeting.
                </p>
              </div>

              <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-1.5">
                <span className="text-white font-bold text-xs block">Scientific & Epistemic Deduction</span>
                <p className="text-zinc-400 font-sans text-[11px] leading-relaxed">
                  Temporal reasoning, modal logic (necessity vs possibility), Bayesian probability updates, and game theory strategy audits.
                </p>
              </div>
            </div>
          </div>
        </section>

        <hr className="border-zinc-800/60" />

        {/* LINEAR SECTION 4: DEMYSTIFYING REASONING & PROVING ACCURACY */}
        <section className="space-y-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-bold uppercase tracking-wider">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Section 4</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              4. What Is AI Reasoning & How Do We Prove Accuracy?
            </h2>
          </div>

          <div className="p-4 bg-zinc-900/60 border border-cyan-500/30 rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-bold uppercase">
              <ShieldAlert className="w-4 h-4" />
              Demystifying the "Reasoning" Jargon
            </div>

            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-sans">
              AI providers frequently use "reasoning" as a marketing catch-all. It is critical to distinguish between <strong>superficial pattern matching</strong> (System 1) and <strong>genuine cognitive search</strong> (System 2).
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono pt-1">
              <div className="p-3 bg-zinc-950 border border-rose-500/30 rounded-lg space-y-1">
                <div className="text-rose-400 font-bold flex items-center gap-2 text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                  Superficial AI Text Generation (System 1)
                </div>
                <p className="text-zinc-400 font-sans text-[11px] leading-relaxed">
                  Predicts probable next words based on training data. Extremely fast, but susceptible to logical drift, arithmetic errors, and hallucinated facts.
                </p>
              </div>

              <div className="p-3 bg-zinc-950 border border-emerald-500/30 rounded-lg space-y-1">
                <div className="text-emerald-400 font-bold flex items-center gap-2 text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  True System 2 Cognitive Search
                </div>
                <p className="text-zinc-300 font-sans text-[11px] leading-relaxed">
                  Explicit step-by-step search space exploration with hypothesis branching, constraint checking, and self-correction before outputting final answers.
                </p>
              </div>
            </div>
          </div>

          {/* How OpenReason Proves Accuracy */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5" /> How OpenReason Empirically Proves Accuracy
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
              <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-xl space-y-1.5">
                <span className="text-emerald-400 font-bold text-xs block">1. AST Node Parsing</span>
                <p className="text-zinc-300 font-sans text-[11px] leading-relaxed">
                  Parses output into Abstract Syntax Trees to verify required variables, predicate logic rules, and structural syntax validity.
                </p>
              </div>

              <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-xl space-y-1.5">
                <span className="text-indigo-400 font-bold text-xs block">2. Canonical Key Matching</span>
                <p className="text-zinc-300 font-sans text-[11px] leading-relaxed">
                  Checks outputs against formal ground-truth keys and exact verifier expressions rather than relying on loose sentiment or semantic similarity.
                </p>
              </div>

              <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-xl space-y-1.5">
                <span className="text-amber-400 font-bold text-xs block">3. Multi-Metric Scoring</span>
                <p className="text-zinc-300 font-sans text-[11px] leading-relaxed">
                  Combines Canonical Match (40%), AST Logic (30%), Verifier Keywords (15%), and Context Integrity (15%) minus Overthinking Penalties.
                </p>
              </div>
            </div>
          </div>
        </section>

        <hr className="border-zinc-800/60" />

        {/* QUICK INTERACTIVE BENCHMARK STARTERS */}
        <section className="space-y-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs font-bold uppercase tracking-wider">
              <Play className="w-3.5 h-3.5" />
              <span>Interactive Benchmarks</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Test OpenReason With Pre-Loaded Logic Tasks
            </h2>
            <p className="text-xs text-zinc-400 font-mono">
              Click any benchmark below to launch directly into the workspace with the logic problem pre-loaded:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
            <div 
              onClick={() => onSelectPrompt("Solve the Zebra Puzzle: 5 houses, 5 nationalities, 5 drinks, 5 pets, 5 cigarettes. Who owns the zebra?")}
              className="p-3.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-emerald-500/50 rounded-xl cursor-pointer transition-all space-y-1.5 group"
            >
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                  CONSTRAINTS
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-emerald-400 transition-colors" />
              </div>
              <h4 className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">Zebra Constraint Puzzle</h4>
              <p className="text-[11px] text-zinc-400 font-sans line-clamp-2">
                5 houses, 5 nationalities, 5 pets. Evaluates constraint satisfaction under Const-o-T.
              </p>
            </div>

            <div 
              onClick={() => onSelectPrompt("A store sells apples for $2 each and oranges for $3 each. If a customer buys 12 items in total and spends $29, how many apples and oranges did they buy? Show step-by-step math proof.")}
              className="p-3.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-indigo-500/50 rounded-xl cursor-pointer transition-all space-y-1.5 group"
            >
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[9px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold">
                  GSM8K MATH
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-indigo-400 transition-colors" />
              </div>
              <h4 className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors">GSM8K System of Equations</h4>
              <p className="text-[11px] text-zinc-400 font-sans line-clamp-2">
                Multi-step algebraic word problem testing canonical arithmetic correctness.
              </p>
            </div>

            <div 
              onClick={() => onSelectPrompt("Given Prolog facts: parent(john, mary). parent(mary, alice). Define ancestor(X, Y) rule and deduce whether ancestor(john, alice) holds.")}
              className="p-3.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-amber-500/50 rounded-xl cursor-pointer transition-all space-y-1.5 group"
            >
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
                  PROLOG LOGIC
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-amber-400 transition-colors" />
              </div>
              <h4 className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">Prolog Kinship Deduction</h4>
              <p className="text-[11px] text-zinc-400 font-sans line-clamp-2">
                Declarative rule deduction verifying recursive ancestry facts.
              </p>
            </div>

            <div 
              onClick={() => onSelectPrompt("Event A occurs at 10:00 AM. Event B happens after Event A but before Event C at 11:30 AM. Event D is simultaneous with Event B. Create a temporal ordering timeline.")}
              className="p-3.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-cyan-500/50 rounded-xl cursor-pointer transition-all space-y-1.5 group"
            >
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[9px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold">
                  TEMPORAL LOGIC
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-cyan-400 transition-colors" />
              </div>
              <h4 className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">Temporal Ordering Task</h4>
              <p className="text-[11px] text-zinc-400 font-sans line-clamp-2">
                Time-interval constraint resolution verifying chronological validity.
              </p>
            </div>
          </div>
        </section>

        {/* BOTTOM CALL-TO-ACTION BANNER */}
        <section className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-zinc-900 to-indigo-950/60 border border-emerald-500/30 text-center space-y-4 relative overflow-hidden shadow-2xl">
          <div className="max-w-2xl mx-auto space-y-2 relative z-10">
            <h2 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight">
              Ready to Inspect & Prove AI Reasoning?
            </h2>
            <p className="text-xs sm:text-sm text-zinc-300 font-sans leading-relaxed">
              Experience the full OpenReason System 2 trace workspace, benchmark models on BenchKit AST verifiers, and optimize your AI reasoning costs today.
            </p>
          </div>

          <div className="flex justify-center font-mono relative z-10">
            <button
              onClick={onLaunchWorkspace}
              className="px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-zinc-950 font-extrabold text-xs sm:text-sm rounded-xl shadow-xl shadow-emerald-950/80 flex items-center gap-2.5 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Brain className="w-4 h-4" />
              <span>Enter OpenReason Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>

      </main>

      {/* Landing Footer */}
      <footer className="border-t border-zinc-800/80 bg-zinc-950 py-6 px-4 sm:px-8 text-center text-xs font-mono text-zinc-500 space-y-2">
        <p>OpenReason AI Framework • Transparent System 2 Cognitive Trace & AST Verification Engine</p>
        <p className="text-[11px] text-zinc-400">
          Research sponsored by{' '}
          <a 
            href="https://bcap.biz" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2 transition-colors font-medium"
          >
            Buoyant Capital
          </a>
          {' '}&bull; Created by{' '}
          <a 
            href="https://www.linkedin.com/in/alterwork" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2 transition-colors font-medium"
          >
            Ray Garcia
          </a>
          {' '}&bull; Source Code Available at{' '}
          <a 
            href="https://github.com/Lato-Masi/OpenReason-AI" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2 transition-colors font-medium"
          >
            GitHub
          </a>
        </p>
      </footer>

    </div>
  );
};
