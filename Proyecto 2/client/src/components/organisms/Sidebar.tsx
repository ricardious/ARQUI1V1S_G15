"use client";

import { useEffect, useState } from "react";
import Object3D from "../atoms/Object3D";
import StatusDot from "../atoms/StatusDot";
import NavItem from "../molecules/NavItem";
import { NAV_ITEMS } from "@/lib/constants/dashboard-data";
import { useMqttDashboard } from "@/lib/hooks/useMqttDashboard";
import { ENV } from "@/lib/constants/env";

/** Organism: barra lateral de navegación con scroll-spy. */
export default function Sidebar({
  open = false,
  onClose,
}: {
  open?: boolean;
  onClose?: () => void;
}) {
  const [activeId, setActiveId] = useState<string>("dashboard");
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const { connectionState, raspberryOnline } = useMqttDashboard();
  const mqttOnline = connectionState === "connected";

  // Bloquear scroll del body y cerrar con Escape mientras el drawer está abierto.
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        });
      },
      { rootMargin: "0px 0px -80% 0px" },
    );

    NAV_ITEMS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;

    const checkBackend = async () => {
      try {
        const res = await fetch(`${ENV.API_URL}/api/health`, {
          cache: "no-store",
        });
        if (!cancelled) setBackendOnline(res.ok);
      } catch {
        if (!cancelled) setBackendOnline(false);
      }
    };

    checkBackend();
    const id = window.setInterval(checkBackend, 15_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  return (
    <>
      {/* Backdrop (solo móvil) */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col gap-8 border-r border-edge bg-ink px-5 py-6 transition-transform duration-300 ease-out lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:translate-x-0 lg:bg-transparent ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center gap-3 px-1">
          <div className="h-10 w-10 rounded-xl border border-edge bg-panel">
            <Object3D shape="ico" color="#ffffff" className="h-full w-full" />
          </div>
          <div className="leading-tight">
            <p className="font-display font-bold text-[15px] tracking-tight">
              Invernadero ARM64
            </p>
            <p className="text-[10px] text-dim2 tracking-[.2em] uppercase">
              Grupo&nbsp;15
            </p>
          </div>
          {/* Cerrar (solo móvil) */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar menú de navegación"
            className="ml-auto grid size-8 place-items-center rounded-lg border border-edge bg-panel text-dim hover:text-white lg:hidden"
          >
            <svg
              viewBox="0 0 24 24"
              className="size-4"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M6 6l12 12M18 6 6 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <nav className="flex flex-col gap-1 text-[13px]">
          <p className="px-3 pb-2 text-[10px] uppercase tracking-[.2em] text-dim2">
            Panel
          </p>
          {NAV_ITEMS.map((it) => (
            <NavItem
              key={it.label}
              label={it.label}
              href={`#${it.id}`}
              active={activeId === it.id}
              onClick={onClose}
            />
          ))}
        </nav>

        <div className="mt-auto rounded-2xl border border-edge bg-panel p-4">
          <div className="flex items-center gap-2 mb-2">
            <StatusDot
              color={raspberryOnline ? "#00ff6a" : "#5a5a62"}
              pulse={raspberryOnline}
            />
            <p className="text-[11px] text-dim">
              Raspberry Pi 4 ·{" "}
              {raspberryOnline ? "en línea" : "sin datos recientes"}
            </p>
          </div>
          <p className="font-mono text-[11px] text-dim2 leading-relaxed">
            MQTT · {mqttOnline ? "activo" : connectionState}
            <br />
            Backend ·{" "}
            {backendOnline == null
              ? "verificando"
              : backendOnline
                ? "en línea"
                : "desconectado"}
          </p>
        </div>
      </aside>
    </>
  );
}
