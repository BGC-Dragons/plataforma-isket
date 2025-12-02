import { useState, useEffect, useCallback } from "react";
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
  ContentCopy,
} from "@mui/icons-material";
import type { PropertySourcingData } from "./property-sourcing-modal";
import { useAuth } from "../access-manager/auth.hook";
import {
  getPropertyOwnerFinderByAddress,
  type IPropertyOwner,
} from "../../../services/get-property-owner-finder-by-address.service";
import { ResidentSearchModal } from "./resident-search-modal";
import type { ResidentResult } from "./search-resident-result-modal";
import { postPropertyListingAcquisitionContactHistory } from "../../../services/post-property-listing-acquisition-contact-history.service";
import { getPropertyListingAcquisitionsContactHistory } from "../../../services/get-property-listing-acquisitions-contact-history.service";
import { patchPropertyListingAcquisitionContactHistory } from "../../../services/patch-property-listing-acquisition-contact-history.service";
import { deletePropertyListingAcquisitionContactHistory } from "../../../services/delete-property-listing-acquisition-contact-history.service";
import { postPropertyListingAcquisitionContactHistoryNote } from "../../../services/post-property-listing-acquisition-contact-history-note.service";
import { patchPropertyListingAcquisition } from "../../../services/patch-property-listing-acquisition.service";
import { clearPropertyListingAcquisitionsStagesCache } from "../../../services/get-property-listing-acquisitions-stages.service";
import type {
  IPropertyListingAcquisitionContactHistory,
  ContactStatus,
} from "../../../services/get-property-listing-acquisitions-contact-history.service";

interface PropertySourcingDetailsProps {
  open: boolean;
  onClose: () => void;
  data: PropertySourcingData;
  acquisitionProcessId?: string; // ID da captação para buscar histórico de contatos
  acquisitionStatus?: "IN_ACQUISITION" | "DECLINED" | "ACQUIRED"; // Status atual da captação
  onReject?: () => void;
  onCapture?: () => void;
  onTitleChange?: (title: string) => void;
}

export function PropertySourcingDetails({
  open,
  onClose,
  data,
  acquisitionProcessId,
  acquisitionStatus,
  onReject,
  onCapture,
  onTitleChange,
}: PropertySourcingDetailsProps) {
  const theme = useTheme();
  const auth = useAuth();
  const [currentStatus, setCurrentStatus] = useState<
    "IN_ACQUISITION" | "DECLINED" | "ACQUIRED"
  >(acquisitionStatus || "IN_ACQUISITION");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(data.title);
  const [owners, setOwners] = useState<IPropertyOwner[]>([]);
  const [isLoadingOwners, setIsLoadingOwners] = useState(false);
  const [ownersError, setOwnersError] = useState<string | null>(null);
  const [isResidentSearchModalOpen, setIsResidentSearchModalOpen] =
    useState(false);
  const [contactHistory, setContactHistory] = useState<
    IPropertyListingAcquisitionContactHistory[]
  >([]);
  const [isLoadingContactHistory, setIsLoadingContactHistory] = useState(false);
  const [isAddingPhone, setIsAddingPhone] = useState<string | null>(null);
  const [isAddingEmail, setIsAddingEmail] = useState<string | null>(null);
  const [isAddingNote, setIsAddingNote] = useState<string | null>(null);
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newNote, setNewNote] = useState("");
  const [phonesDialogOpen, setPhonesDialogOpen] = useState(false);
  const [emailsDialogOpen, setEmailsDialogOpen] = useState(false);
  const [selectedContact, setSelectedContact] =
    useState<IPropertyListingAcquisitionContactHistory | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    setEditedTitle(data.title);
  }, [data.title]);

  // Atualizar status quando acquisitionStatus mudar
  useEffect(() => {
    if (acquisitionStatus) {
      setCurrentStatus(acquisitionStatus);
    }
  }, [acquisitionStatus]);

  // Limpar resultados de moradores quando o modal abrir ou os dados mudarem
  useEffect(() => {
    if (open) {
      setOwners([]);
      setOwnersError(null);
      setIsLoadingOwners(false);
    }
  }, [open, data.address, data.number]);

  const loadContactHistory = useCallback(async () => {
    if (!acquisitionProcessId || !auth.store.token) return;

    setIsLoadingContactHistory(true);
    try {
      const response = await getPropertyListingAcquisitionsContactHistory(
        acquisitionProcessId,
        auth.store.token
      );
      setContactHistory(response.data);
    } catch (error) {
      console.error("Erro ao carregar histórico de contatos:", error);
    } finally {
      setIsLoadingContactHistory(false);
    }
  }, [acquisitionProcessId, auth.store.token]);

  // Buscar histórico de contatos quando o modal abrir e tiver acquisitionProcessId
  useEffect(() => {
    if (open && acquisitionProcessId && auth.store.token) {
      loadContactHistory();
    } else {
      setContactHistory([]);
    }
  }, [open, acquisitionProcessId, auth.store.token, loadContactHistory]);

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

  const contactStatusOptions: { value: ContactStatus; label: string }[] = [
    { value: "UNDEFINED", label: "Indefinido" },
    { value: "NOT_THE_OWNER", label: "Não é proprietário" },
    { value: "TENANT", label: "Inquilino" },
    { value: "OWNER", label: "Proprietário" },
  ];

  const handleAddPhone = (contactHistoryId: string) => {
    setIsAddingPhone(contactHistoryId);
    setNewPhone("");
  };

  const handleSavePhone = async (contactHistoryId: string) => {
    if (!newPhone.trim() || !auth.store.token || !acquisitionProcessId) return;

    try {
      const contact = contactHistory.find((c) => c.id === contactHistoryId);
      if (!contact) return;

      const updatedPhones = [...(contact.phones || []), newPhone.trim()];

      await patchPropertyListingAcquisitionContactHistory(
        contactHistoryId,
        { phones: updatedPhones },
        auth.store.token
      );

      await loadContactHistory();
      setIsAddingPhone(null);
      setNewPhone("");
    } catch (error) {
      console.error("Erro ao adicionar telefone:", error);
    }
  };

  const handleAddEmail = (contactHistoryId: string) => {
    setIsAddingEmail(contactHistoryId);
    setNewEmail("");
  };

  const handleSaveEmail = async (contactHistoryId: string) => {
    if (!newEmail.trim() || !auth.store.token || !acquisitionProcessId) return;

    try {
      const contact = contactHistory.find((c) => c.id === contactHistoryId);
      if (!contact) return;

      const updatedEmails = [...(contact.emails || []), newEmail.trim()];

      await patchPropertyListingAcquisitionContactHistory(
        contactHistoryId,
        { emails: updatedEmails },
        auth.store.token
      );

      await loadContactHistory();
      setIsAddingEmail(null);
      setNewEmail("");
    } catch (error) {
      console.error("Erro ao adicionar email:", error);
    }
  };

  const handleAddNote = (contactHistoryId: string) => {
    setIsAddingNote(contactHistoryId);
    setNewNote("");
  };

  const handleSaveNote = async (contactHistoryId: string) => {
    if (!newNote.trim() || !auth.store.token) return;

    try {
      await postPropertyListingAcquisitionContactHistoryNote(
        contactHistoryId,
        { content: newNote.trim() },
        auth.store.token
      );

      await loadContactHistory();
      setIsAddingNote(null);
      setNewNote("");
    } catch (error) {
      console.error("Erro ao adicionar anotação:", error);
    }
  };

  const handleStatusChange = async (
    contactHistoryId: string,
    newStatus: ContactStatus
  ) => {
    if (!auth.store.token) return;

    try {
      await patchPropertyListingAcquisitionContactHistory(
        contactHistoryId,
        { status: newStatus },
        auth.store.token
      );

      await loadContactHistory();
    } catch (error) {
      console.error("Erro ao atualizar status do contato:", error);
    }
  };

  const handleDeleteContact = async (contactHistoryId: string) => {
    if (!auth.store.token) return;

    if (!window.confirm("Tem certeza que deseja excluir este contato?")) {
      return;
    }

    try {
      await deletePropertyListingAcquisitionContactHistory(
        contactHistoryId,
        auth.store.token
      );

      await loadContactHistory();
    } catch (error) {
      console.error("Erro ao deletar contato:", error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${day}/${month}/${year} - ${hours}:${minutes}`;
  };

  const handleOpenPhonesDialog = (
    contact: IPropertyListingAcquisitionContactHistory
  ) => {
    setSelectedContact(contact);
    setPhonesDialogOpen(true);
  };

  const handleOpenEmailsDialog = (
    contact: IPropertyListingAcquisitionContactHistory
  ) => {
    setSelectedContact(contact);
    setEmailsDialogOpen(true);
  };

  const handleResidentSearchComplete = async (results: ResidentResult[]) => {
    if (!acquisitionProcessId || !auth.store.token) {
      return;
    }

    // Fechar modal de busca
    setIsResidentSearchModalOpen(false);

    // Adicionar todos os contatos encontrados diretamente à captação
    try {
      for (const resident of results) {
        // Limpar o nome removendo "UNDEFINED" se estiver presente
        const cleanName = resident.name?.replace(/\s+UNDEFINED$/i, "").trim();

        await postPropertyListingAcquisitionContactHistory(
          {
            acquisitionProcessId,
            contactName: cleanName,
            contactDetails: `CPF: ${resident.cpf}`,
            contactDate: new Date().toISOString(),
            status: "UNDEFINED",
          },
          auth.store.token
        );
      }

      // Atualizar lista de contatos
      await loadContactHistory();
    } catch (error) {
      console.error("Erro ao adicionar contatos à captação:", error);
      alert("Erro ao adicionar contatos. Tente novamente.");
    }
  };

  const handleCapture = async () => {
    if (!acquisitionProcessId || !auth.store.token) {
      return;
    }

    setIsUpdatingStatus(true);
    try {
      await patchPropertyListingAcquisition(
        acquisitionProcessId,
        auth.store.token,
        {
          status: "ACQUIRED",
        }
      );

      // Limpar cache e atualizar o Kanban
      clearPropertyListingAcquisitionsStagesCache();

      // Chamar callback se existir
      onCapture?.();

      // Fechar modal
      onClose();
    } catch (error) {
      console.error("Erro ao atualizar status para captado:", error);
      alert("Erro ao atualizar status. Tente novamente.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleReject = async () => {
    if (!acquisitionProcessId || !auth.store.token) {
      return;
    }

    setIsUpdatingStatus(true);
    try {
      await patchPropertyListingAcquisition(
        acquisitionProcessId,
        auth.store.token,
        {
          status: "DECLINED",
        }
      );

      // Atualizar status local
      setCurrentStatus("DECLINED");

      // Limpar cache e atualizar o Kanban
      clearPropertyListingAcquisitionsStagesCache();

      // Chamar callback se existir
      onReject?.();

      // Fechar modal
      onClose();
    } catch (error) {
      console.error("Erro ao atualizar status para recusado:", error);
      alert("Erro ao atualizar status. Tente novamente.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xl"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: { xs: 0, sm: 3 },
          overflow: "hidden",
          boxShadow: theme.shadows[24],
          m: { xs: 0, sm: 2 },
          maxHeight: { xs: "100vh", sm: "90vh" },
          height: { xs: "100vh", sm: "90vh" },
          display: "flex",
          flexDirection: "column",
        },
      }}
      BackdropProps={{
        sx: {
          backgroundColor: "rgba(0, 0, 0, 0.5)",
        },
      }}
      sx={{
        "& .MuiDialog-container": {
          alignItems: { xs: "flex-end", sm: "center" },
        },
      }}
    >
      <DialogContent
        sx={{
          p: 0,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          flex: 1,
          minHeight: 0,
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            alignItems: { xs: "flex-start", sm: "center" },
            justifyContent: "space-between",
            p: { xs: 2, sm: 3 },
            borderBottom: `1px solid ${theme.palette.divider}`,
            gap: { xs: 2, sm: 0 },
          }}
        >
          {/* Título e Status */}
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              alignItems: { xs: "flex-start", sm: "center" },
              gap: { xs: 1, sm: 2 },
              flex: 1,
            }}
          >
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                fontSize: { xs: "1.25rem", sm: "1.5rem" },
                color: theme.palette.text.primary,
              }}
            >
              Captação por imóvel
            </Typography>
            <Chip
              icon={
                currentStatus === "ACQUIRED" ? (
                  <CheckCircle
                    sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}
                  />
                ) : currentStatus === "DECLINED" ? (
                  <Cancel sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }} />
                ) : (
                  <AccessTime
                    sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}
                  />
                )
              }
              label={
                currentStatus === "ACQUIRED"
                  ? "Captado"
                  : currentStatus === "DECLINED"
                  ? "Recusado"
                  : "Em processo"
              }
              sx={{
                backgroundColor:
                  currentStatus === "ACQUIRED"
                    ? "#4caf50"
                    : currentStatus === "DECLINED"
                    ? "#f44336"
                    : "#ff9800",
                color: "#fff",
                fontWeight: 500,
                fontSize: { xs: "0.75rem", sm: "0.875rem" },
                height: { xs: 24, sm: 32 },
                "& .MuiChip-icon": {
                  color: "#fff",
                },
              }}
            />
          </Box>

          {/* Botões e Fechar */}
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              alignItems: { xs: "stretch", sm: "center" },
              gap: { xs: 1, sm: 2 },
              width: { xs: "100%", sm: "auto" },
            }}
          >
            {currentStatus === "IN_ACQUISITION" && (
              <>
                <Button
                  onClick={handleReject}
                  variant="contained"
                  startIcon={<Cancel />}
                  disabled={isUpdatingStatus || !acquisitionProcessId}
                  fullWidth={true}
                  sx={{
                    textTransform: "none",
                    borderRadius: 2,
                    px: { xs: 1.5, sm: 2 },
                    py: { xs: 1, sm: 1.25 },
                    fontSize: { xs: "0.875rem", sm: "1rem" },
                    backgroundColor: theme.palette.error.main,
                    color: theme.palette.common.white,
                    "&:hover": {
                      backgroundColor: theme.palette.error.dark,
                    },
                  }}
                >
                  {isUpdatingStatus ? "Atualizando..." : "Recusado"}
                </Button>
                <Button
                  onClick={handleCapture}
                  variant="contained"
                  startIcon={<CheckCircle />}
                  disabled={isUpdatingStatus || !acquisitionProcessId}
                  fullWidth={true}
                  sx={{
                    textTransform: "none",
                    borderRadius: 2,
                    px: { xs: 1.5, sm: 2 },
                    py: { xs: 1, sm: 1.25 },
                    fontSize: { xs: "0.875rem", sm: "1rem" },
                    backgroundColor: theme.palette.success.main,
                    color: theme.palette.common.white,
                    "&:hover": {
                      backgroundColor: theme.palette.success.dark,
                    },
                  }}
                >
                  {isUpdatingStatus ? "Atualizando..." : "Captado"}
                </Button>
              </>
            )}
            <IconButton
              onClick={onClose}
              sx={{
                color: theme.palette.text.secondary,
                alignSelf: { xs: "flex-end", sm: "center" },
                position: { xs: "absolute", sm: "relative" },
                top: { xs: 8, sm: "auto" },
                right: { xs: 8, sm: "auto" },
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
                onClick={() => setIsResidentSearchModalOpen(true)}
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

              {/* Contact List */}
              {isLoadingContactHistory ? (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    py: 4,
                  }}
                >
                  <CircularProgress size={24} />
                </Box>
              ) : contactHistory.length === 0 ? (
                <Box
                  sx={{
                    textAlign: "center",
                    py: 4,
                    color: theme.palette.text.secondary,
                  }}
                >
                  <Typography variant="body2">
                    Nenhum contato registrado ainda.
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {contactHistory.map((contact) => (
                    <Paper
                      key={contact.id}
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
                            sx={{
                              color: theme.palette.text.secondary,
                              mt: 0.5,
                            }}
                          />
                          <Box
                            sx={{ display: "flex", flexDirection: "column" }}
                          >
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 600,
                                fontSize: "0.875rem",
                                mb: 0.25,
                                lineHeight: 1.2,
                              }}
                            >
                              {contact.contactName
                                ?.replace(/\s+UNDEFINED$/i, "")
                                .toUpperCase() || "Sem nome"}
                            </Typography>
                            {contact.contactDetails && (
                              <Typography
                                variant="caption"
                                sx={{
                                  fontSize: "0.75rem",
                                  color: theme.palette.text.secondary,
                                  lineHeight: 1.2,
                                }}
                              >
                                {contact.contactDetails}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                        <FormControl size="small" sx={{ minWidth: 150 }}>
                          <Select
                            value={contact.status}
                            onChange={(e) =>
                              handleStatusChange(
                                contact.id,
                                e.target.value as ContactStatus
                              )
                            }
                            sx={{
                              borderRadius: 1,
                              fontSize: "0.75rem",
                            }}
                          >
                            {contactStatusOptions.map((option) => (
                              <MenuItem key={option.value} value={option.value}>
                                {option.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteContact(contact.id)}
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
                          flexWrap: "wrap",
                        }}
                      >
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<Phone />}
                          endIcon={<ArrowDropDown />}
                          onClick={() => handleOpenPhonesDialog(contact)}
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
                            {contact.phones?.length || 0}
                          </Box>
                        </Button>
                        <IconButton
                          size="small"
                          onClick={() => handleAddPhone(contact.id)}
                          sx={{ color: "#4caf50" }}
                        >
                          <Add fontSize="small" />
                        </IconButton>
                        {isAddingPhone === contact.id && (
                          <Box
                            sx={{
                              display: "flex",
                              gap: 1,
                              alignItems: "center",
                              width: "100%",
                            }}
                          >
                            <TextField
                              size="small"
                              placeholder="Novo telefone"
                              value={newPhone}
                              onChange={(e) => setNewPhone(e.target.value)}
                              sx={{ flex: 1 }}
                            />
                            <IconButton
                              size="small"
                              onClick={() => handleSavePhone(contact.id)}
                              sx={{ color: "#4caf50" }}
                            >
                              <CheckCircle fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => {
                                setIsAddingPhone(null);
                                setNewPhone("");
                              }}
                            >
                              <Cancel fontSize="small" />
                            </IconButton>
                          </Box>
                        )}
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<Email />}
                          endIcon={<ArrowDropDown />}
                          onClick={() => handleOpenEmailsDialog(contact)}
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
                            {contact.emails?.length || 0}
                          </Box>
                        </Button>
                        <IconButton
                          size="small"
                          onClick={() => handleAddEmail(contact.id)}
                        >
                          <Add fontSize="small" />
                        </IconButton>
                        {isAddingEmail === contact.id && (
                          <Box
                            sx={{
                              display: "flex",
                              gap: 1,
                              alignItems: "center",
                              width: "100%",
                            }}
                          >
                            <TextField
                              size="small"
                              type="email"
                              placeholder="Novo e-mail"
                              value={newEmail}
                              onChange={(e) => setNewEmail(e.target.value)}
                              sx={{ flex: 1 }}
                            />
                            <IconButton
                              size="small"
                              onClick={() => handleSaveEmail(contact.id)}
                              sx={{ color: "#4caf50" }}
                            >
                              <CheckCircle fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => {
                                setIsAddingEmail(null);
                                setNewEmail("");
                              }}
                            >
                              <Cancel fontSize="small" />
                            </IconButton>
                          </Box>
                        )}
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
                            {contact.contactNotes?.length || 0}
                          </Box>
                          <IconButton
                            size="small"
                            onClick={() => handleAddNote(contact.id)}
                            sx={{ ml: "auto" }}
                          >
                            <Add fontSize="small" />
                          </IconButton>
                        </Box>
                        {isAddingNote === contact.id && (
                          <Box sx={{ mb: 1.5 }}>
                            <TextField
                              fullWidth
                              multiline
                              rows={2}
                              size="small"
                              placeholder="Nova anotação"
                              value={newNote}
                              onChange={(e) => setNewNote(e.target.value)}
                              sx={{ mb: 1 }}
                            />
                            <Box
                              sx={{
                                display: "flex",
                                gap: 1,
                                justifyContent: "flex-end",
                              }}
                            >
                              <Button
                                size="small"
                                onClick={() => handleSaveNote(contact.id)}
                                variant="contained"
                                sx={{ textTransform: "none" }}
                              >
                                Salvar
                              </Button>
                              <Button
                                size="small"
                                onClick={() => {
                                  setIsAddingNote(null);
                                  setNewNote("");
                                }}
                                sx={{ textTransform: "none" }}
                              >
                                Cancelar
                              </Button>
                            </Box>
                          </Box>
                        )}
                        {/* Notes List */}
                        {contact.contactNotes &&
                          contact.contactNotes.length > 0 && (
                            <Box
                              sx={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 1,
                              }}
                            >
                              {contact.contactNotes.map((note) => (
                                <Paper
                                  key={note.id}
                                  elevation={0}
                                  sx={{
                                    backgroundColor: "#f5f5f5",
                                    borderRadius: 2,
                                    border: `1px solid ${theme.palette.divider}`,
                                    p: 1.5,
                                  }}
                                >
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      fontSize: "0.7rem",
                                      color: theme.palette.text.secondary,
                                      display: "block",
                                      mb: 0.5,
                                    }}
                                  >
                                    {formatDate(note.createdAt)}
                                  </Typography>
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      fontSize: "0.875rem",
                                      color: theme.palette.text.primary,
                                    }}
                                  >
                                    {note.content}
                                  </Typography>
                                </Paper>
                              ))}
                            </Box>
                          )}
                      </Box>
                    </Paper>
                  ))}
                </Box>
              )}
            </Paper>
          </Box>
        </Box>
      </DialogContent>

      {/* Modal de pesquisa de moradores */}
      <ResidentSearchModal
        open={isResidentSearchModalOpen}
        onClose={() => setIsResidentSearchModalOpen(false)}
        onSearchComplete={handleResidentSearchComplete}
      />

      {/* Dialog de Telefones */}
      <Dialog
        open={phonesDialogOpen}
        onClose={() => {
          setPhonesDialogOpen(false);
          setSelectedContact(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogContent>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 2,
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Telefones -{" "}
              {selectedContact?.contactName?.replace(/\s+UNDEFINED$/i, "") ||
                "Contato"}
            </Typography>
            <IconButton
              size="small"
              onClick={() => {
                setPhonesDialogOpen(false);
                setSelectedContact(null);
              }}
            >
              <Close />
            </IconButton>
          </Box>
          {selectedContact?.phones && selectedContact.phones.length > 0 ? (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {selectedContact.phones.map((phone, index) => (
                <Paper
                  key={index}
                  elevation={0}
                  sx={{
                    p: 2,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 2,
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                  }}
                >
                  <Phone sx={{ color: "#4caf50" }} />
                  <Typography variant="body1" sx={{ flex: 1 }}>
                    {phone}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => {
                      // Copiar para clipboard
                      navigator.clipboard.writeText(phone);
                    }}
                    sx={{ color: theme.palette.text.secondary }}
                    title="Copiar telefone"
                  >
                    <ContentCopy fontSize="small" />
                  </IconButton>
                </Paper>
              ))}
            </Box>
          ) : (
            <Box
              sx={{
                textAlign: "center",
                py: 4,
                color: theme.palette.text.secondary,
              }}
            >
              <Typography variant="body2">
                Nenhum telefone cadastrado
              </Typography>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Emails */}
      <Dialog
        open={emailsDialogOpen}
        onClose={() => {
          setEmailsDialogOpen(false);
          setSelectedContact(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogContent>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 2,
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              E-mails -{" "}
              {selectedContact?.contactName?.replace(/\s+UNDEFINED$/i, "") ||
                "Contato"}
            </Typography>
            <IconButton
              size="small"
              onClick={() => {
                setEmailsDialogOpen(false);
                setSelectedContact(null);
              }}
            >
              <Close />
            </IconButton>
          </Box>
          {selectedContact?.emails && selectedContact.emails.length > 0 ? (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {selectedContact.emails.map((email, index) => (
                <Paper
                  key={index}
                  elevation={0}
                  sx={{
                    p: 2,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 2,
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                  }}
                >
                  <Email sx={{ color: theme.palette.text.secondary }} />
                  <Typography variant="body1" sx={{ flex: 1 }}>
                    {email}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => {
                      // Copiar para clipboard
                      navigator.clipboard.writeText(email);
                    }}
                    sx={{ color: theme.palette.text.secondary }}
                    title="Copiar e-mail"
                  >
                    <ContentCopy fontSize="small" />
                  </IconButton>
                </Paper>
              ))}
            </Box>
          ) : (
            <Box
              sx={{
                textAlign: "center",
                py: 4,
                color: theme.palette.text.secondary,
              }}
            >
              <Typography variant="body2">Nenhum e-mail cadastrado</Typography>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
