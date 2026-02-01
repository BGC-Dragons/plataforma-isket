import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Container,
  Typography,
  Paper,
  useTheme,
  Alert,
} from "@mui/material";
import { PersonAdd } from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router";
import isketLogo from "../../../assets/isket.svg";
import { CitySelect } from "../../library/components/city-select";
import { CustomTextField } from "../../library/components/custom-text-field";
import { useAuth } from "../../modules/access-manager/auth.hook";
import { postAuthRegister } from "../../../services/post-auth-register.service";
import { getAuthMe } from "../../../services/get-auth-me.service";
import { patchUser } from "../../../services/patch-user.service";
import { patchProfile } from "../../../services/patch-auth-profile.service";
import { convertCityDescriptionToCode } from "../../library/helpers/convert-city-description-to-code.helper";

function formatCPF(value: string): string {
  const numbers = value.replace(/\D/g, "");
  if (numbers.length <= 3) return numbers;
  if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
  if (numbers.length <= 9)
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
  return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(
    6,
    9
  )}-${numbers.slice(9, 11)}`;
}

function formatPhone(value: string): string {
  const numbers = value.replace(/\D/g, "");
  if (numbers.length <= 2) return numbers;
  if (numbers.length <= 7)
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(
    7,
    11
  )}`;
}

function isCPFComplete(value: string): boolean {
  return value.replace(/\D/g, "").length === 11;
}

function isPhoneComplete(value: string): boolean {
  return value.replace(/\D/g, "").length >= 10;
}

export function CompleteProfile() {
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [cpf, setCpf] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const { login } = useAuth();
  const googleUser = location.state?.googleUser as
    | { name?: string; email?: string; picture?: string; sub?: string }
    | undefined;

  useEffect(() => {
    if (googleUser?.name) setName(googleUser.name);
  }, [googleUser?.name]);

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCpf(formatCPF(e.target.value));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhone(e.target.value));
  };

  const allFilled =
    name.trim() &&
    city.trim() &&
    isCPFComplete(cpf) &&
    address.trim() &&
    isPhoneComplete(phone);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!allFilled) {
      setError("Preencha todos os campos obrigatórios");
      return;
    }

    if (!googleUser?.sub || !googleUser?.email) {
      setError("Sessão inválida. Volte e tente entrar com Google novamente.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    const cpfDigits = cpf.replace(/\D/g, "");
    const phoneDigits = phone.replace(/\D/g, "");
    const addressTrim = address.trim();
    const cityCode = convertCityDescriptionToCode(city.trim());

    try {
      // Register com dados do Google: backend cria conta e já devolve accessToken + refreshToken.
      const registerResponse = await postAuthRegister({
        googleUserId: googleUser.sub,
        name: name.trim(),
        email: googleUser.email,
        profileImg: googleUser.picture,
        defaultCityStateCode: cityCode,
        phone: phoneDigits,
        verificationCode: "google",
        password: "",
      });

      const accessToken = registerResponse.data.accessToken;
      const refreshToken = registerResponse.data.refreshToken;

      const userResponse = await getAuthMe(accessToken);

      // Salvar CPF e endereço no perfil (register pode não aceitar; patch após criar conta).
      try {
        await patchUser(accessToken, userResponse.data.id, {
          personalId: cpfDigits,
        });
        await patchProfile(accessToken, {
          profile: {
            formattedAddress: addressTrim,
            phoneNumber: phoneDigits,
          },
        });
      } catch (patchErr) {
        console.warn("Erro ao salvar CPF/endereço no perfil:", patchErr);
      }

      const user = {
        id: userResponse.data.id,
        name: userResponse.data.name,
        email: userResponse.data.email ?? googleUser.email,
        picture: userResponse.data.profile?.imageURL ?? googleUser.picture,
        sub: googleUser.sub,
      };

      login({ accessToken, refreshToken }, user);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erro ao completar perfil. Tente novamente."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: theme.palette.brand.background,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={24}
          sx={{
            padding: { xs: 3, sm: 5 },
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: "100%",
            borderRadius: 4,
            background: theme.palette.brand.surface,
            backdropFilter: "blur(20px)",
            border: `1px solid ${theme.palette.brand.border}`,
            boxShadow: theme.palette.brand.shadow,
            position: "relative",
            overflow: "hidden",
            "&::before": {
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "4px",
              background: `linear-gradient(90deg, ${theme.palette.brand.primary}, ${theme.palette.brand.secondary}, ${theme.palette.brand.primary})`,
            },
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mb: 4,
            }}
          >
            <img
              src={isketLogo}
              alt="isket"
              style={{
                width: "120px",
                height: "45px",
              }}
            />
          </Box>

          <Typography
            component="h1"
            variant="h6"
            gutterBottom
            sx={{
              fontWeight: 500,
              color: theme.palette.brand.dark,
              mb: 1,
            }}
          >
            Complete seu perfil
          </Typography>

          <Typography
            variant="body1"
            color="text.secondary"
            textAlign="center"
            sx={{ mb: 4, opacity: 0.8 }}
          >
            Preencha os dados para finalizar seu cadastro
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3, width: "100%" }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ width: "100%" }}>
            <CustomTextField
              required
              fullWidth
              id="name"
              label="Nome completo"
              name="name"
              autoComplete="name"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              sx={{ mb: 3 }}
            />

            <CustomTextField
              required
              fullWidth
              id="cpf"
              label="CPF"
              name="cpf"
              value={cpf}
              onChange={handleCpfChange}
              placeholder="000.000.000-00"
              inputProps={{ maxLength: 14 }}
              sx={{ mb: 3 }}
            />

            <CustomTextField
              required
              fullWidth
              id="address"
              label="Endereço"
              name="address"
              autoComplete="street-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Rua, número, bairro, cidade..."
              sx={{ mb: 3 }}
            />

            <CustomTextField
              required
              fullWidth
              id="phone"
              label="Telefone"
              name="phone"
              value={phone}
              onChange={handlePhoneChange}
              placeholder="(00) 00000-0000"
              inputProps={{ maxLength: 15 }}
              sx={{ mb: 3 }}
            />

            <CitySelect
              value={city}
              onChange={setCity}
              required
              sx={{ mb: 1 }}
            />
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", mb: 3 }}
            >
              Selecione uma cidade da lista. O botão só habilita após escolher
              uma opção no dropdown.
            </Typography>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={isSubmitting || !allFilled}
              sx={{
                py: 1.8,
                borderRadius: 3,
                background: theme.palette.brand.gradient,
                boxShadow: theme.palette.brand.shadowButton,
                transition: "all 0.3s ease",
                "&:hover": {
                  background: theme.palette.brand.gradientHover,
                  transform: "translateY(-2px)",
                  boxShadow: theme.palette.brand.shadowButtonHover,
                },
                "&:active": {
                  transform: "translateY(0)",
                },
              }}
              endIcon={<PersonAdd />}
            >
              {isSubmitting ? "Completando..." : "Registrar"}
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
