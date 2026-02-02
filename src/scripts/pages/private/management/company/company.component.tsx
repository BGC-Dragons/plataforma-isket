import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  useTheme,
  TextField,
  Button,
  Avatar,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
} from "@mui/material";
import { Business, Save, PhotoCamera } from "@mui/icons-material";
import { useAuth } from "../../../../modules/access-manager/auth.hook";
import {
  useGetMyCompany,
  clearMyCompanyCache,
  getMyCompanyPATH,
  type IGetMyCompanyResponseSuccess,
} from "../../../../../services/get-my-company.service";
import {
  patchMyCompany,
  type IPatchMyCompanyRequest,
} from "../../../../../services/patch-my-company.service";
import {
  uploadProfilePhoto,
  type IUploadProfilePhotoResult,
} from "../../../../../services/helpers/upload-profile-photo.helper";

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
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Data via SWR
  const {
    data: companyDataSWR,
    error: companyError,
    isLoading: isLoadingSWR,
  } = useGetMyCompany();

  useEffect(() => {
    if (companyDataSWR) {
      setCompanyData(companyDataSWR);
      setFormData({
        name: companyDataSWR.name || "",
        nationalId: companyDataSWR.nationalId || "",
        phoneNumber: companyDataSWR.profile?.phoneNumber
          ? formatPhoneNumber(companyDataSWR.profile.phoneNumber)
          : "",
        site: companyDataSWR.profile?.site || "",
        formattedAddress: companyDataSWR.profile?.formattedAddress || "",
      });
      setIsLoading(false);
    }
    if (companyError) {
      setError("Erro ao carregar dados da empresa.");
      console.error("Erro ao carregar dados da empresa:", companyError);
      setIsLoading(false);
    }
    if (isLoadingSWR && !companyDataSWR) {
      setIsLoading(true);
    }
  }, [companyDataSWR, companyError, isLoadingSWR]);

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

  const convertImageToJpg = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      img.onload = () => {
        const maxSize = 800;
        let { width, height } = img;

        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = (height * maxSize) / width;
            width = maxSize;
          } else {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(new File([blob], "profile.jpg", { type: "image/jpeg" }));
            } else {
              reject(new Error("Erro ao converter imagem"));
            }
          },
          "image/jpeg",
          0.9
        );
      };

      img.onerror = () => reject(new Error("Erro ao carregar imagem"));
      img.src = URL.createObjectURL(file);
    });
  };

  const handlePhotoUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !store.token || !companyData) return;

    if (!file.type.startsWith("image/")) {
      alert("Por favor, selecione apenas arquivos de imagem.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("A imagem deve ter no máximo 5MB.");
      return;
    }

    setIsUploadingPhoto(true);
    setError(null);

    try {
      const jpgFile = await convertImageToJpg(file);

      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(jpgFile);

      const uploadResult: IUploadProfilePhotoResult = await uploadProfilePhoto(
        store.token,
        jpgFile,
        companyData.id,
        companyData.accountId,
        "COMPANY_PROFILE_IMG"
      );

      if (uploadResult.success) {
        const updateData: IPatchMyCompanyRequest = {
          profile: {
            imageURL: uploadResult.publicUrl,
            ...(formData.phoneNumber?.replace(/\D/g, "") && {
              phoneNumber: formData.phoneNumber.replace(/\D/g, ""),
            }),
            ...(formData.site?.trim() && { site: formData.site.trim() }),
            ...(formData.formattedAddress?.trim() && {
              formattedAddress: formData.formattedAddress.trim(),
            }),
          },
        };

        await patchMyCompany(store.token, updateData);

        clearMyCompanyCache();

        setCompanyData((prev) =>
          prev
            ? {
                ...prev,
                profile: {
                  ...prev.profile,
                  imageURL: uploadResult.publicUrl,
                },
              }
            : null
        );
        setPhotoPreview(null);
        setSuccess("Logotipo atualizado com sucesso!");
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(`Erro no upload: ${uploadResult.error}`);
        setPhotoPreview(null);
      }
    } catch (err) {
      console.error("Erro ao fazer upload do logotipo:", err);
      setError("Erro ao fazer upload do logotipo. Tente novamente.");
      setPhotoPreview(null);
    } finally {
      setIsUploadingPhoto(false);
    }
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
          phoneNumber: formData.phoneNumber.replace(/\D/g, ""),
          site: formData.site,
          formattedAddress: formData.formattedAddress,
          ...(companyData?.profile?.imageURL && {
            imageURL: companyData.profile.imageURL,
          }),
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
        {/* Header com logo e informações da empresa */}
        <Box sx={{ display: "flex", alignItems: "center", mb: 4 }}>
          <Box sx={{ position: "relative", mr: 2 }}>
            <Avatar
              src={photoPreview || companyData?.profile?.imageURL}
              sx={{
                bgcolor: theme.palette.primary.main,
                width: 60,
                height: 60,
                fontSize: "1.5rem",
                cursor: "pointer",
                "&:hover": { opacity: 0.8 },
              }}
            >
              {companyData?.name?.charAt(0)?.toUpperCase() || <Business />}
            </Avatar>

            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              style={{ display: "none" }}
              id="company-logo-upload"
              disabled={isUploadingPhoto}
            />

            <Tooltip title="Alterar logotipo">
              <IconButton
                component="label"
                htmlFor="company-logo-upload"
                disabled={isUploadingPhoto}
                sx={{
                  position: "absolute",
                  bottom: -5,
                  right: -5,
                  bgcolor: theme.palette.primary.main,
                  color: "white",
                  width: 32,
                  height: 32,
                  "&:hover": {
                    bgcolor: theme.palette.primary.dark,
                  },
                  "&:disabled": {
                    bgcolor: theme.palette.action.disabled,
                  },
                }}
              >
                {isUploadingPhoto ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <PhotoCamera sx={{ fontSize: 16 }} />
                )}
              </IconButton>
            </Tooltip>
          </Box>
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

        {/* Divisor */}
        <Box
          sx={{
            height: "1px",
            backgroundColor: theme.palette.divider,
            mb: 3,
          }}
        />

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
              onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
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
      </Box>
    </Box>
  );
}
