import { useState, useCallback, type ReactNode } from "react";
import {
  FilterSelectionContext,
  type FilterSelectionContextType,
} from "./filter-selection-context-definition";
import type { FilterState } from "../search/filter/filter.types";

interface FilterSelectionProviderProps {
  children: ReactNode;
}

export function FilterSelectionProvider({
  children,
}: FilterSelectionProviderProps) {
  const [filters, setFiltersState] = useState<FilterState | undefined>(
    undefined
  );

  const setFilters = useCallback((newFilters: FilterState | undefined) => {
    setFiltersState(newFilters);
  }, []);

  const clearFilters = useCallback(() => {
    setFiltersState(undefined);
  }, []);

  const value: FilterSelectionContextType = {
    filters,
    setFilters,
    clearFilters,
  };

  return (
    <FilterSelectionContext.Provider value={value}>
      {children}
    </FilterSelectionContext.Provider>
  );
}
