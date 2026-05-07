import crypto from "node:crypto";

import type { FastifyRequest } from "fastify";

const SESSION_COOKIE = "xteink_session";
const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;

interface SessionPayload {
  user: string;
  exp: number;
}

function base64UrlEncode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signPayload(payload: string, secret: string) {
  return crypto.createHmac("sha256", secret).update(payload).digest("base64url");
}

export function getSessionCookieName() {
  return SESSION_COOKIE;
}

export function createSessionToken(user: string, secret: string) {
  const payload: SessionPayload = {
    user,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS
  };
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = signPayload(encodedPayload, secret);
  return `${encodedPayload}.${signature}`;
}

export function parseSessionToken(token: string, secret: string): SessionPayload | null {
  const [encodedPayload, providedSignature] = token.split(".");
  if (!encodedPayload || !providedSignature) {
    return null;
  }

  const expectedSignature = signPayload(encodedPayload, secret);
  const expected = Buffer.from(expectedSignature);
  const provided = Buffer.from(providedSignature);

  if (expected.length !== provided.length || !crypto.timingSafeEqual(expected, provided)) {
    return null;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as SessionPayload;
    if (!payload.user || !payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export function getSessionFromRequest(request: FastifyRequest, secret: string) {
  const token = request.cookies[SESSION_COOKIE];
  if (!token) {
    return null;
  }
  return parseSessionToken(token, secret);
}

function sha256Hex(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function scryptHex(password: string, salt: string) {
  return crypto.scryptSync(password, salt, 32).toString("hex");
}

function timingSafeStringEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

export function hashAdminPassword(password: string) {
  const salt = crypto.randomBytes(16).toString("hex");
  return `scrypt:${salt}:${scryptHex(password, salt)}`;
}

export function verifyAdminPassword(password: string, expectedValue: string) {
  if (expectedValue.startsWith("scrypt:")) {
    const [, salt, expectedDigest] = expectedValue.split(":");
    if (!salt || !expectedDigest) {
      return false;
    }

    return timingSafeStringEqual(scryptHex(password, salt), expectedDigest);
  }

  if (expectedValue.startsWith("sha256:")) {
    const digest = sha256Hex(password);
    const expectedDigest = expectedValue.slice("sha256:".length);
    return timingSafeStringEqual(digest, expectedDigest);
  }

  if (expectedValue.startsWith("plain:")) {
    return timingSafeStringEqual(password, expectedValue.slice("plain:".length));
  }

  return timingSafeStringEqual(password, expectedValue);
}
