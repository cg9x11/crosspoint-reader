import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

import { resolveAdminAuthState } from "../lib/adminAuth.js";
import { getAppCss, getAppJs, getUiMeta, renderAppPage, renderLoginPage } from "../web/shell.js";

function buildLoginRedirectTarget(request: FastifyRequest) {
  const currentPath = request.url || "/";
  return `/login?next=${encodeURIComponent(currentPath)}`;
}

function requireSession(request: FastifyRequest, reply: FastifyReply) {
  if (!request.sessionUser) {
    reply.redirect(buildLoginRedirectTarget(request));
    return true;
  }

  return false;
}

async function renderProtectedPage(request: FastifyRequest, reply: FastifyReply) {
  if (requireSession(request, reply)) {
    return reply;
  }

  const authState = request.authState ?? (await resolveAdminAuthState(request.server.prisma, request.server.appConfig));

  reply.header("cache-control", "no-store");
  reply.type("text/html; charset=utf-8");
  return renderAppPage({
    user: request.sessionUser || authState.username,
    currentPath: request.url,
    auth: {
      authenticated: true,
      user: request.sessionUser || authState.username,
      username: authState.username,
      mustChangePassword: authState.mustChangePassword,
      bootstrapMode: authState.bootstrapMode,
      bootstrapCredentials: null
    }
  });
}

export async function registerRootRoutes(app: FastifyInstance) {
  app.get("/", async (request, reply) => {
    reply.redirect(request.sessionUser ? "/library" : "/login");
    return reply;
  });

  app.get("/meta", async () => {
    return getUiMeta();
  });

  app.get("/favicon.ico", async (_, reply) => {
    reply.code(204);
    reply.header("cache-control", "public, max-age=86400");
    return reply.send();
  });

  app.get("/assets/app.css", async (_, reply) => {
    reply.type("text/css; charset=utf-8");
    reply.header("cache-control", "public, max-age=300");
    return getAppCss();
  });

  app.get("/assets/app.js", async (_, reply) => {
    reply.type("application/javascript; charset=utf-8");
    reply.header("cache-control", "public, max-age=300");
    return getAppJs();
  });

  app.get("/login", async (request, reply) => {
    if (request.sessionUser) {
      reply.redirect("/library");
      return reply;
    }

    const authState = await resolveAdminAuthState(app.prisma, app.appConfig);
    const nextPath =
      typeof request.query === "object" &&
      request.query &&
      "next" in request.query &&
      typeof request.query.next === "string"
        ? request.query.next
        : "/library";

    reply.header("cache-control", "no-store");
    reply.type("text/html; charset=utf-8");
    return renderLoginPage({
      nextPath,
      auth: {
        authenticated: false,
        user: null,
        username: authState.username,
        mustChangePassword: false,
        bootstrapMode: authState.bootstrapMode,
        bootstrapCredentials: authState.bootstrapCredentials
      }
    });
  });

  app.get("/library", renderProtectedPage);
  app.get("/library/:novelId", renderProtectedPage);
  app.get("/browse", async (request, reply) => {
    if (requireSession(request, reply)) {
      return reply;
    }

    reply.redirect("/sources");
    return reply;
  });
  app.get("/sources", renderProtectedPage);
  app.get("/sources/:sourceId", renderProtectedPage);
  app.get("/translations", renderProtectedPage);
  app.get("/translations/:projectId", renderProtectedPage);
  app.get("/tasks", renderProtectedPage);
  app.get("/extensions", renderProtectedPage);
  app.get("/settings", renderProtectedPage);
}

