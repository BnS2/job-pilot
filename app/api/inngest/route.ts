import { serve } from "inngest/next";

import { companyResearch } from "@/inngest/functions/companyResearch";
import { jobDiscovery } from "@/inngest/functions/jobDiscovery";
import { jobUrlImport } from "@/inngest/functions/jobUrlImport";
import { inngest } from "@/inngest/client";
import { resumeExtraction } from "@/inngest/functions/resumeExtraction";
import { resumeGeneration } from "@/inngest/functions/resumeGeneration";

export const runtime = "nodejs";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    companyResearch,
    jobDiscovery,
    jobUrlImport,
    resumeExtraction,
    resumeGeneration,
  ],
});
