// Rate Limiter for Supabase Edge Functions
// Uses database queries to enforce per-minute rate limits (serverless-safe)

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfter: number; // seconds until the window resets
}

interface RateLimitConfig {
  /** Table to count rows from */
  table: string;
  /** Column that stores the timestamp */
  timestampColumn: string;
  /** Max requests allowed in the window */
  limit: number;
  /** Window size in seconds */
  windowSeconds: number;
  /** Optional extra filter column (e.g. role = 'user') */
  filterColumn?: string;
  /** Value for the extra filter */
  filterValue?: string;
}

// Preset configurations for common endpoints
const PRESETS: Record<string, RateLimitConfig> = {
  chat: {
    table: "messages",
    timestampColumn: "created_at",
    limit: 60,
    windowSeconds: 60,
    filterColumn: "role",
    filterValue: "user",
  },
  "agent-run": {
    table: "agent_runs",
    timestampColumn: "created_at",
    limit: 10,
    windowSeconds: 60,
  },
};

/**
 * Check if a user is within their rate limit by counting recent rows in the database.
 *
 * For chat: counts user messages in the last 60 seconds (max 60).
 * For agent-run: counts agent runs started in the last 60 seconds (max 10).
 * Custom configs can be passed for other endpoints.
 *
 * Since Supabase Edge Functions are stateless (no in-memory persistence across
 * invocations), we rely on the database as the source of truth.
 *
 * @param supabaseClient  A Supabase client (RLS-scoped to the user)
 * @param preset  A preset name ("chat" | "agent-run") or a custom RateLimitConfig
 * @returns RateLimitResult with allowed status, remaining count, and retry-after seconds
 */
export async function checkRateLimit(
  supabaseClient: SupabaseClient,
  preset: string | RateLimitConfig
): Promise<RateLimitResult> {
  const config: RateLimitConfig =
    typeof preset === "string" ? PRESETS[preset] : preset;

  if (!config) {
    // Unknown preset — allow by default to avoid blocking users
    console.warn(`Rate limiter: unknown preset "${preset}", allowing request`);
    return { allowed: true, remaining: 999, retryAfter: 0 };
  }

  const windowStart = new Date(
    Date.now() - config.windowSeconds * 1000
  ).toISOString();

  let query = supabaseClient
    .from(config.table)
    .select("id", { count: "exact", head: true })
    .gte(config.timestampColumn, windowStart);

  if (config.filterColumn && config.filterValue) {
    query = query.eq(config.filterColumn, config.filterValue);
  }

  const { count, error } = await query;

  if (error) {
    // On query failure, allow the request to avoid blocking users
    console.error("Rate limiter query error:", error);
    return { allowed: true, remaining: config.limit, retryAfter: 0 };
  }

  const currentCount = count ?? 0;
  const remaining = Math.max(0, config.limit - currentCount);
  const allowed = currentCount < config.limit;

  return {
    allowed,
    remaining,
    retryAfter: allowed ? 0 : config.windowSeconds,
  };
}

/**
 * Helper to return a 429 Too Many Requests response.
 */
export function rateLimitResponse(result: RateLimitResult): Response {
  return new Response(
    JSON.stringify({
      error: "Too many requests. Please try again later.",
      retryAfter: result.retryAfter,
      remaining: result.remaining,
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(result.retryAfter),
        "X-RateLimit-Remaining": String(result.remaining),
      },
    }
  );
}
