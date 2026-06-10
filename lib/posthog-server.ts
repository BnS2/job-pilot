import { PostHog } from "posthog-node";

import { requirePublicEnv } from "@/lib/env";
import type {
  PostHogEventName,
  PostHogEventProperties,
} from "@/lib/posthog-events";

export function createPostHogServer(): PostHog {
  return new PostHog(requirePublicEnv("NEXT_PUBLIC_POSTHOG_KEY"), {
    host: requirePublicEnv("NEXT_PUBLIC_POSTHOG_HOST"),
    flushAt: 1,
    flushInterval: 0,
  });
}

export async function capturePostHogServerEvent<
  EventName extends PostHogEventName,
>(
  distinctId: string,
  event: EventName,
  properties: PostHogEventProperties[EventName],
): Promise<void> {
  try {
    const posthog = createPostHogServer();

    try {
      posthog.capture({
        distinctId,
        event,
        properties,
      });
    } finally {
      await posthog.shutdown();
    }
  } catch (error) {
    console.error("[posthog/server]", error);
  }
}
