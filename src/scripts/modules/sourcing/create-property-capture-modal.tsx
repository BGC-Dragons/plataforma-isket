import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  IconButton,
  TextField,
  Button,
  useTheme,
  CircularProgress,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import { Close } from "@mui/icons-material";
import { useAuth } from "../access-manager/auth.hook";
import { postProperties } from "../../../services/post-properties.service";
import { postPropertyListingAcquisition } from "../../../services/post-property-listing-acquisition.service";
import {
  useGetPropertyListingAcquisitionsStages,
  clearPropertyListingAcquisitionsStagesCache,
} from "../../../services/get-property-listing-acquisitions-stages.service";
import { mapPropertyTypeToApi } from "../../../services/helpers/map-property-type-to-api.helper";
import { postPropertyListingAcquisitionContactHistory } from "../../../services/post-property-listing-acquisition-contact-history.service";
import {
  putRevealedProperty,
  postRevealedPropertiesMultiple,
} from "../../../services/get-property-listing-acquisitions-revealed-properties.service";
import type { IRevealedProperty } from "../../../services/get-property-listing-acquisitions-revealed-properties.service";

interface CreatePropertyCaptureModalProps {
  open: boolean;
  onClose: () => void;
  property: IRevealedProperty;
  contactName: string;
  contactCpf: string;
  contactPhones?: string[];
  contactEmails?: string[];
  onCaptureCreated?: (captureId: string) => void;
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

export function CreatePropertyCaptureModal({
  open,
  onClose,
  property,
  contactName,
  contactCpf,
  contactPhones = [],
  contactEmails = [],
  onCaptureCreated,
}: CreatePropertyCaptureModalProps) {
  const theme = useTheme();
  const auth = useAuth();
  const { data: stages, mutate: mutateStages } =
    useGetPropertyListingAcquisitionsStages();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    address: "",
    complement: "",
    propertyType: "",
    title: "",
  });

  // Extrair endereço formatado e número da propriedade
  useEffect(() => {
    if (open && property) {
      // Construir endereço formatado completo
      const addressParts: string[] = [];

      // Usar rawAddress.formattedAddress se disponível, senão construir do address
      if (property.rawAddress?.formattedAddress) {
        addressParts.push(property.rawAddress.formattedAddress);
      } else if (property.address) {
        addressParts.push(property.address);
        if (property.neighborhood) {
          addressParts.push(property.neighborhood);
        }
        if (property.city && property.state) {
          addressParts.push(`${property.city} - ${property.state}`);
        } else if (property.city) {
          addressParts.push(property.city);
        }
        if (property.postalCode) {
          addressParts.push(property.postalCode);
        }
      }

      const formattedAddress = addressParts.join(", ");

      setFormData({
        address: formattedAddress,
        complement: property.complement || "",
        propertyType: "",
        title: property.address || formattedAddress,
      });
      setError(null);
    }
  }, [open, property]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCreate = async () => {
    if (!auth.store.token) {
      setError("Você precisa estar autenticado para criar a captação");
      return;
    }

    if (!formData.address) {
      setError("Por favor, informe o endereço");
      return;
    }

    if (!formData.propertyType) {
      setError("Por favor, selecione o tipo do imóvel");
      return;
    }

    if (!stages || stages.length === 0) {
      setError(
        "Nenhum estágio de captação encontrado. Por favor, crie um estágio primeiro."
      );
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      // Extrair número do endereço
      const addressParts = formData.address.split(",").map((p) => p.trim());
      let streetNumber = 0;
      let street = "";

      // Tentar extrair número do endereço
      if (property.rawAddress?.number) {
        streetNumber = property.rawAddress.number;
      } else if (addressParts.length >= 2) {
        // Formato: "RUA, NUMERO, ..."
        street = addressParts[0];
        const numberMatch = addressParts[1].match(/\d+/);
        if (numberMatch) {
          streetNumber = parseInt(numberMatch[0], 10);
        }
      } else if (addressParts.length === 1) {
        // Formato: "RUA NUMERO"
        const numberMatch = addressParts[0].match(/(\d+)/);
        if (numberMatch) {
          streetNumber = parseInt(numberMatch[1], 10);
          street = addressParts[0].replace(/\d+.*/, "").trim();
        }
      }

      if (isNaN(streetNumber) || streetNumber === 0) {
        throw new Error("Não foi possível extrair o número do endereço");
      }

      // Mapear tipo de imóvel
      const propertyType = mapPropertyTypeToApi(formData.propertyType);

      // Construir formattedAddress completo
      const formattedAddressParts: string[] = [];
      if (street) {
        formattedAddressParts.push(street);
      } else {
        formattedAddressParts.push(addressParts[0] || "");
      }
      formattedAddressParts.push(streetNumber.toString());
      if (property.neighborhood) {
        formattedAddressParts.push(property.neighborhood);
      }
      if (property.city && property.state) {
        formattedAddressParts.push(`${property.city} - ${property.state}`);
      } else if (property.city) {
        formattedAddressParts.push(property.city);
      }
      if (property.postalCode) {
        formattedAddressParts.push(property.postalCode);
      }

      const fullFormattedAddress = formattedAddressParts.join(", ");

      // 1. Criar a propriedade (POST /properties)
      const propertyPayload: Parameters<typeof postProperties>[1] = {
        type: propertyType,
        streetNumber,
        formattedAddress: fullFormattedAddress,
        description: formData.title || undefined,
        acquisitionStatus: "IN_ACQUISITION",
        addressComplementId: formData.complement || "",
      };

      // Adicionar informações adicionais se disponíveis
      if (property.neighborhood) {
        propertyPayload.neighborhood = property.neighborhood;
      }
      if (property.city) {
        propertyPayload.city = property.city;
      }
      if (property.state) {
        propertyPayload.stateAcronym = property.state;
      }
      if (property.postalCode) {
        propertyPayload.postalCode = parseInt(
          property.postalCode.replace(/\D/g, ""),
          10
        );
      }

      const propertyResponse = await postProperties(
        auth.store.token,
        propertyPayload
      );
      const propertyId = propertyResponse.data.id;

      // 2. Obter o primeiro estágio (estágio inicial)
      const sortedStages = [...stages].sort((a, b) => a.order - b.order);
      const firstStage = sortedStages[0];
      const stageId = firstStage.id;

      // 3. Criar a captação (POST /property-listing-acquisitions/acquisitions)
      const acquisitionPayload = {
        title: formData.title || fullFormattedAddress || "Captação de Imóvel",
        description: formData.title || undefined,
        formattedAddress: fullFormattedAddress,
        addressNumber: streetNumber,
        addressComplement: formData.complement || undefined,
        propertyId: propertyId,
        stageId: stageId,
        captureType: "property" as const,
      };

      const acquisitionResponse = await postPropertyListingAcquisition(
        auth.store.token,
        acquisitionPayload
      );
      const acquisitionId = acquisitionResponse.data.id;

      // 4. Criar histórico de contato (POST /property-listing-acquisitions/contact-history)
      await postPropertyListingAcquisitionContactHistory(
        {
          acquisitionProcessId: acquisitionId,
          contactName: contactName,
          contactId: contactCpf.replace(/\D/g, ""), // Apenas números
          contactDate: new Date().toISOString(),
          phones: contactPhones,
          emails: contactEmails,
          status: "UNDEFINED",
        },
        auth.store.token
      );

      // 5. Atualizar propriedade revelada para marcar como captada
      // Verificar se a propriedade já existe na API (tem acquisitionId válido e não é ID temporário)
      const isValidAcquisitionId =
        property.acquisitionId &&
        property.acquisitionId.trim() !== "" &&
        !property.id.startsWith("temp-");

      if (isValidAcquisitionId) {
        // Propriedade já existe na API, apenas atualizar
        await putRevealedProperty(
          property.acquisitionId,
          property.id,
          {
            captureCreated: true,
            captureId: acquisitionId,
          },
          auth.store.token
        );
      } else {
        // Propriedade não existe na API ainda, precisa salvar primeiro
        // Salvar a propriedade revelada na captação recém-criada
        const response = await postRevealedPropertiesMultiple(
          acquisitionId,
          {
            cpf: contactCpf.replace(/\D/g, ""), // Apenas números
            properties: [
              {
                address: property.address,
                complement: property.complement,
                city: property.city,
                state: property.state,
                postalCode: property.postalCode,
                neighborhood: property.neighborhood,
                selectedRelation: property.selectedRelation || "owner",
              },
            ],
          },
          auth.store.token
        );

        // Se a resposta contém propriedades, atualizar a primeira para marcar como captada
        const savedProperties =
          response.data?.properties || response.data?.createdProperties || [];
        if (savedProperties.length > 0) {
          const savedProperty = savedProperties[0];
          await putRevealedProperty(
            acquisitionId,
            savedProperty.id,
            {
              captureCreated: true,
              captureId: acquisitionId,
            },
            auth.store.token
          );
        }
      }

      // Limpar cache e atualizar os stages/acquisitions
      clearPropertyListingAcquisitionsStagesCache();
      await mutateStages();

      // Chamar callback
      onCaptureCreated?.(acquisitionId);

      // Fechar modal
      onClose();
    } catch (error: unknown) {
      console.error("Erro ao criar captação:", error);
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as {
          response?: { status?: number; data?: { message?: string } };
        };
        const errorMessage =
          axiosError.response?.data?.message ||
          "Erro ao criar captação. Tente novamente.";
        setError(errorMessage);
      } else if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Erro inesperado ao criar captação. Tente novamente.");
      }
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
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
            p: 3,
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              fontSize: "1.5rem",
              color: theme.palette.text.primary,
            }}
          >
            Criar captação
          </Typography>
          <IconButton
            onClick={onClose}
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
        <Box sx={{ p: 3 }}>
          <Typography
            variant="body2"
            sx={{
              mb: 3,
              color: theme.palette.text.secondary,
              fontSize: "0.875rem",
            }}
          >
            Certifique-se de que o endereço contém rua, número, bairro, cidade e
            estado.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Form Fields */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {/* Endereço */}
            <TextField
              label="Endereço *"
              value={formData.address}
              onChange={(e) => handleChange("address", e.target.value)}
              fullWidth
              required
              multiline
              rows={2}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                },
              }}
            />

            {/* Complemento */}
            <TextField
              label="Complemento"
              value={formData.complement}
              onChange={(e) => handleChange("complement", e.target.value)}
              fullWidth
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                },
              }}
            />

            {/* Tipo de imóvel */}
            <FormControl fullWidth required>
              <InputLabel>Tipo do imóvel</InputLabel>
              <Select
                value={formData.propertyType}
                onChange={(e) => handleChange("propertyType", e.target.value)}
                label="Tipo do imóvel"
                sx={{
                  borderRadius: 2,
                }}
              >
                {propertyTypes.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Título da captação */}
            <TextField
              label="Título da captação"
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
              fullWidth
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                },
              }}
            />
          </Box>
        </Box>
      </DialogContent>

      {/* Actions */}
      <DialogActions
        sx={{
          p: 3,
          borderTop: `1px solid ${theme.palette.divider}`,
          justifyContent: "flex-end",
          gap: 2,
        }}
      >
        <Button
          onClick={onClose}
          variant="outlined"
          disabled={isCreating}
          sx={{
            textTransform: "none",
            borderRadius: 2,
            px: 3,
            borderColor: theme.palette.divider,
            color: theme.palette.text.primary,
            "&:hover": {
              borderColor: theme.palette.text.secondary,
            },
          }}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleCreate}
          variant="contained"
          disabled={isCreating}
          sx={{
            textTransform: "none",
            borderRadius: 2,
            px: 3,
            backgroundColor: theme.palette.primary.main,
            "&:hover": {
              backgroundColor: theme.palette.primary.dark,
            },
          }}
        >
          {isCreating ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <CircularProgress size={16} sx={{ color: "inherit" }} />
              Captando...
            </Box>
          ) : (
            "Captar"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
