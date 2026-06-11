"use client";

import { useState } from "react";

import { ProfileForm } from "@/components/profile/ProfileForm";
import { ResumeUpload } from "@/components/profile/ResumeUpload";
import type { ProfileData } from "@/lib/utils";

type Props = {
  profile: ProfileData;
};

export function ProfileClient({ profile }: Props) {
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
    <>
      <ResumeUpload
        userId={profileDraft.id ?? ""}
        resumePdfUrl={profileDraft.resume_pdf_url}
        resumePdfKey={profileDraft.resume_pdf_key}
        onExtractedProfile={applyExtractedProfile}
        onResumeMetadataChange={updateResumeMetadata}
      />
      <ProfileForm key={profileFormVersion} profile={profileDraft} />
    </>
  );
}
