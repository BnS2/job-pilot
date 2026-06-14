import { revalidatePath } from "next/cache";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

import { finishAgentRun, logAgentMessage, startAvailabilityCheckRun } from "@/agent/logs";
import { createInsforgeServer } from "@/lib/insforge-server";
import { capturePostHogServerEvent } from "@/lib/posthog-server";

const CHECK_COOLDOWN_MS = 1000 * 60 * 60 * 2; // 2 hours
const MAX_BODY_BYTES = 200_000;
const MAX_REDIRECTS = 5;

const EXPIRATION_PATTERNS = [
  "job has expired",
  "job is no longer available",
  "no longer accepting applications",
  "listing has ended",
  "this job is closed",
  "position has been filled",
  "job is filled",
];

type AvailabilityStatus = "active" | "unavailable";

type AvailabilityResult = {
  success: boolean;
  status: AvailabilityStatus;
  reason?: string;
};

type SafeUrlResult =
  | { success: true; url: URL }
  | { success: false; reason: string };

function isPrivateIpv4(address: string): boolean {
  const parts = address.split(".").map((part) => Number.parseInt(part, 10));

  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part))) {
    return true;
  }

  const [first, second] = parts;

  return (
    first === 0 ||
    first === 10 ||
    first === 127 ||
    first >= 224 ||
    (first === 100 && second >= 64 && second <= 127) ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168) ||
    (first === 198 && (second === 18 || second === 19))
  );
}

function isPrivateIpv6(address: string): boolean {
  const normalized = address.toLowerCase();

  return (
    normalized === "::" ||
    normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe8") ||
    normalized.startsWith("fe9") ||
    normalized.startsWith("fea") ||
    normalized.startsWith("feb") ||
    normalized.startsWith("ff")
  );
}

function isPublicAddress(address: string): boolean {
  const family = isIP(address);

  if (family === 4) {
    return !isPrivateIpv4(address);
  }

  if (family === 6) {
    return !isPrivateIpv6(address);
  }

  return false;
}

function isBlockedHostname(hostname: string): boolean {
  const normalized = hostname.toLowerCase().replace(/\.$/, "");

  return (
    normalized === "localhost" ||
    normalized === "host.docker.internal" ||
    normalized.endsWith(".localhost") ||
    normalized.endsWith(".local") ||
    normalized.endsWith(".internal") ||
    normalized === "metadata.google.internal"
  );
}

export async function getSafeFetchUrl(rawUrl: string): Promise<SafeUrlResult> {
  let parsed: URL;

  try {
    parsed = new URL(rawUrl);
  } catch {
    return { success: false, reason: "Invalid URL." };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { success: false, reason: "Unsupported URL protocol." };
  }

  if (parsed.username || parsed.password) {
    return { success: false, reason: "URL credentials are not allowed." };
  }

  const hostname = parsed.hostname.toLowerCase().replace(/\.$/, "");

  if (isBlockedHostname(hostname)) {
    return { success: false, reason: "Internal hostname is not allowed." };
  }

  const literalFamily = isIP(hostname);

  if (literalFamily && !isPublicAddress(hostname)) {
    return { success: false, reason: "Internal IP address is not allowed." };
  }

  if (!literalFamily) {
    try {
      const addresses = await lookup(hostname, { all: true });
      if (addresses.length === 0 || addresses.some((entry) => !isPublicAddress(entry.address))) {
        return { success: false, reason: "Hostname resolves to an internal address." };
      }
    } catch {
      return { success: false, reason: "Hostname could not be resolved." };
    }
  }

  return { success: true, url: parsed };
}

async function readResponseTextWithLimit(response: Response): Promise<string> {
  if (!response.body) {
    return "";
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const chunks: string[] = [];
  let bytesRead = 0;

  try {
    while (bytesRead < MAX_BODY_BYTES) {
      const { done, value } = await reader.read();

      if (done || !value) {
        break;
      }

      const availableBytes = MAX_BODY_BYTES - bytesRead;
      const chunk = value.byteLength > availableBytes ? value.slice(0, availableBytes) : value;
      bytesRead += chunk.byteLength;
      chunks.push(decoder.decode(chunk, { stream: bytesRead < MAX_BODY_BYTES }));

      if (value.byteLength > availableBytes) {
        break;
      }
    }
  } finally {
    await reader.cancel().catch(() => undefined);
  }

  chunks.push(decoder.decode());

  return chunks.join("");
}

export async function fetchWithSafeRedirects(
  initialUrl: URL,
  signal: AbortSignal,
): Promise<Response> {
  let currentUrl = initialUrl;

  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount++) {
    const response = await fetch(currentUrl, {
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      },
      signal,
      redirect: "manual",
    });

    if (![301, 302, 303, 307, 308].includes(response.status)) {
      return response;
    }

    const location = response.headers.get("location");

    if (!location) {
      return response;
    }

    const nextUrl = new URL(location, currentUrl);
    const safeUrl = await getSafeFetchUrl(nextUrl.href);

    if (!safeUrl.success) {
      throw new Error(`Unsafe redirect blocked: ${safeUrl.reason}`);
    }

    currentUrl = safeUrl.url;
  }

  throw new Error("Too many redirects while checking job availability.");
}

export async function checkJobAvailability(
  jobId: string,
  userId: string,
  force = false,
): Promise<AvailabilityResult> {
  try {
    const insforge = await createInsforgeServer();

    const { data: job, error: readError } = await insforge.database
      .from("jobs")
      .select("id, status, source_url, external_apply_url, availability_checked_at, company, title")
      .eq("id", jobId)
      .eq("user_id", userId)
      .maybeSingle();

    if (readError || !job) {
      console.error("[agent/availability] Failed to read job record:", readError);
      return { success: false, status: "active", reason: "Job not found." };
    }

    if (!force && job.availability_checked_at) {
      const elapsed = Date.now() - new Date(job.availability_checked_at).getTime();
      if (elapsed < CHECK_COOLDOWN_MS) {
        return {
          success: true,
          status: job.status === "unavailable" ? "unavailable" : "active",
          reason: "Checked recently.",
        };
      }
    }

    const url = job.external_apply_url?.trim() || job.source_url?.trim() || "";
    const now = new Date().toISOString();

    if (!url) {
      const { error } = await insforge.database
        .from("jobs")
        .update({ availability_checked_at: now })
        .eq("id", jobId)
        .eq("user_id", userId);

      if (error) {
        console.error("[agent/availability] Failed to update no-url check timestamp:", error);
      }

      return { success: true, status: "active", reason: "No URL to check." };
    }

    const safeUrl = await getSafeFetchUrl(url);

    if (!safeUrl.success) {
      const { error } = await insforge.database
        .from("jobs")
        .update({ availability_checked_at: now })
        .eq("id", jobId)
        .eq("user_id", userId);

      if (error) {
        console.error("[agent/availability] Failed to update unsafe-url check timestamp:", error);
      }

      return { success: true, status: "active", reason: safeUrl.reason };
    }

    const runId = await startAvailabilityCheckRun(userId);
    await logAgentMessage(
      userId,
      runId,
      "info",
      `Starting availability check for ${job.company} - ${job.title} using URL: ${safeUrl.url.href}`,
      jobId,
    );

    let newStatus: AvailabilityStatus = "active";
    let statusReason: string | null = null;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetchWithSafeRedirects(safeUrl.url, controller.signal);

      if (response.status === 404 || response.status === 410) {
        newStatus = "unavailable";
        statusReason = `HTTP ${response.status} - Listing not found`;
      } else if (response.status === 200) {
        const contentType = response.headers.get("content-type") || "";
        if (contentType.includes("text/html") || contentType.includes("text/plain")) {
          const textClamped = (await readResponseTextWithLimit(response)).toLowerCase();
          const foundPattern = EXPIRATION_PATTERNS.find((pattern) =>
            textClamped.includes(pattern),
          );

          if (foundPattern) {
            newStatus = "unavailable";
            statusReason = `Expiration pattern matched: "${foundPattern}"`;
          }
        }
      }

      const updateData: {
        availability_checked_at: string;
        status?: AvailabilityStatus;
        unavailable_at?: string | null;
        status_reason?: string | null;
      } = {
        availability_checked_at: now,
      };

      if (newStatus === "unavailable") {
        updateData.status = "unavailable";
        updateData.unavailable_at = now;
        updateData.status_reason = statusReason;
      }

      const { error: updateError } = await insforge.database
        .from("jobs")
        .update(updateData)
        .eq("id", jobId)
        .eq("user_id", userId);

      if (updateError) {
        console.error("[agent/availability] Failed to update job status:", updateError);
        await logAgentMessage(
          userId,
          runId,
          "error",
          `Failed to update database record: ${updateError.message}`,
          jobId,
        );
        await finishAgentRun(userId, runId, "failed");
        return { success: false, status: "active", reason: "Database update failed." };
      }

      if (newStatus === "unavailable") {
        await logAgentMessage(
          userId,
          runId,
          "warning",
          `Job marked unavailable: ${statusReason}`,
          jobId,
        );
        await capturePostHogServerEvent(userId, "job_unavailable_detected", {
          userId,
          jobId,
          source: "agent_checker",
          reason: statusReason,
        });
        await capturePostHogServerEvent(userId, "job_status_changed", {
          userId,
          jobId,
          fromStatus: typeof job.status === "string" ? job.status : "active",
          toStatus: "unavailable",
          reason: "agent_availability_check",
        });
      } else {
        await logAgentMessage(
          userId,
          runId,
          "success",
          "Job availability checked: listing appears active.",
          jobId,
        );
      }

      await finishAgentRun(userId, runId, "completed");

      revalidatePath("/find-jobs");
      revalidatePath(`/find-jobs/${jobId}`);

      return { success: true, status: newStatus };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      console.warn(`[agent/availability] Checker soft failure for ${safeUrl.url.href}:`, errorMessage);

      const { error: updateError } = await insforge.database
        .from("jobs")
        .update({ availability_checked_at: now })
        .eq("id", jobId)
        .eq("user_id", userId);

      if (updateError) {
        console.error("[agent/availability] Failed to update soft-failure timestamp:", updateError);
      }

      await logAgentMessage(
        userId,
        runId,
        "info",
        `Soft failure checking availability (ignored, left active): ${errorMessage}`,
        jobId,
      );
      await finishAgentRun(userId, runId, "completed");

      return { success: true, status: "active", reason: "Availability could not be confirmed." };
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    console.error("[agent/availability] System error:", error);
    return { success: false, status: "active", reason: "Availability check failed." };
  }
}
