import { useState, useRef } from "react";
import {
  Box,
  Button,
  Container,
  Typography,
  Paper,
  useTheme,
  Alert,
} from "@mui/material";
import { useNavigate, useLocation } from "react-router";
import isketLogo from "../../../assets/isket.svg";
import { postAuthVerifyCode } from "../../../services/post-auth-verify-code.service";
import { CustomTextField } from "../../library/components/custom-text-field";

export function EmailVerification() {
  const [verificationCode, setVerificationCode] = useState(["", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const email = location.state?.email;

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) return; // Não permite mais de 1 caractere por campo

    const newCode = [...verificationCode];
    newCode[index] = value;
    setVerificationCode(newCode);

    // Mover para o próximo campo se digitou algo
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text");
    const numbers = pastedData.replace(/\D/g, "").slice(0, 4).split("");

    if (numbers.length === 4) {
      setVerificationCode([...numbers, ...Array(4 - numbers.length).fill("")]);
      // Focar no último campo preenchido
      const lastFilledIndex = numbers.length - 1;
      inputRefs.current[lastFilledIndex]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !verificationCode[index] && index > 0) {
      // Voltar para o campo anterior se apagou
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const code = verificationCode.join("");
    if (code.length !== 4) return;

    setIsVerifying(true);
    setError("");

    try {
      const response = await postAuthVerifyCode({
        emailOrPhone: email,
        code,
        method: "EMAIL",
      });

      if (response.data.message === "verified code") {
        navigate("/complete-signup", {
          state: {
            email,
            isEmailVerified: true,
            verificationCode: code, // Passar o código verificado
          },
        });
      } else {
        setError("Código inválido. Tente novamente.");
      }
    } catch (err: unknown) {
      if (
        err &&
        typeof err === "object" &&
        "response" in err &&
        err.response &&
        typeof err.response === "object" &&
        "data" in err.response &&
        err.response.data &&
        typeof err.response.data === "object" &&
        "message" in err.response.data
      ) {
        setError(String(err.response.data.message));
      } else {
        setError("Erro ao verificar código. Tente novamente.");
      }
      console.error("Erro ao verificar código:", err);
    } finally {
      setIsVerifying(false);
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
            Crie sua conta
          </Typography>

          <Typography
            variant="body1"
            color="text.secondary"
            textAlign="center"
            sx={{ mb: 4, opacity: 0.8 }}
          >
            Digite o código de 4 dígitos enviado para {email}
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3, width: "100%" }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ width: "100%" }}>
            <Box
              sx={{ display: "flex", gap: 3, mb: 4, justifyContent: "center" }}
            >
              {verificationCode.map((digit, index) => (
                <CustomTextField
                  key={index}
                  inputRef={(el) => (inputRefs.current[index] = el)}
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  onPaste={handlePaste}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  inputProps={{
                    maxLength: 1,
                    pattern: "[0-9]*",
                    inputMode: "numeric",
                    style: { textAlign: "center" },
                  }}
                  sx={{
                    width: "70px",
                  }}
                  placeholder="0"
                  autoFocus={index === 0}
                />
              ))}
            </Box>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={isVerifying || verificationCode.join("").length !== 4}
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
            >
              {isVerifying ? "Verificando..." : "Verificar código"}
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
