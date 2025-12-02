import { useState, useEffect } from "react";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
  Paper,
  IconButton,
  Chip,
  useTheme,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  ExpandMore,
  Home,
  Person,
  Delete,
} from "@mui/icons-material";
import type { KanbanColumn, ColumnId } from "./kanban.component";
import type { KanbanCardData } from "./kanban-cards.component";
import { useGetPropertyListingAcquisitionsStages } from "../../../services/get-property-listing-acquisitions-stages.service";
import type { IPropertyListingAcquisitionStage } from "../../../services/get-property-listing-acquisitions-stages.service";

interface ListViewProps {
  columns?: KanbanColumn[];
  onCardClick?: (card: KanbanCardData) => void;
  onCardDelete?: (cardId: string, columnId: ColumnId) => void;
}

// Função para mapear listing da API para KanbanCardData
function mapListingToCard(
  listing: IPropertyListingAcquisitionStage["listings"][0]
): KanbanCardData {
  return {
    id: listing.id,
    type: listing.captureType === "PROPERTY" ? "property" : "contact",
    title: listing.title,
    address: listing.formattedAddress,
    subtitle: listing.status,
    status: listing.status as "IN_ACQUISITION" | "DECLINED" | "ACQUIRED" | undefined,
  };
}

// Função para mapear stage da API para KanbanColumn
function mapStageToColumn(
  stage: IPropertyListingAcquisitionStage
): KanbanColumn {
  const defaultColors = [
    "#C8E6C9",
    "#BBDEFB",
    "#F8BBD0",
    "#FFE0B2",
    "#E1BEE7",
    "#FFF9C4",
  ];
  const icons = [<Home />, <Person />];
  const iconIndex = (stage.order - 1) % icons.length;
  const colorIndex = (stage.order - 1) % defaultColors.length;

  return {
    id: stage.id,
    title: stage.title,
    icon: icons[iconIndex],
    color: defaultColors[colorIndex],
    cards: stage.listings.map(mapListingToCard),
  };
}

// Função para mapear array de stages para array de columns
function mapStagesToColumns(
  stages: IPropertyListingAcquisitionStage[]
): KanbanColumn[] {
  const sortedStages = [...stages].sort((a, b) => a.order - b.order);
  return sortedStages.map(mapStageToColumn);
}

export function ListView({
  columns: propsColumns,
  onCardClick,
  onCardDelete,
}: ListViewProps) {
  const theme = useTheme();
  const {
    data: stages,
    error,
    isLoading,
  } = useGetPropertyListingAcquisitionsStages();
  const [localColumns, setLocalColumns] = useState<KanbanColumn[]>([]);

  // Mapear stages da API para columns
  useEffect(() => {
    if (stages && stages.length > 0) {
      const mappedColumns = mapStagesToColumns(stages);
      setLocalColumns(mappedColumns);
    } else if (propsColumns) {
      setLocalColumns(propsColumns);
    } else {
      setLocalColumns([]);
    }
  }, [stages, propsColumns]);

  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          py: 8,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Erro ao carregar etapas. Tente recarregar a página.
        </Alert>
      </Box>
    );
  }

  const columns = localColumns;

  const getColumnIcon = (icon: React.ReactNode) => {
    return icon;
  };

  const getTotalLabel = (column: KanbanColumn) => {
    const propertyCount = column.cards.filter(
      (c) => c.type === "property"
    ).length;
    const contactCount = column.cards.filter((c) => c.type === "contact").length;

    if (propertyCount > 0 && contactCount > 0) {
      return `${propertyCount} ${propertyCount === 1 ? "imóvel" : "imóveis"}, ${contactCount} contato${contactCount > 1 ? "s" : ""}`;
    } else if (propertyCount > 0) {
      return `${propertyCount} ${propertyCount === 1 ? "imóvel" : "imóveis"}`;
    } else if (contactCount > 0) {
      return `${contactCount} contato${contactCount > 1 ? "s" : ""}`;
    }
    return "0";
  };

  return (
    <Box
      sx={{
        p: { xs: 2, sm: 3 },
        width: "100%",
        height: "100%",
        overflowY: "auto",
        overflowX: "hidden",
        "&::-webkit-scrollbar": {
          width: 6,
        },
        "&::-webkit-scrollbar-track": {
          backgroundColor: theme.palette.grey[200],
          borderRadius: 3,
        },
        "&::-webkit-scrollbar-thumb": {
          backgroundColor: theme.palette.grey[400],
          borderRadius: 3,
          "&:hover": {
            backgroundColor: theme.palette.grey[600],
          },
        },
      }}
    >
      {columns.map((column) => (
        <Accordion
          key={column.id}
          defaultExpanded={false}
          sx={{
            mb: 2,
            borderRadius: 2,
            boxShadow: theme.shadows[2],
            "&:before": {
              display: "none",
            },
            "&.Mui-expanded": {
              margin: "0 0 16px 0",
            },
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMore />}
            sx={{
              backgroundColor: column.color,
              borderRadius: "8px 8px 0 0",
              minHeight: 64,
              "&.Mui-expanded": {
                minHeight: 64,
                borderRadius: "8px 8px 0 0",
              },
              "& .MuiAccordionSummary-content": {
                alignItems: "center",
                margin: "12px 0",
                "&.Mui-expanded": {
                  margin: "12px 0",
                },
              },
            }}
          >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            width: "100%",
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {getColumnIcon(column.icon)}
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                color: theme.palette.text.primary,
                fontSize: "1rem",
              }}
            >
              {column.title}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: theme.palette.text.secondary,
                fontSize: "0.75rem",
              }}
            >
              Total: {getTotalLabel(column)}
            </Typography>
          </Box>
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ p: 0 }}>
        <Box sx={{ p: 2 }}>
          {column.cards.length === 0 ? (
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.text.secondary,
                textAlign: "center",
                py: 4,
              }}
            >
              Nenhum card nesta coluna
            </Typography>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              {column.cards.map((card) => (
                <Paper
                  key={card.id}
                  elevation={0}
                  onClick={() => onCardClick?.(card)}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    border: `1px solid ${theme.palette.divider}`,
                    backgroundColor: theme.palette.background.paper,
                    cursor: onCardClick ? "pointer" : "default",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      boxShadow: theme.shadows[4],
                      transform: onCardClick ? "translateY(-2px)" : "none",
                    },
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    position: "relative",
                  }}
                >
                  {/* Ícone do tipo */}
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      minWidth: 48,
                      height: 48,
                      borderRadius: 2,
                      backgroundColor:
                        card.type === "property"
                          ? "#C8E6C9"
                          : "#BBDEFB",
                    }}
                  >
                    {card.type === "property" ? (
                      <Home sx={{ color: "#4caf50" }} />
                    ) : (
                      <Person sx={{ color: "#1976d2" }} />
                    )}
                  </Box>

                  {/* Conteúdo do card */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        mb: 0.5,
                      }}
                    >
                      <Chip
                        label={card.type === "property" ? "Imóvel" : "Contato"}
                        size="small"
                        sx={{
                          backgroundColor:
                            card.type === "property" ? "#C8E6C9" : "#BBDEFB",
                          color: theme.palette.text.primary,
                          fontWeight: 600,
                          fontSize: "0.7rem",
                          height: 20,
                        }}
                      />
                      {card.status && (
                        <Chip
                          label={
                            card.status === "ACQUIRED"
                              ? "Captado"
                              : card.status === "DECLINED"
                              ? "Recusado"
                              : "Em processo"
                          }
                          size="small"
                          sx={{
                            backgroundColor:
                              card.status === "ACQUIRED"
                                ? "#e8f5e9"
                                : card.status === "DECLINED"
                                ? "#ffebee"
                                : "#fff3e0",
                            color:
                              card.status === "ACQUIRED"
                                ? "#4caf50"
                                : card.status === "DECLINED"
                                ? "#f44336"
                                : "#ff9800",
                            fontWeight: 500,
                            fontSize: "0.7rem",
                            height: 20,
                          }}
                        />
                      )}
                    </Box>
                    <Typography
                      variant="body1"
                      sx={{
                        fontWeight: 600,
                        fontSize: "0.9rem",
                        mb: 0.5,
                        color: theme.palette.text.primary,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {card.title}
                    </Typography>
                    {card.address && (
                      <Typography
                        variant="body2"
                        sx={{
                          color: theme.palette.text.secondary,
                          fontSize: "0.8rem",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {card.address}
                      </Typography>
                    )}
                    {card.contact && (
                      <Typography
                        variant="body2"
                        sx={{
                          color: theme.palette.text.secondary,
                          fontSize: "0.8rem",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        Contato: {card.contact}
                      </Typography>
                    )}
                  </Box>

                  {/* Botão de deletar */}
                  {onCardDelete && (
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        onCardDelete(card.id, column.id);
                      }}
                      sx={{
                        color: theme.palette.text.secondary,
                        "&:hover": {
                          backgroundColor: theme.palette.error.light,
                          color: theme.palette.common.white,
                        },
                      }}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  )}
                </Paper>
              ))}
            </Box>
          )}
        </Box>
      </AccordionDetails>
    </Accordion>
  ))}
</Box>
);
}

