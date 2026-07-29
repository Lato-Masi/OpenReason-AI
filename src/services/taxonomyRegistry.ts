/**
 * OpenReason Taxonomy Catalog & Registry
 * Built-in taxonomy catalog for cognitive biases, logical fallacies,
 * cognitive styles, and meta-cognitive reasoning paradigms.
 */

import { CognitiveBias, LogicalFallacy, CognitiveStyle, ReasoningType } from '../types';

export const COGNITIVE_BIASES_CATALOG: Record<string, CognitiveBias> = {
  confirmation_bias: {
    id: "confirmation_bias",
    name: "Confirmation Bias",
    category: "cognitive_bias",
    description: "Favoring information that confirms existing hypotheses or beliefs while ignoring disconfirming data.",
    example: "Only citing studies that support a preferred hypothesis while discarding contradictory empirical results.",
    detectionMethod: "Check if counter-evidence or competing hypotheses were sought and evaluated.",
    mitigationStrategy: "Mandate explicit disconfirming evidence searches and red-team critique.",
    severity: "high",
    prevalence: "very_high"
  },
  hindsight_bias: {
    id: "hindsight_bias",
    name: "Hindsight Bias",
    category: "cognitive_bias",
    description: "Inaccurately believing that events were predictable before they occurred.",
    example: "Claiming 'I knew the system would fail' after observing a crash log without prior risk logging.",
    detectionMethod: "Verify if predictions were documented prior to knowing the final outcome.",
    mitigationStrategy: "Document ex-ante baseline probabilities and acknowledge prior uncertainty.",
    severity: "medium",
    prevalence: "high"
  },
  anchoring_bias: {
    id: "anchoring_bias",
    name: "Anchoring Bias",
    category: "cognitive_bias",
    description: "Over-relying on the first piece of information encountered regardless of subsequent data.",
    example: "Fixating on the first numerical figure provided in a prompt as a hard constraint.",
    detectionMethod: "Evaluate whether early numbers heavily dictate later estimates without independent calculation.",
    mitigationStrategy: "Recalculate bounds independently from alternative starting reference points.",
    severity: "high",
    prevalence: "high"
  },
  availability_heuristic: {
    id: "availability_heuristic",
    name: "Availability Heuristic",
    category: "heuristics",
    description: "Overestimating the likelihood of easily recalled or recent/dramatic events.",
    example: "Overestimating system outage risks due to a memorable recent incident.",
    detectionMethod: "Compare recalled examples against actual statistical base rates.",
    mitigationStrategy: "Consult objective statistical frequency distributions over memorable instances.",
    severity: "medium",
    prevalence: "high"
  },
  belief_bias: {
    id: "belief_bias",
    name: "Belief Bias",
    category: "cognitive_bias",
    description: "Evaluating the logical validity of an argument based on how believable the conclusion seems.",
    example: "Accepting a flawed deductive syllogism because the final statement happens to be true in reality.",
    detectionMethod: "Separate formal logical step validity from conclusion truth value.",
    mitigationStrategy: "Audit argument step structures independently using formal logic notation.",
    severity: "high",
    prevalence: "high"
  },
  overconfidence: {
    id: "overconfidence",
    name: "Overconfidence Effect",
    category: "cognitive_bias",
    description: "Overestimating the precision of knowledge, predictions, or skill limits.",
    example: "Expressing 100% confidence in complex predictions without margin of error.",
    detectionMethod: "Audit calibration between stated confidence levels and historical accuracy or complexity.",
    mitigationStrategy: "Apply probabilistic confidence intervals (e.g., 90% CI) and explicit margin of error bounds.",
    severity: "high",
    prevalence: "very_high"
  },
  framing_effect: {
    id: "framing_effect",
    name: "Framing Effect",
    category: "cognitive_bias",
    description: "Drawing different conclusions based on how information is presented (e.g. gain vs loss).",
    example: "Preferring a process with '90% success rate' over one with '10% failure rate'.",
    detectionMethod: "Re-frame premise statements in complementary terms to check for decision invariance.",
    mitigationStrategy: "Explicitly evaluate choices under both positive and negative complement frames.",
    severity: "medium",
    prevalence: "high"
  },
  loss_aversion: {
    id: "loss_aversion",
    name: "Loss Aversion",
    category: "cognitive_bias",
    description: "Perceiving losses as significantly more painful than equivalent gains.",
    example: "Refusing to abandon a failing strategy due to past sunk costs.",
    detectionMethod: "Check if historical investments overshadow forward-looking expected value.",
    mitigationStrategy: "Evaluate options purely on future expected utility regardless of past sunk investments.",
    severity: "medium",
    prevalence: "very_high"
  },
  ignoring_base_rates: {
    id: "ignoring_base_rates",
    name: "Base Rate Fallacy / Neglect",
    category: "information_neglect",
    description: "Ignoring general population base rates when evaluating specific case likelihoods.",
    example: "Worrying about a rare condition after a positive test without factoring in the test false-positive rate.",
    detectionMethod: "Check if prior probability P(H) was factored into posterior calculations via Bayes rule.",
    mitigationStrategy: "Enforce explicit Bayesian updating: P(H|E) = [P(E|H) * P(H)] / P(E).",
    severity: "high",
    prevalence: "high"
  },
  prosecutors_fallacy: {
    id: "prosecutors_fallacy",
    name: "Prosecutor's Fallacy",
    category: "information_neglect",
    description: "Confusing the probability of evidence given a hypothesis P(E|H) with P(H|E).",
    example: "Equating a low probability DNA match with low probability of innocence.",
    detectionMethod: "Verify if conditional probabilities were inverted without Bayes theorem.",
    mitigationStrategy: "Formally label P(Evidence|Hypothesis) vs P(Hypothesis|Evidence) in probability steps.",
    severity: "critical",
    prevalence: "medium"
  },
  system1_overreliance: {
    id: "system1_overreliance",
    name: "System 1 Overreliance",
    category: "heuristics",
    description: "Using fast heuristic association instead of deliberate System 2 logical analysis.",
    example: "Accepting an intuitive answer to a trick math problem without calculation.",
    detectionMethod: "Identify rapid, unverified leaps in complex multi-step problems.",
    mitigationStrategy: "Force explicit step-by-step mathematical or logical proof generation.",
    severity: "high",
    prevalence: "high"
  }
};

export const LOGICAL_FALLACIES_CATALOG: Record<string, LogicalFallacy> = {
  ad_hominem: {
    id: "ad_hominem",
    name: "Ad Hominem",
    description: "Attacking the entity or character making the argument rather than the argument's logical validity.",
    example: "Dismissing an algorithm's proof because of its source author's background.",
    detectionMethod: "Identify personal attributes cited as premises against a logical claim.",
    mitigationStrategy: "Remove non-logical entity attributes and evaluate premises purely on truth values.",
    severity: "medium",
    prevalence: "very_high"
  },
  straw_man: {
    id: "straw_man",
    name: "Straw Man",
    description: "Misrepresenting or exaggerating an opposing position to make it easier to refute.",
    example: "Characterizing a request for safety checks as an absolute ban on performance.",
    detectionMethod: "Compare the original statement against the summarized version being critiqued.",
    mitigationStrategy: "Steelman opposing arguments: restate them in their strongest, most accurate form.",
    severity: "medium",
    prevalence: "very_high"
  },
  appeal_to_ignorance: {
    id: "appeal_to_ignorance",
    name: "Appeal to Ignorance (Argumentum ad Ignorantiam)",
    description: "Claiming a proposition is true simply because it has not been proven false (or vice versa).",
    example: "Asserting a failure mode is impossible because it hasn't been observed yet.",
    detectionMethod: "Look for claims equating absence of evidence with evidence of absence.",
    mitigationStrategy: "Distinguish between unobserved states and proven impossibility.",
    severity: "medium",
    prevalence: "high"
  },
  slippery_slope: {
    id: "slippery_slope",
    name: "Slippery Slope",
    description: "Arguing that an initial action will inevitably trigger a catastrophic chain of events without causal proof.",
    example: "Claiming one minor rule change will lead to complete organizational collapse.",
    detectionMethod: "Trace causal links between steps to check if each transition is proven necessary.",
    mitigationStrategy: "Evaluate conditional probabilities at each step in the chain independently.",
    severity: "medium",
    prevalence: "high"
  },
  false_dilemma: {
    id: "false_dilemma",
    name: "False Dilemma / False Dichotomy",
    description: "Presenting only two opposing options when additional viable alternatives exist.",
    example: "Claiming we must either accept full downtime or double our budget, ignoring optimization.",
    detectionMethod: "Check if option space is artificially restricted to binary extremes.",
    mitigationStrategy: "Brainstorm additional intermediate options and hybrid approaches.",
    severity: "medium",
    prevalence: "high"
  },
  hasty_generalization: {
    id: "hasty_generalization",
    name: "Hasty Generalization",
    description: "Drawing a broad conclusion from an insufficient or unrepresentative sample size.",
    example: "Testing 2 inputs and declaring an algorithm 100% bug-free across all edge cases.",
    detectionMethod: "Compare sample size against statistical significance requirements.",
    mitigationStrategy: "Require representative test coverage and explicit confidence bounds.",
    severity: "medium",
    prevalence: "high"
  },
  correlation_causation_confusion: {
    id: "correlation_causation_confusion",
    name: "Correlation vs Causation Confusion (Cum Hoc Ergo Propter Hoc)",
    description: "Assuming that because two variables correlate, one must be the cause of the other.",
    example: "Concluding ice cream sales cause drownings because both rise in summer.",
    detectionMethod: "Look for causal claims derived solely from co-occurrence without mechanistic proof.",
    mitigationStrategy: "Identify potential confounding variables and demand mechanistic causal proofs.",
    severity: "high",
    prevalence: "very_high"
  },
  circular_reasoning: {
    id: "circular_reasoning",
    name: "Circular Reasoning (Begging the Question)",
    description: "Using the desired conclusion as one of the supporting premises.",
    example: "Asserting an algorithm is optimal because it uses the optimal architecture.",
    detectionMethod: "Detect graph cycles where premise node equals conclusion node.",
    mitigationStrategy: "Break circular dependencies by establishing independent foundational premises.",
    severity: "high",
    prevalence: "medium"
  }
};

export const COGNITIVE_STYLES_CATALOG: Record<string, CognitiveStyle> = {
  imaginative_creativity: {
    id: "imaginative_creativity",
    name: "Imaginative Creativity",
    description: "Reframing problems into metaphorical, narrative, or novel conceptual frameworks.",
    ability: "Transforms abstract challenges into fresh narrative and visual models.",
    application: "Reframing technical deadlocks into structural analogies to discover novel paths.",
    strength: "Unlocks unexpected solution spaces by breaking rigid domain boundaries.",
    category: "simulation"
  },
  inventive_problem_solving: {
    id: "inventive_problem_solving",
    name: "Inventive Problem Solving (TRIZ)",
    description: "Resolving core system contradictions without compromise.",
    ability: "Identifies underlying physical or logical contradictions and resolves them.",
    application: "Designing technical mechanisms that maximize output while removing resource overhead.",
    strength: "Eliminates trade-offs rather than settling for sub-optimal compromises.",
    category: "problem_solving"
  },
  certainty_seeking: {
    id: "certainty_seeking",
    name: "Certainty Seeking & Formalization",
    description: "Systematizing reasoning into rigid, machine-verifiable proofs.",
    ability: "Converts intuitive leaps into axiomatic assertions and CEL/HOL constraints.",
    application: "Safety-critical verification, legal statutory checks, and mathematical proofs.",
    strength: "Minimizes error rates and eliminates logical ambiguities.",
    category: "meta_cognitive"
  },
  adaptive_thinking: {
    id: "adaptive_thinking",
    name: "Adaptive & Dynamic Thinking",
    description: "Modeling non-stationary problem environments with changing variables.",
    ability: "Pivots strategies in real-time as new information or constraints emerge.",
    application: "Game-theoretic environments, market fluctuations, and real-time triage.",
    strength: "Prevents brittle strategy failures when environment parameters drift.",
    category: "simulation"
  },
  strategic_analysis: {
    id: "strategic_analysis",
    name: "Strategic Analysis & Game Theory",
    description: "Evaluating second-order effects, player incentives, and long-term equilibriums.",
    ability: "Simulates multi-agent reactions, payoff matrices, and counter-moves.",
    application: "Business strategy, policy design, negotiation, and mechanism design.",
    strength: "Anticipates competitive counter-moves and unintended consequences.",
    category: "problem_solving"
  },
  systems_thinking: {
    id: "systems_thinking",
    name: "Systems Thinking & Feedback Loops",
    description: "Mapping complex interconnected topologies, feedback loops, and emergent properties.",
    ability: "Identifies systemic leverage points, reinforcing loops, and delay dynamics.",
    application: "Architectural engineering, ecological systems, and macro-economics.",
    strength: "Addresses root causes rather than superficial surface symptoms.",
    category: "problem_solving"
  },
  first_principles: {
    id: "first_principles",
    name: "First Principles Deconstruction",
    description: "Stripping away assumptions to rebuild reasoning from fundamental truths.",
    ability: "Deconstructs complex domain problems down to foundational physical or logical axioms.",
    application: "Breakthrough engineering, cost reduction, and paradigm shifts.",
    strength: "Bypasses legacy conventions and historical analogies.",
    category: "meta_cognitive"
  },
  self_rewarding: {
    id: "self_rewarding",
    name: "Self-Rewarding & Internal Feedback",
    description: "Evaluating and scoring one's own reasoning trace through explicit self-critique loops.",
    ability: "Generates internal reward signals for valid logical steps and penalizes flaws.",
    application: "Autonomous reasoning, self-correcting agents, and high-fidelity output generation.",
    strength: "Continuously elevates output quality without relying on external human critique.",
    category: "meta_cognitive"
  }
};
