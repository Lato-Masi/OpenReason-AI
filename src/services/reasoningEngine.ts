import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import * as Prompts from "./prompts";
import { saveMemory, getRecentMemory } from "./db";
import { formalizeReasoning, FormalLogicModule } from "./logicService";
import { isOpenRouterModel, generateOpenRouterContent } from "./openrouterService";
import { 
  zodToJsonSchema, 
  parseAndValidateZod, 
  ClassifierSchema, 
  ConstOTFormalizerSchema, 
  VerifierSchema, 
  IntentAnalysisSchema,
  ClassifierOutput,
  ConstOTFormalizerOutput,
  VerifierOutput
} from "./structuredOutput";
import { 
  buildDomainAugmentedPrompt, 
  DomainParadigm, 
  ReasoningModality 
} from "./domainStrategyRegistry";
import { getGenAIClient, generateGeminiContentProxy } from "./apiKeyService";
import { auditReasoningFlaws } from "./biasDetectorService";
import { analyzeAssumptions } from "./assumptionService";
import { formatLLMError } from "./llmErrorAdapter";
import { ReasoningFlawCheck, FlawAuditResult, AssumptionAnalysisResult } from "../types";
import { z } from "zod";

async function dispatchModelCall(
  stage: string,
  cfg: ModuleConfig,
  prompt: string,
  options?: {
    requiresGrounding?: boolean;
    responseMimeType?: string;
    zodSchema?: z.ZodType<any>;
  }
) {
  const jsonSchema = options?.zodSchema ? zodToJsonSchema(options.zodSchema) : undefined;
  const mimeType = options?.zodSchema ? "application/json" : options?.responseMimeType;

  if (isOpenRouterModel(cfg.model)) {
    try {
      return await generateOpenRouterContent({
        model: cfg.model,
        prompt,
        temperature: cfg.temperature,
        thinkingLevel: cfg.thinkingLevel,
        requiresGrounding: options?.requiresGrounding,
        codeExecution: cfg.codeExecution,
        responseMimeType: mimeType,
        jsonSchema
      });
    } catch (openRouterErr: any) {
      console.warn(`OpenRouter model ${cfg.model} call on ${stage} failed, using Gemini fallback:`, openRouterErr);
      const fallbackModel = "gemini-3.6-flash";
      const fallbackRes = await generateGeminiContentProxy({
        model: fallbackModel,
        contents: prompt,
        config: { 
          temperature: cfg.temperature,
          thinkingConfig: { thinkingLevel: cfg.thinkingLevel },
          ...(options?.requiresGrounding ? { tools: [{ googleSearch: {} }] } : {}),
          ...(mimeType ? { responseMimeType: mimeType } : {}),
          ...(jsonSchema ? { responseSchema: jsonSchema } : {})
        }
      });
      const fallbackText = fallbackRes.text || "";
      const textWithNotice = `[Note: OpenRouter model (${cfg.model}) call failed (${openRouterErr.message || openRouterErr}). Executed step via Gemini fallback]\n\n${fallbackText}`;
      return {
        ...fallbackRes,
        text: textWithNotice,
        candidates: [
          {
            content: {
              parts: [{ text: textWithNotice }]
            }
          }
        ]
      };
    }
  }

  const tools: any[] = [];
  if (options?.requiresGrounding) {
    tools.push({ googleSearch: {} });
  }
  if (cfg.codeExecution) {
    tools.push({ codeExecution: {} });
  }

  try {
    return await generateGeminiContentProxy({
      model: cfg.model,
      contents: prompt,
      config: { 
        temperature: cfg.temperature,
        thinkingConfig: { thinkingLevel: cfg.thinkingLevel },
        tools: tools.length > 0 ? tools : undefined,
        ...(mimeType ? { responseMimeType: mimeType } : {}),
        ...(jsonSchema ? { responseSchema: jsonSchema } : {})
      }
    });
  } catch (err: any) {
    const errStr = err?.message || String(err);
    if ((errStr.includes("PERMISSION_DENIED") || errStr.includes("403") || errStr.includes("not found") || errStr.includes("404")) && cfg.model !== "gemini-3.6-flash") {
      console.warn(`Model ${cfg.model} call on ${stage} failed (${errStr}), falling back to gemini-3.6-flash`);
      return await generateGeminiContentProxy({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: { 
          temperature: cfg.temperature,
          thinkingConfig: { thinkingLevel: cfg.thinkingLevel },
          tools: tools.length > 0 ? tools : undefined,
          ...(mimeType ? { responseMimeType: mimeType } : {}),
          ...(jsonSchema ? { responseSchema: jsonSchema } : {})
        }
      });
    }
    throw err;
  }
}

/**
 * Helper to execute AI calls with exponential backoff retry for transient errors.
 */
async function callAIWithRetry(
  apiCall: () => Promise<any>,
  stageName: string,
  addStep: (stage: string, content: string) => void,
  retries = 3
): Promise<any> {
  let lastError: any;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await apiCall();
    } catch (error: any) {
      lastError = error;
      const errorMessage = error?.message || String(error);
      const isTransient = /500|503|429|fetch|network|timeout/i.test(errorMessage);

      if (!isTransient || attempt === retries) {
        throw new Error(`[${stageName}] Final failure after ${attempt} attempts: ${errorMessage}`);
      }

      const backoff = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
      addStep(stageName, `⚠️ Transient error: ${errorMessage}. Retrying in ${backoff}ms (Attempt ${attempt}/${retries})...`);
      await new Promise(resolve => setTimeout(resolve, backoff));
    }
  }
  throw lastError;
}

export enum ReasoningMode {
  REFLEX = "Reflex",
  ANALYTIC = "Analytic",
  REFLECTIVE = "Reflective",
  CONST_O_T = "Const-o-T",
  SELF_REWARDING = "Self-Rewarding",
}

export interface DiscoveryNode {
  id: string;
  label: string;
  type: 'concept' | 'evidence' | 'hypothesis' | 'logic' | 'branch';
  description?: string;
  parentId?: string;
}

export interface ReasoningStep {
  stage: string;
  content: string;
  timestamp: number;
  temperature?: number; // Metadata for dynamic inference heat
  model?: string; // Model used for this step
  thought?: string; // Gemini's internal thinking process
  codeExecution?: {
    code: string;
    output: string;
  };
  rawPrompt?: string;
  rawResponse?: string;
  evidence?: string; // Captured chain of evidence/verification signatures
  discoveryNodes?: DiscoveryNode[];
  flawsFound?: ReasoningFlawCheck[];
  inputTokens?: number;
  outputTokens?: number;
}

export interface ModuleConfig {
  model: string;
  temperature: number;
  thinkingLevel: ThinkingLevel;
  codeExecution?: boolean;
}

export interface DynamicConfig {
  modeConfigs: Record<ReasoningMode, ModuleConfig>;
  moduleConfigs: Record<string, ModuleConfig>;
}

export const DEFAULT_DYNAMIC_CONFIG: DynamicConfig = {
  modeConfigs: {
    [ReasoningMode.REFLEX]: { model: "gemini-3.6-flash", temperature: 0.35, thinkingLevel: ThinkingLevel.MINIMAL, codeExecution: false },
    [ReasoningMode.ANALYTIC]: { model: "gemini-3.6-flash", temperature: 0.75, thinkingLevel: ThinkingLevel.HIGH, codeExecution: true },
    [ReasoningMode.REFLECTIVE]: { model: "gemini-3.6-flash", temperature: 0.90, thinkingLevel: ThinkingLevel.HIGH, codeExecution: true },
    [ReasoningMode.CONST_O_T]: { model: "gemini-3.6-flash", temperature: 0.70, thinkingLevel: ThinkingLevel.HIGH, codeExecution: true },
    [ReasoningMode.SELF_REWARDING]: { model: "gemini-3.6-flash", temperature: 0.70, thinkingLevel: ThinkingLevel.HIGH, codeExecution: true },
  },
  moduleConfigs: {
    "Classifier": { model: "gemini-3.6-flash", temperature: 0.1, thinkingLevel: ThinkingLevel.MINIMAL, codeExecution: false },
    "Skeleton": { model: "gemini-3.6-flash", temperature: 0.8, thinkingLevel: ThinkingLevel.HIGH, codeExecution: false },
    "Solver": { model: "gemini-3.6-flash", temperature: 0.85, thinkingLevel: ThinkingLevel.HIGH, codeExecution: true },
    "Verifier": { model: "gemini-3.6-flash", temperature: 0.2, thinkingLevel: ThinkingLevel.HIGH, codeExecution: true },
    "Critic": { model: "gemini-3.6-flash", temperature: 0.1, thinkingLevel: ThinkingLevel.HIGH, codeExecution: false },
    "Mapper": { model: "gemini-3.6-flash", temperature: 0.4, thinkingLevel: ThinkingLevel.HIGH, codeExecution: false },
    "Finalizer": { model: "gemini-3.6-flash", temperature: 0.3, thinkingLevel: ThinkingLevel.LOW, codeExecution: false },
    "InitialReasoning": { model: "gemini-3.6-flash", temperature: 0.75, thinkingLevel: ThinkingLevel.HIGH, codeExecution: false },
    "SelfElicitation": { model: "gemini-3.6-flash", temperature: 0.60, thinkingLevel: ThinkingLevel.HIGH, codeExecution: false },
    "ConstraintFormalizer": { model: "gemini-3.6-flash", temperature: 0.20, thinkingLevel: ThinkingLevel.HIGH, codeExecution: false },
    "ConstraintIntegratedSolver": { model: "gemini-3.6-flash", temperature: 0.40, thinkingLevel: ThinkingLevel.HIGH, codeExecution: true },
    "ConstraintValidator": { model: "gemini-3.6-flash", temperature: 0.10, thinkingLevel: ThinkingLevel.HIGH, codeExecution: false },
    "SelfRewardingSelect": { model: "gemini-3.6-flash", temperature: 0.40, thinkingLevel: ThinkingLevel.HIGH, codeExecution: false },
    "SelfRewardingCOT": { model: "gemini-3.6-flash", temperature: 0.75, thinkingLevel: ThinkingLevel.HIGH, codeExecution: true },
    "SelfRewardingEval": { model: "gemini-3.6-flash", temperature: 0.20, thinkingLevel: ThinkingLevel.HIGH, codeExecution: false },
    "SelfRewardingRefine": { model: "gemini-3.6-flash", temperature: 0.30, thinkingLevel: ThinkingLevel.HIGH, codeExecution: true },
  }
};

export interface ReasoningResult {
  mode: ReasoningMode;
  strategy?: string;
  primaryModality?: ReasoningModality;
  domainParadigm?: DomainParadigm;
  domainFramework?: string;
  steps: ReasoningStep[];
  finalAnswer: string;
  confidence: number;
  verdict: "STABLE" | "UNCERTAIN" | "REJECTED";
  formalLogic?: FormalLogicModule;
  flawsAudit?: FlawAuditResult;
  assumptionsAnalysis?: AssumptionAnalysisResult;
  totalTokens?: number;
  estimatedCost?: number;
  durationMs?: number;
}

export interface IntentAnalysis {
  biases: string[];
  inaccuracies: string[];
  refined_intents: {
    label: string;
    refined_prompt: string;
    rationale: string;
  }[];
}

export async function analyzeIntent(prompt: string, modelOverride?: string): Promise<IntentAnalysis> {
  const modelName = modelOverride || "gemini-3.6-flash";
  const intentSchema = zodToJsonSchema(IntentAnalysisSchema);
  
  let text = "";
  if (isOpenRouterModel(modelName)) {
    try {
      const res = await generateOpenRouterContent({
        model: modelName,
        prompt: Prompts.INTENT_ANALYZER_PROMPT(prompt),
        temperature: 0.1,
        responseMimeType: "application/json",
        jsonSchema: intentSchema
      });
      text = res.text || "";
    } catch (err) {
      const response = await generateGeminiContentProxy({
        model: "gemini-3.6-flash",
        contents: Prompts.INTENT_ANALYZER_PROMPT(prompt),
        config: { 
          temperature: 0.1,
          responseMimeType: "application/json",
          responseSchema: intentSchema
        }
      });
      text = response.text || "";
    }
  } else {
    try {
      const response = await generateGeminiContentProxy({
        model: modelName,
        contents: Prompts.INTENT_ANALYZER_PROMPT(prompt),
        config: { 
          temperature: 0.1,
          responseMimeType: "application/json",
          responseSchema: intentSchema
        }
      });
      text = response.text || "";
    } catch (err: any) {
      if (modelName !== "gemini-3.6-flash") {
        const response = await generateGeminiContentProxy({
          model: "gemini-3.6-flash",
          contents: Prompts.INTENT_ANALYZER_PROMPT(prompt),
          config: { 
            temperature: 0.1,
            responseMimeType: "application/json",
            responseSchema: intentSchema
          }
        });
        text = response.text || "";
      } else {
        throw err;
      }
    }
  }

  const fallback: IntentAnalysis = {
    biases: ["Unable to parse deep intent analysis"],
    inaccuracies: [],
    refined_intents: [
      { label: "Direct Interpretation", refined_prompt: prompt, rationale: "Direct execution as provided." }
    ]
  };

  const parsedResult = parseAndValidateZod(text, IntentAnalysisSchema, fallback);
  return parsedResult.data;
}

export async function processReasoning(
  prompt: string,
  onStep?: (step: ReasoningStep) => void,
  config: { model?: string; temperature?: number; dynamicConfig?: DynamicConfig } = {}
): Promise<ReasoningResult> {
  const startTime = performance.now();
  const steps: ReasoningStep[] = [];
  const modelName = config.model || "gemini-3.6-flash";
  const dynamicConfig = config.dynamicConfig || DEFAULT_DYNAMIC_CONFIG;
  let confidence = 0.85;
  let verdict: "STABLE" | "UNCERTAIN" | "REJECTED" = "STABLE";

  let globalFlawsAudit: FlawAuditResult | undefined;

  const addStep = (
    stage: string, 
    content: string, 
    rawPrompt?: string, 
    rawResponse?: string, 
    stepTemperature?: number, 
    stepModel?: string, 
    thought?: string, 
    codeExecution?: { code: string; output: string },
    flawsFound?: ReasoningFlawCheck[]
  ) => {
    let evidence: string | undefined;
    const discoveryNodes: DiscoveryNode[] = [];
    
    // Extract evidence/verification blocks if present
    const evidenceMatch = content.match(/\[(?:CHAIN_OF_EVIDENCE|VERIFICATION|EVIDENCE|VERIFICATION_TARGET)\]:\s*([\s\S]*?)(?=\n\n|\n\[|$)/i);
    if (evidenceMatch) {
      evidence = evidenceMatch[1].trim();
      content = content.replace(evidenceMatch[0], "").trim();
    }

    const nodeRegex = /\[NODE:\s*(concept|evidence|hypothesis|logic|branch)\]\s*([^|\n]+)(?:\|\s*([^|\n]+))?/gi;
    let nodeMatch;
    while ((nodeMatch = nodeRegex.exec(content)) !== null) {
      discoveryNodes.push({
        id: `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: nodeMatch[1].toLowerCase() as any,
        label: nodeMatch[2].trim(),
        description: nodeMatch[3]?.trim()
      });
    }

    const step: ReasoningStep = { 
      stage, 
      content, 
      timestamp: Date.now(), 
      temperature: stepTemperature,
      model: stepModel,
      thought,
      codeExecution,
      rawPrompt, 
      rawResponse, 
      evidence, 
      discoveryNodes: discoveryNodes.length > 0 ? discoveryNodes : undefined,
      flawsFound
    };
    steps.push(step);
    if (onStep) onStep(step);
  };

  const getStepConfig = (stage: string, currentMode?: ReasoningMode): ModuleConfig => {
    if (dynamicConfig.moduleConfigs[stage]) {
      return dynamicConfig.moduleConfigs[stage];
    }
    if (currentMode && dynamicConfig.modeConfigs[currentMode]) {
      return dynamicConfig.modeConfigs[currentMode];
    }
    return {
      model: config.model || "gemini-3.6-flash",
      temperature: config.temperature ?? 0.85,
      thinkingLevel: ThinkingLevel.LOW
    };
  };

  const executeStep = async (stage: string, apiCall: (cfg: ModuleConfig) => Promise<any>, cfg: ModuleConfig) => {
    const response = await callAIWithRetry(
      () => apiCall(cfg),
      stage,
      addStep
    );

    // Extract thought trace and code execution if available in parts or response properties
    let thought: string | undefined = response.reasoningTrace;
    let codeExecution: { code: string; output: string } | undefined = response.codeExecution;
    
    const parts = response.candidates?.[0]?.content?.parts;
    if (parts) {
      for (const part of parts) {
        if ((part as any).thought) {
          thought = (part as any).text || (part as any).thought;
        }
        if ((part as any).executableCode) {
          if (!codeExecution) codeExecution = { code: "", output: "" };
          codeExecution.code = (part as any).executableCode.code;
        }
        if ((part as any).codeExecutionResult) {
          if (!codeExecution) codeExecution = { code: "", output: "" };
          codeExecution.output = (part as any).codeExecutionResult.output;
        }
      }
    }

    return { response, thought, codeExecution };
  };

  try {
    // Stage 0: Context Retrieval
    addStep("Memory", "Retrieving historical context from IndexedDB...");
    const previousInteractions = await getRecentMemory(5);
    const memoryContext = previousInteractions.length > 0 
      ? previousInteractions.map(m => `Interaction: Task=${m.prompt}, Strategy=${m.strategy}, Mode=${m.mode}`).join('\n')
      : "No previous context.";

    // Stage 1: Classifier
    const classifierCfg = getStepConfig("Classifier");
    addStep("Classifier", `Analyzing input patterns using ${classifierCfg.model} (Heat: ${classifierCfg.temperature}, Thinking: ${classifierCfg.thinkingLevel})...`, undefined, undefined, classifierCfg.temperature, classifierCfg.model);
    
    const classifierPrompt = Prompts.CLASSIFIER_PROMPT(prompt);
    const { response: classificationResult, thought: classifierThought, codeExecution: classifierCode } = await executeStep(
      "Classifier",
      (cfg) => dispatchModelCall("Classifier", cfg, classifierPrompt, { zodSchema: ClassifierSchema }),
      classifierCfg
    );
    
    const classificationText = classificationResult.text || "";
    let mode: ReasoningMode = ReasoningMode.REFLEX;
    let strategy = "NONE";
    let primaryModality: ReasoningModality = "DEDUCTIVE";
    let domainParadigm: DomainParadigm = "GENERAL";
    let domainFramework: string | undefined = undefined;
    let requiresGrounding = false;
    
    const parsedClassifier = parseAndValidateZod<ClassifierOutput>(classificationText, ClassifierSchema, {
      mode: ReasoningMode.REFLEX,
      strategy: "NONE",
      primary_modality: "DEDUCTIVE",
      domain_paradigm: "GENERAL",
      domain_framework: "Standard Logical Decomposition",
      complexity_score: 1,
      requires_grounding: false,
      rationale: "Defaulting to Reflex due to parsing format"
    });

    if (parsedClassifier.data) {
      mode = parsedClassifier.data.mode as ReasoningMode;
      strategy = parsedClassifier.data.strategy || "NONE";
      primaryModality = (parsedClassifier.data.primary_modality as ReasoningModality) || "DEDUCTIVE";
      domainParadigm = (parsedClassifier.data.domain_paradigm as DomainParadigm) || "GENERAL";
      domainFramework = parsedClassifier.data.domain_framework;
      requiresGrounding = !!parsedClassifier.data.requires_grounding;
      addStep("Classifier", `[Zod Verified Schema: ${parsedClassifier.isSchemaValid ? 'OK' : 'Fallback'}] Mode: ${mode} | Domain: ${domainParadigm} (${domainFramework || 'Standard'}) | Modality: ${primaryModality} | Strategy: ${strategy} | Grounding: ${requiresGrounding} | Complexity: ${parsedClassifier.data.complexity_score}/10\nRationale: ${parsedClassifier.data.rationale}`, classifierPrompt, classificationText, classifierCfg.temperature, classifierCfg.model, classifierThought, classifierCode);
    } else {
      addStep("Classifier", "Format error in classifier signal. Defaulting to Reflex.", classifierPrompt, classificationText, classifierCfg.temperature, classifierCfg.model, classifierThought, classifierCode);
    }

    if (mode === ReasoningMode.REFLEX) {
      const solverCfg = getStepConfig("Solver", ReasoningMode.REFLEX);
      addStep("Solver", `Executing direct response generation (Heat: ${solverCfg.temperature})${requiresGrounding ? " with Google Search grounding" : ""}...`, undefined, undefined, solverCfg.temperature, solverCfg.model);
      const reflexPrompt = buildDomainAugmentedPrompt("Solver", prompt, domainParadigm, primaryModality, domainFramework);
      const { response: result, thought: solverThought, codeExecution: solverCode } = await executeStep(
        "Reflex-Solver",
        (cfg) => dispatchModelCall("Reflex-Solver", cfg, reflexPrompt, { requiresGrounding }),
        solverCfg
      );
      const answer = result.text || "No response generated.";
      addStep("Finalizer", "Finalizing response output.", prompt, answer, undefined, solverCfg.model, solverThought, solverCode);
      await saveMemory({ prompt, strategy, mode, finalAnswer: answer, timestamp: Date.now() });
      return { mode, strategy, primaryModality, domainParadigm, domainFramework, steps, finalAnswer: answer, confidence: 1.0, verdict: "STABLE" };
    }

    // Specialized Mode: Constraints-of-Thought (Const-o-T) with Self-Elicitation
    if (mode === ReasoningMode.CONST_O_T || strategy === "CONST_O_T") {
      // Phase 1: Initial Reasoning Generation
      const initCfg = getStepConfig("InitialReasoning", ReasoningMode.CONST_O_T);
      addStep("Initial Reasoning", `Generating Phase 1 Chain-of-Thought reasoning (Heat: ${initCfg.temperature})...`, undefined, undefined, initCfg.temperature, initCfg.model);
      const rawInitPrompt = Prompts.CONST_OT_INITIAL_PROMPT(prompt);
      const initPrompt = buildDomainAugmentedPrompt("Skeleton", rawInitPrompt, domainParadigm, primaryModality, domainFramework);
      const { response: initResult, thought: initThought, codeExecution: initCode } = await executeStep(
        "InitialReasoning",
        (cfg) => dispatchModelCall("InitialReasoning", cfg, initPrompt),
        initCfg
      );
      const initialReasoningText = initResult.text || "";
      addStep("Initial Reasoning", initialReasoningText, initPrompt, initialReasoningText, initCfg.temperature, initCfg.model, initThought, initCode);

      // Phase 2: Self-Elicitation Dialogue
      const elicitCfg = getStepConfig("SelfElicitation", ReasoningMode.CONST_O_T);
      addStep("Self-Elicitation", `Executing Self-Elicitation Protocols (Mirroring, Erroneous Testing, Self-Reference, Protocol A) on initial thinking (Heat: ${elicitCfg.temperature})...`, undefined, undefined, elicitCfg.temperature, elicitCfg.model);
      const elicitPrompt = Prompts.CONST_OT_ELICITATION_PROMPT(prompt, initialReasoningText);
      const { response: elicitResult, thought: elicitThought, codeExecution: elicitCode } = await executeStep(
        "SelfElicitation",
        (cfg) => dispatchModelCall("SelfElicitation", cfg, elicitPrompt),
        elicitCfg
      );
      const elicitationText = elicitResult.text || "";
      addStep("Self-Elicitation Dialogue", elicitationText, elicitPrompt, elicitationText, elicitCfg.temperature, elicitCfg.model, elicitThought, elicitCode);

      // Phase 3 & 4: Constraint Extraction & Formalization
      const formalizerCfg = getStepConfig("ConstraintFormalizer", ReasoningMode.CONST_O_T);
      addStep("Constraint Formalizer", `Formalizing extracted implicit constraints into <intent, constraint> pairs (Heat: ${formalizerCfg.temperature})...`, undefined, undefined, formalizerCfg.temperature, formalizerCfg.model);
      const constraintFormalizerPrompt = Prompts.CONST_OT_FORMALIZER_PROMPT(prompt, elicitationText);
      const { response: constraintFormalizerResult, thought: constraintFormalizerThought, codeExecution: constraintFormalizerCode } = await executeStep(
        "ConstraintFormalizer",
        (cfg) => dispatchModelCall("ConstraintFormalizer", cfg, constraintFormalizerPrompt, { zodSchema: ConstOTFormalizerSchema }),
        formalizerCfg
      );
      const formalizedConstraintsText = constraintFormalizerResult.text || "";
      const parsedFormalizer = parseAndValidateZod<ConstOTFormalizerOutput>(formalizedConstraintsText, ConstOTFormalizerSchema);
      
      if (parsedFormalizer.data) {
        const pairsCount = parsedFormalizer.data.constraint_pairs?.length || 0;
        const implicitCount = parsedFormalizer.data.implicit_constraints?.length || 0;
        addStep("Constraint Formalization", `[Zod Verified Schema: ${parsedFormalizer.isSchemaValid ? 'OK' : 'Parsed'}] Formalized ${pairsCount} <intent, constraint> pairs with ${implicitCount} implicit constraints.\n\n${formalizedConstraintsText}`, constraintFormalizerPrompt, formalizedConstraintsText, formalizerCfg.temperature, formalizerCfg.model, constraintFormalizerThought, constraintFormalizerCode);
      } else {
        addStep("Constraint Formalization", formalizedConstraintsText, constraintFormalizerPrompt, formalizedConstraintsText, formalizerCfg.temperature, formalizerCfg.model, constraintFormalizerThought, constraintFormalizerCode);
      }

      // Phase 5: Constraint-Integrated Solver
      const integratedSolverCfg = getStepConfig("ConstraintIntegratedSolver", ReasoningMode.CONST_O_T);
      addStep("Integrated Solver", `Re-running reasoning with explicit constraint integration (Heat: ${integratedSolverCfg.temperature})${requiresGrounding ? " with Google Search grounding" : ""}...`, undefined, undefined, integratedSolverCfg.temperature, integratedSolverCfg.model);
      const rawIntegratedSolverPrompt = Prompts.CONST_OT_SOLVER_PROMPT(prompt, initialReasoningText, formalizedConstraintsText);
      const integratedSolverPrompt = buildDomainAugmentedPrompt("Solver", rawIntegratedSolverPrompt, domainParadigm, primaryModality, domainFramework);
      const { response: integratedSolverResult, thought: integratedSolverThought, codeExecution: integratedSolverCode } = await executeStep(
        "ConstraintIntegratedSolver",
        (cfg) => dispatchModelCall("ConstraintIntegratedSolver", cfg, integratedSolverPrompt, { requiresGrounding }),
        integratedSolverCfg
      );
      let solverText = integratedSolverResult.text || "";
      addStep("Constraint-Integrated Solver", solverText, integratedSolverPrompt, solverText, integratedSolverCfg.temperature, integratedSolverCfg.model, integratedSolverThought, integratedSolverCode);

      // Formalizer (Ontology / CEL Logic Expressions)
      addStep("Formalizer", "Formalizing reasoning into Ontology + CEL expressions...");
      const formalLogic = await formalizeReasoning(prompt, solverText, integratedSolverCfg.model);
      if (formalLogic) {
        addStep("Formalizer", `Ontology: ${formalLogic.ontology.title}. Expressions count: ${formalLogic.expressions.length}`);
      }

      // Phase 6: Constraint Validation Layer
      const validatorCfg = getStepConfig("ConstraintValidator", ReasoningMode.CONST_O_T);
      addStep("Constraint Validator", `Auditing solution against formalized constraints for convergence (Heat: ${validatorCfg.temperature})...`, undefined, undefined, validatorCfg.temperature, validatorCfg.model);
      const rawValidatorPrompt = Prompts.CONST_OT_VALIDATOR_PROMPT(prompt, solverText, formalizedConstraintsText);
      const validatorPrompt = buildDomainAugmentedPrompt("Verifier", rawValidatorPrompt, domainParadigm, primaryModality, domainFramework);
      const { response: validatorResult, thought: validatorThought, codeExecution: validatorCode } = await executeStep(
        "ConstraintValidator",
        (cfg) => dispatchModelCall("ConstraintValidator", cfg, validatorPrompt),
        validatorCfg
      );
      const validatorText = validatorResult.text || "";
      addStep("Constraint Validation", validatorText, validatorPrompt, validatorText, validatorCfg.temperature, validatorCfg.model, validatorThought, validatorCode);

      // Stage 5: Finalizer
      const finalizerCfg = getStepConfig("Finalizer");
      addStep("Finalizer", `Synthesizing final verified Const-o-T response (Heat: ${finalizerCfg.temperature})...`, undefined, undefined, finalizerCfg.temperature, finalizerCfg.model);
      const rawFinalizerPrompt = Prompts.FINALIZER_PROMPT(prompt, solverText + "\n\n=== CONSTRAINT VALIDATION REPORT ===\n" + validatorText);
      const finalizerPrompt = buildDomainAugmentedPrompt("Finalizer", rawFinalizerPrompt, domainParadigm, primaryModality, domainFramework);
      const { response: finalizerResult, thought: finalizerThought, codeExecution: finalizerCode } = await executeStep(
        "Finalizer",
        (cfg) => dispatchModelCall("Finalizer", cfg, finalizerPrompt),
        finalizerCfg
      );
      const finalAnswer = finalizerResult.text || "";
      addStep("Finalizer", "Const-o-T Self-Elicitation tracing complete.", finalizerPrompt, finalAnswer, finalizerCfg.temperature, finalizerCfg.model, finalizerThought, finalizerCode);

      await saveMemory({ prompt, strategy: strategy || "CONST_O_T", mode: ReasoningMode.CONST_O_T, finalAnswer, timestamp: Date.now() });
      return { 
        mode: ReasoningMode.CONST_O_T, 
        strategy: strategy || "CONST_O_T", 
        primaryModality, 
        domainParadigm, 
        domainFramework, 
        steps, 
        finalAnswer, 
        confidence: 0.98, 
        verdict: "STABLE", 
        formalLogic: formalLogic || undefined 
      };
    }

    // Specialized Mode: Self-Rewarding Engine Loop
    if (mode === ReasoningMode.SELF_REWARDING || strategy === "SELF_REWARDING") {
      // Stage 1: Select Reasoning Types
      const selectCfg = getStepConfig("SelfRewardingSelect", ReasoningMode.SELF_REWARDING);
      addStep("Self-Rewarding Selection", `Selecting taxonomy paradigms for multi-aspect reasoning (Heat: ${selectCfg.temperature})...`, undefined, undefined, selectCfg.temperature, selectCfg.model);
      const selectPrompt = Prompts.SELF_REWARDING_SELECT_TYPES_PROMPT(prompt);
      const { response: selectResult, thought: selectThought, codeExecution: selectCode } = await executeStep(
        "SelfRewardingSelect",
        (cfg) => dispatchModelCall("SelfRewardingSelect", cfg, selectPrompt),
        selectCfg
      );
      const selectText = selectResult.text || "";
      addStep("Paradigm Selection", selectText, selectPrompt, selectText, selectCfg.temperature, selectCfg.model, selectThought, selectCode);

      // Stage 2: Initial Chain-of-Thought
      const cotCfg = getStepConfig("SelfRewardingCOT", ReasoningMode.SELF_REWARDING);
      addStep("Chain-of-Thought", `Generating initial multi-paradigm reasoning trace (Heat: ${cotCfg.temperature})...`, undefined, undefined, cotCfg.temperature, cotCfg.model);
      const rawCotPrompt = Prompts.SELF_REWARDING_COT_PROMPT(prompt, ["DEDUCTIVE", "SYSTEMS_THINKING", "FIRST_PRINCIPLES"]);
      const cotPrompt = buildDomainAugmentedPrompt("Solver", rawCotPrompt, domainParadigm, primaryModality, domainFramework);
      const { response: cotResult, thought: cotThought, codeExecution: cotCode } = await executeStep(
        "SelfRewardingCOT",
        (cfg) => dispatchModelCall("SelfRewardingCOT", cfg, cotPrompt, { requiresGrounding }),
        cotCfg
      );
      const initialCot = cotResult.text || "";
      addStep("Initial Reasoning Trace", initialCot, cotPrompt, initialCot, cotCfg.temperature, cotCfg.model, cotThought, cotCode);

      // Stage 3: Self-Evaluation & Cognitive Bias / Fallacy Audit
      const evalCfg = getStepConfig("SelfRewardingEval", ReasoningMode.SELF_REWARDING);
      addStep("Self-Evaluation Audit", `Auditing reasoning against cognitive biases & logical fallacies catalog (Heat: ${evalCfg.temperature})...`, undefined, undefined, evalCfg.temperature, evalCfg.model);
      const evalPrompt = Prompts.SELF_REWARDING_EVALUATION_PROMPT(prompt, initialCot);
      const { response: evalResult, thought: evalThought, codeExecution: evalCode } = await executeStep(
        "SelfRewardingEval",
        (cfg) => dispatchModelCall("SelfRewardingEval", cfg, evalPrompt),
        evalCfg
      );
      const evalText = evalResult.text || "";

      // Run automated bias & fallacy detector
      globalFlawsAudit = await auditReasoningFlaws(prompt, initialCot, evalCfg.model);
      addStep(
        "Bias & Fallacy Audit",
        `[Flaw Audit Score: ${(globalFlawsAudit.score * 100).toFixed(0)}%] Identified ${globalFlawsAudit.detectedBiasesCount} cognitive bias(es) and ${globalFlawsAudit.detectedFallaciesCount} fallacy(ies).\n\nMitigation Summary: ${globalFlawsAudit.mitigationSummary}\n\nSelf-Evaluation Output:\n${evalText}`,
        evalPrompt,
        evalText,
        evalCfg.temperature,
        evalCfg.model,
        evalThought,
        evalCode,
        globalFlawsAudit.flaws
      );

      // Formalizer
      addStep("Formalizer", "Formalizing reasoning into Ontology + CEL expressions...");
      const formalLogic = await formalizeReasoning(prompt, initialCot, evalCfg.model);

      // Stage 4 & 5: Refinement & Final Output
      const refineCfg = getStepConfig("SelfRewardingRefine", ReasoningMode.SELF_REWARDING);
      addStep("Refinement & Synthesis", `Correcting flaws and synthesizing final verified output (Heat: ${refineCfg.temperature})...`, undefined, undefined, refineCfg.temperature, refineCfg.model);
      const rawRefinePrompt = Prompts.SELF_REWARDING_REFINEMENT_PROMPT(prompt, initialCot, evalText + "\n\n=== FLAW AUDIT MITIGATIONS ===\n" + globalFlawsAudit.mitigationSummary);
      const refinePrompt = buildDomainAugmentedPrompt("Finalizer", rawRefinePrompt, domainParadigm, primaryModality, domainFramework);
      const { response: refineResult, thought: refineThought, codeExecution: refineCode } = await executeStep(
        "SelfRewardingRefine",
        (cfg) => dispatchModelCall("SelfRewardingRefine", cfg, refinePrompt),
        refineCfg
      );
      const finalAnswer = refineResult.text || "";
      addStep("Final Output", finalAnswer, refinePrompt, finalAnswer, refineCfg.temperature, refineCfg.model, refineThought, refineCode);

      await saveMemory({ prompt, strategy: strategy || "SELF_REWARDING", mode: ReasoningMode.SELF_REWARDING, finalAnswer, timestamp: Date.now() });
      return {
        mode: ReasoningMode.SELF_REWARDING,
        strategy: strategy || "SELF_REWARDING",
        primaryModality,
        domainParadigm,
        domainFramework,
        steps,
        finalAnswer,
        confidence: Math.max(0.80, globalFlawsAudit.score),
        verdict: globalFlawsAudit.score >= 0.7 ? "STABLE" : "UNCERTAIN",
        formalLogic: formalLogic || undefined,
        flawsAudit: globalFlawsAudit
      };
    }

    // Stage 2: Skeleton (Analytic/Reflective)
    const skeletonCfg = getStepConfig("Skeleton", mode);
    addStep("Skeleton", `Decomposing task into logical primitives (Heat: ${skeletonCfg.temperature}) using ${strategy} strategy...`, undefined, undefined, skeletonCfg.temperature, skeletonCfg.model);
    const rawSkeletonPrompt = Prompts.SKELETON_PROMPT(prompt, strategy);
    const skeletonPrompt = buildDomainAugmentedPrompt("Skeleton", rawSkeletonPrompt, domainParadigm, primaryModality, domainFramework);
    const { response: skeletonResult, thought: skeletonThought, codeExecution: skeletonCode } = await executeStep(
      "Skeleton",
      (cfg) => dispatchModelCall("Skeleton", cfg, skeletonPrompt),
      skeletonCfg
    );
    const skeletonText = skeletonResult.text || "";
    addStep("Skeleton", skeletonText, skeletonPrompt, skeletonText, skeletonCfg.temperature, skeletonCfg.model, skeletonThought, skeletonCode);

    // Stage 2.5: Feature Mapper
    const mapperCfg = getStepConfig("Mapper");
    addStep("Feature Mapper", `Mapping plan to required technical modules (Heat: ${mapperCfg.temperature})...`, undefined, undefined, mapperCfg.temperature, mapperCfg.model);
    const mapperPrompt = Prompts.MAPPER_PROMPT(prompt, skeletonText);
    const { response: mapperResult, thought: mapperThought, codeExecution: mapperCode } = await executeStep(
      "Mapper",
      (cfg) => dispatchModelCall("Mapper", cfg, mapperPrompt),
      mapperCfg
    );
    const mapperText = mapperResult.text || "";
    addStep("Feature Mapper", mapperText, mapperPrompt, mapperText, mapperCfg.temperature, mapperCfg.model, mapperThought, mapperCode);

    // Stage 3: Solver
    const solverCfg = getStepConfig("Solver", mode);
    addStep("Solver", `Engaging core logic execution unit [${strategy}] (Heat: ${solverCfg.temperature})${requiresGrounding ? " with Google Search grounding" : ""}...`, undefined, undefined, solverCfg.temperature, solverCfg.model);
    const rawSolverPrompt = Prompts.SOLVER_PROMPT(prompt, skeletonText, strategy);
    const solverPrompt = buildDomainAugmentedPrompt("Solver", rawSolverPrompt, domainParadigm, primaryModality, domainFramework);
    const { response: solverResult, thought: solverThought, codeExecution: solverCode } = await executeStep(
      "Solver",
      (cfg) => dispatchModelCall("Solver", cfg, solverPrompt, { requiresGrounding }),
      solverCfg
    );
    let solverText = solverResult.text || "";
    addStep("Solver", solverText, solverPrompt, solverText, solverCfg.temperature, solverCfg.model, solverThought, solverCode);

    // Stage 3.5: Formalizer
    addStep("Formalizer", "Formalizing reasoning into Ontology + CEL expressions...");
    const formalLogic = await formalizeReasoning(prompt, solverText, solverCfg.model);
    if (formalLogic) {
      addStep("Formalizer", `Ontology: ${formalLogic.ontology.title}. Expressions count: ${formalLogic.expressions.length}`);
    }
 
    // Stage 4: Verification Layer
    let verifierText = "";
    if (mode === ReasoningMode.ANALYTIC || mode === ReasoningMode.REFLECTIVE) {
      const verifierCfg = getStepConfig("Verifier");
      addStep("Verifier", `Entering Verification Layer (Heat: ${verifierCfg.temperature})${requiresGrounding ? " with Grounded Audit" : ""}...`, undefined, undefined, verifierCfg.temperature, verifierCfg.model);
      
      const rawVerifierPrompt = Prompts.VERIFIER_PROMPT(prompt, solverText, strategy);
      const verifierPrompt = buildDomainAugmentedPrompt("Verifier", rawVerifierPrompt, domainParadigm, primaryModality, domainFramework);
      const { response: verifierResult, thought: verifierThought, codeExecution: verifierCode } = await executeStep(
        "Verifier",
        (cfg) => dispatchModelCall("Verifier", cfg, verifierPrompt, { requiresGrounding, zodSchema: VerifierSchema }),
        verifierCfg
      );
      verifierText = verifierResult.text || "";

      const parsedVerifier = parseAndValidateZod<VerifierOutput>(verifierText, VerifierSchema);
      if (parsedVerifier.data) {
        if (parsedVerifier.data.verdict) verdict = parsedVerifier.data.verdict;
        if (parsedVerifier.data.confidence_score !== undefined) confidence = parsedVerifier.data.confidence_score;
        addStep("Verifier", `[Zod Verified Schema: ${parsedVerifier.isSchemaValid ? 'OK' : 'Parsed'}] Verdict: ${verdict} | Confidence: ${(confidence * 100).toFixed(0)}%\nFlaws: ${parsedVerifier.data.detected_flaws?.join(', ') || 'None'}\n\n${verifierText}`, verifierPrompt, verifierText, verifierCfg.temperature, verifierCfg.model, verifierThought, verifierCode);
      } else {
        addStep("Verifier", verifierText, verifierPrompt, verifierText, verifierCfg.temperature, verifierCfg.model, verifierThought, verifierCode);
      }

      // Check for necessary repair
      if (verdict === "REJECTED" || verifierText.toLowerCase().includes("contradiction") || verifierText.toLowerCase().includes("logical gap")) {
        confidence -= 0.25;
        verdict = "UNCERTAIN";
        addStep("Repair", "Logical gap detected. Initiating immediate correction loop...");
        const repairPrompt = `The previous solution had a logical gap: ${verifierText}. Please correct the solver output for: ${prompt}`;
        const { response: repairResult } = await executeStep(
          "Repair",
          (cfg) => dispatchModelCall("Repair", cfg, repairPrompt),
          getStepConfig("Solver", mode)
        );
        solverText = repairResult.text || solverText; 
        addStep("Repair", `Correction applied: ${solverText.substring(0, 100)}...`);
      }
 
      // Recursive Re-evaluation (Reflective Only)
      if (mode === ReasoningMode.REFLECTIVE) {
        const evolutionCfg = getStepConfig("Reflective", mode);
        addStep("Evolution", `Applying Prompt Evolution (Heat: ${evolutionCfg.temperature})${requiresGrounding ? " with Grounded Synthesis" : ""}...`, undefined, undefined, evolutionCfg.temperature, evolutionCfg.model);
        const evolutionPrompt = Prompts.EVOLUTION_PROMPT(prompt, solverText, verifierText, memoryContext);
        const { response: evolutionResult, thought: evolutionThought, codeExecution: evolutionCode } = await executeStep(
          "Evolution",
          (cfg) => dispatchModelCall("Evolution", cfg, evolutionPrompt, { requiresGrounding }),
          evolutionCfg
        );
        const finalEvolvedAnswer = evolutionResult.text || "";
        addStep("Finalizer", "Finalizing evolved reflective response.", evolutionPrompt, finalEvolvedAnswer, evolutionCfg.temperature, evolutionCfg.model, evolutionThought, evolutionCode);
        await saveMemory({ prompt, strategy, mode, finalAnswer: finalEvolvedAnswer, timestamp: Date.now() });
        return { 
          mode, 
          strategy, 
          primaryModality, 
          domainParadigm, 
          domainFramework, 
          steps, 
          finalAnswer: finalEvolvedAnswer, 
          confidence: 0.95, 
          verdict: "STABLE", 
          formalLogic: formalLogic || undefined 
        };
      }
    }

    // Stage 4.5: Self-Correction (Critic) & Flaw Audit
    const criticCfg = getStepConfig("Critic");
    addStep("Critic", `Feeding trace back for self-correction (Heat: ${criticCfg.temperature})...`, undefined, undefined, criticCfg.temperature, criticCfg.model);
    const traceString = steps.map(s => `[${s.stage}]: ${s.content}`).join("\n\n");
    const rawCriticPrompt = Prompts.CRITIC_PROMPT(prompt, traceString);
    const criticPrompt = buildDomainAugmentedPrompt("Critic", rawCriticPrompt, domainParadigm, primaryModality, domainFramework);
    const { response: criticResult, thought: criticThought, codeExecution: criticCode } = await executeStep(
      "Critic",
      (cfg) => dispatchModelCall("Critic", cfg, criticPrompt),
      criticCfg
    );
    const criticText = criticResult.text || "";
    if (criticText.toLowerCase().includes("bias") || criticText.toLowerCase().includes("error")) {
      confidence -= 0.1;
    }

    if (!globalFlawsAudit) {
      globalFlawsAudit = await auditReasoningFlaws(prompt, traceString, criticCfg.model);
    }

    addStep(
      "Critic", 
      `[Cognitive Audit Score: ${(globalFlawsAudit.score * 100).toFixed(0)}%] ${globalFlawsAudit.detectedBiasesCount} Biases / ${globalFlawsAudit.detectedFallaciesCount} Fallacies Detected.\n\n${criticText}`, 
      criticPrompt, 
      criticText, 
      criticCfg.temperature, 
      criticCfg.model, 
      criticThought, 
      criticCode,
      globalFlawsAudit.flaws
    );
 
    // Stage 5: Finalizer
    const finalizerCfg = getStepConfig("Finalizer");
    addStep("Finalizer", `Synthesizing output (Heat: ${finalizerCfg.temperature})...`, undefined, undefined, finalizerCfg.temperature, finalizerCfg.model);
    const rawFinalizerPrompt = Prompts.FINALIZER_PROMPT(prompt, criticText || solverText);
    const finalizerPrompt = buildDomainAugmentedPrompt("Finalizer", rawFinalizerPrompt, domainParadigm, primaryModality, domainFramework);
    const { response: finalizerResult, thought: finalizerThought, codeExecution: finalizerCode } = await executeStep(
      "Finalizer",
      (cfg) => dispatchModelCall("Finalizer", cfg, finalizerPrompt),
      finalizerCfg
    );
    const finalAnswer = finalizerResult.text || "";
    addStep("Finalizer", "Tracing complete.", finalizerPrompt, finalAnswer, finalizerCfg.temperature, finalizerCfg.model, finalizerThought, finalizerCode);
    
    if (confidence < 0.4) verdict = "REJECTED";

    // Run explicit assumption handling & validation audit
    let globalAssumptionsAudit: AssumptionAnalysisResult | undefined;
    try {
      globalAssumptionsAudit = await analyzeAssumptions(prompt, modelName);
      if (globalAssumptionsAudit && globalAssumptionsAudit.assumptions.length > 0) {
        addStep(
          "Assumption Handling & Validation",
          `Extracted ${globalAssumptionsAudit.assumptions.length} explicit/implicit assumptions across ${globalAssumptionsAudit.profiles.length} probabilistic operating profiles.\nPrimary Interpretation: ${globalAssumptionsAudit.primaryInterpretation}`,
          undefined,
          undefined,
          0.2,
          modelName
        );
      }
    } catch (err) {
      console.warn("Assumption analysis step skipped:", err);
    }

    // Calculate aggregate token consumption & cost for this execution trace
    let inTokens = 0;
    let outTokens = 0;
    for (const step of steps) {
      inTokens += step.inputTokens || Math.ceil((step.rawPrompt || '').length / 3.8);
      outTokens += step.outputTokens || Math.ceil((step.content || '').length / 3.8);
    }
    const totalTokens = inTokens + outTokens;
    const durationMs = Math.round(performance.now() - startTime);
    // Simple cost heuristic ($0.075 per 1M in, $0.30 per 1M out for flash)
    const estimatedCost = (inTokens * 0.000000075) + (outTokens * 0.0000003);

    await saveMemory({ 
      prompt, 
      strategy, 
      mode, 
      primaryModality,
      domainParadigm,
      domainFramework,
      finalAnswer, 
      stepsCount: steps.length,
      totalTokens,
      estimatedCost,
      durationMs,
      timestamp: Date.now(),
      steps
    });

    return { 
      mode, 
      strategy, 
      primaryModality, 
      domainParadigm, 
      domainFramework, 
      steps, 
      finalAnswer, 
      confidence: Math.max(0.1, confidence), 
      verdict, 
      formalLogic: formalLogic || undefined,
      flawsAudit: globalFlawsAudit,
      assumptionsAnalysis: globalAssumptionsAudit,
      totalTokens,
      estimatedCost,
      durationMs
    };

  } catch (error: any) {
    console.error("OpenReason Pipeline Error:", error);
    const formattedErr = formatLLMError(error, modelName);
    addStep("Error", `⚠️ [${formattedErr.title}] ${formattedErr.userMessage}\n\nActionable Step: ${formattedErr.actionableAdvice}`);
    
    return { 
      mode: ReasoningMode.REFLEX, 
      steps, 
      finalAnswer: `### ⚠️ ${formattedErr.title}\n\n${formattedErr.userMessage}\n\n**Recommended Action:**\n${formattedErr.actionableAdvice}\n\n*(Error Code: \`${formattedErr.errorCode}\`)*`,
      confidence: 0,
      verdict: "REJECTED"
    };
  }
}

