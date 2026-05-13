import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

import { z } from "zod";

import {
  createSessionToken,
  getSessionCookieName,
  verifyAdminPassword
} from "../../lib/auth.js";
import {
  persistAdminCredentials,
  resolveAdminAuthState,
  type AdminAuthState
} from "../../lib/adminAuth.js";

const loginSchema = z.object({
  username: z.string().trim().min(1, "Vui lòng nhập tên đăng nhập."),
  password: z.string().min(1, "Vui lòng nhập mật khẩu.")
});

const changePasswordSchema = z.object({
  username: z.string().trim().min(3, "Tên đăng nhập admin phải có ít nhất 3 ký tự.").max(64),
  currentPassword: z.string().min(1, "Vui lòng nhập mật khẩu hiện tại."),
  newPassword: z.string().min(8, "Mật khẩu mới phải có ít nhất 8 ký tự.").max(256)
});

function validationErrorMessage(result: z.SafeParseError<unknown>) {
  return result.error.issues[0]?.message || "Dữ liệu gửi lên không hợp lệ.";
}

function setSessionCookie(app: FastifyInstance, request: FastifyRequest, reply: FastifyReply, username: string) {
  const sessionToken = createSessionToken(username, app.appConfig.SESSION_SECRET);
  const forwardedProto = request.headers["x-forwarded-proto"];
  const forwardedProtoValue = Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto;
  const secureCookie =
    request.protocol === "https" ||
    forwardedProtoValue === "https";

  reply.setCookie(getSessionCookieName(), sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: secureCookie,
    maxAge: 7 * 24 * 60 * 60
  });
}

function buildSessionPayload(authState: AdminAuthState, authenticatedUser: string | null) {
  return {
    authenticated: Boolean(authenticatedUser),
    user: authenticatedUser,
    username: authState.username,
    mustChangePassword: Boolean(authenticatedUser && authState.mustChangePassword),
    bootstrapMode: authState.bootstrapMode,
    bootstrapCredentials: authenticatedUser ? null : authState.bootstrapCredentials
  };
}

export async function registerAuthApiRoutes(app: FastifyInstance) {
  app.post("/api/auth/login", async (request, reply) => {
    const parsedBody = loginSchema.safeParse(request.body);
    if (!parsedBody.success) {
      reply.code(400);
      return {
        ok: false,
        error: "VALIDATION_ERROR",
        message: validationErrorMessage(parsedBody)
      };
    }

    const body = parsedBody.data;
    const authState = await resolveAdminAuthState(app.prisma, app.appConfig);
    const usernameMatches = body.username === authState.username;
    const passwordMatches = verifyAdminPassword(body.password, authState.passwordHash);

    if (!usernameMatches || !passwordMatches) {
      reply.code(401);
      return {
        ok: false,
        error: "INVALID_CREDENTIALS",
        message: "Sai tên đăng nhập hoặc mật khẩu."
      };
    }

    setSessionCookie(app, request, reply, authState.username);

    return {
      ok: true,
      user: authState.username,
      mustChangePassword: authState.mustChangePassword,
      message: authState.mustChangePassword
        ? "Đăng nhập thành công. Hãy đổi mật khẩu admin trước khi sử dụng bảng điều khiển."
        : "Đăng nhập thành công.",
      session: buildSessionPayload(authState, authState.username)
    };
  });

  app.post("/api/auth/logout", async (_, reply) => {
    reply.clearCookie(getSessionCookieName(), { path: "/" });
    return { ok: true };
  });

  app.post("/api/auth/change-password", async (request, reply) => {
    const parsedBody = changePasswordSchema.safeParse(request.body);
    if (!parsedBody.success) {
      reply.code(400);
      return {
        ok: false,
        error: "VALIDATION_ERROR",
        message: validationErrorMessage(parsedBody)
      };
    }

    const body = parsedBody.data;
    const authState = request.authState ?? (await resolveAdminAuthState(app.prisma, app.appConfig));

    if (!request.sessionUser || request.sessionUser !== authState.username) {
      reply.code(401);
      return {
        ok: false,
        error: "UNAUTHORIZED",
        message: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."
      };
    }

    if (!verifyAdminPassword(body.currentPassword, authState.passwordHash)) {
      reply.code(401);
      return {
        ok: false,
        error: "INVALID_CREDENTIALS",
        message: "Mật khẩu hiện tại không đúng."
      };
    }

    if (verifyAdminPassword(body.newPassword, authState.passwordHash)) {
      reply.code(400);
      return {
        ok: false,
        error: "PASSWORD_REUSE_NOT_ALLOWED",
        message: "Hãy chọn mật khẩu mới khác với mật khẩu hiện tại."
      };
    }

    await persistAdminCredentials(app.prisma, {
      username: body.username,
      password: body.newPassword,
      mustChangePassword: false
    });

    const nextAuthState: AdminAuthState = await resolveAdminAuthState(app.prisma, app.appConfig);

    request.authState = nextAuthState;
    request.sessionUser = body.username;
    setSessionCookie(app, request, reply, body.username);

    return {
      ok: true,
      user: body.username,
      mustChangePassword: false,
      message: "Đã cập nhật thông tin đăng nhập quản trị thành công.",
      session: buildSessionPayload(nextAuthState, body.username)
    };
  });

  app.get("/api/auth/session", async (request) => {
    const authState = request.authState ?? (await resolveAdminAuthState(app.prisma, app.appConfig));
    const authenticatedUser = request.sessionUser === authState.username ? request.sessionUser : null;

    return buildSessionPayload(authState, authenticatedUser);
  });
}
