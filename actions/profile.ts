"use server";

import { revalidatePath } from "next/cache";

import { createInsforgeServer } from "@/lib/insforge-server";
import { capturePostHogServerEvent } from "@/lib/posthog-server";
import { calculateCompleteness, type ProfileData } from "@/lib/utils";

export async function saveProfile(profileData: Omit<ProfileData, "is_complete" | "created_at" | "updated_at">) {
  try {
    const insforge = await createInsforgeServer();
    const { data: userData, error: userError } = await insforge.auth.getCurrentUser();

    if (userError || !userData.user) {
      return { success: false, error: "Unauthorized" };
    }

    const userId = userData.user.id;

    // Fetch existing profile to check transition of is_complete
    const { data: existingProfile, error: profileFetchError } = await insforge.database
      .from("profiles")
      .select("is_complete")
      .eq("id", userId)
      .maybeSingle();

    if (profileFetchError) {
      console.error("[actions/profile/saveProfile] Fetch error:", profileFetchError);
    }

    const wasComplete = existingProfile?.is_complete ?? false;
    const completeness = calculateCompleteness(profileData);
    const now = new Date().toISOString();
    const profileRecord = {
      full_name: profileData.full_name,
      phone: profileData.phone,
      location: profileData.location,
      current_title: profileData.current_title,
      experience_level: profileData.experience_level,
      years_experience: profileData.years_experience !== undefined && profileData.years_experience !== null
        ? Number(profileData.years_experience)
        : null,
      skills: profileData.skills || [],
      industries: profileData.industries || [],
      work_experience: profileData.work_experience || [],
      education: profileData.education || {},
      job_titles_seeking: profileData.job_titles_seeking || [],
      remote_preference: profileData.remote_preference,
      preferred_locations: profileData.preferred_locations || [],
      salary_expectation: profileData.salary_expectation,
      cover_letter_tone: profileData.cover_letter_tone || null,
      linkedin_url: profileData.linkedin_url,
      portfolio_url: profileData.portfolio_url,
      work_authorization: profileData.work_authorization,
      is_complete: completeness.isComplete,
      updated_at: now,
    };

    const writeResult = existingProfile
      ? await insforge.database
          .from("profiles")
          .update(profileRecord)
          .eq("id", userId)
          .select("id")
          .maybeSingle()
      : await insforge.database
          .from("profiles")
          .insert([{
            id: userId,
            email: userData.user.email,
            ...profileRecord,
            created_at: now,
          }])
          .select("id")
          .single();

    if (writeResult.error || !writeResult.data) {
      console.error("[actions/profile/saveProfile] Write error:", writeResult.error);
      return { success: false, error: "Failed to save profile" };
    }

    // Trigger profile_completed event if it just completed
    if (!wasComplete && completeness.isComplete) {
      await capturePostHogServerEvent(userId, "profile_completed", { userId });
    }

    revalidatePath("/profile");
    return { success: true };
  } catch (error) {
    console.error("[actions/profile/saveProfile] System error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function updateProfileResume(url: string, key: string) {
  try {
    const insforge = await createInsforgeServer();
    const { data: userData, error: userError } = await insforge.auth.getCurrentUser();

    if (userError || !userData.user) {
      return { success: false, error: "Unauthorized" };
    }

    const userId = userData.user.id;
    const { data: existingProfile, error: profileFetchError } = await insforge.database
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    if (profileFetchError) {
      console.error("[actions/profile/updateProfileResume] Fetch error:", profileFetchError);
      return { success: false, error: "Failed to locate profile" };
    }

    const now = new Date().toISOString();
    const writeResult = existingProfile
      ? await insforge.database
          .from("profiles")
          .update({
            resume_pdf_url: url,
            resume_pdf_key: key,
            updated_at: now,
          })
          .eq("id", userId)
          .select("id")
          .maybeSingle()
      : await insforge.database
          .from("profiles")
          .insert([{
            id: userId,
            email: userData.user.email,
            resume_pdf_url: url,
            resume_pdf_key: key,
            is_complete: false,
            created_at: now,
            updated_at: now,
          }])
          .select("id")
          .single();

    if (writeResult.error || !writeResult.data) {
      console.error("[actions/profile/updateProfileResume] Write error:", writeResult.error);
      return { success: false, error: "Failed to update resume metadata" };
    }

    revalidatePath("/profile");
    return { success: true };
  } catch (error) {
    console.error("[actions/profile/updateProfileResume] System error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function deleteProfileResume() {
  try {
    const insforge = await createInsforgeServer();
    const { data: userData, error: userError } = await insforge.auth.getCurrentUser();

    if (userError || !userData.user) {
      return { success: false, error: "Unauthorized" };
    }

    const userId = userData.user.id;

    // Fetch existing profile to get key
    const { data: profile, error: profileError } = await insforge.database
      .from("profiles")
      .select("resume_pdf_key")
      .eq("id", userId)
      .maybeSingle();

    if (profileError) {
      console.error("[actions/profile/deleteProfileResume] Fetch error:", profileError);
      return { success: false, error: "Failed to locate resume file" };
    }

    if (profile?.resume_pdf_key) {
      // Remove from storage
      const { error: storageError } = await insforge.storage
        .from("resumes")
        .remove(profile.resume_pdf_key);

      if (storageError) {
        console.error("[actions/profile/deleteProfileResume] Storage removal error:", storageError);
      }
    }

    // Set columns to null in DB
    const { error: updateError } = await insforge.database
      .from("profiles")
      .update({
        resume_pdf_url: null,
        resume_pdf_key: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (updateError) {
      console.error("[actions/profile/deleteProfileResume] Update error:", updateError);
      return { success: false, error: "Failed to clear resume reference" };
    }

    revalidatePath("/profile");
    return { success: true };
  } catch (error) {
    console.error("[actions/profile/deleteProfileResume] System error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
