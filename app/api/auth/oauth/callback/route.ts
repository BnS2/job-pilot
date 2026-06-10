import { createServerClient, setAuthCookies } from "@insforge/sdk/ssr";
import { NextRequest, NextResponse } from "next/server";

import { requirePublicEnv } from "@/lib/env";
import { capturePostHogServerEvent } from "@/lib/posthog-server";

type OAuthCallbackRequest = {
  code: string;
  codeVerifier: string;
};

export async function POST(request: NextRequest) {
  try {
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid OAuth callback" },
        { status: 400 },
      );
    }

    const callbackRequest = parseOAuthCallbackRequest(body);

    if (!callbackRequest) {
      return NextResponse.json(
        { success: false, error: "Invalid OAuth callback" },
        { status: 400 },
      );
    }

    const insforge = createServerClient({
      baseUrl: requirePublicEnv("NEXT_PUBLIC_INSFORGE_URL"),
      anonKey: requirePublicEnv("NEXT_PUBLIC_INSFORGE_ANON_KEY"),
    });
    const { data, error } = await insforge.auth.exchangeOAuthCode(
      callbackRequest.code,
      callbackRequest.codeVerifier,
    );

    if (error || !data?.accessToken) {
      console.error("[auth/oauth/callback]", error);
      return NextResponse.json(
        { success: false, error: "Could not complete OAuth sign-in" },
        { status: 401 },
      );
    }

    const distinctId = request.headers.get("X-POSTHOG-DISTINCT-ID") ?? data.user?.id ?? "anonymous";
    const sessionId = request.headers.get("X-POSTHOG-SESSION-ID");

    await capturePostHogServerEvent(distinctId, "server_user_signed_in", {
      userId: data.user?.id,
      email: data.user?.email,
      $session_id: sessionId ?? undefined,
    });

    const response = NextResponse.json({
      success: true,
      data: { user: data.user },
    });

    setAuthCookies(response.cookies, {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    });

    return response;
  } catch (error) {
    console.error("[auth/oauth/callback]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

function parseOAuthCallbackRequest(body: unknown): OAuthCallbackRequest | null {
  if (!body || typeof body !== "object") {
    return null;
  }

  const code = "code" in body ? body.code : undefined;
  const codeVerifier = "codeVerifier" in body ? body.codeVerifier : undefined;

  if (typeof code !== "string" || typeof codeVerifier !== "string") {
    return null;
  }

  return { code, codeVerifier };
}
