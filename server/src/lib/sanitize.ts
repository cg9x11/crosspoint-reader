import sanitizeHtml from "sanitize-html";

export function sanitizeHtmlFragment(html: string) {
  return sanitizeHtml(html, {
    allowedTags: [
      "a",
      "article",
      "b",
      "blockquote",
      "br",
      "code",
      "div",
      "em",
      "h1",
      "h2",
      "h3",
      "hr",
      "i",
      "img",
      "li",
      "ol",
      "p",
      "pre",
      "section",
      "span",
      "strong",
      "sub",
      "sup",
      "u",
      "ul"
    ],
    allowedAttributes: {
      a: ["href", "title"],
      img: ["alt", "src", "title"],
      "*": ["class"]
    },
    allowedSchemes: ["http", "https", "data"],
    selfClosing: ["br", "hr", "img"],
    parseStyleAttributes: false
  });
}

export function stripHtmlToText(html: string) {
  return sanitizeHtml(html, {
    allowedTags: [],
    allowedAttributes: {}
  })
    .replace(/\s+/g, " ")
    .trim();
}

export function stripHtmlToReadableText(html: string) {
  const normalizedHtml = html
    .replace(/<\s*br\s*\/?\s*>/gi, "\n")
    .replace(/<\s*hr\s*\/?\s*>/gi, "\n\n")
    .replace(/<\s*li\b[^>]*>/gi, "\n- ")
    .replace(/<\/\s*(p|div|section|article|blockquote|h1|h2|h3|h4|h5|h6|ul|ol|pre)\s*>/gi, "\n\n");

  return sanitizeHtml(normalizedHtml, {
    allowedTags: [],
    allowedAttributes: {}
  })
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

export function stripLeadingSourceFilename(text: string) {
  const lines = String(text || "").split(/\r?\n/);
  while (lines.length && !lines[0]?.trim()) {
    lines.shift();
  }

  const firstLine = lines[0]?.trim() || "";
  if (/^[^\s\\/:*?"<>|]+\.html$/i.test(firstLine)) {
    lines.shift();
    while (lines.length && !lines[0]?.trim()) {
      lines.shift();
    }
  }

  return lines.join("\n");
}
