import { NextResponse } from "next/server";
import {
  REALTIME_CLIENT_SECRETS_URL,
  REALTIME_MODEL,
} from "../../lib/config";

export async function POST() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY not configured" },
      { status: 500 },
    );
  }

  const res = await fetch(REALTIME_CLIENT_SECRETS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      session: { type: "realtime", model: REALTIME_MODEL },
    }),
  });

  if (!res.ok) {
    return NextResponse.json(
      { error: "token_failed", detail: await res.text() },
      { status: 502 },
    );
  }

  const data = (await res.json()) as {
    value?: string;
    client_secret?: { value?: string } | string;
    id?: string;
    session_id?: string;
  };

  const token =
    data.value ??
    (typeof data.client_secret === "string"
      ? data.client_secret
      : data.client_secret?.value);

  if (!token) {
    return NextResponse.json(
      { error: "token_failed", detail: "No ephemeral token in response" },
      { status: 502 },
    );
  }

  return NextResponse.json({
    token,
    session_id: data.session_id ?? data.id ?? "",
  });
}
