import { useContext } from "react";
import { CitySelectionContext } from "./city-selection-context-definition";
import type { CitySelectionContextType } from "./city-selection-context-definition";

export function useCitySelection(): CitySelectionContextType {
  const context = useContext(CitySelectionContext);
  if (context === undefined) {
    throw new Error(
      "useCitySelection deve ser usado dentro de CitySelectionProvider"
    );
  }
  return context;
}
