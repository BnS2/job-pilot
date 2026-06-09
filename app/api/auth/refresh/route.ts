import { createRefreshAuthRouter } from "@insforge/sdk/ssr";

import { requirePublicEnv } from "@/lib/env";

export const { POST } = createRefreshAuthRouter({
  baseUrl: requirePublicEnv("NEXT_PUBLIC_INSFORGE_URL"),
  anonKey: requirePublicEnv("NEXT_PUBLIC_INSFORGE_ANON_KEY"),
});
