import { cookies } from "next/headers";
import { createServerClient } from "@insforge/sdk/ssr";

import { requirePublicEnv } from "@/lib/env";

export async function createInsforgeServer() {
  return createServerClient({
    baseUrl: requirePublicEnv("NEXT_PUBLIC_INSFORGE_URL"),
    anonKey: requirePublicEnv("NEXT_PUBLIC_INSFORGE_ANON_KEY"),
    cookies: await cookies(),
  });
}
