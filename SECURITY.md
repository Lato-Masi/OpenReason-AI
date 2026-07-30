# Security Policy

## Supported Versions

We actively support and apply security updates to the following versions of OpenReason:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

---

## 🔒 API Key & Privacy Architecture

OpenReason operates on a **Bring Your Own Key (BYOK)** client-side paradigm:

1. **Client-Side Key Storage**: All user-provided API keys (Google Gemini API keys, OpenRouter API keys) are saved exclusively in the browser's `localStorage` (`openreason_gemini_api_key`, `openreason_openrouter_api_key`).
2. **Direct Direct-to-Provider Transmissions**: Requests are issued directly to official endpoints (`aistudio.google.com` or `openrouter.ai`) or via authenticated proxy routes.
3. **No Key Persistence on Servers**: Maintainers do not log, save, or retain API credentials submitted through the application frontend.

---

## 🚨 Reporting a Vulnerability

If you discover a potential security vulnerability in OpenReason (such as improper API key exposure, cross-site scripting vulnerabilities, or state leaks), please report it responsibly:

1. **Do NOT open a public GitHub issue** for undisclosed security bugs.
2. Email the maintainers directly at `ray@bcap.biz` with:
   - Description of the vulnerability.
   - Steps to reproduce the issue.
   - Potential risk assessment and proposed mitigations.
3. You will receive an acknowledgment within 48 hours, followed by an estimated remediation timeline.

Thank you for helping keep OpenReason and its research community safe!
