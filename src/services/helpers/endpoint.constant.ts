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
    api: "http://localhost:1443",
  },
  dev: {
    api: "https://api-plataforma-distribuicao-dev.captal.tech",
  },
  prod: {
    api: "https://api-plataforma-distribuicao-prod.captal.tech",
  },
};

export const endpoints = configEndpoints[environmental.API_ENV];
