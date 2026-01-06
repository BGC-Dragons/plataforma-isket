import { useState, type KeyboardEvent } from "react";
import {
  Box,
  Typography,
  Chip,
  Collapse,
  IconButton,
  useTheme,
  Button,
  TextField,
  Paper,
  Stack,
} from "@mui/material";
import {
  ExpandMore,
  ExpandLess,
  LocationOn,
  SquareFoot,
  Add,
  Email,
  Close,
} from "@mui/icons-material";

interface PropertyInformationProps {
  // Status e Preço
  status: "VENDA" | "ALUGUEL";
  price: number;
  pricePerSquareMeter?: number;

  // Localização
  address: string;
  city: string;
  state: string;

  // Área
  totalArea: number;
  usableArea?: number;

  // Conteúdo expansível
  characteristics?: string[];
  description?: string;

  // Sidebar props
  evaluationEmails?: string[];
  evaluationCredits?: number;
  onEvaluationEmailsChange?: (emails: string[]) => void;
  onNewCapture?: () => void;
  onSendEvaluation?: () => void;

  // Callbacks
  onStatusClick?: () => void;
}

export function PropertyInformation({
  status,
  price,
  pricePerSquareMeter,
  address,
  city,
  state,
  totalArea,
  usableArea,
  characteristics = [],
  description = "",
  evaluationEmails = [],
  evaluationCredits = 3,
  onEvaluationEmailsChange,
  onNewCapture,
  onSendEvaluation,
  onStatusClick,
}: PropertyInformationProps) {
  const theme = useTheme();
  const [expandedCharacteristics, setExpandedCharacteristics] = useState(false);
  const [expandedDescription, setExpandedDescription] = useState(false);
  const [emailInput, setEmailInput] = useState("");

  // Função para validar email
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  };

  // Função para adicionar email
  const addEmail = (email: string) => {
    const trimmedEmail = email.trim();
    if (
      trimmedEmail &&
      isValidEmail(trimmedEmail) &&
      !evaluationEmails.includes(trimmedEmail)
    ) {
      const newEmails = [...evaluationEmails, trimmedEmail];
      onEvaluationEmailsChange?.(newEmails);
      setEmailInput("");
    }
  };

  // Função para remover email
  const removeEmail = (emailToRemove: string) => {
    const newEmails = evaluationEmails.filter(
      (email) => email !== emailToRemove
    );
    onEvaluationEmailsChange?.(newEmails);
  };

  // Função para lidar com teclas pressionadas
  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "," || event.key === "Enter") {
      event.preventDefault();
      addEmail(emailInput);
    }
  };

  // Função para lidar com mudança no input
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEmailInput(event.target.value);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatPricePerSquareMeter = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
    }).format(value);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "VENDA":
        return theme.palette.success.main;
      case "ALUGUEL":
        return theme.palette.info.main;
      default:
        return theme.palette.grey[500];
    }
  };

  const getStatusBackgroundColor = (status: string) => {
    switch (status) {
      case "VENDA":
        return theme.palette.success.light + "20";
      case "ALUGUEL":
        return theme.palette.info.light + "20";
      default:
        return theme.palette.grey[100];
    }
  };

  return (
    <Box
      sx={{
        width: "100%",
        backgroundColor: theme.palette.background.paper,
        borderRadius: 3,
        p: 3,
        boxShadow: theme.shadows[1],
      }}
    >
      {/* Status da Propriedade */}
      <Box sx={{ mb: 2 }}>
        <Chip
          label={status}
          onClick={onStatusClick}
          sx={{
            backgroundColor: getStatusBackgroundColor(status),
            color: getStatusColor(status),
            fontWeight: 600,
            fontSize: "0.75rem",
            height: 28,
            borderRadius: 2,
            cursor: onStatusClick ? "pointer" : "default",
            "&:hover": onStatusClick
              ? {
                  backgroundColor: getStatusColor(status) + "30",
                }
              : {},
            "& .MuiChip-icon": {
              color: getStatusColor(status),
            },
          }}
          icon={
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: getStatusColor(status),
              }}
            />
          }
        />
      </Box>

      {/* Preço e Sidebar */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", xl: "row" },
          gap: 3,
          mb: 1,
          alignItems: "flex-start",
        }}
      >
        {/* Preço e Informações */}
        <Box sx={{ flex: 1 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: theme.palette.text.primary,
              fontSize: { xs: "1.5rem", sm: "1.75rem", md: "2rem" },
              mb: 2,
            }}
          >
            {formatCurrency(price)}
          </Typography>

          {/* Endereço */}
          <Box sx={{ display: "flex", alignItems: "flex-start", mb: 2 }}>
            <LocationOn
              sx={{
                fontSize: "1.2rem",
                color: theme.palette.text.secondary,
                mr: 1,
                mt: 0.2,
                flexShrink: 0,
              }}
            />
            <Typography
              variant="body1"
              sx={{
                color: theme.palette.text.primary,
                fontWeight: 500,
                lineHeight: 1.4,
              }}
            >
              {address}
            </Typography>
          </Box>

          <Typography
            variant="body2"
            sx={{
              color: theme.palette.text.secondary,
              mb: 2,
              ml: 3,
            }}
          >
            {city} - {state}
          </Typography>

          {/* Informações de Área */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: 2,
            }}
          >
            {/* Área Total */}
            <Box
              sx={{
                backgroundColor: theme.palette.grey[50],
                borderRadius: 2,
                p: 2,
                border: `1px solid ${theme.palette.grey[200]}`,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <SquareFoot
                  sx={{
                    fontSize: "1rem",
                    color: theme.palette.text.secondary,
                    mr: 1,
                  }}
                />
                <Typography
                  variant="body2"
                  sx={{
                    color: theme.palette.text.secondary,
                    fontWeight: 500,
                    textTransform: "uppercase",
                    fontSize: "0.75rem",
                  }}
                >
                  m² TOTAL
                </Typography>
              </Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  color: theme.palette.text.primary,
                  mb: 0.5,
                  fontSize: "1.1rem",
                }}
              >
                {totalArea} m²
              </Typography>
              {pricePerSquareMeter && (
                <Typography
                  variant="body2"
                  sx={{
                    color: theme.palette.text.secondary,
                    fontWeight: 600,
                  }}
                >
                  {formatPricePerSquareMeter(pricePerSquareMeter)}/m²
                </Typography>
              )}
            </Box>

            {/* Área Útil */}
            {usableArea && (
              <Box
                sx={{
                  backgroundColor: theme.palette.grey[50],
                  borderRadius: 1.5,
                  p: 1.5,
                  border: `1px solid ${theme.palette.grey[200]}`,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                  <SquareFoot
                    sx={{
                      fontSize: "1rem",
                      color: theme.palette.text.secondary,
                      mr: 1,
                    }}
                  />
                  <Typography
                    variant="body2"
                    sx={{
                      color: theme.palette.text.secondary,
                      fontWeight: 500,
                      textTransform: "uppercase",
                      fontSize: "0.75rem",
                    }}
                  >
                    m² ÁREA ÚTIL
                  </Typography>
                </Box>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    color: theme.palette.text.primary,
                    mb: 0.5,
                    fontSize: "1.1rem",
                  }}
                >
                  {usableArea} m²
                </Typography>
                {pricePerSquareMeter && (
                  <Typography
                    variant="body2"
                    sx={{
                      color: theme.palette.text.secondary,
                      fontWeight: 600,
                    }}
                  >
                    {formatPricePerSquareMeter(pricePerSquareMeter)}/m²
                  </Typography>
                )}
              </Box>
            )}
          </Box>

          {/* Seção de Características */}
          {characteristics.length > 0 && (
            <Box sx={{ mb: 1, mt: 2 }}>
              <Box
                onClick={() =>
                  setExpandedCharacteristics(!expandedCharacteristics)
                }
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  backgroundColor: theme.palette.primary.light + "20",
                  borderRadius: 1.5,
                  p: 1.5,
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    backgroundColor: theme.palette.primary.light + "30",
                  },
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 600,
                    color: theme.palette.text.primary,
                    fontSize: "0.9rem",
                  }}
                >
                  Características
                </Typography>
                <IconButton
                  size="small"
                  sx={{
                    color: theme.palette.text.primary,
                    transform: expandedCharacteristics
                      ? "rotate(180deg)"
                      : "rotate(0deg)",
                    transition: "transform 0.3s ease",
                  }}
                >
                  {expandedCharacteristics ? <ExpandLess /> : <ExpandMore />}
                </IconButton>
              </Box>

              <Collapse in={expandedCharacteristics}>
                <Box sx={{ mt: 2, pl: 2 }}>
                  <Box
                    sx={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 1,
                    }}
                  >
                    {characteristics.map((characteristic, index) => (
                      <Chip
                        key={index}
                        label={characteristic}
                        sx={{
                          backgroundColor: theme.palette.grey[100],
                          color: theme.palette.text.primary,
                          fontWeight: 500,
                          fontSize: "0.8rem",
                          height: 32,
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              </Collapse>
            </Box>
          )}

          {/* Seção de Descrição */}
          {description && (
            <Box sx={{ mb: 1 }}>
              <Box
                onClick={() => setExpandedDescription(!expandedDescription)}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  backgroundColor: theme.palette.primary.light + "20",
                  borderRadius: 1.5,
                  p: 1.5,
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    backgroundColor: theme.palette.primary.light + "30",
                  },
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 600,
                    color: theme.palette.text.primary,
                    fontSize: "0.9rem",
                  }}
                >
                  Descrição
                </Typography>
                <IconButton
                  size="small"
                  sx={{
                    color: theme.palette.text.primary,
                    transform: expandedDescription
                      ? "rotate(180deg)"
                      : "rotate(0deg)",
                    transition: "transform 0.3s ease",
                  }}
                >
                  {expandedDescription ? <ExpandLess /> : <ExpandMore />}
                </IconButton>
              </Box>

              <Collapse in={expandedDescription}>
                <Box sx={{ mt: 2, pl: 2 }}>
                  <Typography
                    variant="body1"
                    sx={{
                      color: theme.palette.text.primary,
                      lineHeight: 1.6,
                      whiteSpace: "pre-line",
                    }}
                  >
                    {description}
                  </Typography>
                </Box>
              </Collapse>
            </Box>
          )}
        </Box>

        {/* Sidebar */}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          {/* Botão Nova Captação */}
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={onNewCapture}
            sx={{
              backgroundColor: theme.palette.error.main,
              color: theme.palette.common.white,
              borderRadius: 2,
              py: 1.5,
              fontWeight: 600,
              textTransform: "none",
              fontSize: "1rem",
              "&:hover": {
                backgroundColor: theme.palette.error.dark,
              },
            }}
          >
            Nova Captação
          </Button>

          {/* Seção Enviar Avaliação */}
          <Paper
            sx={{
              p: 3,
              borderRadius: 2,
              backgroundColor: theme.palette.background.paper,
              boxShadow: theme.shadows[1],
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                color: theme.palette.text.primary,
                mb: 2,
              }}
            >
              Enviar avaliação
            </Typography>

            <Typography
              variant="body2"
              sx={{
                color: theme.palette.text.secondary,
                mb: 2,
                fontSize: "0.9rem",
              }}
            >
              Insira os e-mails de quem você deseja enviar a avaliação ou deixe
              em branco para receber no seu e-mail:
            </Typography>

            <Box
              sx={{
                border: `1px solid ${theme.palette.grey[300]}`,
                borderRadius: 1,
                p: 1,
                minHeight: 60,
                backgroundColor: theme.palette.background.paper,
                "&:focus-within": {
                  borderColor: theme.palette.primary.main,
                },
              }}
            >
              {/* Chips dos emails */}
              {evaluationEmails.length > 0 && (
                <Box sx={{ mb: 1 }}>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {evaluationEmails.map((email, index) => (
                      <Chip
                        key={index}
                        label={email}
                        onDelete={() => removeEmail(email)}
                        deleteIcon={<Close />}
                        size="small"
                        sx={{
                          backgroundColor: theme.palette.primary.light,
                          color: theme.palette.primary.contrastText,
                          "& .MuiChip-deleteIcon": {
                            color: theme.palette.primary.contrastText,
                            fontSize: "1rem",
                          },
                        }}
                      />
                    ))}
                  </Stack>
                </Box>
              )}

              {/* Input de email */}
              <TextField
                fullWidth
                placeholder="Digite os e-mails separados por vírgula..."
                value={emailInput}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                variant="standard"
                InputProps={{
                  disableUnderline: true,
                  sx: {
                    fontSize: "0.9rem",
                    "& input": {
                      padding: 0,
                    },
                  },
                }}
              />
            </Box>

            <Typography
              variant="body2"
              sx={{
                color: theme.palette.text.secondary,
                mb: 2,
                fontSize: "0.8rem",
              }}
            >
              <strong>
                Sua conta ainda possui {evaluationCredits} créditos para
                avaliações.
              </strong>
            </Typography>

            <Button
              variant="contained"
              startIcon={<Email />}
              onClick={onSendEvaluation}
              sx={{
                backgroundColor: theme.palette.primary.main,
                color: theme.palette.common.white,
                borderRadius: 1.5,
                py: 1,
                px: 2,
                fontWeight: 500,
                textTransform: "none",
                fontSize: "0.9rem",
                "&:hover": {
                  backgroundColor: theme.palette.primary.dark,
                },
              }}
            >
              Enviar avaliação
            </Button>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
}
