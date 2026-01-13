import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
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
} from "@mui/material";
import { Close } from "@mui/icons-material";
import { useAuth } from "../access-manager/auth.hook";
import { postPropertyListingAcquisition } from "../../../services/post-property-listing-acquisition.service";
import {
  useGetPropertyListingAcquisitionsStages,
  clearPropertyListingAcquisitionsStagesCache,
} from "../../../services/get-property-listing-acquisitions-stages.service";
import { postPropertyListingAcquisitionContactHistory } from "../../../services/post-property-listing-acquisition-contact-history.service";

interface ContactSourcingModalProps {
  open: boolean;
  onClose: () => void;
  onSave?: (data: ContactSourcingData, acquisitionId?: string) => void;
  initialData?: Partial<ContactSourcingData>; // Dados iniciais para preencher o formulário
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
  initialData,
}: ContactSourcingModalProps) {
  const theme = useTheme();
  const auth = useAuth();
  const navigate = useNavigate();
  const { data: stages, mutate } = useGetPropertyListingAcquisitionsStages();
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [formData, setFormData] = useState<ContactSourcingData>({
    name: "",
    cpf: "",
    email: "",
    phone: "",
    title: "",
  });

  // Atualizar formData quando initialData mudar ou limpar quando modal fecha
  useEffect(() => {
    if (!open) {
      // Limpar formulário quando modal fecha
      setFormData({
        name: "",
        cpf: "",
        email: "",
        phone: "",
        title: "",
      });
      setSaveError(null);
    } else if (initialData) {
      // Preencher formulário apenas se houver initialData válido
      setFormData({
        name: initialData.name || "",
        cpf: initialData.cpf || "",
        email: initialData.email || "",
        phone: initialData.phone || "",
        title: initialData.title || "",
      });
    } else {
      // Garantir que o formulário está limpo quando abre sem initialData
      setFormData({
        name: "",
        cpf: "",
        email: "",
        phone: "",
        title: "",
      });
    }
  }, [initialData, open]);

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

  const handleSave = async () => {
    if (!auth.store.token) {
      setSaveError("Você precisa estar autenticado para captar um contato");
      return;
    }

    if (!formData.name) {
      setSaveError("Por favor, informe o nome do contato");
      return;
    }

    if (!formData.cpf) {
      setSaveError("Por favor, informe o CPF do contato");
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      // 1. Obter o primeiro estágio (estágio inicial)
      if (!stages || stages.length === 0) {
        throw new Error(
          "Nenhum estágio de captação encontrado. Por favor, crie um estágio primeiro."
        );
      }

      // Ordenar estágios por ordem e pegar o primeiro (estágio inicial)
      const sortedStages = [...stages].sort((a, b) => a.order - b.order);
      const firstStage = sortedStages[0];
      const stageId = firstStage.id;

      // 2. Criar a captação (POST /property-listing-acquisitions/acquisitions)
      const contactInfo = [
        formData.name,
        formData.cpf ? `CPF: ${formData.cpf}` : "",
        formData.email ? `Email: ${formData.email}` : "",
        formData.phone ? `Tel: ${formData.phone}` : "",
      ]
        .filter(Boolean)
        .join(" - ");

      const acquisitionPayload = {
        title: formData.title || formData.name || "Captação de Contato",
        description: formData.title || undefined,
        formattedAddress: contactInfo,
        stageId: stageId,
        captureType: "contact" as const,
      };

      // Criar a captação (POST /property-listing-acquisitions/acquisitions)
      const acquisitionResponse = await postPropertyListingAcquisition(
        auth.store.token,
        acquisitionPayload
      );
      const acquisitionId = acquisitionResponse.data.id;

      // Criar histórico de contato (POST /property-listing-acquisitions/contact-history)
      const phones = formData.phone ? [formData.phone] : [];
      const emails = formData.email ? [formData.email] : [];

      await postPropertyListingAcquisitionContactHistory(
        {
          acquisitionProcessId: acquisitionId,
          contactName: formData.name,
          contactId: formData.cpf,
          contactDate: new Date().toISOString(),
          phones: phones,
          emails: emails,
          status: "UNDEFINED",
        },
        auth.store.token
      );

      // Limpar cache e atualizar os stages/acquisitions para aparecer imediatamente no Kanban
      clearPropertyListingAcquisitionsStagesCache();
      await mutate();

      // Chamar callback se existir, passando o ID da captação
      onSave?.(formData, acquisitionId);

      // Limpar formulário
      handleClear();

      // Fechar modal
      onClose();

      // Navegar para a página de captação apenas se não houver callback
      // (se houver callback, o componente pai controla a navegação)
      if (!onSave) {
        navigate("/captacao");
      }
    } catch (error: unknown) {
      console.error("Erro ao criar captação de contato:", error);
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as {
          response?: { status?: number; data?: { message?: string } };
        };
        const errorMessage =
          axiosError.response?.data?.message ||
          "Erro ao criar captação de contato. Tente novamente.";
        setSaveError(errorMessage);
      } else if (error instanceof Error) {
        setSaveError(error.message);
      } else {
        setSaveError(
          "Erro inesperado ao criar captação de contato. Tente novamente."
        );
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

            {/* CPF, E-mail e Telefone */}
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
              Captando...
            </Box>
          ) : (
            "Captar contato"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
