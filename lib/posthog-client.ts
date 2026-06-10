"use client";

import posthog from "posthog-js";

import type {
  PostHogEventName,
  PostHogEventProperties,
} from "@/lib/posthog-events";

export function capturePostHogEvent<EventName extends PostHogEventName>(
  event: EventName,
  properties: PostHogEventProperties[EventName],
): void {
  posthog.capture(event, properties);
}

export function capturePostHogException(error: unknown): void {
  posthog.captureException(error);
}

export function getPostHogDistinctId(): string {
  return posthog.get_distinct_id();
}

export function getPostHogSessionId(): string {
  return posthog.get_session_id() ?? "";
}

export function identifyPostHogUser(userId: string, email?: string): void {
  posthog.identify(userId, email ? { email } : undefined);
}

export function resetPostHogUser(): void {
  posthog.reset();
}
