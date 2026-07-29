# Changelog

All notable changes to the **OpenReason** framework will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-07-28

### Added
- **Multi-Paradigm Reasoning Engine**:
  - Step-by-step Deductive Logic reasoning pipeline.
  - Constrained-of-Thought (Const-o-T) rule-enforced step verification.
  - Tree-of-Thought (ToT) multi-path search and node evaluation.
  - Abductive Synthesis & Inductive Rule Induction engines.
- **Dual Model Infrastructure**:
  - Full Google Gemini integration (`gemini-3.6-flash`, thinking features, grounding).
  - OpenRouter API integration supporting DeepSeek R1, Claude 3.7 Sonnet, GPT-4o, Llama 3.3, and custom models.
- **LLM Schema Adapter & Fallback**:
  - Automatic JSON schema adapter converting unstructured plain text responses into verified JSON nodes for models lacking native JSON Schema enforcement.
- **Formal Logic Transformer**:
  - AST Formalizer translating reasoning chains into Higher-Order Logic (HOL/FOL) ontology nodes, variable tables, and inference rules.
- **BenchKit Reasoning Benchmarks**:
  - AST benchmark suite with accuracy, fidelity, and token metrics across benchmark test sets.
- **Telemetry Vault & IndexedDB Store**:
  - Complete execution history tracking step timings, token heuristics, and estimated cost analysis.
- **Bring Your Own Key (BYOK) Management**:
  - In-browser local storage manager for Gemini and OpenRouter API keys.
