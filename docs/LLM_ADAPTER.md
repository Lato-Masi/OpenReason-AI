# LLM Adapter & Provider Integration Guide

## Overview

OpenReason communicates with large language models through a dual-adapter layer supporting Google Gemini (`@google/genai`) and OpenRouter.ai REST API endpoints.

---

## Supported Providers & Models

### 1. Google Gemini Native SDK
- `gemini-3.6-flash`: Primary fast reasoning model with native Google Search Grounding.
- `gemini-2.5-pro`: High-capacity frontier reasoning model.
- `gemini-2.5-flash`: Ultra-low latency reasoning model.

### 2. OpenRouter API Integration
- `deepseek/deepseek-r1`: Open reasoning model with chain-of-thought tokens.
- `anthropic/claude-3.7-sonnet`: Extended reasoning capability.
- `openai/gpt-4o`: Multimodal frontier model.
- Custom OpenRouter models via model picker or manual ID entry.

---

## Structured Output & Schema Fallback (`src/services/structuredOutput.ts`)

When models do not natively support JSON schema enforcement or fail schema validation:

1. **Native JSON Schema Mode**: Enforces `responseSchema` or `response_format` JSON mode when supported.
2. **Resilient JSON Extractor**: Extracts raw JSON from markdown code fences (```json ... ```) or nested JSON braces `{...}`.
3. **Automated Conversion**: Converts unstructured text into compliant typed objects using strict parsing.

---

## Error Trapping & Normalization (`src/services/llmErrorAdapter.ts`)

All provider exceptions are processed through `formatLLMError(error, modelName)`:

| Raw Error Category | Mapped Error Code | User Message & Recovery Guidance |
| :--- | :--- | :--- |
| `401`, `PERMISSION_DENIED`, `api_key_invalid` | `AUTH_KEY_INVALID` | Prompts user to configure custom keys in BYOK modal. |
| `429`, `RESOURCE_EXHAUSTED`, `rate limit` | `RATE_LIMIT_EXCEEDED` | Advises 15-30 second backoff or model switch. |
| `SAFETY`, `harm_category`, `blocked` | `SAFETY_FILTER_BLOCKED` | Explains safety trigger and suggests prompt rephrasing. |
| `404`, `NOT_FOUND` | `MODEL_NOT_FOUND` | Triggers automated fallback to `gemini-3.6-flash`. |
| `fetch failed`, `ECONNRESET`, timeout | `NETWORK_TIMEOUT` | Prompts user to verify internet connection and retry. |

---

## Bring Your Own Key (BYOK) Security

- Keys are stored exclusively in client `localStorage` under `openreason_gemini_key` and `openreason_openrouter_key`.
- Server environment variables (`GEMINI_API_KEY`, `OPENROUTER_API_KEY`) act as default fallbacks when BYOK keys are not provided.
