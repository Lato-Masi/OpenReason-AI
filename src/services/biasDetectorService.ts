/**
 * OpenReason Automated Cognitive Bias & Logical Fallacy Audit Engine
 * Evaluates reasoning steps against the Cognitive Biases and Logical Fallacies catalogs.
 */

import { generateGeminiContentProxy } from "./apiKeyService";
import { COGNITIVE_BIASES_CATALOG, LOGICAL_FALLACIES_CATALOG } from "./taxonomyRegistry";
import { ReasoningFlawCheck, FlawAuditResult } from "../types";
import { isOpenRouterModel, generateOpenRouterContent } from "./openrouterService";
import { 
  zodToJsonSchema, 
  parseAndValidateZod, 
  FlawAuditSchema, 
  FlawAuditOutput 
} from "./structuredOutput";

export const AUDIT_FLAWS_PROMPT = (prompt: string, reasoningText: string) => `
OpenReason Bias & Fallacy Audit Module [v1.0]:
You are an expert epistemic auditor and formal logician. Analyze the following reasoning trace for cognitive biases, heuristics, logical fallacies, or context drift.

User Query Anchor:
"${prompt}"

Reasoning Trace to Audit:
${reasoningText}

Known Cognitive Biases Catalog to check:
- Confirmation Bias (favoring confirming evidence, ignoring counter-arguments)
- Hindsight Bias (claiming outcomes were obvious beforehand)
- Anchoring Bias (over-relying on initial numeric value or reference point)
- Availability Heuristic (overestimating easily recalled or dramatic events)
- Belief Bias (evaluating logic based on whether conclusion sounds believable)
- Overconfidence (overestimating precision, no margin of error/confidence bounds)
- Framing Effect (conclusions changing based solely on presentation)
- Loss Aversion / Sunk Cost (unwillingness to abandon failing strategy due to past effort)
- Base Rate Fallacy (ignoring population prior probabilities)
- Prosecutor's Fallacy (confusing P(E|H) with P(H|E))
- System 1 Overreliance (rapid intuitive leap without multi-step proof)

Known Logical Fallacies Catalog to check:
- Ad Hominem (attacking person/source rather than argument)
- Straw Man (misrepresenting opposing view to make it easy to refute)
- Appeal to Ignorance (claiming truth due to lack of disproof)
- Slippery Slope (unproven chain reaction to catastrophe)
- False Dilemma (forcing binary choices when intermediate options exist)
- Hasty Generalization (drawing broad rules from tiny or unrepresentative sample)
- Correlation vs Causation (assuming co-occurrence equals cause)
- Circular Reasoning (using conclusion as a premise)

Audit Directives:
1. Thoroughly evaluate the reasoning trace against every bias and fallacy above.
2. Flag any detected flaws with explicit snippet evidence from the trace.
3. Compute an overall logical score between 0.0 (severely flawed) and 1.0 (impeccable).
4. For each detected flaw, provide a concrete mitigation strategy.

Return JSON response matching:
{
  "score": number (0.0 to 1.0),
  "flaws": [
    {
      "type": "bias" | "fallacy" | "heuristic" | "drift",
      "id": "catalog_id_or_name",
      "name": "Flaw Name",
      "detected": boolean,
      "evidence": "quote or description from trace",
      "severity": "low" | "medium" | "high" | "critical",
      "mitigation": "recommended correction"
    }
  ],
  "mitigation_summary": "summary of required corrections"
}
`;

/**
 * Heuristic fallback parser that inspects reasoning text for obvious fallacy/bias indicators
 */
function runHeuristicFlawScan(reasoningText: string): ReasoningFlawCheck[] {
  const flaws: ReasoningFlawCheck[] = [];
  const lower = reasoningText.toLowerCase();

  if (lower.includes("obviously") || lower.includes("without a doubt") || lower.includes("100% certain") || lower.includes("always true")) {
    flaws.push({
      type: "bias",
      id: "overconfidence",
      name: "Overconfidence Effect",
      detected: true,
      evidence: "Unqualified claims of absolute certainty without confidence intervals or error margins.",
      severity: "medium",
      mitigation: "State confidence intervals (e.g., 90% CI) and explicit assumptions."
    });
  }

  if (lower.includes("either") && lower.includes("or") && (lower.includes("must be") || lower.includes("only two"))) {
    flaws.push({
      type: "fallacy",
      id: "false_dilemma",
      name: "False Dilemma",
      detected: true,
      evidence: "Framing choices as binary opposites without evaluating middle ground or hybrid options.",
      severity: "medium",
      mitigation: "Evaluate intermediate options and hybrid solutions."
    });
  }

  if (lower.includes("caused") && !lower.includes("mechanism") && !lower.includes("proof") && lower.includes("after")) {
    flaws.push({
      type: "fallacy",
      id: "correlation_causation_confusion",
      name: "Correlation vs Causation",
      detected: true,
      evidence: "Implied causality based on temporal sequence or co-occurrence.",
      severity: "high",
      mitigation: "Provide explicit mechanistic proof or state as correlation only."
    });
  }

  return flaws;
}

/**
 * Perform automated cognitive bias and logical fallacy audit on any reasoning trace
 */
export async function auditReasoningFlaws(
  prompt: string,
  reasoningText: string,
  modelName: string = "gemini-3.6-flash"
): Promise<FlawAuditResult> {
  const schema = zodToJsonSchema(FlawAuditSchema);
  const auditPrompt = AUDIT_FLAWS_PROMPT(prompt, reasoningText);

  let jsonText = "";

  if (isOpenRouterModel(modelName)) {
    try {
      const res = await generateOpenRouterContent({
        model: modelName,
        prompt: auditPrompt,
        temperature: 0.1,
        responseMimeType: "application/json",
        jsonSchema: schema
      });
      jsonText = res.text || "";
    } catch (err) {
      console.warn("OpenRouter flaw audit failed, falling back to Gemini:", err);
      const res = await generateGeminiContentProxy({
        model: "gemini-3.6-flash",
        contents: auditPrompt,
        config: {
          temperature: 0.1,
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
        contents: auditPrompt,
        config: {
          temperature: 0.1,
          responseMimeType: "application/json",
          responseSchema: schema
        }
      });
      jsonText = res.text || "";
    } catch (err: any) {
      if (modelName !== "gemini-3.6-flash") {
        const res = await generateGeminiContentProxy({
          model: "gemini-3.6-flash",
          contents: auditPrompt,
          config: {
            temperature: 0.1,
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

  const heuristicFlaws = runHeuristicFlawScan(reasoningText);

  const fallback: FlawAuditOutput = {
    score: heuristicFlaws.length > 0 ? 0.7 : 0.9,
    flaws: heuristicFlaws,
    mitigation_summary: heuristicFlaws.length > 0 
      ? `Heuristic scan identified ${heuristicFlaws.length} potential risk(s).` 
      : "No critical flaws detected."
  };

  const parsed = parseAndValidateZod<FlawAuditOutput>(jsonText, FlawAuditSchema, fallback);
  const data = parsed.data || fallback;

  // Merge any detected heuristic flaws if not already present
  const mergedFlawsMap = new Map<string, ReasoningFlawCheck>();
  (data.flaws || []).forEach(f => {
    if (f.detected) mergedFlawsMap.set(f.id || f.name, f as ReasoningFlawCheck);
  });
  heuristicFlaws.forEach(hf => {
    if (!mergedFlawsMap.has(hf.id)) mergedFlawsMap.set(hf.id, hf);
  });

  const finalFlawsList = Array.from(mergedFlawsMap.values());
  const detectedBiasesCount = finalFlawsList.filter(f => f.type === "bias" || f.type === "heuristic").length;
  const detectedFallaciesCount = finalFlawsList.filter(f => f.type === "fallacy" || f.type === "drift").length;

  return {
    flaws: finalFlawsList,
    score: Math.max(0.1, Math.min(1.0, data.score ?? 0.85)),
    mitigationSummary: data.mitigation_summary || "Audit complete.",
    detectedBiasesCount,
    detectedFallaciesCount
  };
}
