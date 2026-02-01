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
import { useLocation } from "react-router";
import isketLogo from "../../../assets/isket.svg";
import { CitySelect } from "../../library/components/city-select";
import { CustomTextField } from "../../library/components/custom-text-field";
import { postAuthRegister } from "../../../services/post-auth-register.service";
import { getAuthMe } from "../../../services/get-auth-me.service";
import { patchUser } from "../../../services/patch-user.service";
import { patchProfile } from "../../../services/patch-auth-profile.service";
import { useAuth } from "../../modules/access-manager/auth.hook";
import { validatePassword } from "../../library/helpers/validate-password.helper";
import { convertCityDescriptionToCode } from "../../library/helpers/convert-city-description-to-code.helper";

function formatCPF(value: string): string {
  const numbers = value.replace(/\D/g, "");
  if (numbers.length <= 3) return numbers;
  if (numbers.length <= 6)
    return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
  if (numbers.length <= 9)
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
  return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
}

function formatPhone(value: string): string {
  const numbers = value.replace(/\D/g, "");
  if (numbers.length <= 2) return numbers;
  if (numbers.length <= 7)
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
}

function isCPFComplete(value: string): boolean {
  return value.replace(/\D/g, "").length === 11;
}

function isPhoneComplete(value: string): boolean {
  return value.replace(/\D/g, "").length >= 10;
}

export function CompleteSignUp() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [city, setCity] = useState("");
  const [cpf, setCpf] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const location = useLocation();
  const theme = useTheme();
  const { login } = useAuth();

  // Verificar se veio da verificação de email
  const isFromEmailVerification = location.state?.isEmailVerified;
  const verifiedEmail = location.state?.email;
  const verificationCode = location.state?.verificationCode;

  useEffect(() => {
    if (verifiedEmail) {
      setEmail(verifiedEmail);
    }
  }, [verifiedEmail]);

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCpf(formatCPF(e.target.value));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhone(e.target.value));
  };

  const allFilled =
    name.trim() &&
    email.trim() &&
    password &&
    confirmPassword &&
    city.trim() &&
    isCPFComplete(cpf) &&
    address.trim() &&
    isPhoneComplete(phone);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }

    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      setError(`Senha deve ter: ${passwordErrors.join(", ")}`);
      return;
    }

    if (!allFilled) {
      setError("Preencha todos os campos obrigatórios");
      return;
    }

    const cpfDigits = cpf.replace(/\D/g, "");
    const phoneDigits = phone.replace(/\D/g, "");
    const addressTrim = address.trim();

    setIsSubmitting(true);
    setError("");

    try {
      const cityCode = convertCityDescriptionToCode(city.trim());

      // Register já devolve accessToken e refreshToken; usar direto (login direto após registro).
      const registerResponse = await postAuthRegister({
        name: name.trim(),
        email: email.trim(),
        password,
        verificationCode: verificationCode || "1234",
        defaultCityStateCode: cityCode,
        phone: phoneDigits,
      });

      const accessToken = registerResponse.data.accessToken;
      const refreshToken = registerResponse.data.refreshToken;

      let user: { id: string; name: string; email: string };
      try {
        const userResponse = await getAuthMe(accessToken);

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
          console.warn("Erro ao salvar CPF/endereço/telefone:", patchErr);
        }

        user = {
          id: userResponse.data.id,
          name: userResponse.data.name,
          email: userResponse.data.email || email.trim(),
        };
      } catch (userError) {
        console.error("Erro ao buscar dados do usuário:", userError);
        user = {
          id: email.trim(),
          name: name.trim(),
          email: email.trim(),
        };
      }

      login({ accessToken, refreshToken }, user);
    } catch (err: unknown) {
      // Tratar erros específicos da API
      if (err && typeof err === "object" && "response" in err) {
        const apiError = err as { response?: { data?: { message?: string } } };
        if (apiError.response?.data?.message) {
          setError(apiError.response.data.message);
        } else {
          setError("Erro ao criar conta. Tente novamente.");
        }
      } else {
        setError("Erro ao criar conta. Tente novamente.");
      }
      console.error("Erro no registro:", err);
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
            Complete seu cadastro
          </Typography>

          <Typography
            variant="body1"
            color="text.secondary"
            textAlign="center"
            sx={{ mb: 4, opacity: 0.8 }}
          >
            Preencha os dados para finalizar sua conta
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
              id="email"
              label="Email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              disabled={isFromEmailVerification}
            />

            <CustomTextField
              required
              fullWidth
              id="name"
              label="Nome completo"
              name="name"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
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
              multiline
              minRows={2}
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
            />

            <CustomTextField
              required
              fullWidth
              id="password"
              label="Senha"
              name="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              showPasswordToggle
            />

            <CustomTextField
              required
              fullWidth
              id="confirmPassword"
              label="Confirmar senha"
              name="confirmPassword"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              showPasswordToggle
            />

            <Box sx={{ mb: 3 }}>
              <Typography variant="caption" color="text.secondary">
                A senha deve ter:
              </Typography>
              <Typography
                variant="caption"
                display="block"
                color="text.secondary"
              >
                • Mínimo 8 caracteres
              </Typography>
              <Typography
                variant="caption"
                display="block"
                color="text.secondary"
              >
                • Pelo menos 1 letra minúscula e 1 maiúscula
              </Typography>
              <Typography
                variant="caption"
                display="block"
                color="text.secondary"
              >
                • Pelo menos 1 número e 1 caractere especial
              </Typography>
            </Box>

            <CitySelect
              value={city}
              onChange={setCity}
              required
              sx={{ mb: 2 }}
            />

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
              {isSubmitting
                ? "Criando conta e fazendo login..."
                : "Criar conta e entrar"}
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
