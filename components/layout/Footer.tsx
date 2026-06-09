import Image from "next/image";
import Link from "next/link";

const footerLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms & Condition" },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto flex max-w-[1110px] flex-col gap-8 px-4 py-12 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <Link href="/" aria-label="JobPilot home">
          <Image src="/logo.png" alt="JobPilot" width={118} height={40} />
        </Link>

        <nav className="flex flex-wrap items-center gap-8 text-sm font-medium text-text-dark">
          {footerLinks.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
