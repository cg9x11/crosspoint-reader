import { load } from "cheerio";

import { fetchText } from "../lib/fetch.js";
import {
  absoluteUrl,
  extractStyleUrl,
  htmlToPlainText,
  normalizeAsciiLabel,
  normalizeSpace,
  removeLeadingLabel,
  sanitizeHtmlFragment
} from "../lib/text.js";

const BASE_URL = "https://docln.sbs";
const HOME_URL = `${BASE_URL}/danh-sach`;
const HOME_TTL_MS = 60_000;
const SEARCH_TTL_MS = 60_000;
const DETAIL_TTL_MS = 5 * 60_000;
const TOC_TTL_MS = 5 * 60_000;
const CHAPTER_TTL_MS = 2 * 60_000;
const MAX_HOME_ITEMS = 24;
const MAX_SEARCH_ITEMS = 24;
const TOC_PAGE_SIZE = 50;

function buildSubtitle(volumeTitle, latestChapterTitle) {
  return [volumeTitle, latestChapterTitle].filter(Boolean).join(" | ");
}

function getCoverUrl($item) {
  const cover = $item.find(".content.img-in-ratio").first();
  return (
    absoluteUrl(BASE_URL, cover.attr("data-bg")) ||
    absoluteUrl(BASE_URL, extractStyleUrl(cover.attr("style")))
  );
}

function parseThumbItems(html) {
  const $ = load(html);
  const results = [];

  $("div.thumb-item-flow").each((_, element) => {
    const item = $(element);
    const titleLink = item.find(".thumb_attr.series-title a").first();
    const latestLink = item.find(".thumb_attr.chapter-title a").first();
    const volumeTitle = normalizeSpace(item.find(".thumb_attr.volume-title").first().text());
    const latestChapterTitle = normalizeSpace(latestLink.text());
    const title = normalizeSpace(titleLink.text());
    const url = absoluteUrl(BASE_URL, titleLink.attr("href"));
    if (!title || !url) return;

    const subtitle = buildSubtitle(volumeTitle, latestChapterTitle);
    results.push({
      title,
      url,
      description: subtitle,
      coverUrl: getCoverUrl(item),
      homeSectionLabel: "",
      homeVolumeTitle: volumeTitle,
      homeLatestChapterTitle: latestChapterTitle,
      homeDisplaySubtitle: subtitle
    });
  });

  return results;
}

function parseDetail(html, requestedUrl) {
  const $ = load(html);
  const title =
    normalizeSpace($(".series-name a").first().text()) ||
    normalizeSpace($(".series-name").first().text());
  if (!title) {
    throw new Error("Title not parsed");
  }

  const coverNode = $(".series-cover .content.img-in-ratio").first();
  const descriptionHtml = sanitizeHtmlFragment($(".summary-content").first().html());
  const genres = $(".series-gerne-item")
    .map((_, element) => normalizeSpace($(element).text()))
    .get()
    .filter(Boolean);

  let author = "";
  let ongoing = true;
  $(".info-item").each((_, element) => {
    const item = $(element);
    const labelText = normalizeSpace(item.find(".info-name").first().text());
    const label = normalizeAsciiLabel(labelText);
    const valueNode = item.find(".info-value").first();
    const value = valueNode.length ? normalizeSpace(valueNode.text()) : removeLeadingLabel(item.text(), labelText);
    if (!label || !value) return;
    if (label.includes("tac gia")) {
      author = value;
    }
    if (label.includes("tinh trang")) {
      ongoing = !/hoan|full|completed/i.test(normalizeAsciiLabel(value));
    }
  });

  const latestLink = $(".list-chapters.at-series li .chapter-name a").last();
  return {
    title,
    url: absoluteUrl(BASE_URL, requestedUrl),
    author,
    coverUrl:
      absoluteUrl(BASE_URL, coverNode.attr("data-bg")) ||
      absoluteUrl(BASE_URL, extractStyleUrl(coverNode.attr("style"))),
    descriptionHtml,
    latestChapterTitle: normalizeSpace(latestLink.text()),
    latestChapterUrl: absoluteUrl(BASE_URL, latestLink.attr("href")),
    genres,
    ongoing
  };
}

function parseToc(html) {
  const $ = load(html);
  const chapters = [];
  let index = 1;

  $(".volume-list.at-series").each((_, volumeElement) => {
    const volume = $(volumeElement);
    const sectionTitle = normalizeSpace(volume.find(".sect-title").first().text());
    volume.find("ul.list-chapters.at-series li .chapter-name a").each((_, chapterElement) => {
      const chapter = $(chapterElement);
      const title = normalizeSpace(chapter.text());
      const url = absoluteUrl(BASE_URL, chapter.attr("href"));
      if (!title || !url) return;
      chapters.push({
        title,
        url,
        sectionTitle,
        index: index++
      });
    });
  });

  return chapters;
}

function xorDecodeBase64(encoded, key) {
  const decoded = Buffer.from(encoded, "base64");
  if (!key) {
    return decoded.toString("utf8");
  }
  const keyBytes = Buffer.from(key, "utf8");
  const out = Buffer.alloc(decoded.length);
  for (let index = 0; index < decoded.length; index += 1) {
    out[index] = decoded[index] ^ keyBytes[index % keyBytes.length];
  }
  return out.toString("utf8");
}

function decodeProtectedContent($container) {
  const protectedNode = $container.find("#chapter-c-protected").first();
  if (!protectedNode.length) {
    return $container;
  }

  const mode = protectedNode.attr("data-s") || "";
  const key = protectedNode.attr("data-k") || "";
  let chunks = [];
  try {
    chunks = JSON.parse(protectedNode.attr("data-c") || "[]");
  } catch {
    chunks = [];
  }

  if (!Array.isArray(chunks) || chunks.length === 0) {
    return $container;
  }

  chunks.sort((left, right) => Number.parseInt(String(left).slice(0, 4), 10) - Number.parseInt(String(right).slice(0, 4), 10));
  let content = "";
  for (const chunk of chunks) {
    const value = String(chunk);
    const payload = value.length > 4 ? value.slice(4) : "";
    content += mode === "xor_shuffle" ? xorDecodeBase64(payload, key) : Buffer.from(payload, "base64").toString("utf8");
  }

  protectedNode.replaceWith(content);
  return $container;
}

function parseChapter(html, fallbackRef, options) {
  const $ = load(html);
  const container = $("#chapter-content").first().length ? $("#chapter-content").first() : $("#chapter-c-protected").first();
  const working = decodeProtectedContent(container.clone());
  working.find('p[style*="display: none"]').remove();
  const fragment = sanitizeHtmlFragment(working.html());
  if (!fragment) {
    throw new Error("Chapter content not parsed");
  }

  const title =
    fallbackRef.title ||
    normalizeSpace($(".chapter-title").first().text()) ||
    normalizeSpace($("title").first().text());

  let text = options.includeText ? htmlToPlainText(fragment) : "";
  if (options.includeText && !text) {
    const imageCount = working.find("img").length;
    if (imageCount > 0) {
      text = imageCount === 1 ? "[Illustration only]" : `[Illustration only: ${imageCount} images]`;
    }
  }

  return {
    ref: {
      title,
      url: absoluteUrl(BASE_URL, fallbackRef.url),
      sectionTitle: fallbackRef.sectionTitle || "",
      index: Number(fallbackRef.index || 0)
    },
    html: options.includeHtml ? fragment : "",
    text
  };
}

async function fetchHtmlCached(cache, key, ttlMs, url) {
  return cache.remember(key, ttlMs, () => fetchText(url));
}

export const hakoSource = {
  async home({ cache }) {
    const html = await fetchHtmlCached(cache, "hako:home", HOME_TTL_MS, HOME_URL);
    return parseThumbItems(html).slice(0, MAX_HOME_ITEMS);
  },

  async search(query, page, { cache }) {
    const safePage = Math.max(1, Number(page || 1));
    const url = `${BASE_URL}/tim-kiem?keywords=${encodeURIComponent(query)}&page=${safePage}`;
    const html = await fetchHtmlCached(cache, `hako:search:${query}:${safePage}`, SEARCH_TTL_MS, url);
    return parseThumbItems(html).slice(0, MAX_SEARCH_ITEMS);
  },

  async detail(url, { cache }) {
    const resolvedUrl = absoluteUrl(BASE_URL, url);
    const html = await fetchHtmlCached(cache, `hako:detail:${resolvedUrl}`, DETAIL_TTL_MS, resolvedUrl);
    return parseDetail(html, resolvedUrl);
  },

  async toc(url, { cache }) {
    const resolvedUrl = absoluteUrl(BASE_URL, url);
    const html = await fetchHtmlCached(cache, `hako:toc:${resolvedUrl}`, TOC_TTL_MS, resolvedUrl);
    const chapters = parseToc(html);
    if (!chapters.length) {
      throw new Error("No chapters parsed");
    }
    return chapters;
  },

  async tocPage(url, page, context) {
    const chapters = await this.toc(url, context);
    const safePage = Math.max(1, Number(page || 1));
    const totalPages = Math.max(1, Math.ceil(chapters.length / TOC_PAGE_SIZE));
    const pageStart = (safePage - 1) * TOC_PAGE_SIZE;
    const pageItems = chapters.slice(pageStart, pageStart + TOC_PAGE_SIZE);
    return {
      page: safePage,
      totalPages,
      chapters: pageItems
    };
  },

  async chapter(ref, options, { cache }) {
    const resolvedUrl = absoluteUrl(BASE_URL, ref.url);
    const html = await fetchHtmlCached(
      cache,
      `hako:chapter:${resolvedUrl}:text=${options.includeText ? 1 : 0}:html=${options.includeHtml ? 1 : 0}`,
      CHAPTER_TTL_MS,
      resolvedUrl
    );
    return parseChapter(html, { ...ref, url: resolvedUrl }, options);
  },

  parseThumbItems,
  parseDetail,
  parseToc,
  parseChapter
};
