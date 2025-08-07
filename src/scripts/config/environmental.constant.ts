export type IApiEnv = "local" | "dev" | "prod";
export type INodeEnv = "development" | "production";

export const environmental = {
  API_ENV: import.meta.env.VITE_API_ENV as IApiEnv,
  NODE_ENV: import.meta.env.VITE_NODE_ENV as INodeEnv,
};
