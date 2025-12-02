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
  Home,
  ContentCopy,
} from "@mui/icons-material";
import type { ContactSourcingData } from "./contact-sourcing-modal";
import { useAuth } from "../access-manager/auth.hook";
import { getPropertyOwnerFinderByNationalId } from "../../../services/get-property-owner-finder-by-national-id.service";
import {
  postRevealedPropertiesMultiple,
  getRevealedProperties,
  putRevealedProperty,
  type IRevealedProperty,
} from "../../../services/get-property-listing-acquisitions-revealed-properties.service";
import { CircularProgress, Alert } from "@mui/material";
import { getPropertyListingAcquisitionsContactHistory } from "../../../services/get-property-listing-acquisitions-contact-history.service";
import type { IPropertyListingAcquisitionContactHistory } from "../../../services/get-property-listing-acquisitions-contact-history.service";
import { patchPropertyListingAcquisitionContactHistory } from "../../../services/patch-property-listing-acquisition-contact-history.service";
import { CreateContactModal } from "./create-contact-modal";
import { getPropertyListingAcquisitionContacts } from "../../../services/get-property-listing-acquisition-contacts.service";
import type { IPropertyListingAcquisitionContact } from "../../../services/post-property-listing-acquisition-contact.service";

interface ContactSourcingDetailsProps {
  open: boolean;
  onClose: () => void;
  data: ContactSourcingData;
  acquisitionProcessId?: string;
  onReject?: () => void;
  onCapture?: () => void;
  onTitleChange?: (title: string) => void;
}

export function ContactSourcingDetails({
  open,
  onClose,
  data,
  acquisitionProcessId,
  onReject,
  onCapture,
  onTitleChange,
}: ContactSourcingDetailsProps) {
  const theme = useTheme();
  const auth = useAuth();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(data.title);
  const [isRevealingProperties, setIsRevealingProperties] = useState(false);
  const [revealError, setRevealError] = useState<string | null>(null);
  const [revealedProperties, setRevealedProperties] = useState<
    IRevealedProperty[]
  >([]);
  const [isLoadingRevealedProperties, setIsLoadingRevealedProperties] =
    useState(false);
  const [contactHistory, setContactHistory] = useState<
    IPropertyListingAcquisitionContactHistory[]
  >([]);
  const [isAddingPhone, setIsAddingPhone] = useState(false);
  const [isAddingEmail, setIsAddingEmail] = useState(false);
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [phonesDialogOpen, setPhonesDialogOpen] = useState(false);
  const [emailsDialogOpen, setEmailsDialogOpen] = useState(false);
  const [selectedContact, setSelectedContact] =
    useState<IPropertyListingAcquisitionContactHistory | null>(null);
  const [isCreateContactModalOpen, setIsCreateContactModalOpen] =
    useState(false);
  const [contacts, setContacts] = useState<
    IPropertyListingAcquisitionContact[]
  >([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);

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

  const loadContactHistory = useCallback(async () => {
    if (!acquisitionProcessId || !auth.store.token) return;

    try {
      const response = await getPropertyListingAcquisitionsContactHistory(
        acquisitionProcessId,
        auth.store.token
      );
      setContactHistory(response.data);
    } catch (error) {
      console.error("Erro ao carregar histórico de contatos:", error);
    }
  }, [acquisitionProcessId, auth.store.token]);

  const loadContacts = useCallback(async () => {
    if (!acquisitionProcessId || !auth.store.token) return;

    setIsLoadingContacts(true);
    try {
      const response = await getPropertyListingAcquisitionContacts(
        acquisitionProcessId,
        auth.store.token
      );
      // A resposta vem no formato { contacts: [...] }
      const contactsData = Array.isArray(response.data.contacts)
        ? response.data.contacts
        : [];

      console.log("Contatos processados:", contactsData); // Debug
      setContacts(contactsData);
    } catch (error) {
      console.error("Erro ao carregar contatos:", error);
      setContacts([]); // Em caso de erro, garantir que seja array vazio
    } finally {
      setIsLoadingContacts(false);
    }
  }, [acquisitionProcessId, auth.store.token]);

  const loadRevealedProperties = useCallback(async () => {
    if (!acquisitionProcessId || !auth.store.token) {
      return;
    }

    setIsLoadingRevealedProperties(true);
    try {
      const response = await getRevealedProperties(
        acquisitionProcessId,
        auth.store.token
      );
      setRevealedProperties(response.data.properties || []);
    } catch (error) {
      console.error("Erro ao carregar propriedades reveladas:", error);
    } finally {
      setIsLoadingRevealedProperties(false);
    }
  }, [acquisitionProcessId, auth.store.token]);

  const handleUpdateSelectedRelation = async (
    propertyId: string,
    newRelation: string
  ) => {
    if (!acquisitionProcessId || !auth.store.token) {
      return;
    }

    try {
      await putRevealedProperty(
        acquisitionProcessId,
        propertyId,
        { selectedRelation: newRelation },
        auth.store.token
      );
      // Atualizar o estado local
      setRevealedProperties((prev) =>
        prev.map((prop) =>
          prop.id === propertyId
            ? { ...prop, selectedRelation: newRelation }
            : prop
        )
      );
    } catch (error) {
      console.error("Erro ao atualizar relação da propriedade:", error);
    }
  };

  // Limpar propriedades reveladas quando o modal abrir (similar ao property-sourcing-details)
  useEffect(() => {
    if (open) {
      setRevealedProperties([]);
      setRevealError(null);
      setIsRevealingProperties(false);
    }
  }, [open, data.cpf]);

  // Carregar histórico de contatos e contatos quando o modal abrir
  useEffect(() => {
    if (open && acquisitionProcessId && auth.store.token) {
      loadContactHistory();
      loadContacts();
    } else {
      setContactHistory([]);
      setContacts([]);
    }
  }, [
    open,
    acquisitionProcessId,
    auth.store.token,
    loadContactHistory,
    loadContacts,
  ]);

  // Recarregar contactHistory quando acquisitionProcessId mudar (útil quando captação é criada)
  useEffect(() => {
    if (acquisitionProcessId && auth.store.token) {
      loadContactHistory();
    }
  }, [acquisitionProcessId, auth.store.token, loadContactHistory]);

  const handleRevealProperties = async () => {
    if (!acquisitionProcessId || !auth.store.token || !data.cpf) {
      setRevealError(
        "CPF não encontrado. Não é possível revelar propriedades."
      );
      return;
    }

    setIsRevealingProperties(true);
    setRevealError(null);

    try {
      console.log("Iniciando revelação de propriedades...");
      console.log("acquisitionProcessId:", acquisitionProcessId);
      console.log("CPF:", data.cpf);

      // 1. Buscar propriedades pelo CPF
      const ownerResponse = await getPropertyOwnerFinderByNationalId(
        data.cpf,
        auth.store.token
      );
      const owner = ownerResponse.data;

      console.log("Resposta da API de busca por CPF:", owner);
      console.log("Resposta completa (JSON):", JSON.stringify(owner, null, 2));
      console.log("Tipo da resposta:", typeof owner);
      console.log("owner é null?", owner === null);
      console.log("owner é undefined?", owner === undefined);

      // Verificar se a resposta é válida
      if (!owner) {
        console.error("Resposta inválida da API - owner é null/undefined");
        setRevealError("Resposta inválida da API. Tente novamente.");
        setIsRevealingProperties(false);
        return;
      }

      // 2. Extrair propriedades do resultado
      const properties: Array<{
        address: string;
        complement?: string;
        city?: string;
        state?: string;
        postalCode?: string;
        neighborhood?: string;
        selectedRelation?: string;
      }> = [];

      console.log("Verificando propertyAsOwner:", owner.propertyAsOwner);
      console.log("Verificando propertyAsResident:", owner.propertyAsResident);

      // Propriedade como proprietário
      if (owner.propertyAsOwner && owner.propertyAsOwner !== null) {
        const prop = owner.propertyAsOwner;
        console.log("Processando propertyAsOwner:", prop);
        console.log("formattedAddress:", prop.formattedAddress);

        // Verificar se formattedAddress existe
        if (prop.formattedAddress) {
          // Extrair informações do formattedAddress
          const addressParts = prop.formattedAddress.split(",");
          const streetAndNumber = addressParts[0]?.trim() || "";
          const neighborhood = addressParts[1]?.trim() || "";
          const cityState = addressParts[2]?.trim() || "";
          const [city, state] = cityState.split(" - ");

          console.log("Endereço extraído - streetAndNumber:", streetAndNumber);
          console.log("Endereço extraído - neighborhood:", neighborhood);
          console.log("Endereço extraído - city:", city);
          console.log("Endereço extraído - state:", state);

          // Só adicionar se tiver pelo menos o endereço
          if (streetAndNumber) {
            properties.push({
              address: streetAndNumber,
              complement: prop.addressComplementId || undefined,
              city: city || undefined,
              state: state || undefined,
              neighborhood: neighborhood || undefined,
              selectedRelation: "owner",
            });
            console.log("Propriedade como owner adicionada");
          } else {
            console.warn("streetAndNumber está vazio, não adicionando propriedade");
          }
        } else {
          console.warn("formattedAddress não existe em propertyAsOwner");
        }
      } else {
        console.log("propertyAsOwner é null ou undefined");
      }

      // Propriedade como residente
      if (owner.propertyAsResident && owner.propertyAsResident !== null) {
        const prop = owner.propertyAsResident;
        console.log("Processando propertyAsResident:", prop);
        console.log("formattedAddress:", prop.formattedAddress);

        // Verificar se formattedAddress existe
        if (prop.formattedAddress) {
          const addressParts = prop.formattedAddress.split(",");
          const streetAndNumber = addressParts[0]?.trim() || "";
          const neighborhood = addressParts[1]?.trim() || "";
          const cityState = addressParts[2]?.trim() || "";
          const [city, state] = cityState.split(" - ");

          console.log("Endereço extraído - streetAndNumber:", streetAndNumber);
          console.log("Endereço extraído - neighborhood:", neighborhood);
          console.log("Endereço extraído - city:", city);
          console.log("Endereço extraído - state:", state);

          // Só adicionar se tiver pelo menos o endereço
          if (streetAndNumber) {
            properties.push({
              address: streetAndNumber,
              complement: prop.addressComplementId || undefined,
              city: city || undefined,
              state: state || undefined,
              neighborhood: neighborhood || undefined,
              selectedRelation: "resident",
            });
            console.log("Propriedade como resident adicionada");
          } else {
            console.warn("streetAndNumber está vazio, não adicionando propriedade");
          }
        } else {
          console.warn("formattedAddress não existe em propertyAsResident");
        }
      } else {
        console.log("propertyAsResident é null ou undefined");
      }

      console.log("Propriedades extraídas:", properties);
      console.log("Número de propriedades:", properties.length);
      console.log("owner.propertyAsOwner:", owner.propertyAsOwner);
      console.log("owner.propertyAsResident:", owner.propertyAsResident);

      // 3. Criar propriedades reveladas
      // SEMPRE fazer a chamada POST, mesmo se não houver propriedades extraídas
      // A API pode precisar atualizar os dados mesmo sem novas propriedades
      console.log("Fazendo POST para criar/atualizar propriedades reveladas...");
      console.log("acquisitionProcessId:", acquisitionProcessId);
      console.log("Payload:", {
        cpf: data.cpf.replace(/\D/g, ""),
        properties: properties,
      });

      const response = await postRevealedPropertiesMultiple(
        acquisitionProcessId,
        {
          cpf: data.cpf.replace(/\D/g, ""), // Apenas números
          properties: properties,
        },
        auth.store.token
      );

      console.log("Resposta do POST:", response);
      console.log("Status da resposta:", response.status);
      console.log("Dados da resposta:", response.data);

      // Limpar erro após sucesso
      setRevealError(null);

      // 4. Usar as propriedades da resposta se disponíveis, senão recarregar
      const responseData = response.data;
      if (responseData && (responseData.properties || responseData.createdProperties)) {
        // A API pode retornar 'properties' ou 'createdProperties'
        const returnedProperties = responseData.properties || responseData.createdProperties || [];
        console.log("Propriedades retornadas pela API:", returnedProperties);
        if (Array.isArray(returnedProperties) && returnedProperties.length > 0) {
          setRevealedProperties(returnedProperties);
        } else {
          // Se não retornou propriedades, recarregar do servidor
          await loadRevealedProperties();
        }
      } else {
        // Se não houver propriedades na resposta, recarregar do servidor
        await loadRevealedProperties();
      }

      if (properties.length === 0) {
        console.log("Nenhuma propriedade nova foi extraída, mas a chamada POST foi feita");
      }
    } catch (error: unknown) {
      console.error("Erro ao revelar propriedades:", error);
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as {
          response?: { status?: number; data?: { message?: string } };
        };
        console.error("Erro Axios - Status:", axiosError.response?.status);
        console.error("Erro Axios - Data:", axiosError.response?.data);
        if (axiosError.response?.status === 402) {
          setRevealError(
            "Créditos insuficientes. Por favor, adquira créditos adicionais para continuar."
          );
        } else if (axiosError.response?.status === 404) {
          setRevealError("Nenhuma propriedade encontrada para este CPF.");
        } else {
          const errorMessage =
            axiosError.response?.data?.message ||
            "Erro ao revelar propriedades. Tente novamente.";
          setRevealError(errorMessage);
        }
      } else if (error instanceof Error) {
        console.error("Erro genérico:", error.message);
        console.error("Stack:", error.stack);
        setRevealError(error.message);
      } else {
        console.error("Erro desconhecido:", error);
        setRevealError(
          "Erro inesperado ao revelar propriedades. Tente novamente."
        );
      }
    } finally {
      setIsRevealingProperties(false);
    }
  };

  // Pegar o primeiro contato (contato principal)
  const mainContact = contactHistory.length > 0 ? contactHistory[0] : null;
  const mainPhones = mainContact?.phones || [];
  const mainEmails = mainContact?.emails || [];

  const handleAddPhone = () => {
    setIsAddingPhone(true);
    setNewPhone("");
  };

  const handleSavePhone = async () => {
    if (
      !newPhone.trim() ||
      !auth.store.token ||
      !acquisitionProcessId ||
      !mainContact
    )
      return;

    try {
      const updatedPhones = [...mainPhones, newPhone.trim()];

      await patchPropertyListingAcquisitionContactHistory(
        mainContact.id,
        { phones: updatedPhones },
        auth.store.token
      );

      await loadContactHistory();
      setIsAddingPhone(false);
      setNewPhone("");
    } catch (error) {
      console.error("Erro ao adicionar telefone:", error);
    }
  };

  const handleAddEmail = () => {
    setIsAddingEmail(true);
    setNewEmail("");
  };

  const handleSaveEmail = async () => {
    if (
      !newEmail.trim() ||
      !auth.store.token ||
      !acquisitionProcessId ||
      !mainContact
    )
      return;

    try {
      const updatedEmails = [...mainEmails, newEmail.trim()];

      await patchPropertyListingAcquisitionContactHistory(
        mainContact.id,
        { emails: updatedEmails },
        auth.store.token
      );

      await loadContactHistory();
      setIsAddingEmail(false);
      setNewEmail("");
    } catch (error) {
      console.error("Erro ao adicionar email:", error);
    }
  };

  const handleOpenPhonesDialog = () => {
    if (mainContact) {
      setSelectedContact(mainContact);
      setPhonesDialogOpen(true);
    }
  };

  const handleOpenEmailsDialog = () => {
    if (mainContact) {
      setSelectedContact(mainContact);
      setEmailsDialogOpen(true);
    }
  };

  const handleContactCreated = async () => {
    // Recarregar contatos e histórico de contatos após criar um novo contato
    await loadContacts();
    await loadContactHistory();
  };

  const formatCPF = (cpf: string | undefined | null) => {
    if (!cpf) return "CPF não informado";
    const numbers = cpf.replace(/\D/g, "");
    if (numbers.length === 11) {
      return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(
        6,
        9
      )}-${numbers.slice(9, 11)}`;
    }
    return cpf;
  };

  const formatRelationship = (relationship: string) => {
    const relationships: Record<string, string> = {
      familiar: "Familiar",
      family: "Familiar",
      negocios: "Negócios",
      amigo: "Amigo",
      vizinho: "Vizinho",
      outros: "Outros",
    };
    return relationships[relationship] || relationship;
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
                  flexWrap: "wrap",
                }}
              >
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<Phone />}
                  endIcon={<ArrowDropDown />}
                  onClick={handleOpenPhonesDialog}
                  disabled={!mainContact}
                  sx={{
                    borderColor:
                      mainPhones.length > 0 ? "#4caf50" : theme.palette.divider,
                    color:
                      mainPhones.length > 0
                        ? "#4caf50"
                        : theme.palette.text.secondary,
                    backgroundColor: "transparent",
                    textTransform: "none",
                    fontSize: "0.75rem",
                    px: 1.5,
                    "&:hover": {
                      borderColor:
                        mainPhones.length > 0
                          ? "#388e3c"
                          : theme.palette.text.secondary,
                      backgroundColor: "transparent",
                    },
                  }}
                >
                  Telefone(s){" "}
                  <Box
                    component="span"
                    sx={{
                      backgroundColor:
                        mainPhones.length > 0
                          ? "#4caf50"
                          : theme.palette.text.secondary,
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
                    {mainPhones.length}
                  </Box>
                </Button>
                <IconButton
                  size="small"
                  onClick={handleAddPhone}
                  disabled={!mainContact}
                  sx={{ color: "#4caf50" }}
                >
                  <Add fontSize="small" />
                </IconButton>
                {isAddingPhone && (
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
                      onClick={handleSavePhone}
                      sx={{ color: "#4caf50" }}
                    >
                      <CheckCircle fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => {
                        setIsAddingPhone(false);
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
                  onClick={handleOpenEmailsDialog}
                  disabled={!mainContact}
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
                    {mainEmails.length}
                  </Box>
                </Button>
                <IconButton
                  size="small"
                  onClick={handleAddEmail}
                  disabled={!mainContact}
                >
                  <Add fontSize="small" />
                </IconButton>
                {isAddingEmail && (
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
                      onClick={handleSaveEmail}
                      sx={{ color: "#4caf50" }}
                    >
                      <CheckCircle fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => {
                        setIsAddingEmail(false);
                        setNewEmail("");
                      }}
                    >
                      <Cancel fontSize="small" />
                    </IconButton>
                  </Box>
                )}
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
              {revealError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {revealError}
                </Alert>
              )}

              <Button
                variant="contained"
                fullWidth
                onClick={handleRevealProperties}
                disabled={
                  isRevealingProperties || !data.cpf || !acquisitionProcessId
                }
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
                {isRevealingProperties ? (
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
                        Busca automática pelo CPF
                      </Typography>
                    </Box>
                  </>
                )}
              </Button>

              {/* List of Revealed Properties */}
              {isLoadingRevealedProperties ? (
                <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : revealedProperties.length > 0 ? (
                <Box
                  sx={{
                    mt: 2,
                    display: "flex",
                    flexDirection: "column",
                    gap: 1,
                  }}
                >
                  {revealedProperties.map((property) => (
                    <Paper
                      key={property.id}
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
                          {property.address}
                        </Typography>
                        {property.complement && (
                          <Typography
                            variant="caption"
                            sx={{
                              fontSize: "0.75rem",
                              color: theme.palette.text.secondary,
                              display: "block",
                              mb: 0.25,
                            }}
                          >
                            {property.complement}
                          </Typography>
                        )}
                        {property.neighborhood && (
                          <Typography
                            variant="caption"
                            sx={{
                              fontSize: "0.75rem",
                              color: theme.palette.text.secondary,
                              display: "block",
                              mb: 0.25,
                            }}
                          >
                            {property.neighborhood}
                          </Typography>
                        )}
                        {(property.city || property.state) && (
                          <Typography
                            variant="caption"
                            sx={{
                              fontSize: "0.75rem",
                              color: theme.palette.text.secondary,
                              display: "block",
                              mb: 0.25,
                            }}
                          >
                            {[property.city, property.state]
                              .filter(Boolean)
                              .join(" - ")}
                          </Typography>
                        )}
                        {property.postalCode && (
                          <Typography
                            variant="caption"
                            sx={{
                              fontSize: "0.75rem",
                              color: theme.palette.text.secondary,
                            }}
                          >
                            {property.postalCode}
                          </Typography>
                        )}
                        <Chip
                          label={
                            property.selectedRelation === "owner"
                              ? "Proprietário"
                              : property.selectedRelation === "tenant"
                              ? "Inquilino"
                              : property.selectedRelation === "administrator"
                              ? "Administrador"
                              : property.selectedRelation === "other"
                              ? "Outro"
                              : property.selectedRelation === "resident"
                              ? "Residente"
                              : property.selectedRelation
                          }
                          size="small"
                          sx={{
                            mt: 0.5,
                            fontSize: "0.7rem",
                            height: 20,
                            backgroundColor:
                              property.selectedRelation === "owner"
                                ? theme.palette.success.light
                                : property.selectedRelation === "tenant"
                                ? theme.palette.warning.light
                                : property.selectedRelation === "administrator"
                                ? theme.palette.info.light
                                : property.selectedRelation === "other"
                                ? theme.palette.grey[300]
                                : theme.palette.info.light,
                            color:
                              property.selectedRelation === "owner"
                                ? theme.palette.success.dark
                                : property.selectedRelation === "tenant"
                                ? theme.palette.warning.dark
                                : property.selectedRelation === "administrator"
                                ? theme.palette.info.dark
                                : property.selectedRelation === "other"
                                ? theme.palette.grey[700]
                                : theme.palette.info.dark,
                          }}
                        />
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
                            value={property.selectedRelation || "owner"}
                            displayEmpty
                            onChange={(e) =>
                              handleUpdateSelectedRelation(
                                property.id,
                                e.target.value
                              )
                            }
                            sx={{
                              borderRadius: 1,
                              fontSize: "0.75rem",
                            }}
                          >
                            <MenuItem value="owner">Proprietário</MenuItem>
                            <MenuItem value="tenant">Inquilino</MenuItem>
                            <MenuItem value="administrator">
                              Administrador
                            </MenuItem>
                            <MenuItem value="other">Outro</MenuItem>
                          </Select>
                        </FormControl>
                        <Button
                          size="small"
                          variant="contained"
                          disabled={property.captureCreated}
                          sx={{
                            backgroundColor: "#1976d2",
                            color: theme.palette.common.white,
                            textTransform: "none",
                            fontSize: "0.75rem",
                            px: 2,
                            "&:hover": {
                              backgroundColor: "#1565c0",
                            },
                            "&:disabled": {
                              backgroundColor:
                                theme.palette.action.disabledBackground,
                              color: theme.palette.action.disabled,
                            },
                          }}
                        >
                          {property.captureCreated
                            ? "Captação criada"
                            : "Criar captação"}
                        </Button>
                      </Box>
                    </Paper>
                  ))}
                </Box>
              ) : null}
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
                onClick={() => setIsCreateContactModalOpen(true)}
                disabled={!acquisitionProcessId}
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
              {isLoadingContacts ? (
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
              ) : !Array.isArray(contacts) || contacts.length === 0 ? (
                <Box
                  sx={{
                    textAlign: "center",
                    py: 4,
                    color: theme.palette.text.secondary,
                  }}
                >
                  <Typography variant="body2">
                    Nenhum contato cadastrado ainda.
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {(Array.isArray(contacts) ? contacts : []).map((contact) => (
                    <Paper
                      key={contact.id}
                      elevation={0}
                      sx={{
                        backgroundColor: "#f5f5f5",
                        borderRadius: 3,
                        p: 2,
                        position: "relative",
                      }}
                    >
                      {/* Name */}
                      <Typography
                        variant="body1"
                        sx={{
                          fontWeight: 600,
                          fontSize: "0.875rem",
                          mb: 0.5,
                        }}
                      >
                        {contact.name}
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
                        {formatCPF(contact.cpf)} - Relacionamento:{" "}
                        {formatRelationship(contact.relationship)}
                      </Typography>

                      {/* Email and Phone Box */}
                      <Box
                        sx={{
                          display: "flex",
                          gap: 1,
                          flexWrap: "wrap",
                        }}
                      >
                        {/* Renderizar emails (array ou string) */}
                        {contact.emails && contact.emails.length > 0
                          ? contact.emails.map((email, index) => (
                              <Button
                                key={`email-${index}`}
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
                                E-mail: {email}
                              </Button>
                            ))
                          : contact.email && (
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
                                E-mail: {contact.email}
                              </Button>
                            )}
                        {/* Renderizar phones (array ou string) */}
                        {contact.phones && contact.phones.length > 0
                          ? contact.phones.map((phone, index) => (
                              <Button
                                key={`phone-${index}`}
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
                                Telefone: {phone}
                              </Button>
                            ))
                          : contact.phone && (
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
                                Telefone: {contact.phone}
                              </Button>
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
                data.name ||
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
                data.name ||
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

      {/* Modal de Criar Contato */}
      {acquisitionProcessId && (
        <CreateContactModal
          open={isCreateContactModalOpen}
          onClose={() => setIsCreateContactModalOpen(false)}
          acquisitionProcessId={acquisitionProcessId}
          onContactCreated={handleContactCreated}
        />
      )}
    </Dialog>
  );
}
