import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  useTheme,
  Button,
  Avatar,
  Fade,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Tooltip,
} from "@mui/material";
import {
  Group,
  Add,
  Email,
  Phone,
  Business,
  PersonRemove,
  PersonAdd,
  Visibility,
  Delete,
  Assessment,
  Search,
  Close,
} from "@mui/icons-material";
import { useAuth } from "../../../../modules/access-manager/auth.hook";
import {
  useGetUsers,
  type IGetUsersResponseSuccess,
  clearUsersCache,
} from "../../../../../services/get-users.service";
import {
  patchUser,
  type IPatchUserRequest,
} from "../../../../../services/patch-user.service";
import {
  postUsersInvite,
  type IPostUsersInviteRequest,
} from "../../../../../services/post-users-invite.service";
import { deleteUser } from "../../../../../services/delete-user.service";
import { deleteUserInvite } from "../../../../../services/delete-user-invite.service";
import type { IGetPurchasesResponseSuccess } from "../../../../../services/get-purchases.service";
import { clearPurchasesCache } from "../../../../../services/get-purchases.service";
import {
  useGetUserInvites,
  clearUserInvitesCache,
} from "../../../../../services/get-user-invites.service";
import { UserDetailsComponent } from "./user-details.component";

interface CollaboratorsSectionProps {
  userRole: string;
  purchases: IGetPurchasesResponseSuccess[];
}

interface Collaborator {
  id: string;
  name: string;
  personalId?: string;
  inactive?: boolean;
  accountId: string;
  profile?: {
    profileImgURL?: string;
    email?: string;
    phoneNumber?: string;
    userId: string;
  };
  authMethods?: Array<{
    method: "EMAIL" | "PHONE" | "GOOGLE";
    value: string;
  }>;
  roles: Array<{
    id: string;
    role: "OWNER" | "ADMIN" | "MEMBER";
    userId: string;
  }>;
  createdAt: string;
  updatedAt: string;
  email: string;
  phone: string;
  role: string;
  rawRole: "OWNER" | "ADMIN" | "MEMBER";
  avatar?: string;
}

export function CollaboratorsSection({
  userRole,
  purchases,
}: CollaboratorsSectionProps) {
  const theme = useTheme();
  const { store } = useAuth();
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [collaboratorToToggle, setCollaboratorToToggle] =
    useState<Collaborator | null>(null);
  const [collaboratorToDelete, setCollaboratorToDelete] =
    useState<Collaborator | null>(null);
  const [inviteToDelete, setInviteToDelete] = useState<string | null>(null);
  const [isDeleteInviteModalOpen, setIsDeleteInviteModalOpen] = useState(false);
  const [newCollaborator, setNewCollaborator] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
  });
  const [emailFilter, setEmailFilter] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const isOwner = userRole === "OWNER";

  // Fetch pending invites (only for OWNER)
  const { data: invitesData } = useGetUserInvites();

  // Get remaining units from purchases
  const latestPurchase = purchases.length > 0 ? purchases[0] : null;
  const getRemaining = (unitType: string): number => {
    if (!latestPurchase) return 0;
    const unit = latestPurchase.remainingUnits?.find(
      (u) => u.type === unitType
    );
    return unit?.unitsRemaining || 0;
  };

  const valuationRemaining = getRemaining("PROPERTY_VALUATION");
  const searchRemaining = getRemaining("RESIDENT_SEARCH");
  const usersRemaining = getRemaining("USERS");

  // Contar convites pendentes (não usados e não expirados)
  const pendingInvites =
    invitesData?.filter((invite) => {
      const now = new Date();
      const expiresAt = new Date(invite.expiresAt);
      return !invite.used && expiresAt > now;
    }) || [];
  const pendingInvitesCount = pendingInvites.length;

  // Calcular vagas disponíveis considerando convites pendentes
  const availableSlots = Math.max(0, usersRemaining - pendingInvitesCount);
  const canInvite = availableSlots > 0;

  // Data via SWR
  const {
    data: usersData,
    error: usersError,
    isLoading: isLoadingSWR,
  } = useGetUsers();

  useEffect(() => {
    if (usersData) {
      const users = usersData.map(
        (user: IGetUsersResponseSuccess): Collaborator => {
          // Email: prioriza profile.email, senão pega do authMethods (EMAIL)
          const emailFromAuth = user.authMethods?.find(
            (m) => m.method === "EMAIL"
          )?.value;
          const processedUser = {
            ...user,
            email: user.profile?.email || emailFromAuth || "sem email",
            phone: user.profile?.phoneNumber
              ? formatPhoneNumber(user.profile.phoneNumber)
              : "sem telefone",
            role: getRoleLabel(user.roles[0]?.role || "MEMBER"),
            rawRole: (user.roles[0]?.role || "MEMBER") as
              | "OWNER"
              | "ADMIN"
              | "MEMBER",
            avatar: user.profile?.profileImgURL,
          };
          return processedUser;
        }
      );
      setCollaborators(users);
      setIsLoading(false);
    }
    if (usersError) {
      console.error("Erro ao carregar colaboradores:", usersError);
      setError("Erro ao carregar colaboradores. Tente novamente.");
      setIsLoading(false);
    }
    if (isLoadingSWR && !usersData) {
      setIsLoading(true);
    }
  }, [usersData, usersError, isLoadingSWR]);

  const getStatusColor = (inactive?: boolean) => {
    return inactive ? "error" : "success";
  };

  const getStatusLabel = (inactive?: boolean) => {
    return inactive ? "Inativo" : "Ativo";
  };

  const formatPhoneNumber = (phone: string): string => {
    if (!phone) return "";

    // Remove todos os caracteres não numéricos
    const cleaned = phone.replace(/\D/g, "");

    // Se começar com 55 (código do Brasil), remove
    let phoneNumber = cleaned;
    if (cleaned.startsWith("55") && cleaned.length > 10) {
      phoneNumber = cleaned.substring(2);
    }

    // Aplica a máscara baseada no tamanho
    if (phoneNumber.length === 11) {
      return phoneNumber.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    } else if (phoneNumber.length === 10) {
      return phoneNumber.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
    }

    // Se não conseguir formatar, retorna o número original
    return phone;
  };

  const getRoleLabel = (role: string): string => {
    switch (role) {
      case "OWNER":
        return "Dono da conta";
      case "ADMIN":
        return "Administrador";
      case "MEMBER":
        return "Membro";
      default:
        return role;
    }
  };

  const handleAddCollaborator = async () => {
    if (!store.token || !newCollaborator.email) return;

    if (!canInvite) {
      setError(
        "Não há vagas disponíveis para novos colaboradores. Exclua um colaborador existente ou adquira mais vagas."
      );
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      const inviteData: IPostUsersInviteRequest = {
        emails: [newCollaborator.email],
      };

      await postUsersInvite(store.token, inviteData);

      setSuccess("Convite enviado com sucesso!");
      setNewCollaborator({ name: "", email: "", phone: "", role: "" });
      setIsAddModalOpen(false);

      // Recarregar listas após 2 segundos
      setTimeout(() => {
        clearUsersCache();
        clearUserInvitesCache();
        setSuccess(null);
      }, 2000);
    } catch (err) {
      setError("Erro ao enviar convite. Tente novamente.");
      console.error("Erro ao enviar convite:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = (collaborator: Collaborator) => {
    setCollaboratorToToggle(collaborator);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmToggle = async () => {
    if (!store.token || !collaboratorToToggle) return;

    try {
      setIsSaving(true);
      setError(null);

      const updateData: IPatchUserRequest = {
        inactive: !collaboratorToToggle.inactive,
      };

      await patchUser(store.token, collaboratorToToggle.id, updateData);

      setSuccess(
        `Usuário ${
          collaboratorToToggle.inactive ? "ativado" : "inativado"
        } com sucesso!`
      );
      setIsConfirmModalOpen(false);
      setCollaboratorToToggle(null);

      // Recarregar lista após 1 segundo
      setTimeout(() => {
        clearUsersCache();
        setSuccess(null);
      }, 1000);
    } catch (err) {
      setError("Erro ao atualizar status do usuário. Tente novamente.");
      console.error("Erro ao atualizar usuário:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteUser = (collaborator: Collaborator) => {
    setCollaboratorToDelete(collaborator);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!store.token || !collaboratorToDelete) return;

    try {
      setIsSaving(true);
      setError(null);

      await deleteUser(store.token, collaboratorToDelete.id);

      setSuccess(
        `Usuário ${collaboratorToDelete.name} removido permanentemente. Uma vaga foi liberada.`
      );
      setIsDeleteModalOpen(false);
      setCollaboratorToDelete(null);

      setTimeout(() => {
        clearUsersCache();
        clearPurchasesCache(); // Atualizar créditos após exclusão
        setSuccess(null);
      }, 1000);
    } catch (err) {
      setError("Erro ao remover usuário. Tente novamente.");
      console.error("Erro ao remover usuário:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteInvite = (inviteId: string) => {
    setInviteToDelete(inviteId);
    setIsDeleteInviteModalOpen(true);
  };

  const handleConfirmDeleteInvite = async () => {
    if (!store.token || !inviteToDelete) return;

    try {
      setIsSaving(true);
      setError(null);

      await deleteUserInvite(store.token, inviteToDelete);

      setSuccess("Convite excluído com sucesso!");
      setIsDeleteInviteModalOpen(false);
      setInviteToDelete(null);

      setTimeout(() => {
        clearUserInvitesCache();
        setSuccess(null);
      }, 1000);
    } catch (err) {
      setError("Erro ao excluir convite. Tente novamente.");
      console.error("Erro ao excluir convite:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleViewUserDetails = (userId: string) => {
    setSelectedUserId(userId);
  };

  const handleBackFromDetails = () => {
    setSelectedUserId(null);
  };

  // Filtrar colaboradores por email
  const filteredCollaborators = collaborators.filter((collaborator) =>
    collaborator.email.toLowerCase().includes(emailFilter.toLowerCase())
  );

  // Se um usuário foi selecionado, mostrar tela de detalhes
  if (selectedUserId) {
    return (
      <UserDetailsComponent
        userId={selectedUserId}
        onBack={handleBackFromDetails}
        userRole={userRole}
      />
    );
  }

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: "100%",
        pt: { xs: 1, sm: 2 },
        pb: { xs: 2, sm: 4 },
        px: { xs: 1, sm: 2 },
        mb: { xs: 5, md: 0 },
      }}
    >
      <Typography
        variant="h5"
        gutterBottom
        sx={{
          color: theme.palette.primary.main,
          mb: { xs: 2, sm: 3 },
          fontSize: { xs: "1.25rem", sm: "1.5rem" },
        }}
      >
        Colaboradores
      </Typography>

      <Box
        sx={{
          p: { xs: 1.5, sm: 3 },
          borderRadius: 2,
          backgroundColor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: { xs: "flex-start", sm: "center" },
            mb: { xs: 2, sm: 3 },
            flexDirection: { xs: "column", sm: "row" },
            gap: { xs: 2, sm: 0 },
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              flex: 1,
              width: { xs: "100%", sm: "auto" },
            }}
          >
            <Avatar
              sx={{
                bgcolor: theme.palette.primary.main,
                mr: 1.5,
                width: { xs: 36, sm: 40 },
                height: { xs: 36, sm: 40 },
              }}
            >
              <Group />
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 600,
                  color: theme.palette.text.primary,
                  mb: 0.5,
                  fontSize: { xs: "0.875rem", sm: "0.875rem" },
                }}
              >
                Equipe
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  fontSize: { xs: "0.75rem", sm: "0.75rem" },
                  display: { xs: "none", sm: "block" },
                }}
              >
                Gerencie os colaboradores da sua empresa
              </Typography>
              {!isLoading && (
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: { xs: "0.7rem", sm: "0.75rem" },
                    color: theme.palette.primary.main,
                    fontWeight: 500,
                    display: "block",
                    mt: 0.5,
                  }}
                >
                  {collaborators.filter((c) => !c.inactive).length} ativas de{" "}
                  {collaborators.length} vinculadas
                </Typography>
              )}
            </Box>
          </Box>
          <Tooltip
            title={
              !canInvite
                ? "Não há vagas disponíveis. Exclua um colaborador ou adquira mais vagas."
                : ""
            }
            arrow
          >
            <span>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setIsAddModalOpen(true)}
                size="small"
                disabled={!canInvite}
                sx={{
                  textTransform: "none",
                  borderRadius: 1.5,
                  width: { xs: "100%", sm: "auto" },
                  fontSize: { xs: "0.875rem", sm: "0.875rem" },
                  py: { xs: 1, sm: 0.5 },
                }}
              >
                Convidar
              </Button>
            </span>
          </Tooltip>
        </Box>

        {/* Estatísticas de uso da conta (apenas para OWNER) */}
        {isOwner && latestPurchase && (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "1fr 1fr 1fr",
              },
              gap: 2,
              mb: { xs: 2, sm: 3 },
            }}
          >
            {/* Avaliações */}
            <Box
              sx={{
                p: 2,
                borderRadius: 1.5,
                border: `1px solid ${theme.palette.divider}`,
                backgroundColor: theme.palette.background.default,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  mb: 0.5,
                }}
              >
                <Assessment
                  sx={{ fontSize: 18, color: theme.palette.primary.main }}
                />
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 600, color: theme.palette.text.primary }}
                >
                  Avaliações
                </Typography>
              </Box>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  color: theme.palette.primary.main,
                }}
              >
                {valuationRemaining}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                restantes
              </Typography>
            </Box>

            {/* Buscas de Moradores */}
            <Box
              sx={{
                p: 2,
                borderRadius: 1.5,
                border: `1px solid ${theme.palette.divider}`,
                backgroundColor: theme.palette.background.default,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  mb: 0.5,
                }}
              >
                <Search
                  sx={{ fontSize: 18, color: theme.palette.primary.main }}
                />
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 600, color: theme.palette.text.primary }}
                >
                  Buscas de Moradores
                </Typography>
              </Box>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  color: theme.palette.primary.main,
                }}
              >
                {searchRemaining}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                restantes
              </Typography>
            </Box>

            {/* Vagas de Colaboradores */}
            <Box
              sx={{
                p: 2,
                borderRadius: 1.5,
                border: `1px solid ${theme.palette.divider}`,
                backgroundColor: theme.palette.background.default,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  mb: 0.5,
                }}
              >
                <Group
                  sx={{ fontSize: 18, color: theme.palette.primary.main }}
                />
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 600, color: theme.palette.text.primary }}
                >
                  Colaboradores
                </Typography>
              </Box>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  color: availableSlots > 0 ? theme.palette.primary.main : theme.palette.error.main,
                }}
              >
                {availableSlots}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                vagas disponíveis
                {pendingInvitesCount > 0 && (
                  <Typography
                    component="span"
                    variant="caption"
                    sx={{ display: "block", color: theme.palette.warning.main }}
                  >
                    ({pendingInvitesCount} convite{pendingInvitesCount > 1 ? "s" : ""} pendente{pendingInvitesCount > 1 ? "s" : ""})
                  </Typography>
                )}
              </Typography>
            </Box>
          </Box>
        )}

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

        {/* Campo de filtro por email */}
        <TextField
          fullWidth
          placeholder="Filtrar emails..."
          value={emailFilter}
          onChange={(e) => setEmailFilter(e.target.value)}
          sx={{
            mb: { xs: 2, sm: 3 },
            "& .MuiInputBase-root": {
              fontSize: { xs: "0.875rem", sm: "1rem" },
            },
          }}
          InputProps={{
            startAdornment: (
              <Box sx={{ display: "flex", alignItems: "center", mr: 1 }}>
                <Email
                  sx={{ fontSize: { xs: 18, sm: 20 }, color: "text.secondary" }}
                />
              </Box>
            ),
          }}
        />

        {isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        ) : filteredCollaborators.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              {collaborators.length === 0
                ? "Nenhum colaborador encontrado. Clique em 'Convidar' para adicionar colaboradores."
                : "Nenhum colaborador corresponde ao filtro de email."}
            </Typography>
          </Box>
        ) : (
          <Fade in timeout={300}>
            <List dense>
              {filteredCollaborators.map((collaborator) => {
                const isCollaboratorOwner = collaborator.rawRole === "OWNER";
                return (
                  <ListItem
                    key={collaborator.id}
                    sx={{
                      py: { xs: 1, sm: 1.5 },
                      px: { xs: 1, sm: 1.5 },
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 1,
                      mb: { xs: 0.75, sm: 1 },
                      backgroundColor: theme.palette.background.default,
                      flexDirection: { xs: "column", sm: "row" },
                      alignItems: { xs: "flex-start", sm: "center" },
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        width: { xs: "100%", sm: "auto" },
                        mb: { xs: 1, sm: 0 },
                      }}
                    >
                      <Avatar
                        src={collaborator.avatar}
                        sx={{
                          mr: { xs: 1.5, sm: 2 },
                          bgcolor: theme.palette.primary.main,
                          width: { xs: 36, sm: 40 },
                          height: { xs: 36, sm: 40 },
                        }}
                      >
                        {collaborator.name.charAt(0).toUpperCase()}
                      </Avatar>
                      <ListItemText
                        primary={
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              mb: 0.5,
                              flexWrap: "wrap",
                            }}
                          >
                            <Typography
                              variant="body1"
                              sx={{
                                fontWeight: 600,
                                fontSize: { xs: "0.875rem", sm: "1rem" },
                                lineHeight: 1.2,
                              }}
                            >
                              {collaborator.name}
                            </Typography>
                            <Chip
                              label={getStatusLabel(collaborator.inactive)}
                              color={
                                getStatusColor(collaborator.inactive) as
                                  | "success"
                                  | "error"
                                  | "warning"
                                  | "default"
                              }
                              size="small"
                              sx={{
                                fontSize: { xs: "0.65rem", sm: "0.7rem" },
                                height: { xs: 18, sm: 20 },
                                "& .MuiChip-label": {
                                  px: { xs: 0.5, sm: 1 },
                                },
                              }}
                            />
                          </Box>
                        }
                        secondary={
                          <Box
                            sx={{
                              display: { xs: "grid", sm: "block" },
                              gridTemplateColumns: {
                                xs: "1fr 1fr",
                                sm: "none",
                              },
                              gap: { xs: 0.5, sm: 0 },
                            }}
                          >
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                mb: { xs: 0, sm: 0.5 },
                              }}
                            >
                              <Email
                                sx={{
                                  fontSize: { xs: 12, sm: 14 },
                                  color: "text.secondary",
                                }}
                              />
                              <Typography
                                variant="body2"
                                color={
                                  collaborator.email === "sem email"
                                    ? "text.disabled"
                                    : "text.secondary"
                                }
                                sx={{
                                  fontStyle:
                                    collaborator.email === "sem email"
                                      ? "italic"
                                      : "normal",
                                  fontSize: { xs: "0.75rem", sm: "0.875rem" },
                                }}
                              >
                                {collaborator.email}
                              </Typography>
                            </Box>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                mb: { xs: 0, sm: 0.5 },
                              }}
                            >
                              <Phone
                                sx={{
                                  fontSize: { xs: 12, sm: 14 },
                                  color: "text.secondary",
                                }}
                              />
                              <Typography
                                variant="body2"
                                color={
                                  collaborator.phone === "sem telefone"
                                    ? "text.disabled"
                                    : "text.secondary"
                                }
                                sx={{
                                  fontStyle:
                                    collaborator.phone === "sem telefone"
                                      ? "italic"
                                      : "normal",
                                  fontSize: { xs: "0.75rem", sm: "0.875rem" },
                                }}
                              >
                                {collaborator.phone}
                              </Typography>
                            </Box>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                gridColumn: { xs: "1 / -1", sm: "auto" },
                              }}
                            >
                              <Business
                                sx={{
                                  fontSize: { xs: 12, sm: 14 },
                                  color: "text.secondary",
                                }}
                              />
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{
                                  fontSize: { xs: "0.75rem", sm: "0.875rem" },
                                }}
                              >
                                {collaborator.role}
                              </Typography>
                            </Box>
                          </Box>
                        }
                      />
                    </Box>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: { xs: "flex-end", sm: "flex-end" },
                        mt: { xs: 1, sm: 0 },
                        width: { xs: "100%", sm: "auto" },
                        ml: { xs: 0, sm: "auto" },
                        gap: 0.5,
                      }}
                    >
                      <Tooltip title="Ver detalhes" arrow>
                        <IconButton
                          edge="end"
                          aria-label="visualizar detalhes"
                          size="small"
                          onClick={() => handleViewUserDetails(collaborator.id)}
                          color="primary"
                          sx={{
                            p: { xs: 1, sm: 0.5 },
                          }}
                        >
                          <Visibility sx={{ fontSize: { xs: 18, sm: 16 } }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip
                        title={collaborator.inactive ? "Ativar usuário" : "Inativar usuário"}
                        arrow
                      >
                        <IconButton
                          edge="end"
                          aria-label={
                            collaborator.inactive ? "ativar" : "inativar"
                          }
                          size="small"
                          onClick={() => handleToggleStatus(collaborator)}
                          color={collaborator.inactive ? "success" : "error"}
                          sx={{
                            p: { xs: 1, sm: 0.5 },
                          }}
                        >
                          {collaborator.inactive ? (
                            <PersonAdd sx={{ fontSize: { xs: 18, sm: 16 } }} />
                          ) : (
                            <PersonRemove sx={{ fontSize: { xs: 18, sm: 16 } }} />
                          )}
                        </IconButton>
                      </Tooltip>
                      {isOwner && !isCollaboratorOwner && (
                        <Tooltip title="Remover usuário" arrow>
                          <IconButton
                            edge="end"
                            aria-label="remover usuário"
                            size="small"
                            onClick={() => handleDeleteUser(collaborator)}
                            color="error"
                            sx={{
                              p: { xs: 1, sm: 0.5 },
                            }}
                          >
                            <Delete sx={{ fontSize: { xs: 18, sm: 16 } }} />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </ListItem>
                );
              })}
            </List>
          </Fade>
        )}
      </Box>

      {/* Convites Pendentes (apenas para OWNER) */}
      {isOwner && invitesData && invitesData.length > 0 && (
        <Box
          sx={{
            mt: { xs: 2, sm: 3 },
            p: { xs: 1.5, sm: 3 },
            borderRadius: 2,
            backgroundColor: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <Email sx={{ fontSize: 20, color: theme.palette.primary.main }} />
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 600, color: theme.palette.text.primary }}
            >
              Convites Enviados
            </Typography>
          </Box>

          <List dense>
            {invitesData.map((invite) => {
              const now = new Date();
              const expiresAt = new Date(invite.expiresAt);
              const createdAt = new Date(invite.createdAt);
              let status: "Aceito" | "Expirado" | "Pendente";
              let statusColor: "success" | "error" | "warning";

              if (invite.used) {
                status = "Aceito";
                statusColor = "success";
              } else if (expiresAt < now) {
                status = "Expirado";
                statusColor = "error";
              } else {
                status = "Pendente";
                statusColor = "warning";
              }

              return (
                <ListItem
                  key={invite.id}
                  sx={{
                    py: 1,
                    px: { xs: 1, sm: 1.5 },
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 1,
                    mb: 0.75,
                    backgroundColor: theme.palette.background.default,
                  }}
                >
                  <ListItemText
                    primary={
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          flexWrap: "wrap",
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 500,
                            fontSize: { xs: "0.8rem", sm: "0.875rem" },
                          }}
                        >
                          {invite.email}
                        </Typography>
                        <Chip
                          label={status}
                          color={statusColor}
                          size="small"
                          sx={{
                            fontSize: { xs: "0.65rem", sm: "0.7rem" },
                            height: { xs: 18, sm: 20 },
                          }}
                        />
                      </Box>
                    }
                    secondary={
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontSize: { xs: "0.7rem", sm: "0.75rem" } }}
                      >
                        Enviado em{" "}
                        {createdAt.toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </Typography>
                    }
                  />
                  {status === "Pendente" && (
                    <Tooltip title="Cancelar convite" arrow>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteInvite(invite.id)}
                        color="error"
                        sx={{ ml: "auto" }}
                      >
                        <Close sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                  )}
                </ListItem>
              );
            })}
          </List>
        </Box>
      )}

      {/* Modal Adicionar Colaborador */}
      <Dialog
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Convidar Colaborador</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Envie um convite por email para que o colaborador se junte à sua
            empresa.
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Email do colaborador"
            type="email"
            fullWidth
            variant="outlined"
            value={newCollaborator.email}
            onChange={(e) =>
              setNewCollaborator({ ...newCollaborator, email: e.target.value })
            }
            placeholder="exemplo@empresa.com"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsAddModalOpen(false)} disabled={isSaving}>
            Cancelar
          </Button>
          <Button
            onClick={handleAddCollaborator}
            variant="contained"
            disabled={!newCollaborator.email || isSaving}
          >
            {isSaving ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <CircularProgress size={16} />
                Enviando...
              </Box>
            ) : (
              "Enviar Convite"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Confirmação de Status */}
      <Dialog
        open={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {collaboratorToToggle?.inactive
            ? "Ativar Colaborador"
            : "Inativar Colaborador"}
        </DialogTitle>
        <DialogContent>
          <Typography>
            {collaboratorToToggle?.inactive
              ? `Tem certeza que deseja ativar ${collaboratorToToggle?.name}?`
              : `Tem certeza que deseja inativar ${collaboratorToToggle?.name}?`}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setIsConfirmModalOpen(false)}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmToggle}
            variant="contained"
            color={collaboratorToToggle?.inactive ? "success" : "error"}
            disabled={isSaving}
          >
            {isSaving ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <CircularProgress size={16} />
                {collaboratorToToggle?.inactive
                  ? "Ativando..."
                  : "Inativando..."}
              </Box>
            ) : collaboratorToToggle?.inactive ? (
              "Ativar"
            ) : (
              "Inativar"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Confirmação de Exclusão */}
      <Dialog
        open={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ color: theme.palette.error.main }}>
          Remover Colaborador
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Esta ação é permanente e não pode ser desfeita.
          </Alert>
          <Typography>
            Tem certeza que deseja remover permanentemente{" "}
            <strong>{collaboratorToDelete?.name}</strong> da empresa?
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 1 }}
          >
            O usuário perderá todo o acesso à plataforma e seus dados serão
            removidos.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setIsDeleteModalOpen(false)}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmDelete}
            variant="contained"
            color="error"
            disabled={isSaving}
          >
            {isSaving ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <CircularProgress size={16} />
                Removendo...
              </Box>
            ) : (
              "Remover Permanentemente"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Confirmação de Exclusão de Convite */}
      <Dialog
        open={isDeleteInviteModalOpen}
        onClose={() => setIsDeleteInviteModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Cancelar Convite</DialogTitle>
        <DialogContent>
          <Typography>
            Tem certeza que deseja cancelar este convite? O destinatário não
            poderá mais usar o link recebido.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setIsDeleteInviteModalOpen(false)}
            disabled={isSaving}
          >
            Voltar
          </Button>
          <Button
            onClick={handleConfirmDeleteInvite}
            variant="contained"
            color="error"
            disabled={isSaving}
          >
            {isSaving ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <CircularProgress size={16} />
                Cancelando...
              </Box>
            ) : (
              "Cancelar Convite"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
