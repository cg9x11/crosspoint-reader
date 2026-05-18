import type { TranslationProviderCredential, TranslationRuntimeSettings } from "./settings.js";
import { fetchJson, fetchWithTimeout } from "../lib/http.js";

export interface TranslationProviderResult {
  texts: string[];
  tokenUsage: number;
  estimatedCost: number;
}

export interface GlossaryCandidate {
  type: string;
  rawName: string;
  translatedName: string;
  gender?: string;
  description?: string;
}

function chunkByChars(items: string[], maxChars: number) {
  const groups: string[][] = [];
  let current: string[] = [];
  let currentChars = 0;
  for (const item of items) {
    const size = item.length + 16;
    if (current.length && currentChars + size > maxChars) {
      groups.push(current);
      current = [];
      currentChars = 0;
    }
    current.push(item);
    currentChars += size;
  }
  if (current.length) {
    groups.push(current);
  }
  return groups;
}

function buildHeuristicGlossary(text: string): GlossaryCandidate[] {
  const tokens = Array.from(new Set((text.match(/[A-ZÀ-ỹ][\p{L}\p{M}0-9_'-]{2,}/gu) || []).slice(0, 40)));
  return tokens.slice(0, 20).map((token) => ({
    type: "term",
    rawName: token,
    translatedName: token
  }));
}

async function translateWithOpenAICompatible(
  credential: TranslationProviderCredential,
  systemPrompt: string,
  texts: string[],
  runtime: TranslationRuntimeSettings,
  model: string
): Promise<TranslationProviderResult> {
  const baseUrl = credential.baseUrl?.trim() || "https://api.openai.com/v1";
  const batches = chunkByChars(texts, runtime.maxCharsPerRequest);
  const outputs: string[] = [];
  let tokenUsage = 0;
  for (const batch of batches) {
    const body = {
      model,
      stream: false,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: `${systemPrompt}\n\nReturn JSON {\"items\":[string,...]} with same item count.` },
        { role: "user", content: JSON.stringify({ items: batch }) }
      ]
    };
    const response = await fetchJson<any>(
      `${baseUrl.replace(/\/+$/, "")}/chat/completions`,
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${credential.apiKey || ""}`,
          "content-type": "application/json"
        },
        body: JSON.stringify(body)
      },
      runtime.requestTimeoutMs
    );
    const raw = response?.choices?.[0]?.message?.content || "{}";
    const parsed = JSON.parse(raw);
    outputs.push(...(Array.isArray(parsed.items) ? parsed.items.map(String) : batch));
    tokenUsage += Number(response?.usage?.total_tokens || 0);
  }
  return { texts: outputs, tokenUsage, estimatedCost: 0 };
}

async function translateWithGemini(
  credential: TranslationProviderCredential,
  systemPrompt: string,
  texts: string[],
  runtime: TranslationRuntimeSettings,
  model: string
): Promise<TranslationProviderResult> {
  const apiKey = credential.apiKey || "";
  const batches = chunkByChars(texts, runtime.maxCharsPerRequest);
  const outputs: string[] = [];
  for (const batch of batches) {
    const response = await fetchJson<any>(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: `${systemPrompt}\n\nReturn JSON {\"items\":[string,...]} with same item count.` }] },
          contents: [{ parts: [{ text: JSON.stringify({ items: batch }) }] }],
          generationConfig: { temperature: 0.2 }
        })
      },
      runtime.requestTimeoutMs
    );
    const raw = response?.candidates?.[0]?.content?.parts?.map((item: any) => item?.text || "").join("\n") || "{}";
    const parsed = JSON.parse(raw);
    outputs.push(...(Array.isArray(parsed.items) ? parsed.items.map(String) : batch));
  }
  return { texts: outputs, tokenUsage: 0, estimatedCost: 0 };
}

export async function translateTexts(
  credential: TranslationProviderCredential | undefined,
  provider: string,
  model: string,
  systemPrompt: string,
  texts: string[],
  runtime: TranslationRuntimeSettings
): Promise<TranslationProviderResult> {
  if (!credential) {
    throw new Error(`Missing credential for provider: ${provider}`);
  }
  if (provider === "gemini") {
    return translateWithGemini(credential, systemPrompt, texts, runtime, model);
  }
  if (provider !== "openai") {
    throw new Error(`Unsupported translation provider: ${provider}`);
  }
  return translateWithOpenAICompatible(credential, systemPrompt, texts, runtime, model);
}

export async function suggestGlossaryCandidates(
  credential: TranslationProviderCredential | undefined,
  provider: string,
  model: string,
  sourceText: string,
  runtime: TranslationRuntimeSettings,
  targetLanguage: string
): Promise<GlossaryCandidate[]> {
  const heuristic = buildHeuristicGlossary(sourceText);
  if (!credential) {
    return heuristic;
  }
  const prompt = `Extract glossary candidates for translation to ${targetLanguage}. Return JSON {"items":[{"type":"term","rawName":"","translatedName":"","gender":"","description":""}]}. Keep 20 items max.`;
  try {
    const sample = sourceText.slice(0, runtime.maxCharsPerRequest);
    let parsed: any = null;
    if (provider === "openai") {
      const baseUrl = credential.baseUrl?.trim() || "https://api.openai.com/v1";
      const response = await fetchJson<any>(
        `${baseUrl.replace(/\/+$/, "")}/chat/completions`,
        {
          method: "POST",
          headers: {
            authorization: `Bearer ${credential.apiKey || ""}`,
            "content-type": "application/json"
          },
          body: JSON.stringify({
            model,
            stream: false,
            temperature: 0.2,
            response_format: { type: "json_object" },
            messages: [
              { role: "system", content: prompt },
              { role: "user", content: sample }
            ]
          })
        },
        runtime.requestTimeoutMs
      );
      parsed = JSON.parse(response?.choices?.[0]?.message?.content || "{}");
    } else if (provider === "gemini") {
      const response = await fetchJson<any>(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(credential.apiKey || "")}`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: prompt }] },
            contents: [{ parts: [{ text: sample }] }],
            generationConfig: { temperature: 0.2 }
          })
        },
        runtime.requestTimeoutMs
      );
      const raw = response?.candidates?.[0]?.content?.parts?.map((item: any) => item?.text || "").join("\n") || "{}";
      parsed = JSON.parse(raw);
    } else {
      throw new Error(`Unsupported translation provider: ${provider}`);
    }
    if (Array.isArray(parsed.items)) {
      return parsed.items.map((item: any) => ({
        type: String(item.type || "term"),
        rawName: String(item.rawName || "").trim(),
        translatedName: String(item.translatedName || item.rawName || "").trim(),
        gender: item.gender ? String(item.gender) : undefined,
        description: item.description ? String(item.description) : undefined
      })).filter((item: GlossaryCandidate) => item.rawName && item.translatedName);
    }
  } catch {
    // fallback
  }
  return heuristic;
}
