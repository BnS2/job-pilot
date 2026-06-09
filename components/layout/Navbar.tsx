import Image from "next/image";
import Link from "next/link";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/find-jobs", label: "Find Jobs" },
  { href: "/profile", label: "Profile" },
];

export function Navbar() {
  return (
    <header className="h-16 border-b border-border bg-surface">
      <div className="mx-auto flex h-full max-w-[1110px] items-center justify-between px-4 sm:px-6">
        <Link href="/" aria-label="JobPilot home">
          <Image src="/logo.png" alt="JobPilot" width={118} height={40} priority />
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-medium text-text-dark sm:flex">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/login"
          className="rounded-md bg-overlay px-4 py-2 text-sm font-medium text-accent-foreground"
        >
          Start for free
        </Link>
      </div>
    </header>
  );
}
