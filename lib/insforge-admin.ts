import { createAdminClient } from "@insforge/sdk";

import { requirePublicEnv, requireServerEnv } from "@/lib/env";

export function createInsforgeAdmin() {
  return createAdminClient({
    baseUrl: requirePublicEnv("NEXT_PUBLIC_INSFORGE_URL"),
    apiKey: requireServerEnv("INSFORGE_API_KEY"),
  });
}
