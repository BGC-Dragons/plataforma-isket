import React from "react";
import type { IAuth } from "./auth-context.types";

export const AuthContext = React.createContext<IAuth | null>(null);
