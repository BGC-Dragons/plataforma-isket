import { createContext } from "react";

export interface CitySelectionContextType {
  cities: string[];
  setCities: (cities: string[]) => void;
  clearCities: () => void;
}

export const CitySelectionContext = createContext<
  CitySelectionContextType | undefined
>(undefined);
