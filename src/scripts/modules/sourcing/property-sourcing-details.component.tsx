import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  IconButton,
  TextField,
  Button,
  useTheme,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputAdornment,
  Paper,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  Close,
  AccessTime,
  CheckCircle,
  Cancel,
  Edit,
  Bolt,
  Search,
  Description,
  Phone,
  Email,
  Delete,
  Add,
  Person,
  Verified,
  ArrowDropDown,
  MoreVert,
} from "@mui/icons-material";
import type { PropertySourcingData } from "./property-sourcing-modal";
import { useAuth } from "../access-manager/auth.hook";
import {
  getPropertyOwnerFinderByAddress,
  type IPropertyOwner,
} from "../../../services/get-property-owner-finder-by-address.service";

interface PropertySourcingDetailsProps {
  open: boolean;
  onClose: () => void;
  data: PropertySourcingData;
  onReject?: () => void;
  onCapture?: () => void;
  onTitleChange?: (title: string) => void;
}

export function PropertySourcingDetails({
  open,
  onClose,
  data,
  onReject,
  onCapture,
  onTitleChange,
}: PropertySourcingDetailsProps) {
  const theme = useTheme();
  const auth = useAuth();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(data.title);
  const [owners, setOwners] = useState<IPropertyOwner[]>([]);
  const [isLoadingOwners, setIsLoadingOwners] = useState(false);
  const [ownersError, setOwnersError] = useState<string | null>(null);

  useEffect(() => {
    setEditedTitle(data.title);
  }, [data.title]);

  const handleTitleSave = () => {
    onTitleChange?.(editedTitle);
    setIsEditingTitle(false);
  };

  const handleTitleCancel = () => {
    setEditedTitle(data.title);
    setIsEditingTitle(false);
  };

  const formatAddress = () => {
    const parts = [
      data.address,
      data.number && `, ${data.number}`,
      data.complement && `, ${data.complement}`,
    ].filter(Boolean);
    return parts.join("");
  };

  const handleRevealOwners = async () => {
    if (!data.address || !data.number) {
      setOwnersError(
        "Endereço e número são obrigatórios para buscar proprietários."
      );
      return;
    }

    setIsLoadingOwners(true);
    setOwnersError(null);
    setOwners([]);

    try {
      const streetNumber = parseInt(data.number, 10);
      if (isNaN(streetNumber)) {
        throw new Error("Número do endereço inválido");
      }

      const params = {
        formattedAddress: data.address,
        streetNumber: streetNumber,
        propertyComplement: data.complement || null,
        // Se tiver coordenadas, adicionar (mas não temos no PropertySourcingData atual)
        // streetGeo: data.addressDetails?.coordinates ? {
        //   lat: data.addressDetails.coordinates.lat,
        //   lon: data.addressDetails.coordinates.lng,
        // } : undefined,
      };

      const response = await getPropertyOwnerFinderByAddress(
        params,
        auth.store.token || ""
      );

      if (response.data.data && response.data.data.length > 0) {
        setOwners(response.data.data);
      } else {
        setOwnersError("Nenhum proprietário encontrado para este endereço.");
      }
    } catch (error: unknown) {
      console.error("Erro ao buscar proprietários:", error);
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as {
          response?: {
            status?: number;
            data?: { message?: string; error?: string };
          };
        };

        if (axiosError.response?.status === 402) {
          setOwnersError(
            "Você não possui créditos suficientes. Por favor, adquira créditos para continuar usando o serviço."
          );
        } else {
          const errorMessage =
            axiosError.response?.data?.message ||
            axiosError.response?.data?.error ||
            "Erro ao buscar proprietários. Tente novamente.";
          setOwnersError(errorMessage);
        }
      } else if (error instanceof Error) {
        setOwnersError(error.message);
      } else {
        setOwnersError(
          "Erro inesperado ao buscar proprietários. Tente novamente."
        );
      }
    } finally {
      setIsLoadingOwners(false);
    }
  };

  const formatNationalId = (nationalId: string) => {
    // Formatar CPF/CNPJ: mostrar apenas últimos 2 dígitos
    if (nationalId.length === 11) {
      // CPF
      return `${nationalId.slice(0, 3)}.***.***-${nationalId.slice(-2)}`;
    } else if (nationalId.length === 14) {
      // CNPJ
      return `${nationalId.slice(0, 2)}.***.***/****-${nationalId.slice(-2)}`;
    }
    return nationalId;
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xl"
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
          p: 0,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
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
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                fontSize: "1.5rem",
                color: theme.palette.text.primary,
              }}
            >
              Captação por imóvel
            </Typography>
            <Chip
              icon={<AccessTime sx={{ fontSize: "1rem" }} />}
              label="Em processo"
              sx={{
                backgroundColor: "#ff9800",
                color: "#fff",
                fontWeight: 500,
                "& .MuiChip-icon": {
                  color: "#fff",
                },
              }}
            />
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Button
              onClick={onReject}
              variant="contained"
              startIcon={<Cancel />}
              sx={{
                textTransform: "none",
                borderRadius: 2,
                px: 2,
                backgroundColor: theme.palette.error.main,
                color: theme.palette.common.white,
                "&:hover": {
                  backgroundColor: theme.palette.error.dark,
                },
              }}
            >
              Recusado
            </Button>
            <Button
              onClick={onCapture}
              variant="contained"
              startIcon={<CheckCircle />}
              sx={{
                textTransform: "none",
                borderRadius: 2,
                px: 2,
                backgroundColor: theme.palette.success.main,
                color: theme.palette.common.white,
                "&:hover": {
                  backgroundColor: theme.palette.success.dark,
                },
              }}
            >
              Captado
            </Button>
            <IconButton
              onClick={onClose}
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
        </Box>

        {/* Content */}
        <Box
          sx={{
            p: 3,
            flex: 1,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Property Info Box */}
          <Box
            sx={{
              backgroundColor: "#e8f5e9",
              borderRadius: 3,
              p: 2,
            }}
          >
            {/* Title with edit capability */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                mb: 1,
              }}
            >
              {isEditingTitle ? (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    flex: 1,
                  }}
                >
                  <TextField
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    variant="standard"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleTitleSave();
                      } else if (e.key === "Escape") {
                        handleTitleCancel();
                      }
                    }}
                    sx={{
                      flex: 1,
                      "& .MuiInputBase-input": {
                        fontWeight: 700,
                        fontSize: "1rem",
                        color: theme.palette.text.primary,
                      },
                    }}
                    autoFocus
                  />
                  <IconButton
                    size="small"
                    onClick={handleTitleSave}
                    sx={{ color: theme.palette.success.main }}
                  >
                    <CheckCircle fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={handleTitleCancel}
                    sx={{ color: theme.palette.error.main }}
                  >
                    <Cancel fontSize="small" />
                  </IconButton>
                </Box>
              ) : (
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <Typography
                    variant="h6"
                    onClick={() => setIsEditingTitle(true)}
                    sx={{
                      fontWeight: 700,
                      fontSize: "1rem",
                      color: theme.palette.text.primary,
                      cursor: "pointer",
                      lineHeight: 1.2,
                      "&:hover": {
                        textDecoration: "underline",
                      },
                    }}
                  >
                    {data.title ||
                      `${data.propertyType || "Imóvel"} - ${
                        formatAddress() || "Sem endereço"
                      }`}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => setIsEditingTitle(true)}
                    sx={{
                      color: theme.palette.text.secondary,
                      p: 0.25,
                      "&:hover": {
                        backgroundColor: "rgba(0, 0, 0, 0.04)",
                      },
                    }}
                  >
                    <Edit fontSize="small" />
                  </IconButton>
                </Box>
              )}
            </Box>

            {/* Address */}
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.text.secondary,
                fontSize: "0.75rem",
                lineHeight: 1.2,
              }}
            >
              {formatAddress() || "Endereço não informado"}
            </Typography>
          </Box>

          {/* Two boxes section */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              gap: 3,
              mt: 3,
              flex: 1,
              minHeight: 0,
              overflow: "hidden",
            }}
          >
            {/* Left Box: Possíveis moradores */}
            <Paper
              elevation={0}
              sx={{
                border: `2px solid ${theme.palette.divider}`,
                borderRadius: 3,
                p: 3,
                pr: 1,
                display: "flex",
                flexDirection: "column",
                overflowY: "auto",
                height: "100%",
                "&::-webkit-scrollbar": {
                  width: "4px",
                },
                "&::-webkit-scrollbar-track": {
                  background: "transparent",
                  margin: "8px 0",
                },
                "&::-webkit-scrollbar-thumb": {
                  background: theme.palette.divider,
                  borderRadius: "2px",
                  "&:hover": {
                    background: theme.palette.text.secondary,
                  },
                },
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  mb: 2,
                  fontSize: "1.125rem",
                }}
              >
                Possíveis moradores
              </Typography>

              {/* Intelligent Search System Card */}
              <Paper
                elevation={0}
                sx={{
                  background:
                    "linear-gradient(180deg, #c8e6c9 0%, #b2dfdb 100%)",
                  borderRadius: 3,
                  p: 2,
                  mb: 2,
                  position: "relative",
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
                  <Bolt
                    sx={{
                      color: theme.palette.text.primary,
                      fontSize: "1.5rem",
                    }}
                  />
                  <Box sx={{ display: "flex", flexDirection: "column" }}>
                    <Typography
                      variant="subtitle1"
                      sx={{
                        fontWeight: 700,
                        fontSize: "1rem",
                        color: theme.palette.text.primary,
                        mb: 0.25,
                        lineHeight: 1.2,
                      }}
                    >
                      Sistema de busca inteligente
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: theme.palette.text.primary,
                        fontSize: "0.875rem",
                        lineHeight: 1.2,
                      }}
                    >
                      Encontre proprietários automaticamente pelo endereço.
                    </Typography>
                  </Box>
                </Box>
                <Typography
                  variant="body2"
                  sx={{
                    mb: 2,
                    color: theme.palette.text.primary,
                    fontSize: "0.875rem",
                    textAlign: "center",
                  }}
                >
                  Você possui <strong>300</strong>{" "}
                  <strong>créditos disponíveis</strong> para revelar
                  proprietários.
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 0.5,
                  }}
                >
                  <Verified sx={{ fontSize: "0.875rem", color: "#4caf50" }} />
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: "0.75rem",
                      color: theme.palette.text.secondary,
                    }}
                  >
                    Dados verificados
                  </Typography>
                </Box>
              </Paper>
              <Button
                variant="contained"
                fullWidth
                onClick={handleRevealOwners}
                disabled={isLoadingOwners || !data.address || !data.number}
                sx={{
                  backgroundColor: "#1976d2",
                  textTransform: "none",
                  borderRadius: 2,
                  py: 1.5,
                  mb: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  "&:hover": {
                    backgroundColor: "#1565c0",
                  },
                  "&:disabled": {
                    backgroundColor: theme.palette.action.disabledBackground,
                    color: theme.palette.action.disabled,
                  },
                }}
              >
                {isLoadingOwners ? (
                  <CircularProgress
                    size={24}
                    sx={{ color: theme.palette.common.white }}
                  />
                ) : (
                  <>
                    <Bolt
                      sx={{
                        fontSize: "1.25rem",
                        color: theme.palette.common.white,
                        mr: 1.5,
                      }}
                    />
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-start",
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 500,
                          color: theme.palette.common.white,
                          lineHeight: 1.2,
                        }}
                      >
                        Revelar lista de proprietários
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          fontSize: "0.75rem",
                          color: theme.palette.common.white,
                          opacity: 0.9,
                          lineHeight: 1.2,
                        }}
                      >
                        Busca automática pelo endereço
                      </Typography>
                    </Box>
                  </>
                )}
              </Button>

              {ownersError && (
                <Alert severity="error" sx={{ mt: 2, mb: 1 }}>
                  {ownersError}
                </Alert>
              )}

              {/* List of Possible Residents/Owners */}
              {owners.length > 0 && (
                <Box
                  sx={{
                    mt: 2,
                    display: "flex",
                    flexDirection: "column",
                    gap: 1,
                  }}
                >
                  {owners.map((owner) => (
                    <Paper
                      key={
                        owner.id ||
                        `${owner.firstName}-${owner.lastName}-${owner.nationalId}`
                      }
                      elevation={0}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                        p: 1.5,
                        borderRadius: 2,
                        border: `1px solid ${theme.palette.divider}`,
                      }}
                    >
                      <Person sx={{ color: "#4caf50", fontSize: "1.5rem" }} />
                      <Box sx={{ flex: 1 }}>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 500,
                            fontSize: "0.875rem",
                            mb: 0.25,
                          }}
                        >
                          {`${owner.firstName}`.toUpperCase()}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            fontSize: "0.75rem",
                            color: theme.palette.text.secondary,
                          }}
                        >
                          {formatNationalId(owner.nationalId)}
                        </Typography>
                        {(owner.propertyAsOwner ||
                          owner.propertyAsResident) && (
                          <Chip
                            label={
                              owner.propertyAsOwner
                                ? "Proprietário"
                                : "Residente"
                            }
                            size="small"
                            sx={{
                              mt: 0.5,
                              fontSize: "0.65rem",
                              height: "20px",
                              backgroundColor: owner.propertyAsOwner
                                ? theme.palette.success.light
                                : theme.palette.info.light,
                              color: owner.propertyAsOwner
                                ? theme.palette.success.dark
                                : theme.palette.info.dark,
                            }}
                          />
                        )}
                      </Box>
                      <Button
                        size="small"
                        variant="contained"
                        sx={{
                          backgroundColor: "#1976d2",
                          color: theme.palette.common.white,
                          textTransform: "none",
                          fontSize: "0.75rem",
                          px: 2,
                          "&:hover": {
                            backgroundColor: "#1565c0",
                          },
                        }}
                      >
                        Revelar
                      </Button>
                    </Paper>
                  ))}
                </Box>
              )}
            </Paper>

            {/* Right Box: Contatos */}
            <Paper
              elevation={0}
              sx={{
                border: `2px solid ${theme.palette.divider}`,
                borderRadius: 3,
                p: 3,
                pr: 1,
                display: "flex",
                flexDirection: "column",
                overflowY: "auto",
                height: "100%",
                "&::-webkit-scrollbar": {
                  width: "4px",
                },
                "&::-webkit-scrollbar-track": {
                  background: "transparent",
                  margin: "8px 0",
                },
                "&::-webkit-scrollbar-thumb": {
                  background: theme.palette.divider,
                  borderRadius: "2px",
                  "&:hover": {
                    background: theme.palette.text.secondary,
                  },
                },
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mb: 2,
                  gap: 2,
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    fontSize: "1.125rem",
                  }}
                >
                  Contatos
                </Typography>

                {/* Search Bar */}
                <TextField
                  placeholder="Buscar contato"
                  size="small"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    flex: "0 0 250px",
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                    },
                  }}
                />
              </Box>

              {/* Already have name/CPF box */}
              <Paper
                elevation={0}
                sx={{
                  backgroundColor: "#e3f2fd",
                  borderRadius: 3,
                  p: 2,
                  mb: 2,
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  cursor: "pointer",
                  "&:hover": {
                    backgroundColor: "#bbdefb",
                  },
                }}
              >
                <Description sx={{ color: "#1976d2" }} />
                <Box sx={{ flex: 1 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 500,
                      fontSize: "0.875rem",
                    }}
                  >
                    Já tenho o nome ou CPF
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: "0.75rem",
                      color: theme.palette.text.secondary,
                    }}
                  >
                    Busca diretamente pelos dados
                  </Typography>
                </Box>
              </Paper>

              {/* Contact List - Example contacts */}
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {/* Contact 1 */}
                <Paper
                  elevation={0}
                  sx={{
                    backgroundColor: "#f5f5f5",
                    borderRadius: 3,
                    p: 2,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      mb: 1.5,
                      gap: 2,
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 1,
                        flex: 1,
                      }}
                    >
                      <Person
                        sx={{ color: theme.palette.text.secondary, mt: 0.5 }}
                      />
                      <Box sx={{ display: "flex", flexDirection: "column" }}>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 600,
                            fontSize: "0.875rem",
                            mb: 0.25,
                            lineHeight: 1.2,
                          }}
                        >
                          ZELINDA DE JESUS SOUZA
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            fontSize: "0.75rem",
                            color: theme.palette.text.secondary,
                            lineHeight: 1.2,
                          }}
                        >
                          098.044.428-41
                        </Typography>
                      </Box>
                    </Box>
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                      <Select
                        value=""
                        displayEmpty
                        sx={{
                          borderRadius: 1,
                          fontSize: "0.75rem",
                        }}
                      >
                        <MenuItem value="" disabled>
                          Tipo de contato
                        </MenuItem>
                      </Select>
                    </FormControl>
                    <IconButton
                      size="small"
                      sx={{ color: theme.palette.text.primary }}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      gap: 1,
                      mb: 1.5,
                    }}
                  >
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<Phone />}
                      endIcon={<ArrowDropDown />}
                      sx={{
                        borderColor: "#4caf50",
                        color: "#4caf50",
                        backgroundColor: "transparent",
                        textTransform: "none",
                        fontSize: "0.75rem",
                        px: 1.5,
                        "&:hover": {
                          borderColor: "#388e3c",
                          backgroundColor: "transparent",
                        },
                      }}
                    >
                      Telefone(s){" "}
                      <Box
                        component="span"
                        sx={{
                          backgroundColor: "#4caf50",
                          color: "#fff",
                          borderRadius: "50%",
                          width: 20,
                          height: 20,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "0.7rem",
                          fontWeight: 600,
                          ml: 0.5,
                        }}
                      >
                        2
                      </Box>
                    </Button>
                    <IconButton size="small" sx={{ color: "#4caf50" }}>
                      <Add fontSize="small" />
                    </IconButton>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<Email />}
                      endIcon={<ArrowDropDown />}
                      sx={{
                        borderColor: theme.palette.divider,
                        color: theme.palette.text.secondary,
                        backgroundColor: "transparent",
                        textTransform: "none",
                        fontSize: "0.75rem",
                        px: 1.5,
                        "&:hover": {
                          borderColor: theme.palette.text.secondary,
                          backgroundColor: "transparent",
                        },
                      }}
                    >
                      E-mail{" "}
                      <Box
                        component="span"
                        sx={{
                          backgroundColor: theme.palette.text.secondary,
                          color: "#fff",
                          borderRadius: "50%",
                          width: 20,
                          height: 20,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "0.7rem",
                          fontWeight: 600,
                          ml: 0.5,
                        }}
                      >
                        0
                      </Box>
                    </Button>
                    <IconButton size="small">
                      <Add fontSize="small" />
                    </IconButton>
                  </Box>
                  <Box sx={{ mt: 1.5 }}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        mb: 1.5,
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: 500,
                          fontSize: "0.75rem",
                        }}
                      >
                        Anotações
                      </Typography>
                      <Box
                        sx={{
                          backgroundColor: "#2196f3",
                          color: "#fff",
                          borderRadius: "50%",
                          width: 18,
                          height: 18,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "0.65rem",
                          fontWeight: 600,
                        }}
                      >
                        1
                      </Box>
                      <IconButton size="small" sx={{ ml: "auto" }}>
                        <Add fontSize="small" />
                      </IconButton>
                    </Box>
                    {/* Note Card */}
                    <Paper
                      elevation={0}
                      sx={{
                        backgroundColor: "#f5f5f5",
                        borderRadius: 2,
                        border: `1px solid ${theme.palette.divider}`,
                        p: 1.5,
                        position: "relative",
                      }}
                    >
                      <IconButton
                        size="small"
                        sx={{
                          position: "absolute",
                          top: 4,
                          right: 4,
                          color: theme.palette.text.secondary,
                        }}
                      >
                        <MoreVert fontSize="small" />
                      </IconButton>
                      <Typography
                        variant="caption"
                        sx={{
                          fontSize: "0.7rem",
                          color: theme.palette.text.secondary,
                          display: "block",
                          mb: 0.5,
                        }}
                      >
                        11/11/2025 - 10:35
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          fontSize: "0.875rem",
                          color: theme.palette.text.primary,
                        }}
                      >
                        Ela era locatária.
                      </Typography>
                    </Paper>
                  </Box>
                </Paper>

                {/* Contact 2 */}
                <Paper
                  elevation={0}
                  sx={{
                    backgroundColor: "#f5f5f5",
                    borderRadius: 3,
                    p: 2,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      mb: 1.5,
                      gap: 2,
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 1,
                        flex: 1,
                      }}
                    >
                      <Person
                        sx={{ color: theme.palette.text.secondary, mt: 0.5 }}
                      />
                      <Box sx={{ display: "flex", flexDirection: "column" }}>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 600,
                            fontSize: "0.875rem",
                            mb: 0.25,
                            lineHeight: 1.2,
                          }}
                        >
                          ROGER ALEXANDRE BARBOZA
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            fontSize: "0.75rem",
                            color: theme.palette.text.secondary,
                            lineHeight: 1.2,
                          }}
                        >
                          038.356.200-64
                        </Typography>
                      </Box>
                    </Box>
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                      <Select
                        value=""
                        displayEmpty
                        sx={{
                          borderRadius: 1,
                          fontSize: "0.75rem",
                        }}
                      >
                        <MenuItem value="" disabled>
                          Tipo de contato
                        </MenuItem>
                      </Select>
                    </FormControl>
                    <IconButton
                      size="small"
                      sx={{ color: theme.palette.text.primary }}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      gap: 1,
                      mb: 1.5,
                    }}
                  >
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<Phone />}
                      endIcon={<ArrowDropDown />}
                      sx={{
                        borderColor: "#4caf50",
                        color: "#4caf50",
                        backgroundColor: "transparent",
                        textTransform: "none",
                        fontSize: "0.75rem",
                        px: 1.5,
                        "&:hover": {
                          borderColor: "#388e3c",
                          backgroundColor: "transparent",
                        },
                      }}
                    >
                      Telefone(s){" "}
                      <Box
                        component="span"
                        sx={{
                          backgroundColor: "#4caf50",
                          color: "#fff",
                          borderRadius: "50%",
                          width: 20,
                          height: 20,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "0.7rem",
                          fontWeight: 600,
                          ml: 0.5,
                        }}
                      >
                        1
                      </Box>
                    </Button>
                    <IconButton size="small" sx={{ color: "#4caf50" }}>
                      <Add fontSize="small" />
                    </IconButton>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<Email />}
                      endIcon={<ArrowDropDown />}
                      sx={{
                        borderColor: theme.palette.divider,
                        color: theme.palette.text.secondary,
                        backgroundColor: "transparent",
                        textTransform: "none",
                        fontSize: "0.75rem",
                        px: 1.5,
                        "&:hover": {
                          borderColor: theme.palette.text.secondary,
                          backgroundColor: "transparent",
                        },
                      }}
                    >
                      E-mail{" "}
                      <Box
                        component="span"
                        sx={{
                          backgroundColor: theme.palette.text.secondary,
                          color: "#fff",
                          borderRadius: "50%",
                          width: 20,
                          height: 20,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "0.7rem",
                          fontWeight: 600,
                          ml: 0.5,
                        }}
                      >
                        0
                      </Box>
                    </Button>
                    <IconButton size="small">
                      <Add fontSize="small" />
                    </IconButton>
                  </Box>
                  <Box sx={{ mt: 1.5 }}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        mb: 1.5,
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: 500,
                          fontSize: "0.75rem",
                        }}
                      >
                        Anotações
                      </Typography>
                      <Box
                        sx={{
                          backgroundColor: "#2196f3",
                          color: "#fff",
                          borderRadius: "50%",
                          width: 18,
                          height: 18,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "0.65rem",
                          fontWeight: 600,
                        }}
                      >
                        0
                      </Box>
                      <IconButton size="small" sx={{ ml: "auto" }}>
                        <Add fontSize="small" />
                      </IconButton>
                    </Box>
                    {/* Empty State */}
                    <Box
                      sx={{
                        border: "2px dashed #e0e0e0",
                        borderRadius: 2,
                        p: 3,
                        textAlign: "center",
                        backgroundColor: "#fafafa",
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          fontSize: "0.75rem",
                          color: theme.palette.text.secondary,
                        }}
                      >
                        Sem anotações
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              </Box>
            </Paper>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
