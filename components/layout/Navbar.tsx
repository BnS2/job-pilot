import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

type NavIcon = "dashboard" | "search" | "profile";

const navItems: Array<{ href: string; label: string; icon: NavIcon }> = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/find-jobs", label: "Find Jobs", icon: "search" },
  { href: "/profile", label: "Profile", icon: "profile" },
];

type NavbarProps = {
  activePath?: string;
  fullWidth?: boolean;
  showCta?: boolean;
};

function renderNavIcon(icon: NavIcon): ReactNode {
  if (icon === "dashboard") {
    return (
      <svg
        aria-hidden="true"
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
      >
        <path
          d="M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Z"
          stroke="currentColor"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
      </svg>
    );
  }

  if (icon === "search") {
    return (
      <svg
        aria-hidden="true"
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
      >
        <path
          d="m20 20-4.5-4.5m2.5-5A7.5 7.5 0 1 1 3 10.5a7.5 7.5 0 0 1 15 0Z"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
      </svg>
    );
  }

  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7 8a7 7 0 0 0-14 0"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

export function Navbar({
  activePath,
  fullWidth = false,
  showCta = true,
}: NavbarProps) {
  return (
    <header className="h-16 border-b border-border bg-surface">
      <div
        className={
          fullWidth
            ? "mx-auto flex h-full max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-8"
            : "mx-auto flex h-full max-w-[1110px] items-center justify-between px-4 sm:px-6"
        }
      >
        <Link href="/" aria-label="JobPilot home">
          <Image src="/logo.png" alt="JobPilot" width={118} height={40} loading="eager" />
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-medium text-text-dark sm:flex">
          {navItems.map((item) => {
            const isActive = activePath === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={false}
                aria-current={isActive ? "page" : undefined}
                className={
                  isActive
                    ? "inline-flex items-center gap-2 py-5 text-accent"
                    : "inline-flex items-center gap-2 py-5 text-text-dark"
                }
              >
                {renderNavIcon(item.icon)}
                {item.label}
              </Link>
            );
          })}
        </nav>

        {showCta ? (
          <Link
            href="/login"
            className="rounded-md bg-overlay px-4 py-2 text-sm font-medium text-accent-foreground"
          >
            Start for free
          </Link>
        ) : null}
      </div>
    </header>
  );
}
