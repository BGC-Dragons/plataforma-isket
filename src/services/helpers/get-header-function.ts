import type { AxiosRequestConfig } from "axios";

export function getHeader({
  token,
  ...override
}: { token?: string } & Record<
  string,
  string
> = {}): AxiosRequestConfig["headers"] {
  return {
    "Content-Type": "application/json",
    ...override,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}
