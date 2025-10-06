import { useState } from "react";
import {
  Box,
  Typography,
  useTheme,
  Card,
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
  Alert,
} from "@mui/material";
import {
  Group,
  Add,
  Edit,
  Delete,
  Email,
  Phone,
  Person,
  Business,
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
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCollaborator, setEditingCollaborator] =
    useState<Collaborator | null>(null);
  const [newCollaborator, setNewCollaborator] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
  });

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

  const handleEditCollaborator = (collaborator: Collaborator) => {
    setEditingCollaborator(collaborator);
    setIsEditModalOpen(true);
  };

  const handleDeleteCollaborator = (id: string) => {
    setCollaborators(collaborators.filter((c) => c.id !== id));
  };

  const handleSaveEdit = () => {
    if (editingCollaborator) {
      setCollaborators(
        collaborators.map((c) =>
          c.id === editingCollaborator.id ? editingCollaborator : c
        )
      );
      setIsEditModalOpen(false);
      setEditingCollaborator(null);
    }
  };

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
        <Card
          sx={{
            p: 2.5,
            height: "100%",
            border: `2px solid ${theme.palette.primary.main}20`,
            backgroundColor: `${theme.palette.primary.main}05`,
            transition: "all 0.3s ease",
            "&:hover": {
              transform: "translateY(-2px)",
              boxShadow: theme.shadows[4],
              borderColor: theme.palette.primary.main,
            },
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

          <Fade in timeout={300}>
            <List dense>
              {collaborators.map((collaborator) => (
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
                          color={getStatusColor(collaborator.status) as any}
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
                          <Email
                            sx={{ fontSize: 14, color: "text.secondary" }}
                          />
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
                          <Phone
                            sx={{ fontSize: 14, color: "text.secondary" }}
                          />
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
                      aria-label="edit"
                      size="small"
                      onClick={() => handleEditCollaborator(collaborator)}
                      sx={{ mr: 1 }}
                    >
                      <Edit sx={{ fontSize: 16 }} />
                    </IconButton>
                    <IconButton
                      edge="end"
                      aria-label="delete"
                      size="small"
                      onClick={() => handleDeleteCollaborator(collaborator.id)}
                    >
                      <Delete sx={{ fontSize: 16 }} />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </Fade>
        </Card>
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

      {/* Modal Editar Colaborador */}
      <Dialog
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Editar Colaborador</DialogTitle>
        <DialogContent>
          {editingCollaborator && (
            <>
              <TextField
                autoFocus
                margin="dense"
                label="Nome"
                fullWidth
                variant="outlined"
                value={editingCollaborator.name}
                onChange={(e) =>
                  setEditingCollaborator({
                    ...editingCollaborator,
                    name: e.target.value,
                  })
                }
                sx={{ mb: 2 }}
              />
              <TextField
                margin="dense"
                label="Email"
                type="email"
                fullWidth
                variant="outlined"
                value={editingCollaborator.email}
                onChange={(e) =>
                  setEditingCollaborator({
                    ...editingCollaborator,
                    email: e.target.value,
                  })
                }
                sx={{ mb: 2 }}
              />
              <TextField
                margin="dense"
                label="Telefone"
                fullWidth
                variant="outlined"
                value={editingCollaborator.phone}
                onChange={(e) =>
                  setEditingCollaborator({
                    ...editingCollaborator,
                    phone: e.target.value,
                  })
                }
                sx={{ mb: 2 }}
              />
              <TextField
                margin="dense"
                label="Cargo"
                fullWidth
                variant="outlined"
                value={editingCollaborator.role}
                onChange={(e) =>
                  setEditingCollaborator({
                    ...editingCollaborator,
                    role: e.target.value,
                  })
                }
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsEditModalOpen(false)}>Cancelar</Button>
          <Button onClick={handleSaveEdit} variant="contained">
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
