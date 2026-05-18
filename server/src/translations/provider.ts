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
  viLabel?: string;
  gender?: string;
  description?: string;
}

const KANA_DIGRAPHS: Record<string, string> = {
  きゃ: "kya", きゅ: "kyu", きょ: "kyo",
  しゃ: "sha", しゅ: "shu", しょ: "sho",
  ちゃ: "cha", ちゅ: "chu", ちょ: "cho",
  にゃ: "nya", にゅ: "nyu", にょ: "nyo",
  ひゃ: "hya", ひゅ: "hyu", ひょ: "hyo",
  みゃ: "mya", みゅ: "myu", みょ: "myo",
  りゃ: "rya", りゅ: "ryu", りょ: "ryo",
  ぎゃ: "gya", ぎゅ: "gyu", ぎょ: "gyo",
  じゃ: "ja", じゅ: "ju", じょ: "jo",
  びゃ: "bya", びゅ: "byu", びょ: "byo",
  ぴゃ: "pya", ぴゅ: "pyu", ぴょ: "pyo",
  ティ: "ti", ディ: "di", ツァ: "tsa", ツィ: "tsi", ツェ: "tse", ツォ: "tso",
  ファ: "fa", フィ: "fi", フェ: "fe", フォ: "fo",
  ウィ: "wi", ウェ: "we", ウォ: "wo",
  ヴァ: "va", ヴィ: "vi", ヴェ: "ve", ヴォ: "vo",
  キャ: "kya", キュ: "kyu", キョ: "kyo",
  シャ: "sha", シュ: "shu", ショ: "sho",
  チャ: "cha", チュ: "chu", チョ: "cho",
  ニャ: "nya", ニュ: "nyu", ニョ: "nyo",
  ヒャ: "hya", ヒュ: "hyu", ヒョ: "hyo",
  ミャ: "mya", ミュ: "myu", ミョ: "myo",
  リャ: "rya", リュ: "ryu", リョ: "ryo",
  ギャ: "gya", ギュ: "gyu", ギョ: "gyo",
  ジャ: "ja", ジュ: "ju", ジョ: "jo",
  ビャ: "bya", ビュ: "byu", ビョ: "byo",
  ピャ: "pya", ピュ: "pyu", ピョ: "pyo"
};

const KANA_MONOGRAPHS: Record<string, string> = {
  あ: "a", い: "i", う: "u", え: "e", お: "o",
  か: "ka", き: "ki", く: "ku", け: "ke", こ: "ko",
  さ: "sa", し: "shi", す: "su", せ: "se", そ: "so",
  た: "ta", ち: "chi", つ: "tsu", て: "te", と: "to",
  な: "na", に: "ni", ぬ: "nu", ね: "ne", の: "no",
  は: "ha", ひ: "hi", ふ: "fu", へ: "he", ほ: "ho",
  ま: "ma", み: "mi", む: "mu", め: "me", も: "mo",
  や: "ya", ゆ: "yu", よ: "yo",
  ら: "ra", り: "ri", る: "ru", れ: "re", ろ: "ro",
  わ: "wa", を: "o", ん: "n",
  が: "ga", ぎ: "gi", ぐ: "gu", げ: "ge", ご: "go",
  ざ: "za", じ: "ji", ず: "zu", ぜ: "ze", ぞ: "zo",
  だ: "da", ぢ: "ji", づ: "zu", で: "de", ど: "do",
  ば: "ba", び: "bi", ぶ: "bu", べ: "be", ぼ: "bo",
  ぱ: "pa", ぴ: "pi", ぷ: "pu", ぺ: "pe", ぽ: "po",
  ア: "a", イ: "i", ウ: "u", エ: "e", オ: "o",
  カ: "ka", キ: "ki", ク: "ku", ケ: "ke", コ: "ko",
  サ: "sa", シ: "shi", ス: "su", セ: "se", ソ: "so",
  タ: "ta", チ: "chi", ツ: "tsu", テ: "te", ト: "to",
  ナ: "na", ニ: "ni", ヌ: "nu", ネ: "ne", ノ: "no",
  ハ: "ha", ヒ: "hi", フ: "fu", ヘ: "he", ホ: "ho",
  マ: "ma", ミ: "mi", ム: "mu", メ: "me", モ: "mo",
  ヤ: "ya", ユ: "yu", ヨ: "yo",
  ラ: "ra", リ: "ri", ル: "ru", レ: "re", ロ: "ro",
  ワ: "wa", ヲ: "o", ン: "n",
  ガ: "ga", ギ: "gi", グ: "gu", ゲ: "ge", ゴ: "go",
  ザ: "za", ジ: "ji", ズ: "zu", ゼ: "ze", ゾ: "zo",
  ダ: "da", ヂ: "ji", ヅ: "zu", デ: "de", ド: "do",
  バ: "ba", ビ: "bi", ブ: "bu", ベ: "be", ボ: "bo",
  パ: "pa", ピ: "pi", プ: "pu", ペ: "pe", ポ: "po",
  ー: "-"
};

function hasJapaneseScript(value: string) {
  return /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/u.test(value);
}

function hasNonLatinScript(value: string) {
  return /[^\p{Script=Latin}\p{N}\s\-_'’.]/u.test(value);
}

function toLatinSlug(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9\s-]/g, " ")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function romanizeJapanese(value: string) {
  let result = "";
  for (let index = 0; index < value.length; index += 1) {
    const pair = value.slice(index, index + 2);
    if (KANA_DIGRAPHS[pair]) {
      result += KANA_DIGRAPHS[pair];
      index += 1;
      continue;
    }
    const current = value[index] || "";
    if (current === "っ" || current === "ッ") {
      const nextPair = value.slice(index + 1, index + 3);
      const next = KANA_DIGRAPHS[nextPair] || KANA_MONOGRAPHS[value[index + 1] || ""] || "";
      result += next.slice(0, 1);
      continue;
    }
    result += KANA_MONOGRAPHS[current] || (hasJapaneseScript(current) ? "" : current);
  }
  return result
    .replace(/-+/g, "-")
    .replace(/[^a-zA-Z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toLatinGlossaryValue(rawName: string, translatedName?: string) {
  const candidate = String(translatedName || "").trim();
  if (candidate && !hasNonLatinScript(candidate)) {
    const normalized = toLatinSlug(candidate).replace(/-/g, " ").trim();
    return normalized || candidate;
  }
  const romanized = romanizeJapanese(candidate || rawName);
  if (romanized) {
    return romanized;
  }
  const latinized = toLatinSlug(candidate || rawName).replace(/-/g, " ").trim();
  if (latinized) {
    return latinized;
  }
  return `term-${Buffer.from(rawName).toString("hex").slice(0, 12)}`;
}

function containsKana(value: string) {
  return /[\u3040-\u30ff]/u.test(value);
}

function containsKanji(value: string) {
  return /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/u.test(value);
}

function looksLikeSentenceFragment(value: string) {
  return /[。、！？!?]|(を|に|で|へ|から|まで|より|と|が|は|も|の|た|だ|です|ます)$/.test(value);
}

function splitJapaneseGlossaryTerms(value: string) {
  return value
    .split(/[\s\r\n。、！？!?「」『』（）()\[\]【】,，:：;；/\\|]+/u)
    .flatMap((part) => part.split(/(?:という|として|には|では|から|まで|より|だけ|ほど|など|なら|ので|ため|こと|もの|よう|する|した|して|され|なる|いる|ある|ない)/u))
    .flatMap((part) => part.split(/[はがをにへでともやの]/u))
    .map((part) => part.trim())
    .filter((part) => part.length >= 2 && part.length <= 10)
    .filter((part) => hasJapaneseScript(part))
    .filter((part) => !/^[\u3040-\u309f]+$/u.test(part))
    .filter((part) => !looksLikeSentenceFragment(part));
}

function inferGlossaryType(rawName: string) {
  if (/(スキル|魔法|術|技|目|眼|剣|槍|弓|盾|杖|薬|石|書|鍵)/u.test(rawName)) {
    return "term";
  }
  if (/(国|王国|帝国|都市|村|町|領|地|森|山|川|城|館|港)/u.test(rawName)) {
    return "place";
  }
  if (rawName.length >= 2 && rawName.length <= 5 && containsKanji(rawName) && !containsKana(rawName)) {
    return "person";
  }
  return "term";
}

function toVietnameseLabel(rawName: string, latinName: string, type?: string) {
  const shortLatin = String(latinName || "").trim() || String(rawName || "").trim();
  const prefix = type === "person" ? "Nhân vật" : type === "place" ? "Địa danh" : "Thuật ngữ";
  return `${prefix} ${shortLatin}`.trim();
}

function toVietnameseDescription(rawName: string, latinName: string, type?: string) {
  const label = String(latinName || rawName || "").trim();
  if (!label) {
    return "Thuật ngữ trích tự động từ văn bản nguồn.";
  }
  if (type === "person") {
    return `Tên nhân vật trong truyện: ${label}.`;
  }
  if (type === "place") {
    return `Tên địa danh trong truyện: ${label}.`;
  }
  return `Thuật ngữ trong truyện: ${label}.`;
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
  const latinTokens = text.match(/[A-ZÀ-ỹ][\p{L}\p{M}0-9_'-]{2,}/gu) || [];
  const japaneseRuns = text.match(/[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]{2,24}/gu) || [];
  const cjkTokens = japaneseRuns.flatMap(splitJapaneseGlossaryTerms);
  const tokens = Array.from(new Set([...latinTokens, ...cjkTokens]))
    .filter((token) => token.length >= 2 && token.length <= 32)
    .filter((token) => !hasJapaneseScript(token) || !looksLikeSentenceFragment(token))
    .slice(0, 40);
  return tokens.slice(0, 20).map((token) => {
    const type = hasJapaneseScript(token) ? inferGlossaryType(token) : "term";
    const translatedName = toLatinGlossaryValue(token);
    return {
      type,
      rawName: token,
      translatedName,
      viLabel: toVietnameseLabel(token, translatedName, type),
      description: hasJapaneseScript(token)
        ? toVietnameseDescription(token, translatedName, type)
        : "Thuật ngữ được trích tự động từ văn bản nguồn."
    };
  });
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
  const prompt = `Extract glossary candidates for translation to ${targetLanguage}. Return JSON {"items":[{"type":"term","rawName":"","translatedName":"","viLabel":"","gender":"","description":""}]}. Keep 20 items max.
Important rules:
- translatedName must be Latin script only (romanized/transliterated), never keep original non-Latin script.
- viLabel must be a short Vietnamese name (2-6 words) for quick selection while translating.
- description must be a short Vietnamese explanation for non-Japanese readers (what this term refers to in story context).
- Prefer specific terms: person names, organizations, skills, places, ranks, items.`;
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
      return parsed.items.map((item: any) => {
        const type = String(item.type || "term").trim() || "term";
        const rawName = String(item.rawName || "").trim();
        const translatedName = toLatinGlossaryValue(
          rawName,
          String(item.translatedName || item.rawName || "").trim()
        );
        const viLabel = String(item.viLabel || "").trim() || toVietnameseLabel(rawName, translatedName, type);
        const description = String(item.description || "").trim() || toVietnameseDescription(rawName, translatedName, type);
        return {
          type,
          rawName,
          translatedName,
          viLabel,
          gender: item.gender ? String(item.gender) : undefined,
          description
        };
      }).filter((item: GlossaryCandidate) => item.rawName && item.translatedName);
    }
  } catch {
    // fallback
  }
  return heuristic;
}
