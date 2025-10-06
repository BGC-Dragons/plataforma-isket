import { useState, useEffect, useCallback } from "react";
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
} from "@mui/material";
import {
  Group,
  Add,
  Email,
  Phone,
  Business,
  PersonRemove,
  PersonAdd,
} from "@mui/icons-material";
import { useAuth } from "../../../../modules/access-manager/auth.hook";
import {
  getUsers,
  type IGetUsersResponseSuccess,
} from "../../../../../services/get-users.service";
import {
  patchUser,
  type IPatchUserRequest,
} from "../../../../../services/patch-user.service";
import {
  postUsersInvite,
  type IPostUsersInviteRequest,
} from "../../../../../services/post-users-invite.service";

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
  avatar?: string;
}

export function CollaboratorsSection() {
  const theme = useTheme();
  const { store } = useAuth();
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [collaboratorToToggle, setCollaboratorToToggle] =
    useState<Collaborator | null>(null);
  const [newCollaborator, setNewCollaborator] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
  });
  const [emailFilter, setEmailFilter] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Carregar colaboradores da API
  const loadCollaborators = useCallback(async () => {
    if (!store.token) {
      console.log("❌ Token não encontrado");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      console.log("🔄 Carregando colaboradores...");
      console.log("🔗 URL da API:", `https://api.skt.com/auth/users`);
      console.log("🔑 Token:", store.token ? "Presente" : "Ausente");

      const response = await getUsers(store.token);
      console.log("📊 Dados recebidos da API:", response.data);
      console.log("📊 Status da resposta:", response.status);

      const users = response.data.map(
        (user: IGetUsersResponseSuccess): Collaborator => {
          console.log("👤 Processando usuário:", user);
          const processedUser = {
            ...user,
            email: user.profile?.email || "sem email",
            phone: user.profile?.phoneNumber
              ? formatPhoneNumber(user.profile.phoneNumber)
              : "sem telefone",
            role: getRoleLabel(user.roles[0]?.role || "MEMBER"),
            avatar: user.profile?.profileImgURL,
          };
          console.log("✅ Usuário processado:", processedUser);
          return processedUser;
        }
      );

      console.log("👥 Colaboradores processados:", users);
      setCollaborators(users);
    } catch (err) {
      console.error("❌ Erro ao carregar colaboradores:", err);
      setError("Erro ao carregar colaboradores. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }, [store.token]);

  useEffect(() => {
    loadCollaborators();
  }, [loadCollaborators]);

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

      // Recarregar lista após 2 segundos
      setTimeout(() => {
        loadCollaborators();
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
        loadCollaborators();
        setSuccess(null);
      }, 1000);
    } catch (err) {
      setError("Erro ao atualizar status do usuário. Tente novamente.");
      console.error("Erro ao atualizar usuário:", err);
    } finally {
      setIsSaving(false);
    }
  };

  // Filtrar colaboradores por email
  const filteredCollaborators = collaborators.filter((collaborator) =>
    collaborator.email.toLowerCase().includes(emailFilter.toLowerCase())
  );

  console.log("🔍 Colaboradores filtrados:", filteredCollaborators);
  console.log(
    "📊 Estado atual - isLoading:",
    isLoading,
    "collaborators:",
    collaborators.length,
    "filtered:",
    filteredCollaborators.length
  );

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
            </Box>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setIsAddModalOpen(true)}
            size="small"
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
        </Box>

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
                console.log("🎨 Renderizando colaborador:", collaborator.name);
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
                      }}
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
                    </Box>
                  </ListItem>
                );
              })}
            </List>
          </Fade>
        )}
      </Box>

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

      {/* Modal de Confirmação */}
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
    </Box>
  );
}
