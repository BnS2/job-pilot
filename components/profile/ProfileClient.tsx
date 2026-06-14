"use client";

import { useState } from "react";

import { CompletionIndicator } from "@/components/profile/CompletionIndicator";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { ResumeUpload } from "@/components/profile/ResumeUpload";
import type { ProfileData } from "@/lib/utils";

type Props = {
  completionPercentage: number;
  isComplete: boolean;
  missingFields: string[];
  profile: ProfileData;
};

export function ProfileClient({
  completionPercentage,
  isComplete,
  missingFields,
  profile,
}: Props) {
  const [profileDraft, setProfileDraft] = useState<ProfileData>(profile);
  const [profileFormVersion, setProfileFormVersion] = useState(0);

  const applyExtractedProfile = (extractedProfile: ProfileData): void => {
    setProfileDraft((currentProfile) => ({
      ...currentProfile,
      ...extractedProfile,
      id: currentProfile.id,
      email: currentProfile.email,
      resume_pdf_url: currentProfile.resume_pdf_url,
      resume_pdf_key: currentProfile.resume_pdf_key,
      is_complete: currentProfile.is_complete,
    }));
    setProfileFormVersion((currentVersion) => currentVersion + 1);
  };

  const updateResumeMetadata = (resumePdfUrl: string | null, resumePdfKey: string | null): void => {
    setProfileDraft((currentProfile) => ({
      ...currentProfile,
      resume_pdf_url: resumePdfUrl,
      resume_pdf_key: resumePdfKey,
    }));
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,400px)] xl:items-start">
      <div className="order-2 xl:order-1">
        <ProfileForm key={profileFormVersion} profile={profileDraft} />
      </div>
      <aside className="order-1 flex flex-col gap-6 xl:order-2">
        <CompletionIndicator
          completionPercentage={completionPercentage}
          isComplete={isComplete}
          missingFields={missingFields}
        />
        <ResumeUpload
          userId={profileDraft.id ?? ""}
          resumePdfUrl={profileDraft.resume_pdf_url}
          resumePdfKey={profileDraft.resume_pdf_key}
          onExtractedProfile={applyExtractedProfile}
          onResumeMetadataChange={updateResumeMetadata}
        />
      </aside>
    </div>
  );
}
