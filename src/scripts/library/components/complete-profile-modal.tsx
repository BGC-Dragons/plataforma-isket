import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  Button,
  Alert,
  useTheme,
} from "@mui/material";
import { PersonAdd } from "@mui/icons-material";
import { useAuth } from "../../modules/access-manager/auth.hook";
import {
  useGetAuthMe,
  clearAuthMeCache,
  getAuthMePATH,
} from "../../../services/get-auth-me.service";
import { mutate } from "swr";
import {
  patchProfile,
  type IPatchProfileRequest,
} from "../../../services/patch-auth-profile.service";
import { patchUser } from "../../../services/patch-user.service";
import { CustomTextField } from "./custom-text-field";

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

export function CompleteProfileModal() {
  const theme = useTheme();
  const { store } = useAuth();
  const { data: profileData, isLoading } = useGetAuthMe();

  const [cpf, setCpf] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasCpf = Boolean(profileData?.personalId?.trim());
  const hasPhone = Boolean(profileData?.profile?.phoneNumber?.trim());
  const hasAddress = Boolean(profileData?.profile?.formattedAddress?.trim());

  const needsCompletion =
    profileData && !isLoading && (!hasCpf || !hasPhone || !hasAddress);

  useEffect(() => {
    if (profileData) {
      setCpf(
        profileData.personalId ? formatCPF(profileData.personalId) : ""
      );
      setPhone(
        profileData.profile.phoneNumber
          ? formatPhone(profileData.profile.phoneNumber)
          : ""
      );
      setAddress(profileData.profile.formattedAddress || "");
    }
  }, [profileData]);

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCpf(formatCPF(e.target.value));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhone(e.target.value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const cpfDigits = cpf.replace(/\D/g, "");
    const phoneDigits = phone.replace(/\D/g, "");
    const addressTrim = address.trim();

    if (!hasCpf && !isCPFComplete(cpf)) {
      setError("Informe um CPF válido (11 dígitos).");
      return;
    }
    if (!hasPhone && !isPhoneComplete(phone)) {
      setError("Informe um telefone válido (com DDD).");
      return;
    }
    if (!hasAddress && !addressTrim) {
      setError("Informe o endereço.");
      return;
    }

    if (!store.token || !profileData) return;

    setIsSubmitting(true);
    try {
      if (!hasCpf && cpfDigits) {
        await patchUser(store.token, profileData.id, {
          personalId: cpfDigits,
        });
      }
      // Sempre enviar telefone e endereço juntos no patch para não sobrescrever um com vazio
      const profileUpdate: IPatchProfileRequest["profile"] = {
        phoneNumber: hasPhone
          ? (profileData.profile.phoneNumber ?? "")
          : phoneDigits,
        formattedAddress: hasAddress
          ? (profileData.profile.formattedAddress ?? "")
          : addressTrim,
      };
      await patchProfile(store.token, { profile: profileUpdate });

      clearAuthMeCache();
      await mutate(getAuthMePATH);
      await mutate((key) => Array.isArray(key) && key[0] === getAuthMePATH);
    } catch (err) {
      console.error("Erro ao salvar dados do perfil:", err);
      setError("Não foi possível salvar. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!needsCompletion) return null;

  return (
    <Dialog
      open={true}
      disableEscapeKeyDown
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: "hidden",
          boxShadow: theme.palette.brand?.shadow ?? "0 24px 48px rgba(0,0,0,0.15)",
          border: `1px solid ${theme.palette.brand?.border ?? "#e0e0e0"}`,
        },
      }}
      BackdropProps={{
        sx: { backgroundColor: "rgba(0, 0, 0, 0.6)", backdropFilter: "blur(4px)" },
      }}
    >
      <DialogContent sx={{ p: 0 }}>
        <Box
          sx={{
            p: { xs: 3, sm: 4 },
            "&::before": {
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "4px",
              background: theme.palette.brand?.gradient ?? `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            },
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
            <PersonAdd sx={{ color: theme.palette.primary.main, fontSize: 28 }} />
            <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
              Complete seu perfil
            </Typography>
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Para continuar, preencha os dados que faltam abaixo. Os campos já preenchidos não podem ser alterados aqui.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <CustomTextField
              fullWidth
              label="CPF"
              value={cpf}
              onChange={handleCpfChange}
              disabled={hasCpf}
              placeholder={hasCpf ? "" : "000.000.000-00"}
              inputProps={{ maxLength: 14 }}
              sx={{ mb: 2 }}
            />

            <CustomTextField
              fullWidth
              label="Telefone"
              value={phone}
              onChange={handlePhoneChange}
              disabled={hasPhone}
              placeholder={hasPhone ? "" : "(00) 00000-0000"}
              inputProps={{ maxLength: 15 }}
              sx={{ mb: 2 }}
            />

            <CustomTextField
              fullWidth
              label="Endereço"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              disabled={hasAddress}
              placeholder={hasAddress ? "" : "Rua, número, bairro, cidade..."}
              multiline
              minRows={2}
              sx={{ mb: 3 }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={isSubmitting}
              endIcon={<PersonAdd />}
              sx={{
                py: 1.5,
                borderRadius: 2,
                background: theme.palette.brand?.gradient ?? undefined,
                boxShadow: theme.palette.brand?.shadowButton ?? undefined,
                "&:hover": {
                  background: theme.palette.brand?.gradientHover ?? undefined,
                  boxShadow: theme.palette.brand?.shadowButtonHover ?? undefined,
                },
              }}
            >
              {isSubmitting ? "Salvando..." : "Salvar e continuar"}
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
