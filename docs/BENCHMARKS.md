# BenchKit AST Reasoning Benchmark Framework

## Overview

BenchKit is OpenReason's embedded benchmark evaluation suite (`src/services/evaluator.ts` and `src/components/BenchmarkEvalModal.tsx`). It provides empirical accuracy metrics, AST keyword verification, and cost-per-accuracy analytics across frontier LLMs.

---

## Benchmark Preset Structure

Each benchmark preset (`src/data/benchmarkPresets.ts`) adheres to the `BenchmarkPreset` interface:

```typescript
export interface BenchmarkPreset {
  id: string;
  title: string;
  category: 
    | 'BenchKit Standard Suite (GSM8K, HumanEval, LogiQA, ARC, AIME)'
    | 'Logic Programming (Prolog/Datalog/kanren)'
    | 'Business Strategy'
    | 'Coding & Algorithms'
    | 'Constraint Reasoning (Const-o-T)'
    | 'Epistemic & Modality Suite (Temporal, Modal, Spatial, Bayesian, Game Theory, Meta-Epistemic)';
  difficulty: 'Standard' | 'Hard' | 'Extreme Benchmark';
  description: string;
  prompt: string;
  suggestedMode: ReasoningMode;
  tags: string[];
  expectedOutputFocus: string;
  groundTruth?: {
    canonicalKeys?: Record<string, string | number | boolean>;
    requiredASTKeywords?: string[];
    forbiddenTerms?: string[];
  };
}
```

---

## Evaluation Engine (`evaluator.ts`)

When a model executes a benchmark problem, BenchKit performs four validation passes:

1. **Canonical Key Extraction**: Matches exact values (e.g. `#### 126` in GSM8K or key-value parameters).
2. **AST Keyword Verification**: Verifies presence of required logic concepts, algorithm primitives, or proof steps.
3. **Context & Anchor Integrity Audit**: Ensures original prompt constraints and numerical parameters are preserved during multi-step CoT reasoning.
4. **Lightweight Hallucination & Epistemic Testing**:
   - Tests model behavior on false premises, underspecified prompts, fictional entities, and contradictory rules.
   - **Acceptable Epistemic Behavior**: Expressing uncertainty, identifying premise flaws, noting missing information, or asking clarifying intent questions.
   - **Fatal Flaw (Hallucination)**: Manufacturing a confident final answer or formula without flagging the flaw. Automatically caps the score at `20% (FAIL)` and flags `hallucinationDetected = true`.

### Scoring & Metrics

- **Score Range**: 0% to 100% precision score.
- **Verification Status**: `PASS` (≥80%), `PARTIAL` (50–79%), or `FAIL` (<50%).
- **Epistemic Rigor Score**: Measures refusal to hallucinate and premise flaw detection on Epistemic Trap benchmarks.
- **Cost Analytics**: Calculates exact input token cost, output token cost, and latency per problem execution.

---

## Export & Telemetry

- BenchKit results can be exported as a standard JSON ledger (`openreason_benchkit_<model>_<timestamp>.json`).
- All runs are saved to IndexedDB telemetry for historical model comparison.
