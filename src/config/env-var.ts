export const ENV_VAR: {smartlookApiKey?: string | undefined} = {
  smartlookApiKey: import.meta.env.VITE_SMARTLOOK_API_KEY,
} as const;