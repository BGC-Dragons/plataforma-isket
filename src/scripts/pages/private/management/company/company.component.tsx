import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  useTheme,
  Card,
  TextField,
  Button,
  Avatar,
  Alert,
  CircularProgress,
} from "@mui/material";
import { Business, Save } from "@mui/icons-material";
import { useAuth } from "../../../../modules/access-manager/auth.hook";
import {
  getMyCompany,
  type IGetMyCompanyResponseSuccess,
} from "../../../../../services/get-my-company.service";
import {
  patchMyCompany,
  type IPatchMyCompanyRequest,
} from "../../../../../services/patch-my-company.service";

export function CompanySection() {
  const theme = useTheme();
  const { store } = useAuth();
  const [companyData, setCompanyData] =
    useState<IGetMyCompanyResponseSuccess | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    nationalId: "",
    phoneNumber: "",
    site: "",
    formattedAddress: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Carregar dados da empresa
  useEffect(() => {
    const loadCompanyData = async () => {
      if (!store.token) return;

      setIsLoading(true);
      setError(null);
      try {
        const response = await getMyCompany(store.token);
        setCompanyData(response.data);
        setFormData({
          name: response.data.name || "",
          nationalId: response.data.nationalId || "",
          phoneNumber: response.data.profile?.phoneNumber
            ? formatPhoneNumber(response.data.profile.phoneNumber)
            : "",
          site: response.data.profile?.site || "",
          formattedAddress: response.data.profile?.formattedAddress || "",
        });
      } catch (err) {
        setError("Erro ao carregar dados da empresa.");
        console.error("Erro ao carregar dados da empresa:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadCompanyData();
  }, [store.token]);

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

  const handleInputChange = (field: string, value: string) => {
    let formattedValue = value;

    if (field === "phoneNumber") {
      formattedValue = formatPhoneNumber(value);
    }

    setFormData((prev) => ({ ...prev, [field]: formattedValue }));
  };

  const handleSave = async () => {
    if (!store.token) return;

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const updateData: IPatchMyCompanyRequest = {
        name: formData.name,
        profile: {
          phoneNumber: formData.phoneNumber.replace(/\D/g, ""), // Remove formatação
          site: formData.site,
          formattedAddress: formData.formattedAddress,
        },
      };

      const response = await patchMyCompany(store.token, updateData);
      setCompanyData(response.data);
      setSuccess("Perfil da empresa atualizado com sucesso!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError("Erro ao atualizar dados da empresa.");
      console.error("Erro ao atualizar dados da empresa:", err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: 400,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error && !companyData) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: "100%",
        pt: 2,
        pb: 4,
        pl: 2,
        pr: 2,
        mb: { xs: 5, md: 0 },
      }}
    >
      <Typography
        variant="h5"
        gutterBottom
        sx={{ color: theme.palette.primary.main, mb: 3 }}
      >
        Detalhes da Empresa
      </Typography>

      <Box
        sx={{
          p: { xs: 2, sm: 3 },
          borderRadius: 2,
          backgroundColor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Card
          sx={{
            p: 3,
            border: `2px solid ${theme.palette.primary.main}20`,
            backgroundColor: `${theme.palette.primary.main}05`,
            transition: "all 0.3s ease",
            "&:hover": {
              transform: "translateY(-2px)",
              boxShadow: theme.shadows[4],
              borderColor: theme.palette.primary.main,
            },
          }}
        >
          {/* Header com logo e informações da empresa */}
          <Box sx={{ display: "flex", alignItems: "center", mb: 4 }}>
            <Avatar
              src={companyData?.profile?.imageURL}
              sx={{
                bgcolor: theme.palette.primary.main,
                mr: 2,
                width: 60,
                height: 60,
                fontSize: "1.5rem",
              }}
            >
              {companyData?.name?.charAt(0)?.toUpperCase() || <Business />}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  color: theme.palette.text.primary,
                  mb: 0.5,
                }}
              >
                {companyData?.name || "Nome da Empresa"}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontSize: "0.875rem" }}
              >
                {companyData?.nationalId || "CNPJ não informado"}
              </Typography>
            </Box>
          </Box>

          {/* Texto informativo */}
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 3, lineHeight: 1.6 }}
          >
            Atualize as informações básicas do perfil da sua empresa. As
            alterações feitas no logotipo, telefone e endereço serão refletidas
            nas próximas interações.
          </Typography>

          {/* Alertas */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          {/* Formulário */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: 3,
              mb: 3,
            }}
          >
            {/* Nome da Empresa */}
            <Box sx={{ gridColumn: { xs: "1", sm: "1 / -1" } }}>
              <TextField
                label="Nome da Empresa"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                fullWidth
                variant="outlined"
                size="small"
              />
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 0.5, display: "block" }}
              >
                Este é o nome registrado da sua empresa.
              </Typography>
            </Box>

            {/* CNPJ (não editável) */}
            <Box sx={{ gridColumn: { xs: "1", sm: "1 / -1" } }}>
              <TextField
                label="CNPJ"
                value={formData.nationalId}
                fullWidth
                variant="outlined"
                size="small"
                disabled
                sx={{
                  "& .MuiInputBase-input.Mui-disabled": {
                    WebkitTextFillColor: theme.palette.text.secondary,
                  },
                }}
              />
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 0.5, display: "block" }}
              >
                Para alterar o CNPJ, entre em contato com o suporte.
              </Typography>
            </Box>

            {/* Telefone */}
            <Box>
              <TextField
                label="Telefone"
                value={formData.phoneNumber}
                onChange={(e) =>
                  handleInputChange("phoneNumber", e.target.value)
                }
                fullWidth
                variant="outlined"
                size="small"
                placeholder="(11) 99999-9999"
              />
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 0.5, display: "block" }}
              >
                Atualize o número de telefone da sua empresa.
              </Typography>
            </Box>

            {/* Site */}
            <Box>
              <TextField
                label="Site"
                value={formData.site}
                onChange={(e) => handleInputChange("site", e.target.value)}
                fullWidth
                variant="outlined"
                size="small"
              />
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 0.5, display: "block" }}
              >
                Atualize o site da sua empresa.
              </Typography>
            </Box>

            {/* Endereço */}
            <Box sx={{ gridColumn: { xs: "1", sm: "1 / -1" } }}>
              <TextField
                label="Endereço"
                value={formData.formattedAddress}
                onChange={(e) =>
                  handleInputChange("formattedAddress", e.target.value)
                }
                fullWidth
                variant="outlined"
                size="small"
                multiline
                rows={2}
              />
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 0.5, display: "block" }}
              >
                Atualize o endereço registrado da empresa.
              </Typography>
            </Box>
          </Box>

          {/* Botão de salvar */}
          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Button
              variant="contained"
              startIcon={isSaving ? <CircularProgress size={16} /> : <Save />}
              onClick={handleSave}
              disabled={isSaving}
              sx={{
                textTransform: "none",
                borderRadius: 1.5,
                px: 3,
                py: 1,
                fontWeight: 600,
              }}
            >
              {isSaving ? "Atualizando..." : "Atualizar Perfil da Empresa"}
            </Button>
          </Box>
        </Card>
      </Box>
    </Box>
  );
}
