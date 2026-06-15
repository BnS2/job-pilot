export function getJobSourceProvider(rawUrl: string): string {
  let hostname: string;

  try {
    hostname = new URL(rawUrl).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "unknown";
  }

  if (hostname.includes("jobstreet.")) return "jobstreet";
  if (hostname.includes("linkedin.")) return "linkedin";
  if (hostname.includes("indeed.")) return "indeed";
  if (hostname.includes("foundit.")) return "foundit";
  if (hostname.includes("seek.")) return "seek";
  if (hostname.includes("glassdoor.")) return "glassdoor";

  const firstLabel = hostname.split(".")[0];
  return firstLabel?.replace(/[^a-z0-9_-]/g, "") || "unknown";
}

export function getSourceProviderLabel(provider: string | null | undefined): string {
  switch (provider) {
    case "adzuna":
      return "Adzuna";
    case "jobstreet":
      return "JobStreet";
    case "linkedin":
      return "LinkedIn";
    case "indeed":
      return "Indeed";
    case "foundit":
      return "Foundit";
    case "seek":
      return "SEEK";
    case "glassdoor":
      return "Glassdoor";
    case "unknown":
    case null:
    case undefined:
      return "URL";
    default:
      return provider
        .split(/[-_]/)
        .filter(Boolean)
        .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
        .join(" ") || "URL";
  }
}

