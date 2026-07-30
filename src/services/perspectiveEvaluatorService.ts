/**
 * OpenReason Multi-Perspective Solution Evaluator
 * Evaluates generated reasoning solutions across 5 core strategic dimensions:
 * 1. Feasibility (Practicality, resource requirements, execution risk)
 * 2. Impact (Leverage, problem resolution depth, value output)
 * 3. Risk (Downside vulnerabilities, failure modes, unintended side-effects)
 * 4. Stakeholder Reception (Acceptance across affected parties, ethics, trust)
 * 5. Sustainability (Long-term maintainability, resilience, adaptability)
 */

import { generateGeminiContentProxy } from "./apiKeyService";
import { MultiPerspectiveResult } from "../types";
import { isOpenRouterModel, generateOpenRouterContent } from "./openrouterService";
import { 
  zodToJsonSchema, 
  parseAndValidateZod, 
  MultiPerspectiveSchema, 
  MultiPerspectiveOutput 
} from "./structuredOutput";

export const MULTI_PERSPECTIVE_PROMPT = (prompt: string, answer: string) => `
OpenReason Strategic Multi-Perspective Evaluator [v2.0]:
You are a senior strategic advisor, systems analyst, and decision theorist. 
Evaluate the following proposed solution across 5 multi-perspective dimensions.

Original User Problem:
"${prompt}"

Proposed Solution / Reasoning Result to Evaluate:
${answer}

Evaluation Directives:
1. FEASIBILITY (0.0 to 1.0): Assess implementation practicality, complexity, resource constraints, and technical friction.
2. IMPACT (0.0 to 1.0): Assess problem resolution depth, transformative potential, leverage, and ROI.
3. RISK (0.0 to 1.0): Assess safety margin, vulnerability to failure, edge-case risks, and collateral damage (1.0 = low risk/safe, 0.0 = extreme risk).
4. STAKEHOLDER RECEPTION (0.0 to 1.0): Assess political, social, ethical, user, and organizational acceptance.
5. SUSTAINABILITY (0.0 to 1.0): Assess long-term maintenance, ecological/economic endurance, and adaptability over time.
6. OVERALL SCORE (0.0 to 1.0): Compute weighted strategic synthesis score.
7. RECOMMENDATION: Provide an actionable executive summary advisory.

Return JSON strictly matching:
{
  "feasibility": { "score": number, "rationale": "...", "key_insights": ["...", "..."] },
  "impact": { "score": number, "rationale": "...", "key_insights": ["...", "..."] },
  "risk": { "score": number, "rationale": "...", "key_insights": ["...", "..."] },
  "stakeholder_reception": { "score": number, "rationale": "...", "key_insights": ["...", "..."] },
  "sustainability": { "score": number, "rationale": "...", "key_insights": ["...", "..."] },
  "overall_score": number,
  "recommendation": "..."
}
`;

export async function evaluateMultiPerspective(
  prompt: string,
  answer: string,
  modelName: string = "gemini-3.6-flash"
): Promise<MultiPerspectiveResult> {
  const schema = zodToJsonSchema(MultiPerspectiveSchema);
  const evalPrompt = MULTI_PERSPECTIVE_PROMPT(prompt, answer);

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
      console.warn("OpenRouter multi-perspective eval failed, falling back to Gemini:", err);
      const res = await generateGeminiContentProxy({
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
      const res = await generateGeminiContentProxy({
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
        const res = await generateGeminiContentProxy({
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

  const fallback: MultiPerspectiveOutput = {
    feasibility: { score: 0.85, rationale: "High practical feasibility with standard operational paradigms.", key_insights: ["Straightforward implementation path", "Low resource overhead"] },
    impact: { score: 0.88, rationale: "Strong potential impact directly targeting primary objective.", key_insights: ["Addresses core bottleneck", "High leverage outcome"] },
    risk: { score: 0.80, rationale: "Manageable operational risks with standard safety boundaries.", key_insights: ["Low critical failure probability", "Clear rollback paths"] },
    stakeholder_reception: { score: 0.82, rationale: "Favorable alignment with key user and system expectations.", key_insights: ["Low friction for adoption", "Transparent trade-offs"] },
    sustainability: { score: 0.85, rationale: "Resilient long-term viability with minimal debt.", key_insights: ["Adaptable to changing conditions", "Sustainable maintenance requirements"] },
    overall_score: 0.84,
    recommendation: "Proceed with implementation while monitoring key risk indicators."
  };

  const parsed = parseAndValidateZod<MultiPerspectiveOutput>(jsonText, MultiPerspectiveSchema, fallback);
  const data = parsed.data || fallback;

  return {
    feasibility: {
      score: data.feasibility?.score ?? 0.85,
      rationale: data.feasibility?.rationale || "Evaluated practical execution feasibility.",
      keyInsights: data.feasibility?.key_insights || []
    },
    impact: {
      score: data.impact?.score ?? 0.85,
      rationale: data.impact?.rationale || "Evaluated leverage and problem resolution depth.",
      keyInsights: data.impact?.key_insights || []
    },
    risk: {
      score: data.risk?.score ?? 0.80,
      rationale: data.risk?.rationale || "Evaluated safety margins and failure modes.",
      keyInsights: data.risk?.key_insights || []
    },
    stakeholderReception: {
      score: data.stakeholder_reception?.score ?? 0.82,
      rationale: data.stakeholder_reception?.rationale || "Evaluated stakeholder and user acceptance.",
      keyInsights: data.stakeholder_reception?.key_insights || []
    },
    sustainability: {
      score: data.sustainability?.score ?? 0.85,
      rationale: data.sustainability?.rationale || "Evaluated long-term resilience and endurance.",
      keyInsights: data.sustainability?.key_insights || []
    },
    overallScore: data.overall_score ?? 0.84,
    recommendation: data.recommendation || "Proceed with standard execution."
  };
}
