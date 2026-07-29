import { getEffectiveOpenRouterKey, API_KEY_URLS } from './apiKeyService';
import { ThinkingLevel } from "@google/genai";

export interface OpenRouterModel {
  id: string;
  name: string;
  description?: string;
  context_length?: number;
}

export const POPULAR_OPENROUTER_MODELS: OpenRouterModel[] = [
  { id: "deepseek/deepseek-r1", name: "DeepSeek R1 (Reasoning)", context_length: 16384 },
  { id: "deepseek/deepseek-chat", name: "DeepSeek V3", context_length: 64000 },
  { id: "anthropic/claude-3.7-sonnet", name: "Claude 3.7 Sonnet (Thinking)", context_length: 200000 },
  { id: "anthropic/claude-3.5-haiku", name: "Claude 3.5 Haiku", context_length: 200000 },
  { id: "openai/gpt-4o", name: "GPT-4o", context_length: 128000 },
  { id: "openai/gpt-4o-mini", name: "GPT-4o Mini", context_length: 128000 },
  { id: "openai/o3-mini", name: "OpenAI o3-mini (Reasoning)", context_length: 200000 },
  { id: "meta-llama/llama-3.3-70b-instruct", name: "Llama 3.3 70B Instruct", context_length: 128000 },
  { id: "qwen/qwen-2.5-72b-instruct", name: "Qwen 2.5 72B Instruct", context_length: 128000 },
  { id: "mistralai/mistral-large-2411", name: "Mistral Large 24.11", context_length: 128000 }
];

export function isOpenRouterModel(modelName: string): boolean {
  if (!modelName) return false;
  if (modelName.startsWith("openrouter/")) return true;
  if (modelName.startsWith("gemini-")) return false;
  
  // Known OpenRouter vendor prefixes or any vendor/model format
  const openRouterVendors = [
    "deepseek/", "anthropic/", "openai/", "meta-llama/", 
    "qwen/", "mistralai/", "cohere/", "perplexity/", "google/", "nvidia/", "amazon/", "x-ai/"
  ];
  return openRouterVendors.some(vendor => modelName.startsWith(vendor)) || modelName.includes("/");
}

export function cleanOpenRouterModelId(modelName: string): string {
  if (modelName.startsWith("openrouter/")) {
    return modelName.replace("openrouter/", "");
  }
  return modelName;
}

export async function fetchOpenRouterModels(): Promise<OpenRouterModel[]> {
  try {
    const apiKey = getEffectiveOpenRouterKey();
    const headers: Record<string, string> = {
      "Content-Type": "application/json"
    };
    if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }

    const res = await fetch("https://openrouter.ai/api/v1/models", { headers });
    if (!res.ok) {
      console.warn("Failed to fetch dynamic models from OpenRouter, using fallback list.");
      return POPULAR_OPENROUTER_MODELS;
    }
    const data = await res.json();
    if (Array.isArray(data?.data)) {
      const modelsList: OpenRouterModel[] = data.data.map((m: any) => ({
        id: m.id,
        name: m.name || m.id,
        description: m.description,
        context_length: m.context_length
      }));
      return modelsList.length > 0 ? modelsList : POPULAR_OPENROUTER_MODELS;
    }
    return POPULAR_OPENROUTER_MODELS;
  } catch (error) {
    console.warn("OpenRouter models fetch error:", error);
    return POPULAR_OPENROUTER_MODELS;
  }
}

export interface OpenRouterGenerateParams {
  model: string;
  prompt: string | any[];
  temperature?: number;
  thinkingLevel?: ThinkingLevel | string;
  reasoningEffort?: 'low' | 'medium' | 'high';
  requiresGrounding?: boolean; // Web Search server tool
  codeExecution?: boolean; // Code Interpreter / Python Sandbox server tool
  tools?: any[]; // OpenAI-compatible function calling tool declarations
  toolChoice?: any;
  responseMimeType?: string;
  jsonSchema?: Record<string, any>;
  systemPrompt?: string;
  maxTokens?: number;
  topP?: number;
}

function mapThinkingLevelToOpenRouterEffort(thinkingLevel?: ThinkingLevel | string): 'low' | 'medium' | 'high' {
  if (!thinkingLevel) return 'high';
  const str = String(thinkingLevel).toUpperCase();
  if (str === 'MINIMAL' || str === 'LOW') return 'low';
  if (str === 'MEDIUM') return 'medium';
  if (str === 'HIGH') return 'high';
  return 'high';
}

export async function generateOpenRouterContent(params: OpenRouterGenerateParams): Promise<any> {
  const apiKey = getEffectiveOpenRouterKey();
  if (!apiKey || apiKey === "MY_OPENROUTER_API_KEY") {
    throw new Error(`OpenRouter API key is missing. Please set your custom API key in the 'API Keys' manager or visit ${API_KEY_URLS.OPENROUTER} to generate one.`);
  }

  const rawModel = cleanOpenRouterModelId(params.model);

  // 1. Build Messages Array
  const messages: any[] = [];
  if (params.systemPrompt) {
    messages.push({ role: "system", content: params.systemPrompt });
  }

  if (typeof params.prompt === "string") {
    messages.push({ role: "user", content: params.prompt });
  } else if (Array.isArray(params.prompt)) {
    messages.push(...params.prompt);
  }

  const requestBody: any = {
    model: rawModel,
    messages,
    temperature: params.temperature ?? 0.7
  };

  if (params.maxTokens) {
    requestBody.max_tokens = params.maxTokens;
  }
  if (params.topP !== undefined) {
    requestBody.top_p = params.topP;
  }

  // 2. OpenRouter Reasoning Effort Parity
  const effortLevel = params.reasoningEffort || mapThinkingLevelToOpenRouterEffort(params.thinkingLevel);
  requestBody.reasoning = {
    effort: effortLevel
  };
  requestBody.reasoning_effort = effortLevel;
  requestBody.include_reasoning = true;

  // 3. OpenRouter Server Tools Parity (Web Search, Python Sandbox, Function Calling)
  const serverTools: any[] = [];
  const plugins: any[] = [];

  if (params.requiresGrounding) {
    serverTools.push({ type: "web_search" });
    plugins.push({ id: "web" });
  }

  if (params.codeExecution) {
    serverTools.push({ type: "code_interpreter" });
    plugins.push({ id: "code_interpreter" });
  }

  if (params.tools && Array.isArray(params.tools) && params.tools.length > 0) {
    serverTools.push(...params.tools);
  }

  if (serverTools.length > 0) {
    requestBody.tools = serverTools;
    if (params.toolChoice) {
      requestBody.tool_choice = params.toolChoice;
    }
  }

  if (plugins.length > 0) {
    requestBody.plugins = plugins;
  }

  // 4. Structured Output Format
  if (params.jsonSchema) {
    requestBody.response_format = {
      type: "json_schema",
      json_schema: {
        name: "structured_output",
        strict: true,
        schema: params.jsonSchema
      }
    };
  } else if (params.responseMimeType === "application/json") {
    requestBody.response_format = { type: "json_object" };
  }

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "HTTP-Referer": process.env.APP_URL || "https://openreason.ai",
      "X-Title": "OpenReason AI Pipeline",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorText = await response.text();
    let parsedError = errorText;
    try {
      const errJson = JSON.parse(errorText);
      parsedError = errJson.error?.message || errJson.message || errorText;
    } catch (_) {}
    throw new Error(`OpenRouter API Error (${response.status}): ${parsedError}`);
  }

  const data = await response.json();
  const choice = data?.choices?.[0];
  const message = choice?.message;
  let fullContent = message?.content || "";
  let reasoningTrace = message?.reasoning || message?.reasoning_content || message?.thought || "";

  // Extract <think> ... </think> tags if embedded in main content (e.g., DeepSeek R1 / Qwen)
  if (fullContent && fullContent.includes("<think>")) {
    const thinkMatch = fullContent.match(/<think>([\s\S]*?)<\/think>/i);
    if (thinkMatch) {
      reasoningTrace = reasoningTrace ? `${reasoningTrace}\n${thinkMatch[1].trim()}` : thinkMatch[1].trim();
      fullContent = fullContent.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
    }
  }

  // Extract server tool outputs (Python Code Sandbox or Web Search Grounding Tool Calls)
  let codeExecutionResult: { code: string; output: string } | undefined;
  const webSearchCitations: string[] = [];

  if (message?.tool_calls && Array.isArray(message.tool_calls)) {
    for (const toolCall of message.tool_calls) {
      if (toolCall.type === "code_interpreter" || toolCall.type === "python_interpreter" || toolCall.function?.name === "code_interpreter" || toolCall.function?.name === "python") {
        const code = toolCall.code || toolCall.function?.arguments?.code || toolCall.function?.arguments || "";
        const output = toolCall.output || toolCall.result || "Executed in OpenRouter Python Sandbox";
        codeExecutionResult = {
          code: typeof code === "string" ? code : JSON.stringify(code),
          output: typeof output === "string" ? output : JSON.stringify(output)
        };
      } else if (toolCall.type === "web_search" || toolCall.function?.name === "web_search") {
        const query = toolCall.query || toolCall.function?.arguments?.query || "Web Search";
        const results = toolCall.results || toolCall.result || "Executed Web Search";
        webSearchCitations.push(`[Web Search Query: ${query}] -> ${typeof results === "string" ? results : JSON.stringify(results)}`);
      }
    }
  }

  // Extract web search annotations or citations if returned
  if (choice?.annotations || choice?.citations || data?.citations) {
    const rawCitations = choice?.annotations || choice?.citations || data?.citations;
    if (Array.isArray(rawCitations)) {
      rawCitations.forEach((c: any) => {
        if (typeof c === "string") webSearchCitations.push(c);
        else if (c.url || c.title) webSearchCitations.push(`${c.title || 'Source'}: ${c.url || ''}`);
      });
    }
  }

  // Construct standard parts array for Gemini interface compatibility
  const parts: any[] = [];
  if (reasoningTrace) {
    parts.push({ thought: reasoningTrace, text: reasoningTrace });
  }
  if (codeExecutionResult) {
    parts.push({
      executableCode: { code: codeExecutionResult.code, language: "PYTHON" },
      codeExecutionResult: { outcome: "OK", output: codeExecutionResult.output }
    });
  }
  if (webSearchCitations.length > 0) {
    const citationsText = `\n\n### OpenRouter Web Search Grounding\n` + webSearchCitations.map(c => `- ${c}`).join('\n');
    fullContent += citationsText;
  }
  parts.push({ text: fullContent });

  // Token metrics
  const usage = data?.usage || {};
  const inputTokens = usage.prompt_tokens || 0;
  const outputTokens = usage.completion_tokens || 0;
  const reasoningTokens = usage.completion_tokens_details?.reasoning_tokens || 0;

  return {
    text: fullContent,
    reasoningTrace,
    codeExecution: codeExecutionResult,
    webSearchCitations,
    usage: {
      inputTokens,
      outputTokens,
      reasoningTokens,
      totalTokens: usage.total_tokens || (inputTokens + outputTokens)
    },
    candidates: [
      {
        content: {
          parts
        }
      }
    ],
    rawOpenRouterData: data
  };
}

