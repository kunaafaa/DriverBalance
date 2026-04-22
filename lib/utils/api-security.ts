/**
 * lib/utils/api-security.ts
 * 
 * Centralized security utilities for all API route handlers.
 * Usage: Import requireAuth, rateLimit, and secureResponse into every route.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

// ---------------------------------------------------------------------------
// Type
// ---------------------------------------------------------------------------
export type ApiHandler = (
  request: NextRequest,
  context?: { params: Promise<Record<string, string>> }
) => Promise<NextResponse>;

// ---------------------------------------------------------------------------
// 1. RATE LIMITER
// In-memory sliding window counter per IP address.
// Production note: Replace with Redis (Upstash) for multi-instance deployments.
// ---------------------------------------------------------------------------
const ipStore = new Map<string, { count: number; start: number }>();

const RATE_LIMITS: Record<string, { windowMs: number; max: number }> = {
  default:  { windowMs: 60_000, max: 120 },  // 120 req/min for general API
  write:    { windowMs: 60_000, max: 30  },  // 30 writes/min (POST/PATCH/DELETE)
  reports:  { windowMs: 60_000, max: 20  },  // 20 req/min for heavy report queries
};

function getClientId(request: NextRequest): string {
  // Prefer X-Forwarded-For (set by Vercel/proxies), fallback to direct IP
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export function checkRateLimit(
  request: NextRequest,
  tier: keyof typeof RATE_LIMITS = "default"
): NextResponse | null {
  const clientId = getClientId(request);
  const key = `${tier}:${clientId}`;
  const now = Date.now();
  const limit = RATE_LIMITS[tier];

  const record = ipStore.get(key);

  if (!record || now - record.start > limit.windowMs) {
    ipStore.set(key, { count: 1, start: now });
    return null; // ok
  }

  if (record.count >= limit.max) {
    log("RATE_LIMIT", `${clientId} exceeded ${tier} limit`, request);
    return NextResponse.json(
      { error: "Too many requests. Please slow down." },
      {
        status: 429,
        headers: {
          "Retry-After": Math.ceil(
            (record.start + limit.windowMs - now) / 1000
          ).toString(),
        },
      }
    );
  }

  record.count += 1;
  return null; // ok
}

// ---------------------------------------------------------------------------
// 2. AUTH GUARD
// Call at the top of every handler. Returns the session or a 401 response.
// ---------------------------------------------------------------------------
export async function requireAuth(
  request: NextRequest
): Promise<{ session: any; error: null } | { session: null; error: NextResponse }> {
  const session = await auth();
  if (!session?.user) {
    log("UNAUTH", "Unauthorized API access attempt", request);
    return {
      session: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { session, error: null };
}

// ---------------------------------------------------------------------------
// 3. INPUT SANITIZER
// Strips keys not in the allowlist to prevent mass-assignment attacks.
// ---------------------------------------------------------------------------
export function sanitizeBody<T extends Record<string, unknown>>(
  body: Record<string, unknown>,
  allowedFields: (keyof T)[]
): Partial<T> {
  const sanitized: Partial<T> = {};
  for (const key of allowedFields) {
    if (key in body) {
      sanitized[key] = body[key as string] as T[keyof T];
    }
  }
  return sanitized;
}

// ---------------------------------------------------------------------------
// 4. STRUCTURED LOGGER
// Emits JSON log lines for monitoring. In Vercel, these surface in the
// Function Logs view. Works with Datadog, Logtail, etc. via log drains.
// ---------------------------------------------------------------------------
type LogLevel = "INFO" | "WARN" | "ERROR" | "RATE_LIMIT" | "UNAUTH" | "SECURITY";

export function log(
  level: LogLevel,
  message: string,
  request?: NextRequest,
  meta?: Record<string, unknown>
) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    message,
    ...(request && {
      method: request.method,
      path: new URL(request.url).pathname,
      ip: getClientId(request),
      ua: request.headers.get("user-agent")?.slice(0, 100),
    }),
    ...meta,
  };

  if (level === "ERROR" || level === "SECURITY") {
    console.error(JSON.stringify(entry));
  } else if (level === "WARN" || level === "RATE_LIMIT" || level === "UNAUTH") {
    console.warn(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }
}

// ---------------------------------------------------------------------------
// 5. SECURE RESPONSE HELPER
// Standard response wrapper that always adds security headers.
// ---------------------------------------------------------------------------
export function secureJson(
  body: unknown,
  status = 200,
  extraHeaders?: Record<string, string>
): NextResponse {
  const res = NextResponse.json(body, { status });

  // Prevent browsers from caching API responses
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  // Prevent response content type sniffing
  res.headers.set("X-Content-Type-Options", "nosniff");
  // Remove server fingerprinting
  res.headers.delete("X-Powered-By");

  if (extraHeaders) {
    for (const [k, v] of Object.entries(extraHeaders)) {
      res.headers.set(k, v);
    }
  }

  return res;
}
