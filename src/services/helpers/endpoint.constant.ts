import {
  type IApiEnv,
  environmental,
} from "../../scripts/config/environmental.constant";

const configEndpoints: Record<
  IApiEnv,
  {
    api: string;
  }
> = {
  local: {
    api: "http://localhost:80",
  },
  dev: {
    api: "https://api-staging.isket.com.br",
  },
  prod: {
    api: "https://api.isket.com.br/auth/login",
  },
};

export const endpoints = configEndpoints[environmental.API_ENV];
