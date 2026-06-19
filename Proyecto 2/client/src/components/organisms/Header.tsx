"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";

const SEARCH_ITEMS = [
  { label: "Dashboard", detail: "Estado global, temperatura, invernadero 3D", target: "dashboard" },
  { label: "Estado global", detail: "Estado global del sistema", target: "dashboard" },
  { label: "Gráficas históricas", detail: "Temperatura, humedad, suelo, luz y gas", target: "dashboard" },
  { label: "Temperatura", detail: "Gráfica histórica y lectura actual", target: "dashboard" },
  { label: "Humedad ambiental", detail: "Sensor DHT22", target: "sensores" },
  { label: "Áreas de cultivo", detail: "Zona 1, Zona 2, humedad de suelo", target: "areas" },
  { label: "Humedad suelo Área 1", detail: "Zona 1", target: "areas" },
  { label: "Humedad suelo Área 2", detail: "Zona 2", target: "areas" },
  { label: "Sensores", detail: "Temperatura, humedad, luz, gas, suelo", target: "sensores" },
  { label: "Luz", detail: "Sensor LDR", target: "sensores" },
  { label: "Gas", detail: "Sensor MQ-2", target: "sensores" },
  { label: "Actuadores", detail: "Riego, ventilación, luces, alarma", target: "actuadores" },
  { label: "Riego", detail: "Control remoto y selección de área", target: "actuadores" },
  { label: "Ventilación", detail: "Control del ventilador", target: "actuadores" },
  { label: "Iluminación", detail: "Control de luces", target: "actuadores" },
  { label: "Alarma / Buzzer", detail: "Silenciar alarma", target: "actuadores" },
  { label: "Historial", detail: "Eventos, comandos y actuadores", target: "historial" },
  { label: "Eventos", detail: "Actividad reciente", target: "historial" },
  { label: "Comandos", detail: "Comandos publicados", target: "historial" },
  { label: "Análisis ARM64", detail: "Media, varianza, anomalías, predicción, tendencia", target: "arm64" },
  { label: "ARM64", detail: "Resultados de ensamblador", target: "arm64" },
];

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/** Organism: cabecera superior. */
export default function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const router = useRouter();
  const { logout } = useAuth();
  const searchRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);

  const results = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return SEARCH_ITEMS.slice(0, 6);
    return SEARCH_ITEMS.filter((item) =>
      normalize(`${item.label} ${item.detail}`).includes(q),
    ).slice(0, 8);
  }, [query]);

  const goTo = (target: string) => {
    document.getElementById(target)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setQuery("");
    setFocused(false);
  };

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (!searchRef.current?.contains(target)) setFocused(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  return (
    <header className="sticky top-0 z-40 flex items-center gap-4 px-5 sm:px-8 py-4 border-b border-edge bg-ink/80 backdrop-blur-xl">
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Abrir menú de navegación"
        className="-ml-1 grid size-9 shrink-0 place-items-center rounded-xl border border-edge bg-panel text-dim hover:text-white lg:hidden"
      >
        <svg viewBox="0 0 24 24" className="size-5" fill="none" aria-hidden="true">
          <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
      <div className="min-w-0">
        <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight">
          Invernadero Inteligente
        </h1>
        <p className="text-[12px] text-dim2">
          Monitoreo y control en tiempo real
        </p>
      </div>
      <div ref={searchRef} className="relative ml-auto hidden md:block w-80">
        <div className="flex items-center gap-2 rounded-xl border border-edge bg-panel px-3 py-2">
          <svg
            className="size-3.25 shrink-0 text-dim2"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="m21 21-4.35-4.35m2.35-5.15a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onFocus={() => setFocused(true)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && results[0]) goTo(results[0].target);
              if (event.key === "Escape") setFocused(false);
            }}
            className="bg-transparent text-[13px] placeholder:text-dim2 outline-none w-full"
            placeholder="Buscar sección, sensor, control..."
          />
        </div>
        {focused && (
          <div className="absolute left-0 right-0 top-full mt-2 overflow-hidden rounded-xl border border-edge bg-panel shadow-2xl">
            {results.length === 0 ? (
              <p className="px-3 py-3 text-[12px] text-dim2">Sin coincidencias</p>
            ) : (
              results.map((item) => (
                <button
                  key={`${item.label}-${item.target}`}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => goTo(item.target)}
                  className="block w-full border-b border-edge px-3 py-2.5 text-left last:border-b-0 hover:bg-white/5"
                >
                  <span className="block text-[13px] font-medium text-white">{item.label}</span>
                  <span className="block text-[11px] text-dim2">{item.detail}</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2.5 pl-1">
        <div className="h-9 w-9 rounded-xl bg-white text-ink grid place-items-center font-display font-bold text-sm">
          G
        </div>
        <div className="hidden sm:block leading-tight">
          <p className="text-[12px] font-semibold">Grupo 15</p>
          <p className="text-[10px] text-dim2">ARQUI1V1S</p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => {
          logout();
          router.replace("/login");
        }}
        aria-label="Cerrar sesión"
        className="flex shrink-0 items-center gap-1.5 rounded-xl border border-edge bg-panel px-2.5 py-2 text-dim transition hover:text-white"
      >
        <svg viewBox="0 0 24 24" className="size-4" fill="none" aria-hidden="true">
          <path
            d="M15 12H3m0 0 4-4m-4 4 4 4M13 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="hidden text-[12px] sm:inline">Salir</span>
      </button>
    </header>
  );
}
