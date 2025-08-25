import React from "react";
import ReactDOM from "react-dom/client";
import { setupAxiosInterceptors } from "./services/helpers/axios-interceptor.function";
import { App } from "./App";

// Configurar interceptors do Axios
setupAxiosInterceptors();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
