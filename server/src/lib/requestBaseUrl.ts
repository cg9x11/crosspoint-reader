import type { FastifyRequest } from "fastify";

function firstHeaderValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0]?.split(",")[0]?.trim() ?? "";
  }
  return value?.split(",")[0]?.trim() ?? "";
}

function parseForwardedParam(headerValue: string, key: string) {
  if (!headerValue) {
    return "";
  }

  for (const segment of headerValue.split(",")) {
    for (const pair of segment.split(";")) {
      const [rawName, rawValue] = pair.split("=");
      if (!rawName || !rawValue) {
        continue;
      }
      if (rawName.trim().toLowerCase() !== key) {
        continue;
      }
      return rawValue.trim().replace(/^"|"$/g, "");
    }
  }

  return "";
}

export function resolvePublicBaseUrl(request: FastifyRequest, fallbackBaseUrl: string) {
  const fallback = new URL(fallbackBaseUrl);
  const forwarded = firstHeaderValue(request.headers.forwarded);
  const forwardedHost = parseForwardedParam(forwarded, "host");
  const forwardedProto = parseForwardedParam(forwarded, "proto");
  const cfVisitor = firstHeaderValue(request.headers["cf-visitor"]);
  let cfProto = "";
  if (cfVisitor) {
    try {
      const parsed = JSON.parse(cfVisitor) as { scheme?: string };
      cfProto = typeof parsed.scheme === "string" ? parsed.scheme.trim() : "";
    } catch {
      cfProto = "";
    }
  }
  const host = forwardedHost || firstHeaderValue(request.headers["x-forwarded-host"]) || request.host || fallback.host;
  const fallbackProto = fallback.protocol.replace(/:$/, "");
  const preferredProto = host === fallback.host ? fallbackProto : "";
  const proto =
    preferredProto ||
    forwardedProto ||
    firstHeaderValue(request.headers["x-forwarded-proto"]) ||
    cfProto ||
    request.protocol ||
    fallbackProto;

  try {
    return new URL(`${proto}://${host}`).toString().replace(/\/$/, "");
  } catch {
    return fallback.origin;
  }
}
