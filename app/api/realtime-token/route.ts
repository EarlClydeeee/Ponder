/**
 * C4 — POST /api/realtime-token → { token, session_id }
 * Mints an ephemeral OpenAI Realtime session token so the browser can open
 * WebRTC without ever seeing the real key (SDD §5). Enforces the free-tier
 * daily cap via a device-ID cookie (soft limit; hardened with auth post-MVP).
 * Owner: Shello.
 */
import { NextResponse } from "next/server";

const REALTIME_MODEL = "gpt-4o-realtime-preview";
const DAILY_FREE_SESSIONS = 3;

export async function POST(req: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY not configured" },
      { status: 500 },
    );
  }

  // --- soft daily limit (device-ID cookie) ---
  const cookies = parseCookies(req.headers.get("cookie"));
  const today = new Date().toISOString().slice(0, 10);
  const usage = parseUsage(cookies["ponder_usage"], today);
  if (usage.count >= DAILY_FREE_SESSIONS) {
    return NextResponse.json(
      { error: "daily_limit", limit: DAILY_FREE_SESSIONS },
      { status: 429 },
    );
  }

  const res = await fetch("https://api.openai.com/v1/realtime/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: REALTIME_MODEL }),
  });

  if (!res.ok) {
    return NextResponse.json(
      { error: "token_failed", detail: await res.text() },
      { status: 502 },
    );
  }

  const data = await res.json();
  const response = NextResponse.json({
    token: data.client_secret?.value ?? data.client_secret,
    session_id: data.id,
  });

  response.cookies.set(
    "ponder_usage",
    `${today}:${usage.count + 1}`,
    { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 },
  );
  return response;
}

function parseCookies(header: string | null): Record<string, string> {
  if (!header) return {};
  return Object.fromEntries(
    header.split(";").map((c) => {
      const [k, ...v] = c.trim().split("=");
      return [k, decodeURIComponent(v.join("="))];
    }),
  );
}

function parseUsage(
  raw: string | undefined,
  today: string,
): { date: string; count: number } {
  if (!raw) return { date: today, count: 0 };
  const [date, count] = raw.split(":");
  return date === today ? { date, count: Number(count) || 0 } : { date: today, count: 0 };
}
