/**
 * OpenReason System Prompts
 * Centralized cognitive logic templates for the reasoning pipeline.
 */

export const CLASSIFIER_PROMPT = (prompt: string) => `
  OpenReason Classifier Module [v3.0 - Domain & Epistemic Aware]:
  Analyze the high-level intent, domain context, epistemic style, and latent complexity of the user input.
  
  User Intent: "${prompt}"

  Determine the optimal Reasoning Mode, Strategy, Primary Modality, and Domain Paradigm:
  
  1. Modes:
  - Reflex: Low-complexity retrieval/direct response.
  - Analytic: Structured logical/mathematical decomposition.
  - Reflective: High-order synthesis with recursive self-correction.
  - Const-o-T: Constraints-of-Thought with Self-Elicitation (Iterative self-interrogation, constraint extraction & formalization for complex, constraint-heavy tasks).

  2. Domain Paradigms:
  - LEGAL: Statutory interpretation, precedent mapping, IRAC doctrine, adversarial burden of proof.
  - MEDICAL: Differential diagnosis (DDx), pathophysiology, symptom triage, life-threat rule-out.
  - ARTISTIC_CREATIVE: Aesthetic synthesis, narrative architecture, stylistic rhythm, iterative creative critique.
  - SCIENTIFIC_ENGINEERING: Hypothesis-experiment-falsification, dimensional math, first principles.
  - STRATEGIC_BUSINESS: Game theory, SWOT, unit economics, second-order market tradeoffs.
  - GENERAL: Standard analytical deconstruction across general domains.

  3. Primary Reasoning Modalities:
  - DEDUCTIVE: Top-down logical necessity deriving specific guaranteed conclusions from general premises.
  - INDUCTIVE: Bottom-up probabilistic generalization from empirical observations/patterns.
  - ABDUCTIVE: Inference to the best explanation given incomplete data/symptoms.
  - ANALOGICAL: Structural mapping between a known source domain and target domain.
  - DIALECTICAL: Thesis vs. Antithesis tension leading to a higher-order Synthesis.
  - HEURISTIC: Fast mental models, rule-of-thumb approximations, satisficing boundaries.
  - TEMPORAL: Time-series precedence, state transitions, event chronologies, and temporal causality over time.
  - MODAL: Necessity (□P), Possibility (◇P), possible-worlds branching, counterfactual conditionals.
  - SPATIAL_GEOMETRIC: 2D/3D topological arrangements, spatial coordinate transformations, visual geometry, orientation.
  - BAYESIAN_PROBABILISTIC: Prior probabilities, Bayes Theorem likelihood updates, belief distributions, and risk modeling.
  - GAME_THEORETIC: Multi-agent incentives, payoff matrices, Nash equilibria, dominant strategies, adversarial dynamics.
  - META_EPISTEMIC: Meta-cognitive self-audit, bounds of certainty/uncertainty, known vs unknown unknowns, error margins.
  - DEONTIC_ETHICAL: Normative obligations, moral trade-offs, rights/duties, utilitarian vs deontological impact balancing.

  4. Strategies (Identify if applicable):
  - FIRST_PRINCIPLES: Deconstruct into foundational axioms.
  - CAUSAL: Cause-and-effect chains and counterfactuals.
  - ABDUCTIVE: Competing hypotheses and diagnostic rule-out.
  - DEDUCTIVE: Top-down axiomatic proof.
  - HYPOTHETICAL: Branching simulation of future world-states.
  - ANALOGICAL: Cross-domain structural invariants.
  - CONST_O_T: Constraints-of-Thought with Self-Elicitation.
  - LEGAL_IRAC: Issue, Rule, Application, Conclusion.
  - DIFFERENTIAL_DIAGNOSIS: Clinical DDx triage.
  - AESTHETIC_SYNTHESIS: Creative composition and resonance.
  - SWOT_GAME_THEORY: Business payoff matrices and Nash equilibrium.

  Provide response strictly as JSON:
  {
    "mode": "Reflex" | "Analytic" | "Reflective" | "Const-o-T",
    "strategy": string,
    "primary_modality": "DEDUCTIVE" | "INDUCTIVE" | "ABDUCTIVE" | "ANALOGICAL" | "DIALECTICAL" | "HEURISTIC",
    "domain_paradigm": "LEGAL" | "MEDICAL" | "ARTISTIC_CREATIVE" | "SCIENTIFIC_ENGINEERING" | "STRATEGIC_BUSINESS" | "GENERAL",
    "domain_framework": string,
    "requires_grounding": boolean,
    "rationale": "detailed justification for mode, domain paradigm, primary modality, and strategy selection",
    "complexity_score": number (1 to 10)
  }
`;

export const CONST_OT_INITIAL_PROMPT = (prompt: string) => `
  OpenReason Const-o-T Engine [Phase 1: Initial Reasoning]:
  Generate standard initial Chain-of-Thought reasoning for the following request:
  "${prompt}"
  
  Focus on exploring the problem, forming initial hypotheses, and proposing an early solution structure.
  Emit key conceptual findings using [NODE: type] label | description.
`;

export const CONST_OT_ELICITATION_PROMPT = (prompt: string, initialReasoning: string) => `
  OpenReason Const-o-T Engine [Phase 2: Self-Elicitation Dialogue]:
  Your task is to examine YOUR OWN initial reasoning below and apply self-elicitation techniques to extract implicit constraints, unstated assumptions, and hidden requirements.

  Original Task: "${prompt}"

  Initial Reasoning:
  ${initialReasoning}

  Apply the following 5 Self-Elicitation Protocols to your own reasoning:
  1. MIRRORING YOUR REASONING:
     - "I just stated X. What does that really imply?"
     - "When I wrote Y, what specific constraints was I assuming without stating?"
  2. ERRONEOUS STATEMENT TESTING ON SELF:
     - Deliberately test alternatives: "If my reasoning were wrong or missing edge cases, what alternative constraints must apply?"
  3. SELF-REFERENCE & UNSTATED PRIORITIES:
     - "What goals or unstated priorities is this line of thinking implicitly optimizing for?"
  4. OBLIQUE SELF-REFERENCE:
     - "Reading between the lines of my reasoning, what domain facts or unwritten rules am I assuming?"
  5. VOCABULARY-ACTIVATION CORRESPONDENCE (PROTOCOL A):
     - Flag introspective vocabulary in your reasoning ("consider", "reflect", "assume", "implies", "maybe") and convert the underlying computational state into explicit constraints ("Vocabulary X -> Constraint Y").

  Perform a thorough Self-Elicitation Dialogue, detailing each protocol step explicitly.
`;

export const CONST_OT_FORMALIZER_PROMPT = (prompt: string, elicitationText: string) => `
  OpenReason Const-o-T Engine [Phase 3 & 4: Constraint Extraction & Formalization]:
  Convert the insights from the Self-Elicitation Dialogue into formal, verifiable constraints for:
  Task: "${prompt}"

  Self-Elicitation Output:
  ${elicitationText}

  Required Format for Extracted Constraints:
  Extract items into 4 categories:
  1. IMPLICIT ASSUMPTIONS
  2. DOMAIN KNOWLEDGE & FACTS
  3. LOGICAL REQUIREMENTS
  4. VERIFICATION CONDITIONS & BOUNDS

  Then formalize each item into machine-verifiable <intent, constraint> pairs:
  Step i:
  INTENT: [What this constraint achieves]
  CONSTRAINT: [Machine-verifiable statement or quantitative bound]
  SOURCE: [Which self-elicitation technique revealed this (e.g., Mirroring, Protocol A, Erroneous Testing)]

  List all formalized constraints clearly. Emit discovery nodes using [NODE: logic] Constraint label | description.
`;

export const CONST_OT_SOLVER_PROMPT = (prompt: string, initialReasoning: string, formalizedConstraints: string) => `
  OpenReason Const-o-T Engine [Phase 5: Constraint-Integrated Reasoning]:
  Re-run and synthesize the reasoning for "${prompt}" by explicitly incorporating and satisfying every formalized constraint below.

  Formalized Constraints:
  ${formalizedConstraints}

  Initial Reasoning Reference:
  ${initialReasoning}

  Execution Directives:
  1. Explicitly cite each constraint (e.g. "To satisfy Constraint 1 [Intent]: ...").
  2. Show exact calculations, allocations, logic, or step-by-step proofs satisfying each constraint bound.
  3. Emit [CHAIN_OF_EVIDENCE] signatures for each constraint satisfaction step.
  4. Emit discovery nodes [NODE: evidence] or [NODE: branch] for critical constraint-satisfying steps.
`;

export const CONST_OT_VALIDATOR_PROMPT = (prompt: string, solverText: string, formalizedConstraints: string) => `
  OpenReason Const-o-T Engine [Phase 6: Constraint Validation & Convergence Check]:
  Audit the Constraint-Integrated Reasoning output against all formalized constraints for:
  Target: "${prompt}"

  Constraints:
  ${formalizedConstraints}

  Integrated Solution:
  ${solverText}

  Validation Audit Protocol:
  1. Audit each constraint individually: State PASS or FAIL with explicit evidence.
  2. Evaluate CONVERGENCE STATUS:
     - CONVERGED: All constraints satisfied with zero violations.
     - UNCERTAIN: Minor gaps or soft constraint trade-offs.
     - REJECTED: Unresolved violation detected.
  3. Output a structured Constraint Audit Report.
`;

export const SKELETON_PROMPT = (prompt: string, strategy: string) => `
  OpenReason Skeleton Generator [Context: ${strategy}]:
  
  [ORIGINAL_USER_QUERY_ANCHOR]:
  "${prompt}"

  [CRITICAL CONTEXT INTEGRITY DIRECTIVE]:
  1. Anchor your reasoning framework strictly to the ORIGINAL_USER_QUERY_ANCHOR.
  2. Do NOT omit, rephrase, or alter any specific numbers, named entities, constraints, or sub-questions.
  3. Prevent cognitive drift: do not introduce unrequested side-topics or tangential scenarios.

  [INVARIANT_CONTEXT_CHECKLIST]:
  - Extract and explicitly track all explicit constraints, quantitative values, named entities, and target questions.

  Strategy-Specific Guidelines:
  ${strategy === 'FIRST_PRINCIPLES' ? '- Deconstruct into foundational axioms. Rebuild from scratch.' : ''}
  ${strategy === 'CAUSAL' ? '- Map all dependent variables. Identify root causes and secondary effects.' : ''}
  ${strategy === 'ABDUCTIVE' ? '- MANDATORY: Generate AT LEAST 3 distinct hypotheses. Define evaluation criteria for each.' : ''}
  ${strategy === 'HYPOTHETICAL' ? '- MANDATORY: Simulate multiple branching world-states. Identify critical bifurcations.' : ''}
  ${strategy === 'ANALOGICAL' ? '- MANDATORY: Identify multiple candidate source domains. Map and compare structural similarities across different analogies.' : ''}
  
  Requirements:
  1. Define discrete execution steps.
  2. For strategy ${strategy} (if Abductive/Hypothetical/Analogical), ensure the skeleton includes a 'Plurality Phase' for parallel path exploration.
  3. For every step, specify [VERIFICATION_TARGET]: how this step should be audited.
  4. For key findings, insights, or branches, emit a discovery node: [NODE: type] label | optional description. Types: concept, evidence, hypothesis, logic, branch.
  5. Map variable dependencies.
  6. Identify critical failure points in the logic.
`;

export const MAPPER_PROMPT = (prompt: string, skeleton: string) => `
  OpenReason Feature Mapper:
  Interface the following skeleton with core engine capabilities:
  ${skeleton}

  [ORIGINAL_USER_QUERY_ANCHOR]:
  "${prompt}"

  Identify required OpenReason Modules:
  - LogicVerificationUnit
  - CausalChainVerification
  - AxiomaticValidator
  - MemorySynthesizer
  - MultiPathSynthesizer (If Plurality Phase is present)
`;

export const SOLVER_PROMPT = (prompt: string, skeleton: string, strategy: string) => `
  OpenReason Solver Core [Execution Strategy: ${strategy}]:
  
  [ORIGINAL_USER_QUERY_ANCHOR]:
  "${prompt}"

  [CRITICAL CONTEXT INTEGRITY DIRECTIVE]:
  1. Solve the query by strictly executing the reasoning tree below while honoring all constraints in the ORIGINAL_USER_QUERY_ANCHOR.
  2. Maintain 100% fidelity to explicit numbers, variables, formulas, and target questions.
  3. Avoid over-thinking loops: focus on direct, mathematically and logically sound step-by-step progress without circular re-explanations.

  [INVARIANT_CONTEXT_CHECKLIST]:
  - Ensure all extracted variables, numeric values, and parameters from the original query remain intact throughout the calculation/derivation.

  Process the following reasoning tree:
  ${skeleton}

  Execute with high precision. Ensure each step follows the ${strategy} doctrine.
  ${['ABDUCTIVE', 'HYPOTHETICAL', 'ANALOGICAL'].includes(strategy) ? 'IMPORTANT: Do not converge early. Maintain and evaluate parallel reasoning paths/hypotheses throughout the execution.' : ''}
  
  For each logical jump, provide a [CHAIN_OF_EVIDENCE]: the specific data or reasoning that validates the operation.
  As critical findings or new hypotheses emerge, document them using: [NODE: type] label | description.
  Avoid circular logic. Document intermediate state changes.
`;

export const VERIFIER_PROMPT = (prompt: string, solverText: string, strategy: string) => `
  OpenReason Multi-Stage Verification Layer [Strategy: ${strategy}]:
  Perform a formal verification (Step 4) of the solution against the original task.
  
  [ORIGINAL_USER_QUERY_ANCHOR]:
  "${prompt}"

  Solution to Audit:
  ${solverText}

  [ANTI-DRIFT & ANTI-ANOMALY AUDIT DIRECTIVE]:
  1. Check if the solution answers the EXACT question asked in ORIGINAL_USER_QUERY_ANCHOR without hallucinating extra requirements or drifting off-topic.
  2. Verify that no numeric values, named parameters, or constraints were altered or lost in the derivation.
  3. Check for over-thinking anomalies (e.g. self-contradictory looping, unnecessary complexity when a direct answer exists).

  Verification Checks:
  1. AXIOM_CHECK: Are foundation truths solid?
  2. CAUSAL_CHECK: Is the causality direction correct?
  3. ANALOGY_VALIDITY: Are the mapped relationships truly isomorphic? (Active only if Strategy=ANALOGICAL)
  4. HYPOTHETICAL_CONSISTENCY: Does the simulation violate laws of the defined system? (Active only if Strategy=HYPOTHETICAL)
  5. RED_TEAM_AUDIT: Attempt to find a logic leak or contradiction.
  
  Return a "Verification Report" detailing flaws and pass/fail status.
`;

export const INTENT_ANALYZER_PROMPT = (prompt: string) => `
  OpenReason Intent Analysis & Cognitive Bias Filter:
  Analyze the following user input for logical fallacies, hidden assumptions, implicit biases, and factual inaccuracies.
  
  [ORIGINAL_USER_QUERY_ANCHOR]:
  "${prompt}"

  Your task:
  1. Identify 2-3 specific biases or assumptions present in the query.
  2. Generate 3 refined, well-structured interpretations of the user's intent. 
  3. Ensure each refinement is balanced, objective, and designed to yield a superior logical trace without changing the core question.

  Provide response strictly as JSON:
  {
    "biases": ["list of identified biases/assumptions"],
    "inaccuracies": ["any noted factual errors"],
    "refined_intents": [
      { 
        "label": "Technical/Analytical: [Brief description]", 
        "refined_prompt": "the actual prompt to use if selected",
        "rationale": "why this version is better-structured"
      },
      ... (at least 3 options)
    ]
  }
`;

export const CRITIC_PROMPT = (prompt: string, trace: string) => `
  OpenReason Self-Correction & Trace Analysis Module:
  You are an expert logical critic. Analyze the following execution trace for cognitive biases, logical jumps, mapping errors, or context drift.
  
  [ORIGINAL_USER_QUERY_ANCHOR]:
  "${prompt}"

  Execution Trace:
  ${trace}

  [ANTI-DRIFT GUARDRAIL]:
  - Ensure the trace has not drifted from the original query anchor.
  - Verify that key facts, numbers, and constraints were not summarized away or lost in step-by-step transitions.
  - Ensure the critique remains focused on resolving errors without triggering circular over-thinking loops.

  Special Evaluation for Plurality:
  - If multiple paths are present (Abductive/Hypothetical/Analogical), evaluate the *relative* strength of each path. 
  - Check for "Path Favoritism" (confirmation bias towards one hypothesis).
  - Ensure the evidence provided for each path is distinct and internally consistent.

  If you find errors or bias, provide a "Self-Correction" directive that fixes the reasoning or balances the conclusions. 
  If the reasoning is solid across all branches, confirm it.
  
  Your output will be used to transform the final answer into a corrected state.
`;

export const EVOLUTION_PROMPT = (prompt: string, solverText: string, verifierText: string, memoryContext?: string) => `
  OpenReason Prompt Evolution Module [Contextual Refining]:
  Refine and evolve the logic based on negative feedback from the Verifier and historical memory.
  
  [ORIGINAL_USER_QUERY_ANCHOR]:
  "${prompt}"

  [Memory Context]
  ${memoryContext || 'None available.'}

  Verification Feedback: ${verifierText}
  Initial Output: ${solverText}

  [CONTEXT INTEGRITY DIRECTIVE]:
  Synthesize an evolved response that resolves all verifier conflicts while strictly anchoring to ORIGINAL_USER_QUERY_ANCHOR and retaining all original constraints.
`;

export const FINALIZER_PROMPT = (prompt: string, solverText: string) => `
  OpenReason Finalizer:
  Synthesize the final high-density, authoritative response.
  
  [ORIGINAL_USER_QUERY_ANCHOR]:
  "${prompt}"

  Input Logic / Trace:
  ${solverText}
  
  [FINAL INTEGRITY & ACCURACY AUDIT]:
  1. Confirm that the final response directly and comprehensively answers the question in ORIGINAL_USER_QUERY_ANCHOR.
  2. Verify zero loss of specific figures, names, parameters, or bounds requested by the user.
  3. If the input contains multiple valid hypotheses, branching scenarios, or competing analogies (typical of Abductive, Hypothetical, or Analogical reasoning), MAINTAIN THIS PLURALITY. 
  4. Present the most plausible conclusion first, but explicitly detail the alternative paths and their respective evidence/confidence levels.
  5. Remove internal trace syntax (e.g., [CHAIN_OF_EVIDENCE]). 
  6. Optimize for maximum clarity, technical accuracy, and structural balance, without unnecessary boilerplate.
`;

export const SELF_REWARDING_SELECT_TYPES_PROMPT = (prompt: string) => `
  OpenReason Self-Rewarding Engine [Stage 1: Select Reasoning Types]:
  Analyze the following query and select 2 to 4 complementary reasoning paradigms from the OpenReason Taxonomy Catalog that are best suited to tackle it.

  User Query: "${prompt}"

  Available Taxonomy Paradigms:
  - DEDUCTIVE, INDUCTIVE, ABDUCTIVE, SYLLOGISTIC, FORMAL
  - CAUSAL, EMPIRICAL, STATISTICAL, PROBABILISTIC
  - LATERAL, ANALOGICAL, COUNTERFACTUAL
  - DIAGNOSTICAL, PRAGMATIC, INTUITIVE
  - REFLECTIVE, CRITICAL, DIALECTICAL
  - MORAL, HISTORICAL, QUANTITATIVE, RETRODUCTIVE, REDUCTIVE, TRANSDUCTIVE
  - META_COGNITIVE_REFLEXIVE, FIRST_PRINCIPLES, SYSTEMS_THINKING, DESIGN_THINKING

  For each selected paradigm, provide a brief 1-sentence justification.
  Emit discovery nodes using [NODE: concept] Selected Paradigm | justification.
`;

export const SELF_REWARDING_COT_PROMPT = (prompt: string, selectedTypes: string[]) => `
  OpenReason Self-Rewarding Engine [Stage 2: Initial Chain-of-Thought]:
  Execute step-by-step reasoning for the query below by applying the selected reasoning paradigms: ${selectedTypes.join(', ')}.

  User Query: "${prompt}"

  Execution Directives:
  1. Clearly mark intermediate steps with explicit logical transitions.
  2. Embed proof signatures using [CHAIN_OF_EVIDENCE].
  3. Emit discovery nodes using [NODE: logic] or [NODE: hypothesis] label | description.
`;

export const SELF_REWARDING_EVALUATION_PROMPT = (prompt: string, initialCot: string) => `
  OpenReason Self-Rewarding Engine [Stage 3: Self-Evaluation & Reward Assignment]:
  Critically evaluate your own reasoning trace below against logical flaws, cognitive biases, assumptions, and edge-case failures.

  User Query Anchor: "${prompt}"

  Initial Reasoning Trace:
  ${initialCot}

  Self-Evaluation Protocol:
  1. Identify any logical gaps, unstated assumptions, or cognitive biases.
  2. Assign an explicit Internal Reward Score between 0.0 (unacceptable) and 1.0 (flawless).
  3. List explicit corrections required to elevate the reasoning score to 1.0.
  4. Emit [VERIFICATION] status and score clearly.
`;

export const SELF_REWARDING_REFINEMENT_PROMPT = (prompt: string, initialCot: string, evaluationText: string) => `
  OpenReason Self-Rewarding Engine [Stage 4 & 5: Correction, Refinement & Final Output]:
  Apply the self-evaluation findings to refine and correct your reasoning, producing a verified, flawless final answer for:
  "${prompt}"

  Initial Chain-of-Thought:
  ${initialCot}

  Self-Evaluation & Flaw Audit:
  ${evaluationText}

  Execution Directives:
  1. Explicitly address each identified weakness and correct all logic leaps.
  2. Synthesize a clean, authoritative final answer.
  3. Emit discovery nodes [NODE: evidence] for key corrected findings.
`;

