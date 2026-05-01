import { load } from "cheerio";

export function normalizeSpace(value) {
  return String(value ?? "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeRegExp(value) {
  return String(value ?? "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function stripDiacritics(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/\p{M}+/gu, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

export function normalizeAsciiLabel(value) {
  return stripDiacritics(normalizeSpace(value)).toLowerCase();
}

export function removeLeadingLabel(value, label) {
  const safeValue = normalizeSpace(value);
  const safeLabel = normalizeSpace(label);
  if (!safeLabel) {
    return safeValue;
  }

  return normalizeSpace(safeValue.replace(new RegExp(`^${escapeRegExp(safeLabel)}\\s*:?\\s*`, "iu"), ""));
}

export function absoluteUrl(baseUrl, input) {
  const value = String(input ?? "").trim();
  if (!value) return "";
  return new URL(value, baseUrl).toString();
}

export function extractStyleUrl(styleValue) {
  const match = String(styleValue ?? "").match(/url\((['"]?)(.+?)\1\)/i);
  return match ? match[2] : "";
}

export function sanitizeHtmlFragment(html) {
  const $ = load(`<div id="root">${html ?? ""}</div>`);
  $("#root script, #root style, #root noscript, #root iframe").remove();
  return ($("#root").html() ?? "").trim();
}

export function htmlToPlainText(html) {
  const $ = load(`<div id="root">${html ?? ""}</div>`);
  $("#root script, #root style, #root noscript, #root iframe").remove();
  $("#root br").replaceWith("\n");
  $("#root p, #root div, #root li, #root h1, #root h2, #root h3, #root h4, #root section, #root article, #root blockquote")
    .each((_, element) => {
      $(element).append("\n");
    });
  return $("#root")
    .text()
    .split(/\n+/)
    .map((line) => normalizeSpace(line))
    .filter(Boolean)
    .join("\n\n");
}

export function shortError(error) {
  if (!error) return "Unknown error";
  if (typeof error === "string") return error;
  return error.message || "Unknown error";
}
