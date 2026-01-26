export const GOOGLE_CONFIG = {
  CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID || "",
  MAPS_API_KEY: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
} as const;
