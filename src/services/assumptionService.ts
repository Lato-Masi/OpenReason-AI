/**
 * OpenReason Assumption Handling & Validation Engine
 * 1. Explicit & Implicit Assumption Generation
 * 2. Assumption Validation (Consistency, Relevance, Empirical Verification)
 * 3. Assumption-Driven Reasoning & Probabilistic Profile Branching
 */

import { getGenAIClient } from "./apiKeyService";
import { AssumptionAnalysisResult, AssumptionItem, AssumptionValidation, AssumptionProfile } from "../types";
import { isOpenRouterModel, generateOpenRouterContent } from "./openrouterService";
import { 
  zodToJsonSchema, 
  parseAndValidateZod, 
  AssumptionAnalysisSchema, 
  AssumptionAnalysisOutput 
} from "./structuredOutput";

export const ASSUMPTION_ANALYSIS_PROMPT = (prompt: string) => `
OpenReason Assumption Handling & Validation Engine [v2.0]:
You are an expert epistemologist, decision analyst, and formal logic evaluator.
Analyze the following problem statement to identify explicit and implicit assumptions, validate them, and generate probabilistic assumption profiles.

Problem Statement:
"${prompt}"

Required Execution Protocol:
1. EXPLICIT & IMPLICIT ASSUMPTION GENERATION:
   - Identify both stated (explicit) and unstated (implicit) assumptions.
   - Use common sense reasoning and domain knowledge lookup.
   - Categorize each as: domain, common_sense, boundary, resource, or environmental.
   - Assign initial confidence score (0.0 to 1.0).

2. ASSUMPTION VALIDATION:
   - Evaluate consistency with domain facts and logic (consistency_score).
   - Evaluate relevance to the core problem (relevance_score).
   - Provide empirical evidence or counter-examples where applicable.
   - Assign verdict: VALID, QUESTIONABLE, or INVALID.

3. PROBABILISTIC ASSUMPTION PROFILES & BRANCHING:
   - Construct 2-3 distinct operating assumption profiles (e.g. Standard/Baseline, Constrained/Edge-Case, High-Resource/Optimistic).
   - Assign calibrated probability weights summing to ~1.0 across profiles.
   - Describe the distinct reasoning branch strategy for each profile.

4. INTERPRETATION SYNTHESIS:
   - Synthesize the primary problem interpretation under baseline assumptions.
   - List alternative interpretations derived from differing assumption sets.

Return JSON strictly adhering to schema:
{
  "assumptions": [
    {
      "id": "ASM-1",
      "statement": "...",
      "type": "explicit" | "implicit",
      "category": "domain" | "common_sense" | "boundary" | "resource" | "environmental",
      "confidence": number,
      "justification": "..."
    }
  ],
  "validations": [
    {
      "assumption_id": "ASM-1",
      "is_valid": boolean,
      "relevance_score": number,
      "consistency_score": number,
      "empirical_evidence": "...",
      "verdict": "VALID" | "QUESTIONABLE" | "INVALID"
    }
  ],
  "profiles": [
    {
      "profile_id": "PROF-1",
      "title": "Standard Operating Conditions",
      "probability": 0.70,
      "description": "...",
      "reasoning_branch": "..."
    }
  ],
  "primary_interpretation": "...",
  "alternative_interpretations": ["...", "..."]
}
`;

export async function analyzeAssumptions(
  prompt: string,
  modelName: string = "gemini-3.6-flash"
): Promise<AssumptionAnalysisResult> {
  const schema = zodToJsonSchema(AssumptionAnalysisSchema);
  const evalPrompt = ASSUMPTION_ANALYSIS_PROMPT(prompt);
  const ai = getGenAIClient();

  let jsonText = "";

  if (isOpenRouterModel(modelName)) {
    try {
      const res = await generateOpenRouterContent({
        model: modelName,
        prompt: evalPrompt,
        temperature: 0.2,
        responseMimeType: "application/json",
        jsonSchema: schema
      });
      jsonText = res.text || "";
    } catch (err) {
      console.warn("OpenRouter assumption analysis failed, falling back to Gemini:", err);
      const res = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: evalPrompt,
        config: {
          temperature: 0.2,
          responseMimeType: "application/json",
          responseSchema: schema
        }
      });
      jsonText = res.text || "";
    }
  } else {
    try {
      const res = await ai.models.generateContent({
        model: modelName,
        contents: evalPrompt,
        config: {
          temperature: 0.2,
          responseMimeType: "application/json",
          responseSchema: schema
        }
      });
      jsonText = res.text || "";
    } catch (err: any) {
      if (modelName !== "gemini-3.6-flash") {
        const res = await ai.models.generateContent({
          model: "gemini-3.6-flash",
          contents: evalPrompt,
          config: {
            temperature: 0.2,
            responseMimeType: "application/json",
            responseSchema: schema
          }
        });
        jsonText = res.text || "";
      } else {
        jsonText = "";
      }
    }
  }

  const fallback: AssumptionAnalysisOutput = {
    assumptions: [
      {
        id: "ASM-1",
        statement: "Standard domain boundaries apply without external interference.",
        type: "implicit",
        category: "domain",
        confidence: 0.9,
        justification: "Inferred from problem formulation"
      }
    ],
    validations: [
      {
        assumption_id: "ASM-1",
        is_valid: true,
        relevance_score: 0.95,
        consistency_score: 0.90,
        empirical_evidence: "Standard domain conventions hold across non-pathological scenarios.",
        verdict: "VALID"
      }
    ],
    profiles: [
      {
        profile_id: "PROF-A",
        title: "Nominal Operating Assumptions",
        probability: 0.85,
        description: "Baseline scenario operating under standard parameters.",
        reasoning_branch: "Execute primary analytical reasoning path."
      },
      {
        profile_id: "PROF-B",
        title: "Constrained / Edge-Case Assumptions",
        probability: 0.15,
        description: "Alternative scenario assuming boundary restrictions.",
        reasoning_branch: "Apply defensive counterfactual reasoning path."
      }
    ],
    primary_interpretation: "Direct problem formulation assuming standard domain rules.",
    alternative_interpretations: [
      "Strict edge-case interpretation assuming boundary constraints."
    ]
  };

  const parsed = parseAndValidateZod<AssumptionAnalysisOutput>(jsonText, AssumptionAnalysisSchema, fallback);
  const data = parsed.data || fallback;

  const items: AssumptionItem[] = (data.assumptions || []).map(a => ({
    id: a.id,
    statement: a.statement,
    type: a.type as 'explicit' | 'implicit',
    category: a.category as 'domain' | 'common_sense' | 'boundary' | 'resource' | 'environmental',
    confidence: a.confidence ?? 0.85,
    justification: a.justification || ""
  }));

  const validations: AssumptionValidation[] = (data.validations || []).map(v => ({
    assumptionId: v.assumption_id,
    isValid: v.is_valid ?? true,
    relevanceScore: v.relevance_score ?? 0.9,
    consistencyScore: v.consistency_score ?? 0.9,
    empiricalEvidence: v.empirical_evidence,
    verdict: v.verdict as 'VALID' | 'QUESTIONABLE' | 'INVALID'
  }));

  const profiles: AssumptionProfile[] = (data.profiles || []).map(p => ({
    profileId: p.profile_id,
    title: p.title,
    probability: p.probability ?? 0.5,
    description: p.description,
    reasoningBranch: p.reasoning_branch
  }));

  return {
    assumptions: items,
    validations,
    profiles,
    primaryInterpretation: data.primary_interpretation || "Primary problem interpretation.",
    alternativeInterpretations: data.alternative_interpretations || []
  };
}
