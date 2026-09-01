# Grounded LLM Reviewer Copilot Architecture

## 1. Objective
To deploy a GenAI copilot that assists human reviewers by surfacing and translating complex ML artifacts (SHAP, Isolation Forest outputs, structural rules) into natural language, without introducing Hallucinations or Autonomous Decision Making.

## 2. Architecture & SDK
- Utilizes the `google-genai` Python SDK (`from google import genai`).
- API keys are secured via `.env` files and never exposed in the source code.

## 3. Strict Context Grounding (RAG)
The ML pipeline remains the **absolute source of truth**. The Copilot is only permitted to read:
- `outputs/features.csv`
- `outputs/anomalies/anomaly_scores.csv`
- `reports/data_dictionary.md`
- `reports/validation_rules.json`

## 4. Prompt Guardrails
The `System Instruction` explicitly forces the model to:
1. Use ONLY supplied evidence.
2. Say "insufficient evidence" when data is missing.
3. NEVER make a financial decision.
4. Append exactly: **"AI Recommendation — Human Review Required."**

## 5. Audit Logging
Every single API interaction is logged to `outputs/llm_logs.jsonl` tracking the timestamp, model version, exact input context, user prompt, and model output.

See `reports/AI_Development_Log.md` for specific examples of accepted and corrected outputs.
