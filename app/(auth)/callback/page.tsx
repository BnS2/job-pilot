import { AuthCallback } from "@/components/auth/AuthCallback";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";

export default function CallbackPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto flex min-h-[calc(100vh-64px)] max-w-[1110px] items-center justify-center px-4 py-12 sm:px-6">
        <div className="w-full max-w-[440px]">
          <AuthCallback />
        </div>
      </main>
      <Footer />
    </div>
  );
}
