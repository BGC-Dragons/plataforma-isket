import { useState } from "react";
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
} from "@mui/material";
import { Close } from "@mui/icons-material";

interface PropertySourcingModalProps {
  open: boolean;
  onClose: () => void;
  onSave?: (data: PropertySourcingData) => void;
}

export interface PropertySourcingData {
  address: string;
  number: string;
  complement: string;
  propertyType: string;
  title: string;
}

const propertyTypes = [
  "Apartamento",
  "Casa",
  "Terreno",
  "Sala Comercial",
  "Loja",
  "Galpão",
  "Outro",
];

export function PropertySourcingModal({
  open,
  onClose,
  onSave,
}: PropertySourcingModalProps) {
  const theme = useTheme();
  const [formData, setFormData] = useState<PropertySourcingData>({
    address: "",
    number: "",
    complement: "",
    propertyType: "",
    title: "",
  });

  const handleChange = (field: keyof PropertySourcingData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleClear = () => {
    setFormData({
      address: "",
      number: "",
      complement: "",
      propertyType: "",
      title: "",
    });
  };

  const handleSave = () => {
    onSave?.(formData);
    handleClear();
    onClose();
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
        <Box sx={{ p: 3 }}>
          <Typography
            variant="body1"
            sx={{
              mb: 3,
              color: theme.palette.text.secondary,
              fontSize: "1rem",
            }}
          >
            Preencha as informações do imóvel que deseja captar.
          </Typography>

          {/* Form Fields */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {/* Endereço */}
            <TextField
              label="Endereço"
              value={formData.address}
              onChange={(e) => handleChange("address", e.target.value)}
              fullWidth
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                },
              }}
            />

            {/* Número, Complemento e Tipo do Imóvel */}
            <Box
              sx={{
                display: "flex",
                gap: 2,
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
                  },
                }}
              />
              <FormControl
                sx={{
                  flex: 1,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
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
                    <MenuItem key={type} value={type}>
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
          justifyContent: "space-between",
        }}
      >
        <Button
          onClick={handleClear}
          sx={{
            textTransform: "none",
          }}
        >
          Limpar
        </Button>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button
            onClick={handleClose}
            variant="contained"
            sx={{
              textTransform: "none",
              borderRadius: 2,
              px: 3,
              borderColor: theme.palette.divider,
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
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
            Captar imóvel
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
}
