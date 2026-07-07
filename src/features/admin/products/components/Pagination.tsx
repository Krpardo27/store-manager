"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  itemLabel?: string;
}

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  itemLabel = "reservas",
}: PaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const from = (currentPage - 1) * itemsPerPage + 1;
  const to = Math.min(currentPage * itemsPerPage, totalItems);
  const hasMultiplePages = totalPages > 1;

  // Genera el rango de páginas visibles (máx 5)
  const getPageRange = () => {
    const delta = 2;
    const range: (number | "...")[] = [];
    const left = Math.max(2, currentPage - delta);
    const right = Math.min(totalPages - 1, currentPage + delta);

    range.push(1);
    if (left > 2) range.push("...");
    for (let i = left; i <= right; i++) range.push(i);
    if (right < totalPages - 1) range.push("...");
    if (totalPages > 1) range.push(totalPages);

    return range;
  };

  if (totalItems === 0) return null;

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
      <p className="text-sm text-zinc-600">
        Mostrando <span className="font-semibold text-zinc-900">{from}–{to}</span> de{" "}
        <span className="font-semibold text-zinc-900">{totalItems}</span> {itemLabel}
      </p>

      {hasMultiplePages && (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            aria-label="Ir a la página anterior"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <FiChevronLeft className="h-4 w-4" />
          </button>

          {getPageRange().map((page, i) =>
            page === "..." ? (
              <span key={`dots-${i}`} className="px-2 text-zinc-500">
                …
              </span>
            ) : (
              <button
                type="button"
                key={page}
                onClick={() => goToPage(page as number)}
                aria-current={currentPage === page ? "page" : undefined}
                aria-label={`Ir a la página ${page}`}
                className={`flex h-9 w-9 items-center justify-center rounded-lg border text-sm font-medium transition-colors ${currentPage === page
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                  }`}
              >
                {page}
              </button>
            )
          )}

          <button
            type="button"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            aria-label="Ir a la página siguiente"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <FiChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}