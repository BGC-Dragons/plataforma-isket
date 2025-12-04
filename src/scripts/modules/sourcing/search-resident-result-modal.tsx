import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  IconButton,
  Button,
  useTheme,
  Paper,
  Avatar,
} from "@mui/material";
import { Close, Person } from "@mui/icons-material";

export interface ResidentResult {
  id: string;
  name: string;
  cpf: string;
}

interface SearchResidentResultModalProps {
  open: boolean;
  onClose: () => void;
  onBack: () => void;
  results?: ResidentResult[];
  onCreateCapture?: (resident: ResidentResult) => void;
  onReveal?: (resident: ResidentResult) => void;
}

export function SearchResidentResultModal({
  open,
  onClose,
  onBack,
  results = [],
  onCreateCapture,
  onReveal,
}: SearchResidentResultModalProps) {
  const theme = useTheme();

  // Dados de exemplo se não houver resultados
  const displayResults =
    results.length > 0
      ? results
      : [
          { id: "1", name: "JOANA SOUZA STANSKI", cpf: "022.860.589-03" },
          { id: "2", name: "JOANA SOUZA STANSKI", cpf: "022.860.589-03" },
          { id: "3", name: "JOANA SOUZA STANSKI", cpf: "022.860.589-03" },
          { id: "4", name: "JOANA SOUZA STANSKI", cpf: "022.860.589-03" },
          { id: "5", name: "JOANA SOUZA STANSKI", cpf: "022.860.589-03" },
          { id: "6", name: "JOANA SOUZA STANSKI", cpf: "022.860.589-03" },
          { id: "7", name: "JOANA SOUZA STANSKI", cpf: "022.860.589-03" },
          { id: "8", name: "JOANA SOUZA STANSKI", cpf: "022.860.589-03" },
          { id: "9", name: "JOANA SOUZA STANSKI", cpf: "022.860.589-03" },
          { id: "10", name: "JOANA SOUZA STANSKI", cpf: "022.860.589-03" },
        ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: "hidden",
          boxShadow: theme.shadows[24],
          height: "90vh",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
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
          display: "flex",
          flexDirection: "column",
          height: "100%",
          maxHeight: "100%",
          overflow: "hidden",
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
              Pesquisar moradores: resultado(s)
            </Typography>
          </Box>
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

        {/* Botão Voltar */}
        <Box sx={{ px: 3, pt: 2, pb: 1 }}>
          <Button
            onClick={onBack}
            variant="text"
            sx={{
              textTransform: "none",
              color: theme.palette.primary.main,
              p: 0,
              minWidth: "auto",
              fontSize: "0.875rem",
              backgroundColor: "transparent",
              "&:hover": {
                backgroundColor: "transparent",
                textDecoration: "underline",
                color: theme.palette.primary.dark,
              },
            }}
          >
            &lt; Voltar
          </Button>
        </Box>

        {/* Content - Grid de Cards */}
        <Box
          sx={{
            flex: 1,
            overflowY: "auto",
            p: 3,
            "&::-webkit-scrollbar": {
              width: "8px",
            },
            "&::-webkit-scrollbar-track": {
              backgroundColor: "transparent",
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: theme.palette.divider,
              borderRadius: "4px",
              "&:hover": {
                backgroundColor: theme.palette.text.secondary,
              },
            },
          }}
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
              },
              gap: 2,
            }}
          >
            {displayResults.map((resident) => (
              <Paper
                key={resident.id}
                elevation={0}
                sx={{
                  p: 2,
                  backgroundColor: theme.palette.grey[100],
                  borderRadius: 2,
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                {/* Ícone */}
                <Avatar
                  sx={{
                    width: 48,
                    height: 48,
                    backgroundColor: "#BBDEFB",
                    color: theme.palette.primary.main,
                  }}
                >
                  <Person />
                </Avatar>

                {/* Nome e CPF */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    variant="body1"
                    sx={{
                      fontWeight: 600,
                      fontSize: "0.875rem",
                      color: theme.palette.text.primary,
                      mb: 0.5,
                      textTransform: "uppercase",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {resident.name}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: "0.75rem",
                      color: theme.palette.text.secondary,
                    }}
                  >
                    {resident.cpf}
                  </Typography>
                </Box>

                {/* Botões */}
                <Box
                  sx={{
                    display: "flex",
                    gap: 1,
                    flexShrink: 0,
                  }}
                >
                  <Button
                    variant="contained"
                    onClick={() => onCreateCapture?.(resident)}
                    sx={{
                      textTransform: "none",
                      borderRadius: 1.5,
                      px: 2,
                      py: 0.75,
                      fontSize: "0.75rem",
                      backgroundColor: theme.palette.primary.main,
                      "&:hover": {
                        backgroundColor: theme.palette.primary.dark,
                      },
                    }}
                  >
                    Criar captação
                  </Button>
                  <Button
                    variant="contained"
                    onClick={() => onReveal?.(resident)}
                    sx={{
                      textTransform: "none",
                      borderRadius: 1.5,
                      px: 2,
                      py: 0.75,
                      fontSize: "0.75rem",
                      backgroundColor: theme.palette.primary.light,
                      "&:hover": {
                        backgroundColor: theme.palette.primary.main,
                      },
                    }}
                  >
                    Revelar
                  </Button>
                </Box>
              </Paper>
            ))}
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
