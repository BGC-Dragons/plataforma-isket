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
  { value: "owner", label: "Proprietário" },
  { value: "related", label: "Relacionado" },
  { value: "family", label: "Familiar" },
  { value: "business", label: "Negócios" },
  { value: "friend", label: "Amigo" },
  { value: "neighbor", label: "Vizinho" },
  { value: "other", label: "Outros" },
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
    relationship: "other" as ContactRelationship,
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
      relationship: "other",
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
      // Preparar arrays de emails e phones (API espera arrays)
      const emails: string[] = formData.email.trim()
        ? [formData.email.trim()]
        : [];
      const phones: string[] = formData.phone.replace(/\D/g, "")
        ? [formData.phone.replace(/\D/g, "")]
        : [];

      await postPropertyListingAcquisitionContact(
        acquisitionProcessId,
        {
          name: formData.name.trim(),
          cpf: formData.cpf.replace(/\D/g, ""), // Apenas números
          emails: emails, // Array de emails (mesmo que vazio)
          phones: phones, // Array de phones (mesmo que vazio)
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

  // Limpar formulário quando o modal abrir
  useEffect(() => {
    if (open) {
      handleClear();
    }
  }, [open]);

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
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
          <Typography
            variant="body1"
            sx={{
              mb: { xs: 2, sm: 3 },
              color: theme.palette.text.secondary,
              fontSize: { xs: "0.875rem", sm: "1rem" },
            }}
          >
            Preencha as informações do contato que deseja adicionar.
          </Typography>

          {/* Error Message */}
          {saveError && (
            <Alert severity="error" sx={{ mb: { xs: 2, sm: 3 }, fontSize: { xs: "0.875rem", sm: "1rem" } }}>
              {saveError}
            </Alert>
          )}

          {/* Form Fields */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: { xs: 2, sm: 3 } }}>
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
                  fontSize: { xs: "0.9375rem", sm: "1rem" },
                },
                "& .MuiInputLabel-root": {
                  fontSize: { xs: "0.9375rem", sm: "1rem" },
                },
              }}
            />

            {/* CPF e Relacionamento */}
            <Box
              sx={{
                display: "flex",
                gap: { xs: 1.5, sm: 2 },
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
                    fontSize: { xs: "0.9375rem", sm: "1rem" },
                  },
                  "& .MuiInputLabel-root": {
                    fontSize: { xs: "0.9375rem", sm: "1rem" },
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
                    fontSize: { xs: "0.9375rem", sm: "1rem" },
                  },
                  "& .MuiInputLabel-root": {
                    fontSize: { xs: "0.9375rem", sm: "1rem" },
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
                gap: { xs: 1.5, sm: 2 },
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
                    fontSize: { xs: "0.9375rem", sm: "1rem" },
                  },
                  "& .MuiInputLabel-root": {
                    fontSize: { xs: "0.9375rem", sm: "1rem" },
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
                    fontSize: { xs: "0.9375rem", sm: "1rem" },
                  },
                  "& .MuiInputLabel-root": {
                    fontSize: { xs: "0.9375rem", sm: "1rem" },
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
              color: theme.palette.common.white,
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
              color: theme.palette.common.white,
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
      </DialogActions>
    </Dialog>
  );
}
