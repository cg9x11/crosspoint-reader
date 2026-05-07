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
