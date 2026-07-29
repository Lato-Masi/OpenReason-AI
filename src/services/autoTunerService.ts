import { ThinkingLevel } from "@google/genai";
import { ReasoningMode, DynamicConfig, ModuleConfig, DEFAULT_DYNAMIC_CONFIG, processReasoning } from "./reasoningEngine";

export interface AutoTunerOptions {
  testPrompt: string;
  mode: ReasoningMode;
  model: string;
  maxLoops: number; // e.g. 4 loops cap
  maxTokenCap: number; // e.g. 20000 tokens hard cap
  semanticSimilarityThreshold: number; // 0.5 to 0.95
  customModuleTarget?: string;
  dynamicConfig?: DynamicConfig;
}

export interface ParameterCandidate {
  loopIndex: number;
  loopType: 'BASELINE_A' | 'BASELINE_REPRODUCIBILITY' | 'SENSITIVITY_TEMP_LOW' | 'SENSITIVITY_TEMP_HIGH' | 'SENSITIVITY_THINKING_MIN' | 'NARROWING_OPTIMAL';
  description: string;
  configTested: ModuleConfig;
  tokensUsed: number;
  costIncurred: number;
  latencyMs: number;
  confidence: number;
  verdict: "STABLE" | "UNCERTAIN" | "REJECTED";
  semanticSimilarityToBaseline: number; // 0.0 - 1.0
  reproducibilityPassed?: boolean;
  score: number;
  finalAnswerPreview: string;
}

export interface BudgetEstimate {
  estimatedTokensPerRun: number;
  estimatedTotalTokens: number;
  estimatedTotalCost: number;
  recommendedMaxLoops: number;
  fitsInCap: boolean;
}

export interface AutoTunerResult {
  status: 'COMPLETED' | 'TOKEN_CAP_REACHED' | 'MAX_LOOPS_REACHED' | 'ABORTED' | 'FAILED';
  loopsCompleted: number;
  totalTokensSpent: number;
  totalCostSpent: number;
  estimatedBudget: BudgetEstimate;
  baselineReproducibility: {
    passed: boolean;
    similarityScore: number;
    verdictMatch: boolean;
  };
  initialConfig: ModuleConfig;
  optimalConfig: ModuleConfig;
  candidatesTested: ParameterCandidate[];
  summaryLog: string[];
}

/**
 * Fast deterministic semantic similarity calculator between two text outputs.
 * Combines Jaccard token set overlap with bi-gram sequence correlation.
 */
export function computeSemanticSimilarity(textA: string, textB: string): number {
  if (!textA || !textB) return 0;
  if (textA.trim() === textB.trim()) return 1.0;

  const tokenize = (str: string) => 
    str.toLowerCase()
       .replace(/[^a-z0-9\s]/g, ' ')
       .split(/\s+/)
       .filter(w => w.length > 2);

  const tokensA = tokenize(textA);
  const tokensB = tokenize(textB);

  if (tokensA.length === 0 || tokensB.length === 0) return 0;

  const setA = new Set(tokensA);
  const setB = new Set(tokensB);

  let intersection = 0;
  setA.forEach(token => {
    if (setB.has(token)) intersection++;
  });

  const union = new Set([...tokensA, ...tokensB]).size;
  const jaccard = union > 0 ? intersection / union : 0;

  // Bi-gram overlap for structural sequence similarity
  const getBigrams = (tokens: string[]) => {
    const bigrams = new Set<string>();
    for (let i = 0; i < tokens.length - 1; i++) {
      bigrams.add(`${tokens[i]}_${tokens[i + 1]}`);
    }
    return bigrams;
  };

  const bigramsA = getBigrams(tokensA);
  const bigramsB = getBigrams(tokensB);

  let bigramIntersection = 0;
  bigramsA.forEach(bg => {
    if (bigramsB.has(bg)) bigramIntersection++;
  });

  const bigramUnion = new Set([...bigramsA, ...bigramsB]).size;
  const bigramScore = bigramUnion > 0 ? bigramIntersection / bigramUnion : jaccard;

  return Math.min(1.0, Math.max(0.0, (jaccard * 0.6) + (bigramScore * 0.4)));
}

/**
 * Estimates the token budget before starting the auto-tuning loop.
 */
export function estimateAutoTuningBudget(
  prompt: string,
  mode: ReasoningMode,
  maxLoops: number,
  maxTokenCap: number
): BudgetEstimate {
  const promptTokens = Math.ceil((prompt || "").length / 3.8);
  
  // Overhead multipliers per mode
  let modeMultiplier = 1800;
  if (mode === ReasoningMode.REFLEX) modeMultiplier = 800;
  if (mode === ReasoningMode.ANALYTIC) modeMultiplier = 2400;
  if (mode === ReasoningMode.REFLECTIVE) modeMultiplier = 2800;
  if (mode === ReasoningMode.CONST_O_T) modeMultiplier = 2600;
  if (mode === ReasoningMode.SELF_REWARDING) modeMultiplier = 3200;

  const estimatedTokensPerRun = promptTokens + modeMultiplier;
  const estimatedTotalTokens = estimatedTokensPerRun * maxLoops;
  // Flash model cost estimate ($0.075 per 1M input, $0.30 per 1M output) -> average ~$0.20 per 1M tokens
  const estimatedTotalCost = (estimatedTotalTokens / 1_000_000) * 0.20;

  const recommendedMaxLoops = Math.max(1, Math.floor(maxTokenCap / estimatedTokensPerRun));
  const fitsInCap = estimatedTotalTokens <= maxTokenCap;

  return {
    estimatedTokensPerRun,
    estimatedTotalTokens,
    estimatedTotalCost,
    recommendedMaxLoops: Math.min(maxLoops, recommendedMaxLoops),
    fitsInCap
  };
}

/**
 * Executes the auto-tuning parameter optimization loop with strict token caps,
 * reproducibility verification, rule-based sensitivity analysis, and narrowing.
 */
export async function runAutoTuningLoop(
  options: AutoTunerOptions,
  onProgress?: (update: { 
    currentLoop: number; 
    totalLoops: number; 
    candidate?: ParameterCandidate; 
    log: string; 
    totalTokensSoFar: number 
  }) => void
): Promise<AutoTunerResult> {
  const {
    testPrompt,
    mode,
    model,
    maxLoops,
    maxTokenCap,
    semanticSimilarityThreshold,
    customModuleTarget,
    dynamicConfig = DEFAULT_DYNAMIC_CONFIG
  } = options;

  const summaryLog: string[] = [];
  const log = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const formatted = `[${timestamp}] ${msg}`;
    summaryLog.push(formatted);
    console.log(`[AutoTuner] ${formatted}`);
  };

  log(`Initializing Auto-Tuning Optimization Loop for Mode: [${mode}] using Model: [${model}]`);

  // Step 1: Budget estimation & cap calculation
  const budgetEstimate = estimateAutoTuningBudget(testPrompt, mode, maxLoops, maxTokenCap);
  log(`Budget Estimate: ~${budgetEstimate.estimatedTokensPerRun} tok/run. Total target budget for ${maxLoops} loops: ~${budgetEstimate.estimatedTotalTokens} tok ($${budgetEstimate.estimatedTotalCost.toFixed(5)}). Hard Token Cap: ${maxTokenCap} tok.`);

  // Dynamically clamp maxLoops if estimate strictly exceeds cap
  const effectiveMaxLoops = Math.min(maxLoops, budgetEstimate.recommendedMaxLoops || 1);
  if (effectiveMaxLoops < maxLoops) {
    log(`⚠️ Safety Warning: Capping max loops from ${maxLoops} to ${effectiveMaxLoops} to ensure token consumption stays strictly below cap (${maxTokenCap} tokens).`);
  }

  // Determine baseline default configuration
  const initialModeConfig = dynamicConfig.modeConfigs[mode] || {
    model,
    temperature: 0.7,
    thinkingLevel: ThinkingLevel.HIGH,
    codeExecution: true
  };

  const initialConfig: ModuleConfig = {
    model: model || initialModeConfig.model,
    temperature: initialModeConfig.temperature,
    thinkingLevel: initialModeConfig.thinkingLevel,
    codeExecution: initialModeConfig.codeExecution
  };

  const candidatesTested: ParameterCandidate[] = [];
  let totalTokensSpent = 0;
  let totalCostSpent = 0;
  let baselineAnswer = "";
  let baselineTokens = 0;

  let reproducibilityResult = {
    passed: false,
    similarityScore: 0,
    verdictMatch: false
  };

  let status: 'COMPLETED' | 'TOKEN_CAP_REACHED' | 'MAX_LOOPS_REACHED' | 'ABORTED' | 'FAILED' = 'COMPLETED';

  // Helper to construct custom DynamicConfig override
  const buildTestConfig = (testModuleCfg: ModuleConfig): DynamicConfig => {
    const clone: DynamicConfig = JSON.parse(JSON.stringify(dynamicConfig));
    clone.modeConfigs[mode] = { ...testModuleCfg };
    if (customModuleTarget && clone.moduleConfigs[customModuleTarget]) {
      clone.moduleConfigs[customModuleTarget] = { ...testModuleCfg };
    } else {
      // Apply to primary modules
      Object.keys(clone.moduleConfigs).forEach(key => {
        clone.moduleConfigs[key] = { ...clone.moduleConfigs[key], ...testModuleCfg };
      });
    }
    return clone;
  };

  // Define rule-based test parameter matrix
  const testPlan: {
    loopType: ParameterCandidate['loopType'];
    description: string;
    getConfig: (base: ModuleConfig, prevBest?: ModuleConfig) => ModuleConfig;
  }[] = [
    {
      loopType: 'BASELINE_A',
      description: 'Loop 1: Initial Best-Practice Practice Run (Defaults)',
      getConfig: (base) => ({ ...base })
    },
    {
      loopType: 'BASELINE_REPRODUCIBILITY',
      description: 'Loop 2: Initial Reproducibility Test (Re-run Defaults)',
      getConfig: (base) => ({ ...base })
    },
    {
      loopType: 'SENSITIVITY_TEMP_LOW',
      description: 'Loop 3: Sensitivity Rule - Lower Temperature (-0.25)',
      getConfig: (base) => ({ 
        ...base, 
        temperature: Math.max(0.1, Number((base.temperature - 0.25).toFixed(2))) 
      })
    },
    {
      loopType: 'SENSITIVITY_TEMP_HIGH',
      description: 'Loop 4: Sensitivity Rule - Higher Temperature (+0.20)',
      getConfig: (base) => ({ 
        ...base, 
        temperature: Math.min(1.0, Number((base.temperature + 0.20).toFixed(2))) 
      })
    },
    {
      loopType: 'SENSITIVITY_THINKING_MIN',
      description: 'Loop 5: Sensitivity Rule - Minimal Thinking Level (Token Saver)',
      getConfig: (base) => ({ 
        ...base, 
        thinkingLevel: ThinkingLevel.MINIMAL 
      })
    },
    {
      loopType: 'NARROWING_OPTIMAL',
      description: 'Loop 6: Narrowing - Refined Combination of Optimal Parameters',
      getConfig: (base, best) => {
        if (!best) return { ...base, temperature: 0.4 };
        return {
          ...best,
          temperature: Math.max(0.1, Number((best.temperature * 0.85).toFixed(2)))
        };
      }
    }
  ];

  let currentLoopIndex = 0;

  for (const stepPlan of testPlan) {
    if (currentLoopIndex >= effectiveMaxLoops) {
      log(`Loop limit reached (${effectiveMaxLoops} loops completed). Halting auto-tuning optimization.`);
      status = 'MAX_LOOPS_REACHED';
      break;
    }

    // Safety Token Check BEFORE dispatching call
    const estimatedNextRunTokens = budgetEstimate.estimatedTokensPerRun;
    if (totalTokensSpent + (estimatedNextRunTokens * 0.7) > maxTokenCap) {
      log(`⛔ Hard Token Cap Safeguard Triggered! Cumulative Tokens (${totalTokensSpent}) + estimated next run exceeds cap (${maxTokenCap}). Stopping loop safely.`);
      status = 'TOKEN_CAP_REACHED';
      break;
    }

    currentLoopIndex++;
    const prevBestCandidate = candidatesTested.length > 0 
      ? [...candidatesTested].sort((a, b) => b.score - a.score)[0]?.configTested
      : undefined;

    const candidateConfig = stepPlan.getConfig(initialConfig, prevBestCandidate);
    log(`Executing ${stepPlan.description} -> Temp: ${candidateConfig.temperature}, Thinking: ${candidateConfig.thinkingLevel}`);

    try {
      const testDynamicCfg = buildTestConfig(candidateConfig);
      const startTime = performance.now();
      
      const result = await processReasoning(testPrompt, undefined, {
        model: candidateConfig.model,
        temperature: candidateConfig.temperature,
        dynamicConfig: testDynamicCfg
      });

      const latencyMs = Math.round(performance.now() - startTime);
      const runTokens = result.totalTokens || 1000;
      const runCost = result.estimatedCost || 0.0002;

      totalTokensSpent += runTokens;
      totalCostSpent += runCost;

      // Compute semantic similarity to Baseline A
      let similarity = 1.0;
      let reproducibilityPassed = undefined;

      if (currentLoopIndex === 1) {
        baselineAnswer = result.finalAnswer;
        baselineTokens = runTokens;
      } else {
        similarity = computeSemanticSimilarity(baselineAnswer, result.finalAnswer);
        if (stepPlan.loopType === 'BASELINE_REPRODUCIBILITY') {
          const firstRun = candidatesTested[0];
          const verdictMatch = firstRun?.verdict === result.verdict;
          reproducibilityPassed = similarity >= semanticSimilarityThreshold && verdictMatch;
          reproducibilityResult = {
            passed: reproducibilityPassed,
            similarityScore: Number(similarity.toFixed(3)),
            verdictMatch
          };
          log(`Reproducibility Check: Similarity = ${(similarity * 100).toFixed(1)}%, Verdict Match = ${verdictMatch}. Result: ${reproducibilityPassed ? 'PASSED ✓' : 'UNCERTAIN ⚠️'}`);
        }
      }

      // Compute composite optimization score
      // Score = (0.45 * Confidence) + (0.35 * Similarity) + (0.20 * TokenEfficiency)
      const tokenEfficiency = Math.min(1.2, Math.max(0.2, (baselineTokens || runTokens) / runTokens));
      const compositeScore = Number(
        ((result.confidence * 0.45) + (similarity * 0.35) + (Math.min(1.0, tokenEfficiency) * 0.20)).toFixed(3)
      );

      const candidateRecord: ParameterCandidate = {
        loopIndex: currentLoopIndex,
        loopType: stepPlan.loopType,
        description: stepPlan.description,
        configTested: candidateConfig,
        tokensUsed: runTokens,
        costIncurred: runCost,
        latencyMs,
        confidence: result.confidence,
        verdict: result.verdict,
        semanticSimilarityToBaseline: Number(similarity.toFixed(3)),
        reproducibilityPassed,
        score: compositeScore,
        finalAnswerPreview: result.finalAnswer.slice(0, 180) + (result.finalAnswer.length > 180 ? '...' : '')
      };

      candidatesTested.push(candidateRecord);
      log(`Loop ${currentLoopIndex} Complete: Score = ${compositeScore}, Tokens = ${runTokens}, Similarity = ${(similarity * 100).toFixed(1)}%`);

      if (onProgress) {
        onProgress({
          currentLoop: currentLoopIndex,
          totalLoops: effectiveMaxLoops,
          candidate: candidateRecord,
          log: `Loop ${currentLoopIndex}/${effectiveMaxLoops} finished: Score ${compositeScore} (${runTokens} tok)`,
          totalTokensSoFar: totalTokensSpent
        });
      }

    } catch (err: any) {
      log(`❌ Error in loop ${currentLoopIndex} (${stepPlan.loopType}): ${err?.message || String(err)}`);
      if (candidatesTested.length === 0) {
        status = 'FAILED';
        break;
      }
    }
  }

  // Determine optimal candidate
  let optimalConfig = initialConfig;
  if (candidatesTested.length > 0) {
    // Filter candidates that meet or come closest to threshold
    const sorted = [...candidatesTested].sort((a, b) => b.score - a.score);
    const bestPassing = sorted.find(c => c.semanticSimilarityToBaseline >= semanticSimilarityThreshold) || sorted[0];
    if (bestPassing) {
      optimalConfig = bestPassing.configTested;
      log(`Optimization Complete! Best Config found in Loop ${bestPassing.loopIndex} (${bestPassing.description}): Temp = ${optimalConfig.temperature}, Thinking = ${optimalConfig.thinkingLevel}, Score = ${bestPassing.score}`);
    }
  }

  return {
    status,
    loopsCompleted: candidatesTested.length,
    totalTokensSpent,
    totalCostSpent,
    estimatedBudget: budgetEstimate,
    baselineReproducibility: reproducibilityResult,
    initialConfig,
    optimalConfig,
    candidatesTested,
    summaryLog
  };
}
