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
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  Close,
  LocationOn,
  Phone,
  Email,
  Description,
} from "@mui/icons-material";
import { useAuth } from "../access-manager/auth.hook";
import { getPropertyOwnerFinderByNationalId } from "../../../services/get-property-owner-finder-by-national-id.service";
import { getPropertyOwnerFinderByDetails } from "../../../services/get-property-owner-finder-by-details.service";
import { getPropertyOwnerFinderCompanyByRegistrationNumber } from "../../../services/get-property-owner-finder-company-by-registration-number.service";
import type { IPropertyOwner } from "../../../services/get-property-owner-finder-by-address.service";
import type { ResidentResult } from "./search-resident-result-modal";
import { useGetPurchases } from "../../../services/get-purchases.service";

interface ResidentSearchModalProps {
  open: boolean;
  onClose: () => void;
  onSearch?: (data: ResidentSearchData) => void;
  onSearchComplete?: (results: ResidentResult[]) => void;
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
  const auth = useAuth();
  const { data: purchases } = useGetPurchases();
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
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Calcular créditos restantes de RESIDENT_SEARCH
  const getRemainingResidentSearchCredits = (): number => {
    if (!purchases || purchases.length === 0) return 0;

    // Pegar a primeira compra ativa
    const purchase = purchases[0];
    const residentSearchUnit = purchase.remainingUnits.find(
      (unit) => unit.type === "RESIDENT_SEARCH"
    );

    return residentSearchUnit?.unitsRemaining || 0;
  };

  const remainingResidentSearchCredits = getRemainingResidentSearchCredits();

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
    setSearchError(null);
  };

  // Converter IPropertyOwner para ResidentResult
  const convertOwnerToResult = (owner: IPropertyOwner): ResidentResult => {
    // Remover "undefined" do nome se lastName for undefined
    const firstName = owner.firstName || "";
    const lastName = owner.lastName || "";
    const fullName = `${firstName} ${lastName}`
      .trim()
      .replace(/\s+undefined\s*/gi, " ")
      .trim();

    return {
      id:
        owner.id ||
        `${owner.firstName}-${owner.lastName || ""}-${owner.nationalId}`,
      name: fullName || "Nome não informado",
      cpf: owner.nationalId,
    };
  };

  const handleSearch = async () => {
    // Validar que pelo menos um campo foi preenchido
    const hasData =
      formData.nameOrCompany.trim() ||
      formData.cpfCnpj.trim() ||
      formData.phone.trim() ||
      formData.email.trim() ||
      formData.street.trim() ||
      formData.zipCode.trim() ||
      formData.city.trim();

    if (!hasData) {
      setSearchError("Preencha pelo menos um campo para realizar a busca.");
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    onSearch?.(formData);

    try {
      const token = auth.store.token;
      if (!token) {
        throw new Error("Token de autenticação não encontrado.");
      }

      let results: ResidentResult[] = [];

      // Determinar qual endpoint usar baseado nos campos preenchidos
      const cleanCpfCnpj = formData.cpfCnpj.replace(/\D/g, "");

      // 1. Se tiver CPF/CNPJ (11 ou 14 dígitos), usar find-by-nationalId
      if (cleanCpfCnpj.length === 11 || cleanCpfCnpj.length === 14) {
        try {
          if (cleanCpfCnpj.length === 14) {
            // CNPJ - buscar empresa
            const companyResponse =
              await getPropertyOwnerFinderCompanyByRegistrationNumber(
                cleanCpfCnpj,
                token
              );

            if (companyResponse.data.data) {
              const company = companyResponse.data.data;
              // Converter sócios em resultados
              if (company.partners && company.partners.length > 0) {
                results = company.partners.map((partner) => ({
                  id: partner.nationalId,
                  name: partner.name,
                  cpf: partner.nationalId,
                }));
              } else {
                // Se não houver sócios, criar resultado com dados da empresa
                results = [
                  {
                    id: company.companyRegistrationNumber,
                    name: company.companyName,
                    cpf: company.companyRegistrationNumber,
                  },
                ];
              }
            }
          } else {
            // CPF - buscar pessoa
            const personResponse = await getPropertyOwnerFinderByNationalId(
              cleanCpfCnpj,
              token
            );

            if (personResponse.data) {
              results = [convertOwnerToResult(personResponse.data)];
            }
          }
        } catch (error: unknown) {
          if (error && typeof error === "object" && "response" in error) {
            const axiosError = error as {
              response?: { status?: number; data?: { message?: string } };
            };
            if (axiosError.response?.status === 404) {
              setSearchError(
                "Nenhum resultado encontrado com os dados fornecidos."
              );
              setIsSearching(false);
              return;
            }
          }
          throw error;
        }
      } else {
        // 2. Se não tiver CPF/CNPJ, usar find-by-details
        const searchParams: Parameters<
          typeof getPropertyOwnerFinderByDetails
        >[0] = {};

        if (formData.nameOrCompany.trim()) {
          searchParams.name = formData.nameOrCompany.trim();
        }
        if (formData.phone.trim()) {
          // Remover formatação do telefone
          const cleanPhone = formData.phone.replace(/\D/g, "");
          searchParams.phone = cleanPhone;
        }
        if (formData.email.trim()) {
          searchParams.email = formData.email.trim();
        }
        if (formData.zipCode.trim()) {
          const cleanZipCode = formData.zipCode.replace(/\D/g, "");
          searchParams.postalCode = cleanZipCode;
        }
        if (formData.street.trim()) {
          searchParams.street = formData.street.trim();
        }
        if (formData.number.trim()) {
          const streetNumber = parseInt(formData.number, 10);
          if (!isNaN(streetNumber)) {
            searchParams.streetNumber = streetNumber;
          }
        }
        if (formData.complement.trim()) {
          searchParams.complement = formData.complement.trim();
        }
        if (formData.neighborhood.trim()) {
          searchParams.neighborhood = formData.neighborhood.trim();
        }
        if (formData.city.trim()) {
          searchParams.city = formData.city.trim();
        }
        if (formData.state.trim()) {
          searchParams.state = formData.state.trim();
        }

        const detailsResponse = await getPropertyOwnerFinderByDetails(
          searchParams,
          token
        );

        if (detailsResponse.data.data && detailsResponse.data.data.length > 0) {
          results = detailsResponse.data.data.map(convertOwnerToResult);
        } else {
          setSearchError(
            "Nenhum resultado encontrado com os dados fornecidos."
          );
          setIsSearching(false);
          return;
        }
      }

      // Passar resultados para o callback
      if (onSearchComplete) {
        onSearchComplete(results);
      } else {
        handleClear();
        onClose();
      }
    } catch (error: unknown) {
      console.error("Erro ao buscar contatos:", error);
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as {
          response?: {
            status?: number;
            data?: { message?: string; error?: string };
          };
        };

        if (axiosError.response?.status === 402) {
          setSearchError(
            "Você não possui créditos suficientes. Por favor, adquira créditos para continuar usando o serviço."
          );
        } else if (axiosError.response?.status === 404) {
          setSearchError(
            "Nenhum resultado encontrado com os dados fornecidos."
          );
        } else {
          const errorMessage =
            axiosError.response?.data?.message ||
            axiosError.response?.data?.error ||
            "Erro ao buscar contatos. Tente novamente.";
          setSearchError(errorMessage);
        }
      } else if (error instanceof Error) {
        setSearchError(error.message);
      } else {
        setSearchError("Erro inesperado ao buscar contatos. Tente novamente.");
      }
    } finally {
      setIsSearching(false);
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
      <DialogContent
        sx={{
          height: { xs: "65dvh", sm: "65dvh" },
          p: 0,
          overflow: "auto",
          pr: 1,
          "&::-webkit-scrollbar": {
            width: 6,
          },
          "&::-webkit-scrollbar-track": {
            backgroundColor: theme.palette.grey[200],
            borderRadius: 3,
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: theme.palette.grey[400],
            borderRadius: 3,
            "&:hover": {
              backgroundColor: theme.palette.grey[600],
            },
          },
        }}
      >
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
          <Box>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                fontSize: "1.25rem",
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
                fontSize: { xs: "0.8125rem", sm: "0.875rem" },
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

      {/* Error Message */}
      {searchError && (
        <Box sx={{ px: 3, pt: 2 }}>
          <Alert severity="error" onClose={() => setSearchError(null)}>
            {searchError}
          </Alert>
        </Box>
      )}

      {/* Actions */}
      <DialogActions
        sx={{
          p: { xs: 2, sm: 3 },
          justifyContent: "space-between",
          gap: { xs: 1.5, sm: 2 },
        }}
      >
        <Button
          onClick={handleClear}
          disabled={isSearching}
          sx={{
            textTransform: "none",
            color: theme.palette.text.secondary,
            backgroundColor: "transparent",
            fontSize: { xs: "0.875rem", sm: "1rem" },
            px: { xs: 2, sm: 3 },
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
          disabled={isSearching}
          sx={{
            textTransform: "none",
            borderRadius: 2,
            px: { xs: 2, sm: 3 },
            fontSize: { xs: "0.875rem", sm: "1rem" },
            backgroundColor: theme.palette.primary.main,
            "&:hover": {
              backgroundColor: theme.palette.primary.dark,
            },
            "&:disabled": {
              backgroundColor: theme.palette.action.disabledBackground,
              color: theme.palette.action.disabled,
            },
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            py: { xs: 1, sm: 1.5 },
          }}
        >
          {isSearching ? (
            <CircularProgress
              size={20}
              sx={{ color: theme.palette.common.white }}
            />
          ) : (
            <>
              <Box component="span">Buscar morador</Box>
              <Typography
                variant="caption"
                sx={{
                  fontSize: { xs: "0.65rem", sm: "0.7rem" },
                  opacity: 0.9,
                  lineHeight: 1,
                  mt: 0.25,
                }}
              >
                {remainingResidentSearchCredits} créditos disponíveis
              </Typography>
            </>
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
