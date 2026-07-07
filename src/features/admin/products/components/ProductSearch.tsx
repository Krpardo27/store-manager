"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type ProductSearchProps = {
  placeholder?: string;
  autoFocus?: boolean;
  showScannerHint?: boolean;
};

export default function ProductSearch({
  placeholder = "Buscar por nombre, SKU o descripcion...",
  autoFocus = false,
  showScannerHint = false,
}: ProductSearchProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState(() => searchParams.get("q") ?? "");

  const commitSearch = useCallback((rawValue: string) => {
    const normalized = rawValue.trim();
    const urlQuery = (searchParams.get("q") ?? "").trim();

    if (normalized === urlQuery) {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());

    if (normalized) {
      params.set("q", normalized);
    } else {
      params.delete("q");
    }

    params.set("page", "1");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [pathname, router, searchParams]);

  useEffect(() => {
    if (!autoFocus) {
      return;
    }

    inputRef.current?.focus();
  }, [autoFocus]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      commitSearch(query);
    }, 250);

    return () => {
      clearTimeout(timeout);
    };
  }, [commitSearch, query]);

  return (
    <div className="w-full sm:max-w-md">
      <label className="block w-full">
        <span className="sr-only">Buscar productos</span>
        <div className="relative">
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key !== "Enter") {
                return;
              }

              event.preventDefault();
              commitSearch(query);
              inputRef.current?.select();
            }}
            placeholder={placeholder}
            className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 pr-16 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-500"
          />

          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                commitSearch("");
                inputRef.current?.focus();
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs font-semibold text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
            >
              Limpiar
            </button>
          )}
        </div>
      </label>

      {showScannerHint && (
        <p className="mt-2 text-xs text-zinc-500">
          Modo lector: escanea el codigo y el Enter del dispositivo buscara al instante.
        </p>
      )}
    </div>
  );
}
