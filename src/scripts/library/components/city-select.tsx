import { Autocomplete, TextField, useTheme } from "@mui/material";
import type { SxProps, Theme } from "@mui/material";
import { LocationOn } from "@mui/icons-material";
import { useEffect, useRef, useState } from "react";
import { Loader } from "@googlemaps/js-api-loader";

// Google Maps API Key
const GOOGLE_MAPS_API_KEY = "AIzaSyBp8wPork-ZIdEo1XOdR-83jJKl5MnRE-I";

interface CityOption {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

interface CitySelectProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  sx?: SxProps<Theme>;
}

export function CitySelect({
  value,
  onChange,
  label = "Selecione a cidade para as pesquisas de imóveis",
  required = false,
  disabled = false,
  sx = {},
}: CitySelectProps) {
  const theme = useTheme();
  const [options, setOptions] = useState<CityOption[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
  const autocompleteService =
    useRef<google.maps.places.AutocompleteService | null>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);

  // Carregar Google Maps API
  useEffect(() => {
    const loader = new Loader({
      apiKey: GOOGLE_MAPS_API_KEY,
      version: "weekly",
      libraries: ["places"],
    });

    loader
      .load()
      .then(() => {
        setIsGoogleLoaded(true);
        autocompleteService.current =
          new google.maps.places.AutocompleteService();
        placesService.current = new google.maps.places.PlacesService(
          document.createElement("div")
        );
      })
      .catch((error) => {
        console.error("Erro ao carregar Google Maps API:", error);
      });
  }, []);

  // Buscar cidades quando o usuário digita
  const searchCities = async (query: string) => {
    if (!autocompleteService.current || query.length < 2) {
      setOptions([]);
      return;
    }

    try {
      const request: google.maps.places.AutocompletionRequest = {
        input: query,
        types: ["(cities)"],
        componentRestrictions: { country: "br" }, // Restringir ao Brasil
        language: "pt-BR",
      };

      autocompleteService.current.getPlacePredictions(
        request,
        (
          predictions: google.maps.places.AutocompletePrediction[] | null,
          status: google.maps.places.PlacesServiceStatus
        ) => {
          if (
            status === google.maps.places.PlacesServiceStatus.OK &&
            predictions
          ) {
            setOptions(predictions as CityOption[]);
          } else {
            setOptions([]);
          }
        }
      );
    } catch (error) {
      console.error("Erro ao buscar cidades:", error);
      setOptions([]);
    }
  };

  // Debounce para evitar muitas requisições
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (inputValue.length >= 2) {
        searchCities(inputValue);
      } else {
        setOptions([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [inputValue]);

  // Converter o valor atual para o formato esperado pelo Autocomplete
  const getCurrentValue = () => {
    if (!value) return null;
    return {
      place_id: "",
      description: value,
      structured_formatting: {
        main_text: value,
        secondary_text: "",
      },
    };
  };

  return (
    <Autocomplete
      options={options}
      value={getCurrentValue()}
      onChange={(_, newValue) => {
        if (
          newValue &&
          typeof newValue === "object" &&
          "description" in newValue
        ) {
          onChange(newValue.description);
        } else {
          onChange("");
        }
      }}
      inputValue={inputValue}
      onInputChange={(_, newInputValue) => {
        setInputValue(newInputValue);
      }}
      getOptionLabel={(option) =>
        typeof option === "string" ? option : option.description
      }
      isOptionEqualToValue={(option, value) => {
        if (typeof value === "string") {
          return option.description === value;
        }
        return option.description === (value?.description || "");
      }}
      filterOptions={(x) => x} // Desabilita filtro local
      freeSolo
      autoComplete
      includeInputInList
      filterSelectedOptions
      disabled={disabled || !isGoogleLoaded}
      loading={!isGoogleLoaded}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          required={required}
          disabled={disabled || !isGoogleLoaded}
          placeholder={
            isGoogleLoaded ? "Digite o nome da cidade..." : "Carregando..."
          }
          InputProps={{
            ...params.InputProps,
            startAdornment: (
              <>
                <LocationOn
                  sx={{ color: "primary.main", opacity: 0.7, mr: 1 }}
                />
                {params.InputProps.startAdornment}
              </>
            ),
          }}
          sx={{
            borderRadius: 3,
            transition: "all 0.3s ease",
            "&:hover": {
              transform: "translateY(-2px)",
              boxShadow: theme.palette.brand.shadowHover,
            },
            "&.Mui-focused": {
              transform: "translateY(-2px)",
              boxShadow: theme.palette.brand.shadowFocus,
            },
            "& .MuiOutlinedInput-root": {
              borderRadius: 3,
            },
          }}
        />
      )}
      renderOption={(props, option) => (
        <li {...props}>
          <div
            style={{ display: "flex", flexDirection: "column", width: "100%" }}
          >
            <div style={{ fontWeight: 500, fontSize: "14px" }}>
              {option.structured_formatting.main_text}
            </div>
            {option.structured_formatting.secondary_text && (
              <div
                style={{
                  fontSize: "12px",
                  color: theme.palette.text.secondary,
                }}
              >
                {option.structured_formatting.secondary_text}
              </div>
            )}
          </div>
        </li>
      )}
      sx={{
        width: "100%",
        ...sx,
        "& .MuiAutocomplete-paper": {
          maxHeight: "200px !important",
          width: "auto",
          minWidth: "100%",
          boxShadow: theme.palette.brand.shadow,
          border: `1px solid ${theme.palette.brand.border}`,
          borderRadius: 2,
          mt: 0.5,
          overflow: "auto !important",
          "& .MuiAutocomplete-option": {
            padding: "8px 16px",
            fontSize: "14px",
            "&:hover": {
              backgroundColor: `${theme.palette.brand.secondary}14`,
            },
            "&.Mui-focused": {
              backgroundColor: `${theme.palette.brand.secondary}1F`,
            },
          },
          "&::-webkit-scrollbar": {
            width: "8px",
          },
          "&::-webkit-scrollbar-track": {
            background: theme.palette.brand.light,
            borderRadius: "4px",
          },
          "&::-webkit-scrollbar-thumb": {
            background: theme.palette.brand.primary,
            borderRadius: "4px",
            "&:hover": {
              background: theme.palette.brand.secondary,
            },
          },
        },
      }}
    />
  );
}
