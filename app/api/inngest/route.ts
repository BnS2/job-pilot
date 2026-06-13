import { serve } from "inngest/next";

import { companyResearch } from "@/inngest/functions/companyResearch";
import { jobDiscovery } from "@/inngest/functions/jobDiscovery";
import { inngest } from "@/inngest/client";

export const runtime = "nodejs";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [companyResearch, jobDiscovery],
});
