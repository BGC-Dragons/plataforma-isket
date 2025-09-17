import { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  useTheme,
  Avatar,
  TextField,
  Alert,
  Stack,
  Divider,
  Button,
  CircularProgress,
} from "@mui/material";
import { useAuth } from "../../../../modules/access-manager/auth.hook";
import {
  getAuthMe,
  type IGetAuthMeResponseSuccess,
} from "../../../../../services/get-auth-me.service";

export function ProfileSection() {
  const theme = useTheme();
  const { store } = useAuth();

  const [profileData, setProfileData] = useState({
    email: "",
    phone: "",
    address: "",
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

  const handleInputChange =
    (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
      let value = event.target.value;

      if (field === "phone") {
        value = formatPhoneNumber(value);
      }

      setProfileData((prev) => ({
        ...prev,
        [field]: value,
      }));
    };

  const handleSave = async () => {
    setIsLoading(true);
    setShowSuccess(false);

    try {
      // TODO: Implementar chamada para API de atualização do perfil
      console.log("Salvando dados do perfil:", profileData);

      // Simular delay da API
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error("Erro ao salvar perfil:", error);
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
    <Box>
      <Typography
        variant="h5"
        gutterBottom
        sx={{ color: theme.palette.primary.main, mb: 1.5 }}
      >
        Perfil
      </Typography>

      <Paper elevation={2} sx={{ p: 3, borderRadius: 2, mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 3, mb: 3 }}>
          <Avatar
            src={store.user?.picture}
            sx={{
              width: 80,
              height: 80,
              bgcolor: theme.palette.primary.main,
              fontSize: "2rem",
            }}
          >
            {(profileInfo?.name || store.user?.name)
              ?.charAt(0)
              ?.toUpperCase() || "U"}
          </Avatar>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
              {profileInfo?.name || store.user?.name || "Usuário"}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {profileInfo?.profile?.email ||
                store.user?.email ||
                "email@exemplo.com"}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Alert severity="info" sx={{ mb: 3 }}>
          Atualize suas informações de perfil. As alterações feitas na foto,
          e-mail e celular serão consideradas nas novas avaliações de imóveis.
        </Alert>

        <Stack spacing={3}>
          <TextField
            label="E-mail"
            value={profileData.email}
            onChange={handleInputChange("email")}
            fullWidth
            variant="outlined"
            type="email"
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

        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 4 }}>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={isLoading}
            sx={{
              px: 4,
              py: 1.5,
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
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
      </Paper>
    </Box>
  );
}
