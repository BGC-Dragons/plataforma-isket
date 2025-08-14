import { Button } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import googleLogo from "../../../assets/google.svg";

interface GoogleButtonProps {
  onClick: () => void;
  text?: string;
  fullWidth?: boolean;
  variant?: "login" | "signup";
}

export function GoogleButton({
  onClick,
  text,
  fullWidth = true,
  variant = "login",
}: GoogleButtonProps) {
  const theme = useTheme();

  const getButtonText = () => {
    if (text) return text;
    return variant === "login" ? "Entrar com Google" : "Cadastrar com Google";
  };

  return (
    <Button
      fullWidth={fullWidth}
      variant="outlined"
      onClick={onClick}
      sx={{
        mb: 3,
        py: 1.8,
        borderRadius: 3,
        borderColor: theme.palette.brand.border,
        color: theme.palette.brand.textPrimary,
        backgroundColor: theme.palette.brand.surface,
        boxShadow: theme.palette.brand.shadow,
        transition: "all 0.3s ease",
        "&:hover": {
          backgroundColor: theme.palette.brand.light,
          borderColor: theme.palette.brand.primary,
          transform: "translateY(-2px)",
          boxShadow: theme.palette.brand.shadowHover,
        },
      }}
      startIcon={<img src={googleLogo} alt="Google" width="20" height="20" />}
    >
      {getButtonText()}
    </Button>
  );
}
