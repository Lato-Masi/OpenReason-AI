/**
 * Comprehensive LLM Error Adapter & Normalizer
 * Traps, normalizes, and translates technical errors from Google Gemini SDK,
 * OpenRouter.ai API, and generic HTTP endpoints into clear, user-understood messages
 * with actionable recovery suggestions.
 */

export interface FormattedLLMError {
  title: string;
  userMessage: string;
  actionableAdvice: string;
  errorCode: string;
  isApiKeyError: boolean;
  isRateLimitError: boolean;
  isQuotaError: boolean;
  isSafetyError: boolean;
  isNetworkError: boolean;
  rawMessage: string;
}

export function formatLLMError(rawError: any, modelName: string = "gemini-3.6-flash"): FormattedLLMError {
  const rawMsg = typeof rawError === "string" 
    ? rawError 
    : rawError?.message || rawError?.error?.message || JSON.stringify(rawError || "");

  const str = rawMsg.toLowerCase();

  // 1. API Key / Authorization Failure (401, PERMISSION_DENIED, API_KEY_INVALID)
  if (
    str.includes("api_key_invalid") || 
    str.includes("api key is missing") || 
    str.includes("invalid_api_key") ||
    str.includes("unauthorized") ||
    str.includes("401") ||
    (str.includes("permission_denied") && str.includes("key"))
  ) {
    return {
      title: "API Key Authorization Failed",
      userMessage: `The API key configured for model '${modelName}' is missing, invalid, or expired.`,
      actionableAdvice: "Click 'API Keys' in the header to enter a valid Gemini or OpenRouter key, or switch to the default server key.",
      errorCode: "AUTH_KEY_INVALID",
      isApiKeyError: true,
      isRateLimitError: false,
      isQuotaError: false,
      isSafetyError: false,
      isNetworkError: false,
      rawMessage: rawMsg
    };
  }

  // 2. Rate Limit & Quota Exceeded (429, RESOURCE_EXHAUSTED)
  if (
    str.includes("resource_exhausted") || 
    str.includes("429") || 
    str.includes("rate limit") || 
    str.includes("quota exceeded") ||
    str.includes("too many requests")
  ) {
    return {
      title: "API Quota / Rate Limit Exceeded",
      userMessage: `You have hit the request frequency or daily token quota limit for '${modelName}'.`,
      actionableAdvice: "Wait 15-30 seconds before retrying, or switch to 'gemini-3.6-flash' or an alternative OpenRouter model in Settings.",
      errorCode: "RATE_LIMIT_EXCEEDED",
      isApiKeyError: false,
      isRateLimitError: true,
      isQuotaError: true,
      isSafetyError: false,
      isNetworkError: false,
      rawMessage: rawMsg
    };
  }

  // 3. Safety & Content Moderation Filters (SAFETY, HARM_CATEGORY, RECITATION)
  if (
    str.includes("safety") || 
    str.includes("harm_category") || 
    str.includes("blocked") || 
    str.includes("recitation") ||
    str.includes("candidate was blocked")
  ) {
    return {
      title: "Content Safety Filter Triggered",
      userMessage: "The AI model safety filter flagged the prompt or generated output.",
      actionableAdvice: "Try rephrasing your prompt to focus purely on analytical or technical framing, or reduce model temperature.",
      errorCode: "SAFETY_FILTER_BLOCKED",
      isApiKeyError: false,
      isRateLimitError: false,
      isQuotaError: false,
      isSafetyError: true,
      isNetworkError: false,
      rawMessage: rawMsg
    };
  }

  // 4. Model Not Found or Restricted (404, NOT_FOUND)
  if (
    str.includes("404") || 
    str.includes("not found") || 
    str.includes("model not available") ||
    str.includes("deprecated")
  ) {
    return {
      title: "Requested Model Unavailable",
      userMessage: `Model '${modelName}' was not found or is restricted in your current region/account.`,
      actionableAdvice: "The system will automatically attempt a fallback to 'gemini-3.6-flash'. You can also re-select an active model in settings.",
      errorCode: "MODEL_NOT_FOUND",
      isApiKeyError: false,
      isRateLimitError: false,
      isQuotaError: false,
      isSafetyError: false,
      isNetworkError: false,
      rawMessage: rawMsg
    };
  }

  // 5. Context Window / Token Exceeded (INVALID_ARGUMENT, CONTEXT_LENGTH)
  if (
    str.includes("context length") || 
    str.includes("maximum context") || 
    str.includes("too long") || 
    str.includes("token limit")
  ) {
    return {
      title: "Context Length Exceeded",
      userMessage: "The total length of the prompt and pipeline history exceeds the model's context window limit.",
      actionableAdvice: "Shorten your input prompt or select a model with a larger context window (such as Claude 3.7 Sonnet or Gemini Pro).",
      errorCode: "CONTEXT_WINDOW_EXCEEDED",
      isApiKeyError: false,
      isRateLimitError: false,
      isQuotaError: false,
      isSafetyError: false,
      isNetworkError: false,
      rawMessage: rawMsg
    };
  }

  // 6. Network & Connectivity Issues (fetch failed, ECONNRESET, timeout)
  if (
    str.includes("fetch failed") || 
    str.includes("networkerror") || 
    str.includes("econnreset") || 
    str.includes("timeout") ||
    str.includes("failed to fetch")
  ) {
    return {
      title: "Network Connection Issue",
      userMessage: "Unable to reach the AI model provider endpoint due to a network glitch or timeout.",
      actionableAdvice: "Check your internet connection and try running the pipeline again.",
      errorCode: "NETWORK_TIMEOUT",
      isApiKeyError: false,
      isRateLimitError: false,
      isQuotaError: false,
      isSafetyError: false,
      isNetworkError: true,
      rawMessage: rawMsg
    };
  }

  // Generic Fallback Formatted Error
  return {
    title: "AI Pipeline Processing Failure",
    userMessage: rawMsg.length > 200 ? `${rawMsg.slice(0, 200)}...` : rawMsg,
    actionableAdvice: "Review your input parameters or try running with 'gemini-3.6-flash' default mode.",
    errorCode: "UNKNOWN_LLM_ERROR",
    isApiKeyError: false,
    isRateLimitError: false,
    isQuotaError: false,
    isSafetyError: false,
    isNetworkError: false,
    rawMessage: rawMsg
  };
}
