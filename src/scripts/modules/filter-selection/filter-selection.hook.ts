import { useContext } from "react";
import { FilterSelectionContext } from "./filter-selection-context-definition";
import type { FilterSelectionContextType } from "./filter-selection-context-definition";

export function useFilterSelection(): FilterSelectionContextType {
  const context = useContext(FilterSelectionContext);
  if (context === undefined) {
    throw new Error(
      "useFilterSelection deve ser usado dentro de FilterSelectionProvider"
    );
  }
  return context;
}
