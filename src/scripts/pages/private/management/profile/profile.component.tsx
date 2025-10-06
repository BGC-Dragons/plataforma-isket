import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  useTheme,
  Avatar,
  TextField,
  Alert,
  Stack,
  Button,
  CircularProgress,
} from "@mui/material";
import { useAuth } from "../../../../modules/access-manager/auth.hook";
import {
  getAuthMe,
  type IGetAuthMeResponseSuccess,
} from "../../../../../services/get-auth-me.service";
import {
  patchProfile,
  type IPatchProfileRequest,
} from "../../../../../services/patch-auth-profile.service";

export function ProfileSection() {
  const theme = useTheme();
  const { store } = useAuth();

  const [profileData, setProfileData] = useState({
    email: "",
    phone: "",
    address: "",
    cpf: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [profileInfo, setProfileInfo] =
    useState<IGetAuthMeResponseSuccess | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      if (!store.token) return;

      try {
        setIsLoadingProfile(true);
        const response = await getAuthMe(store.token);
        const profileData = response.data;
        console.log(profileData.profile);

        setProfileInfo(profileData);
        setProfileData({
          email: profileData.profile.email || "",
          phone: profileData.profile.phoneNumber
            ? formatPhoneNumber(profileData.profile.phoneNumber)
            : "",
          address: profileData.profile.formattedAddress || "",
          cpf: profileData.personalId ? formatCPF(profileData.personalId) : "",
        });
      } catch (error) {
        console.error("Erro ao carregar perfil:", error);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    loadProfile();
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

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, "");

    if (numbers.length <= 3) {
      return numbers;
    } else if (numbers.length <= 6) {
      return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
    } else if (numbers.length <= 9) {
      return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(
        6
      )}`;
    } else {
      return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(
        6,
        9
      )}-${numbers.slice(9, 11)}`;
    }
  };

  const handleInputChange =
    (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
      let value = event.target.value;

      if (field === "phone") {
        value = formatPhoneNumber(value);
      } else if (field === "cpf") {
        value = formatCPF(value);
      }

      setProfileData((prev) => ({
        ...prev,
        [field]: value,
      }));
    };

  const handleSave = async () => {
    if (!store.token) return;

    setIsLoading(true);
    setShowSuccess(false);

    try {
      // Preparar dados para envio
      const updateData: IPatchProfileRequest = {
        profile: {
          email: profileData.email,
          phoneNumber: profileData.phone.replace(/\D/g, ""), // Remove formatação
          formattedAddress: profileData.address,
        },
      };

      // Chamar API de atualização
      await patchProfile(store.token, updateData);

      // Recarregar dados completos do perfil
      const updatedProfile = await getAuthMe(store.token);
      setProfileInfo(updatedProfile.data);

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error("Erro ao salvar perfil:", error);
      // TODO: Adicionar tratamento de erro para o usuário
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingProfile) {
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
        Perfil
      </Typography>

      <Box
        sx={{
          p: { xs: 2, sm: 3 },
          borderRadius: 2,
          backgroundColor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        {/* Informações do Usuário */}
        <Box sx={{ mb: 3 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: { xs: 2, sm: 3 },
              flexDirection: { xs: "column", sm: "row" },
              textAlign: { xs: "center", sm: "left" },
            }}
          >
            <Avatar
              src={profileInfo?.profile?.imageURL || store.user?.picture}
              sx={{
                width: { xs: 60, sm: 80 },
                height: { xs: 60, sm: 80 },
                bgcolor: theme.palette.primary.main,
                fontSize: { xs: "1.5rem", sm: "2rem" },
                cursor: "pointer",
                "&:hover": {
                  opacity: 0.8,
                },
              }}
              onClick={() => {
                // TODO: Implementar upload de foto
                console.log("Clicou na foto para atualizar");
              }}
            >
              {(profileInfo?.name || store.user?.name)
                ?.charAt(0)
                ?.toUpperCase() || "U"}
            </Avatar>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 600,
                  mb: 1,
                  wordBreak: "break-word",
                  fontSize: { xs: "1.25rem", sm: "1.5rem" },
                }}
              >
                {profileInfo?.name || store.user?.name || "Usuário"}
              </Typography>
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{
                  wordBreak: "break-all",
                  fontSize: { xs: "0.875rem", sm: "1rem" },
                }}
              >
                {profileInfo?.profile?.email ||
                  store.user?.email ||
                  "email@exemplo.com"}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Divisor */}
        <Box
          sx={{
            height: "1px",
            backgroundColor: theme.palette.divider,
            mb: 3,
          }}
        />

        {/* Alert informativo */}
        <Alert severity="info" sx={{ mb: 3 }}>
          Atualize suas informações de perfil. As alterações feitas na foto,
          e-mail e celular serão consideradas nas novas avaliações de imóveis.
        </Alert>

        {/* Formulário de Edição */}
        <Stack spacing={3}>
          <TextField
            label="E-mail"
            value={profileData.email}
            onChange={handleInputChange("email")}
            fullWidth
            variant="outlined"
            type="email"
            sx={{
              "& .MuiInputBase-input": {
                wordBreak: "break-all",
              },
            }}
          />

          <TextField
            label="CPF"
            value={profileData.cpf}
            onChange={handleInputChange("cpf")}
            fullWidth
            variant="outlined"
            placeholder="000.000.000-00"
            disabled
            sx={{
              "& .MuiInputBase-input.Mui-disabled": {
                WebkitTextFillColor: theme.palette.text.secondary,
              },
            }}
          />

          <TextField
            label="Telefone"
            value={profileData.phone}
            onChange={handleInputChange("phone")}
            fullWidth
            variant="outlined"
            placeholder="(11) 99999-9999"
          />

          <TextField
            label="Endereço"
            value={profileData.address}
            onChange={handleInputChange("address")}
            fullWidth
            variant="outlined"
            multiline
            rows={3}
            placeholder="Rua, número, bairro, cidade - UF"
          />
        </Stack>

        {/* Botão de Salvar */}
        <Box
          sx={{
            display: "flex",
            justifyContent: { xs: "center", sm: "flex-end" },
            mt: 4,
          }}
        >
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={isLoading}
            sx={{
              px: { xs: 3, sm: 4 },
              py: 1.5,
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
              width: { xs: "100%", sm: "auto" },
            }}
          >
            {isLoading ? "Salvando..." : "Salvar"}
          </Button>
        </Box>

        {showSuccess && (
          <Alert severity="success" sx={{ mt: 2 }}>
            Perfil atualizado com sucesso!
          </Alert>
        )}
      </Box>
    </Box>
  );
}
