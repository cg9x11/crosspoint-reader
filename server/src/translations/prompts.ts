import { load } from "cheerio";

import { stripHtmlToReadableText } from "../lib/sanitize.js";
import type { TranslationGlossaryEntry, TranslationProject } from "../lib/prisma.js";

export interface TranslationBlock {
  selector: string;
  html: string;
  text: string;
}

export interface TranslationContextSnapshot {
  chapterTitle: string;
  previousSummaries: string[];
}

function buildGlossaryLines(entries: TranslationGlossaryEntry[]) {
  return entries
    .slice()
    .sort((left, right) => Number(right.priority || 0) - Number(left.priority || 0))
    .map((entry) => {
      const pieces = [
        entry.type || "term",
        entry.rawName,
        entry.translatedName
      ];
      if (entry.gender) {
        pieces.push(entry.gender);
      }
      if (entry.description) {
        pieces.push(entry.description);
      }
      return pieces.join(" | ");
    })
    .join("\n");
}

export function buildTranslationSystemPrompt(
  project: Pick<TranslationProject, "targetLanguage" | "systemPrompt" | "styleGuideJson" | "contextMode" | "historyDepth">,
  glossaryEntries: TranslationGlossaryEntry[],
  context: TranslationContextSnapshot
) {
  const style = project.styleGuideJson ? String(project.styleGuideJson) : "{}";
  const glossary = buildGlossaryLines(glossaryEntries);
  const contextBlock = context.previousSummaries.length
    ? `Previous chapter summaries:\n${context.previousSummaries.join("\n---\n")}`
    : "No previous chapter summaries.";

  return [
    `You are a professional translator. Translate to ${project.targetLanguage}.`,
    `Preserve structure, headings, paragraphs, and readability.`,
    `Use stable names and terms from glossary.`,
    `Style guide JSON: ${style}`,
    project.systemPrompt?.trim() || "",
    glossary ? `Glossary:\n${glossary}` : "",
    project.contextMode === "off" ? "Ignore previous context." : contextBlock,
    `Current chapter title: ${context.chapterTitle}`
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function extractTranslatableBlocks(html: string) {
  const $ = load(`<div id="translation-root">${html}</div>`);
  const root = $("#translation-root");
  const blocks: TranslationBlock[] = [];
  root.find("h1,h2,h3,p,li,blockquote,pre").each((index, node) => {
    const element = $(node);
    const text = stripHtmlToReadableText($.html(node));
    if (!text.trim()) {
      return;
    }
    element.attr("data-translation-block", String(blocks.length));
    blocks.push({
      selector: `[data-translation-block=\"${blocks.length}\"]`,
      html: $.html(node),
      text
    });
  });
  return {
    root,
    blocks,
    $,
    html: root.html() || ""
  };
}

export function replaceTranslatedBlocks(
  sourceHtml: string,
  translatedBlocks: string[]
) {
  const { $, root } = extractTranslatableBlocks(sourceHtml);
  root.find("[data-translation-block]").each((index, node) => {
    const translated = translatedBlocks[index] || "";
    const element = $(node);
    element.text(translated);
    element.removeAttr("data-translation-block");
  });
  return root.html() || "";
}

export function buildChapterSummary(translatedHtml: string) {
  const text = stripHtmlToReadableText(translatedHtml);
  return text.length > 900 ? `${text.slice(0, 900)}…` : text;
}

