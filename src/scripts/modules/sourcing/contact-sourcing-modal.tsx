import { useState } from "react";
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
} from "@mui/material";
import { Close } from "@mui/icons-material";

interface ContactSourcingModalProps {
  open: boolean;
  onClose: () => void;
  onSave?: (data: ContactSourcingData) => void;
}

export interface ContactSourcingData {
  name: string;
  cpf: string;
  email: string;
  phone: string;
  title: string;
}

const formatCPF = (value: string) => {
  const numbers = value.replace(/\D/g, "");

  if (numbers.length <= 3) {
    return numbers;
  } else if (numbers.length <= 6) {
    return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
  } else if (numbers.length <= 9) {
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
  } else {
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(
      6,
      9
    )}-${numbers.slice(9, 11)}`;
  }
};

const formatPhoneNumber = (value: string) => {
  const numbers = value.replace(/\D/g, "");

  if (numbers.length <= 2) {
    return numbers;
  } else if (numbers.length <= 7) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  } else {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(
      7,
      11
    )}`;
  }
};

export function ContactSourcingModal({
  open,
  onClose,
  onSave,
}: ContactSourcingModalProps) {
  const theme = useTheme();
  const [formData, setFormData] = useState<ContactSourcingData>({
    name: "",
    cpf: "",
    email: "",
    phone: "",
    title: "",
  });

  const handleChange = (field: keyof ContactSourcingData, value: string) => {
    let formattedValue = value;

    if (field === "cpf") {
      formattedValue = formatCPF(value);
    } else if (field === "phone") {
      formattedValue = formatPhoneNumber(value);
    }

    setFormData((prev) => ({
      ...prev,
      [field]: formattedValue,
    }));
  };

  const handleClear = () => {
    setFormData({
      name: "",
      cpf: "",
      email: "",
      phone: "",
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
            Captação de contato
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
            {/* Nome */}
            <TextField
              label="Nome *"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              fullWidth
              required
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                },
              }}
            />

            {/* CPF, E-mail e Telefone */}
            <Box
              sx={{
                display: "flex",
                gap: 2,
                flexDirection: { xs: "column", sm: "row" },
              }}
            >
              <TextField
                label="CPF *"
                value={formData.cpf}
                onChange={(e) => handleChange("cpf", e.target.value)}
                required
                inputProps={{
                  maxLength: 14,
                }}
                sx={{
                  flex: { xs: 1, sm: "0 0 150px" },
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                  },
                }}
              />
              <TextField
                label="E-mail"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                sx={{
                  flex: 1,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                  },
                }}
              />
              <TextField
                label="Telefone"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                inputProps={{
                  maxLength: 15,
                }}
                sx={{
                  flex: { xs: 1, sm: "0 0 180px" },
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                  },
                }}
              />
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
            color: theme.palette.common.white,
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
              color: theme.palette.common.white,
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
            Captar contato
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
}
