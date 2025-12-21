import { useState, useMemo } from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  InputAdornment,
  IconButton,
  useTheme,
  List,
  ListItem,
  ListItemText,
  Divider,
} from "@mui/material";
import { Search, ViewModule, ViewList, EmojiEvents } from "@mui/icons-material";
import type { IAgencyRankingItem } from "../../../../services/post-analytics-agency-ranking.service";

interface AgencyRankingTableProps {
  data: IAgencyRankingItem[];
  neighborhoods: string[]; // Bairros selecionados
}

type ViewMode = "table" | "list";

export function AgencyRankingTable({
  data,
  neighborhoods,
}: AgencyRankingTableProps) {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  // Filtrar e ordenar dados
  const filteredAndSortedData = useMemo(() => {
    let filtered = data;

    // Filtrar por busca
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (agency) =>
          agency.agencyName.toLowerCase().includes(query) ||
          agency.agencyId.toLowerCase().includes(query)
      );
    }

    // Ordenar por total geral (maior para menor)
    return [...filtered].sort((a, b) => b.totalGeral - a.totalGeral);
  }, [data, searchQuery]);

  // Obter todos os bairros únicos dos dados
  const allNeighborhoods = useMemo(() => {
    const neighborhoodSet = new Set<string>();
    data.forEach((agency) => {
      agency.neighborhoods.forEach((n) => {
        neighborhoodSet.add(n.neighborhood);
      });
    });
    return Array.from(neighborhoodSet).sort();
  }, [data]);

  // Usar bairros selecionados ou todos os bairros disponíveis
  const displayNeighborhoods =
    neighborhoods.length > 0 ? neighborhoods : allNeighborhoods;

  if (!data || data.length === 0) {
    return (
      <Box sx={{ py: 4, textAlign: "center" }}>
        <Typography variant="body2" color="text.secondary">
          Sem dados para exibir
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Barra de busca e visualização */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          mb: 3,
        }}
      >
        <TextField
          placeholder="Buscar"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          size="small"
          sx={{ flex: 1 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: theme.palette.text.secondary }} />
              </InputAdornment>
            ),
          }}
        />
        <Box sx={{ display: "flex", gap: 1 }}>
          <IconButton
            size="small"
            onClick={() => setViewMode("table")}
            sx={{
              backgroundColor:
                viewMode === "table"
                  ? theme.palette.primary.main
                  : "transparent",
              color:
                viewMode === "table"
                  ? theme.palette.primary.contrastText
                  : theme.palette.text.secondary,
            }}
          >
            <ViewModule />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => setViewMode("list")}
            sx={{
              backgroundColor:
                viewMode === "list"
                  ? theme.palette.primary.main
                  : "transparent",
              color:
                viewMode === "list"
                  ? theme.palette.primary.contrastText
                  : theme.palette.text.secondary,
            }}
          >
            <ViewList />
          </IconButton>
        </Box>
      </Box>

      {/* Conteúdo: Tabela ou Lista */}
      {viewMode === "table" ? (
        <TableContainer component={Paper} elevation={0} sx={{ border: 1, borderColor: "divider" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Imobiliária</TableCell>
                {displayNeighborhoods.map((neighborhood) => (
                  <TableCell key={neighborhood} align="center" sx={{ fontWeight: 600 }}>
                    {neighborhood}
                  </TableCell>
                ))}
                <TableCell align="center" sx={{ fontWeight: 600 }}>
                  Todos
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredAndSortedData.map((agency, index) => (
                <TableRow key={agency.agencyId}>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      {index === 0 && (
                        <EmojiEvents
                          sx={{ color: "#FFD700", fontSize: 20 }}
                        />
                      )}
                      <Typography variant="body2" sx={{ fontWeight: index === 0 ? 600 : 400 }}>
                        {index + 1}. {agency.agencyName}
                      </Typography>
                    </Box>
                  </TableCell>
                  {displayNeighborhoods.map((neighborhood) => {
                    const neighborhoodData = agency.neighborhoods.find(
                      (n) => n.neighborhood === neighborhood
                    );
                    return (
                      <TableCell key={neighborhood} align="center">
                        <Box>
                          <Typography variant="body2">
                            Venda: {neighborhoodData?.venda || 0}
                          </Typography>
                          <Typography variant="body2">
                            Aluguel: {neighborhoodData?.aluguel || 0}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: 600, mt: 0.5 }}
                          >
                            Total: {neighborhoodData?.total || 0}
                          </Typography>
                        </Box>
                      </TableCell>
                    );
                  })}
                  <TableCell align="center">
                    <Box>
                      <Typography variant="body2">
                        Venda: {agency.totalVenda}
                      </Typography>
                      <Typography variant="body2">
                        Aluguel: {agency.totalAluguel}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 600, mt: 0.5 }}
                      >
                        Total: {agency.totalGeral}
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {filteredAndSortedData.map((agency, index) => (
            <Paper
              key={agency.agencyId}
              elevation={1}
              sx={{ p: 2, border: 1, borderColor: "divider" }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                {index === 0 && (
                  <EmojiEvents sx={{ color: "#FFD700", fontSize: 24 }} />
                )}
                <Typography variant="h6" sx={{ fontWeight: index === 0 ? 600 : 500 }}>
                  {index + 1}. {agency.agencyName}
                </Typography>
              </Box>
              <List dense>
                {displayNeighborhoods.map((neighborhood, idx) => {
                  const neighborhoodData = agency.neighborhoods.find(
                    (n) => n.neighborhood === neighborhood
                  );
                  if (!neighborhoodData) return null;
                  return (
                    <Box key={neighborhood}>
                      {idx > 0 && <Divider sx={{ my: 1 }} />}
                      <ListItem sx={{ px: 0 }}>
                        <ListItemText
                          primary={neighborhood}
                          secondary={
                            <Box>
                              <Typography variant="body2" component="span">
                                Venda: {neighborhoodData.venda} | Aluguel:{" "}
                                {neighborhoodData.aluguel}
                              </Typography>
                              <Typography
                                variant="body2"
                                component="span"
                                sx={{ fontWeight: 600, display: "block", mt: 0.5 }}
                              >
                                Total: {neighborhoodData.total}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                    </Box>
                  );
                })}
                <Divider sx={{ my: 1 }} />
                <ListItem sx={{ px: 0 }}>
                  <ListItemText
                    primary="Todos"
                    secondary={
                      <Box>
                        <Typography variant="body2" component="span">
                          Venda: {agency.totalVenda} | Aluguel:{" "}
                          {agency.totalAluguel}
                        </Typography>
                        <Typography
                          variant="body2"
                          component="span"
                          sx={{ fontWeight: 600, display: "block", mt: 0.5 }}
                        >
                          Total: {agency.totalGeral}
                        </Typography>
                        {agency.totalStockValue && (
                          <Typography
                            variant="caption"
                            sx={{ display: "block", mt: 0.5, color: "text.secondary" }}
                          >
                            Valor de venda total de estoque: R${" "}
                            {agency.totalStockValue.toLocaleString("pt-BR", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              </List>
            </Paper>
          ))}
        </Box>
      )}
    </Box>
  );
}

