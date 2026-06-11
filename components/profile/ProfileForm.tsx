"use client";

import { useState, useTransition } from "react";
import type { FormEvent, KeyboardEvent, MouseEvent } from "react";

import { saveProfile } from "@/actions/profile";
import type { EducationData, ProfileData, WorkExperienceData } from "@/lib/utils";

type Props = {
  profile: ProfileData;
};

export function ProfileForm({ profile }: Props) {
  // Personal Info
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [location, setLocation] = useState(profile?.location || "");
  const [linkedinUrl, setLinkedinUrl] = useState(profile?.linkedin_url || "");
  const [portfolioUrl, setPortfolioUrl] = useState(profile?.portfolio_url || "");
  const [workAuthorization, setWorkAuthorization] = useState(profile?.work_authorization || "citizen");

  // Professional Info
  const [currentTitle, setCurrentTitle] = useState(profile?.current_title || "");
  const [experienceLevel, setExperienceLevel] = useState(profile?.experience_level || "junior");
  const [yearsExperience, setYearsExperience] = useState<number | "">(
    profile?.years_experience !== undefined && profile?.years_experience !== null
      ? profile.years_experience
      : ""
  );

  // Skills Tag Input
  const [skills, setSkills] = useState<string[]>(profile?.skills || []);
  const [skillInput, setSkillInput] = useState("");

  const addSkill = (e?: MouseEvent<HTMLButtonElement> | KeyboardEvent<HTMLInputElement>): void => {
    e?.preventDefault();
    const clean = skillInput.trim();
    if (clean && !skills.includes(clean)) {
      setSkills([...skills, clean]);
      setSkillInput("");
    }
  };

  const removeSkill = (skillToRemove: string): void => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  // Industries Tag Input
  const [industries, setIndustries] = useState<string[]>(profile?.industries || []);
  const [industryInput, setIndustryInput] = useState("");

  const addIndustry = (e?: MouseEvent<HTMLButtonElement> | KeyboardEvent<HTMLInputElement>): void => {
    e?.preventDefault();
    const clean = industryInput.trim();
    if (clean && !industries.includes(clean)) {
      setIndustries([...industries, clean]);
      setIndustryInput("");
    }
  };

  const removeIndustry = (industryToRemove: string): void => {
    setIndustries(industries.filter((i) => i !== industryToRemove));
  };

  // Work Experience
  const [workExperience, setWorkExperience] = useState<WorkExperienceData[]>(profile?.work_experience || []);

  const addWorkRole = (): void => {
    if (workExperience.length < 3) {
      setWorkExperience([
        ...workExperience,
        {
          company: "",
          title: "",
          startDate: "",
          endDate: "",
          currentlyWorking: false,
          responsibilities: "",
        },
      ]);
    }
  };

  const updateWorkRole = <Field extends keyof WorkExperienceData>(
    index: number,
    field: Field,
    value: WorkExperienceData[Field],
  ): void => {
    const updated = [...workExperience];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    if (field === "currentlyWorking" && value === true) {
      updated[index].endDate = "";
    }
    setWorkExperience(updated);
  };

  const removeWorkRole = (index: number): void => {
    setWorkExperience(workExperience.filter((_, i) => i !== index));
  };

  // Education
  const [education, setEducation] = useState<EducationData>(
    profile?.education && typeof profile.education === "object" && !Array.isArray(profile.education)
      ? {
          degree: profile.education.degree || "high_school",
          fieldOfStudy: profile.education.fieldOfStudy || "",
          institution: profile.education.institution || "",
          graduationYear: profile.education.graduationYear || "",
        }
      : {
          degree: "high_school",
          fieldOfStudy: "",
          institution: "",
          graduationYear: "",
        }
  );

  const updateEducation = (field: keyof EducationData, value: string): void => {
    setEducation({
      ...education,
      [field]: value,
    });
  };

  // Job Preferences
  const [jobTitlesSeekingInput, setJobTitlesSeekingInput] = useState(
    profile?.job_titles_seeking?.join(", ") || ""
  );
  const [remotePreference, setRemotePreference] = useState(profile?.remote_preference || "any");
  const [salaryExpectation, setSalaryExpectation] = useState(profile?.salary_expectation || "");
  const [coverLetterTone, setCoverLetterTone] = useState(profile?.cover_letter_tone || "");
  const [preferredLocationsInput, setPreferredLocationsInput] = useState(
    profile?.preferred_locations?.join(", ") || ""
  );

  // Submission state
  const [isPending, startTransition] = useTransition();
  const [saveStatus, setSaveStatus] = useState<{ success: boolean; message: string } | null>(null);

  const handleSave = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    setSaveStatus(null);

    startTransition(async () => {
      const parsedJobTitles = jobTitlesSeekingInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const parsedLocations = preferredLocationsInput
        .split(",")
        .map((l) => l.trim())
        .filter(Boolean);

      const result = await saveProfile({
        full_name: fullName,
        phone,
        location,
        linkedin_url: linkedinUrl,
        portfolio_url: portfolioUrl,
        work_authorization: workAuthorization,
        current_title: currentTitle,
        experience_level: experienceLevel,
        years_experience: yearsExperience === "" ? null : Number(yearsExperience),
        skills,
        industries,
        work_experience: workExperience,
        education,
        job_titles_seeking: parsedJobTitles,
        remote_preference: remotePreference,
        preferred_locations: parsedLocations,
        salary_expectation: salaryExpectation,
        cover_letter_tone: coverLetterTone,
      });

      if (result.success) {
        setSaveStatus({ success: true, message: "Profile saved successfully!" });
      } else {
        setSaveStatus({ success: false, message: result.error || "Failed to save profile." });
      }
    });
  };

  return (
    <section className="rounded-xl border border-border bg-surface p-6 shadow-sm">
      <div className="border-b border-border pb-4">
        <h2 className="text-base font-semibold leading-6 text-text-primary">
          Profile Information
        </h2>
        <p className="mt-1 text-sm font-medium leading-5 text-text-secondary">
          This context is used to accurately represent you in agent interactions.
        </p>
      </div>

      <form onSubmit={handleSave} className="mt-8">
        {saveStatus && (
          <div
            className={`mb-6 rounded-md p-4 text-sm font-medium ${
              saveStatus.success
                ? "bg-success-lightest text-success-foreground border border-success/20"
                : "bg-error/10 text-error border border-error/20"
            }`}
          >
            {saveStatus.message}
          </div>
        )}

        {/* Personal Info */}
        <div>
          <h3 className="text-base font-semibold leading-6 text-text-primary">
            Personal Info
          </h3>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-xs font-semibold uppercase leading-4 text-text-secondary">
                Full Name
              </span>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-2 h-11 w-full rounded-md border border-border bg-surface px-3 text-sm font-medium leading-5 text-text-primary outline-none placeholder:text-text-muted focus:border-accent focus:ring-1 focus:ring-accent"
                placeholder="Full Name"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase leading-4 text-text-secondary">
                Email
              </span>
              <input
                type="email"
                value={profile?.email || ""}
                disabled
                className="mt-2 h-11 w-full cursor-not-allowed rounded-md border border-border bg-surface-secondary px-3 text-sm font-medium leading-5 text-text-secondary outline-none disabled:opacity-100"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase leading-4 text-text-secondary">
                Phone Number
              </span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-2 h-11 w-full rounded-md border border-border bg-surface px-3 text-sm font-medium leading-5 text-text-primary outline-none placeholder:text-text-muted focus:border-accent focus:ring-1 focus:ring-accent"
                placeholder="+1 (555) 000-0000"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase leading-4 text-text-secondary">
                Location
              </span>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="mt-2 h-11 w-full rounded-md border border-border bg-surface px-3 text-sm font-medium leading-5 text-text-primary outline-none placeholder:text-text-muted focus:border-accent focus:ring-1 focus:ring-accent"
                placeholder="City, Country"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase leading-4 text-text-secondary">
                LinkedIn URL
              </span>
              <input
                type="url"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                className="mt-2 h-11 w-full rounded-md border border-border bg-surface px-3 text-sm font-medium leading-5 text-text-primary outline-none placeholder:text-text-muted focus:border-accent focus:ring-1 focus:ring-accent"
                placeholder="https://linkedin.com/in/username"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase leading-4 text-text-secondary">
                Portfolio / GitHub
              </span>
              <input
                type="url"
                value={portfolioUrl}
                onChange={(e) => setPortfolioUrl(e.target.value)}
                className="mt-2 h-11 w-full rounded-md border border-border bg-surface px-3 text-sm font-medium leading-5 text-text-primary outline-none placeholder:text-text-muted focus:border-accent focus:ring-1 focus:ring-accent"
                placeholder="https://github.com/username"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase leading-4 text-text-secondary">
                Work Authorization
              </span>
              <select
                value={workAuthorization}
                onChange={(e) => setWorkAuthorization(e.target.value)}
                className="mt-2 h-11 w-full rounded-md border border-border bg-surface px-3 text-sm font-medium leading-5 text-text-primary outline-none focus:border-accent focus:ring-1 focus:ring-accent"
              >
                <option value="citizen">Citizen</option>
                <option value="permanent_resident">Permanent Resident</option>
                <option value="visa_required">Visa Required</option>
              </select>
            </label>
          </div>
        </div>

        {/* Professional Info */}
        <div className="mt-10 border-t border-border pt-8">
          <h3 className="text-base font-semibold leading-6 text-text-primary">
            Professional Info
          </h3>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="block md:col-span-2">
              <span className="text-xs font-semibold uppercase leading-4 text-text-secondary">
                Current/Recent Job Title
              </span>
              <input
                type="text"
                value={currentTitle}
                onChange={(e) => setCurrentTitle(e.target.value)}
                className="mt-2 h-11 w-full rounded-md border border-border bg-surface px-3 text-sm font-medium leading-5 text-text-primary outline-none placeholder:text-text-muted focus:border-accent focus:ring-1 focus:ring-accent"
                placeholder="Job Title"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase leading-4 text-text-secondary">
                Experience Level
              </span>
              <select
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value)}
                className="mt-2 h-11 w-full rounded-md border border-border bg-surface px-3 text-sm font-medium leading-5 text-text-primary outline-none focus:border-accent focus:ring-1 focus:ring-accent"
              >
                <option value="junior">Junior</option>
                <option value="mid">Mid-level</option>
                <option value="senior">Senior</option>
                <option value="lead">Lead</option>
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase leading-4 text-text-secondary">
                Years of Experience
              </span>
              <input
                type="number"
                min="0"
                value={yearsExperience}
                onChange={(e) =>
                  setYearsExperience(e.target.value === "" ? "" : Number(e.target.value))
                }
                className="mt-2 h-11 w-full rounded-md border border-border bg-surface px-3 text-sm font-medium leading-5 text-text-primary outline-none placeholder:text-text-muted focus:border-accent focus:ring-1 focus:ring-accent"
                placeholder="0"
              />
            </label>
          </div>

          {/* Skills */}
          <div className="mt-4">
            <label className="block">
              <span className="text-xs font-semibold uppercase leading-4 text-text-secondary">
                Skills
              </span>
              <span className="mt-2 flex gap-2">
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addSkill();
                    }
                  }}
                  className="h-11 min-w-0 flex-1 rounded-md border border-border bg-surface px-3 text-sm font-medium leading-5 text-text-primary outline-none placeholder:text-text-muted focus:border-accent focus:ring-1 focus:ring-accent"
                  placeholder="Add a skill"
                />
                <button
                  type="button"
                  onClick={(e) => addSkill(e)}
                  className="h-11 rounded-md bg-surface-secondary px-4 text-sm font-medium leading-5 text-text-primary hover:bg-border-light transition-colors"
                >
                  Add
                </button>
              </span>
            </label>
            <div className="mt-3 flex flex-wrap gap-2">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1 rounded-md border border-accent/20 bg-accent-muted px-3 py-2 text-xs font-semibold leading-4 text-accent"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => removeSkill(skill)}
                    aria-label={`Remove ${skill}`}
                    className="ml-1 text-accent/70 transition-colors hover:text-error"
                  >
                    ×
                  </button>
                </span>
              ))}
              {skills.length === 0 && (
                <span className="text-xs text-text-muted">No skills added yet.</span>
              )}
            </div>
          </div>

          {/* Industries */}
          <div className="mt-4">
            <label className="block">
              <span className="text-xs font-semibold uppercase leading-4 text-text-secondary">
                Industries Worked In (Optional)
              </span>
              <span className="mt-2 flex gap-2">
                <input
                  type="text"
                  value={industryInput}
                  onChange={(e) => setIndustryInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addIndustry();
                    }
                  }}
                  className="h-11 min-w-0 flex-1 rounded-md border border-border bg-surface px-3 text-sm font-medium leading-5 text-text-primary outline-none placeholder:text-text-muted focus:border-accent focus:ring-1 focus:ring-accent"
                  placeholder="E.g. FinTech, Healthcare"
                />
                <button
                  type="button"
                  onClick={(e) => addIndustry(e)}
                  className="h-11 rounded-md bg-surface-secondary px-4 text-sm font-medium leading-5 text-text-primary hover:bg-border-light transition-colors"
                >
                  Add
                </button>
              </span>
            </label>
            <div className="mt-3 flex flex-wrap gap-2">
              {industries.map((ind) => (
                <span
                  key={ind}
                  className="inline-flex items-center gap-1 rounded-md border border-accent/20 bg-accent-muted px-3 py-2 text-xs font-semibold leading-4 text-accent"
                >
                  {ind}
                  <button
                    type="button"
                    onClick={() => removeIndustry(ind)}
                    aria-label={`Remove ${ind}`}
                    className="ml-1 text-accent/70 transition-colors hover:text-error"
                  >
                    ×
                  </button>
                </span>
              ))}
              {industries.length === 0 && (
                <span className="text-xs text-text-muted">No industries added yet.</span>
              )}
            </div>
          </div>
        </div>

        {/* Work Experience */}
        <div className="mt-10 border-t border-border pt-8">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold leading-6 text-text-primary">
              Work Experience
            </h3>
            {workExperience.length < 3 && (
              <button
                type="button"
                onClick={addWorkRole}
                className="text-sm font-medium leading-5 text-accent hover:text-accent-dark transition-colors"
              >
                + Add role
              </button>
            )}
          </div>

          <div className="mt-6 flex flex-col gap-4">
            {workExperience.map((role, index) => (
              <div
                key={index}
                className="rounded-xl border border-border bg-surface-secondary p-5 relative"
              >
                <button
                  type="button"
                  onClick={() => removeWorkRole(index)}
                  className="absolute top-4 right-4 text-xs font-semibold text-error hover:underline"
                >
                  Remove
                </button>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="text-xs font-semibold uppercase leading-4 text-text-secondary">
                      Company Name
                    </span>
                    <input
                      type="text"
                      required
                      value={role.company || ""}
                      onChange={(e) => updateWorkRole(index, "company", e.target.value)}
                      className="mt-2 h-11 w-full rounded-md border border-border bg-surface px-3 text-sm font-medium leading-5 text-text-primary outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                      placeholder="Company"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold uppercase leading-4 text-text-secondary">
                      Job Title
                    </span>
                    <input
                      type="text"
                      required
                      value={role.title || ""}
                      onChange={(e) => updateWorkRole(index, "title", e.target.value)}
                      className="mt-2 h-11 w-full rounded-md border border-border bg-surface px-3 text-sm font-medium leading-5 text-text-primary outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                      placeholder="Role"
                    />
                  </label>
                  <label className="block">
                    <span className="block h-5 text-xs font-semibold uppercase leading-4 text-text-secondary">
                      Start Date
                    </span>
                    <input
                      type="text"
                      required
                      value={role.startDate || ""}
                      onChange={(e) => updateWorkRole(index, "startDate", e.target.value)}
                      className="mt-2 h-11 w-full rounded-md border border-border bg-surface px-3 text-sm font-medium leading-5 text-text-primary outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                      placeholder="E.g. January 2022"
                    />
                  </label>
                  <div className="relative">
                    <span className="block h-5 text-xs font-semibold uppercase leading-4 text-text-secondary">
                      End Date
                    </span>
                    <input
                      type="text"
                      disabled={role.currentlyWorking || false}
                      value={role.currentlyWorking ? "" : role.endDate || ""}
                      onChange={(e) => updateWorkRole(index, "endDate", e.target.value)}
                      className="mt-2 h-11 w-full rounded-md border border-border bg-surface px-3 text-sm font-medium leading-5 text-text-primary outline-none placeholder:text-text-muted focus:border-accent focus:ring-1 focus:ring-accent disabled:opacity-50 disabled:bg-surface-tertiary"
                      placeholder={role.currentlyWorking ? "Present" : "E.g. December 2023"}
                      required={!role.currentlyWorking}
                    />
                    <label className="mt-3 flex h-5 items-center gap-2 text-xs font-medium leading-4 text-text-dark md:absolute md:right-0 md:top-0 md:mt-0">
                      <input
                        type="checkbox"
                        checked={role.currentlyWorking || false}
                        onChange={(e) => updateWorkRole(index, "currentlyWorking", e.target.checked)}
                        className="h-3.5 w-3.5 accent-info-medium"
                      />
                      Currently working here
                    </label>
                  </div>
                  <label className="block md:col-span-2">
                    <span className="text-xs font-semibold uppercase leading-4 text-text-secondary">
                      Key Responsibilities
                    </span>
                    <textarea
                      value={role.responsibilities || ""}
                      onChange={(e) => updateWorkRole(index, "responsibilities", e.target.value)}
                      className="mt-2 min-h-20 w-full rounded-md border border-border bg-surface px-3 py-3 text-sm font-medium leading-5 text-text-primary outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                      placeholder="Describe your role and key achievements..."
                    />
                  </label>
                </div>
              </div>
            ))}
            {workExperience.length === 0 && (
              <div className="text-center py-6 border border-dashed border-border rounded-xl text-text-secondary text-sm font-medium">
                No work experience added.
              </div>
            )}
          </div>
        </div>

        {/* Education */}
        <div className="mt-10 border-t border-border pt-8">
          <h3 className="text-base font-semibold leading-6 text-text-primary">
            Education
          </h3>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-xs font-semibold uppercase leading-4 text-text-secondary">
                Highest Degree
              </span>
              <select
                value={education.degree || "high_school"}
                onChange={(e) => updateEducation("degree", e.target.value)}
                className="mt-2 h-11 w-full rounded-md border border-border bg-surface px-3 text-sm font-medium leading-5 text-text-primary outline-none focus:border-accent focus:ring-1 focus:ring-accent"
              >
                <option value="high_school">High School</option>
                <option value="bachelors">Bachelors Degree</option>
                <option value="masters">Masters Degree</option>
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase leading-4 text-text-secondary">
                Field of Study
              </span>
              <input
                type="text"
                value={education.fieldOfStudy || ""}
                onChange={(e) => updateEducation("fieldOfStudy", e.target.value)}
                className="mt-2 h-11 w-full rounded-md border border-border bg-surface px-3 text-sm font-medium leading-5 text-text-primary outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                placeholder="E.g. Computer Science"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase leading-4 text-text-secondary">
                Institution Name
              </span>
              <input
                type="text"
                value={education.institution || ""}
                onChange={(e) => updateEducation("institution", e.target.value)}
                className="mt-2 h-11 w-full rounded-md border border-border bg-surface px-3 text-sm font-medium leading-5 text-text-primary outline-none placeholder:text-text-muted focus:border-accent focus:ring-1 focus:ring-accent"
                placeholder="E.g. State University"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase leading-4 text-text-secondary">
                Graduation Year
              </span>
              <input
                type="text"
                value={education.graduationYear || ""}
                onChange={(e) => updateEducation("graduationYear", e.target.value)}
                className="mt-2 h-11 w-full rounded-md border border-border bg-surface px-3 text-sm font-medium leading-5 text-text-primary outline-none placeholder:text-text-muted focus:border-accent focus:ring-1 focus:ring-accent"
                placeholder="YYYY"
              />
            </label>
          </div>
        </div>

        {/* Job Preferences */}
        <div className="mt-10 border-t border-border pt-8">
          <h3 className="text-base font-semibold leading-6 text-text-primary">
            Job Preferences
          </h3>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="block md:col-span-2">
              <span className="text-xs font-semibold uppercase leading-4 text-text-secondary">
                Job Titles Seeking
              </span>
              <input
                type="text"
                value={jobTitlesSeekingInput}
                onChange={(e) => setJobTitlesSeekingInput(e.target.value)}
                className="mt-2 h-11 w-full rounded-md border border-border bg-surface px-3 text-sm font-medium leading-5 text-text-primary outline-none placeholder:text-text-muted focus:border-accent focus:ring-1 focus:ring-accent"
                placeholder="E.g. Frontend Engineer, React Developer"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase leading-4 text-text-secondary">
                Remote Preference
              </span>
              <select
                value={remotePreference}
                onChange={(e) => setRemotePreference(e.target.value)}
                className="mt-2 h-11 w-full rounded-md border border-border bg-surface px-3 text-sm font-medium leading-5 text-text-primary outline-none focus:border-accent focus:ring-1 focus:ring-accent"
              >
                <option value="any">Any</option>
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
                <option value="onsite">Onsite</option>
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase leading-4 text-text-secondary">
                Salary Expectation (Optional)
              </span>
              <input
                type="text"
                value={salaryExpectation}
                onChange={(e) => setSalaryExpectation(e.target.value)}
                className="mt-2 h-11 w-full rounded-md border border-border bg-surface px-3 text-sm font-medium leading-5 text-text-primary outline-none placeholder:text-text-muted focus:border-accent focus:ring-1 focus:ring-accent"
                placeholder="E.g. $120k+"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase leading-4 text-text-secondary">
                Cover Letter Tone (Optional)
              </span>
              <select
                value={coverLetterTone}
                onChange={(e) => setCoverLetterTone(e.target.value)}
                className="mt-2 h-11 w-full rounded-md border border-border bg-surface px-3 text-sm font-medium leading-5 text-text-primary outline-none focus:border-accent focus:ring-1 focus:ring-accent"
              >
                <option value="">No preference</option>
                <option value="formal">Formal</option>
                <option value="casual">Casual</option>
                <option value="enthusiastic">Enthusiastic</option>
              </select>
            </label>
            <label className="block md:col-span-2">
              <span className="text-xs font-semibold uppercase leading-4 text-text-secondary">
                Preferred Locations (Optional)
              </span>
              <input
                type="text"
                value={preferredLocationsInput}
                onChange={(e) => setPreferredLocationsInput(e.target.value)}
                className="mt-2 h-11 w-full rounded-md border border-border bg-surface px-3 text-sm font-medium leading-5 text-text-primary outline-none placeholder:text-text-muted focus:border-accent focus:ring-1 focus:ring-accent"
                placeholder="E.g. New York, London"
              />
            </label>
          </div>
        </div>

        {/* Save button */}
        <div className="mt-10 border-t border-border pt-8">
          <button
            type="submit"
            disabled={isPending}
            className="h-12 w-full rounded-md bg-accent px-4 py-2 text-sm font-semibold leading-5 text-accent-foreground hover:bg-accent-dark transition-colors disabled:opacity-50"
          >
            {isPending ? "Saving Profile..." : "Save Profile"}
          </button>
        </div>
      </form>
    </section>
  );
}
