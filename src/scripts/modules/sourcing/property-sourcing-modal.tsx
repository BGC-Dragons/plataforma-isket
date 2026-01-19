import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { Loader } from "@googlemaps/js-api-loader";
import {
  Dialog,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  IconButton,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  useTheme,
  Autocomplete,
  InputAdornment,
  CircularProgress,
  Alert,
} from "@mui/material";
import { Close, Search } from "@mui/icons-material";
import { useAuth } from "../access-manager/auth.hook";
import { postProperties } from "../../../services/post-properties.service";
import { postPropertyListingAcquisition } from "../../../services/post-property-listing-acquisition.service";
import {
  useGetPropertyListingAcquisitionsStages,
  clearPropertyListingAcquisitionsStagesCache,
} from "../../../services/get-property-listing-acquisitions-stages.service";
import { mapPropertyTypeToApi } from "../../../services/helpers/map-property-type-to-api.helper";
import { GOOGLE_CONFIG } from "../../config/google.constant";

interface PropertySourcingModalProps {
  open: boolean;
  onClose: () => void;
  onSave?: (data: PropertySourcingData, acquisitionId?: string) => void;
  initialData?: PropertySourcingData;
}

export interface PropertySourcingData {
  address: string;
  number: string;
  complement: string;
  propertyType: string;
  title: string;
  formattedAddress?: string; // Endereço completo formatado para uso na API
}

const propertyTypes = [
  "Apartamento",
  "Casa",
  "Terreno",
  "Sobrado",
  "Sala",
  "Cobertura",
  "Chácara",
  "Galpão",
  "Ponto",
  "Predio",
  "Loja",
  "Fazenda",
  "Sitio",
  "Flat",
  "Conjunto",
  "Kitnet",
  "Studio",
  "Garagem",
  "Andar",
  "Garden",
  "Loft",
  "Industrial",
  "Granja",
  "Duplex",
  "Geminado",
  "Haras",
  "Clinica",
  "Pousada",
  "Sobreloja",
  "Chale",
  "Quarto",
  "Resort",
  "Comercial",
  "Triplex",
  "Republica",
  "Coworking",
  "Box",
  "Edicula",
  "Tombado",
  "Casa Comercial",
  "Outros",
];

export function PropertySourcingModal({
  open,
  onClose,
  onSave,
  initialData,
}: PropertySourcingModalProps) {
  const theme = useTheme();
  const navigate = useNavigate();
  const auth = useAuth();
  const { data: stages, mutate } = useGetPropertyListingAcquisitionsStages();
  const [formData, setFormData] = useState<PropertySourcingData>({
    address: "",
    number: "",
    complement: "",
    propertyType: "",
    title: "",
  });

  // Sincronizar initialData com formData quando o modal abrir
  useEffect(() => {
    if (open && initialData) {
      setFormData({
        address: initialData.address || "",
        number: initialData.number || "",
        complement: initialData.complement || "",
        propertyType: initialData.propertyType || "",
        title: initialData.title || "",
        formattedAddress: initialData.formattedAddress,
      });
      // Sincronizar searchInputValue com o endereço
      // O useEffect existente também sincroniza, mas este garante que o initialData seja aplicado primeiro
      setSearchInputValue(initialData.address || "");
    }
  }, [open, initialData]);

  // Estados para autocomplete de endereço
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
  const [autocompleteOptions, setAutocompleteOptions] = useState<
    google.maps.places.AutocompletePrediction[]
  >([]);
  const [searchInputValue, setSearchInputValue] = useState("");
  const [addressDetails, setAddressDetails] = useState<{
    placeId?: string;
    formattedAddress?: string;
    street?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    coordinates?: { lat: number; lng: number };
    addressComponents?: google.maps.places.PlaceResult["address_components"];
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const autocompleteInputRef = useRef<HTMLInputElement | null>(null);
  const autocompleteService =
    useRef<google.maps.places.AutocompleteService | null>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);

  // Carregar Google Maps API para autocomplete de endereços
  useEffect(() => {
    if (!open) return; // Só carregar quando o modal estiver aberto

    // Verificar se já está carregado
    if (
      typeof window !== "undefined" &&
      window.google &&
      window.google.maps &&
      window.google.maps.places
    ) {
      const AutocompleteService = window.google.maps.places.AutocompleteService;
      const PlacesService = window.google.maps.places.PlacesService;

      if (
        typeof AutocompleteService === "function" &&
        typeof PlacesService === "function"
      ) {
        if (!autocompleteService.current) {
          autocompleteService.current = new AutocompleteService();
        }
        if (!placesService.current) {
          placesService.current = new PlacesService(
            document.createElement("div")
          );
        }
        setIsGoogleLoaded(true);
        return;
      }
    }

    // Carregar usando Loader do @react-google-maps/api
    const loader = new Loader({
      apiKey: GOOGLE_CONFIG.MAPS_API_KEY,
      version: "weekly",
      libraries: ["places"],
    });

    loader
      .load()
      .then(() => {
        if (
          typeof window !== "undefined" &&
          window.google &&
          window.google.maps &&
          window.google.maps.places
        ) {
          const AutocompleteService =
            window.google.maps.places.AutocompleteService;
          const PlacesService = window.google.maps.places.PlacesService;

          if (
            typeof AutocompleteService === "function" &&
            typeof PlacesService === "function"
          ) {
            autocompleteService.current = new AutocompleteService();
            placesService.current = new PlacesService(
              document.createElement("div")
            );
            setIsGoogleLoaded(true);
          }
        }
      })
      .catch((error) => {
        console.error("Erro ao carregar Google Maps API:", error);
      });
  }, [open]);

  // Buscar endereços quando o usuário digita
  const searchAddresses = useCallback(
    (query: string) => {
      if (!isGoogleLoaded || !autocompleteService.current) {
        setAutocompleteOptions([]);
        return;
      }

      if (query.length < 3) {
        setAutocompleteOptions([]);
        return;
      }

      try {
        const request: google.maps.places.AutocompletionRequest = {
          input: query,
          componentRestrictions: { country: "br" },
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
              setAutocompleteOptions(predictions);
            } else {
              setAutocompleteOptions([]);
            }
          }
        );
      } catch (error) {
        console.error("Erro ao buscar endereços:", error);
        setAutocompleteOptions([]);
      }
    },
    [isGoogleLoaded]
  );

  // Debounce para busca de endereços
  useEffect(() => {
    if (searchInputValue.length < 3) {
      setAutocompleteOptions([]);
      return;
    }

    if (!isGoogleLoaded) {
      // Se o Google não está carregado, limpar opções mas não buscar
      setAutocompleteOptions([]);
      return;
    }

    const timeoutId = setTimeout(() => {
      searchAddresses(searchInputValue);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchInputValue, isGoogleLoaded, searchAddresses]);

  const handleChange = (field: keyof PropertySourcingData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Função para obter detalhes do endereço selecionado
  const getAddressDetails = useCallback(
    (placeId: string, fallbackDescription?: string) => {
      if (!isGoogleLoaded || !placesService.current) {
        console.warn("Places Service não está disponível");
        return;
      }

      try {
        const request: google.maps.places.PlaceDetailsRequest = {
          placeId,
          fields: [
            "formatted_address",
            "address_components",
            "geometry",
            "place_id",
          ],
        };

        placesService.current.getDetails(request, (place, status) => {
          try {
            if (status === google.maps.places.PlacesServiceStatus.OK && place) {
              // Extrair informações do endereço
              const formattedAddress =
                place.formatted_address || fallbackDescription || "";

              let street = "";
              let neighborhood = "";
              let city = "";
              let state = "";
              let postalCode = "";
              let coordinates: { lat: number; lng: number } | undefined;

              if (place.address_components) {
                place.address_components.forEach((component) => {
                  const types = component.types;

                  if (types.includes("street_number")) {
                    // Número já está no campo separado
                  } else if (types.includes("route")) {
                    street = component.long_name;
                  } else if (
                    types.includes("sublocality") ||
                    types.includes("sublocality_level_1") ||
                    types.includes("neighborhood")
                  ) {
                    neighborhood = component.long_name;
                  } else if (
                    types.includes("locality") ||
                    types.includes("administrative_area_level_2")
                  ) {
                    city = component.long_name;
                  } else if (types.includes("administrative_area_level_1")) {
                    state = component.short_name;
                  } else if (types.includes("postal_code")) {
                    postalCode = component.long_name;
                  }
                });
              }

              if (place.geometry?.location) {
                coordinates = {
                  lat: place.geometry.location.lat(),
                  lng: place.geometry.location.lng(),
                };
              }

              // Armazenar detalhes do endereço
              setAddressDetails({
                placeId: place.place_id,
                formattedAddress,
                street,
                neighborhood,
                city,
                state,
                postalCode,
                coordinates,
                addressComponents: place.address_components,
              });

              setSearchInputValue(formattedAddress);
              handleChange("address", formattedAddress);
            } else if (fallbackDescription) {
              // Fallback: usar o description se não conseguir buscar detalhes
              setSearchInputValue(fallbackDescription);
              handleChange("address", fallbackDescription);
              setAddressDetails(null);
            }
          } catch (error) {
            console.error("Erro ao processar detalhes do lugar:", error);
            // Fallback em caso de erro
            if (fallbackDescription) {
              setSearchInputValue(fallbackDescription);
              handleChange("address", fallbackDescription);
              setAddressDetails(null);
            }
          }
        });
      } catch (error) {
        console.error("Erro ao buscar detalhes do lugar:", error);
        // Fallback em caso de erro
        if (fallbackDescription) {
          setSearchInputValue(fallbackDescription);
          handleChange("address", fallbackDescription);
          setAddressDetails(null);
        }
      }
    },
    [isGoogleLoaded]
  );

  // Handler para quando um endereço é selecionado no autocomplete
  const handleAddressSelect = useCallback(
    (
      _: React.SyntheticEvent,
      value: google.maps.places.AutocompletePrediction | string | null
    ) => {
      if (value && typeof value !== "string" && value.place_id) {
        // Definir o description temporariamente para melhor UX
        // O getAddressDetails vai atualizar com o formatted_address completo depois
        setSearchInputValue(value.description);
        // Passar o description como fallback caso não haja formatted_address
        getAddressDetails(value.place_id, value.description);
      } else if (typeof value === "string") {
        setSearchInputValue(value);
        handleChange("address", value);
      } else {
        // Quando limpar o campo
        setSearchInputValue("");
        handleChange("address", "");
      }
    },
    [getAddressDetails]
  );

  // Função para limpar busca de endereço
  const handleClearAddressSearch = useCallback(() => {
    setSearchInputValue("");
    setAutocompleteOptions([]);
    handleChange("address", "");
    setAddressDetails(null);
  }, []);

  // Limpar estados quando o modal fechar
  useEffect(() => {
    if (!open) {
      setSearchInputValue("");
      setAutocompleteOptions([]);
      setAddressDetails(null);
    } else {
      // Quando o modal abrir, sincronizar searchInputValue com formData.address
      setSearchInputValue(formData.address || "");
    }
  }, [open, formData.address]);

  const handleClear = () => {
    setFormData({
      address: "",
      number: "",
      complement: "",
      propertyType: "",
      title: "",
    });
    setSearchInputValue("");
    setAutocompleteOptions([]);
    setAddressDetails(null);
    setSaveError(null);
  };

  const handleSave = async () => {
    if (!auth.store.token) {
      setSaveError("Você precisa estar autenticado para captar um imóvel");
      return;
    }

    if (!formData.propertyType) {
      setSaveError("Por favor, selecione o tipo do imóvel");
      return;
    }

    if (!formData.address) {
      setSaveError("Por favor, informe o endereço");
      return;
    }

    if (!formData.number) {
      setSaveError("Por favor, informe o número do endereço");
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      // Mapear tipo de imóvel
      const propertyType = mapPropertyTypeToApi(formData.propertyType);

      // Preparar dados do endereço
      const streetNumber = parseInt(formData.number, 10);
      if (isNaN(streetNumber)) {
        throw new Error("Número do endereço inválido");
      }

      // Construir payload da API
      const payload: Parameters<typeof postProperties>[1] = {
        type: propertyType,
        streetNumber,
        formattedAddress: formData.address,
        description: formData.title || undefined,
        acquisitionStatus: "IN_ACQUISITION",
      };

      // Adicionar informações do endereço se disponíveis
      if (addressDetails) {
        if (addressDetails.street) {
          payload.street = addressDetails.street;
        }
        if (addressDetails.neighborhood) {
          payload.neighborhood = addressDetails.neighborhood;
        }
        if (addressDetails.city) {
          payload.city = addressDetails.city;
        }
        if (addressDetails.state) {
          payload.stateAcronym = addressDetails.state;
        }
        if (addressDetails.postalCode) {
          payload.postalCode = parseInt(
            addressDetails.postalCode.replace(/\D/g, ""),
            10
          );
        }
        if (addressDetails.coordinates) {
          payload.streetGeo = {
            lat: addressDetails.coordinates.lat,
            lon: addressDetails.coordinates.lng,
          };
        }
      }

      // 1. Criar a propriedade (POST /properties)
      const propertyResponse = await postProperties(auth.store.token, payload);
      const propertyId = propertyResponse.data.id;

      // 2. Obter o primeiro estágio (estágio inicial)
      if (!stages || stages.length === 0) {
        throw new Error(
          "Nenhum estágio de captação encontrado. Por favor, crie um estágio primeiro."
        );
      }

      // Ordenar estágios por ordem e pegar o primeiro (estágio inicial)
      const sortedStages = [...stages].sort((a, b) => a.order - b.order);
      const firstStage = sortedStages[0];
      const stageId = firstStage.id;

      // 3. Criar a captação (POST /property-listing-acquisitions/acquisitions)
      const acquisitionPayload = {
        title: formData.title || formData.address || "Captação de Imóvel",
        description: formData.title || undefined,
        formattedAddress: formData.address,
        addressNumber: streetNumber,
        addressComplement: formData.complement || undefined,
        addressGeo: addressDetails?.coordinates
          ? {
              lat: addressDetails.coordinates.lat,
              lon: addressDetails.coordinates.lng,
            }
          : undefined,
        propertyId: propertyId,
        stageId: stageId,
        captureType: "property" as const,
      };

      const acquisitionResponse = await postPropertyListingAcquisition(
        auth.store.token,
        acquisitionPayload
      );
      const acquisitionId = acquisitionResponse.data.id;

      // Limpar cache e atualizar os stages/acquisitions para aparecer imediatamente no Kanban
      clearPropertyListingAcquisitionsStagesCache();
      await mutate();

      // Chamar callback se existir, passando o ID da captação
      onSave?.(formData, acquisitionId);

      // Limpar formulário
      handleClear();

      // Fechar modal
      onClose();

      // Navegar para a página de captação
      navigate("/captacao");
    } catch (error: unknown) {
      console.error("Erro ao criar propriedade:", error);
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as {
          response?: { status?: number; data?: { message?: string } };
        };
        const errorMessage =
          axiosError.response?.data?.message ||
          "Erro ao criar propriedade. Tente novamente.";
        setSaveError(errorMessage);
      } else if (error instanceof Error) {
        setSaveError(error.message);
      } else {
        setSaveError("Erro inesperado ao criar propriedade. Tente novamente.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    handleClear();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: "hidden",
          boxShadow: theme.shadows[24],
        },
      }}
      BackdropProps={{
        sx: {
          backgroundColor: "rgba(0, 0, 0, 0.5)",
        },
      }}
    >
      <DialogContent sx={{ p: 0 }}>
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 3,
            py: 2,
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              fontSize: "1.25rem",
              color: theme.palette.text.primary,
            }}
          >
            Captação de imóvel
          </Typography>
          <IconButton
            onClick={handleClose}
            sx={{
              color: theme.palette.text.secondary,
              "&:hover": {
                backgroundColor: theme.palette.action.hover,
              },
            }}
          >
            <Close />
          </IconButton>
        </Box>

        {/* Content */}
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
          <Typography
            variant="body1"
            sx={{
              mb: { xs: 2, sm: 3 },
              color: theme.palette.text.secondary,
              fontSize: { xs: "0.875rem", sm: "1rem" },
            }}
          >
            Preencha as informações do imóvel que deseja captar.
          </Typography>

          {/* Form Fields */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: { xs: 2, sm: 3 } }}>
            {/* Mensagem de erro */}
            {saveError && (
              <Alert severity="error" onClose={() => setSaveError(null)} sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}>
                {saveError}
              </Alert>
            )}
            {/* Endereço com Busca (igual ao search) */}
            <Autocomplete
              freeSolo
              options={autocompleteOptions}
              value={formData.address}
              inputValue={searchInputValue}
              onInputChange={(_, newValue) => {
                setSearchInputValue(newValue);
                // Atualizar formData.address quando o usuário digita
                handleChange("address", newValue);
                // Limpar addressDetails quando o usuário digita manualmente
                setAddressDetails(null);
              }}
              onChange={handleAddressSelect}
              getOptionLabel={(option) => {
                if (typeof option === "string") return option;
                return option.description;
              }}
              isOptionEqualToValue={(option, value) => {
                if (typeof value === "string") {
                  return option.description === value;
                }
                return option.place_id === value.place_id;
              }}
              filterOptions={(x) => x}
              fullWidth
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Endereço"
                  placeholder="Buscar por endereço"
                  inputRef={autocompleteInputRef}
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search sx={{ color: theme.palette.text.secondary, fontSize: { xs: "1.125rem", sm: "1.25rem" } }} />
                      </InputAdornment>
                    ),
                    endAdornment: formData.address ? (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleClearAddressSearch();
                          }}
                          sx={{
                            p: 0.5,
                            color: theme.palette.text.secondary,
                            "&:hover": {
                              color: theme.palette.error.main,
                              backgroundColor: theme.palette.error.light,
                            },
                          }}
                        >
                          <Close fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    ) : null,
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                      fontSize: { xs: "0.9375rem", sm: "1rem" },
                    },
                    "& .MuiInputLabel-root": {
                      fontSize: { xs: "0.9375rem", sm: "1rem" },
                    },
                  }}
                />
              )}
              renderOption={(props, option) => (
                <li {...props} key={option.place_id}>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      width: "100%",
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 500, fontSize: { xs: "0.9375rem", sm: "1rem" } }}>
                      {option.structured_formatting.main_text}
                    </Typography>
                    {option.structured_formatting.secondary_text && (
                      <Typography
                        variant="caption"
                        sx={{ color: theme.palette.text.secondary, fontSize: { xs: "0.8125rem", sm: "0.875rem" } }}
                      >
                        {option.structured_formatting.secondary_text}
                      </Typography>
                    )}
                  </Box>
                </li>
              )}
            />

            {/* Número, Complemento e Tipo do Imóvel */}
            <Box
              sx={{
                display: "flex",
                gap: { xs: 1.5, sm: 2 },
                flexDirection: { xs: "column", sm: "row" },
              }}
            >
              <TextField
                label="Número"
                value={formData.number}
                onChange={(e) => handleChange("number", e.target.value)}
                sx={{
                  flex: { xs: 1, sm: "0 0 120px" },
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    fontSize: { xs: "0.9375rem", sm: "1rem" },
                  },
                  "& .MuiInputLabel-root": {
                    fontSize: { xs: "0.9375rem", sm: "1rem" },
                  },
                }}
              />
              <TextField
                label="Complemento"
                value={formData.complement}
                onChange={(e) => handleChange("complement", e.target.value)}
                sx={{
                  flex: { xs: 1, sm: "0 0 200px" },
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    fontSize: { xs: "0.9375rem", sm: "1rem" },
                  },
                  "& .MuiInputLabel-root": {
                    fontSize: { xs: "0.9375rem", sm: "1rem" },
                  },
                }}
              />
              <FormControl
                sx={{
                  flex: 1,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    fontSize: { xs: "0.9375rem", sm: "1rem" },
                  },
                  "& .MuiInputLabel-root": {
                    fontSize: { xs: "0.9375rem", sm: "1rem" },
                  },
                }}
              >
                <InputLabel>Tipo do imóvel</InputLabel>
                <Select
                  value={formData.propertyType}
                  onChange={(e) => handleChange("propertyType", e.target.value)}
                  label="Tipo do imóvel"
                >
                  {propertyTypes.map((type) => (
                    <MenuItem key={type} value={type} sx={{ fontSize: { xs: "0.9375rem", sm: "1rem" } }}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Título da captação */}
            <TextField
              label="Título da captação"
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
              fullWidth
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                  fontSize: { xs: "0.9375rem", sm: "1rem" },
                },
                "& .MuiInputLabel-root": {
                  fontSize: { xs: "0.9375rem", sm: "1rem" },
                },
              }}
            />
          </Box>
        </Box>
      </DialogContent>

      {/* Actions */}
      <DialogActions
        sx={{
          p: { xs: 2, sm: 3 },
          borderTop: `1px solid ${theme.palette.divider}`,
          flexDirection: "column",
          gap: { xs: 1.5, sm: 2 },
        }}
      >
        <Box sx={{ display: "flex", gap: { xs: 1, sm: 2 }, width: "100%" }}>
          <Button
            onClick={handleClear}
            sx={{
              textTransform: "none",
              fontSize: { xs: "0.875rem", sm: "1rem" },
              px: { xs: 1.5, sm: 3 },
              flex: 1,
            }}
          >
            Limpar
          </Button>
          <Button
            onClick={handleClose}
            variant="contained"
            sx={{
              textTransform: "none",
              borderRadius: 2,
              px: { xs: 1.5, sm: 3 },
              fontSize: { xs: "0.875rem", sm: "1rem" },
              borderColor: theme.palette.divider,
              flex: 1,
            }}
          >
            Cancelar
          </Button>
        </Box>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={isSaving}
          fullWidth
          sx={{
            textTransform: "none",
            borderRadius: 2,
            px: { xs: 1.5, sm: 3 },
            fontSize: { xs: "0.875rem", sm: "1rem" },
            backgroundColor: theme.palette.primary.main,
            "&:hover": {
              backgroundColor: theme.palette.primary.dark,
            },
            "&:disabled": {
              backgroundColor: theme.palette.action.disabledBackground,
            },
          }}
          startIcon={isSaving ? <CircularProgress size={16} /> : null}
        >
          {isSaving ? "Captando..." : "Captar imóvel"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
