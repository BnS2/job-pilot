type PublicEnvName =
  | "NEXT_PUBLIC_INSFORGE_URL"
  | "NEXT_PUBLIC_INSFORGE_ANON_KEY"
  | "NEXT_PUBLIC_POSTHOG_KEY"
  | "NEXT_PUBLIC_POSTHOG_HOST";

export function requirePublicEnv(name: PublicEnvName): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}
