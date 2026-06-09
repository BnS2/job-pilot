import { BottomCta } from "@/components/homepage/BottomCta";
import { FeatureSplit } from "@/components/homepage/FeatureSplit";
import { Hero } from "@/components/homepage/Hero";
import { Testimonial } from "@/components/homepage/Testimonial";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";

export default function Home() {
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
