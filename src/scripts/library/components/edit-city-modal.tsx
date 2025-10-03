import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  useTheme,
} from "@mui/material";
import { Close, LocationOn } from "@mui/icons-material";
import { CitySelect } from "./city-select";

interface EditCityModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (city: string) => void;
  currentCity: string;
  isLoading?: boolean;
}

export function EditCityModal({
  open,
  onClose,
  onSave,
  currentCity,
  isLoading = false,
}: EditCityModalProps) {
  const theme = useTheme();
  const [selectedCity, setSelectedCity] = useState("");

  const handleSave = () => {
    if (selectedCity.trim()) {
      onSave(selectedCity);
    }
  };

  const handleClose = () => {
    setSelectedCity("");
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
            Alterar Cidade
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
          Selecione uma nova cidade para substituir {currentCity}.
        </Typography>

        <Box sx={{ mb: 2.5 }}>
          <CitySelect
            value={selectedCity}
            onChange={setSelectedCity}
            label="Buscar cidade"
            sx={{ mb: 2 }}
          />
        </Box>
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
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={!selectedCity.trim() || isLoading}
          size="small"
          sx={{
            textTransform: "none",
            borderRadius: 1.5,
            px: 2,
            py: 0.5,
            fontSize: "0.875rem",
            backgroundColor: theme.palette.brand.primary,
            "&:hover": {
              backgroundColor: theme.palette.brand.secondary,
            },
          }}
        >
          Salvar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
