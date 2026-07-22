"use client";

import { useMemo, useState } from "react";
import { matchesQuery, paginate } from "@/lib/pagination";

export function useFilteredPagination<T>(
  items: T[],
  getSearchValues: (item: T) => Array<string | undefined | null>,
  options?: { initialPageSize?: number }
) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(options?.initialPageSize || 10);

  const filtered = useMemo(
    () => items.filter((item) => matchesQuery(getSearchValues(item), query)),
    [items, query, getSearchValues]
  );

  const result = useMemo(() => paginate(filtered, page, pageSize), [filtered, page, pageSize]);

  function updateQuery(value: string) {
    setQuery(value);
    setPage(1);
  }

  function updatePageSize(value: number) {
    setPageSize(value);
    setPage(1);
  }

  return {
    query,
    setQuery: updateQuery,
    page: result.page,
    setPage,
    pageSize: result.pageSize,
    setPageSize: updatePageSize,
    filteredCount: filtered.length,
    pageItems: result.items,
    totalPages: result.totalPages,
    total: result.total
  };
}
