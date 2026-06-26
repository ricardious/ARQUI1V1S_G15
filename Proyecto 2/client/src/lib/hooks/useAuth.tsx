"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { ENV } from "@/lib/constants/env";

type AuthStatus = "loading" | "authed" | "guest";

interface AuthContextValue {
  status: AuthStatus;
  /** Valida credenciales (demo, lado cliente). Devuelve true si coinciden. */
  login: (user: string, password: string) => boolean;
  logout: () => void;
}

const STORAGE_KEY = "arqui1.g15.auth";

const AuthContext = createContext<AuthContextValue | null>(null);

/** Provider de sesión demo: valida contra ENV y persiste en localStorage. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");

  // Hidratar desde localStorage al montar (en SSR arranca en "loading").
  useEffect(() => {
    try {
      setStatus(localStorage.getItem(STORAGE_KEY) === "1" ? "authed" : "guest");
    } catch {
      setStatus("guest");
    }
  }, []);

  const login = useCallback((user: string, password: string) => {
    const ok = user === ENV.AUTH_USER && password === ENV.AUTH_PASSWORD;
    if (ok) {
      try {
        localStorage.setItem(STORAGE_KEY, "1");
      } catch {
        /* almacenamiento no disponible: la sesión durará solo esta vista */
      }
      setStatus("authed");
    }
    return ok;
  }, []);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* noop */
    }
    setStatus("guest");
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ status, login, logout }),
    [status, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}

/** Gate del dashboard: redirige a /login si no hay sesión activa. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "guest") router.replace("/login");
  }, [status, router]);

  if (status === "authed") return <>{children}</>;

  // "loading" o "guest" (mientras redirige): loader mínimo, sin flash del panel.
  return (
    <div className="grid min-h-screen place-items-center bg-ink">
      <div className="flex items-center gap-2.5 text-dim2">
        <span className="size-2 rounded-full bg-ok pulse" />
        <span className="font-mono text-[12px]">Cargando…</span>
      </div>
    </div>
  );
}
