import { createContext } from "react";
import type { FilterState } from "../search/filter/filter.types";

export interface FilterSelectionContextType {
  filters: FilterState | undefined;
  setFilters: (filters: FilterState | undefined) => void;
  clearFilters: () => void;
}

export const FilterSelectionContext = createContext<
  FilterSelectionContextType | undefined
>(undefined);
