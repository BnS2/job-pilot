import { clearAuthCookies, refreshAuth } from "@insforge/sdk/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { requirePublicEnv } from "@/lib/env";

function getErrorStatusCode(error: unknown): number | null {
  if (
    typeof error === "object" &&
    error !== null &&
    "statusCode" in error &&
    typeof error.statusCode === "number"
  ) {
    return error.statusCode;
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const result = await refreshAuth({
      baseUrl: requirePublicEnv("NEXT_PUBLIC_INSFORGE_URL"),
      anonKey: requirePublicEnv("NEXT_PUBLIC_INSFORGE_ANON_KEY"),
      request,
    });

    if (result.error || !result.accessToken) {
      const statusCode = getErrorStatusCode(result.error);

      if (statusCode !== 401) {
        console.error("[auth/refresh] Temporary refresh failure:", result.error);
        return NextResponse.json(
          { success: false, error: "Failed to refresh session" },
          { status: 503 },
        );
      }

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
