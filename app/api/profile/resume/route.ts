import { NextResponse } from "next/server";

import { createInsforgeServer } from "@/lib/insforge-server";

export async function GET() {
  try {
    const insforge = await createInsforgeServer();
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

    return new Response(resumeBlob, {
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Disposition": 'inline; filename="resume.pdf"',
        "Content-Type": resumeBlob.type || "application/pdf",
      },
    });
  } catch (error) {
    console.error("[api/profile/resume] System error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
