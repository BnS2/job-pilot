import { revalidatePath } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { discoverJobsFromAdzuna } from "@/agent/adzuna";
import { createInsforgeServer } from "@/lib/insforge-server";
import { capturePostHogServerEvent } from "@/lib/posthog-server";
import type { ProfileData } from "@/lib/utils";

export const runtime = "nodejs";

const findJobsRequestSchema = z.object({
  jobTitle: z.string().trim().min(2).max(120),
  location: z.string().trim().max(120).optional().default(""),
});

function getStatusForError(code: string): number {
  if (code === "incomplete_profile") {
    return 400;
  }

  if (code === "temporary_unavailable") {
    return 503;
  }

  return 500;
}

export async function POST(request: NextRequest) {
  try {
    let requestBody: unknown;

    try {
      requestBody = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Enter a job title before finding jobs.",
        },
        { status: 400 },
      );
    }

    const body = findJobsRequestSchema.safeParse(requestBody);

    if (!body.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Enter a job title before finding jobs.",
        },
        { status: 400 },
      );
    }

    const insforge = await createInsforgeServer();
    const { data: userData, error: userError } = await insforge.auth.getCurrentUser();

    if (userError || !userData.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const userId = userData.user.id;
    const { data: profile, error: profileError } = await insforge.database
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (profileError) {
      console.error("[api/agent/find] Profile fetch error:", profileError);
      return NextResponse.json(
        { success: false, error: "Failed to load your profile." },
        { status: 500 },
      );
    }

    if (!profile) {
      return NextResponse.json(
        {
          success: false,
          error: "Save your profile before finding jobs.",
        },
        { status: 400 },
      );
    }

    await capturePostHogServerEvent(userId, "job_search_started", {
      userId,
      jobTitle: body.data.jobTitle,
      location: body.data.location,
    });

    const profileData: ProfileData = profile;
    const discovery = await discoverJobsFromAdzuna({
      userId,
      jobTitle: body.data.jobTitle,
      requestedLocation: body.data.location,
      profile: profileData,
    });

    if (!discovery.success) {
      return NextResponse.json(
        { success: false, error: discovery.error },
        { status: getStatusForError(discovery.code) },
      );
    }

    revalidatePath("/find-jobs");

    return NextResponse.json({
      success: true,
      data: discovery.data,
    });
  } catch (error) {
    console.error("[api/agent/find] System error:", error);

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
