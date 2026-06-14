import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "JobPilot",
  description:
    "AI-powered job hunting assistant for finding, matching, and researching developer jobs.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        {children}
        <Toaster
          closeButton
          expand={false}
          gap={8}
          mobileOffset={16}
          offset={24}
          position="bottom-right"
          visibleToasts={3}
        />
      </body>
    </html>
  );
}
