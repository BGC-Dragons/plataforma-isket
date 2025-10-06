export const validatePassword = (password: string): string[] => {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("Mínimo 8 caracteres");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Pelo menos 1 letra minúscula");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Pelo menos 1 letra maiúscula");
  }
  if (!/\d/.test(password)) {
    errors.push("Pelo menos 1 número");
  }
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    errors.push("Pelo menos 1 caractere especial");
  }

  return errors;
};
