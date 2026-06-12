"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  type KeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

const searchDebounceMs = 700;

function SearchIcon({ className }: { className: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
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

function ChevronIcon({ className }: { className: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="m6 9 6 6 6-6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

type Props = {
  q: string;
  match: string;
  sort: string;
};

function normalizeSearchValue(value: string): string {
  return value
    .trim()
    .replace(/[^\p{L}\p{N}\s@._/+&#-]/gu, " ")
    .replace(/\s+/g, " ")
    .slice(0, 80);
}

export function JobFilters({ q, match, sort }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchVal, setSearchVal] = useState(q);
  const [matchOpen, setMatchOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const matchMenuRef = useRef<HTMLDivElement>(null);
  const sortMenuRef = useRef<HTMLDivElement>(null);

  const createQueryString = useCallback(
    (params: Record<string, string | null>) => {
      const current = new URLSearchParams(Array.from(searchParams.entries()));
      for (const [key, value] of Object.entries(params)) {
        if (value === null) {
          current.delete(key);
        } else {
          current.set(key, value);
        }
      }
      // reset page to 1 when changing filters or search
      if (!params.page) {
        current.delete("page");
      }
      return current.toString();
    },
    [searchParams]
  );

  const replaceWithQuery = useCallback(
    (queryString: string): void => {
      router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      const normalizedSearch = normalizeSearchValue(searchVal);

      if (normalizedSearch !== q) {
        const qs = createQueryString({ q: normalizedSearch || null });
        replaceWithQuery(qs);
      }
    }, searchDebounceMs);

    return () => clearTimeout(timer);
  }, [searchVal, q, createQueryString, replaceWithQuery]);

  useEffect(() => {
    function closeOnOutsidePointer(event: PointerEvent): void {
      const target = event.target;

      if (!(target instanceof Node)) {
        return;
      }

      if (matchOpen && !matchMenuRef.current?.contains(target)) {
        setMatchOpen(false);
      }

      if (sortOpen && !sortMenuRef.current?.contains(target)) {
        setSortOpen(false);
      }
    }

    document.addEventListener("pointerdown", closeOnOutsidePointer);

    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
    };
  }, [matchOpen, sortOpen]);

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      const normalizedSearch = normalizeSearchValue(searchVal);
      const qs = createQueryString({ q: normalizedSearch || null });
      setSearchVal(normalizedSearch);
      replaceWithQuery(qs);
    }
  }

  const matchOptions = [
    { value: "all", label: "All Matches" },
    { value: "high", label: "High Match (≥ 70%)" },
    { value: "low", label: "Low Match (< 70%)" },
  ];

  const sortOptions = [
    { value: "match", label: "Match Score" },
    { value: "newest", label: "Newest" },
    { value: "oldest", label: "Oldest" },
  ];

  const currentMatchLabel = matchOptions.find((o) => o.value === match)?.label || "All Matches";
  const currentSortLabel = sortOptions.find((o) => o.value === sort)?.label || "Match Score";

  return (
    <section
      aria-label="Job list controls"
      className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-4 shadow-sm lg:flex-row lg:items-center"
    >
      <label className="flex h-10 min-w-0 flex-1 items-center gap-3 text-text-muted">
        <SearchIcon className="h-5 w-5 shrink-0" />
        <span className="sr-only">Filter by company or role</span>
        <input
          className="h-full min-w-0 flex-1 bg-transparent text-sm font-medium leading-5 text-text-primary outline-none placeholder:text-text-muted"
          onChange={(e) => setSearchVal(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Filter by company or role..."
          type="text"
          value={searchVal}
        />
      </label>

      <div className="hidden h-10 w-px bg-border lg:block" />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Match Filter Dropdown */}
        <div className="relative" ref={matchMenuRef}>
          <button
            className="inline-flex h-10 w-full min-w-36 items-center justify-between gap-3 rounded-md border border-border bg-surface px-4 text-sm font-medium leading-5 text-text-primary shadow-sm hover:border-text-secondary transition-colors cursor-pointer"
            onClick={() => {
              setMatchOpen(!matchOpen);
              setSortOpen(false);
            }}
            type="button"
          >
            {currentMatchLabel}
            <ChevronIcon className="h-4 w-4 text-text-secondary" />
          </button>

          {matchOpen && (
            <div className="absolute right-0 z-20 mt-2 w-48 origin-top-right rounded-md border border-border bg-surface shadow-lg focus:outline-none">
              <div className="py-1">
                {matchOptions.map((opt) => (
                  <button
                    key={opt.value}
                    className={`block w-full px-4 py-2 text-left text-sm font-medium leading-5 transition-colors cursor-pointer ${
                      match === opt.value
                        ? "text-accent bg-accent-muted"
                        : "text-text-primary hover:bg-surface-secondary hover:text-text-dark"
                    }`}
                    onClick={() => {
                      const qs = createQueryString({ match: opt.value });
                      replaceWithQuery(qs);
                      setMatchOpen(false);
                    }}
                    type="button"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sort Filter Dropdown */}
        <div className="relative" ref={sortMenuRef}>
          <button
            className="inline-flex h-10 w-full min-w-40 items-center justify-between gap-3 rounded-md border border-border bg-surface px-4 text-sm font-medium leading-5 text-text-primary shadow-sm hover:border-text-secondary transition-colors cursor-pointer"
            onClick={() => {
              setSortOpen(!sortOpen);
              setMatchOpen(false);
            }}
            type="button"
          >
            {currentSortLabel}
            <ChevronIcon className="h-4 w-4 text-text-secondary" />
          </button>

          {sortOpen && (
            <div className="absolute right-0 z-20 mt-2 w-48 origin-top-right rounded-md border border-border bg-surface shadow-lg focus:outline-none">
              <div className="py-1">
                {sortOptions.map((opt) => (
                  <button
                    key={opt.value}
                    className={`block w-full px-4 py-2 text-left text-sm font-medium leading-5 transition-colors cursor-pointer ${
                      sort === opt.value
                        ? "text-accent bg-accent-muted"
                        : "text-text-primary hover:bg-surface-secondary hover:text-text-dark"
                    }`}
                    onClick={() => {
                      const qs = createQueryString({ sort: opt.value });
                      replaceWithQuery(qs);
                      setSortOpen(false);
                    }}
                    type="button"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
