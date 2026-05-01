import { load } from "cheerio";

import { fetchText } from "../lib/fetch.js";
import {
  absoluteUrl,
  htmlToPlainText,
  normalizeAsciiLabel,
  normalizeSpace,
  removeLeadingLabel,
  sanitizeHtmlFragment
} from "../lib/text.js";

const BASE_URL = "https://truyenfull.vision";
const HOME_URL = `${BASE_URL}/danh-sach/truyen-moi/`;
const HOME_TTL_MS = 60_000;
const SEARCH_TTL_MS = 60_000;
const DETAIL_TTL_MS = 5 * 60_000;
const TOC_PAGE_TTL_MS = 5 * 60_000;
const CHAPTER_TTL_MS = 2 * 60_000;
const MAX_HOME_ITEMS = 24;
const MAX_SEARCH_ITEMS = 24;

function buildTocPageUrl(inputUrl, page) {
  const base = absoluteUrl(BASE_URL, inputUrl).replace(/#.*$/, "").replace(/\/$/, "");
  if (page <= 1) {
    return `${base}/`;
  }
  return `${base}/trang-${page}/`;
}

function parseListItems(html) {
  const $ = load(html);
  const results = [];
  $("#list-page .list .row").each((_, element) => {
    const row = $(element);
    const titleLink = row.find("h3.truyen-title a").first();
    const title = normalizeSpace(titleLink.text());
    const url = absoluteUrl(BASE_URL, titleLink.attr("href"));
    if (!title || !url) return;

    const author = normalizeSpace(row.find("span.author").first().text());
    const latestChapterTitle = normalizeSpace(row.find(".col-xs-2.text-info a").first().text());
    const coverUrl =
      absoluteUrl(BASE_URL, row.find('[data-classname="cover"]').attr("data-image")) ||
      absoluteUrl(BASE_URL, row.find("img.lazyimg").attr("data-image")) ||
      absoluteUrl(BASE_URL, row.find("img.lazyimg").attr("src"));

    results.push({
      title,
      url,
      description: author ? `Tac gia: ${author}` : "",
      coverUrl,
      homeSectionLabel: "Moi cap nhat",
      homeVolumeTitle: "",
      homeLatestChapterTitle: latestChapterTitle,
      homeDisplaySubtitle: latestChapterTitle || (author ? `Tac gia: ${author}` : "")
    });
  });
  return results;
}

function parseDetail(html, requestedUrl) {
  const $ = load(html);
  const title = normalizeSpace($(".col-info-desc h3.title").first().text()) || normalizeSpace($("h3.title").first().text());
  if (!title) {
    throw new Error("Title not parsed");
  }

  const infoRows = $(".info-holder .info div");
  let author = "";
  let ongoing = true;
  let statusParsed = false;
  infoRows.each((_, element) => {
    const row = $(element);
    const labelText = normalizeSpace(row.find("h3").first().text());
    const label = normalizeAsciiLabel(labelText);
    const valueClone = row.clone();
    valueClone.find("h3").first().remove();
    const value = removeLeadingLabel(valueClone.text(), labelText);
    if (!label || !value) return;
    if (label.includes("tac gia")) {
      author = value;
    }
    if (label.includes("tinh trang")) {
      ongoing = !/hoan|full|completed/i.test(normalizeAsciiLabel(value));
      statusParsed = true;
    }
  });

  const metaDescription = normalizeSpace($('meta[name="description"]').attr("content"));
  if (metaDescription) {
    if (!author) {
      const authorMatch = metaDescription.match(/của tác giả\s+(.+?)(?:,\s+đã|\s+mới|\s+tại|$)/iu);
      if (authorMatch) {
        author = normalizeSpace(authorMatch[1]);
      }
    }
    if (!statusParsed) {
      const normalizedMeta = normalizeAsciiLabel(metaDescription);
      if (normalizedMeta.includes("da full") || normalizedMeta.includes("hoan thanh") || normalizedMeta.includes("completed")) {
        ongoing = false;
        statusParsed = true;
      } else if (
        normalizedMeta.includes("dang tien hanh") ||
        normalizedMeta.includes("dang cap nhat") ||
        normalizedMeta.includes("tiep dien") ||
        normalizedMeta.includes("ongoing")
      ) {
        ongoing = true;
        statusParsed = true;
      }
    }
  }

  const genres = $(".info-holder .info a[itemprop='genre']")
    .map((_, element) => normalizeSpace($(element).text()))
    .get()
    .filter(Boolean);

  const latestLink = $(".l-chapters a").first();
  const latestChapterTitle = normalizeSpace(latestLink.text());
  const latestChapterUrl = absoluteUrl(BASE_URL, latestLink.attr("href"));

  return {
    title,
    url: absoluteUrl(BASE_URL, requestedUrl),
    author,
    coverUrl:
      absoluteUrl(BASE_URL, $(".book img").first().attr("src")) ||
      absoluteUrl(BASE_URL, $('meta[property="og:image"]').attr("content")),
    descriptionHtml:
      sanitizeHtmlFragment($(".desc .desc-text.desc-text-full").first().html()) ||
      sanitizeHtmlFragment($(".desc .desc-text").first().html()),
    latestChapterTitle,
    latestChapterUrl,
    genres,
    ongoing
  };
}

function parseTocPage(html) {
  const $ = load(html);
  const chapters = [];
  $("ul.list-chapter li a").each((index, element) => {
    const link = $(element);
    const title = normalizeSpace(link.text());
    const url = absoluteUrl(BASE_URL, link.attr("href"));
    if (!title || !url) return;
    chapters.push({
      title,
      url,
      sectionTitle: "",
      index: index + 1
    });
  });

  const totalPages = Number($("#total-page").attr("value") || $("#total-page").val() || 1) || 1;
  return {
    totalPages,
    chapters
  };
}

function parseChapter(html, fallbackRef, options) {
  const $ = load(html);
  const container = $("#chapter-c").first();
  const fragment = sanitizeHtmlFragment(container.html());
  if (!fragment) {
    throw new Error("Chapter content not parsed");
  }

  const title =
    normalizeSpace($(".chapter .chapter-title").first().text()) ||
    normalizeSpace($("title").first().text()) ||
    fallbackRef.title;

  return {
    ref: {
      title,
      url: absoluteUrl(BASE_URL, fallbackRef.url),
      sectionTitle: fallbackRef.sectionTitle || "",
      index: Number(fallbackRef.index || 0)
    },
    html: options.includeHtml ? fragment : "",
    text: options.includeText ? htmlToPlainText(fragment) : ""
  };
}

async function fetchHtmlCached(cache, key, ttlMs, url) {
  return cache.remember(key, ttlMs, () => fetchText(url));
}

export const truyenFullSource = {
  async home({ cache }) {
    const html = await fetchHtmlCached(cache, "truyenfull:home", HOME_TTL_MS, HOME_URL);
    return parseListItems(html).slice(0, MAX_HOME_ITEMS);
  },

  async search(query, page, { cache }) {
    const safePage = Math.max(1, Number(page || 1));
    const url = `${BASE_URL}/tim-kiem/?tukhoa=${encodeURIComponent(query)}&paged=${safePage}`;
    const html = await fetchHtmlCached(cache, `truyenfull:search:${query}:${safePage}`, SEARCH_TTL_MS, url);
    return parseListItems(html).slice(0, MAX_SEARCH_ITEMS);
  },

  async detail(url, { cache }) {
    const resolvedUrl = absoluteUrl(BASE_URL, url);
    const html = await fetchHtmlCached(cache, `truyenfull:detail:${resolvedUrl}`, DETAIL_TTL_MS, resolvedUrl);
    return parseDetail(html, resolvedUrl);
  },

  async tocPage(url, page, { cache }) {
    const safePage = Math.max(1, Number(page || 1));
    const pageUrl = buildTocPageUrl(url, safePage);
    const html = await fetchHtmlCached(cache, `truyenfull:tocpage:${pageUrl}`, TOC_PAGE_TTL_MS, pageUrl);
    const parsed = parseTocPage(html);
    if (!parsed.chapters.length) {
      throw new Error("No chapters parsed");
    }
    return {
      page: safePage,
      totalPages: parsed.totalPages,
      chapters: parsed.chapters.map((chapter, index) => ({
        ...chapter,
        index: (safePage - 1) * parsed.chapters.length + index + 1
      }))
    };
  },

  async toc(url, context) {
    const firstPage = await this.tocPage(url, 1, context);
    const chapters = [...firstPage.chapters];
    for (let page = 2; page <= firstPage.totalPages; page += 1) {
      const currentPage = await this.tocPage(url, page, context);
      chapters.push(...currentPage.chapters);
    }
    return chapters.map((chapter, index) => ({
      ...chapter,
      index: index + 1
    }));
  },

  async chapter(ref, options, { cache }) {
    const resolvedUrl = absoluteUrl(BASE_URL, ref.url);
    const html = await fetchHtmlCached(
      cache,
      `truyenfull:chapter:${resolvedUrl}:text=${options.includeText ? 1 : 0}:html=${options.includeHtml ? 1 : 0}`,
      CHAPTER_TTL_MS,
      resolvedUrl
    );
    return parseChapter(html, { ...ref, url: resolvedUrl }, options);
  },

  parseListItems,
  parseDetail,
  parseTocPage,
  parseChapter
};
