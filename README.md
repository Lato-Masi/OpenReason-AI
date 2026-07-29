# OpenReason AST Reasoning Framework

OpenReason is an advanced, multi-paradigm reasoning workbench and execution engine designed for synthetic reasoning, formal logic mapping, and multi-model AST analysis. Powered by Google Gemini and OpenRouter, OpenReason breaks complex problems down into step-by-step verified execution chains, formal Higher-Order Logic (HOL/FOL) ontologies, and empirical benchmark evaluations.

---

## 🌟 Key Features

- **Multi-Paradigm Reasoning Engine**:
  - **Deductive & Formal Proofs**: Construct verifiable step-by-step logical chains.
  - **Const-o-T (Constrained-of-Thought)**: Enforce structured step constraints and validation checkpoints.
  - **Tree of Thoughts (ToT)**: Branching exploration of solution spaces with automated pruning and scoring.
  - **Abductive & Inductive Synthesis**: Infer best explanations and generalize from empirical observations.

- **Dual-Model Support & OpenRouter Integration**:
  - Native Google Gemini models (`gemini-3.6-flash`, thinking models, Google Search Grounding).
  - Multi-provider model access via OpenRouter (DeepSeek R1, Claude 3.7 Sonnet, GPT-4o, Llama 3.3, Qwen, and custom models).
  - Robust LLM Adapter handling structured output fallback, JSON schema enforcement, and plain-text conversion for non-native schema models.

- **Bring Your Own API Key (BYOK)**:
  - Secure client-side API key management saved exclusively in browser `localStorage`.
  - Delete, update, or inspect custom keys for Google Gemini and OpenRouter at any time.
  - Direct quick-links to Google AI Studio and OpenRouter key portals.

- **Formal Logic & AST Formalizer**:
  - Translates natural reasoning traces into formal ontology definitions, variable symbol tables, axioms, and inference rule chains.
  - Verified logic resolution badges (`STABLE`, `UNCERTAIN`, `REJECTED`).

- **BenchKit Reasoning Benchmarks**:
  - AST-based benchmark evaluator suite to test model reasoning precision, step fidelity, and output consistency across configurable test sets.

- **Telemetry Vault & Execution History**:
  - Client-side IndexedDB persistence for complete execution trace logs, step timings, token consumption heuristics, and estimated cost tracking.

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or bun

### Installation

1. Clone or download the repository:
   ```bash
   git clone https://github.com/your-org/openreason.git
   cd openreason
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Environment Variables (Optional):
   Create a `.env` file or set environment variables in your environment:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   OPENROUTER_API_KEY=your_openrouter_api_key_here
   ```
   *Note: You can also manage keys directly in the web app UI using the **API Keys** modal without configuring server environment variables.*

4. Run Development Server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

---

## 🛠️ Architecture Overview

```
src/
├── components/           # React UI Components & Modals
│   ├── ApiKeyModal.tsx               # BYOK Key Manager
│   ├── BenchmarkEvalModal.tsx        # BenchKit AST Evaluator
│   ├── DynamicConfigModal.tsx        # Parameter & Strategy Tuning
│   ├── TelemetryAnalyticsModal.tsx   # IndexedDB Trace Vault & Metrics
│   └── ...
├── services/             # Core Logic Engine & Adapters
│   ├── apiKeyService.ts              # Client-side encrypted key store
│   ├── reasoningEngine.ts            # Multi-step reasoning pipeline
│   ├── logicService.ts               # HOL/FOL Formalizer & Resolution
│   ├── openrouterService.ts          # OpenRouter API client & model fetcher
│   ├── structuredOutput.ts           # Schema adapter & JSON fallback handling
│   ├── evaluator.ts                 # BenchKit AST benchmark suite
│   └── db.ts                         # IndexedDB telemetry store
└── App.tsx              # Primary Workbench Dashboard
```

---

## 🔒 Security & Privacy

- All custom API keys supplied via the **API Keys (BYOK)** modal are stored locally in the browser's `localStorage`.
- API keys are transmitted directly to official provider endpoints (`aistudio.google.com` or `openrouter.ai`) and are never stored or logged on third-party backend servers.

---

## 📜 License

MIT License. See [LICENSE](LICENSE) for details.
