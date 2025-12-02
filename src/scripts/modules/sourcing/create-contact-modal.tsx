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
  CircularProgress,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import { Close } from "@mui/icons-material";
import { useAuth } from "../access-manager/auth.hook";
import {
  postPropertyListingAcquisitionContact,
  type ContactRelationship,
} from "../../../services/post-property-listing-acquisition-contact.service";

interface CreateContactModalProps {
  open: boolean;
  onClose: () => void;
  acquisitionProcessId: string;
  onContactCreated?: () => void;
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

const relationshipOptions: { value: ContactRelationship; label: string }[] = [
  { value: "familiar", label: "Familiar" },
  { value: "negocios", label: "Negócios" },
  { value: "amigo", label: "Amigo" },
  { value: "vizinho", label: "Vizinho" },
  { value: "outros", label: "Outros" },
];

export function CreateContactModal({
  open,
  onClose,
  acquisitionProcessId,
  onContactCreated,
}: CreateContactModalProps) {
  const theme = useTheme();
  const auth = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    cpf: "",
    email: "",
    phone: "",
    relationship: "outros" as ContactRelationship,
  });

  const handleChange = (
    field: keyof typeof formData,
    value: string | ContactRelationship
  ) => {
    let formattedValue = value;

    if (field === "cpf") {
      formattedValue = formatCPF(value as string);
    } else if (field === "phone") {
      formattedValue = formatPhoneNumber(value as string);
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
      relationship: "outros",
    });
    setSaveError(null);
  };

  const handleSave = async () => {
    if (!auth.store.token) {
      setSaveError("Você precisa estar autenticado para criar um contato");
      return;
    }

    if (!formData.name.trim()) {
      setSaveError("Por favor, informe o nome do contato");
      return;
    }

    if (!formData.cpf.trim()) {
      setSaveError("Por favor, informe o CPF do contato");
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      await postPropertyListingAcquisitionContact(
        acquisitionProcessId,
        {
          name: formData.name.trim(),
          cpf: formData.cpf.replace(/\D/g, ""), // Apenas números
          email: formData.email.trim() || undefined,
          phone: formData.phone.replace(/\D/g, "") || undefined, // Apenas números
          relationship: formData.relationship,
        },
        auth.store.token
      );

      // Chamar callback se existir
      onContactCreated?.();

      // Limpar formulário
      handleClear();

      // Fechar modal
      onClose();
    } catch (error: unknown) {
      console.error("Erro ao criar contato:", error);
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as {
          response?: { status?: number; data?: { message?: string } };
        };
        const errorMessage =
          axiosError.response?.data?.message ||
          "Erro ao criar contato. Tente novamente.";
        setSaveError(errorMessage);
      } else if (error instanceof Error) {
        setSaveError(error.message);
      } else {
        setSaveError("Erro inesperado ao criar contato. Tente novamente.");
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
            Criar contato
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
          {saveError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {saveError}
            </Alert>
          )}

          <Typography
            variant="body1"
            sx={{
              mb: 3,
              color: theme.palette.text.secondary,
              fontSize: "1rem",
            }}
          >
            Preencha as informações do contato que deseja adicionar.
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

            {/* CPF e Relacionamento */}
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
                  flex: { xs: 1, sm: "0 0 200px" },
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                  },
                }}
              />
              <FormControl
                fullWidth
                required
                sx={{
                  flex: 1,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                  },
                }}
              >
                <InputLabel>Relacionamento *</InputLabel>
                <Select
                  value={formData.relationship}
                  onChange={(e) =>
                    handleChange(
                      "relationship",
                      e.target.value as ContactRelationship
                    )
                  }
                  label="Relacionamento *"
                >
                  {relationshipOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* E-mail e Telefone */}
            <Box
              sx={{
                display: "flex",
                gap: 2,
                flexDirection: { xs: "column", sm: "row" },
              }}
            >
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
            variant="outlined"
            sx={{
              textTransform: "none",
              borderRadius: 2,
              px: 3,
              borderColor: theme.palette.divider,
              color: theme.palette.common.white,
              "&:hover": {
                borderColor: theme.palette.text.secondary,
                backgroundColor: theme.palette.action.hover,
              },
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={isSaving}
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
            {isSaving ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <CircularProgress size={16} sx={{ color: "inherit" }} />
                Criando...
              </Box>
            ) : (
              "Criar contato"
            )}
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
}
