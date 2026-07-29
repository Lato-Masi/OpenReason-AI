/**
 * OpenReason Domain & Epistemic Strategy Registry
 * Provides domain-aware prompts, reasoning directives, and verification checks.
 */

export type ReasoningModality = 
  | "DEDUCTIVE" 
  | "INDUCTIVE" 
  | "ABDUCTIVE" 
  | "ANALOGICAL" 
  | "DIALECTICAL" 
  | "HEURISTIC"
  | "TEMPORAL"
  | "MODAL"
  | "SPATIAL_GEOMETRIC"
  | "BAYESIAN_PROBABILISTIC"
  | "GAME_THEORETIC"
  | "META_EPISTEMIC"
  | "DEONTIC_ETHICAL";

export type DomainParadigm = 
  | "LEGAL" 
  | "MEDICAL" 
  | "ARTISTIC_CREATIVE" 
  | "SCIENTIFIC_ENGINEERING" 
  | "STRATEGIC_BUSINESS" 
  | "GENERAL";

export interface DomainStrategySpec {
  id: DomainParadigm;
  displayName: string;
  icon: string;
  primaryFramework: string;
  description: string;
  skeletonDirective: string;
  solverDirective: string;
  verifierDirective: string;
  keyVerificationChecks: string[];
}

export interface ModalitySpec {
  id: ReasoningModality;
  displayName: string;
  icon: string;
  description: string;
  executionDirective: string;
}

export const MODALITY_REGISTRY: Record<ReasoningModality, ModalitySpec> = {
  DEDUCTIVE: {
    id: "DEDUCTIVE",
    displayName: "Deductive Reasoning",
    icon: "📐",
    description: "Top-down logical necessity deriving specific, logically guaranteed conclusions from general premises.",
    executionDirective: "Verify top-down logic guarantees. Ensure every intermediate claim follows necessarily from valid preceding axioms."
  },
  INDUCTIVE: {
    id: "INDUCTIVE",
    displayName: "Inductive Reasoning",
    icon: "🔍",
    description: "Bottom-up probabilistic generalization from empirical observations and recurring patterns.",
    executionDirective: "Extract empirical observations, evaluate sample size/representativeness, and state probabilistic confidence level rather than absolute certainty."
  },
  ABDUCTIVE: {
    id: "ABDUCTIVE",
    displayName: "Abductive Reasoning",
    icon: "🩺",
    description: "Inference to the best explanation given incomplete observations or diagnostic symptoms.",
    executionDirective: "MANDATORY: Generate AT LEAST 3 competing hypotheses. Rank hypotheses by parsimony (Occam's Razor), explanatory scope, and likelihood."
  },
  ANALOGICAL: {
    id: "ANALOGICAL",
    displayName: "Analogical Reasoning",
    icon: "🔗",
    description: "Mapping structural relational invariants between a known source domain and an target domain.",
    executionDirective: "Explicitly map elements from Source Domain -> Target Domain. Evaluate structural alignment and highlight potential disanalogies or edge breakdown points."
  },
  DIALECTICAL: {
    id: "DIALECTICAL",
    displayName: "Dialectical Synthesis",
    icon: "☯️",
    description: "Thesis vs. Antithesis tension leading to a higher-order, conflict-resolved Synthesis.",
    executionDirective: "Construct Thesis (Primary Claim), articulate robust Antithesis (Counter-Perspective/Objections), then resolve into a higher-order Synthesis."
  },
  HEURISTIC: {
    id: "HEURISTIC",
    displayName: "Heuristic & Intuitive",
    icon: "⚡",
    description: "Fast rule-of-thumb approximations, mental models, and satisficing decision boundaries.",
    executionDirective: "Apply domain mental models and rules-of-thumb. Test heuristic validity against extreme edge cases before accepting output."
  },
  TEMPORAL: {
    id: "TEMPORAL",
    displayName: "Temporal Reasoning",
    icon: "⏳",
    description: "Time-series ordering, event chronologies, state transitions, precedence rules, and temporal causality.",
    executionDirective: "Construct an explicit chronological timeline. Map event precedence (t0 -> t1 -> t2), state invariants over time, and evaluate temporal dependencies."
  },
  MODAL: {
    id: "MODAL",
    displayName: "Modal & Counterfactual",
    icon: "🔮",
    description: "Necessity (□P), Possibility (◇P), possible-worlds branching, counterfactual conditionals, and deontic/epistemic bounds.",
    executionDirective: "Distinguish between Necessary Truths (must hold across all accessible worlds), Possible Outcomes, and Counterfactuals ('If X were true, Y would hold')."
  },
  SPATIAL_GEOMETRIC: {
    id: "SPATIAL_GEOMETRIC",
    displayName: "Spatial & Geometric",
    icon: "📐",
    description: "2D/3D topological arrangements, spatial coordinates, structural orientation, geometric proofs, and containment relations.",
    executionDirective: "Construct an explicit mental map or spatial coordinate grid (x, y, z). Map topological boundaries, distance invariants, visual transformations, and orientation relative to reference points."
  },
  BAYESIAN_PROBABILISTIC: {
    id: "BAYESIAN_PROBABILISTIC",
    displayName: "Bayesian & Probabilistic",
    icon: "🎲",
    description: "Prior probabilities P(H), likelihood ratios P(E|H), Bayes theorem updates, and belief distribution conditioning.",
    executionDirective: "Specify prior probability distributions P(A). Calculate likelihood of new evidence P(B|A), apply Bayes Rule P(A|B) = [P(B|A)*P(A)]/P(B), and state posterior confidence intervals."
  },
  GAME_THEORETIC: {
    id: "GAME_THEORETIC",
    displayName: "Game-Theoretic Strategic",
    icon: "♟️",
    description: "Multi-agent interactions, payoff matrices, Nash equilibria, dominant/dominated strategies, mechanism design, and signaling.",
    executionDirective: "Define agent player set, action spaces, and payoff matrices. Identify dominant strategies, check for pure/mixed Nash equilibria, and analyze incentive compatibility."
  },
  META_EPISTEMIC: {
    id: "META_EPISTEMIC",
    displayName: "Meta-Cognitive & Epistemic",
    icon: "🔬",
    description: "Evaluating knowledge bounds, confidence intervals, known unknowns, epistemic uncertainty vs aleatoric variance, and bias auditing.",
    executionDirective: "Conduct meta-cognitive self-audit. Explicitly segregate Known Facts vs Assumptions vs Unknown Unknowns. Provide calibrated confidence bounds (e.g. 90% CI) and error margins."
  },
  DEONTIC_ETHICAL: {
    id: "DEONTIC_ETHICAL",
    displayName: "Deontic & Ethical Normative",
    icon: "⚖️",
    description: "Normative obligations, moral trade-offs, utilitarian vs deontological frameworks, rights/duties, and stakeholder impact balancing.",
    executionDirective: "Map normative obligations, rights, and duties. Evaluate utilitarian welfare outcomes alongside deontological constraints. Resolve ethical trade-offs systematically."
  }
};

export const DOMAIN_REGISTRY: Record<DomainParadigm, DomainStrategySpec> = {
  LEGAL: {
    id: "LEGAL",
    displayName: "Legal Jurisprudence",
    icon: "⚖️",
    primaryFramework: "IRAC (Issue, Rule, Application, Conclusion)",
    description: "Statutory interpretation, precedent mapping, multi-party burden of proof, and adversarial analysis.",
    skeletonDirective: `Apply the IRAC Doctrine:
1. ISSUE: State the legal questions, jurisdiction, and governing standards clearly.
2. RULE: Identify applicable statutes, case precedents, regulations, and constitutional provisions.
3. APPLICATION / ANALYSIS: Apply facts to legal elements. Detail arguments for Plaintiff/Prosecution AND Defendant/Opposing view.
4. CONCLUSION: State legally sound holding with probability or burden of proof assessment.`,
    solverDirective: `Execute Legal IRAC Analysis:
- Explicitly cite governing rules and statutes.
- Perform bilateral adversarial testing: Evaluate both Prosecution/Plaintiff and Defense positions.
- Address ambiguities in statutory language or facts.
- Conclude with burden of proof evaluation (e.g. Beyond Reasonable Doubt, Preponderance of Evidence).`,
    verifierDirective: `Legal Jurisprudence Verification:
- STATUTORY_CHECK: Did the solver apply correct legal rules and standards?
- ADVERSARIAL_BALANCE: Were opposing legal arguments fairly presented and evaluated?
- BURDEN_OF_PROOF: Is the conclusion aligned with the requisite legal threshold?`,
    keyVerificationChecks: [
      "Statutory & Precedent Consistency",
      "Bilateral Adversarial Balance",
      "Burden of Proof & Standard Alignment"
    ]
  },
  MEDICAL: {
    id: "MEDICAL",
    displayName: "Clinical Medicine",
    icon: "🩺",
    primaryFramework: "Differential Diagnosis & Pathophysiological Triage",
    description: "Clinical reasoning, symptom presentation, rule-out diagnostics, pathophysiology, and patient risk triage.",
    skeletonDirective: `Apply Clinical Medicine Framework:
1. CLINICAL PRESENTATION & SKELETON: Summarize key symptoms, risk factors, and vital/lab findings.
2. DIFFERENTIAL DIAGNOSIS (DDx): Generate a ranked list of potential etiologies (Must-Not-Miss life threats, Common, Rare).
3. PATHOPHYSIOLOGICAL MECHANISM: Trace underlying biological mechanisms for top candidate diagnoses.
4. DIAGNOSTIC & THERAPEUTIC TRIAGE: Outline confirmatory testing and risk-stratified management strategy.`,
    solverDirective: `Execute Clinical Reasoning Pipeline:
- Maintain an explicit Differential Diagnosis (DDx) table with at least 3 candidate etiologies.
- Identify "Red Flag" life threats requiring immediate rule-out.
- Map symptoms to underlying pathophysiology.
- Note diagnostic caveats, test sensitivity/specificity, and contraindications.`,
    verifierDirective: `Clinical Audit Verification:
- LIFE_THREAT_CHECK: Were critical "Must-Not-Miss" conditions evaluated and safely addressed?
- ETIOLOGICAL_FIT: Does the chosen diagnosis account for all presented clinical symptoms and lab findings?
- CONTRAINDICATION_AUDIT: Are suggested next steps or therapies safe without dangerous contraindications?`,
    keyVerificationChecks: [
      "Life-Threat 'Must-Not-Miss' Safety Rule-Out",
      "Clinical Feature & Symptom Explanatory Fit",
      "Therapeutic Safety & Contraindication Audit"
    ]
  },
  ARTISTIC_CREATIVE: {
    id: "ARTISTIC_CREATIVE",
    displayName: "Artistic & Creative",
    icon: "🎨",
    primaryFramework: "Aesthetic Synthesis, Resonance & Iterative Critique",
    description: "Narrative architecture, visual composition, emotional resonance, stylistic rhythm, and iterative critique.",
    skeletonDirective: `Apply Creative & Aesthetic Framework:
1. CONCEPTUAL CORE & INTENT: Define visual, thematic, narrative, or musical intent and core motif.
2. COMPOSITIONAL ARCHITECTURE: Map elements (color palette, rhythm, cadence, perspective, tension, harmony).
3. MULTI-LAYERED SYNTHESIS: Generate creative output exploring variations in tone, metaphor, and structure.
4. AESTHETIC CRITIQUE & REFinement: Evaluate against creative resonance, coherence, and emotional impact.`,
    solverDirective: `Execute Creative Synthesis:
- Focus on narrative tension, sensory detail, thematic depth, and rhythm.
- Avoid generic tropes or cliches; explore bold stylistic choices.
- Perform a self-critique loop evaluating tone, pacing, and emotional authenticity.`,
    verifierDirective: `Creative & Aesthetic Critique Audit:
- RESONANCE_CHECK: Does the work achieve emotional/aesthetic intent without trite clichés?
- COMPOSITIONAL_COHERENCE: Are style, rhythm, and structural motifs harmonious across the piece?
- PACING_AND_TENSION: Is pacing dynamic and narrative progression compelling?`,
    keyVerificationChecks: [
      "Aesthetic & Emotional Intent Alignment",
      "Cliché Avoidance & Originality Audit",
      "Structural Rhythm & Stylistic Harmony"
    ]
  },
  SCIENTIFIC_ENGINEERING: {
    id: "SCIENTIFIC_ENGINEERING",
    displayName: "Scientific & Engineering",
    icon: "🔬",
    primaryFramework: "Hypothesis-Experiment-Falsification & First Principles",
    description: "Empirical hypothesis testing, mathematical derivations, system boundary analysis, and falsification loops.",
    skeletonDirective: `Apply Scientific & Engineering Framework:
1. HYPOTHESIS & BOUNDARY DEFINITION: State formal hypothesis, assumptions, and system boundary conditions.
2. FIRST PRINCIPLES DERIVATION: Deconstruct to fundamental physical/mathematical laws and invariants.
3. EMPIRICAL / SIMULATION TEST: Define experimental or computational validation protocol.
4. FALSIFICATION & MARGIN ANALYSIS: Test edge conditions, dimensional consistency, and failure modes.`,
    solverDirective: `Execute Scientific/Engineering Derivation:
- Show explicit step-by-step mathematical derivations or code simulations.
- Validate dimensional analysis and units at key intermediate steps.
- Formulate Popperian falsification criteria: What observation or test would prove this hypothesis wrong?`,
    verifierDirective: `Scientific & Engineering Verification:
- DIMENSIONAL_CHECK: Are units and mathematical operations dimensionally consistent?
- FALSIFICATION_AUDIT: Is the hypothesis empirically testable and falsifiable?
- BOUNDARY_STRESS_TEST: Does the solution hold at extreme edge conditions (e.g. limit -> infinity, zero)?`,
    keyVerificationChecks: [
      "Dimensional & Mathematical Validity",
      "Popperian Falsification Criteria",
      "Boundary Condition Stress Testing"
    ]
  },
  STRATEGIC_BUSINESS: {
    id: "STRATEGIC_BUSINESS",
    displayName: "Strategic & Business",
    icon: "📈",
    primaryFramework: "Game-Theoretic Tradeoffs, SWOT & Value Driver Decomposition",
    description: "Market dynamics, game theory, competitive advantage, ROI/risk allocation, and trade-off optimization.",
    skeletonDirective: `Apply Strategic Business Framework:
1. CONTEXT & VALUE DRIVERS: Define economic landscape, unit economics, and core value proposition.
2. GAME-THEORETIC & COMPETITIVE MATRIX: Map actor incentives, competitor reactions, and payoff matrices.
3. RISK-ADJUSTED TRADEOFF ANALYSIS: Evaluate options under uncertainty, capital constraints, and execution risks.
4. ACTIONABLE STRATEGIC ROADMAP: Detail clear metrics, milestones, and contingency triggers.`,
    solverDirective: `Execute Strategic Analysis:
- Analyze second-order effects and competitor counter-moves (Nash Equilibrium / Game Theory).
- Quantify risk vs. return trade-offs with explicit assumptions.
- Provide actionable recommendations with measurable KPIs and mitigation strategies.`,
    verifierDirective: `Strategic & Economic Audit:
- INCENTIVE_ALIGNMENT: Are player incentives and market dynamics accurately modeled?
- SECOND_ORDER_EFFECTS: Does the strategy account for competitor reactions and unintended consequences?
- ECONOMIC_VIABILITY: Are ROI assumptions, cost constraints, and risks realistic?`,
    keyVerificationChecks: [
      "Incentive & Game-Theoretic Realism",
      "Second-Order Effect & Risk Mitigation",
      "Unit Economics & Execution Feasibility"
    ]
  },
  GENERAL: {
    id: "GENERAL",
    displayName: "General Analytical",
    icon: "🧠",
    primaryFramework: "Multi-Perspective Logical Decomposition",
    description: "Versatile analytical reasoning for cross-domain inquiries and general problem solving.",
    skeletonDirective: `Apply General Analytical Framework:
1. DECOMPOSITION: Break down problem into core sub-components.
2. MULTI-PERSPECTIVE ANALYSIS: Evaluate key evidence and logic from multiple angles.
3. SYNTHESIS: Build a structured, well-evidenced conclusion.`,
    solverDirective: `Execute General Analytical Processing:
- Maintain clear logical transitions and explicit reasoning chains.
- Provide clear evidence for each key claim.`,
    verifierDirective: `General Logical Audit:
- LOGIC_CHECK: Ensure no contradiction or unsupported leaps exist.`,
    keyVerificationChecks: [
      "Internal Consistency & Logical Rigor",
      "Sufficient Evidence Support"
    ]
  }
};

/**
 * Builds a prompt augmented with domain paradigm and reasoning modality directives.
 */
export function buildDomainAugmentedPrompt(
  stage: "Skeleton" | "Solver" | "Verifier" | "Critic" | "Finalizer",
  basePrompt: string,
  domain: DomainParadigm = "GENERAL",
  modality: ReasoningModality = "DEDUCTIVE",
  customFramework?: string
): string {
  const domainSpec = DOMAIN_REGISTRY[domain] || DOMAIN_REGISTRY.GENERAL;
  const modalitySpec = MODALITY_REGISTRY[modality] || MODALITY_REGISTRY.DEDUCTIVE;

  const header = `=== OPENREASON DOMAIN-AWARE COGNITION [${domainSpec.displayName} | ${modalitySpec.displayName}] ===\n` +
    `• Domain Paradigm: ${domainSpec.displayName} (${domainSpec.icon})\n` +
    `• Primary Modality: ${modalitySpec.displayName} (${modalitySpec.icon})\n` +
    `• Governed Framework: ${customFramework || domainSpec.primaryFramework}\n` +
    `• Epistemic Directive: ${modalitySpec.executionDirective}\n\n`;

  let directive = "";
  if (stage === "Skeleton") {
    directive = `\n--- DOMAIN SKELETON DIRECTIVE ---\n${domainSpec.skeletonDirective}\n`;
  } else if (stage === "Solver") {
    directive = `\n--- DOMAIN SOLVER DIRECTIVE ---\n${domainSpec.solverDirective}\n`;
  } else if (stage === "Verifier") {
    directive = `\n--- DOMAIN VERIFICATION DIRECTIVE ---\n${domainSpec.verifierDirective}\nChecklist: ${domainSpec.keyVerificationChecks.join(", ")}\n`;
  } else if (stage === "Critic") {
    directive = `\n--- DOMAIN CRITIC DIRECTIVE ---\nCritique trace against domain rules of ${domainSpec.displayName} and ${modalitySpec.displayName} logic.\n`;
  }

  return `${header}${basePrompt}${directive}`;
}
