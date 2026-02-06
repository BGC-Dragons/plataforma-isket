import { useState, useEffect, useCallback, useRef } from "react";
import { createRoot } from "react-dom/client";
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  Home,
  Person,
  TrendingUp,
  LocationOn,
  MoreVert,
  Add,
  Close,
  Edit,
  DeleteOutlined,
} from "@mui/icons-material";
import { KanbanCard, type KanbanCardData } from "./kanban-cards.component";
import { useAuth } from "../access-manager/auth.hook";
import {
  useGetPropertyListingAcquisitionsStages,
  clearPropertyListingAcquisitionsStagesCache,
  type IPropertyListingAcquisitionStage,
} from "../../../services/get-property-listing-acquisitions-stages.service";
import { postPropertyListingAcquisitionStage } from "../../../services/post-property-listing-acquisitions-stage.service";
import { deletePropertyListingAcquisitionStage } from "../../../services/delete-property-listing-acquisitions-stage.service";
import { patchPropertyListingAcquisitionStage } from "../../../services/patch-property-listing-acquisitions-stage.service";
import { patchPropertyListingAcquisition } from "../../../services/patch-property-listing-acquisition.service";
import { deletePropertyListingAcquisition } from "../../../services/delete-property-listing-acquisition.service";

import {
  draggable,
  dropTargetForElements,
  monitorForElements,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { setCustomNativeDragPreview } from "@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview";
import { triggerPostMoveFlash } from "@atlaskit/pragmatic-drag-and-drop-flourish/trigger-post-move-flash";
import { reorder } from "@atlaskit/pragmatic-drag-and-drop/reorder";
import {
  attachClosestEdge,
  extractClosestEdge,
} from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import type { Edge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/types";
import { getReorderDestinationIndex } from "@atlaskit/pragmatic-drag-and-drop-hitbox/util/get-reorder-destination-index";
import * as liveRegion from "@atlaskit/pragmatic-drag-and-drop-live-region";

export type ColumnId =
  | "property-sourcing"
  | "contact-sourcing"
  | "prospecting"
  | "visit"
  | string; // Permite IDs dinâmicos para novas colunas

export interface KanbanColumn {
  id: ColumnId;
  title: string;
  icon: React.ReactNode;
  color: string;
  fontColor?: string | null;
  cards: KanbanCardData[];
}

interface KanbanProps {
  columns?: KanbanColumn[];
  onCardMove?: (
    cardId: string,
    sourceColumnId: ColumnId,
    destinationColumnId: ColumnId,
  ) => void;
  onCardDelete?: (cardId: string, columnId: ColumnId) => void;
  onCardClick?: (card: KanbanCardData) => void;
  onAddColumn?: (column: Omit<KanbanColumn, "id" | "cards">) => void;
  searchQuery?: string; // Prop para indicar busca ativa
}

const defaultColumns: KanbanColumn[] = [
  {
    id: "property-sourcing",
    title: "Captação por imóvel",
    icon: <Home />,
    color: "#C8E6C9", // Verde claro
    cards: [],
  },
  {
    id: "contact-sourcing",
    title: "Captação por contato",
    icon: <Person />,
    color: "#BBDEFB", // Azul claro
    cards: [],
  },
  {
    id: "prospecting",
    title: "Prospecção",
    icon: <TrendingUp />,
    color: "#F8BBD0", // Rosa claro
    cards: [],
  },
  {
    id: "visit",
    title: "Visita",
    icon: <LocationOn />,
    color: "#FFE0B2", // Laranja claro
    cards: [],
  },
];

const COLUMN_WIDTH = 280;

type DragItemData =
  | {
      type: "card";
      itemId: string;
      columnId: ColumnId;
      instanceId: symbol;
    }
  | {
      type: "column";
      columnId: ColumnId;
      instanceId: symbol;
    };

const isCardDragData = (
  data: Record<string, unknown>,
): data is Extract<DragItemData, { type: "card" }> =>
  data.type === "card" &&
  typeof data.itemId === "string" &&
  typeof data.columnId === "string" &&
  typeof data.instanceId === "symbol";

const isColumnDragData = (
  data: Record<string, unknown>,
): data is Extract<DragItemData, { type: "column" }> =>
  data.type === "column" &&
  typeof data.columnId === "string" &&
  typeof data.instanceId === "symbol";

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

type Outcome =
  | {
      type: "column-reorder";
      columnId: string;
      startIndex: number;
      finishIndex: number;
    }
  | {
      type: "card-reorder";
      columnId: string;
      startIndex: number;
      finishIndex: number;
    }
  | {
      type: "card-move";
      finishColumnId: string;
      itemIndexInStartColumn: number;
      itemIndexInFinishColumn: number;
    };

type Trigger = "pointer" | "keyboard";

type Operation = {
  trigger: Trigger;
  outcome: Outcome;
};

type CardRegistryEntry = {
  element: HTMLElement;
  focusTarget: HTMLElement;
};

type ColumnRegistryEntry = {
  element: HTMLElement;
};

function createRegistry() {
  const cardMap = new Map<string, CardRegistryEntry>();
  const columnMap = new Map<string, ColumnRegistryEntry>();

  return {
    registerCard({
      cardId,
      element,
      focusTarget,
    }: {
      cardId: string;
      element: HTMLElement;
      focusTarget: HTMLElement;
    }) {
      cardMap.set(cardId, { element, focusTarget });
      return () => {
        cardMap.delete(cardId);
      };
    },
    registerColumn({
      columnId,
      element,
    }: {
      columnId: string;
      element: HTMLElement;
    }) {
      columnMap.set(columnId, { element });
      return () => {
        columnMap.delete(columnId);
      };
    },
    getCard(cardId: string) {
      const entry = cardMap.get(cardId);
      invariant(entry, `Card not registered: ${cardId}`);
      return entry;
    },
    getColumn(columnId: string) {
      const entry = columnMap.get(columnId);
      invariant(entry, `Column not registered: ${columnId}`);
      return entry;
    },
  };
}

const cloneColumns = (columns: KanbanColumn[]): KanbanColumn[] =>
  columns.map((col) => ({
    ...col,
    cards: col.cards.slice(),
  }));

// Componente wrapper para tornar coluna arrastável
function SortableColumnWrapper({
  column,
  onCardDelete,
  onCardClick,
  onMenuOpen,
  isDraggingCard,
  isDraggingColumn,
  draggingCardId,
  registerColumn,
  registerCard,
  instanceId,
  isLast,
}: {
  column: KanbanColumn;
  onCardDelete: (cardId: string, columnId: ColumnId) => void;
  onCardClick?: (card: KanbanCardData) => void;
  onMenuOpen?: (
    event: React.MouseEvent<HTMLElement>,
    columnId: ColumnId,
  ) => void;
  isDraggingCard?: boolean;
  isDraggingColumn?: boolean;
  draggingCardId?: string | null;
  registerColumn: ReturnType<typeof createRegistry>["registerColumn"];
  registerCard: ReturnType<typeof createRegistry>["registerCard"];
  instanceId: symbol;
  isLast?: boolean;
}) {
  const theme = useTheme();
  const columnRef = useRef<HTMLDivElement | null>(null);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const [closestEdge, setClosestEdge] = useState<Edge | null>(null);

  useEffect(() => {
    const element = columnRef.current;
    if (!element) return;

    return combine(
      draggable({
        element,
        dragHandle: headerRef.current ?? undefined,
        getInitialData: () => ({
          type: "column",
          columnId: column.id,
          instanceId,
        }),
        onGenerateDragPreview: ({ nativeSetDragImage }) => {
          setCustomNativeDragPreview({
            nativeSetDragImage,
            render({ container }: { container: HTMLElement }) {
              const root = createRoot(container);
              root.render(<ColumnPreview column={column} />);
              return () => root.unmount();
            },
          });
        },
      }),
      dropTargetForElements({
        element,
        getData: ({ input, element }) =>
          attachClosestEdge(
            {
              type: "column",
              columnId: column.id,
              instanceId,
            },
            {
              input,
              element,
              allowedEdges: ["left", "right"],
            },
          ),
        onDragEnter: (args) => {
          setClosestEdge(extractClosestEdge(args.self.data));
        },
        onDropTargetChange: (args) => {
          setClosestEdge(extractClosestEdge(args.self.data));
        },
        onDragLeave: () => {
          setClosestEdge(null);
        },
        onDrop: () => {
          setClosestEdge(null);
        },
      }),
    );
  }, [column.id, column, instanceId]);

  useEffect(() => {
    const element = columnRef.current;
    if (!element) return;
    return registerColumn({ columnId: column.id, element });
  }, [column.id, registerColumn]);

  return (
    <Box
      ref={columnRef}
      sx={{
        flexShrink: 0,
        minWidth: COLUMN_WIDTH,
        height: "100%",
        minHeight: 0,
        opacity: isDraggingColumn ? 0.5 : 1,
        transition: "opacity 0.2s ease",
        borderRight: isLast ? "none" : `1px solid ${theme.palette.divider}`,
        pr: 2,
        position: "relative",
      }}
    >
      {closestEdge ? (
        <Box
          sx={{
            position: "absolute",
            top: 0,
            bottom: 0,
            width: 2,
            backgroundColor: theme.palette.primary.main,
            borderRadius: 1,
            left: closestEdge === "left" ? -4 : "auto",
            right: closestEdge === "right" ? -4 : "auto",
          }}
        />
      ) : null}
      <SortableColumn
        column={column}
        onCardDelete={onCardDelete}
        onCardClick={onCardClick}
        onMenuOpen={onMenuOpen}
        headerRef={headerRef}
        isDraggingCard={isDraggingCard}
        draggingCardId={draggingCardId}
        registerCard={registerCard}
        instanceId={instanceId}
      />
    </Box>
  );
}

// Componente de coluna sortable
function SortableColumn({
  column,
  onCardDelete,
  onCardClick,
  onMenuOpen,
  headerRef,
  isDraggingCard,
  draggingCardId,
  registerCard,
  instanceId,
}: {
  column: KanbanColumn;
  onCardDelete: (cardId: string, columnId: ColumnId) => void;
  onCardClick?: (card: KanbanCardData) => void;
  onMenuOpen?: (
    event: React.MouseEvent<HTMLElement>,
    columnId: ColumnId,
  ) => void;
  headerRef?: React.Ref<HTMLDivElement>;
  isDraggingCard?: boolean;
  draggingCardId?: string | null;
  registerCard: ReturnType<typeof createRegistry>["registerCard"];
  instanceId: symbol;
}) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        width: COLUMN_WIDTH,
        display: "flex",
        flexDirection: "column",
        height: "100%",
        maxHeight: "100%",
        minHeight: 0,
        borderRadius: 2,
        transition: "background-color 0.2s ease",
        overflow: "hidden",
      }}
    >
      {/* Header da coluna */}
      <Paper
        elevation={2}
        ref={headerRef}
        tabIndex={0}
        role="button"
        sx={{
          p: 2,
          mb: 2,
          borderRadius: 2,
          backgroundColor: column.color,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          cursor: headerRef ? "grab" : "default",
          "&:active": {
            cursor: headerRef ? "grabbing" : "default",
          },
          touchAction: "manipulation",
          userSelect: "none",
        }}
      >
        {/* Menu de ações (para todas as colunas) */}
        <IconButton
          size="small"
          onClick={(e) => onMenuOpen?.(e, column.id)}
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
            color: theme.palette.text.secondary,
            "&:hover": {
              backgroundColor: "rgba(0, 0, 0, 0.05)",
            },
          }}
        >
          <MoreVert fontSize="small" />
        </IconButton>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 1,
            mb: 0.5,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: column.fontColor ?? theme.palette.text.primary,
            }}
          >
            {column.icon}
          </Box>
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 600,
              color: column.fontColor ?? theme.palette.text.primary,
              fontSize: "0.9rem",
            }}
          >
            {column.title}
          </Typography>
        </Box>

        <Typography
          variant="caption"
          sx={{
            color: column.fontColor ?? theme.palette.text.secondary,
            fontSize: "0.75rem",
          }}
        >
          {getTotalLabel(column)}
        </Typography>
      </Paper>

      {/* Cards da coluna */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          maxHeight: "100%",
          overflowY: "auto",
          overflowX: "hidden",
          backgroundColor: theme.palette.grey[100],
          borderRadius: 2,
          p: 1,
          display: "flex",
          flexDirection: "column",
          touchAction: "pan-y",
        }}
      >
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {column.cards.map((card) => (
            <SortableCard
              key={card.id}
              card={card}
              columnId={column.id}
              onDelete={onCardDelete}
              onClick={onCardClick}
              isDraggingCard={isDraggingCard}
              isDraggingSelf={draggingCardId === card.id}
              registerCard={registerCard}
              instanceId={instanceId}
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
}

// Componente de card sortable
function SortableCard({
  card,
  columnId,
  onDelete,
  onClick,
  isDraggingCard,
  isDraggingSelf,
  registerCard,
  instanceId,
}: {
  card: KanbanCardData;
  columnId: ColumnId;
  onDelete: (cardId: string, columnId: ColumnId) => void;
  onClick?: (card: KanbanCardData) => void;
  isDraggingCard?: boolean;
  isDraggingSelf?: boolean;
  registerCard: ReturnType<typeof createRegistry>["registerCard"];
  instanceId: symbol;
}) {
  const theme = useTheme();
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [closestEdge, setClosestEdge] = useState<Edge | null>(null);

  useEffect(() => {
    const element = cardRef.current;
    if (!element) return;

    return combine(
      draggable({
        element,
        getInitialData: () => ({
          type: "card",
          itemId: card.id,
          columnId,
          instanceId,
        }),
        onGenerateDragPreview: ({ nativeSetDragImage, source }) => {
          const sourceRect = (
            source.element as HTMLElement
          ).getBoundingClientRect();
          setCustomNativeDragPreview({
            nativeSetDragImage,
            getOffset: () => ({
              x: sourceRect.width / 2,
              y: sourceRect.height / 2,
            }),
            render({ container }: { container: HTMLElement }) {
              const root = createRoot(container);
              root.render(
                <Box sx={{ width: COLUMN_WIDTH }}>
                  <KanbanCard card={card} />
                </Box>,
              );
              return () => root.unmount();
            },
          });
        },
      }),
      dropTargetForElements({
        element,
        getData: ({ input, element }) =>
          attachClosestEdge(
            {
              type: "card",
              itemId: card.id,
              columnId,
              instanceId,
            },
            {
              input,
              element,
              allowedEdges: ["top", "bottom"],
            },
          ),
        canDrop: ({ source }) => {
          return isCardDragData(source.data);
        },
        onDragEnter: (args) => {
          setClosestEdge(extractClosestEdge(args.self.data));
        },
        onDropTargetChange: (args) => {
          setClosestEdge(extractClosestEdge(args.self.data));
        },
        onDragLeave: () => {
          setClosestEdge(null);
        },
        onDrop: () => {
          setClosestEdge(null);
        },
      }),
    );
  }, [card, columnId, instanceId]);

  useEffect(() => {
    const element = cardRef.current;
    if (!element) return;
    return registerCard({
      cardId: card.id,
      element,
      focusTarget: element,
    });
  }, [card.id, registerCard]);

  // Criar handler de clique que verifica se não está arrastando
  const handleClick = (clickedCard: KanbanCardData) => {
    if (!isDraggingCard && !isDraggingSelf) {
      onClick?.(clickedCard);
    }
  };

  return (
    <div
      ref={cardRef}
      tabIndex={0}
      style={{
        position: "relative",
        opacity: isDraggingSelf ? 0.3 : 1,
        transition: "opacity 0.2s ease",
        touchAction: "manipulation",
        userSelect: "none",
      }}
    >
      {closestEdge ? (
        <div
          style={{
            position: "absolute",
            left: 8,
            right: 8,
            height: 2,
            backgroundColor: theme.palette.primary.main,
            borderRadius: 2,
            top: closestEdge === "top" ? -2 : "auto",
            bottom: closestEdge === "bottom" ? -2 : "auto",
          }}
        />
      ) : null}
      <KanbanCard
        card={card}
        onDelete={(id) => onDelete(id, columnId)}
        onClick={handleClick}
      />
    </div>
  );
}

function ColumnPreview({ column }: { column: KanbanColumn }) {
  return (
    <Box
      sx={{
        width: COLUMN_WIDTH,
        borderRadius: 2,
        backgroundColor: column.color,
        p: 2,
        boxShadow: 3,
      }}
    >
      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
        {column.title}
      </Typography>
      <Typography variant="caption" sx={{ color: "text.secondary" }}>
        {getTotalLabel(column)}
      </Typography>
    </Box>
  );
}

// Função auxiliar para calcular total
function getTotalLabel(column: KanbanColumn) {
  const propertyCount = column.cards.filter(
    (c) => c.type === "property",
  ).length;
  const contactCount = column.cards.filter((c) => c.type === "contact").length;

  // Corrigindo plural de imóvel para "imóveis" corretamente
  if (propertyCount > 0 && contactCount > 0) {
    return `Total: ${propertyCount} ${
      propertyCount === 1 ? "imóvel" : "imóveis"
    }, ${contactCount} contato${contactCount > 1 ? "s" : ""}`;
  } else if (propertyCount > 0) {
    return `Total: ${propertyCount} ${
      propertyCount === 1 ? "imóvel" : "imóveis"
    }`;
  } else if (contactCount > 0) {
    return `Total: ${contactCount} contato${contactCount > 1 ? "s" : ""}`;
  }
  return "Total: 0";
}

// Função para mapear listing da API para KanbanCardData
function mapListingToCard(
  listing: IPropertyListingAcquisitionStage["listings"][0],
): KanbanCardData {
  return {
    id: listing.id,
    type: listing.captureType === "PROPERTY" ? "property" : "contact",
    title: listing.title,
    address: listing.formattedAddress,
    subtitle: listing.status,
  };
}

// Função para mapear stage da API para KanbanColumn
function mapStageToColumn(
  stage: IPropertyListingAcquisitionStage,
): KanbanColumn {
  const defaultColors = [
    "#C8E6C9",
    "#BBDEFB",
    "#F8BBD0",
    "#FFE0B2",
    "#E1BEE7",
    "#FFF9C4",
  ];
  const iconMap: Record<string, React.ReactNode> = {
    home: <Home />,
    person: <Person />,
    trending: <TrendingUp />,
    location: <LocationOn />,
  };
  const icons = Object.values(iconMap);
  const iconIndex = (stage.order - 1) % icons.length;
  const colorIndex = (stage.order - 1) % defaultColors.length;
  const resolvedIcon =
    stage.icon && iconMap[stage.icon] ? iconMap[stage.icon] : icons[iconIndex];

  return {
    id: stage.id,
    title: stage.title,
    icon: resolvedIcon,
    color: stage.color ?? defaultColors[colorIndex],
    fontColor: stage.fontColor ?? null,
    cards: stage.listings.map(mapListingToCard),
  };
}

// Função para mapear array de stages para array de columns
function mapStagesToColumns(
  stages: IPropertyListingAcquisitionStage[],
): KanbanColumn[] {
  // Ordenar por order antes de mapear
  const sortedStages = [...stages].sort((a, b) => a.order - b.order);
  return sortedStages.map(mapStageToColumn);
}

export function Kanban({
  columns: propsColumns,
  onCardMove,
  onCardDelete,
  onCardClick,
  searchQuery = "",
}: KanbanProps) {
  const theme = useTheme();
  const auth = useAuth();
  const boardRef = useRef<HTMLDivElement | null>(null);
  const {
    data: stages,
    error,
    isLoading,
    mutate,
  } = useGetPropertyListingAcquisitionsStages();
  const [boardState, setBoardState] = useState<{
    columns: KanbanColumn[];
    lastOperation: Operation | null;
  }>({
    columns: [],
    lastOperation: null,
  });
  const { columns: localColumns, lastOperation } = boardState;
  const stableColumnsRef = useRef<KanbanColumn[]>(localColumns);
  const [registry] = useState(createRegistry);
  const [isDraggingCard, setIsDraggingCard] = useState(false);
  const [draggingCardId, setDraggingCardId] = useState<string | null>(null);
  const [draggingColumnId, setDraggingColumnId] = useState<ColumnId | null>(
    null,
  );
  const [menuAnchor, setMenuAnchor] = useState<{
    element: HTMLElement;
    columnId: ColumnId;
  } | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editStageId, setEditStageId] = useState<ColumnId | null>(null);
  const [editColumnTitle, setEditColumnTitle] = useState("");
  const [editColumnColor, setEditColumnColor] = useState("#C8E6C9");
  const [editColumnFontColor, setEditColumnFontColor] = useState("#000000");
  const [editColumnIcon, setEditColumnIcon] = useState<
    "home" | "person" | "trending" | "location"
  >("home");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState<{
    open: boolean;
    cardId: string | null;
    columnId: ColumnId | null;
  }>({
    open: false,
    cardId: null,
    columnId: null,
  });
  const [isDeletingCard, setIsDeletingCard] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState("");
  const [newColumnColor, setNewColumnColor] = useState("#C8E6C9");
  const [newColumnFontColor, setNewColumnFontColor] = useState("#000000");
  const [newColumnIcon, setNewColumnIcon] = useState<
    "home" | "person" | "trending" | "location"
  >("home");
  const latestStateRef = useRef<{
    columns: KanbanColumn[];
    stages: typeof stages | undefined;
    token: string | null;
    onCardMove?: KanbanProps["onCardMove"];
  }>({
    columns: [],
    stages: undefined,
    token: null,
    onCardMove,
  });
  const mutateRef = useRef(mutate);
  const [instanceId] = useState(() => Symbol("instance-id"));
  const autoScrollRef = useRef<{
    rafId: number | null;
    clientX: number;
    active: boolean;
  }>({
    rafId: null,
    clientX: 0,
    active: false,
  });

  // Função para normalizar texto (remover acentos e espaços extras)
  const normalizeText = (text: string): string => {
    return text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove acentos
      .toLowerCase()
      .trim()
      .replace(/\s+/g, " "); // Normaliza espaços múltiplos
  };

  // Mapear stages da API para columns
  useEffect(() => {
    // Sempre priorizar dados da API quando disponíveis
    if (stages && stages.length > 0) {
      const mappedColumns = mapStagesToColumns(stages);

      // Se há busca ativa, filtrar os cards
      if (searchQuery.trim()) {
        const searchNormalized = normalizeText(searchQuery);
        const filtered = mappedColumns.map((column) => ({
          ...column,
          cards: column.cards.filter((card) => {
            if (!card.title) return false;
            const cardTitle = normalizeText(card.title);
            return cardTitle.includes(searchNormalized);
          }),
        }));
        setBoardState((prev) => ({ ...prev, columns: filtered }));
      } else {
        setBoardState((prev) => ({ ...prev, columns: mappedColumns }));
      }
    } else if (propsColumns) {
      // Fallback para props se não houver dados da API
      // Se há busca ativa, filtrar os propsColumns também
      if (searchQuery.trim()) {
        const searchNormalized = normalizeText(searchQuery);
        const filtered = propsColumns.map((column) => ({
          ...column,
          cards: column.cards.filter((card) => {
            if (!card.title) return false;
            const cardTitle = normalizeText(card.title);
            return cardTitle.includes(searchNormalized);
          }),
        }));
        setBoardState((prev) => ({ ...prev, columns: filtered }));
      } else {
        setBoardState((prev) => ({ ...prev, columns: propsColumns }));
      }
    } else {
      setBoardState((prev) => ({ ...prev, columns: defaultColumns }));
    }
  }, [stages, propsColumns, searchQuery]);

  useEffect(() => {
    stableColumnsRef.current = localColumns;
  }, [localColumns]);

  useEffect(() => {
    latestStateRef.current = {
      columns: localColumns,
      stages,
      token: auth.store.token,
      onCardMove,
    };
  }, [localColumns, stages, auth.store.token, onCardMove]);

  useEffect(() => {
    mutateRef.current = mutate;
  }, [mutate]);

  useEffect(() => {
    if (lastOperation === null) {
      return;
    }

    const { outcome, trigger } = lastOperation;

    if (outcome.type === "column-reorder") {
      const { startIndex, finishIndex } = outcome;
      const columns = stableColumnsRef.current;
      const sourceColumn = columns[finishIndex];
      if (!sourceColumn) {
        return;
      }

      const entry = registry.getColumn(sourceColumn.id);
      triggerPostMoveFlash(entry.element);

      liveRegion.announce(
        `You've moved ${sourceColumn.title} from position ${
          startIndex + 1
        } to position ${finishIndex + 1} of ${columns.length}.`,
      );
      return;
    }

    if (outcome.type === "card-reorder") {
      const { columnId, startIndex, finishIndex } = outcome;
      const column = stableColumnsRef.current.find(
        (col) => col.id === columnId,
      );
      if (!column) {
        return;
      }
      const item = column.cards[finishIndex];
      if (!item) {
        return;
      }

      const entry = registry.getCard(item.id);
      triggerPostMoveFlash(entry.element);

      if (trigger !== "keyboard") {
        return;
      }

      liveRegion.announce(
        `You've moved ${item.title} from position ${
          startIndex + 1
        } to position ${finishIndex + 1} of ${column.cards.length} in the ${
          column.title
        } column.`,
      );
      return;
    }

    if (outcome.type === "card-move") {
      const {
        finishColumnId,
        itemIndexInStartColumn,
        itemIndexInFinishColumn,
      } = outcome;
      const destinationColumn = stableColumnsRef.current.find(
        (col) => col.id === finishColumnId,
      );
      if (!destinationColumn) {
        return;
      }
      const item = destinationColumn.cards[itemIndexInFinishColumn];
      if (!item) {
        return;
      }

      const finishPosition =
        typeof itemIndexInFinishColumn === "number"
          ? itemIndexInFinishColumn + 1
          : destinationColumn.cards.length;

      const entry = registry.getCard(item.id);
      triggerPostMoveFlash(entry.element);

      if (trigger !== "keyboard") {
        return;
      }

      liveRegion.announce(
        `You've moved ${item.title} from position ${
          itemIndexInStartColumn + 1
        } to position ${finishPosition} in the ${
          destinationColumn.title
        } column.`,
      );

      entry.focusTarget.focus();
      return;
    }
  }, [lastOperation, registry]);

  useEffect(() => {
    return liveRegion.cleanup();
  }, []);

  const reorderColumn = useCallback(
    ({
      startIndex,
      finishIndex,
      trigger = "keyboard",
    }: {
      startIndex: number;
      finishIndex: number;
      trigger?: Trigger;
    }) => {
      const currentColumns = stableColumnsRef.current;
      const sourceColumn = currentColumns[startIndex];
      if (!sourceColumn) {
        return;
      }
      const reordered = reorder({
        list: currentColumns,
        startIndex,
        finishIndex,
      });
      const previousColumns = cloneColumns(currentColumns);

      const outcome: Outcome = {
        type: "column-reorder",
        columnId: sourceColumn.id as string,
        startIndex,
        finishIndex,
      };

      setBoardState((prev) => ({
        ...prev,
        columns: reordered,
        lastOperation: {
          outcome,
          trigger,
        },
      }));

      const token = latestStateRef.current.token;
      const currentStages = latestStateRef.current.stages;
      if (token) {
        const stageMap = currentStages
          ? new Map(currentStages.map((s) => [s.id, s]))
          : null;
        const updatePromises = reordered.map((col, index) => {
          const stage = stageMap?.get(col.id) ?? null;
          if (!stage || stage.order !== index + 1) {
            return patchPropertyListingAcquisitionStage(
              token,
              col.id as string,
              {
                order: index + 1,
              },
            );
          }
          return Promise.resolve();
        });

        Promise.all(updatePromises)
          .then(() => {
            clearPropertyListingAcquisitionsStagesCache();
            return mutateRef.current();
          })
          .catch((error) => {
            console.error("Erro ao atualizar ordem das colunas:", error);
            setBoardState((prev) => ({ ...prev, columns: previousColumns }));
            alert("Erro ao atualizar ordem das colunas. Tente novamente.");
          });
      }
    },
    [],
  );

  const reorderCard = useCallback(
    ({
      columnId,
      startIndex,
      finishIndex,
      trigger = "keyboard",
    }: {
      columnId: string;
      startIndex: number;
      finishIndex: number;
      trigger?: Trigger;
    }) => {
      const currentColumns = stableColumnsRef.current;
      const sourceColumn = currentColumns.find((col) => col.id === columnId);
      if (!sourceColumn) {
        return;
      }

      const updatedItems = reorder({
        list: sourceColumn.cards,
        startIndex,
        finishIndex,
      });

      const updatedColumns = currentColumns.map((col) => {
        if (col.id !== columnId) {
          return col;
        }
        return {
          ...col,
          cards: updatedItems,
        };
      });

      const outcome: Outcome = {
        type: "card-reorder",
        columnId,
        startIndex,
        finishIndex,
      };

      setBoardState((prev) => ({
        ...prev,
        columns: updatedColumns,
        lastOperation: {
          trigger,
          outcome,
        },
      }));
    },
    [],
  );

  const moveCard = useCallback(
    ({
      startColumnId,
      finishColumnId,
      itemIndexInStartColumn,
      itemIndexInFinishColumn,
      trigger = "keyboard",
    }: {
      startColumnId: string;
      finishColumnId: string;
      itemIndexInStartColumn: number;
      itemIndexInFinishColumn?: number;
      trigger?: Trigger;
    }) => {
      if (startColumnId === finishColumnId) {
        return;
      }

      const currentColumns = stableColumnsRef.current;
      const sourceColumn = currentColumns.find(
        (col) => col.id === startColumnId,
      );
      const destinationColumn = currentColumns.find(
        (col) => col.id === finishColumnId,
      );
      if (!sourceColumn || !destinationColumn) {
        return;
      }
      const item = sourceColumn.cards[itemIndexInStartColumn];
      if (!item) {
        return;
      }

      const destinationItems = Array.from(destinationColumn.cards);
      const newIndexInDestination = itemIndexInFinishColumn ?? 0;
      destinationItems.splice(newIndexInDestination, 0, item);

      const updatedColumns = currentColumns.map((col) => {
        if (col.id === startColumnId) {
          return {
            ...col,
            cards: col.cards.filter((card) => card.id !== item.id),
          };
        }
        if (col.id === finishColumnId) {
          return {
            ...col,
            cards: destinationItems,
          };
        }
        return col;
      });

      const previousColumns = cloneColumns(currentColumns);

      const outcome: Outcome = {
        type: "card-move",
        finishColumnId,
        itemIndexInStartColumn,
        itemIndexInFinishColumn: newIndexInDestination,
      };

      setBoardState((prev) => ({
        ...prev,
        columns: updatedColumns,
        lastOperation: {
          outcome,
          trigger,
        },
      }));

      latestStateRef.current.onCardMove?.(
        item.id,
        startColumnId,
        finishColumnId,
      );
      const token = latestStateRef.current.token;
      if (token) {
        patchPropertyListingAcquisition(item.id, token, {
          stageId: finishColumnId as string,
        })
          .then(() => {
            clearPropertyListingAcquisitionsStagesCache();
            return mutateRef.current();
          })
          .catch((error) => {
            console.error("Erro ao mover captação:", error);
            setBoardState((prev) => ({ ...prev, columns: previousColumns }));
            alert("Erro ao mover captação. Tente novamente.");
          });
      }
    },
    [],
  );

  useEffect(() => {
    return combine(
      monitorForElements({
        canMonitor({ source }) {
          return source.data.instanceId === instanceId;
        },
        onDragStart: ({ source }) => {
          const data = source.data as Record<string, unknown>;
          if (isCardDragData(data)) {
            setIsDraggingCard(true);
            setDraggingCardId(data.itemId);
          }
          if (isColumnDragData(data)) {
            setDraggingColumnId(data.columnId);
          }
        },
        onDrag({ location }) {
          const board = boardRef.current;
          if (!board) {
            return;
          }
          autoScrollRef.current.clientX = location.current.input.clientX;
          if (autoScrollRef.current.active) {
            return;
          }
          autoScrollRef.current.active = true;
          const tick = () => {
            const state = autoScrollRef.current;
            const target = boardRef.current;
            if (!state.active || !target) {
              state.rafId = null;
              return;
            }
            const rect = target.getBoundingClientRect();
            const edgeThreshold = 48;
            const maxSpeed = 18;
            const leftDistance = state.clientX - rect.left;
            const rightDistance = rect.right - state.clientX;
            let delta = 0;
            if (leftDistance < edgeThreshold) {
              const strength = (edgeThreshold - leftDistance) / edgeThreshold;
              delta = -Math.ceil(maxSpeed * strength);
            } else if (rightDistance < edgeThreshold) {
              const strength = (edgeThreshold - rightDistance) / edgeThreshold;
              delta = Math.ceil(maxSpeed * strength);
            }
            if (delta !== 0) {
              target.scrollLeft += delta;
            }
            state.rafId = requestAnimationFrame(tick);
          };
          autoScrollRef.current.rafId = requestAnimationFrame(tick);
        },
        onDrop({ location, source }) {
          setIsDraggingCard(false);
          setDraggingCardId(null);
          setDraggingColumnId(null);
          autoScrollRef.current.active = false;
          if (autoScrollRef.current.rafId !== null) {
            cancelAnimationFrame(autoScrollRef.current.rafId);
            autoScrollRef.current.rafId = null;
          }

          if (!location.current.dropTargets.length) {
            return;
          }

          const data = stableColumnsRef.current;

          if (source.data.type === "column") {
            const startIndex = data.findIndex(
              (column) => column.id === source.data.columnId,
            );

            const target = location.current.dropTargets[0];
            const indexOfTarget = data.findIndex(
              (column) => column.id === target.data.columnId,
            );
            if (startIndex === -1 || indexOfTarget === -1) {
              return;
            }
            const closestEdgeOfTarget: Edge | null = extractClosestEdge(
              target.data,
            );

            const finishIndex = getReorderDestinationIndex({
              startIndex,
              indexOfTarget,
              closestEdgeOfTarget,
              axis: "horizontal",
            });

            reorderColumn({ startIndex, finishIndex, trigger: "pointer" });
          }

          if (source.data.type === "card") {
            const itemId = source.data.itemId;
            invariant(typeof itemId === "string", "Missing card id");
            const [, startColumnRecord] = location.initial.dropTargets;
            const sourceId = startColumnRecord?.data.columnId;
            invariant(typeof sourceId === "string", "Missing column id");
            const sourceColumn = data.find((column) => column.id === sourceId);
            invariant(sourceColumn, "Missing source column");
            const itemIndex = sourceColumn.cards.findIndex(
              (item) => item.id === itemId,
            );
            if (itemIndex === -1) {
              return;
            }

            if (location.current.dropTargets.length === 1) {
              const [destinationColumnRecord] = location.current.dropTargets;
              const destinationId = destinationColumnRecord.data.columnId;
              invariant(
                typeof destinationId === "string",
                "Missing destination",
              );
              const destinationColumn = data.find(
                (column) => column.id === destinationId,
              );
              invariant(destinationColumn, "Missing destination column");

              if (sourceColumn === destinationColumn) {
                const destinationIndex = getReorderDestinationIndex({
                  startIndex: itemIndex,
                  indexOfTarget: sourceColumn.cards.length - 1,
                  closestEdgeOfTarget: null,
                  axis: "vertical",
                });
                reorderCard({
                  columnId: sourceColumn.id as string,
                  startIndex: itemIndex,
                  finishIndex: destinationIndex,
                  trigger: "pointer",
                });
                return;
              }

              moveCard({
                itemIndexInStartColumn: itemIndex,
                startColumnId: sourceColumn.id as string,
                finishColumnId: destinationColumn.id as string,
                trigger: "pointer",
              });
              return;
            }

            if (location.current.dropTargets.length === 2) {
              const [destinationCardRecord, destinationColumnRecord] =
                location.current.dropTargets;
              const destinationColumnId = destinationColumnRecord.data.columnId;
              invariant(
                typeof destinationColumnId === "string",
                "Missing destination column id",
              );
              const destinationColumn = data.find(
                (column) => column.id === destinationColumnId,
              );
              invariant(destinationColumn, "Missing destination column");

              const indexOfTarget = destinationColumn.cards.findIndex(
                (item) => item.id === destinationCardRecord.data.itemId,
              );
              const closestEdgeOfTarget: Edge | null = extractClosestEdge(
                destinationCardRecord.data,
              );

              if (sourceColumn === destinationColumn) {
                const destinationIndex = getReorderDestinationIndex({
                  startIndex: itemIndex,
                  indexOfTarget: indexOfTarget ?? -1,
                  closestEdgeOfTarget,
                  axis: "vertical",
                });
                reorderCard({
                  columnId: sourceColumn.id as string,
                  startIndex: itemIndex,
                  finishIndex: destinationIndex,
                  trigger: "pointer",
                });
                return;
              }

              const destinationIndex =
                closestEdgeOfTarget === "bottom"
                  ? (indexOfTarget ?? 0) + 1
                  : (indexOfTarget ?? 0);

              moveCard({
                itemIndexInStartColumn: itemIndex,
                startColumnId: sourceColumn.id as string,
                finishColumnId: destinationColumnId,
                itemIndexInFinishColumn: destinationIndex,
                trigger: "pointer",
              });
            }
          }
        },
      }),
    );
  }, [instanceId, moveCard, reorderCard, reorderColumn]);

  const handleCardDelete = (cardId: string, columnId: ColumnId) => {
    // Abrir dialog de confirmação
    setDeleteConfirmDialog({
      open: true,
      cardId,
      columnId,
    });
  };

  const handleConfirmDelete = async () => {
    if (
      !deleteConfirmDialog.cardId ||
      !deleteConfirmDialog.columnId ||
      !auth.store.token
    ) {
      return;
    }

    setIsDeletingCard(true);
    try {
      // Deletar a acquisition via API
      await deletePropertyListingAcquisition(
        deleteConfirmDialog.cardId,
        auth.store.token,
      );

      // Atualizar os stages e acquisitions
      clearPropertyListingAcquisitionsStagesCache();
      await mutate();

      // Fechar dialog e limpar estado
      setDeleteConfirmDialog({
        open: false,
        cardId: null,
        columnId: null,
      });

      // Chamar callback se existir
      onCardDelete?.(deleteConfirmDialog.cardId, deleteConfirmDialog.columnId);
    } catch (error) {
      console.error("Erro ao deletar captação:", error);
      alert("Erro ao deletar captação. Tente novamente.");
    } finally {
      setIsDeletingCard(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmDialog({
      open: false,
      cardId: null,
      columnId: null,
    });
  };

  const handleMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    columnId: ColumnId,
  ) => {
    setMenuAnchor({ element: event.currentTarget, columnId });
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const handleEditStageClick = useCallback(() => {
    if (!menuAnchor) return;

    const columnId = menuAnchor.columnId;
    const column = localColumns.find((col) => col.id === columnId);
    const stage = stages?.find((s) => s.id === columnId);

    if (!column) return;

    setEditStageId(columnId);
    setEditColumnTitle(column.title);
    setEditColumnColor(column.color);
    setEditColumnFontColor(column.fontColor ?? "#000000");
    setEditColumnIcon(
      (stage?.icon as "home" | "person" | "trending" | "location") ?? "home",
    );
    setIsEditModalOpen(true);
    handleMenuClose();
  }, [menuAnchor, localColumns, stages]);

  const handleSaveEditStage = useCallback(async () => {
    if (!editStageId || !auth.store.token || !editColumnTitle.trim()) return;

    setIsUpdating(true);
    try {
      await patchPropertyListingAcquisitionStage(
        auth.store.token,
        editStageId as string,
        {
          title: editColumnTitle.trim(),
          color: editColumnColor,
          fontColor: editColumnFontColor,
          icon: editColumnIcon,
        },
      );
      clearPropertyListingAcquisitionsStagesCache();
      await mutate();
      setEditStageId(null);
      setIsEditModalOpen(false);
    } catch (error) {
      console.error("Erro ao editar etapa:", error);
      alert("Erro ao editar etapa. Tente novamente.");
    } finally {
      setIsUpdating(false);
    }
  }, [
    editStageId,
    editColumnTitle,
    editColumnColor,
    editColumnFontColor,
    editColumnIcon,
    auth.store.token,
    mutate,
  ]);

  const handleDeleteStage = useCallback(async () => {
    if (!menuAnchor) return;

    const columnId = menuAnchor.columnId;
    const column = localColumns.find((col) => col.id === columnId);

    if (!column || !auth.store.token) return;

    // Não permitir deletar se tiver cards
    if (column.cards.length > 0) {
      alert("Não é possível deletar uma etapa que contém captações.");
      handleMenuClose();
      return;
    }

    setIsDeleting(true);
    try {
      await deletePropertyListingAcquisitionStage(
        auth.store.token,
        columnId as string,
      );
      clearPropertyListingAcquisitionsStagesCache();
      await mutate();
      handleMenuClose();
    } catch (error) {
      console.error("Erro ao deletar etapa:", error);
      alert("Erro ao deletar etapa. Tente novamente.");
    } finally {
      setIsDeleting(false);
    }
  }, [menuAnchor, localColumns, auth.store.token, mutate]);

  const handleCreateStage = useCallback(async () => {
    if (!newColumnTitle.trim() || !auth.store.token) return;

    setIsCreating(true);
    try {
      // Calcular a ordem (última ordem + 1)
      const maxOrder =
        stages && stages.length > 0
          ? Math.max(...stages.map((s) => s.order)) + 1
          : 1;

      await postPropertyListingAcquisitionStage(auth.store.token, {
        title: newColumnTitle.trim(),
        order: maxOrder,
        color: newColumnColor,
        fontColor: newColumnFontColor,
        icon: newColumnIcon,
      });

      clearPropertyListingAcquisitionsStagesCache();
      await mutate();

      // Reset form
      setNewColumnTitle("");
      setNewColumnColor("#C8E6C9");
      setNewColumnFontColor("#000000");
      setNewColumnIcon("home");
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error("Erro ao criar etapa:", error);
      alert("Erro ao criar etapa. Tente novamente.");
    } finally {
      setIsCreating(false);
    }
  }, [
    newColumnTitle,
    newColumnColor,
    newColumnFontColor,
    newColumnIcon,
    auth.store.token,
    stages,
    mutate,
  ]);

  // Loading state
  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Erro ao carregar etapas. Tente recarregar a página.
        </Alert>
      </Box>
    );
  }

  return (
    <>
      <Box
        ref={boardRef}
        sx={{
          display: "flex",
          gap: 2,
          overflowX: "auto",
          overflowY: "hidden",
          alignItems: "stretch",
          height: "100%",
          width: "100%",
          px: 2,
          py: 2,
          backgroundColor: theme.palette.grey[50],
          minHeight: 0,
          boxSizing: "border-box",
        }}
      >
        {localColumns.map((column, index) => (
          <SortableColumnWrapper
            key={column.id}
            column={column}
            onCardDelete={handleCardDelete}
            onCardClick={onCardClick}
            onMenuOpen={handleMenuOpen}
            isDraggingCard={isDraggingCard}
            draggingCardId={draggingCardId}
            isDraggingColumn={draggingColumnId === column.id}
            registerColumn={registry.registerColumn}
            registerCard={registry.registerCard}
            instanceId={instanceId}
            isLast={index === localColumns.length - 1}
          />
        ))}

        {/* Botão de adicionar coluna */}
        <Box
          sx={{
            minWidth: COLUMN_WIDTH,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            borderRadius: 2,
            border: `2px dashed ${theme.palette.divider}`,
            transition: "all 0.2s ease",
            gap: 1,
            "&:hover": {
              borderColor: theme.palette.primary.main,
              backgroundColor: theme.palette.action.hover,
            },
          }}
          onClick={() => setIsCreateModalOpen(true)}
        >
          <IconButton
            sx={{
              color: theme.palette.primary.main,
              "&:hover": {
                backgroundColor: theme.palette.primary.light,
                color: theme.palette.primary.contrastText,
              },
            }}
          >
            <Add sx={{ fontSize: 40 }} />
          </IconButton>
          <Typography
            variant="body2"
            sx={{ color: theme.palette.text.secondary }}
          >
            Adicionar coluna
          </Typography>
        </Box>
      </Box>

      {/* Menu de ações */}
      <Menu
        anchorEl={menuAnchor?.element}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            elevation: 8,
            sx: {
              mt: 1,
              minWidth: 160,
              borderRadius: 1.5,
              py: 0.25,
              boxShadow:
                "0 4px 20px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.06)",
            },
          },
        }}
      >
        <MenuItem
          onClick={handleEditStageClick}
          sx={{
            py: 0.75,
            px: 1.5,
            gap: 1,
            "&:hover": {
              backgroundColor: "action.hover",
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: 32, color: "primary.main" }}>
            <Edit fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary="Editar etapa"
            primaryTypographyProps={{
              variant: "body2",
              fontWeight: 500,
            }}
          />
        </MenuItem>
        <Divider sx={{ my: 0.25 }} />
        <MenuItem
          onClick={handleDeleteStage}
          disabled={isDeleting}
          sx={{
            py: 0.75,
            px: 1.5,
            gap: 1,
            "&:hover:not(.Mui-disabled)": {
              backgroundColor: "rgba(211, 47, 47, 0.08)",
            },
            "&.Mui-disabled": {
              opacity: 0.8,
            },
          }}
        >
          <ListItemIcon
            sx={{
              minWidth: 32,
              color: isDeleting ? "action.disabled" : "error.main",
            }}
          >
            <DeleteOutlined fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary={isDeleting ? "Excluindo..." : "Excluir etapa"}
            primaryTypographyProps={{
              variant: "body2",
              fontWeight: 500,
              color: isDeleting ? "text.disabled" : "error.main",
            }}
          />
        </MenuItem>
      </Menu>

      {/* Modal de editar etapa */}
      <Dialog
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Editar etapa
          </Typography>
          <IconButton
            size="small"
            onClick={() => setIsEditModalOpen(false)}
            sx={{ color: theme.palette.text.secondary }}
          >
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          <Typography
            variant="body2"
            sx={{ color: theme.palette.text.secondary, mb: 3 }}
          >
            Altere o título, cor e ícone da etapa.
          </Typography>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <TextField
              fullWidth
              label="Título"
              value={editColumnTitle}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setEditColumnTitle(e.target.value)
              }
              placeholder="Digite o título da etapa"
            />

            <Box sx={{ display: "flex", gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Selecione a cor da coluna</InputLabel>
                <Select
                  value={editColumnColor}
                  onChange={(e) => setEditColumnColor(e.target.value)}
                  label="Selecione a cor da coluna"
                >
                  <MenuItem value="#C8E6C9">Verde claro</MenuItem>
                  <MenuItem value="#BBDEFB">Azul claro</MenuItem>
                  <MenuItem value="#F8BBD0">Rosa claro</MenuItem>
                  <MenuItem value="#FFE0B2">Laranja claro</MenuItem>
                  <MenuItem value="#E1BEE7">Roxo claro</MenuItem>
                  <MenuItem value="#FFF9C4">Amarelo claro</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Selecione a cor da fonte</InputLabel>
                <Select
                  value={editColumnFontColor}
                  onChange={(e) => setEditColumnFontColor(e.target.value)}
                  label="Selecione a cor da fonte"
                >
                  <MenuItem value="#000000">Preto</MenuItem>
                  <MenuItem value="#FFFFFF">Branco</MenuItem>
                  <MenuItem value="#333333">Cinza escuro</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <FormControl fullWidth>
              <InputLabel>Selecione um ícone</InputLabel>
              <Select
                value={editColumnIcon}
                onChange={(e) =>
                  setEditColumnIcon(
                    e.target.value as
                      | "home"
                      | "person"
                      | "trending"
                      | "location",
                  )
                }
                label="Selecione um ícone"
              >
                <MenuItem value="home">
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Home />
                    <Typography>Casa</Typography>
                  </Box>
                </MenuItem>
                <MenuItem value="person">
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Person />
                    <Typography>Pessoa</Typography>
                  </Box>
                </MenuItem>
                <MenuItem value="trending">
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <TrendingUp />
                    <Typography>Tendência</Typography>
                  </Box>
                </MenuItem>
                <MenuItem value="location">
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <LocationOn />
                    <Typography>Localização</Typography>
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={() => setIsEditModalOpen(false)}
            variant="contained"
            sx={{ textTransform: "none" }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSaveEditStage}
            variant="contained"
            disabled={!editColumnTitle.trim() || isUpdating}
            sx={{ textTransform: "none" }}
          >
            {isUpdating ? "Salvando..." : "Salvar"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de criar etapa */}
      <Dialog
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Criar etapa
          </Typography>
          <IconButton
            size="small"
            onClick={() => setIsCreateModalOpen(false)}
            sx={{ color: theme.palette.text.secondary }}
          >
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          <Typography
            variant="body2"
            sx={{ color: theme.palette.text.secondary, mb: 3 }}
          >
            Crie uma nova coluna para seu processo de captação imobiliária.
          </Typography>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {/* Campo Título */}
            <TextField
              fullWidth
              label="Título"
              value={newColumnTitle}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setNewColumnTitle(e.target.value)
              }
              placeholder="Digite o título da etapa"
            />

            {/* Seleção de cor da coluna e cor da fonte */}
            <Box sx={{ display: "flex", gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Selecione a cor da coluna</InputLabel>
                <Select
                  value={newColumnColor}
                  onChange={(e) => setNewColumnColor(e.target.value)}
                  label="Selecione a cor da coluna"
                >
                  <MenuItem value="#C8E6C9">Verde claro</MenuItem>
                  <MenuItem value="#BBDEFB">Azul claro</MenuItem>
                  <MenuItem value="#F8BBD0">Rosa claro</MenuItem>
                  <MenuItem value="#FFE0B2">Laranja claro</MenuItem>
                  <MenuItem value="#E1BEE7">Roxo claro</MenuItem>
                  <MenuItem value="#FFF9C4">Amarelo claro</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Selecione a cor da fonte</InputLabel>
                <Select
                  value={newColumnFontColor}
                  onChange={(e) => setNewColumnFontColor(e.target.value)}
                  label="Selecione a cor da fonte"
                >
                  <MenuItem value="#000000">Preto</MenuItem>
                  <MenuItem value="#FFFFFF">Branco</MenuItem>
                  <MenuItem value="#333333">Cinza escuro</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* Seleção de ícone */}
            <FormControl fullWidth>
              <InputLabel>Selecione um ícone</InputLabel>
              <Select
                value={newColumnIcon}
                onChange={(e) =>
                  setNewColumnIcon(
                    e.target.value as
                      | "home"
                      | "person"
                      | "trending"
                      | "location",
                  )
                }
                label="Selecione um ícone"
              >
                <MenuItem value="home">
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Home />
                    <Typography>Casa</Typography>
                  </Box>
                </MenuItem>
                <MenuItem value="person">
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Person />
                    <Typography>Pessoa</Typography>
                  </Box>
                </MenuItem>
                <MenuItem value="trending">
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <TrendingUp />
                    <Typography>Tendência</Typography>
                  </Box>
                </MenuItem>
                <MenuItem value="location">
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <LocationOn />
                    <Typography>Localização</Typography>
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={() => setIsCreateModalOpen(false)}
            variant="contained"
            sx={{ textTransform: "none" }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleCreateStage}
            variant="contained"
            disabled={!newColumnTitle.trim() || isCreating}
            sx={{ textTransform: "none" }}
          >
            {isCreating ? "Criando..." : "Criar"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de confirmação de exclusão */}
      <Dialog
        open={deleteConfirmDialog.open}
        onClose={handleCancelDelete}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirmar exclusão</DialogTitle>
        <DialogContent>
          <Typography>
            Tem certeza que deseja excluir esta captação? Esta ação não pode ser
            desfeita.
          </Typography>
        </DialogContent>
        <DialogActions
          sx={{
            p: { xs: 2, sm: 2 },
            flexDirection: { xs: "column", sm: "row" },
            gap: { xs: 1, sm: 1 },
            justifyContent: { xs: "stretch", sm: "flex-end" },
          }}
        >
          <Button
            onClick={handleCancelDelete}
            disabled={isDeletingCard}
            fullWidth={true}
            sx={{
              textTransform: "none",
              fontSize: { xs: "0.875rem", sm: "1rem" },
              py: { xs: 0.75, sm: 1 },
              order: { xs: 2, sm: 1 },
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmDelete}
            variant="contained"
            color="error"
            disabled={isDeletingCard}
            fullWidth={true}
            sx={{
              textTransform: "none",
              fontSize: { xs: "0.875rem", sm: "1rem" },
              py: { xs: 0.75, sm: 1 },
              order: { xs: 1, sm: 2 },
              ml: { xs: 0, sm: 1 },
            }}
            startIcon={isDeletingCard ? <CircularProgress size={16} /> : null}
          >
            {isDeletingCard ? "Excluindo..." : "Excluir"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
