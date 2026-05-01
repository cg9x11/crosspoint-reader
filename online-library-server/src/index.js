import Fastify from "fastify";

import { createCache } from "./lib/cache.js";
import { fetchBinary } from "./lib/fetch.js";
import { shortError } from "./lib/text.js";
import { getSource, sourceCatalog, sources } from "./sources/index.js";

const host = process.env.HOST || "0.0.0.0";
const port = Number(process.env.PORT || 8787);
const cache = createCache(Number(process.env.CACHE_MAX_ITEMS || 256));
const app = Fastify({
  logger: true
});

function sendOk(reply, payload) {
  reply.code(200).send({
    ok: true,
    ...payload
  });
}

function sendError(reply, error) {
  reply.code(200).send({
    ok: false,
    error: shortError(error)
  });
}

function requireSource(profile) {
  const source = getSource(profile);
  if (!source) {
    throw new Error("Unsupported source profile");
  }
  return source;
}

function chapterRefFromQuery(query) {
  return {
    title: query.title || "",
    url: query.url || "",
    sectionTitle: query.sectionTitle || "",
    index: Number(query.index || 0)
  };
}

function includeFlag(value, fallback) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }
  return value === "1" || value === "true" || value === true;
}

function oneLine(value) {
  return String(value || "").replace(/\r?\n/g, " ").trim();
}

function sendRawChapter(reply, chapter, options) {
  const mode = options.includeText ? "text" : "html";
  const payload = options.includeText ? String(chapter.text || "") : String(chapter.html || "");
  const ref = chapter.ref || {};
  const wire = [
    "CPCH1",
    mode,
    oneLine(ref.url || chapter.url || ""),
    oneLine(ref.title || chapter.title || ""),
    oneLine(ref.sectionTitle || ""),
    String(Number.isFinite(ref.index) ? ref.index : 0),
    "",
    payload
  ].join("\n");

  reply.header("content-type", "text/plain; charset=utf-8");
  reply.code(200).send(wire);
}

app.get("/health", async (_request, reply) => {
  sendOk(reply, {
    service: "crosspoint-online-library",
    profiles: Object.keys(sources),
    uptimeSec: Math.round(process.uptime())
  });
});

app.get("/api/v1/sources", async (_request, reply) => {
  sendOk(reply, {
    sources: sourceCatalog
  });
});

app.get("/api/v1/source/:profile/asset", async (request, reply) => {
  try {
    requireSource(request.params.profile);
    const url = String(request.query.url || "").trim();
    if (!url) {
      reply.code(400).type("text/plain; charset=utf-8").send("Missing url");
      return;
    }

    const asset = await fetchBinary(url);
    reply.header("cache-control", "public, max-age=900");
    reply.type(asset.contentType);
    reply.code(200).send(asset.body);
  } catch (error) {
    reply.code(502).type("text/plain; charset=utf-8").send(shortError(error));
  }
});

app.get("/api/v1/source/:profile/home", async (request, reply) => {
  try {
    const source = requireSource(request.params.profile);
    const items = await source.home({ cache });
    sendOk(reply, { items });
  } catch (error) {
    sendError(reply, error);
  }
});

app.get("/api/v1/source/:profile/search", async (request, reply) => {
  try {
    const source = requireSource(request.params.profile);
    const query = String(request.query.query || "").trim();
    if (query.length < 1) {
      throw new Error("Missing query");
    }
    const page = Number(request.query.page || 1);
    const items = await source.search(query, page, { cache });
    sendOk(reply, { items });
  } catch (error) {
    sendError(reply, error);
  }
});

app.get("/api/v1/source/:profile/detail", async (request, reply) => {
  try {
    const source = requireSource(request.params.profile);
    const url = String(request.query.url || "").trim();
    if (!url) {
      throw new Error("Missing url");
    }
    const detail = await source.detail(url, { cache });
    sendOk(reply, detail);
  } catch (error) {
    sendError(reply, error);
  }
});

app.get("/api/v1/source/:profile/toc-page", async (request, reply) => {
  try {
    const source = requireSource(request.params.profile);
    const url = String(request.query.url || "").trim();
    if (!url) {
      throw new Error("Missing url");
    }
    const page = Number(request.query.page || 1);
    const result = await source.tocPage(url, page, { cache });
    sendOk(reply, result);
  } catch (error) {
    sendError(reply, error);
  }
});

app.get("/api/v1/source/:profile/toc", async (request, reply) => {
  try {
    const source = requireSource(request.params.profile);
    const url = String(request.query.url || "").trim();
    if (!url) {
      throw new Error("Missing url");
    }
    const chapters = await source.toc(url, { cache });
    sendOk(reply, { chapters });
  } catch (error) {
    sendError(reply, error);
  }
});

app.get("/api/v1/source/:profile/chapter", async (request, reply) => {
  try {
    const source = requireSource(request.params.profile);
    const ref = chapterRefFromQuery(request.query);
    if (!ref.url) {
      throw new Error("Missing url");
    }
    const options = {
      includeText: includeFlag(request.query.text, true),
      includeHtml: includeFlag(request.query.html, true)
    };
    const chapter = await source.chapter(ref, options, { cache });
    if (String(request.query.format || "").trim().toLowerCase() === "raw" &&
        (options.includeText !== options.includeHtml)) {
      sendRawChapter(reply, chapter, options);
      return;
    }
    sendOk(reply, chapter);
  } catch (error) {
    sendError(reply, error);
  }
});

await app.listen({ host, port });
