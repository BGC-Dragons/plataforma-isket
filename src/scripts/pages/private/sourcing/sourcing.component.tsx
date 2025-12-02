import { useState } from "react";
import { Box, useTheme, Button } from "@mui/material";
import {
  Home,
  Person,
  TrendingUp,
  LocationOn,
  Add,
  Search as SearchIcon,
} from "@mui/icons-material";
import {
  ButtonsBar,
  type ViewMode,
} from "../../../modules/sourcing/buttons-bar";
import {
  Kanban,
  type KanbanColumn,
  type ColumnId,
} from "../../../modules/sourcing/kanban.component";
import { ListView } from "../../../modules/sourcing/list-view.component";
import { SourcingTypeModal } from "../../../modules/sourcing/sourcing-type-modal";
import {
  PropertySourcingModal,
  type PropertySourcingData,
} from "../../../modules/sourcing/property-sourcing-modal";
import {
  ContactSourcingModal,
  type ContactSourcingData,
} from "../../../modules/sourcing/contact-sourcing-modal";
import { PropertySourcingDetails } from "../../../modules/sourcing/property-sourcing-details.component";
import { ContactSourcingDetails } from "../../../modules/sourcing/contact-sourcing-details";
import { ResidentSearchModal } from "../../../modules/sourcing/resident-search-modal";
import {
  SearchResidentResultModal,
  type ResidentResult,
} from "../../../modules/sourcing/search-resident-result-modal";
import { useAuth } from "../../../modules/access-manager/auth.hook";
import { getPropertyListingAcquisitionById } from "../../../../services/get-property-listing-acquisition-by-id.service";
import type { KanbanCardData } from "../../../modules/sourcing/kanban-cards.component";

export function SourcingComponent() {
  const theme = useTheme();
  const auth = useAuth();
  const [searchValue, setSearchValue] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPropertyModalOpen, setIsPropertyModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isPropertyDetailsOpen, setIsPropertyDetailsOpen] = useState(false);
  const [isContactDetailsOpen, setIsContactDetailsOpen] = useState(false);
  const [isResidentSearchModalOpen, setIsResidentSearchModalOpen] =
    useState(false);
  const [isResidentResultModalOpen, setIsResidentResultModalOpen] =
    useState(false);
  const [propertyData, setPropertyData] = useState<PropertySourcingData | null>(
    null
  );
  const [contactData, setContactData] = useState<ContactSourcingData | null>(
    null
  );
  const [acquisitionProcessId, setAcquisitionProcessId] = useState<
    string | undefined
  >(undefined);
  const [acquisitionStatus, setAcquisitionStatus] = useState<
    "IN_ACQUISITION" | "DECLINED" | "ACQUIRED" | undefined
  >(undefined);

  // Dados iniciais do Kanban (exemplo)
  const [kanbanColumns, setKanbanColumns] = useState<KanbanColumn[]>([
    {
      id: "property-sourcing",
      title: "Captação por imóvel",
      icon: <Home />,
      color: "#C8E6C9",
      cards: [
        {
          id: "1",
          type: "property",
          title: "APT - COUNTRY",
          address: "Rua Para, 1462, Country...",
        },
      ],
    },
    {
      id: "contact-sourcing",
      title: "Captação por contato",
      icon: <Person />,
      color: "#BBDEFB",
      cards: [
        {
          id: "2",
          type: "contact",
          title: "LUCIMAR CASAGRANDE",
          subtitle: "COIFFURES - 05.525.906 / 0001-43",
          contact: "Lucimar Casagrande",
        },
        {
          id: "3",
          type: "contact",
          title: "LUCIMAR CASAGRANDE",
          subtitle: "COIFFURES - 05.525.906 / 0001-43",
          contact: "Lucimar Casagrande",
        },
        {
          id: "4",
          type: "contact",
          title: "LUCIMAR CASAGRANDE",
          subtitle: "COIFFURES - 05.525.906 / 0001-43",
          contact: "Lucimar Casagrande",
        },
      ],
    },
    {
      id: "prospecting",
      title: "Prospecção",
      icon: <TrendingUp />,
      color: "#F8BBD0",
      cards: [
        {
          id: "5",
          type: "property",
          title: "APT - COUNTRY",
          address: "Rua Para, 1462, Country...",
        },
        {
          id: "6",
          type: "contact",
          title: "LUCIMAR CA GIDE",
          subtitle: "COIFFURES 25.906 / 00...",
          contact: "Lucimar Casagrande",
        },
      ],
    },
    {
      id: "visit",
      title: "Visita",
      icon: <LocationOn />,
      color: "#FFE0B2",
      cards: [
        {
          id: "7",
          type: "property",
          title: "APT - COUNTRY",
          address: "Rua Para, 1462, Country...",
        },
      ],
    },
  ]);

  const handleAddCapture = () => {
    setIsModalOpen(true);
  };

  const handleSelectProperty = () => {
    setIsPropertyModalOpen(true);
  };

  const handleSaveProperty = (data: PropertySourcingData, acquisitionId?: string) => {
    console.log("Dados da captação de imóvel:", data);
    setPropertyData(data);
    if (acquisitionId) {
      setAcquisitionProcessId(acquisitionId);
      setAcquisitionStatus("IN_ACQUISITION");
    }
    setIsPropertyModalOpen(false);
    setIsPropertyDetailsOpen(true);
  };

  const handleSelectContact = () => {
    setIsContactModalOpen(true);
  };

  const handleSaveContact = (data: ContactSourcingData, acquisitionId?: string) => {
    console.log("Dados da captação de contato:", data);
    setContactData(data);
    if (acquisitionId) {
      setAcquisitionProcessId(acquisitionId);
      setAcquisitionStatus("IN_ACQUISITION");
    }
    setIsContactModalOpen(false);
    setIsContactDetailsOpen(true);
  };

  const handleSearchResidents = () => {
    setIsResidentSearchModalOpen(true);
  };

  const [residentSearchResults, setResidentSearchResults] = useState<
    ResidentResult[]
  >([]);

  const handleResidentSearch = (results: ResidentResult[]) => {
    console.log("Resultados da pesquisa de moradores:", results);
    setResidentSearchResults(results);
    // Fecha o modal de pesquisa e abre o modal de resultados
    setIsResidentSearchModalOpen(false);
    setIsResidentResultModalOpen(true);
  };

  const handleBackToSearch = () => {
    setIsResidentResultModalOpen(false);
    setIsResidentSearchModalOpen(true);
  };

  const handleCreateCapture = (resident: ResidentResult) => {
    console.log("Criar captação para:", resident);
    // TODO: Implementar lógica de criar captação
  };

  const handleReveal = (resident: ResidentResult) => {
    console.log("Revelar dados de:", resident);
    // TODO: Implementar lógica de revelar
  };

  const handleCardClick = async (card: KanbanCardData) => {
    try {
      if (!auth.store.token) {
        console.error("Token de autenticação não encontrado");
        return;
      }

      // Buscar dados completos da captação
      const response = await getPropertyListingAcquisitionById(
        card.id,
        auth.store.token
      );
      const acquisition = response.data;

      // Se for um card de propriedade
      if (card.type === "property") {
        // Converter para PropertySourcingData
        const propertyData: PropertySourcingData = {
          address: acquisition.formattedAddress || "",
          number: acquisition.addressNumber?.toString() || "",
          complement: acquisition.addressComplement || "",
          propertyType: "", // Não temos essa informação na captação
          title: acquisition.title || "",
        };

        setPropertyData(propertyData);
        setAcquisitionProcessId(acquisition.id);
        setAcquisitionStatus(acquisition.status);
        setIsPropertyDetailsOpen(true);
      } else if (card.type === "contact") {
        // Converter para ContactSourcingData
        // Extrair informações do formattedAddress (formato: "Nome - CPF: xxx - Email: xxx - Tel: xxx")
        const formattedAddress = acquisition.formattedAddress || "";
        const parts = formattedAddress.split(" - ");
        const name = parts[0] || "";
        let cpf = "";
        let email = "";
        let phone = "";

        parts.forEach((part) => {
          if (part.startsWith("CPF:")) {
            cpf = part.replace("CPF:", "").trim();
          } else if (part.startsWith("Email:")) {
            email = part.replace("Email:", "").trim();
          } else if (part.startsWith("Tel:")) {
            phone = part.replace("Tel:", "").trim();
          }
        });

        const contactData: ContactSourcingData = {
          name: name,
          cpf: cpf,
          email: email,
          phone: phone,
          title: acquisition.title || "",
        };

        setContactData(contactData);
        setAcquisitionProcessId(acquisition.id);
        setAcquisitionStatus(acquisition.status);
        setIsContactDetailsOpen(true);
      }
    } catch (error) {
      console.error("Erro ao buscar detalhes da captação:", error);
      // TODO: Mostrar mensagem de erro ao usuário
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    // TODO: Implementar lógica de pesquisa
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    // TODO: Implementar mudança de visualização
  };

  const handleCardMove = (
    cardId: string,
    sourceColumnId: ColumnId,
    destinationColumnId: ColumnId
  ) => {
    setKanbanColumns((prev) => {
      const sourceColumn = prev.find((col) => col.id === sourceColumnId);
      const destinationColumn = prev.find(
        (col) => col.id === destinationColumnId
      );

      if (!sourceColumn || !destinationColumn) return prev;

      const card = sourceColumn.cards.find((c) => c.id === cardId);
      if (!card) return prev;

      return prev.map((col) => {
        if (col.id === sourceColumnId) {
          return {
            ...col,
            cards: col.cards.filter((c) => c.id !== cardId),
          };
        }
        if (col.id === destinationColumnId) {
          return {
            ...col,
            cards: [...col.cards, card],
          };
        }
        return col;
      });
    });
  };

  const handleCardDelete = (cardId: string, columnId: ColumnId) => {
    setKanbanColumns((prev) =>
      prev.map((col) =>
        col.id === columnId
          ? { ...col, cards: col.cards.filter((c) => c.id !== cardId) }
          : col
      )
    );
  };

  const handleAddColumn = (columnData: {
    title: string;
    icon: React.ReactNode;
    color: string;
  }) => {
    // Gerar um ID único para a nova coluna
    const newId = `column-${Date.now()}` as ColumnId;

    setKanbanColumns((prev) => [
      ...prev,
      {
        id: newId,
        title: columnData.title,
        icon: columnData.icon,
        color: columnData.color,
        cards: [],
      },
    ]);
  };

  return (
    <Box
      sx={{
        backgroundColor: theme.palette.background.default,
        px: { xs: 0, sm: 2 },
        position: "relative",
        overflow: { xs: "hidden", sm: "visible" },
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      <Box
        sx={{
          width: "100%",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        {/* ButtonsBar - escondido no mobile, visível no desktop */}
        <Box sx={{ display: { xs: "none", sm: "block" } }}>
          <ButtonsBar
            onAddCapture={handleAddCapture}
            onSearchResidents={handleSearchResidents}
            onSearchChange={handleSearchChange}
            onViewModeChange={handleViewModeChange}
            searchValue={searchValue}
            viewMode={viewMode}
          />
        </Box>

        {/* Conteúdo principal */}
        <Box
          sx={{
            flex: 1,
            width: "100%",
            minHeight: 0,
            backgroundColor: theme.palette.background.default,
            overflow: viewMode === "list" ? "hidden" : "hidden",
            display: "flex",
            flexDirection: "column",
            pb: { xs: 8, sm: 0 }, // Adicionar padding bottom no mobile para os botões não cobrirem o conteúdo
          }}
        >
          {viewMode === "grid" ? (
            <Kanban
              columns={kanbanColumns}
              onCardMove={handleCardMove}
              onCardDelete={handleCardDelete}
              onCardClick={handleCardClick}
              onAddColumn={handleAddColumn}
            />
          ) : (
            <ListView
              columns={kanbanColumns}
              onCardClick={handleCardClick}
              onCardDelete={handleCardDelete}
            />
          )}
        </Box>

        {/* Botões no mobile - aparecem depois do kanban */}
        <Box
          sx={{
            display: { xs: "flex", sm: "none" },
            flexDirection: "row",
            gap: 1,
            p: 1.5,
            mb: "60px",
            borderTop: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.background.paper,
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 1000,
            boxShadow: "0 -2px 8px rgba(0, 0, 0, 0.1)",
          }}
        >
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleAddCapture}
            sx={{
              flex: 1,
              backgroundColor: theme.palette.primary.main,
              borderRadius: 2,
              py: 1,
              px: 2,
              textTransform: "none",
              fontWeight: 600,
              fontSize: "0.875rem",
              "&:hover": {
                backgroundColor: theme.palette.primary.dark,
              },
            }}
          >
            Adicionar captação
          </Button>

          <Button
            variant="contained"
            startIcon={<SearchIcon />}
            onClick={handleSearchResidents}
            sx={{
              flex: 1,
              backgroundColor: theme.palette.primary.main,
              borderRadius: 2,
              py: 1,
              px: 2,
              textTransform: "none",
              fontWeight: 600,
              fontSize: "0.875rem",
              "&:hover": {
                backgroundColor: theme.palette.primary.dark,
              },
            }}
          >
            Pesquisar moradores
          </Button>
        </Box>
      </Box>

      {/* Modal de seleção de tipo de captação */}
      <SourcingTypeModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelectProperty={handleSelectProperty}
        onSelectContact={handleSelectContact}
      />

      {/* Modal de captação de imóvel */}
      <PropertySourcingModal
        open={isPropertyModalOpen}
        onClose={() => setIsPropertyModalOpen(false)}
        onSave={handleSaveProperty}
      />

      {/* Modal de captação de contato */}
      <ContactSourcingModal
        open={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        onSave={handleSaveContact}
      />

      {/* Modal de detalhes de captação de imóvel */}
      {propertyData && (
        <PropertySourcingDetails
          open={isPropertyDetailsOpen}
          onClose={() => {
            setIsPropertyDetailsOpen(false);
            setAcquisitionProcessId(undefined);
            setAcquisitionStatus(undefined);
          }}
          data={propertyData}
          acquisitionProcessId={acquisitionProcessId}
          acquisitionStatus={acquisitionStatus}
          onReject={() => {
            console.log("Captação de imóvel recusada");
            setIsPropertyDetailsOpen(false);
            setAcquisitionProcessId(undefined);
            setAcquisitionStatus(undefined);
            // TODO: Implementar lógica de recusar
          }}
          onCapture={() => {
            console.log("Captação de imóvel confirmada");
            setIsPropertyDetailsOpen(false);
            setAcquisitionProcessId(undefined);
            setAcquisitionStatus(undefined);
            // TODO: Implementar lógica de captar
          }}
          onTitleChange={(title) => {
            setPropertyData({ ...propertyData, title });
          }}
        />
      )}

      {/* Modal de detalhes de captação de contato */}
      {contactData && (
        <ContactSourcingDetails
          open={isContactDetailsOpen}
          onClose={() => {
            setIsContactDetailsOpen(false);
            setAcquisitionProcessId(undefined);
            setAcquisitionStatus(undefined);
          }}
          data={contactData}
          acquisitionProcessId={acquisitionProcessId}
          onReject={() => {
            console.log("Captação de contato recusada");
            setIsContactDetailsOpen(false);
            setAcquisitionProcessId(undefined);
            setAcquisitionStatus(undefined);
            // TODO: Implementar lógica de recusar
          }}
          onCapture={() => {
            console.log("Captação de contato confirmada");
            setIsContactDetailsOpen(false);
            setAcquisitionProcessId(undefined);
            setAcquisitionStatus(undefined);
            // TODO: Implementar lógica de captar
          }}
          onTitleChange={(title) => {
            setContactData({ ...contactData, title });
          }}
        />
      )}

      {/* Modal de pesquisa de moradores */}
      <ResidentSearchModal
        open={isResidentSearchModalOpen}
        onClose={() => setIsResidentSearchModalOpen(false)}
        onSearchComplete={handleResidentSearch}
      />

      {/* Modal de resultados de pesquisa de moradores */}
      <SearchResidentResultModal
        open={isResidentResultModalOpen}
        onClose={() => setIsResidentResultModalOpen(false)}
        onBack={handleBackToSearch}
        results={residentSearchResults}
        onCreateCapture={handleCreateCapture}
        onReveal={handleReveal}
      />
    </Box>
  );
}
