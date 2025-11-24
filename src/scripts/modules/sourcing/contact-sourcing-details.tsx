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
  Avatar,
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
  Add,
  Verified,
  ArrowDropDown,
  Delete,
  Home,
} from "@mui/icons-material";
import type { ContactSourcingData } from "./contact-sourcing-modal";

interface ContactSourcingDetailsProps {
  open: boolean;
  onClose: () => void;
  data: ContactSourcingData;
  onReject?: () => void;
  onCapture?: () => void;
  onTitleChange?: (title: string) => void;
}

export function ContactSourcingDetails({
  open,
  onClose,
  data,
  onReject,
  onCapture,
  onTitleChange,
}: ContactSourcingDetailsProps) {
  const theme = useTheme();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(data.title);

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
              Captação por contato
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
              Imóveis não captados
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
              Imóveis captados
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
          {/* Contact Info Box */}
          <Box
            sx={{
              backgroundColor: "#e3f2fd",
              borderRadius: 3,
              p: 2,
            }}
          >
            {/* Title, CPF and Phone/Email buttons */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 2,
              }}
            >
              {/* Title and CPF together */}
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 0.25,
                  flex: 1,
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
                      {data.title || data.name || "Contato sem título"}
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
                {/* CPF */}
                <Typography
                  variant="body2"
                  sx={{
                    color: theme.palette.text.secondary,
                    fontSize: "0.75rem",
                    lineHeight: 1.2,
                  }}
                >
                  CPF: {data.cpf || "CPF não informado"}
                </Typography>
              </Box>

              {/* Phone and Email buttons - centered vertically */}
              <Box
                sx={{
                  display: "flex",
                  gap: 1,
                  alignItems: "center",
                  alignSelf: "center",
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
            </Box>
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
            {/* Left Box: Possíveis imóveis */}
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
                Possíveis imóveis
              </Typography>

              {/* Intelligent Search System Card */}
              <Paper
                elevation={0}
                sx={{
                  background:
                    "linear-gradient(180deg, #b2dfdb 0%, #c8e6c9 100%)",
                  borderRadius: 3,
                  p: 2,
                  mb: 2,
                  position: "relative",
                }}
              >
                <Avatar
                  sx={{
                    position: "absolute",
                    top: 16,
                    right: 16,
                    width: 40,
                    height: 40,
                    backgroundColor: "#4caf50",
                    fontSize: "1.25rem",
                    fontWeight: 700,
                  }}
                >
                  P
                </Avatar>
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
                      Encontre imóveis automaticamente pelo nome e CPF
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
                  <strong>créditos disponíveis</strong> para revelar e/ou
                  atualizar imóveis.
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
                }}
              >
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
                    Revelar/atualizar imóveis
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
                    Busca automática pelo nome e CPF
                  </Typography>
                </Box>
              </Button>

              {/* List of Possible Properties */}
              <Box
                sx={{
                  mt: 2,
                  display: "flex",
                  flexDirection: "column",
                  gap: 1,
                }}
              >
                {/* Property 1 */}
                <Paper
                  elevation={0}
                  sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 1.5,
                    p: 1.5,
                    borderRadius: 2,
                    border: `1px solid ${theme.palette.divider}`,
                  }}
                >
                  <Home
                    sx={{ color: "#4caf50", fontSize: "1.5rem", mt: 0.5 }}
                  />
                  <Box sx={{ flex: 1 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 500,
                        fontSize: "0.875rem",
                        mb: 0.25,
                      }}
                    >
                      Angelo Tozim, 1060
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: "0.75rem",
                        color: theme.palette.text.secondary,
                        display: "block",
                        mb: 0.25,
                      }}
                    >
                      31
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: "0.75rem",
                        color: theme.palette.text.secondary,
                        display: "block",
                        mb: 0.25,
                      }}
                    >
                      Belo Horizonte - MG
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: "0.75rem",
                        color: theme.palette.text.secondary,
                      }}
                    >
                      30130-000
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 1,
                      alignItems: "flex-end",
                    }}
                  >
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                      <Select
                        value=""
                        displayEmpty
                        sx={{
                          borderRadius: 1,
                          fontSize: "0.75rem",
                        }}
                      >
                        <MenuItem value="" disabled>
                          Proprietário
                        </MenuItem>
                      </Select>
                    </FormControl>
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
                      Criar captação
                    </Button>
                  </Box>
                  <IconButton
                    size="small"
                    sx={{ color: theme.palette.text.secondary, mt: 0.5 }}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </Paper>

                {/* Property 2 */}
                <Paper
                  elevation={0}
                  sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 1.5,
                    p: 1.5,
                    borderRadius: 2,
                    border: `1px solid ${theme.palette.divider}`,
                  }}
                >
                  <Home
                    sx={{ color: "#4caf50", fontSize: "1.5rem", mt: 0.5 }}
                  />
                  <Box sx={{ flex: 1 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 500,
                        fontSize: "0.875rem",
                        mb: 0.25,
                      }}
                    >
                      Rua das Flores, 500
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: "0.75rem",
                        color: theme.palette.text.secondary,
                        display: "block",
                        mb: 0.25,
                      }}
                    >
                      12
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: "0.75rem",
                        color: theme.palette.text.secondary,
                        display: "block",
                        mb: 0.25,
                      }}
                    >
                      São Paulo - SP
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: "0.75rem",
                        color: theme.palette.text.secondary,
                      }}
                    >
                      01310-100
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 1,
                      alignItems: "flex-end",
                    }}
                  >
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                      <Select
                        value=""
                        displayEmpty
                        sx={{
                          borderRadius: 1,
                          fontSize: "0.75rem",
                        }}
                      >
                        <MenuItem value="" disabled>
                          Proprietário
                        </MenuItem>
                      </Select>
                    </FormControl>
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
                      Criar captação
                    </Button>
                  </Box>
                  <IconButton
                    size="small"
                    sx={{ color: theme.palette.text.secondary, mt: 0.5 }}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </Paper>

                {/* Property 3 */}
                <Paper
                  elevation={0}
                  sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 1.5,
                    p: 1.5,
                    borderRadius: 2,
                    border: `1px solid ${theme.palette.divider}`,
                  }}
                >
                  <Home
                    sx={{ color: "#4caf50", fontSize: "1.5rem", mt: 0.5 }}
                  />
                  <Box sx={{ flex: 1 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 500,
                        fontSize: "0.875rem",
                        mb: 0.25,
                      }}
                    >
                      Av. Paulista, 1000
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: "0.75rem",
                        color: theme.palette.text.secondary,
                        display: "block",
                        mb: 0.25,
                      }}
                    >
                      45
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: "0.75rem",
                        color: theme.palette.text.secondary,
                        display: "block",
                        mb: 0.25,
                      }}
                    >
                      São Paulo - SP
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: "0.75rem",
                        color: theme.palette.text.secondary,
                      }}
                    >
                      01310-100
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 1,
                      alignItems: "flex-end",
                    }}
                  >
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                      <Select
                        value=""
                        displayEmpty
                        sx={{
                          borderRadius: 1,
                          fontSize: "0.75rem",
                        }}
                      >
                        <MenuItem value="" disabled>
                          Proprietário
                        </MenuItem>
                      </Select>
                    </FormControl>
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
                      Criar captação
                    </Button>
                  </Box>
                  <IconButton
                    size="small"
                    sx={{ color: theme.palette.text.secondary, mt: 0.5 }}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </Paper>
              </Box>
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

              {/* Create Contact Button */}
              <Button
                variant="contained"
                startIcon={<Description />}
                fullWidth
                sx={{
                  backgroundColor: "#1976d2",
                  textTransform: "none",
                  borderRadius: 2,
                  py: 1.5,
                  mb: 2,
                  "&:hover": {
                    backgroundColor: "#1565c0",
                  },
                }}
              >
                Criar contato
              </Button>

              {/* Contact Cards */}
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {/* Contact Card 1 */}
                <Paper
                  elevation={0}
                  sx={{
                    backgroundColor: "#f5f5f5",
                    borderRadius: 3,
                    p: 2,
                    position: "relative",
                  }}
                >
                  {/* Delete Icon */}
                  <IconButton
                    size="small"
                    sx={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      color: theme.palette.text.secondary,
                    }}
                  >
                    <Delete fontSize="small" />
                  </IconButton>

                  {/* Name */}
                  <Typography
                    variant="body1"
                    sx={{
                      fontWeight: 600,
                      fontSize: "0.875rem",
                      mb: 0.5,
                      pr: 4,
                    }}
                  >
                    João Souza Stanski
                  </Typography>

                  {/* CPF and Relationship */}
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: "0.75rem",
                      color: theme.palette.text.secondary,
                      mb: 1.5,
                    }}
                  >
                    938.555.587-10 - Relacionamento: Familiar
                  </Typography>

                  {/* Email and Phone Box */}
                  <Box
                    sx={{
                      display: "flex",
                      gap: 1,
                      flexWrap: "wrap",
                    }}
                  >
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<Email />}
                      sx={{
                        borderColor: theme.palette.divider,
                        color: theme.palette.text.primary,
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
                      E-mail: joao@mail.com.br
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<Phone />}
                      sx={{
                        borderColor: theme.palette.divider,
                        color: theme.palette.text.primary,
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
                      Telefone: (13) 98888-7744
                    </Button>
                  </Box>
                </Paper>

                {/* Contact Card 2 - Example */}
                <Paper
                  elevation={0}
                  sx={{
                    backgroundColor: "#f5f5f5",
                    borderRadius: 3,
                    p: 2,
                    position: "relative",
                  }}
                >
                  {/* Delete Icon */}
                  <IconButton
                    size="small"
                    sx={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      color: theme.palette.text.secondary,
                    }}
                  >
                    <Delete fontSize="small" />
                  </IconButton>

                  {/* Name */}
                  <Typography
                    variant="body1"
                    sx={{
                      fontWeight: 600,
                      fontSize: "0.875rem",
                      mb: 0.5,
                      pr: 4,
                    }}
                  >
                    Maria Silva Santos
                  </Typography>

                  {/* CPF and Relationship */}
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: "0.75rem",
                      color: theme.palette.text.secondary,
                      mb: 1.5,
                    }}
                  >
                    123.456.789-00 - Relacionamento: Amigo
                  </Typography>

                  {/* Email and Phone Box */}
                  <Box
                    sx={{
                      display: "flex",
                      gap: 1,
                      flexWrap: "wrap",
                    }}
                  >
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<Email />}
                      sx={{
                        borderColor: theme.palette.divider,
                        color: theme.palette.text.primary,
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
                      E-mail: maria@mail.com.br
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<Phone />}
                      sx={{
                        borderColor: theme.palette.divider,
                        color: theme.palette.text.primary,
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
                      Telefone: (11) 98765-4321
                    </Button>
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
