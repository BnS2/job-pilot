import { clearAuthCookies, refreshAuth } from "@insforge/sdk/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { requirePublicEnv } from "@/lib/env";

export async function POST(request: NextRequest) {
  try {
    const result = await refreshAuth({
      baseUrl: requirePublicEnv("NEXT_PUBLIC_INSFORGE_URL"),
      anonKey: requirePublicEnv("NEXT_PUBLIC_INSFORGE_ANON_KEY"),
      request,
    });

    if (result.error || !result.accessToken) {
      const response = NextResponse.json(
        { success: false, error: "Session expired" },
        { status: 401 },
      );
      clearAuthCookies(response.cookies);

      return response;
    }

    return result.response;
  } catch (error) {
    console.error("[auth/refresh] Exception caught:", error);

    return NextResponse.json(
      { success: false, error: "Failed to refresh session" },
      { status: 500 },
    );
  }
}
