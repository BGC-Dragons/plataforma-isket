import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

const CITY_SELECTION_STORAGE_KEY = "isket_selected_cities";

interface CitySelectionContextType {
  cities: string[];
  setCities: (cities: string[]) => void;
  clearCities: () => void;
}

const CitySelectionContext = createContext<CitySelectionContextType | undefined>(undefined);

interface CitySelectionProviderProps {
  children: ReactNode;
}

export function CitySelectionProvider({ children }: CitySelectionProviderProps) {
  // Inicializar do localStorage
  const [cities, setCitiesState] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(CITY_SELECTION_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.every((item) => typeof item === "string")) {
          return parsed;
        }
      }
    } catch (error) {
      console.error("Erro ao ler cidades do localStorage:", error);
    }
    return [];
  });

  // Salvar no localStorage quando mudar
  useEffect(() => {
    try {
      if (cities.length > 0) {
        localStorage.setItem(CITY_SELECTION_STORAGE_KEY, JSON.stringify(cities));
      } else {
        localStorage.removeItem(CITY_SELECTION_STORAGE_KEY);
      }
    } catch (error) {
      console.error("Erro ao salvar cidades no localStorage:", error);
    }
  }, [cities]);

  const setCities = useCallback((newCities: string[]) => {
    setCitiesState(newCities);
  }, []);

  const clearCities = useCallback(() => {
    setCitiesState([]);
  }, []);

  const value: CitySelectionContextType = {
    cities,
    setCities,
    clearCities,
  };

  return (
    <CitySelectionContext.Provider value={value}>
      {children}
    </CitySelectionContext.Provider>
  );
}

export function useCitySelection(): CitySelectionContextType {
  const context = useContext(CitySelectionContext);
  if (context === undefined) {
    throw new Error("useCitySelection deve ser usado dentro de CitySelectionProvider");
  }
  return context;
}
