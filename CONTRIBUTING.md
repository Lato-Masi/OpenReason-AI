# Contributing to OpenReason

Thank you for your interest in contributing to **OpenReason**! We welcome researchers, software engineers, logicians, and open-source enthusiasts to help build, refine, and benchmark our multi-paradigm AST reasoning framework.

---

## 📜 Table of Contents

- [Code of Conduct](#-code-of-conduct)
- [How Can I Contribute?](#-how-can-i-contribute)
  - [Proposing New Reasoning Strategies](#proposing-new-reasoning-strategies)
  - [Adding Benchmarks to BenchKit](#adding-benchmarks-to-benchkit)
  - [Enhancing Model Adapters](#enhancing-model-adapters)
  - [Reporting Bugs](#reporting-bugs)
  - [Submitting Pull Requests](#submitting-pull-requests)
- [Development Setup](#-development-setup)
- [Code Style & Standards](#-code-style--standards)
- [Citing OpenReason](#-citing-openreason)

---

## 🤝 Code of Conduct

This project and everyone participating in it is governed by the [OpenReason Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

---

## 🔬 How Can I Contribute?

### Proposing New Reasoning Strategies
OpenReason supports Tree-of-Thought (ToT), Constrained-of-Thought (Const-o-T), Abductive Synthesis, and Formal Logic Verification. If you have research or algorithms for new paradigms (e.g., Graph-of-Thought, Monte Carlo Tree Search for LLM reasoning, Reflexion loops):
1. Open a **Research Proposal** issue using `.github/ISSUE_TEMPLATE/research_proposal.md`.
2. Outline the theoretical motivation, formal AST representation, and expected verification metrics.
3. Add implementation details in `src/services/reasoningEngine.ts` or as a modular strategy service.

### Adding Benchmarks to BenchKit
We encourage adding standard or domain-specific reasoning benchmarks:
1. Locate `src/services/evaluator.ts`.
2. Add new evaluation test suites with ground truth logical assertions, expected AST nodes, and verification criteria.

### Enhancing Model Adapters
Our LLM Adapter in `src/services/structuredOutput.ts` provides fallback handling for models that lack native structured JSON outputs. Contributions that improve JSON schema extraction, reduce syntax errors, or optimize prompts for specific model families are highly valued.

---

## 🛠️ Development Setup

1. **Fork & Clone**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/openreason.git
   cd openreason
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Start Local Development Server**:
   ```bash
   npm run dev
   ```

4. **Verify TypeScript & Linting**:
   ```bash
   npm run lint
   ```

---

## 📐 Code Style & Standards

- **TypeScript**: Strict type checking is enforced (`tsc --noEmit`).
- **Functional & Modular Design**: Keep services decoupled (`reasoningEngine.ts`, `logicService.ts`, `structuredOutput.ts`).
- **No In-Browser API Key Leaks**: Custom keys must remain client-side in `localStorage` or environment variables; never hardcode credentials.

---

## 📬 Submitting Pull Requests

1. Create a feature branch: `git checkout -b feature/my-new-reasoning-paradigm`
2. Commit your changes with clear messages: `git commit -m "feat(engine): implement Monte Carlo Tree Search strategy"`
3. Push to your branch: `git push origin feature/my-new-reasoning-paradigm`
4. Open a Pull Request referencing the related Issue or Research Proposal.

---

## 📖 Citing OpenReason

If you use OpenReason in academic research or technical publications, please cite us using `CITATION.cff` or reference:

```bibtex
@software{openreason2026,
  author = {Quipos and OpenReason Contributors},
  title = {OpenReason: Multi-Paradigm AST Reasoning Framework},
  year = {2026},
  url = {https://github.com/quipos/openreason}
}
```
