import { load as loadHtml } from "cheerio";
import iconv from "iconv-lite";

import { stableId } from "../lib/filesystem.js";
import { fetchBuffer } from "../lib/http.js";

import type {
  SourceChapterContentPayload,
  SourceChapterPayload,
  SourceDetailPayload,
  SourceHandler,
  SourceHomeItem,
  SourceHomePayload,
  SourceListItem,
  SourceSearchPayload
} from "./types.js";

export const SYOSETU_SOURCE_ID = "sys:syosetu";

const SYOSETU_NOVEL_HOST = "ncode.syosetu.com";
const SYOSETU_SEARCH_URL = "https://yomou.syosetu.com/search.php";

function parseCharset(html: string) {
  const metaCharset = html.match(/<meta[^>]+charset=["']?([^\s"'>]+)/i)?.[1];
  if (metaCharset) {
    return metaCharset.trim().toLowerCase();
  }

  const contentCharset = html.match(/<meta[^>]+content=["'][^"']*charset=([^\s"'>;]+)/i)?.[1];
  if (contentCharset) {
    return contentCharset.trim().toLowerCase();
  }

  return null;
}

async function fetchHtml(url: string) {
  const buffer = await fetchBuffer(url);
  const sniffed = buffer.subarray(0, 2048).toString("latin1");
  const charset = parseCharset(sniffed);

  if (charset && charset !== "utf-8" && charset !== "utf8") {
    return iconv.decode(buffer, charset);
  }

  return buffer.toString("utf8");
}

function ensureAbsoluteUrl(input: string, base = `https://${SYOSETU_NOVEL_HOST}/`) {
  return new URL(input, base).toString();
}

function isSyosetuNovelUrl(value: string) {
  try {
    const url = new URL(String(value || "").trim());
    return /(^|\.)syosetu\.com$/i.test(url.hostname) && /^\/n[0-9a-z]+(?:\/)?$/i.test(url.pathname);
  } catch {
    return false;
  }
}

function isSyosetuChapterUrl(value: string) {
  try {
    const url = new URL(String(value || "").trim());
    return /(^|\.)syosetu\.com$/i.test(url.hostname) && /^\/n[0-9a-z]+\/\d+(?:\/)?$/i.test(url.pathname);
  } catch {
    return false;
  }
}

function normalizeNovelUrl(input: string) {
  const url = new URL(ensureAbsoluteUrl(input));
  const match = url.pathname.match(/^\/(n[0-9a-z]+)(?:\/\d+)?/i);
  if (!match) {
    throw new Error("URL Syosetu không hợp lệ");
  }

  const novelCode = match[1];
  if (!novelCode) {
    throw new Error("URL Syosetu không hợp lệ");
  }

  return `https://${SYOSETU_NOVEL_HOST}/${novelCode.toLowerCase()}/`;
}

function collapseText(value?: string | null) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function toStatusLabel(value: string) {
  const normalized = collapseText(value).toLowerCase();
  if (!normalized) {
    return "unknown";
  }
  if (normalized.includes("完結") || normalized.includes("completed")) {
    return "completed";
  }
  if (normalized.includes("連載") || normalized.includes("serial") || normalized.includes("ongoing")) {
    return "ongoing";
  }
  return normalized;
}

function parseNovelDetail(html: string, source: Pick<SourceListItem, "id" | "name" | "description" | "runtimeSupported">) {
  const $ = loadHtml(html);
  const title = collapseText($(".p-novel__title").first().text() || $("h1").first().text());
  const author = collapseText($(".p-novel__author a, .novel_writername a, .novel_writername").first().text());
  const description =
    $("#novel_ex").html()?.trim() || $(".p-novel__summary").html()?.trim() || "";
  const genres = Array.from(
    new Set(
      $(".p-keyword a, .keyword a, .novel_keyword a")
        .toArray()
        .map((item) => collapseText($(item).text()))
        .filter(Boolean)
    )
  );
  const statusText = collapseText($(".p-infotop__type, .noveltype").first().text());

  return {
    source,
    title,
    author,
    description,
    genres,
    status: toStatusLabel(statusText)
  };
}

function parseNovelChapters(html: string, offset = 0): SourceChapterPayload[] {
  const $ = loadHtml(html);
  return $("a.p-eplist__subtitle")
    .toArray()
    .map((item, index) => ({
      chapterIndex: offset + index + 1,
      title: collapseText($(item).text()) || `Chapter ${offset + index + 1}`,
      sourceUrl: ensureAbsoluteUrl($(item).attr("href") || "")
    }))
    .filter((item) => Boolean(item.sourceUrl));
}

function parseNovelLastPage(html: string, sourceUrl: string) {
  const $ = loadHtml(html);
  let maxPage = 1;
  $("a[href]").each((_, item) => {
    const href = collapseText($(item).attr("href"));
    if (!href) {
      return;
    }
    try {
      const url = new URL(ensureAbsoluteUrl(href, sourceUrl));
      const pageValue = Number(url.searchParams.get("p") || "1");
      if (Number.isFinite(pageValue) && pageValue > maxPage) {
        maxPage = pageValue;
      }
    } catch {
      // ignore invalid links
    }
  });
  return maxPage;
}

function parseSearchItems(html: string): SourceHomeItem[] {
  const $ = loadHtml(html);
  const items: SourceHomeItem[] = [];

  $(".searchkekka_box")
    .toArray()
    .forEach((item) => {
      const link = $(item).find("a").filter((_, element) => isSyosetuNovelUrl(ensureAbsoluteUrl($(element).attr("href") || "https://example.com"))).first();
      const detailUrl = collapseText(link.attr("href")) ? ensureAbsoluteUrl(link.attr("href") || "") : "";
      const title = collapseText(link.text());
      const author = collapseText($(item).find(".novel_writername, .searchkekka_author").first().text());
      const description = collapseText($(item).find(".ex, .novel_honbun, .searchkekka_box .keyword").first().text());
      const status = collapseText($(item).find(".noveltype").first().text());

      if (!detailUrl || !title) {
        return;
      }

      items.push({
        id: stableId("syosetu-search", detailUrl),
        title,
        author: author || undefined,
        description: description || undefined,
        status: toStatusLabel(status),
        detailUrl
      });
    });

  return items;
}

function parseNextSearchPage(html: string) {
  const $ = loadHtml(html);
  const nextLink = $("a").filter((_, item) => /次へ/i.test($(item).text())).first();
  const href = collapseText(nextLink.attr("href"));
  if (!href) {
    return null;
  }

  try {
    const url = new URL(ensureAbsoluteUrl(href, SYOSETU_SEARCH_URL));
    return url.searchParams.get("p") || null;
  } catch {
    return null;
  }
}

export function createSyosetuSourceDefinition(): SourceListItem {
  return {
    id: SYOSETU_SOURCE_ID,
    name: "Syosetu",
    trustType: "core",
    version: "1.0.0",
    systemSource: true,
    enabled: true,
    runtimeKind: "builtin",
    runtimeSupported: true,
    description: "Crawler native cho syosetu.com / yomou.syosetu.com",
    sourceUrl: `https://${SYOSETU_NOVEL_HOST}/`,
    author: "system",
    locale: "ja-JP",
    type: "novel",
    installedAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
    lastError: null,
    registryId: "system",
    registryName: "System",
    supportsHome: false,
    supportsSearch: true,
    supportsGenre: false,
    supportsPagination: true,
    supportsDetailDescription: true,
    supportsBrowserAutomation: false
  };
}

export function createSyosetuSourceHandler(source = createSyosetuSourceDefinition()): SourceHandler {
  const baseSource = {
    id: source.id,
    name: source.name,
    description: source.description,
    runtimeSupported: source.runtimeSupported
  } as const;

  return {
    async home(): Promise<SourceHomePayload> {
      return {
        source: baseSource,
        sections: [],
        warning: "Syosetu chưa có home feed. Dùng ô tìm kiếm hoặc dán full URL truyện."
      };
    },

    async search(query: string, page?: string): Promise<SourceSearchPayload> {
      const normalizedQuery = String(query || "").trim();
      if (!normalizedQuery) {
        return {
          source: baseSource,
          query: "",
          page: page || null,
          nextPage: null,
          items: []
        };
      }

      if (isSyosetuNovelUrl(normalizedQuery)) {
        const detailUrl = normalizeNovelUrl(normalizedQuery);
        const detail = await this.detail(detailUrl);
        return {
          source: baseSource,
          query: normalizedQuery,
          page: null,
          nextPage: null,
          items: [
            {
              id: detail.id,
              title: detail.title,
              author: detail.author,
              description: collapseText(detail.description),
              status: detail.status,
              detailUrl: detail.sourceUrl
            }
          ]
        };
      }

      const params = new URLSearchParams();
      params.set("word", normalizedQuery);
      if (page) {
        params.set("p", page);
      }

      const html = await fetchHtml(`${SYOSETU_SEARCH_URL}?${params.toString()}`);
      return {
        source: baseSource,
        query: normalizedQuery,
        page: page || "1",
        nextPage: parseNextSearchPage(html),
        items: parseSearchItems(html)
      };
    },

    async detail(detailUrl: string): Promise<SourceDetailPayload> {
      const sourceUrl = normalizeNovelUrl(detailUrl);
      const html = await fetchHtml(sourceUrl);
      const parsed = parseNovelDetail(html, baseSource);
      return {
        id: stableId(source.id, sourceUrl),
        sourceId: source.id,
        title: parsed.title || sourceUrl,
        author: parsed.author || undefined,
        description: parsed.description || undefined,
        status: parsed.status,
        genres: parsed.genres,
        sourceUrl
      };
    },

    async chapters(detailUrl: string): Promise<SourceChapterPayload[]> {
      const sourceUrl = normalizeNovelUrl(detailUrl);
      const firstHtml = await fetchHtml(sourceUrl);
      const lastPage = parseNovelLastPage(firstHtml, sourceUrl);
      const chapters: SourceChapterPayload[] = [];
      const seen = new Set<string>();

      for (let pageIndex = 1; pageIndex <= lastPage; pageIndex += 1) {
        const pageUrl = pageIndex === 1 ? sourceUrl : `${sourceUrl}?p=${pageIndex}`;
        const html = pageIndex === 1 ? firstHtml : await fetchHtml(pageUrl);
        for (const chapter of parseNovelChapters(html, chapters.length)) {
          if (seen.has(chapter.sourceUrl)) {
            continue;
          }
          seen.add(chapter.sourceUrl);
          chapters.push({
            ...chapter,
            chapterIndex: chapters.length + 1
          });
        }
      }

      return chapters;
    },

    async chapterContent(chapterUrl: string): Promise<SourceChapterContentPayload> {
      if (!isSyosetuChapterUrl(chapterUrl)) {
        throw new Error("URL chapter Syosetu không hợp lệ");
      }

      const html = await fetchHtml(chapterUrl);
      const $ = loadHtml(html);
      const title = collapseText($(".p-novel__title").first().text() || $("h1").first().text()) || "Chapter";
      const body =
        $(".js-novel-text.p-novel__text").html()?.trim() ||
        $(".p-novel__text").html()?.trim() ||
        $("#novel_honbun").html()?.trim() ||
        "";

      if (!body) {
        throw new Error("Không lấy được nội dung chapter từ Syosetu");
      }

      return {
        title,
        html: `<h1>${title}</h1>${body}`
      };
    }
  };
}
