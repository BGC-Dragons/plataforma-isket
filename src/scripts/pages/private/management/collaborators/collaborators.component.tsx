import { useState } from "react";
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
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
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

interface Collaborator {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: "active" | "inactive" | "pending";
  avatar?: string;
}

export function CollaboratorsSection() {
  const theme = useTheme();
  const [collaborators, setCollaborators] = useState<Collaborator[]>([
    {
      id: "1",
      name: "João Silva",
      email: "joao@empresa.com",
      phone: "(11) 99999-9999",
      role: "Gerente",
      status: "active",
    },
    {
      id: "2",
      name: "Maria Santos",
      email: "maria@empresa.com",
      phone: "(11) 88888-8888",
      role: "Analista",
      status: "active",
    },
    {
      id: "3",
      name: "Pedro Costa",
      email: "pedro@empresa.com",
      phone: "(11) 77777-7777",
      role: "Desenvolvedor",
      status: "pending",
    },
  ]);

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "success";
      case "inactive":
        return "error";
      case "pending":
        return "warning";
      default:
        return "default";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active":
        return "Ativo";
      case "inactive":
        return "Inativo";
      case "pending":
        return "Pendente";
      default:
        return status;
    }
  };

  const handleAddCollaborator = () => {
    if (newCollaborator.name && newCollaborator.email) {
      const collaborator: Collaborator = {
        id: Date.now().toString(),
        name: newCollaborator.name,
        email: newCollaborator.email,
        phone: newCollaborator.phone,
        role: newCollaborator.role,
        status: "pending",
      };
      setCollaborators([...collaborators, collaborator]);
      setNewCollaborator({ name: "", email: "", phone: "", role: "" });
      setIsAddModalOpen(false);
    }
  };

  const handleToggleStatus = (collaborator: Collaborator) => {
    setCollaboratorToToggle(collaborator);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmToggle = () => {
    if (collaboratorToToggle) {
      const newStatus =
        collaboratorToToggle.status === "active" ? "inactive" : "active";
      setCollaborators(
        collaborators.map((c) =>
          c.id === collaboratorToToggle.id ? { ...c, status: newStatus } : c
        )
      );
      setIsConfirmModalOpen(false);
      setCollaboratorToToggle(null);
    }
  };

  // Filtrar colaboradores por email
  const filteredCollaborators = collaborators.filter((collaborator) =>
    collaborator.email.toLowerCase().includes(emailFilter.toLowerCase())
  );

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
        Colaboradores
      </Typography>

      <Box
        sx={{
          p: { xs: 2, sm: 3 },
          borderRadius: 2,
          backgroundColor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
          <Avatar
            sx={{
              bgcolor: theme.palette.primary.main,
              mr: 1.5,
              width: 40,
              height: 40,
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
              }}
            >
              Equipe
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Gerencie os colaboradores da sua empresa
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setIsAddModalOpen(true)}
            size="small"
            sx={{
              textTransform: "none",
              borderRadius: 1.5,
            }}
          >
            Adicionar
          </Button>
        </Box>

        {/* Campo de filtro por email */}
        <TextField
          fullWidth
          placeholder="Filtrar emails..."
          value={emailFilter}
          onChange={(e) => setEmailFilter(e.target.value)}
          sx={{ mb: 3 }}
          InputProps={{
            startAdornment: (
              <Box sx={{ display: "flex", alignItems: "center", mr: 1 }}>
                <Email sx={{ fontSize: 20, color: "text.secondary" }} />
              </Box>
            ),
          }}
        />

        <Fade in timeout={300}>
          <List dense>
            {filteredCollaborators.map((collaborator) => (
              <ListItem
                key={collaborator.id}
                sx={{
                  py: 1.5,
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 1,
                  mb: 1,
                  backgroundColor: theme.palette.background.default,
                }}
              >
                <Avatar
                  sx={{
                    mr: 2,
                    bgcolor: theme.palette.primary.main,
                    width: 40,
                    height: 40,
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
                      }}
                    >
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {collaborator.name}
                      </Typography>
                      <Chip
                        label={getStatusLabel(collaborator.status)}
                        color={
                          getStatusColor(collaborator.status) as
                            | "success"
                            | "error"
                            | "warning"
                            | "default"
                        }
                        size="small"
                        sx={{ fontSize: "0.7rem", height: 20 }}
                      />
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          mb: 0.5,
                        }}
                      >
                        <Email sx={{ fontSize: 14, color: "text.secondary" }} />
                        <Typography variant="body2" color="text.secondary">
                          {collaborator.email}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          mb: 0.5,
                        }}
                      >
                        <Phone sx={{ fontSize: 14, color: "text.secondary" }} />
                        <Typography variant="body2" color="text.secondary">
                          {collaborator.phone}
                        </Typography>
                      </Box>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Business
                          sx={{ fontSize: 14, color: "text.secondary" }}
                        />
                        <Typography variant="body2" color="text.secondary">
                          {collaborator.role}
                        </Typography>
                      </Box>
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    aria-label={
                      collaborator.status === "active" ? "inativar" : "ativar"
                    }
                    size="small"
                    onClick={() => handleToggleStatus(collaborator)}
                    color={
                      collaborator.status === "active" ? "error" : "success"
                    }
                  >
                    {collaborator.status === "active" ? (
                      <PersonRemove sx={{ fontSize: 16 }} />
                    ) : (
                      <PersonAdd sx={{ fontSize: 16 }} />
                    )}
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </Fade>
      </Box>

      {/* Modal Adicionar Colaborador */}
      <Dialog
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Adicionar Colaborador</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Nome"
            fullWidth
            variant="outlined"
            value={newCollaborator.name}
            onChange={(e) =>
              setNewCollaborator({ ...newCollaborator, name: e.target.value })
            }
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Email"
            type="email"
            fullWidth
            variant="outlined"
            value={newCollaborator.email}
            onChange={(e) =>
              setNewCollaborator({ ...newCollaborator, email: e.target.value })
            }
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Telefone"
            fullWidth
            variant="outlined"
            value={newCollaborator.phone}
            onChange={(e) =>
              setNewCollaborator({ ...newCollaborator, phone: e.target.value })
            }
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Cargo"
            fullWidth
            variant="outlined"
            value={newCollaborator.role}
            onChange={(e) =>
              setNewCollaborator({ ...newCollaborator, role: e.target.value })
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsAddModalOpen(false)}>Cancelar</Button>
          <Button onClick={handleAddCollaborator} variant="contained">
            Adicionar
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
          {collaboratorToToggle?.status === "active"
            ? "Inativar Colaborador"
            : "Ativar Colaborador"}
        </DialogTitle>
        <DialogContent>
          <Typography>
            {collaboratorToToggle?.status === "active"
              ? `Tem certeza que deseja inativar ${collaboratorToToggle?.name}?`
              : `Tem certeza que deseja ativar ${collaboratorToToggle?.name}?`}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsConfirmModalOpen(false)}>Cancelar</Button>
          <Button
            onClick={handleConfirmToggle}
            variant="contained"
            color={
              collaboratorToToggle?.status === "active" ? "error" : "success"
            }
          >
            {collaboratorToToggle?.status === "active" ? "Inativar" : "Ativar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
