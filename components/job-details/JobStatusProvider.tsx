"use client";

import { type ReactNode, createContext, useCallback, useContext, useState } from "react";

import type { JobStatus } from "@/lib/utils";

type JobStatusContextValue = {
  status: JobStatus;
  setStatus: (next: JobStatus) => void;
};

const JobStatusContext = createContext<JobStatusContextValue | null>(null);

export function useJobStatus(): JobStatusContextValue {
  const ctx = useContext(JobStatusContext);
  if (!ctx) {
    throw new Error("useJobStatus must be used within a <JobStatusProvider>");
  }
  return ctx;
}

type Props = {
  children: ReactNode;
  initialStatus: JobStatus;
};

export function JobStatusProvider({ children, initialStatus }: Props) {
  const [status, setStatus] = useState<JobStatus>(initialStatus);
  const handleStatusChange = useCallback((next: JobStatus) => setStatus(next), []);

  return (
    <JobStatusContext.Provider value={{ status, setStatus: handleStatusChange }}>
      {children}
    </JobStatusContext.Provider>
  );
}
