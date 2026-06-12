"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Props = {
  page: number;
  pageSize: number;
  totalCount: number;
};

function getPageNumbers(currentPage: number, totalPages: number): (number | string)[] {
  const delta = 1;
  const range: number[] = [];
  const rangeWithDots: (number | string)[] = [];
  let l: number | undefined;

  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
      range.push(i);
    }
  }

  for (const i of range) {
    if (l !== undefined) {
      if (i - l === 2) {
        rangeWithDots.push(l + 1);
      } else if (i - l > 2) {
        rangeWithDots.push("...");
      }
    }
    rangeWithDots.push(i);
    l = i;
  }

  return rangeWithDots;
}

export function JobsPagination({ page, pageSize, totalCount }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const safeFromNum = totalCount === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const toNum = Math.min(safePage * pageSize, totalCount);

  function handlePageChange(newPage: number): void {
    if (newPage < 1 || newPage > totalPages) return;
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    if (newPage === 1) {
      current.delete("page");
    } else {
      current.set("page", String(newPage));
    }
    const queryString = current.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
      scroll: false,
    });
  }

  const pages = getPageNumbers(safePage, totalPages);

  return (
    <div className="flex flex-col gap-4 border-t border-border px-6 py-5 text-sm font-medium leading-5 text-text-secondary sm:flex-row sm:items-center sm:justify-between">
      <p>
        Showing <span className="text-text-primary">{safeFromNum}</span> to{" "}
        <span className="text-text-primary">{toNum}</span> of{" "}
        <span className="font-semibold text-text-primary">{totalCount}</span> results
      </p>

      {totalPages > 1 && (
        <nav aria-label="Jobs pagination" className="flex flex-wrap items-center gap-2">
          <button
            className="h-10 rounded-md border border-border bg-surface px-4 text-text-primary shadow-sm hover:border-text-secondary transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 disabled:text-text-muted disabled:border-border"
            disabled={safePage === 1}
            onClick={() => handlePageChange(safePage - 1)}
            type="button"
          >
            Previous
          </button>
          {pages.map((p, index) =>
            p === "..." ? (
              <span
                key={`dots-${index}`}
                className="flex h-10 w-10 items-center justify-center text-text-muted"
              >
                ...
              </span>
            ) : (
              <button
                key={`page-${p}`}
                aria-current={p === safePage ? "page" : undefined}
                className={
                  p === safePage
                    ? "h-10 w-10 rounded-md border border-accent/20 bg-accent-muted text-accent shadow-sm cursor-pointer"
                    : "h-10 w-10 rounded-md border border-border bg-surface text-text-secondary shadow-sm hover:border-text-secondary transition-colors cursor-pointer"
                }
                onClick={() => handlePageChange(Number(p))}
                type="button"
              >
                {p}
              </button>
            ),
          )}
          <button
            className="h-10 rounded-md border border-border bg-surface px-4 text-text-primary shadow-sm hover:border-text-secondary transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 disabled:text-text-muted disabled:border-border"
            disabled={safePage === totalPages}
            onClick={() => handlePageChange(safePage + 1)}
            type="button"
          >
            Next
          </button>
        </nav>
      )}
    </div>
  );
}
