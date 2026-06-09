import { clearAuthCookies } from "@insforge/sdk/ssr";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const response = NextResponse.json({ success: true });
    clearAuthCookies(response.cookies);

    return response;
  } catch (error) {
    console.error("[auth/logout]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
