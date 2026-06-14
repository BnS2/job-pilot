type PublicEnvName =
  | "NEXT_PUBLIC_INSFORGE_URL"
  | "NEXT_PUBLIC_INSFORGE_ANON_KEY"
  | "NEXT_PUBLIC_POSTHOG_KEY"
  | "NEXT_PUBLIC_POSTHOG_HOST";

type ServerEnvName =
  | "ADZUNA_APP_ID"
  | "ADZUNA_APP_KEY"
  | "GEMINI_API_KEY"
  | "INSFORGE_API_KEY"
  | "INNGEST_EVENT_KEY"
  | "INNGEST_SIGNING_KEY";

export function requirePublicEnv(name: PublicEnvName): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function requireServerEnv(name: ServerEnvName): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}
