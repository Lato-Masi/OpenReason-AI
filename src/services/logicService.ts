import { generateGeminiContentProxy } from "./apiKeyService";
import * as Prompts from "./prompts";
import { isOpenRouterModel, generateOpenRouterContent } from "./openrouterService";

export interface FormalLogicModule {
  ontology: {
    title: string;
    description: string;
    schema: any; // JSON Schema representing Higher Order entities
  };
  expressions: {
    id: string;
    description: string;
    cel: string; // First Order Logic in CEL syntax
  }[];
}

/**
 * Formalizer Service: Transforms unstructured reasoning into a structured Logic Module.
 */
export async function formalizeReasoning(
  prompt: string,
  solverOutput: string,
  modelName: string = "gemini-3.6-flash"
): Promise<FormalLogicModule | null> {
  try {
    const formalizerPrompt = `
      OpenReason Formalizer [HOL/FOL Mapping]:
      Transform the following reasoning output into a structured formal ontology.
      
      User Task: "${prompt}"
      Solver Output: "${solverOutput}"

      Output requirements:
      1. Define an "Ontology" as a JSON Schema (Draft 7) representing the entities and relations.
      2. Define "Expressions" as First Order Logic statements using Google Common Expression Language (CEL) syntax.
      
      Return strictly as JSON with this structure:
      {
        "ontology": { "title": "string", "description": "string", "schema": {} },
        "expressions": [{ "id": "string", "description": "string", "cel": "string" }]
      }
    `;

    let text = "";
    if (isOpenRouterModel(modelName)) {
      try {
        const res = await generateOpenRouterContent({
          model: modelName,
          prompt: formalizerPrompt,
          temperature: 0.1,
          responseMimeType: "application/json"
        });
        text = res.text || "";
      } catch (e) {
        const res = await generateGeminiContentProxy({
          model: "gemini-3.6-flash",
          contents: formalizerPrompt,
          config: { temperature: 0.1, responseMimeType: "application/json" }
        });
        text = res.text || "";
      }
    } else {
      try {
        const result = await generateGeminiContentProxy({
          model: modelName,
          contents: formalizerPrompt,
          config: { 
            temperature: 0.1,
            responseMimeType: "application/json"
          }
        });
        text = result.text || "";
      } catch (e: any) {
        if (modelName !== "gemini-3.6-flash") {
          const result = await generateGeminiContentProxy({
            model: "gemini-3.6-flash",
            contents: formalizerPrompt,
            config: { temperature: 0.1, responseMimeType: "application/json" }
          });
          text = result.text || "";
        } else {
          throw e;
        }
      }
    }

    const cleanedJson = text.replace(/```json|```/g, "").trim();
    return JSON.parse(cleanedJson) as FormalLogicModule;
  } catch (error) {
    console.error("Formalizer Error:", error);
    return null;
  }
}

