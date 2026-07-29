# OpenReason Architecture & Reasoning Pipeline

## Overview

OpenReason is built around a modular System 2 execution engine (`src/services/reasoningEngine.ts`) that transforms unstructured user prompts into structured, multi-step verified reasoning traces and formal logic ontologies.

```
                  ┌──────────────────────────────┐
                  │          User Prompt         │
                  └──────────────┬───────────────┘
                                 │
                                 ▼
                  ┌──────────────────────────────┐
                  │    Intent & Mode Classifier  │
                  └──────────────┬───────────────┘
                                 │
             ┌───────────────────┼───────────────────┐
             ▼                   ▼                   ▼
    ┌────────────────┐   ┌────────────────┐   ┌────────────────┐
    │ REFLEX / FAST  │   │   ANALYTIC /   │   │  CONST-O-T /   │
    │   Direct API   │   │  Multi-Step    │   │  Constrained   │
    └────────┬───────┘   └────────┬───────┘   └────────┬───────┘
             │                    │                    │
             └───────────────────┼───────────────────┘
                                 │
                                 ▼
                  ┌──────────────────────────────┐
                  │   Logic Formalizer (HOL/FOL) │
                  └──────────────┬───────────────┘
                                 │
                                 ▼
                  ┌──────────────────────────────┐
                  │   Self-Correction / Critic   │
                  └──────────────┬───────────────┘
                                 │
                                 ▼
                  ┌──────────────────────────────┐
                  │    Ground-Truth & Verdict    │
                  └──────────────────────────────┘
```

---

## Core Engine Modules

### 1. Classifier Module (`Classifier`)
- **Purpose**: Analyzes prompt complexity, domain, and constraint density.
- **Output**: Automatically assigns optimal reasoning strategy (`REFLEX`, `ANALYTIC`, `REFLECTIVE`, `CONST_O-T`, `MCTS_TREE`, `DIALECTIC`).

### 2. Multi-Step Execution & Branching Engine
- **Analytic Strategy**: Sequential step decomposition with per-step validity verification.
- **Tree-of-Thoughts (ToT / MCTS)**: Explores parallel hypothesis nodes, evaluates beam scores, and prunes sub-optimal paths.
- **Const-o-T (Constrained-of-Thought)**: Enforces explicit step validation checkpoints before advancing.

### 3. Formal Logic Transformer (`logicService.ts`)
- **Purpose**: Maps natural reasoning traces into Higher-Order Logic (HOL) and First-Order Logic (FOL) ontologies.
- **Components**:
  - Variable & Predicate Table
  - Axioms & Domain Rules
  - Proof Steps & Resolutions
  - Resolution Verdict: `STABLE`, `UNCERTAIN`, `REJECTED`

### 4. Self-Correction Critic (`Critic`)
- **Purpose**: Audits generated reasoning steps for cognitive biases (e.g., confirmation bias, base-rate fallacy) and unstated implicit assumptions (`assumptionService.ts`).

### 5. Robust LLM Error Adapter (`llmErrorAdapter.ts`)
- **Purpose**: Traps technical errors from Gemini SDK and OpenRouter APIs (401, 404, 429, safety blocks, network timeouts).
- **Behavior**: Normalizes raw exceptions into human-understandable diagnostics with actionable user recovery steps.

---

## State Persistence & Telemetry

- **IndexedDB Vault (`src/services/db.ts`)**: Stores trace logs, step timings, token metrics, and cost estimates locally in the user's browser.
- **BYOK Key Manager (`src/services/apiKeyService.ts`)**: Stores Gemini and OpenRouter keys securely in client-side `localStorage`.
