export interface ModelPriceRate {
  inputPerMillionUSD: number;
  outputPerMillionUSD: number;
}

export const MODEL_PRICE_MAP: Record<string, ModelPriceRate> = {
  'gemini-3.6-flash': { inputPerMillionUSD: 0.075, outputPerMillionUSD: 0.30 },
  'gemini-1.5-pro': { inputPerMillionUSD: 1.25, outputPerMillionUSD: 5.00 },
  'gemini-2.0-flash-exp': { inputPerMillionUSD: 0.075, outputPerMillionUSD: 0.30 },
  'deepseek/deepseek-r1': { inputPerMillionUSD: 0.55, outputPerMillionUSD: 2.19 },
  'deepseek/deepseek-chat': { inputPerMillionUSD: 0.14, outputPerMillionUSD: 0.28 },
  'anthropic/claude-3.7-sonnet': { inputPerMillionUSD: 3.00, outputPerMillionUSD: 15.00 },
  'anthropic/claude-3.5-haiku': { inputPerMillionUSD: 0.80, outputPerMillionUSD: 4.00 },
  'openai/gpt-4o': { inputPerMillionUSD: 2.50, outputPerMillionUSD: 10.00 },
  'openai/gpt-4o-mini': { inputPerMillionUSD: 0.15, outputPerMillionUSD: 0.60 },
  'openai/o3-mini': { inputPerMillionUSD: 1.10, outputPerMillionUSD: 4.40 },
  'meta-llama/llama-3.3-70b-instruct': { inputPerMillionUSD: 0.12, outputPerMillionUSD: 0.30 },
  'qwen/qwen-2.5-72b-instruct': { inputPerMillionUSD: 0.35, outputPerMillionUSD: 0.40 },
  'mistralai/mistral-large-2411': { inputPerMillionUSD: 2.00, outputPerMillionUSD: 6.00 }
};

export function getModelPriceRate(modelName: string): ModelPriceRate {
  if (!modelName) return { inputPerMillionUSD: 0.075, outputPerMillionUSD: 0.30 };
  const cleanName = modelName.replace("openrouter/", "");
  if (MODEL_PRICE_MAP[cleanName]) {
    return MODEL_PRICE_MAP[cleanName];
  }
  if (cleanName.includes("flash")) return { inputPerMillionUSD: 0.075, outputPerMillionUSD: 0.30 };
  if (cleanName.includes("pro")) return { inputPerMillionUSD: 1.25, outputPerMillionUSD: 5.00 };
  if (cleanName.includes("claude-3.7") || cleanName.includes("claude-3-5-sonnet")) return { inputPerMillionUSD: 3.00, outputPerMillionUSD: 15.00 };
  if (cleanName.includes("gpt-4o")) return { inputPerMillionUSD: 2.50, outputPerMillionUSD: 10.00 };
  
  return { inputPerMillionUSD: 0.25, outputPerMillionUSD: 1.00 };
}

export interface EstimatedCostResult {
  modelName: string;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  estimatedInputCostUSD: number;
  estimatedOutputCostUSD: number;
  totalCostUSD: number;
  formattedCost: string;
}

export function estimateBenchmarkCosts(
  modelName: string,
  benchmarks: Array<{ estimatedInputTokens: number; estimatedOutputTokens: number }>
): EstimatedCostResult {
  const rates = getModelPriceRate(modelName);
  
  const totalInputTokens = benchmarks.reduce((acc, item) => acc + (item.estimatedInputTokens || 400), 0);
  const totalOutputTokens = benchmarks.reduce((acc, item) => acc + (item.estimatedOutputTokens || 1200), 0);
  const totalTokens = totalInputTokens + totalOutputTokens;

  const estimatedInputCostUSD = (totalInputTokens / 1_000_000) * rates.inputPerMillionUSD;
  const estimatedOutputCostUSD = (totalOutputTokens / 1_000_000) * rates.outputPerMillionUSD;
  const totalCostUSD = estimatedInputCostUSD + estimatedOutputCostUSD;

  let formattedCost = `$${totalCostUSD.toFixed(5)}`;
  if (totalCostUSD < 0.0001) {
    formattedCost = '< $0.0001';
  } else if (totalCostUSD < 0.01) {
    formattedCost = `$${totalCostUSD.toFixed(4)}`;
  } else {
    formattedCost = `$${totalCostUSD.toFixed(3)}`;
  }

  return {
    modelName,
    totalInputTokens,
    totalOutputTokens,
    totalTokens,
    estimatedInputCostUSD,
    estimatedOutputCostUSD,
    totalCostUSD,
    formattedCost
  };
}

export function calculateActualCost(
  modelName: string,
  inputTokens: number,
  outputTokens: number
): { inputCost: number; outputCost: number; totalCost: number; formattedCost: string } {
  const rates = getModelPriceRate(modelName);
  const inputCost = (inputTokens / 1_000_000) * rates.inputPerMillionUSD;
  const outputCost = (outputTokens / 1_000_000) * rates.outputPerMillionUSD;
  const totalCost = inputCost + outputCost;

  let formattedCost = `$${totalCost.toFixed(5)}`;
  if (totalCost < 0.0001) {
    formattedCost = '< $0.0001';
  } else if (totalCost < 0.01) {
    formattedCost = `$${totalCost.toFixed(4)}`;
  } else {
    formattedCost = `$${totalCost.toFixed(3)}`;
  }

  return { inputCost, outputCost, totalCost, formattedCost };
}
