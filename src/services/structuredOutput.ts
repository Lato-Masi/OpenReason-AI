import { z } from 'zod';

/**
 * Zod Schema for Stage 1 Reasoning Classifier output
 */
export const ClassifierSchema = z.object({
  mode: z.enum(["Reflex", "Analytic", "Reflective", "Const-o-T"]).describe("The optimal reasoning mode for the query"),
  strategy: z.string().describe("Chosen strategy, e.g. FIRST_PRINCIPLES, DEDUCTIVE, CONST_O_T, CAUSAL, NONE"),
  primary_modality: z.enum([
    "DEDUCTIVE", 
    "INDUCTIVE", 
    "ABDUCTIVE", 
    "ANALOGICAL", 
    "DIALECTICAL", 
    "HEURISTIC", 
    "TEMPORAL", 
    "MODAL",
    "SPATIAL_GEOMETRIC",
    "BAYESIAN_PROBABILISTIC",
    "GAME_THEORETIC",
    "META_EPISTEMIC",
    "DEONTIC_ETHICAL"
  ]).describe("The primary epistemic reasoning modality"),
  domain_paradigm: z.enum(["LEGAL", "MEDICAL", "ARTISTIC_CREATIVE", "SCIENTIFIC_ENGINEERING", "STRATEGIC_BUSINESS", "GENERAL"]).describe("Domain paradigm governing thought structure"),
  domain_framework: z.string().describe("Specific framework (e.g. IRAC, Differential Diagnosis, Aesthetic Critique, First Principles)"),
  complexity_score: z.number().min(1).max(10).describe("Problem complexity rating from 1 to 10"),
  requires_grounding: z.boolean().describe("Whether live web search grounding is required"),
  rationale: z.string().describe("Detailed justification for mode, modality, domain paradigm, and strategy selection")
});

export type ClassifierOutput = z.infer<typeof ClassifierSchema>;

/**
 * Zod Schema for Const-o-T Self-Elicitation & Constraint Formalization
 */
export const ConstOTFormalizerSchema = z.object({
  explicit_constraints: z.array(z.string()).describe("Directly stated constraints in the prompt"),
  implicit_constraints: z.array(z.string()).describe("Discovered unstated/hidden constraints via self-elicitation"),
  constraint_pairs: z.array(z.object({
    intent: z.string().describe("User goal or sub-intent"),
    constraint: z.string().describe("Bound or restriction governing this intent")
  })).describe("Formal <intent, constraint> mappings"),
  boundary_conditions: z.array(z.string()).describe("Edge cases and invariants that must hold true")
});

export type ConstOTFormalizerOutput = z.infer<typeof ConstOTFormalizerSchema>;

/**
 * Zod Schema for Verifier / Audit Stage
 */
export const VerifierSchema = z.object({
  verdict: z.enum(["STABLE", "UNCERTAIN", "REJECTED"]).describe("Final logical verification outcome"),
  confidence_score: z.number().min(0).max(1).describe("Confidence metric from 0.0 to 1.0"),
  detected_flaws: z.array(z.string()).describe("Identified logical fallacies, errors, or constraint violations"),
  corrective_actions: z.array(z.string()).describe("Actionable fixes applied or recommended"),
  canonical_answer_keys: z.record(z.string(), z.string()).optional().describe("Key-value mapping of exact numerical or string answers")
});

export type VerifierOutput = z.infer<typeof VerifierSchema>;

/**
 * Zod Schema for Intent Analysis
 */
export const IntentAnalysisSchema = z.object({
  biases: z.array(z.string()).describe("Detected cognitive biases or ambiguous assumptions"),
  inaccuracies: z.array(z.string()).describe("Identified factual inaccuracies or premise errors"),
  refined_intents: z.array(z.object({
    label: z.string(),
    refined_prompt: z.string(),
    rationale: z.string()
  })).describe("Disambiguated and expanded interpretations")
});

export type IntentAnalysisOutput = z.infer<typeof IntentAnalysisSchema>;

/**
 * Zod Schema for Automated Cognitive Bias & Logical Fallacy Audit
 */
export const FlawAuditSchema = z.object({
  score: z.number().min(0).max(1).describe("Overall logical integrity score from 0.0 (severely flawed) to 1.0 (flawless)"),
  flaws: z.array(z.object({
    type: z.enum(["bias", "fallacy", "heuristic", "drift"]).describe("Flaw category"),
    id: z.string().describe("Catalog ID or name of flaw"),
    name: z.string().describe("Human readable flaw title"),
    detected: z.boolean().describe("Whether this flaw is present in the reasoning"),
    evidence: z.string().describe("Direct snippet or reasoning step where flaw occurs"),
    severity: z.enum(["low", "medium", "high", "critical"]).describe("Severity level"),
    mitigation: z.string().describe("Recommended correction or counter-argument")
  })).describe("List of evaluated bias and fallacy checks"),
  mitigation_summary: z.string().describe("High-level summary of corrections required to fix flaws")
});

export type FlawAuditOutput = z.infer<typeof FlawAuditSchema>;

const PerspectiveDimensionSchema = z.object({
  score: z.number().min(0).max(1).describe("Dimension score between 0.0 and 1.0"),
  rationale: z.string().describe("Detailed justification for the score"),
  key_insights: z.array(z.string()).describe("List of 2-3 key observations or factors")
});

/**
 * Zod Schema for Multi-Perspective Solution Evaluation
 */
export const MultiPerspectiveSchema = z.object({
  feasibility: PerspectiveDimensionSchema.describe("Technical & practical execution feasibility"),
  impact: PerspectiveDimensionSchema.describe("Target goal achievement & leverage effectiveness"),
  risk: PerspectiveDimensionSchema.describe("Downside potential, failure modes & unintended consequences"),
  stakeholder_reception: PerspectiveDimensionSchema.describe("Likely reception across affected parties"),
  sustainability: PerspectiveDimensionSchema.describe("Long-term viability, maintainability & resilience"),
  overall_score: z.number().min(0).max(1).describe("Weighted aggregate score"),
  recommendation: z.string().describe("Actionable synthesis & strategic advisory recommendation")
});

export type MultiPerspectiveOutput = z.infer<typeof MultiPerspectiveSchema>;

export const AssumptionItemSchema = z.object({
  id: z.string().describe("Unique assumption identifier e.g. ASM-1"),
  statement: z.string().describe("Explicitly articulated assumption statement"),
  type: z.enum(["explicit", "implicit"]).describe("Whether explicitly stated or implicitly assumed"),
  category: z.enum(["domain", "common_sense", "boundary", "resource", "environmental"]).describe("Classification category"),
  confidence: z.number().min(0).max(1).describe("Baseline confidence score between 0.0 and 1.0"),
  justification: z.string().describe("Why this assumption was made or extracted from the prompt")
});

export const AssumptionValidationSchema = z.object({
  assumption_id: z.string().describe("Matching assumption ID e.g. ASM-1"),
  is_valid: z.boolean().describe("Whether the assumption holds true upon validation"),
  relevance_score: z.number().min(0).max(1).describe("Relevance score to problem domain"),
  consistency_score: z.number().min(0).max(1).describe("Consistency with domain facts and logic"),
  empirical_evidence: z.string().optional().describe("Known empirical facts or domain rules supporting or opposing"),
  verdict: z.enum(["VALID", "QUESTIONABLE", "INVALID"]).describe("Validation verdict")
});

export const AssumptionProfileSchema = z.object({
  profile_id: z.string().describe("Profile ID e.g. PROF-A"),
  title: z.string().describe("Descriptive title e.g. Standard Operational Assumptions"),
  probability: z.number().min(0).max(1).describe("Probability weight of this assumption set"),
  description: z.string().describe("Contextual summary of these operating conditions"),
  reasoning_branch: z.string().describe("Key reasoning strategy under these specific assumptions")
});

export const AssumptionAnalysisSchema = z.object({
  assumptions: z.array(AssumptionItemSchema).describe("List of extracted assumptions"),
  validations: z.array(AssumptionValidationSchema).describe("Validation audit for each assumption"),
  profiles: z.array(AssumptionProfileSchema).describe("Probabilistic assumption profiles"),
  primary_interpretation: z.string().describe("Primary problem interpretation under most likely assumptions"),
  alternative_interpretations: z.array(z.string()).describe("Alternative interpretations under differing assumption profiles")
});

export type AssumptionAnalysisOutput = z.infer<typeof AssumptionAnalysisSchema>;

/**
 * Convert Zod Schema to standard JSON Schema object suitable for LLM APIs
 */
export function zodToJsonSchema(schema: any): Record<string, any> {
  if (schema instanceof z.ZodObject) {
    const shape = schema.shape;
    const properties: Record<string, any> = {};
    const required: string[] = [];

    for (const [key, propSchema] of Object.entries(shape)) {
      properties[key] = zodToJsonSchema(propSchema);
      if (!(propSchema instanceof z.ZodOptional)) {
        required.push(key);
      }
    }

    return {
      type: "object",
      properties,
      required: required.length > 0 ? required : undefined
    };
  } else if (schema instanceof z.ZodArray) {
    return {
      type: "array",
      items: zodToJsonSchema((schema as any).element)
    };
  } else if (schema instanceof z.ZodEnum) {
    const values = (schema as any)._def?.values || (schema as any).options || [];
    return {
      type: "string",
      enum: values
    };
  } else if (schema instanceof z.ZodString) {
    return {
      type: "string",
      description: schema.description
    };
  } else if (schema instanceof z.ZodNumber) {
    return {
      type: "number",
      description: schema.description
    };
  } else if (schema instanceof z.ZodBoolean) {
    return {
      type: "boolean",
      description: schema.description
    };
  } else if (schema instanceof z.ZodRecord) {
    return {
      type: "object",
      additionalProperties: { type: "string" }
    };
  } else if (schema instanceof z.ZodOptional) {
    return zodToJsonSchema((schema as any)._def?.innerType);
  }

  return { type: "string" };
}

/**
 * Robust JSON extraction and Zod Validation Helper
 */
export function parseAndValidateZod<T>(
  rawText: string,
  schema: z.ZodSchema<T>,
  fallbackValue?: T
): { data: T; isSchemaValid: boolean; rawJson: string; errors?: string[] } {
  if (!rawText) {
    if (fallbackValue !== undefined) {
      return { data: fallbackValue, isSchemaValid: false, rawJson: "", errors: ["Empty input text"] };
    }
    throw new Error("Cannot parse empty response text with Zod schema.");
  }

  // Extract JSON string from markdown fences ```json ... ``` or raw text
  let cleaned = rawText.trim();
  const jsonMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (jsonMatch) {
    cleaned = jsonMatch[1].trim();
  } else {
    // Look for first '{' or '[' to last '}' or ']'
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }
  }

  try {
    const parsedObj = JSON.parse(cleaned);
    const result = schema.safeParse(parsedObj);
    if (result.success) {
      return {
        data: result.data,
        isSchemaValid: true,
        rawJson: cleaned
      };
    } else {
      const errorMsgs = result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`);
      console.warn("Zod schema validation warning:", errorMsgs);
      return {
        data: (parsedObj as T) || fallbackValue!,
        isSchemaValid: false,
        rawJson: cleaned,
        errors: errorMsgs
      };
    }
  } catch (jsonErr: any) {
    console.error("JSON parse error before Zod validation:", jsonErr);
    if (fallbackValue !== undefined) {
      return { data: fallbackValue, isSchemaValid: false, rawJson: rawText, errors: [jsonErr.message] };
    }
    throw new Error(`Failed to parse response as JSON: ${jsonErr.message}`);
  }
}
