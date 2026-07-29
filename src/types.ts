/**
 * OpenReason Taxonomy & Type Specifications
 * Defines comprehensive reasoning types, cognitive biases, logical fallacies,
 * cognitive styles, and self-rewarding verification structures.
 */

export type ReasoningType =
  // Logical Reasoning
  | "DEDUCTIVE"
  | "INDUCTIVE"
  | "ABDUCTIVE"
  | "SYLLOGISTIC"
  | "FORMAL"
  // Empirical Reasoning
  | "CAUSAL"
  | "EMPIRICAL"
  | "STATISTICAL"
  | "PROBABILISTIC"
  // Creative Reasoning
  | "LATERAL"
  | "ANALOGICAL"
  | "COUNTERFACTUAL"
  // Practical Reasoning
  | "DIAGNOSTICAL"
  | "PRAGMATIC"
  | "INTUITIVE"
  // Reflective Reasoning
  | "REFLECTIVE"
  | "CRITICAL"
  | "DIALECTICAL"
  // Specialized & Meta-Cognitive
  | "MORAL"
  | "HISTORICAL"
  | "QUANTITATIVE"
  | "RETRODUCTIVE"
  | "REDUCTIVE"
  | "TRANSDUCTIVE"
  | "META_COGNITIVE_REFLEXIVE"
  | "SELF_REWARDING"
  | "FIRST_PRINCIPLES"
  | "SYSTEMS_THINKING"
  | "DESIGN_THINKING";

export interface CognitiveBias {
  id: string;
  name: string;
  category: "cognitive_bias" | "heuristics" | "information_neglect";
  description: string;
  example: string;
  detectionMethod: string;
  mitigationStrategy: string;
  severity: "low" | "medium" | "high" | "critical";
  prevalence: "low" | "medium" | "high" | "very_high";
}

export interface LogicalFallacy {
  id: string;
  name: string;
  description: string;
  example: string;
  detectionMethod: string;
  mitigationStrategy: string;
  severity: "low" | "medium" | "high" | "critical";
  prevalence: "low" | "medium" | "high" | "very_high";
}

export interface CognitiveStyle {
  id: string;
  name: string;
  description: string;
  ability: string;
  application: string;
  strength: string;
  category: "simulation" | "problem_solving" | "meta_cognitive";
}

export interface ReasoningFlawCheck {
  type: "bias" | "fallacy" | "heuristic" | "drift";
  id: string;
  name: string;
  detected: boolean;
  evidence: string;
  severity: "low" | "medium" | "high" | "critical";
  mitigation: string;
}

export interface SelfRewardingStageResult {
  stage: string;
  selectedReasoningTypes: ReasoningType[];
  initialChainOfThought: string;
  selfEvaluation: string;
  corrections?: string;
  score: number; // 0.0 to 1.0 score
  flawsFound: ReasoningFlawCheck[];
  finalAnswer: string;
}

export interface FlawAuditResult {
  flaws: ReasoningFlawCheck[];
  score: number;
  mitigationSummary: string;
  detectedBiasesCount: number;
  detectedFallaciesCount: number;
}

export interface PerspectiveDimension {
  score: number; // 0.0 to 1.0
  rationale: string;
  keyInsights: string[];
}

export interface MultiPerspectiveResult {
  feasibility: PerspectiveDimension;
  impact: PerspectiveDimension;
  risk: PerspectiveDimension;
  stakeholderReception: PerspectiveDimension;
  sustainability: PerspectiveDimension;
  overallScore: number;
  recommendation: string;
}

export interface AssumptionItem {
  id: string;
  statement: string;
  type: 'explicit' | 'implicit';
  category: 'domain' | 'common_sense' | 'boundary' | 'resource' | 'environmental';
  confidence: number;
  justification: string;
}

export interface AssumptionValidation {
  assumptionId: string;
  isValid: boolean;
  relevanceScore: number;
  consistencyScore: number;
  empiricalEvidence?: string;
  verdict: 'VALID' | 'QUESTIONABLE' | 'INVALID';
}

export interface AssumptionProfile {
  profileId: string;
  title: string;
  probability: number;
  description: string;
  reasoningBranch: string;
}

export interface AssumptionAnalysisResult {
  assumptions: AssumptionItem[];
  validations: AssumptionValidation[];
  profiles: AssumptionProfile[];
  primaryInterpretation: string;
  alternativeInterpretations: string[];
}

