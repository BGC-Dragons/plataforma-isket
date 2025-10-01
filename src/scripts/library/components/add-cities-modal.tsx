import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  IconButton,
  Alert,
  useTheme,
} from "@mui/material";
import { Close, Add, LocationOn } from "@mui/icons-material";
import { CitySelect } from "./city-select";

interface AddCitiesModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (cities: string[]) => void;
  existingCities?: string[];
  isLoading?: boolean;
  apiError?: string | null;
}

export function AddCitiesModal({
  open,
  onClose,
  onSave,
  existingCities = [],
  isLoading = false,
  apiError = null,
}: AddCitiesModalProps) {
  const theme = useTheme();
  const [selectedCities, setSelectedCities] =
    useState<string[]>(existingCities);
  const [currentCity, setCurrentCity] = useState("");
  const [error, setError] = useState("");

  const handleAddCity = async () => {
    if (!currentCity.trim()) {
      setError("Selecione uma cidade para adicionar");
      return;
    }

    if (selectedCities.includes(currentCity)) {
      setError("Esta cidade já foi adicionada");
      return;
    }

    // Adicionar cidade diretamente via API
    try {
      await onSave([currentCity]);
      setCurrentCity("");
      setError("");
    } catch (err) {
      console.error("Erro ao adicionar cidade:", err);
      setError("Erro ao adicionar cidade. Tente novamente.");
    }
  };

  // Removido handleRemoveCity - não precisamos mais

  // Removido handleSave - não precisamos mais

  const handleClose = () => {
    setSelectedCities(existingCities);
    setCurrentCity("");
    setError("");
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          background: theme.palette.brand.surface,
          backdropFilter: "blur(20px)",
          border: `1px solid ${theme.palette.brand.border}`,
          boxShadow: theme.palette.brand.shadow,
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          pb: 1,
          borderBottom: `1px solid ${theme.palette.brand.border}`,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <LocationOn sx={{ color: theme.palette.brand.primary }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Adicionar Cidades
          </Typography>
        </Box>
        <IconButton
          onClick={handleClose}
          size="small"
          sx={{
            color: theme.palette.text.secondary,
            "&:hover": {
              color: theme.palette.brand.primary,
              backgroundColor: `${theme.palette.brand.primary}14`,
            },
          }}
        >
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 2.5, opacity: 0.7, fontSize: "0.875rem" }}
        >
          Procure a cidade que deseja adicionar ao seu plano. <br /> IMPORTANTE:
          Após adicionar a cidade, você poderá alterá-la somente 1 vêz por mês.
        </Typography>

        {(error || apiError) && (
          <Alert
            severity="error"
            sx={{ mb: 2.5, borderRadius: 1.5, fontSize: "0.875rem" }}
          >
            {apiError || error}
          </Alert>
        )}

        <Box sx={{ mb: 2.5 }}>
          <CitySelect
            value={currentCity}
            onChange={setCurrentCity}
            label="Buscar cidade"
            sx={{ mb: 2 }}
          />
          <Button
            variant="outlined"
            startIcon={<Add />}
            onClick={handleAddCity}
            disabled={!currentCity.trim() || isLoading}
            size="small"
            sx={{
              textTransform: "none",
              borderRadius: 1.5,
              borderColor: theme.palette.brand.border,
              color: theme.palette.brand.primary,
              px: 2,
              py: 0.5,
              fontSize: "0.875rem",
              "&:hover": {
                borderColor: theme.palette.brand.primary,
                backgroundColor: `${theme.palette.brand.primary}08`,
              },
            }}
          >
            Adicionar
          </Button>
        </Box>

        {existingCities.length > 0 && (
          <Box>
            <Typography
              variant="subtitle2"
              sx={{ mb: 1.5, fontWeight: 500, fontSize: "0.875rem" }}
            >
              Cidades Atuais ({existingCities.length})
            </Typography>
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 0.75,
                maxHeight: 160,
                overflow: "auto",
                p: 1.5,
                border: `1px solid ${theme.palette.brand.border}`,
                borderRadius: 1.5,
                backgroundColor: `${theme.palette.brand.light}50`,
              }}
            >
              {existingCities.map((city, index) => (
                <Chip
                  key={`${city}-${index}`}
                  label={city}
                  size="small"
                  sx={{
                    backgroundColor: `${theme.palette.brand.primary}15`,
                    color: theme.palette.brand.primary,
                    border: `1px solid ${theme.palette.brand.primary}30`,
                    fontSize: "0.8rem",
                    height: "28px",
                    "&:hover": {
                      backgroundColor: `${theme.palette.brand.primary}25`,
                      borderColor: theme.palette.brand.primary,
                    },
                  }}
                />
              ))}
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions
        sx={{
          p: 2.5,
          pt: 1.5,
          borderTop: `1px solid ${theme.palette.brand.border}`,
          gap: 1.5,
          justifyContent: "flex-end",
        }}
      >
        <Button
          onClick={handleClose}
          size="small"
          disabled={isLoading}
          sx={{
            textTransform: "none",
            color: theme.palette.text.secondary,
            px: 2,
            py: 0.5,
            fontSize: "0.875rem",
            "&:hover": {
              backgroundColor: `${theme.palette.text.secondary}08`,
            },
          }}
        >
          Fechar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
