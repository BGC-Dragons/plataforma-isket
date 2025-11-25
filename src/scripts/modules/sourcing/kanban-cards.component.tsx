import { Box, Typography, IconButton, Chip, useTheme } from "@mui/material";
import {
  Delete,
  Home,
  Person,
  TrendingUp,
  LocationOn,
} from "@mui/icons-material";
import type { ColumnId } from "./kanban.component";

export type CardType = "property" | "contact";

export interface KanbanCardData {
  id: string;
  type: CardType;
  title: string;
  subtitle?: string;
  contact?: string;
  address?: string;
}

interface KanbanCardProps {
  card: KanbanCardData;
  columnId?: ColumnId;
  onDelete?: (id: string) => void;
}

export function KanbanCard({ card, columnId, onDelete }: KanbanCardProps) {
  const theme = useTheme();

  const getCardIcon = () => {
    // Usa o tipo do card para determinar o ícone
    if (card.type === "property") {
      return <Home sx={{ fontSize: 100 }} />;
    } else {
      return <Person sx={{ fontSize: 100 }} />;
    }
  };

  const getCardColor = () => {
    // Usa o tipo do card para determinar a cor
    if (card.type === "property") {
      return "#C8E6C9"; // Verde claro
    } else {
      return "#BBDEFB"; // Azul claro
    }
  };

  return (
    <Box
      sx={{
        position: "relative",
        backgroundColor: theme.palette.common.white,
        borderRadius: 2,
        p: 2,
        mb: 2,
        minHeight: 100,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        boxShadow: theme.shadows[2],
        cursor: "grab",
        "&:active": {
          cursor: "grabbing",
        },
        transition: "all 0.2s ease",
        "&:hover": {
          boxShadow: theme.shadows[4],
          transform: "translateY(-2px)",
        },
      }}
    >
      {/* Ícone de fundo - alinhado à esquerda */}
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: 16,
          transform: "translateY(-50%) rotate(-15deg)",
          color: getCardColor(),
          opacity: 0.2,
          zIndex: 0,
        }}
      >
        {getCardIcon()}
      </Box>

      {/* Botão de deletar - topo direito */}
      <IconButton
        size="small"
        onClick={(e) => {
          e.stopPropagation();
          onDelete?.(card.id);
        }}
        sx={{
          position: "absolute",
          top: 8,
          right: 8,
          zIndex: 2,
          color: theme.palette.text.secondary,
          "&:hover": {
            backgroundColor: theme.palette.error.light,
            color: theme.palette.common.white,
          },
          width: 24,
          height: 24,
          padding: 0.5,
        }}
      >
        <Delete sx={{ fontSize: 18 }} />
      </IconButton>

      {/* Conteúdo do card - centralizado verticalmente */}
      <Box sx={{ position: "relative", zIndex: 1 }}>
        {/* Label do tipo - topo esquerdo */}
        <Chip
          label={card.type === "property" ? "Imóvel" : "Contato"}
          size="small"
          sx={{
            mb: 1,
            backgroundColor:
              card.type === "property"
                ? "#C8E6C9"
                : "#BBDEFB",
            color: theme.palette.text.primary,
            fontWeight: 600,
            fontSize: "0.7rem",
            height: 20,
          }}
        />

        {/* Título - uma linha com truncamento */}
        <Typography
          variant="body1"
          sx={{
            fontWeight: 600,
            mb: 0.5,
            color: theme.palette.text.primary,
            fontSize: "0.9rem",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            lineHeight: 1.2,
          }}
        >
          {card.title}
        </Typography>

        {/* Endereço - uma linha com truncamento */}
        {card.address && (
          <Typography
            variant="body2"
            sx={{
              color: theme.palette.text.secondary,
              fontSize: "0.8rem",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              lineHeight: 1.2,
            }}
          >
            {card.address}
          </Typography>
        )}

        {/* Contato - uma linha com truncamento */}
        {card.contact && (
          <Typography
            variant="body2"
            sx={{
              color: theme.palette.text.secondary,
              fontSize: "0.8rem",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              lineHeight: 1.2,
            }}
          >
            {card.contact}
          </Typography>
        )}
      </Box>
    </Box>
  );
}
