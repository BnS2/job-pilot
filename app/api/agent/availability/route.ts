import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { checkJobAvailability } from "@/agent/availability";
import { createInsforgeServer } from "@/lib/insforge-server";

export const runtime = "nodejs";

const availabilityRequestSchema = z.object({
  jobId: z.string().uuid(),
  force: z.boolean().optional().default(false),
});

export async function POST(request: NextRequest) {
  try {
    let requestBody: unknown;

    try {
      requestBody = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid request format." },
        { status: 400 },
      );
    }

    const parsed = availabilityRequestSchema.safeParse(requestBody);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid job ID format." },
        { status: 400 },
      );
    }

    const { jobId, force } = parsed.data;

    const insforge = await createInsforgeServer();
    const { data: userData, error: userError } = await insforge.auth.getCurrentUser();

    if (userError || !userData.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const result = await checkJobAvailability(jobId, userData.user.id, force);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.reason || "Check failed." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      status: result.status,
      reason: result.reason,
    });
  } catch (error) {
    console.error("[api/agent/availability] System error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
