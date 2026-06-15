"use client";

import { useState } from "react";

import { JobDetailsEditor } from "@/components/job-details/JobDetailsEditor";
import type { EditableJobDetails } from "@/components/job-details/JobDetailsEditor";
import { JobHeader } from "@/components/job-details/JobHeader";
import { JobInfoGrid } from "@/components/job-details/JobInfoGrid";

type Props = {
  company: string;
  foundAt: string | null;
  job: EditableJobDetails;
  jobType: string | null;
  location: string | null;
  matchScore: number;
  salary: string | null;
  title: string;
};

export function JobHeaderWithEdit({
  company,
  foundAt,
  job,
  jobType,
  location,
  matchScore,
  salary,
  title,
}: Props) {
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing) {
    return (
      <JobDetailsEditor
        isOpen
        onCancel={() => setIsEditing(false)}
        job={job}
      />
    );
  }

  return (
    <>
      <JobHeader
        company={company}
        matchScore={matchScore}
        onEditClick={() => setIsEditing(true)}
        title={title}
      />
      <JobInfoGrid
        foundAt={foundAt}
        jobType={jobType}
        location={location}
        salary={salary}
      />
    </>
  );
}
