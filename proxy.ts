import {
  clearAuthCookies,
  DEFAULT_ACCESS_TOKEN_COOKIE,
  DEFAULT_REFRESH_TOKEN_COOKIE,
  updateSession,
  type CookieOptions,
  type CookieStore,
} from "@insforge/sdk/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { requirePublicEnv } from "@/lib/env";

export async function proxy(request: NextRequest) {
  const hasAccessToken = request.cookies.has(DEFAULT_ACCESS_TOKEN_COOKIE);
  const hasRefreshToken = request.cookies.has(DEFAULT_REFRESH_TOKEN_COOKIE);

  if (!hasRefreshToken) {
    return redirectToLogin(request, hasAccessToken);
  }

  const response = NextResponse.next({ request });
  let result: Awaited<ReturnType<typeof updateSession>>;

  try {
    result = await updateSession({
      baseUrl: requirePublicEnv("NEXT_PUBLIC_INSFORGE_URL"),
      anonKey: requirePublicEnv("NEXT_PUBLIC_INSFORGE_ANON_KEY"),
      requestCookies: createRequestCookieStore(request),
      responseCookies: createResponseCookieStore(response),
    });
  } catch (error) {
    console.error("[proxy] Session update error:", error);
    return redirectToLogin(request, true);
  }

  if (result.error || !result.accessToken) {
    return redirectToLogin(request, true);
  }

  return response;
}

function redirectToLogin(request: NextRequest, shouldClearAuth = false): NextResponse {
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set(
    "next",
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
  );
  const response = NextResponse.redirect(loginUrl);

  if (shouldClearAuth) {
    clearAuthCookies(response.cookies);
  }

  return response;
}

function createRequestCookieStore(request: NextRequest): CookieStore {
  return {
    get(name: string): string | undefined {
      return request.cookies.get(name)?.value;
    },
    set(): void {
      return undefined;
    },
    delete(): void {
      return undefined;
    },
  };
}

function createResponseCookieStore(response: NextResponse): CookieStore {
  return {
    get(name: string): string | undefined {
      return response.cookies.get(name)?.value;
    },
    set(
      nameOrOptions: string | ({ name: string; value: string } & CookieOptions),
      value?: string,
      options?: CookieOptions,
    ): void {
      if (typeof nameOrOptions === "string") {
        response.cookies.set(nameOrOptions, value ?? "", options);
        return;
      }

      response.cookies.set(nameOrOptions.name, nameOrOptions.value, nameOrOptions);
    },
    delete(nameOrOptions: string | ({ name: string } & CookieOptions)): void {
      if (typeof nameOrOptions === "string") {
        response.cookies.delete(nameOrOptions);
        return;
      }

      response.cookies.delete(nameOrOptions.name);
    },
  };
}

export const config = {
  matcher: ["/dashboard/:path*", "/profile/:path*", "/find-jobs/:path*"],
};
