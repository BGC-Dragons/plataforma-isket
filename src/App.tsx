import { Button, Container, Typography } from "@mui/material";

export function App() {
  return (
    <Container sx={{ padding: 4 }}>
      <Typography variant="h4" gutterBottom>
        Hello World com MUI e React Router 7
      </Typography>
      <Button variant="contained" color="primary">
        Botão MUI
      </Button>
    </Container>
  );
}
