# AGENTS.md — AI Coding Agent Guidelines for OpenReason AI

This repository contains **OpenReason AI**, a System 2 AI reasoning engine and **BenchKit** evaluation suite built with React 19, TypeScript, Express, and Tailwind CSS.

This file provides system instructions, architectural standards, and workflow rules for AI coding assistants working in this codebase, including **Gemini Antigravity**, **Claude Code**, and **OpenAI Codex**.

---

## 1. Project Overview & Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS v4 (`@tailwindcss/vite`), Lucide Icons (`lucide-react`), Motion (`motion/react`), Recharts, D3.js.
- **Backend**: Node.js full-stack Express server (`server.ts`) serving API routes (`/api/*`) and bundling with `esbuild`.
- **AI SDK**: `@google/genai` (Google Gen AI SDK v1+) for server-side Gemini 2.5/3.0 model interaction.
- **Persistence**: Client-side IndexedDB (`idb`) and local state engines for benchmark evaluation history and execution logs.
- **Build System**:
  - `npm run dev`: Executes `tsx server.ts` (Express dev server on `http://0.0.0.0:3000`).
  - `npm run build`: Bundles Vite client and builds backend to `dist/server.cjs` via `esbuild`.
  - `npm run lint`: Runs TypeScript compiler check (`tsc --noEmit`).
  - `npm run start`: Runs production server `node dist/server.cjs`.

---

## 2. Core Operational Rules for AI Agents

### Rule 1: Scope Discipline & User Intent
- **Strict Scope**: Implement strictly what the user requests. Do not add unrequested visual tabs, secondary sidebars, synthetic background services, or random feature fluff.
- **No Mock Data**: Do not hardcode simulated placeholder data when real calculations or API routes are expected.
- **Completeness**: Implement full functional scope in sequence without leaving TODOs, empty stub handlers, or broken imports.

### Rule 2: Server-Side API Key & Environment Security
- **Never expose secrets to the client**: All Gemini API calls or sensitive third-party keys MUST reside in server-side routes (`server.ts` or `/api/*`).
- **Environment Declarations**: Declare any new environment variables in `.env.example`. Never commit actual secrets or hardcode keys.
- **No UI Key Prompts**: Never build custom modal forms for entering API keys unless explicitly requested.

### Rule 3: Network & Runtime Constraints
- **Port 3000**: The application MUST run on port `3000` bound to host `0.0.0.0`.
- **Relative Workspace Paths**: Always use relative paths from the workspace root (`./src/...`, `./server.ts`). Do NOT use absolute root paths (`/src/...`) in code or shell commands.

---

## 3. Architecture & Code Conventions

### TypeScript & Code Structure
- **Type Safety**: Maintain strict TypeScript types defined in `src/types.ts`. Do not use `any` unless absolutely necessary.
- **Top-Level Imports**: Place all `import` statements at the top level of files. Use standard `enum` declarations (no `const enum`).
- **Modularity**: Keep components clean and extracted in `src/components/`. Do not bloat single files beyond logical boundaries.

### UI & UX Styling Guidelines ("Anti-Slop")
- **Tailwind CSS Utility Classes**: Use Tailwind CSS for all layout and styling. Do not introduce inline `style` tags or external CSS modules.
- **Distinctive Typography**: Maintain established hierarchy with clear display and mono typography for reasoning step trees and BenchKit AST metrics.
- **Accessible & High-Contrast**: Ensure WCAG AA contrast (minimum 4.5:1 for body text) across dark/light themes.
- **Interactive Controls**: Touch/click target heights must be at least 44px on touch targets. Every interactive element must have active hover/focus visual feedback.

---

## 4. BenchKit & Epistemic Evaluation Standards

When working on evaluation pipelines, benchmark datasets (`src/data/benchmarkPresets.ts`), or scoring engines (`src/services/evaluator.ts`):

1. **Four-Pass Evaluation Engine**:
   - **Canonical Key Extraction**: Exact numerical / target match (e.g. `#### <number>`).
   - **AST Node Verification**: Verification of structural logic concepts, algorithms, and proof steps.
   - **Context Integrity**: Audit ensuring original problem parameters are preserved without hallucinated shifts.
   - **Epistemic & Hallucination Audit**: Detection of false premises, unanswerable prompts, and missing intent parameters.

2. **Epistemic Trap Rules**:
   - **Expected Model Behavior**: Refusal to hallucinate, identifying false premises, expressing epistemic uncertainty, or requesting clarifying intent parameters.
   - **Fatal Flaw Rule**: If a model manufactures a confident final numeric yield or answer on an Epistemic Trap without flagging the premise flaw, flag `hallucinationDetected = true` and cap the score at `20% (FAIL)`.

---

## 5. Verification Checklist for Agents

Before completing any task or finishing a turn:

1. **Syntax & Type Verification**:
   - Run `npm run lint` (`tsc --noEmit`) to verify zero compilation errors.
2. **Build Verification**:
   - Run `npm run build` to ensure both Vite client and Express `esbuild` target compile cleanly.
3. **Metadata Maintenance**:
   - Ensure `metadata.json` has accurate `name` and `description` reflecting the current application scope.
