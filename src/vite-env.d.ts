interface ImportMetaEnv {
  readonly VITE_API_ENV: "local" | "dev" | "prod";
  readonly VITE_NODE_ENV: "development" | "production";
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module "*.svg" {
  const content: string;
  export default content;
}
