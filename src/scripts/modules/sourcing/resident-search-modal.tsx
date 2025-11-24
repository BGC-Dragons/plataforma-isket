import { useState } from "react";
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
  Divider,
  Paper,
} from "@mui/material";
import {
  Close,
  LocationOn,
  Phone,
  Email,
  Description,
} from "@mui/icons-material";

interface ResidentSearchModalProps {
  open: boolean;
  onClose: () => void;
  onSearch?: (data: ResidentSearchData) => void;
  onSearchComplete?: (data: ResidentSearchData) => void;
}

export interface ResidentSearchData {
  // Busca por nome/endereço
  nameOrCompany: string;
  street: string;
  neighborhood: string;
  number: string;
  complement: string;
  zipCode: string;
  city: string;
  state: string;
  // Busca por telefone
  phone: string;
  // Busca por e-mail
  email: string;
  // Busca por CPF/CNPJ
  cpfCnpj: string;
}

const formatCPFCNPJ = (value: string) => {
  const numbers = value.replace(/\D/g, "");

  // CPF (11 dígitos)
  if (numbers.length <= 11) {
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
  } else {
    // CNPJ (14 dígitos)
    if (numbers.length <= 2) {
      return numbers;
    } else if (numbers.length <= 5) {
      return `${numbers.slice(0, 2)}.${numbers.slice(2)}`;
    } else if (numbers.length <= 8) {
      return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(
        5
      )}`;
    } else if (numbers.length <= 12) {
      return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(
        5,
        8
      )}/${numbers.slice(8)}`;
    } else {
      return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(
        5,
        8
      )}/${numbers.slice(8, 12)}-${numbers.slice(12, 14)}`;
    }
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

const formatZipCode = (value: string) => {
  const numbers = value.replace(/\D/g, "");

  if (numbers.length <= 5) {
    return numbers;
  } else {
    return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`;
  }
};

export function ResidentSearchModal({
  open,
  onClose,
  onSearch,
  onSearchComplete,
}: ResidentSearchModalProps) {
  const theme = useTheme();
  const [formData, setFormData] = useState<ResidentSearchData>({
    nameOrCompany: "",
    street: "",
    neighborhood: "",
    number: "",
    complement: "",
    zipCode: "",
    city: "",
    state: "",
    phone: "",
    email: "",
    cpfCnpj: "",
  });

  const handleChange = (field: keyof ResidentSearchData, value: string) => {
    let formattedValue = value;

    if (field === "cpfCnpj") {
      formattedValue = formatCPFCNPJ(value);
    } else if (field === "phone") {
      formattedValue = formatPhoneNumber(value);
    } else if (field === "zipCode") {
      formattedValue = formatZipCode(value);
    }

    setFormData((prev) => ({
      ...prev,
      [field]: formattedValue,
    }));
  };

  const handleClear = () => {
    setFormData({
      nameOrCompany: "",
      street: "",
      neighborhood: "",
      number: "",
      complement: "",
      zipCode: "",
      city: "",
      state: "",
      phone: "",
      email: "",
      cpfCnpj: "",
    });
  };

  const handleSearch = () => {
    onSearch?.(formData);
    if (onSearchComplete) {
      // Se houver onSearchComplete, não limpa nem fecha - o modal de resultados vai gerenciar
      onSearchComplete(formData);
    } else {
      // Se não houver, comporta-se como antes
      handleClear();
      onClose();
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
      maxWidth="lg"
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
            p: 3,
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Box>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                fontSize: "1.5rem",
                color: theme.palette.text.primary,
                mb: 0.5,
              }}
            >
              Pesquisar moradores
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.text.secondary,
                fontSize: "0.875rem",
              }}
            >
              Encontre moradores para criar captações.
            </Typography>
          </Box>
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
        <Box sx={{ p: 3 }}>
          {/* Busca por nome/endereço - Box azul */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              mb: 3,
              backgroundColor: "#E3F2FD",
              borderRadius: 2,
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                mb: 2,
              }}
            >
              <LocationOn sx={{ color: "#1976D2" }} />
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  fontSize: "1rem",
                  color: theme.palette.text.primary,
                }}
              >
                Busca por nome/endereço
              </Typography>
            </Box>

            {/* Primeira fileira */}
            <Box
              sx={{
                display: "flex",
                gap: 2,
                mb: 2,
                flexDirection: { xs: "column", sm: "row" },
              }}
            >
              <TextField
                label="Nome/razão social"
                value={formData.nameOrCompany}
                onChange={(e) => handleChange("nameOrCompany", e.target.value)}
                sx={{
                  flex: 1,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    backgroundColor: theme.palette.common.white,
                  },
                }}
              />
              <TextField
                label="Logradouro"
                value={formData.street}
                onChange={(e) => handleChange("street", e.target.value)}
                sx={{
                  flex: 1,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    backgroundColor: theme.palette.common.white,
                  },
                }}
              />
              <TextField
                label="Bairro"
                value={formData.neighborhood}
                onChange={(e) => handleChange("neighborhood", e.target.value)}
                sx={{
                  flex: 1,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    backgroundColor: theme.palette.common.white,
                  },
                }}
              />
            </Box>

            {/* Segunda fileira */}
            <Box
              sx={{
                display: "flex",
                gap: 2,
                flexDirection: { xs: "column", sm: "row" },
              }}
            >
              <TextField
                label="Número"
                value={formData.number}
                onChange={(e) => handleChange("number", e.target.value)}
                sx={{
                  flex: { xs: 1, sm: "0 0 120px" },
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    backgroundColor: theme.palette.common.white,
                  },
                }}
              />
              <TextField
                label="Complemento"
                value={formData.complement}
                onChange={(e) => handleChange("complement", e.target.value)}
                sx={{
                  flex: { xs: 1, sm: "0 0 150px" },
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    backgroundColor: theme.palette.common.white,
                  },
                }}
              />
              <TextField
                label="CEP"
                value={formData.zipCode}
                onChange={(e) => handleChange("zipCode", e.target.value)}
                inputProps={{
                  maxLength: 9,
                }}
                sx={{
                  flex: { xs: 1, sm: "0 0 130px" },
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    backgroundColor: theme.palette.common.white,
                  },
                }}
              />
              <TextField
                label="Cidade"
                value={formData.city}
                onChange={(e) => handleChange("city", e.target.value)}
                sx={{
                  flex: 1,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    backgroundColor: theme.palette.common.white,
                  },
                }}
              />
              <TextField
                label="Estado"
                value={formData.state}
                onChange={(e) => handleChange("state", e.target.value)}
                sx={{
                  flex: { xs: 1, sm: "0 0 120px" },
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    backgroundColor: theme.palette.common.white,
                  },
                }}
              />
            </Box>
          </Paper>

          {/* Três boxes lado a lado */}
          <Box
            sx={{
              display: "flex",
              gap: 2,
              flexDirection: { xs: "column", md: "row" },
              mb: 3,
            }}
          >
            {/* Busca por telefone - Box verde */}
            <Paper
              elevation={0}
              sx={{
                p: 3,
                flex: 1,
                backgroundColor: "#E8F5E9",
                borderRadius: 2,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  mb: 2,
                }}
              >
                <Phone sx={{ color: "#4CAF50" }} />
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    fontSize: "1rem",
                    color: theme.palette.text.primary,
                  }}
                >
                  Busca por telefone
                </Typography>
              </Box>
              <TextField
                label="Telefone"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                inputProps={{
                  maxLength: 15,
                }}
                fullWidth
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    backgroundColor: theme.palette.common.white,
                  },
                }}
              />
            </Paper>

            {/* Busca por e-mail - Box cinza */}
            <Paper
              elevation={0}
              sx={{
                p: 3,
                flex: 1,
                backgroundColor: "#F5F5F5",
                borderRadius: 2,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  mb: 2,
                }}
              >
                <Email sx={{ color: "#757575" }} />
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    fontSize: "1rem",
                    color: theme.palette.text.primary,
                  }}
                >
                  Busca por e-mail
                </Typography>
              </Box>
              <TextField
                label="E-mail"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                fullWidth
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    backgroundColor: theme.palette.common.white,
                  },
                }}
              />
            </Paper>

            {/* Busca por CPF/CNPJ - Box amarelo */}
            <Paper
              elevation={0}
              sx={{
                p: 3,
                flex: 1,
                backgroundColor: "#FFF9C4",
                borderRadius: 2,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  mb: 2,
                }}
              >
                <Description sx={{ color: "#F57F17" }} />
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    fontSize: "1rem",
                    color: theme.palette.text.primary,
                  }}
                >
                  Busca por CPF/CNPJ
                </Typography>
              </Box>
              <TextField
                label="CPF/CNPJ"
                value={formData.cpfCnpj}
                onChange={(e) => handleChange("cpfCnpj", e.target.value)}
                inputProps={{
                  maxLength: 18,
                }}
                fullWidth
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    backgroundColor: theme.palette.common.white,
                  },
                }}
              />
            </Paper>
          </Box>
        </Box>
      </DialogContent>

      {/* Divider */}
      <Divider />

      {/* Actions */}
      <DialogActions
        sx={{
          p: 3,
          justifyContent: "flex-end",
          gap: 2,
        }}
      >
        <Button
          onClick={handleClear}
          sx={{
            textTransform: "none",
            color: theme.palette.text.secondary,
            backgroundColor: "transparent",
            "&:hover": {
              backgroundColor: theme.palette.action.hover,
            },
          }}
        >
          Limpar
        </Button>
        <Button
          onClick={handleSearch}
          variant="contained"
          sx={{
            textTransform: "none",
            borderRadius: 2,
            px: 3,
            backgroundColor: theme.palette.primary.main,
            "&:hover": {
              backgroundColor: theme.palette.primary.dark,
            },
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            py: 1.5,
          }}
        >
          <Box component="span">Buscar morador</Box>
          <Typography
            variant="caption"
            sx={{
              fontSize: "0.7rem",
              opacity: 0.9,
              lineHeight: 1,
              mt: 0.25,
            }}
          >
            287 créditos disponíveis
          </Typography>
        </Button>
      </DialogActions>
    </Dialog>
  );
}
