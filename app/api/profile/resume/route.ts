import {
  DEFAULT_ACCESS_TOKEN_COOKIE,
  DEFAULT_REFRESH_TOKEN_COOKIE,
  createServerClient,
  updateSession,
  type CookieOptions,
  type CookieStore,
} from "@insforge/sdk/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { requirePublicEnv } from "@/lib/env";

export const runtime = "nodejs";

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

type CookieEntry = {
  name: string;
  value: string;
  options?: CookieOptions;
};

class CookieMap implements CookieStore {
  private readonly cookies = new Map<string, CookieEntry>();

  get(name: string): string | undefined {
    return this.cookies.get(name)?.value;
  }

  set(
    nameOrOptions: string | ({ name: string; value: string } & CookieOptions),
    value?: string,
    options?: CookieOptions,
  ): void {
    if (typeof nameOrOptions === "string") {
      this.cookies.set(nameOrOptions, { name: nameOrOptions, value: value ?? "", options });
      return;
    }

    const { name, value: cookieValue, ...cookieOptions } = nameOrOptions;
    this.cookies.set(name, { name, value: cookieValue, options: cookieOptions });
  }

  delete(nameOrOptions: string | ({ name: string } & CookieOptions)): void {
    const name =
      typeof nameOrOptions === "string" ? nameOrOptions : nameOrOptions.name;
    this.cookies.delete(name);
  }

  entries(): CookieEntry[] {
    return Array.from(this.cookies.values());
  }
}

export async function GET(request: NextRequest) {
  try {
    const requestCookies = createRequestCookieStore(request);
    const responseCookies = new CookieMap();
    const session = await updateSession({
      baseUrl: requirePublicEnv("NEXT_PUBLIC_INSFORGE_URL"),
      anonKey: requirePublicEnv("NEXT_PUBLIC_INSFORGE_ANON_KEY"),
      requestCookies,
      responseCookies,
    });

    if (session.error || !session.accessToken) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const insforge = createServerClient({
      baseUrl: requirePublicEnv("NEXT_PUBLIC_INSFORGE_URL"),
      anonKey: requirePublicEnv("NEXT_PUBLIC_INSFORGE_ANON_KEY"),
      accessToken: session.accessToken,
    });
    const { data: userData, error: userError } = await insforge.auth.getCurrentUser();

    if (userError || !userData.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { data: profile, error: profileError } = await insforge.database
      .from("profiles")
      .select("resume_pdf_key")
      .eq("id", userData.user.id)
      .maybeSingle();

    if (profileError) {
      console.error("[api/profile/resume] Profile fetch error:", profileError);
      return NextResponse.json(
        { success: false, error: "Failed to locate resume" },
        { status: 500 },
      );
    }

    if (!profile?.resume_pdf_key) {
      return NextResponse.json(
        { success: false, error: "Resume not found" },
        { status: 404 },
      );
    }

    const { data: resumeBlob, error: downloadError } = await insforge.storage
      .from("resumes")
      .download(profile.resume_pdf_key);

    if (downloadError || !resumeBlob) {
      console.error("[api/profile/resume] Download error:", downloadError);
      return NextResponse.json(
        { success: false, error: "Failed to download resume" },
        { status: 500 },
      );
    }

    const response = new NextResponse(resumeBlob, {
      headers: {
        "Cache-Control": "private, max-age=300",
        "Content-Disposition": 'inline; filename="resume.pdf"',
        "Content-Length": String(resumeBlob.size),
        "Content-Type": "application/pdf",
        "X-Content-Type-Options": "nosniff",
      },
    });

    responseCookies
      .entries()
      .filter(
        (entry) =>
          entry.name === DEFAULT_ACCESS_TOKEN_COOKIE ||
          entry.name === DEFAULT_REFRESH_TOKEN_COOKIE,
      )
      .forEach((entry) => {
        response.cookies.set(entry.name, entry.value, entry.options);
      });

    return response;
  } catch (error) {
    console.error("[api/profile/resume] System error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
