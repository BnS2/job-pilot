import { redirect } from "next/navigation";

import { BottomCta } from "@/components/homepage/BottomCta";
import { FeatureSplit } from "@/components/homepage/FeatureSplit";
import { Hero } from "@/components/homepage/Hero";
import { Testimonial } from "@/components/homepage/Testimonial";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { createInsforgeServer } from "@/lib/insforge-server";

export default async function Home() {
  const insforge = await createInsforgeServer();
  const { data } = await insforge.auth.getCurrentUser();

  if (data.user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />
      <main className="mx-auto max-w-[1110px] px-4 py-12 sm:px-6">
        <Hero />
        <FeatureSplit />
        <Testimonial />
        <BottomCta />
      </main>
      <Footer />
    </div>
  );
}
