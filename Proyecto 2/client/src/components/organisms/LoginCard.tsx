"use client";

import { useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import Object3D from "../atoms/Object3D";
import { useAuth } from "@/lib/hooks/useAuth";

/** Entrada escalonada reutilizando el token de animación `rise`. */
const rise = (delay: number): CSSProperties => ({
  opacity: 0,
  transform: "translateY(14px)",
  animationDelay: `${delay}ms`,
});

/** Organism: tarjeta de acceso. Validación demo en cliente vía useAuth(). */
export default function LoginCard() {
  const { login } = useAuth();
  const router = useRouter();

  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError(false);
    if (login(user.trim(), password)) {
      router.replace("/");
    } else {
      setError(true);
      setSubmitting(false);
    }
  };

  const field =
    "group flex items-center gap-2.5 rounded-xl border border-edge bg-ink/60 px-3.5 py-3 transition focus-within:border-ok/60 focus-within:bg-ink";
  const input =
    "w-full bg-transparent text-[14px] text-white outline-none placeholder:text-dim2";
  const iconCls = "size-4 shrink-0 text-dim2 transition group-focus-within:text-ok";

  return (
    <div className="animate-rise relative z-10 w-full max-w-100" style={rise(0)}>
      <div className="rounded-3xl border border-white/10 bg-panel/60 shadow-[0_30px_90px_-30px_rgba(0,0,0,0.95)] backdrop-blur-2xl">
        <form
          onSubmit={onSubmit}
          className="relative overflow-hidden rounded-3xl bg-ink/60 p-7"
        >
          {/* Marca */}
          <div className="animate-rise flex items-center gap-3" style={rise(80)}>
            <div className="h-12 w-12 rounded-2xl border border-edge bg-ink">
              <Object3D shape="ico" color="#ffffff" className="h-full w-full" />
            </div>
            <div>
              <p className="font-display text-[18px] font-bold leading-none tracking-tight">
                GreenPi
              </p>
              <div className="mt-1.5 flex items-center gap-1.5">
                <span className="pulse size-1.5 rounded-full bg-ok" />
                <span className="font-mono text-[10px] uppercase tracking-[.18em] text-dim2">
                  Sistema en línea · Grupo&nbsp;15
                </span>
              </div>
            </div>
          </div>

          {/* Encabezado */}
          <div className="animate-rise mt-6" style={rise(140)}>
            <p className="font-mono text-[11px] uppercase tracking-[.3em] text-ok/80">
              Acceso al panel
            </p>
            <h1 className="mt-1.5 font-display text-[28px] font-bold leading-tight">
              Iniciar sesión
            </h1>
            <p className="mt-1 text-[13px] text-dim">
              Ingresa para monitorear el invernadero en tiempo real.
            </p>
          </div>

          {/* Usuario */}
          <label className="animate-rise mt-6 block" style={rise(200)}>
            <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[.18em] text-dim2">
              Usuario
            </span>
            <div className={field}>
              <svg viewBox="0 0 24 24" className={iconCls} fill="none" aria-hidden="true">
                <circle cx="12" cy="8" r="3.2" stroke="currentColor" strokeWidth="2" />
                <path
                  d="M5 20a7 7 0 0 1 14 0"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              <input
                value={user}
                onChange={(e) => {
                  setUser(e.target.value);
                  setError(false);
                }}
                autoComplete="username"
                placeholder="admin"
                className={input}
              />
            </div>
          </label>

          {/* Contraseña */}
          <label className="animate-rise mt-3 block" style={rise(250)}>
            <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[.18em] text-dim2">
              Contraseña
            </span>
            <div className={field}>
              <svg viewBox="0 0 24 24" className={iconCls} fill="none" aria-hidden="true">
                <rect x="4" y="10" width="16" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
                <path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <input
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(false);
                }}
                type={show ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                className={input}
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
                className="shrink-0 text-dim2 transition hover:text-white"
              >
                {show ? (
                  <svg viewBox="0 0 24 24" className="size-4" fill="none" aria-hidden="true">
                    <path
                      d="M3 3l18 18M10.6 10.6a3 3 0 0 0 4.2 4.2M9.9 5.2A9.6 9.6 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.1 3.9M6.1 6.1A17 17 0 0 0 2 12s3.5 7 10 7a9.6 9.6 0 0 0 3-.5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="size-4" fill="none" aria-hidden="true">
                    <path
                      d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
                  </svg>
                )}
              </button>
            </div>
          </label>

          {error && (
            <p className="mt-3 flex items-center gap-2 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-[12px] text-danger">
              <svg viewBox="0 0 24 24" className="size-4 shrink-0" fill="none" aria-hidden="true">
                <path d="M12 8v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <circle cx="12" cy="16.5" r="1.1" fill="currentColor" />
                <path
                  d="M10.3 3.9 2.6 17.5A2 2 0 0 0 4.3 20.5h15.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
              </svg>
              Credenciales inválidas. Intenta de nuevo.
            </p>
          )}

          <button
            type="submit"
            disabled={submitting || !user || !password}
            style={rise(300)}
            className="login-submit animate-rise mt-5 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 font-display text-[14px] font-bold transition"
          >
            {submitting ? (
              "Entrando…"
            ) : (
              <>
                Entrar
                <svg
                  viewBox="0 0 24 24"
                  className="size-4"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M5 12h14m-6-6 6 6-6 6"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </>
            )}
          </button>

          <p
            className="animate-rise mt-5 border-t border-edge pt-4 text-center font-mono text-[10px] text-dim2"
            style={rise(360)}
          >
            Demo · usuario{" "}
            <span className="text-dim">admin</span> · clave{" "}
            <span className="text-dim">greenpi15</span>
          </p>
        </form>
      </div>
    </div>
  );
}
